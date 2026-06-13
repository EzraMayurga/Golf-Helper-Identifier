import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Activity, Eye, EyeOff } from 'lucide-react';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email) { 
      setError('Email wajib diisi.'); 
      return; 
    }
    if (!password) {
      setError('Password wajib diisi.');
      return;
    }

    if (email.toLowerCase() === 'admin@golfai.com') {
      setError('Akun Admin wajib menggunakan panel Admin Login khusus.');
      return;
    }

    setLoading(true);
    const success = await login(email, password);
    setLoading(false);
    
    if (success) {
      navigate('/dashboard');
    } else {
      setError('Email atau password salah.');
    }
  };

  return (
    <div className="min-h-screen golf-gradient-hero flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center gap-2 justify-center mb-8">
          <div className="w-10 h-10 rounded-xl golf-gradient-gold flex items-center justify-center">
            <Activity size={22} className="text-primary-foreground" />
          </div>
          <span className="font-display text-2xl font-bold">SWING AI</span>
        </Link>

        <div className="golf-card shadow-2xl border border-white/5 bg-black/60 backdrop-blur-xl">
          <h1 className="font-display text-2xl font-bold text-center mb-1 text-white">Welcome Back</h1>
          <p className="text-sm text-muted-foreground text-center mb-6">Sign in to your account</p>

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm text-destructive mb-4 text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="golf-label block mb-1.5 text-xs uppercase tracking-wider text-muted-foreground font-semibold">Email Address</label>
              <input 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                className="golf-input w-full bg-black/40 border border-white/10 rounded-lg py-2 px-3 text-white placeholder-muted-foreground focus:outline-none focus:border-gold transition"
                placeholder="your@email.com" 
              />
            </div>
            <div>
              <label className="golf-label block mb-1.5 text-xs uppercase tracking-wider text-muted-foreground font-semibold">Password</label>
              <div className="relative">
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  className="golf-input w-full bg-black/40 border border-white/10 rounded-lg py-2 px-3 pr-10 text-white placeholder-•••••••• focus:outline-none focus:border-gold transition"
                  placeholder="••••••••" 
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)} 
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button 
              type="submit" 
              disabled={loading} 
              className="golf-btn-primary w-full disabled:opacity-50 !py-3 font-semibold mt-2"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 flex flex-col gap-2 items-center text-sm text-muted-foreground">
            <p>
              Don't have an account? <Link to="/register" className="text-gold hover:underline font-medium">Register</Link>
            </p>
            <p className="text-xs text-muted-foreground/60 mt-2">
              Are you an Administrator? <Link to="/admin-login" className="text-gold hover:underline font-medium">Admin Portal</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
