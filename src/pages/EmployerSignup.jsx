
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Building2, Mail, Lock, User, Phone, MapPin, Briefcase, Calendar, ChevronRight, ChevronLeft, AlertCircle } from 'lucide-react';

const styles = {
  page: { minHeight: '100vh', backgroundColor: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' },
  card: { backgroundColor: '#fff', borderRadius: '20px', padding: '40px 32px', width: '100%', maxWidth: '480px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1.5px solid #dcfce7' },
  icon: { fontSize: '48px', marginBottom: '16px', textAlign: 'center' },
  stepRow: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0', marginBottom: '28px' },
  stepDot: { width: '32px', height: '32px', borderRadius: '50%', border: '2px solid #dcfce7', backgroundColor: '#fff', color: '#aaa', fontSize: '13px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  stepDotActive: { borderColor: '#16a34a', backgroundColor: '#16a34a', color: '#fff' },
  stepLine: { width: '48px', height: '2px', backgroundColor: '#dcfce7' },
  title: { fontSize: '22px', fontWeight: 'bold', color: '#14532d', marginBottom: '8px', textAlign: 'center' },
  subtitle: { fontSize: '14px', color: '#666', lineHeight: '1.6', marginBottom: '24px', textAlign: 'center' },
  hint: { fontSize: '13px', color: '#aaa', marginBottom: '24px', textAlign: 'center' },
  form: { textAlign: 'left' },
  field: { marginBottom: '18px' },
  label: { display: 'block', fontSize: '14px', fontWeight: '600', color: '#166534', marginBottom: '6px' },
  input: { width: '100%', padding: '10px 12px', fontSize: '14px', border: '1.5px solid #dcfce7', borderRadius: '12px', boxSizing: 'border-box', outline: 'none', backgroundColor: '#f0fdf4' },
  error: { color: '#e53e3e', fontSize: '13px', marginBottom: '12px' },
  btn: { display: 'inline-block', padding: '13px 28px', backgroundColor: '#16a34a', color: '#fff', fontSize: '15px', fontWeight: '600', border: 'none', borderRadius: '50px', cursor: 'pointer', textDecoration: 'none', boxSizing: 'border-box', textAlign: 'center' },
  btnDisabled: { backgroundColor: '#aaa', cursor: 'not-allowed' },
  backBtn: { padding: '13px 20px', backgroundColor: '#fff', color: '#555', border: '1.5px solid #dcfce7', borderRadius: '50px', cursor: 'pointer', fontSize: '15px', fontWeight: '600' },
  footer: { fontSize: '13px', color: '#666', textAlign: 'center', marginTop: '16px' },
  link: { color: '#16a34a', fontWeight: '600', textDecoration: 'none' },
}

const EmployerSignup = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    organization_name: '',
    contact_person: '',
    phone_number: '',
    business_type: 'Sole Proprietorship',
    year_registered: new Date().getFullYear().toString(),
    lga: 'Iseyin',
    description: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // If on step 1, just move to step 2
    if (step === 1) {
      setStep(2);
      return;
    }

    // Final Submission Logic
    setLoading(true);
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      // 1. Sign up the user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            role: 'employer',
            organization_name: formData.organization_name
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        // 2. Insert into the 'employers' table
        // This uses 'auth_user_id' to match your exact DB schema
        const { error: profileError } = await supabase
          .from('employers')
          .insert([
            {
              auth_user_id: authData.user.id, 
              organization_name: formData.organization_name,
              contact_person: formData.contact_person,
              phone_number: formData.phone_number,
              business_type: formData.business_type,
              year_registered: formData.year_registered,
              lga: formData.lga,
              description: formData.description,
              status: 'pending'
            }
          ]);

        if (profileError) throw profileError;
        
        // Success - Redirect to login with instructions
        navigate('/employer/login', { 
          state: { message: 'Registration successful! Please check your email to verify your account.' } 
        });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.cardWrap}>
        <h2 style={styles.title}>Employer Registration</h2>
        <p style={styles.subtitle}>Step {step} of 2</p>

        {error && (
          <div style={styles.error}>
            <AlertCircle style={{ width: 20, height: 20 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {step === 1 ? (
            <>
              <div style={styles.inputWrap}>
                <label style={styles.label}>Organization Name</label>
                <Building2 style={styles.icon} />
                <input name="organization_name" type="text" required value={formData.organization_name} onChange={handleChange} style={styles.input} placeholder="e.g. Vibe Studio" />
              </div>
              <div style={styles.inputWrap}>
                <label style={styles.label}>Email Address</label>
                <Mail style={styles.icon} />
                <input name="email" type="email" required value={formData.email} onChange={handleChange} style={styles.input} placeholder="hr@organization.com" />
              </div>
              <div style={styles.flexRow}>
                <div style={{ flex: 1 }}>
                  <label style={styles.label}>Password</label>
                  <div style={styles.inputWrap}>
                    <Lock style={styles.icon} />
                    <input name="password" type="password" required value={formData.password} onChange={handleChange} style={styles.input} />
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={styles.label}>Confirm Password</label>
                  <div style={styles.inputWrap}>
                    <Lock style={styles.icon} />
                    <input name="confirmPassword" type="password" required value={formData.confirmPassword} onChange={handleChange} style={styles.input} />
                  </div>
                </div>
              </div>
              <button type="submit" style={styles.btn}>
                Next Step <ChevronRight style={{ marginLeft: 8, width: 18, height: 18 }} />
              </button>
            </>
          ) : (
            <>
              <div style={styles.flexRow}>
                <div style={{ flex: 1 }}>
                  <label style={styles.label}>Contact Person</label>
                  <div style={styles.inputWrap}>
                    <User style={styles.icon} />
                    <input name="contact_person" type="text" required value={formData.contact_person} onChange={handleChange} style={styles.input} />
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={styles.label}>Phone Number</label>
                  <div style={styles.inputWrap}>
                    <Phone style={styles.icon} />
                    <input name="phone_number" type="tel" required value={formData.phone_number} onChange={handleChange} style={styles.input} />
                  </div>
                </div>
              </div>
              <div style={styles.flexRow}>
                <div style={{ flex: 1 }}>
                  <label style={styles.label}>LGA (Oke-Ogun)</label>
                  <div style={styles.inputWrap}>
                    <MapPin style={styles.icon} />
                    <select name="lga" value={formData.lga} onChange={handleChange} style={styles.select}>
                      <option value="Iseyin">Iseyin</option>
                      <option value="Itesiwaju">Itesiwaju</option>
                      <option value="Iwajowa">Iwajowa</option>
                      <option value="Kajola">Kajola</option>
                      <option value="Atisbo">Atisbo</option>
                      <option value="Saki East">Saki East</option>
                      <option value="Saki West">Saki West</option>
                      <option value="Oorelope">Oorelope</option>
                      <option value="Irepo">Irepo</option>
                      <option value="Olorunsogo">Olorunsogo</option>
                    </select>
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={styles.label}>Business Type</label>
                  <div style={styles.inputWrap}>
                    <Briefcase style={styles.icon} />
                    <select name="business_type" value={formData.business_type} onChange={handleChange} style={styles.select}>
                      <option value="Sole Proprietorship">Sole Proprietorship</option>
                      <option value="Partnership">Partnership</option>
                      <option value="Private Limited Company">Private Limited Company</option>
                    </select>
                  </div>
                </div>
              </div>
              <div style={styles.flexRow}>
                <button type="button" onClick={() => setStep(1)} style={styles.btnSecondary}>
                  <ChevronLeft style={{ marginRight: 8, width: 18, height: 18 }} /> Back
                </button>
                <button type="submit" disabled={loading} style={{ ...styles.btn, opacity: loading ? 0.7 : 1 }}>
                  {loading ? 'Creating Account...' : 'Complete Signup'}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

export default EmployerSignup;
