
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Building2, Mail, Lock, User, Phone, MapPin, Briefcase, Calendar, ChevronRight, ChevronLeft, AlertCircle } from 'lucide-react';

const styles = {
  page: {
    minHeight: '100vh',
    background: '#f5f7f5',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    padding: '48px 16px',
  },
  cardWrap: {
    maxWidth: 480,
    margin: '0 auto',
    width: '100%',
    background: '#fff',
    borderRadius: 16,
    boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
    padding: '36px 28px',
  },
  title: {
    fontSize: 26,
    fontWeight: 900,
    color: '#14532d',
    margin: '0 0 8px 0',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#4b6358',
    textAlign: 'center',
    marginBottom: 24,
  },
  label: {
    display: 'block',
    fontSize: 14,
    fontWeight: 700,
    color: '#14532d',
    marginBottom: 6,
  },
  inputWrap: {
    position: 'relative',
    marginBottom: 18,
  },
  input: {
    width: '100%',
    padding: '10px 14px 10px 38px',
    border: '1px solid #c8e6d4',
    borderRadius: 8,
    fontSize: 15,
    outline: 'none',
    color: '#222',
    background: '#fff',
    boxSizing: 'border-box',
  },
  select: {
    width: '100%',
    padding: '10px 14px 10px 38px',
    border: '1px solid #c8e6d4',
    borderRadius: 8,
    fontSize: 15,
    outline: 'none',
    color: '#222',
    background: '#fff',
    boxSizing: 'border-box',
  },
  icon: {
    position: 'absolute',
    left: 10,
    top: 10,
    width: 18,
    height: 18,
    color: '#9ca3af',
  },
  btn: {
    width: '100%',
    padding: '13px 0',
    background: '#16a34a',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontWeight: 700,
    fontSize: 15,
    cursor: 'pointer',
    marginTop: 10,
    transition: 'background 0.2s',
  },
  btnSecondary: {
    width: '100%',
    padding: '13px 0',
    background: '#fff',
    color: '#14532d',
    border: '1.5px solid #c8e6d4',
    borderRadius: 8,
    fontWeight: 700,
    fontSize: 15,
    cursor: 'pointer',
    marginTop: 10,
    transition: 'background 0.2s',
  },
  error: {
    background: '#fef2f2',
    color: '#b91c1c',
    borderLeft: '4px solid #f87171',
    padding: '12px 16px',
    borderRadius: 8,
    marginBottom: 18,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 14,
  },
  flexRow: {
    display: 'flex',
    gap: 16,
    marginBottom: 0,
  },
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
