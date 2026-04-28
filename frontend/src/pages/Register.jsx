import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Eye, EyeOff, UserPlus } from 'lucide-react';
import api from '../api/axiosClient';
import { useAuthStore } from '../stores/authStore';
import toast from 'react-hot-toast';

// Registration is 2-step: init (sends OTP) → verify (confirms OTP → returns nothing, then login)

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [step, setStep] = useState('details'); // 'details' | 'otp'
  const [otp, setOtp] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  // step 1
  const navigate = useNavigate();

  const handleInit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/register/init', form);
      toast.success('OTP sent to ' + form.email);
      setStep('otp');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  // step 2
  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // verifyAndRegister returns AuthResponse with JWT — auto-login immediately
      const res = await api.post('/auth/register/verify', { email: form.email, otp });
      setAuth(res.data.data);
      toast.success('Welcome to ShopEase!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="card p-8 shadow-2xl shadow-black/40 animate-fadeIn">
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-primary-600/20 border border-primary-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <UserPlus size={24} className="text-primary-400" />
            </div>
            <h1 className="text-2xl font-bold text-white">Create Account</h1>
            <p className="text-gray-400 text-sm mt-1">Join ShopEase today</p>
          </div>

          {step === 'details' ? (
          <form onSubmit={handleInit} className="space-y-4">
            <div>
              <label className="text-sm text-gray-400 mb-1.5 block">Full Name</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text" required className="input pl-9"
                  placeholder="John Doe"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-1.5 block">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="email" required className="input pl-9"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-1.5 block">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type={showPass ? 'text' : 'password'} required className="input pl-9 pr-10"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p className="text-xs text-gray-600 mt-1">Minimum 6 characters</p>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? 'Sending OTP…' : 'Continue'}
            </button>
          </form>
          ) : (
          <form onSubmit={handleVerify} className="space-y-4">
            <p className="text-sm text-gray-400 text-center">
              Enter the 6-digit OTP sent to <span className="text-primary-400">{form.email}</span>
            </p>
            <input
              type="text" maxLength={6} required className="input text-center text-2xl tracking-widest"
              placeholder="000000"
              value={otp}
              onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
            />
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Verifying…' : 'Create Account'}
            </button>
            <button type="button" onClick={() => setStep('details')}
              className="w-full text-sm text-gray-500 hover:text-gray-300 transition-colors">
              ← Back
            </button>
          </form>
          )}

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
