import { useEffect, useState, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useEmployerAuth } from '../contexts/EmployerAuthContext'
import { useInactivityTimeout, clearActivity } from '../lib/inactivity'
import { Users, Phone } from 'lucide-react'

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024)
  useEffect(() => {
    const handler = () => setIsDesktop(window.innerWidth >= 1024)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return isDesktop
}

const EMPLOYMENT_TYPES = [
  { value: 'full_time', label: 'Full Time' },
  { value: 'part_time', label: 'Part Time' },
  { value: 'contract', label: 'Contract' },
]

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'on_leave', label: 'On Leave' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'terminated', label: 'Terminated' },
]

const SALARY_PERIODS = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'daily', label: 'Daily' },
]

const STATUS_STYLES = {
  active:     { bg: '#e8f5ee', color: '#1a6b3c' },
  on_leave:   { bg: '#fff8e1', color: '#b45309' },
  suspended:  { bg: '#fef3c7', color: '#92400e' },
  terminated: { bg: '#fee2e2', color: '#b91c1c' },
}

function hasPaidHrAccess(profile) {
  if (!profile) return false
  if (profile.paid_featured_until) {
    const expiry = new Date(profile.paid_featured_until)
    return expiry > new Date()
  }
  return profile.is_paid_featured === true
}

const EMPTY_FORM = {
  full_name: '',
  role: '',
  department: '',
  employment_type: 'full_time',
  start_date: '',
  end_date: '',
  status: 'active',
  phone_number: '',
  notes: '',
  salary_amount: '',
  salary_period: 'monthly',
}

