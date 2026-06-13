import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Shield, Eye, EyeOff, ArrowLeft } from 'lucide-react';

const AdminLoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { adminLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Email Admin wajib diisi.');
      return;
    }
    if (!password) {
      setError('Password Admin wajib diisi.');
      return;
    }

    setLoading(true);
    const success = await adminLogin(email, password);
    setLoading(false);

    if (success) {
      navigate('/admin');
    } else {
      setError('Kredensial Admin tidak valid atau server offline.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-zinc-950 to-black">
      <div className="w-full max-w-md">
        {/* Back link */}
        <Link to="/login" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-white transition mb-6">
          <ArrowLeft size={16} /> Kembali ke Halaman Login Utama
        </Link>

        <div className="flex items-center gap-3 justify-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center shadow-lg shadow-yellow-500/10">
            <Shield size={24} className="text-black" />
          </div>
          <div className="text-left">
            <span className="font-display text-2xl font-bold tracking-tight block text-white">SWING AI</span>
            <span className="text-xs uppercase tracking-wider text-amber-400 font-semibold">ADMIN PORTAL</span>
          </div>
        </div>

        <div className="golf-card shadow-2xl border border-amber-500/20 bg-black/60 backdrop-blur-xl relative overflow-hidden">
          {/* Subtle gold line on top */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-500 to-transparent" />

          <h1 className="font-display text-2xl font-bold text-center mb-1 text-white">Admin Authentication</h1>
          <p className="text-sm text-amber-500/80 text-center mb-6 font-medium">Secured Administration Gateway</p>

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm text-destructive mb-4 text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="golf-label block mb-1.5 text-xs uppercase tracking-wider text-muted-foreground font-semibold">Admin Email</label>
              <input 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                className="golf-input w-full bg-black/40 border border-white/10 rounded-lg py-2 px-3 text-white placeholder-admin@golfai.com focus:outline-none focus:border-amber-500 transition"
                placeholder="admin@golfai.com" 
              />
            </div>
            <div>
              <label className="golf-label block mb-1.5 text-xs uppercase tracking-wider text-muted-foreground font-semibold">Password</label>
              <div className="relative">
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  className="golf-input w-full bg-black/40 border border-white/10 rounded-lg py-2 px-3 pr-10 text-white placeholder-•••••••• focus:outline-none focus:border-amber-500 transition"
                  placeholder="••••••••" 
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)} 
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button 
              type="submit" 
              disabled={loading} 
              className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-black font-semibold rounded-lg py-3 shadow-lg shadow-yellow-500/10 hover:shadow-yellow-500/20 transition disabled:opacity-50 mt-2"
            >
              {loading ? 'Authenticating...' : 'Secure Authorization'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
