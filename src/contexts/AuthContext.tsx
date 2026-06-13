import React, { createContext, useContext, useState, useCallback } from 'react';
import { User, UserRole, mockPlayers, mockCoaches, mockAdmin } from '@/data/mockData';

const BACKEND_URL = import.meta.env.VITE_API_BASE || import.meta.env.VITE_API_URL || 'http://localhost:5000';


interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  adminLogin: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string, role: UserRole) => Promise<boolean>;
  logout: () => void;
  switchRole: (role: UserRole) => void; // Demo helper
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('golf_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [isLoading, setIsLoading] = useState(true);

  React.useEffect(() => {
    // Initialize auth state from localStorage
    const saved = localStorage.getItem('golf_user');
    if (saved) {
      try {
        setUser(JSON.parse(saved));
      } catch (e) {
        console.warn('Failed to parse saved user:', e);
        localStorage.removeItem('golf_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user && data.token) {
          setUser(data.user);
          localStorage.setItem('golf_user', JSON.stringify(data.user));
          localStorage.setItem('golf_token', data.token);
          return true;
        }
      }
    } catch (e) {
      console.warn('[Auth] Offline mode login.');
    }

    // Mock login - find user by email
    const allUsers = [...mockPlayers, ...mockCoaches];
    const found = allUsers.find(u => u.email === email);
    if (found) { 
      setUser(found); 
      localStorage.setItem('golf_user', JSON.stringify(found));
      localStorage.setItem('golf_token', 'mock-jwt-token-player-coach');
      return true; 
    }
    return false;
  }, []);

  const adminLogin = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user && data.token) {
          setUser(data.user);
          localStorage.setItem('golf_user', JSON.stringify(data.user));
          localStorage.setItem('golf_token', data.token);
          return true;
        }
      }
    } catch (e) {
      console.warn('[Auth] Offline mode admin login.');
    }

    // Mock Admin login
    if (email === mockAdmin.email) {
      setUser(mockAdmin);
      localStorage.setItem('golf_user', JSON.stringify(mockAdmin));
      localStorage.setItem('golf_token', 'mock-jwt-token-admin');
      return true;
    }
    return false;
  }, []);

  const register = useCallback(async (name: string, email: string, password: string, role: UserRole): Promise<boolean> => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role }),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user && data.token) {
          setUser(data.user);
          localStorage.setItem('golf_user', JSON.stringify(data.user));
          localStorage.setItem('golf_token', data.token);
          return true;
        }
      }
    } catch (e) {
      console.warn('[Auth] Offline mode register.');
    }

    // Offline Register simulation
    const newUser: User = {
      id: `u_${Date.now()}`,
      name, email, role,
      subscriptionStatus: 'free',
      createdAt: new Date().toISOString(),
    };
    setUser(newUser);
    localStorage.setItem('golf_user', JSON.stringify(newUser));
    localStorage.setItem('golf_token', 'mock-jwt-token-registered');
    return true;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('golf_user');
    localStorage.removeItem('golf_token');
  }, []);

  const switchRole = useCallback((role: UserRole) => {
    let nextUser = mockAdmin;
    if (role === 'player') nextUser = mockPlayers[0];
    else if (role === 'coach') nextUser = mockCoaches[0];
    setUser(nextUser);
    localStorage.setItem('golf_user', JSON.stringify(nextUser));
    localStorage.setItem('golf_token', 'mock-jwt-token-switched');
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, adminLogin, register, logout, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
};
