import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Activity } from 'lucide-react';
import { UserRole } from '@/data/mockData';

const RegisterPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('player');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name || !email || !password) { setError('All fields are required'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    const success = await register(name, email, password, role);
    setLoading(false);
    if (success) navigate('/dashboard');
    else setError('Registration failed');
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

        <div className="golf-card">
          <h1 className="font-display text-2xl font-bold text-center mb-1">Create Account</h1>
          <p className="text-sm text-muted-foreground text-center mb-6">Join the AI golf revolution</p>

          {error && <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm text-destructive mb-4">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="golf-label block mb-1.5">Full Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} className="golf-input w-full" placeholder="John Doe" />
            </div>
            <div>
              <label className="golf-label block mb-1.5">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="golf-input w-full" placeholder="your@email.com" />
            </div>
            <div>
              <label className="golf-label block mb-1.5">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="golf-input w-full" placeholder="••••••••" />
            </div>
            <div>
              <label className="golf-label block mb-1.5">Role</label>
              <select value={role} onChange={e => setRole(e.target.value as UserRole)} className="golf-input w-full">
                <option value="player">Player</option>
                <option value="coach">Coach</option>
              </select>
            </div>
            <button type="submit" disabled={loading} className="golf-btn-primary w-full disabled:opacity-50">
              {loading ? 'Creating...' : 'Create Account'}
            </button>
          </form>

          <p className="text-sm text-muted-foreground text-center mt-4">
            Already have an account? <Link to="/login" className="text-gold hover:underline">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
