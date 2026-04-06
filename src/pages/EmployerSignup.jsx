import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Building2, Mail, Lock, User, Phone, MapPin, Briefcase, Calendar, ChevronRight, ChevronLeft, AlertCircle } from 'lucide-react';

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
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <h2 className="text-3xl font-extrabold text-gray-900">Employer Registration</h2>
        <p className="mt-2 text-sm text-gray-600">Step {step} of 2</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4 flex items-center">
              <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {step === 1 ? (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Organization Name</label>
                  <div className="mt-1 relative">
                    <Building2 className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input name="organization_name" type="text" required value={formData.organization_name} onChange={handleChange} className="pl-10 block w-full border border-gray-300 rounded-md shadow-sm p-2.5 focus:ring-primary-500 focus:border-primary-500" placeholder="e.g. Vibe Studio" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Email Address</label>
                  <div className="mt-1 relative">
                    <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input name="email" type="email" required value={formData.email} onChange={handleChange} className="pl-10 block w-full border border-gray-300 rounded-md shadow-sm p-2.5 focus:ring-primary-500 focus:border-primary-500" placeholder="hr@organization.com" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Password</label>
                    <div className="mt-1 relative">
                      <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <input name="password" type="password" required value={formData.password} onChange={handleChange} className="pl-10 block w-full border border-gray-300 rounded-md shadow-sm p-2.5" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
                    <div className="mt-1 relative">
                      <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <input name="confirmPassword" type="password" required value={formData.confirmPassword} onChange={handleChange} className="pl-10 block w-full border border-gray-300 rounded-md shadow-sm p-2.5" />
                    </div>
                  </div>
                </div>

                <button type="submit" className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700">
                  Next Step <ChevronRight className="ml-2 h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Contact Person</label>
                    <div className="mt-1 relative">
                      <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <input name="contact_person" type="text" required value={formData.contact_person} onChange={handleChange} className="pl-10 block w-full border border-gray-300 rounded-md shadow-sm p-2.5" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                    <div className="mt-1 relative">
                      <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <input name="phone_number" type="tel" required value={formData.phone_number} onChange={handleChange} className="pl-10 block w-full border border-gray-300 rounded-md shadow-sm p-2.5" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">LGA (Oke-Ogun)</label>
                    <div className="mt-1 relative">
                      <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <select name="lga" value={formData.lga} onChange={handleChange} className="pl-10 block w-full border border-gray-300 rounded-md shadow-sm p-2.5">
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Business Type</label>
                    <div className="mt-1 relative">
                      <Briefcase className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <select name="business_type" value={formData.business_type} onChange={handleChange} className="pl-10 block w-full border border-gray-300 rounded-md shadow-sm p-2.5">
                        <option value="Sole Proprietorship">Sole Proprietorship</option>
                        <option value="Partnership">Partnership</option>
                        <option value="Private Limited Company">Private Limited Company</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-4">
                  <button type="button" onClick={() => setStep(1)} className="w-1/3 flex justify-center items-center py-3 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50">
                    <ChevronLeft className="mr-1 h-4 w-4" /> Back
                  </button>
                  <button type="submit" disabled={loading} className="w-2/3 py-3 border border-transparent rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 font-medium">
                    {loading ? 'Creating Account...' : 'Complete Signup'}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default EmployerSignup;
