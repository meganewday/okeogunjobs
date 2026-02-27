import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import { APP_NAME } from '../config/constants'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleLogin(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Invalid email or password. Please try again.')
      setLoading(false)
      return
    }

    navigate('/admin')
  }

  return (
    <div style={styles.page}>
      <div style={styles.box}>
        <h1 style={styles.title}>{APP_NAME}</h1>
        <p style={styles.subtitle}>Admin Portal</p>

        <form onSubmit={handleLogin} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Email Address</label>
            <input
              style={styles.input}
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@example.com"
              required
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              style={styles.input}
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          {error && <p style={styles.error}>{error}</p>}

          <button
            type="submit"
            disabled={loading}
            style={{ ...styles.btn, ...(loading ? styles.btnDisabled : {}) }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}

const styles = {
  page: { minHeight: '100vh', backgroundColor: '#f5f7f5', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' },
  box: { backgroundColor: '#fff', borderRadius: '12px', padding: '40px 32px', width: '100%', maxWidth: '400px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
  title: { fontSize: '26px', fontWeight: 'bold', color: '#1a6b3c', textAlign: 'center', marginBottom: '4px' },
  subtitle: { fontSize: '14px', color: '#888', textAlign: 'center', marginBottom: '32px' },
  form: {},
  field: { marginBottom: '20px' },
  label: { display: 'block', fontSize: '14px', fontWeight: '600', color: '#333', marginBottom: '6px' },
  input: { width: '100%', padding: '10px 12px', fontSize: '14px', border: '1px solid #ddd', borderRadius: '8px', boxSizing: 'border-box', outline: 'none' },
  error: { color: '#e53e3e', fontSize: '13px', marginBottom: '12px' },
  btn: { width: '100%', padding: '14px', backgroundColor: '#1a6b3c', color: '#fff', fontSize: '16px', fontWeight: '600', border: 'none', borderRadius: '8px', cursor: 'pointer' },
  btnDisabled: { backgroundColor: '#aaa', cursor: 'not-allowed' },
}