export default function EmployerEmployees() {
  const { employer, employerProfile, employerLoading, employerSignOut } = useEmployerAuth()
  const navigate = useNavigate()
  const isDesktop = useIsDesktop()
  const hasHrAccess = hasPaidHrAccess(employerProfile)

  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [expandedId, setExpandedId] = useState(null)
  const [confirmTerminate, setConfirmTerminate] = useState(null)

  const handleTimeout = useCallback(async () => {
    clearActivity('employer')
    await employerSignOut()
    navigate('/employer/login?timeout=1')
  }, [employerSignOut, navigate])

  useInactivityTimeout('employer', handleTimeout)

  useEffect(() => {
    if (!employerLoading && !employer) navigate('/employer/login')
  }, [employer, employerLoading, navigate])

  useEffect(() => {
    if (!employerProfile) return
    if (hasHrAccess) {
      fetchEmployees()
    } else {
      setEmployees([])
      setLoading(false)
    }
  }, [employerProfile, hasHrAccess])

  async function fetchEmployees() {
    setLoading(true)
    const { data } = await supabase
      .from('employees')
      .select('*')
      .eq('employer_id', employerProfile.id)
      .order('created_at', { ascending: false })
    if (data) setEmployees(data)
    setLoading(false)
  }

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  function openAddForm() {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setSaveError('')
    setShowForm(true)
  }

  function openEditForm(employee) {
    setForm({
      full_name: employee.full_name || '',
      role: employee.role || '',
      department: employee.department || '',
      employment_type: employee.employment_type || 'full_time',
      start_date: employee.start_date || '',
      end_date: employee.end_date || '',
      status: employee.status || 'active',
      phone_number: employee.phone_number || '',
      notes: employee.notes || '',
      salary_amount: employee.salary_amount || '',
      salary_period: employee.salary_period || 'monthly',
    })
    setEditingId(employee.id)
    setSaveError('')
    setShowForm(true)
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaveError('')
    if (!form.full_name.trim()) {
      setSaveError('Full name is required.')
      return
    }
    setSaving(true)
    try {
      const payload = {
        employer_id: employerProfile.id,
        full_name: form.full_name.trim(),
        role: form.role.trim() || null,
        department: form.department.trim() || null,
        employment_type: form.employment_type || null,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        status: form.status,
        phone_number: form.phone_number.trim() || null,
        notes: form.notes.trim() || null,
        salary_amount: form.salary_amount ? parseFloat(form.salary_amount) : null,
        salary_period: form.salary_amount ? form.salary_period : null,
        source: 'manual',
      }

      if (editingId) {
        const { error } = await supabase
          .from('employees')
          .update(payload)
          .eq('id', editingId)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('employees')
          .insert(payload)
        if (error) throw error
      }

      await fetchEmployees()
      setShowForm(false)
      setEditingId(null)
    } catch (err) {
      console.error(err)
      setSaveError('Could not save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  async function handleStatusChange(employeeId, newStatus) {
    const updates = { status: newStatus }
    if (newStatus === 'terminated') updates.end_date = new Date().toISOString().split('T')[0]
    const { error } = await supabase
      .from('employees')
      .update(updates)
      .eq('id', employeeId)
    if (!error) {
      setEmployees(prev => prev.map(e =>
        e.id === employeeId ? { ...e, ...updates } : e
      ))
    }
    setConfirmTerminate(null)
  }

  async function handleDelete(employeeId) {
    const { error } = await supabase
      .from('employees')
      .delete()
      .eq('id', employeeId)
    if (!error) setEmployees(prev => prev.filter(e => e.id !== employeeId))
  }

  const filtered = filterStatus === 'all'
    ? employees
    : employees.filter(e => e.status === filterStatus)

  const counts = {
    all: employees.length,
    active: employees.filter(e => e.status === 'active').length,
    on_leave: employees.filter(e => e.status === 'on_leave').length,
    suspended: employees.filter(e => e.status === 'suspended').length,
    terminated: employees.filter(e => e.status === 'terminated').length,
  }

  if (employerLoading || loading) {
    return (
      <div style={styles.centred}>
        <p style={styles.loadingText}>Loading...</p>
      </div>
    )
  }

  if (!hasHrAccess) {
    return (
      <div style={styles.page}>
        <div style={{ maxWidth: '760px', margin: '0 auto', padding: '40px 24px' }}>
          <div style={styles.paywallCard}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '18px' }}>
              <div style={styles.paywallIcon}>🔒</div>
              <div>
                <h1 style={styles.paywallTitle}>HR & Employee Management is a paid feature</h1>
                <p style={styles.paywallSubtitle}>
                  This feature is only available for paid employers. Upgrade your account to manage employees, track statuses, and keep workforce records in one place.
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <Link to="/employer/upgrade" style={styles.paywallBtnPrimary}>
                Upgrade Plan
              </Link>
              <Link to="/employer/dashboard" style={styles.paywallBtnSecondary}>
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.page}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>

        {/* BACK */}
        <Link to="/employer/dashboard" style={styles.backLink}>← Back to Dashboard</Link>

        {/* HEADER */}
        <div style={styles.pageHeader}>
          <div>
            <h1 style={styles.pageTitle}>My Team</h1>
            <p style={styles.pageSubtitle}>{employerProfile?.organization_name}</p>
          </div>
          <button onClick={openAddForm} style={styles.addBtn}>+ Add Employee</button>
        </div>

        {/* STATS */}
        <div style={styles.statsRow}>
          {[
            { label: 'Total', value: counts.all },
            { label: 'Active', value: counts.active },
            { label: 'On Leave', value: counts.on_leave },
            { label: 'Terminated', value: counts.terminated },
          ].map(s => (
            <div key={s.label} style={styles.statCard}>
              <span style={styles.statValue}>{s.value}</span>
              <span style={styles.statLabel}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* FILTER TABS */}
        <div style={styles.filterRow}>
          {[
            { key: 'all', label: 'All' },
            { key: 'active', label: 'Active' },
            { key: 'on_leave', label: 'On Leave' },
            { key: 'suspended', label: 'Suspended' },
            { key: 'terminated', label: 'Terminated' },
          ].map(f => (
            counts[f.key] > 0 || f.key === 'all' ? (
              <button
                key={f.key}
                onClick={() => setFilterStatus(f.key)}
                style={{ ...styles.filterBtn, ...(filterStatus === f.key ? styles.filterBtnActive : {}) }}
              >
                {f.label} ({counts[f.key]})
              </button>
            ) : null
          ))}
        </div>

        {/* ADD / EDIT FORM */}
        {showForm && (
          <div style={styles.formCard}>
            <h3 style={styles.formTitle}>{editingId ? 'Edit Employee' : 'Add Employee'}</h3>
            <form onSubmit={handleSave}>
              <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? '1fr 1fr' : '1fr', gap: '0 20px' }}>
                <div style={styles.field}>
                  <label style={styles.label}>Full Name *</label>
                  <input style={styles.input} name="full_name" value={form.full_name} onChange={handleChange} placeholder="e.g. Adewale Musa" />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Phone Number</label>
                  <input style={styles.input} name="phone_number" value={form.phone_number} onChange={handleChange} placeholder="e.g. 08012345678" />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Job Role / Title</label>
                  <input style={styles.input} name="role" value={form.role} onChange={handleChange} placeholder="e.g. Farm Supervisor" />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Department</label>
                  <input style={styles.input} name="department" value={form.department} onChange={handleChange} placeholder="e.g. Operations" />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Employment Type</label>
                  <select style={styles.input} name="employment_type" value={form.employment_type} onChange={handleChange}>
                    {EMPLOYMENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Status</label>
                  <select style={styles.input} name="status" value={form.status} onChange={handleChange}>
                    {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Start Date</label>
                  <input style={styles.input} type="date" name="start_date" value={form.start_date} onChange={handleChange} />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>End Date (if applicable)</label>
                  <input style={styles.input} type="date" name="end_date" value={form.end_date} onChange={handleChange} />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Salary Amount (₦)</label>
                  <input style={styles.input} type="number" name="salary_amount" value={form.salary_amount} onChange={handleChange} placeholder="e.g. 50000" min="0" />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Salary Period</label>
                  <select style={styles.input} name="salary_period" value={form.salary_period} onChange={handleChange}>
                    {SALARY_PERIODS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </div>
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Notes</label>
                <textarea
                  style={{ ...styles.input, resize: 'vertical', minHeight: '80px' }}
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  placeholder="Any additional notes about this employee..."
                />
              </div>
              {saveError && <p style={styles.error}>{saveError}</p>}
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  type="submit"
                  disabled={saving}
                  style={{ ...styles.saveBtn, ...(saving ? { backgroundColor: '#aaa', cursor: 'not-allowed' } : {}) }}
                >
                  {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Add Employee'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} style={styles.cancelBtn}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* CONFIRM TERMINATE */}
        {confirmTerminate && (
          <div style={styles.confirmBox}>
            <p style={styles.confirmText}>
              Mark <strong>{confirmTerminate.full_name}</strong> as terminated? This will set their end date to today.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => handleStatusChange(confirmTerminate.id, 'terminated')} style={styles.terminateBtn}>
                Yes, Terminate
              </button>
              <button onClick={() => setConfirmTerminate(null)} style={styles.cancelBtn}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* EMPLOYEE LIST */}
        {filtered.length === 0 ? (
          <div style={styles.emptyCard}>
            <p style={{ fontSize: '36px', margin: '0 0 12px' }}><Users size={36} /></p>
            <p style={styles.emptyTitle}>
              {employees.length === 0 ? 'No employees yet' : `No ${filterStatus} employees`}
            </p>
            <p style={styles.emptyText}>
              {employees.length === 0
                ? 'Add your first employee manually or accept an application to add them from the platform.'
                : 'Try a different filter.'}
            </p>
            {employees.length === 0 && (
              <button onClick={openAddForm} style={styles.addBtn}>+ Add Employee</button>
            )}
          </div>
        ) : (
          <div style={styles.employeeList}>
            {filtered.map(employee => {
              const isExpanded = expandedId === employee.id
              const statusStyle = STATUS_STYLES[employee.status] || STATUS_STYLES.active

              return (
                <div key={employee.id} style={styles.employeeCard}>
                  <div style={styles.cardTop}>
                    <div style={styles.cardLeft}>
                      <div style={styles.avatarRow}>
                        <div style={styles.avatar}>
                          {employee.full_name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 style={styles.employeeName}>{employee.full_name}</h3>
                          <p style={styles.employeeMeta}>
                            {employee.role || 'No role specified'}
                            {employee.department ? ` · ${employee.department}` : ''}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div style={styles.cardRight}>
                      <span style={{ ...styles.statusBadge, backgroundColor: statusStyle.bg, color: statusStyle.color }}>
                        {employee.status === 'on_leave' ? 'On Leave' : employee.status.charAt(0).toUpperCase() + employee.status.slice(1)}
                      </span>
                      {employee.source === 'platform' && (
                        <span style={styles.platformBadge}>via OkeOgunJobs</span>
                      )}
                    </div>
                  </div>

                  {/* Quick info row */}
                  <div style={styles.quickInfo}>
                    {employee.employment_type && (
                      <span style={styles.quickTag}>
                        {EMPLOYMENT_TYPES.find(t => t.value === employee.employment_type)?.label}
                      </span>
                    )}
                    {employee.start_date && (
                      <span style={styles.quickTag}>
                        Started {new Date(employee.start_date).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                      </span>
                    )}
                    {employee.salary_amount && (
                      <span style={styles.quickTag}>
                        ₦{Number(employee.salary_amount).toLocaleString()} / {employee.salary_period}
                      </span>
                    )}
                    {employee.phone_number && (
                      <span style={styles.quickTag}><Phone size={12} style={{marginRight:4}} />{employee.phone_number}</span>
                    )}
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div style={styles.expandedDetails}>
                      {employee.notes && (
                        <p style={styles.notes}>📝 {employee.notes}</p>
                      )}
                      {employee.end_date && (
                        <p style={styles.detailLine}>
                          <strong>End Date:</strong> {new Date(employee.end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      )}
                      <p style={styles.detailLine}>
                        <strong>Added:</strong> {new Date(employee.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  )}

                  {/* Card footer */}
                  <div style={styles.cardFooter}>
                    <div style={styles.footerActions}>
                      {/* Status quick actions */}
                      {employee.status === 'active' && (
                        <>
                          <button
                            onClick={() => handleStatusChange(employee.id, 'on_leave')}
                            style={styles.actionBtnSmall}
                          >
                            On Leave
                          </button>
                          <button
                            onClick={() => setConfirmTerminate(employee)}
                            style={{ ...styles.actionBtnSmall, color: '#b91c1c', borderColor: '#fecaca' }}
                          >
                            Terminate
                          </button>
                        </>
                      )}
                      {employee.status === 'on_leave' && (
                        <button
                          onClick={() => handleStatusChange(employee.id, 'active')}
                          style={{ ...styles.actionBtnSmall, color: '#1a6b3c', borderColor: '#a7f3d0' }}
                        >
                          Back to Active
                        </button>
                      )}
                      {employee.status === 'terminated' && (
                        <button
                          onClick={() => handleStatusChange(employee.id, 'active')}
                          style={{ ...styles.actionBtnSmall, color: '#1a6b3c', borderColor: '#a7f3d0' }}
                        >
                          Re-hire
                        </button>
                      )}
                    </div>
                    <div style={styles.footerRight}>
                      <button onClick={() => openEditForm(employee)} style={styles.editBtn}>Edit</button>
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : employee.id)}
                        style={styles.expandBtn}
                      >
                        {isExpanded ? 'Show less' : 'More details'}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

      </div>
    </div>
  )
}

const styles = {
  page: { minHeight: '100vh', backgroundColor: '#f5f7f5', padding: '40px 24px' },
  centred: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: '#888', fontSize: '15px' },
  backLink: { display: 'inline-block', fontSize: '14px', color: '#1a6b3c', textDecoration: 'none', fontWeight: '600', marginBottom: '20px' },
  pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' },
  pageTitle: { fontSize: 'clamp(20px, 3vw, 26px)', fontWeight: 'bold', color: '#1a6b3c', margin: 0 },
  pageSubtitle: { fontSize: '13px', color: '#888', marginTop: '2px' },
  addBtn: { padding: '10px 20px', backgroundColor: '#1a6b3c', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '14px', cursor: 'pointer' },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '12px', marginBottom: '16px' },
  statCard: { backgroundColor: '#fff', borderRadius: '10px', padding: '14px', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  statValue: { fontSize: '26px', fontWeight: 'bold', color: '#1a6b3c' },
  statLabel: { fontSize: '11px', color: '#888', marginTop: '4px' },
  filterRow: { display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' },
  filterBtn: { padding: '6px 14px', borderRadius: '20px', border: '1px solid #ddd', backgroundColor: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: '#888' },
  filterBtnActive: { backgroundColor: '#1a6b3c', color: '#fff', borderColor: '#1a6b3c' },

  // Form
  formCard: { backgroundColor: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: '20px' },
  formTitle: { fontSize: '16px', fontWeight: '700', color: '#1a6b3c', marginBottom: '20px', paddingBottom: '10px', borderBottom: '2px solid #e8f5ee' },
  field: { marginBottom: '16px' },
  label: { display: 'block', fontSize: '13px', fontWeight: '600', color: '#333', marginBottom: '6px' },
  input: { width: '100%', padding: '9px 12px', fontSize: '14px', border: '1px solid #ddd', borderRadius: '8px', boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' },
  error: { color: '#e53e3e', fontSize: '13px', marginBottom: '12px' },
  saveBtn: { padding: '10px 24px', backgroundColor: '#1a6b3c', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '14px', cursor: 'pointer' },
  cancelBtn: { padding: '10px 20px', backgroundColor: '#fff', color: '#888', border: '1px solid #ddd', borderRadius: '8px', fontWeight: '600', fontSize: '14px', cursor: 'pointer' },

  // Confirm box
  confirmBox: { backgroundColor: '#fff8e1', border: '1px solid #fde68a', borderRadius: '10px', padding: '16px', marginBottom: '16px' },
  confirmText: { fontSize: '14px', color: '#92400e', marginBottom: '12px' },
  terminateBtn: { padding: '8px 18px', backgroundColor: '#b91c1c', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '13px', cursor: 'pointer' },

  // Employee cards
  employeeList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  employeeCard: { backgroundColor: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' },
  cardLeft: { flex: 1 },
  cardRight: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' },
  avatarRow: { display: 'flex', alignItems: 'center', gap: '12px' },
  avatar: { width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#1a6b3c', color: '#fff', fontSize: '16px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  employeeName: { fontSize: '15px', fontWeight: '700', color: '#222', margin: '0 0 2px 0' },
  employeeMeta: { fontSize: '12px', color: '#888', margin: 0 },
  statusBadge: { fontSize: '12px', padding: '3px 10px', borderRadius: '10px', fontWeight: '600' },
  platformBadge: { fontSize: '11px', padding: '2px 8px', borderRadius: '10px', backgroundColor: '#e0f2fe', color: '#0369a1', fontWeight: '600' },
  quickInfo: { display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' },
  quickTag: { fontSize: '11px', padding: '3px 10px', backgroundColor: '#f3f4f6', color: '#555', borderRadius: '10px' },
  expandedDetails: { backgroundColor: '#f9f9f9', borderRadius: '8px', padding: '14px', marginBottom: '10px' },
  notes: { fontSize: '13px', color: '#555', margin: '0 0 8px', lineHeight: 1.5 },
  detailLine: { fontSize: '13px', color: '#555', margin: '4px 0' },
  cardFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid #f0f0f0', flexWrap: 'wrap', gap: '8px' },
  footerActions: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  footerRight: { display: 'flex', gap: '8px' },
  actionBtnSmall: { padding: '5px 12px', backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', color: '#555' },
  editBtn: { padding: '5px 14px', backgroundColor: '#f0fdf4', color: '#1a6b3c', border: '1px solid #bbf7d0', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' },
  expandBtn: { padding: '5px 14px', backgroundColor: 'transparent', color: '#888', border: 'none', fontSize: '12px', fontWeight: '600', cursor: 'pointer' },
  emptyCard: { backgroundColor: '#fff', borderRadius: '12px', padding: '48px 24px', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  emptyTitle: { fontSize: '16px', fontWeight: '700', color: '#222', marginBottom: '8px' },
  emptyText: { fontSize: '14px', color: '#888', marginBottom: '20px' },
  paywallCard: { backgroundColor: '#fff', borderRadius: '18px', padding: '32px', border: '1px solid #fde3c7', boxShadow: '0 2px 12px rgba(251, 191, 116, 0.16)' },
  paywallIcon: { width: '54px', height: '54px', borderRadius: '18px', backgroundColor: '#fef3c7', color: '#b45309', display: 'grid', placeItems: 'center', fontSize: '24px' },
  paywallTitle: { fontSize: '22px', fontWeight: '800', color: '#1f2937', margin: 0 },
  paywallSubtitle: { fontSize: '14px', color: '#4b5563', margin: '8px 0 0' },
  paywallBtnPrimary: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '12px 22px', borderRadius: '12px', backgroundColor: '#1a6b3c', color: '#fff', textDecoration: 'none', fontWeight: '700' },
  paywallBtnSecondary: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '12px 22px', borderRadius: '12px', backgroundColor: '#f0fdf4', color: '#166534', textDecoration: 'none', border: '1px solid #bbf7d0', fontWeight: '700' },
}
