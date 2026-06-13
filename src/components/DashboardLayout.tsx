import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import DashboardSidebar from '@/components/DashboardSidebar';
import { useAuth } from '@/contexts/AuthContext';

const DashboardLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <main className={`transition-all duration-300 md:ml-64 ${collapsed ? 'ml-0 md:ml-16' : 'ml-0'}`}>
        {/* Top bar */}
        <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-4 md:px-6 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setCollapsed(!collapsed)}
              className="md:hidden w-10 h-10 flex items-center justify-center rounded-lg bg-sidebar-accent text-foreground"
            >
              ☰
            </button>
            <div>
              <p className="text-xs md:text-sm text-muted-foreground hidden sm:block">Welcome back,</p>
              <p className="font-display text-base md:text-lg font-semibold">{user?.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {user?.subscriptionStatus === 'premium' && (
              <span className="golf-badge-gold">⭐ Premium</span>
            )}
            <div className="w-9 h-9 rounded-full golf-gradient-gold flex items-center justify-center text-primary-foreground font-bold text-sm">
              {user?.name?.charAt(0)}
            </div>
          </div>
        </header>
        {/* Page content */}
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
