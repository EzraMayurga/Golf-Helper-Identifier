import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  LayoutDashboard, Upload, Video, BarChart3, Trophy, BookOpen, 
  Users, Settings, LogOut, ChevronLeft, ChevronRight, Calendar,
  MessageSquare, FileText, Monitor, CreditCard, User, Activity
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

const DashboardSidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const playerNav: NavItem[] = [
    { label: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
    { label: 'Upload Video', path: '/upload', icon: <Upload size={20} /> },
    { label: 'My Videos', path: '/videos', icon: <Video size={20} /> },
    { label: 'Progress', path: '/progress', icon: <BarChart3 size={20} /> },
    { label: 'Leaderboard', path: '/leaderboard', icon: <Trophy size={20} /> },
    { label: 'Tutorials', path: '/tutorials', icon: <BookOpen size={20} /> },
    { label: 'Chat', path: '/chat', icon: <MessageSquare size={20} /> },
    { label: 'Profile', path: '/profile', icon: <User size={20} /> },
  ];

  const coachNav: NavItem[] = [
    { label: 'Dashboard', path: '/coach', icon: <LayoutDashboard size={20} /> },
    { label: 'Players', path: '/coach/players', icon: <Users size={20} /> },
    { label: 'Feedback', path: '/coach/feedback', icon: <MessageSquare size={20} /> },
    { label: 'Tutorials', path: '/coach/tutorials', icon: <BookOpen size={20} /> },
    { label: 'Schedule', path: '/coach/schedule', icon: <Calendar size={20} /> },
    { label: 'Chat', path: '/chat', icon: <MessageSquare size={20} /> },
    { label: 'Profile', path: '/profile', icon: <User size={20} /> },
  ];

  const adminNav: NavItem[] = [
    { label: 'Dashboard', path: '/admin', icon: <LayoutDashboard size={20} /> },
    { label: 'Users', path: '/admin/users', icon: <Users size={20} /> },
    { label: 'Tutorials', path: '/admin/tutorials', icon: <BookOpen size={20} /> },
    { label: 'Reports', path: '/admin/reports', icon: <FileText size={20} /> },
    { label: 'Monitoring', path: '/admin/monitoring', icon: <Monitor size={20} /> },
  ];

  const navItems = user?.role === 'admin' ? adminNav : user?.role === 'coach' ? coachNav : playerNav;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {!collapsed && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
          onClick={onToggle}
        />
      )}
      <aside className={`fixed left-0 top-0 h-full bg-sidebar border-r border-sidebar-border z-50 transition-transform duration-300 flex flex-col w-64 ${collapsed ? '-translate-x-full md:translate-x-0 md:w-16' : 'translate-x-0'}`}>
        {/* Logo */}
        <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg golf-gradient-gold flex items-center justify-center flex-shrink-0">
              <Activity size={18} className="text-primary-foreground" />
            </div>
            <span className={`font-display text-lg font-bold text-sidebar-foreground tracking-tight ${collapsed ? 'md:hidden' : 'block'}`}>SWING AI</span>
          </div>
          <button onClick={onToggle} className="md:hidden text-muted-foreground">×</button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-primary'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-primary'
                }`}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                <span className={`text-sm font-medium ${collapsed ? 'md:hidden' : 'block'}`}>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="p-3 border-t border-sidebar-border">
          {user && (
            <div className={`mb-3 px-2 ${collapsed ? 'md:hidden' : 'block'}`}>
              <p className="text-sm font-medium text-sidebar-foreground truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
            </div>
          )}
          <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-sidebar-accent/50 transition-all w-full">
            <LogOut size={18} />
            <span className={`text-sm ${collapsed ? 'md:hidden' : 'block'}`}>Logout</span>
          </button>
        </div>

        {/* Toggle - Desktop Only */}
        <button
          onClick={onToggle}
          className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-sidebar-accent border border-sidebar-border items-center justify-center text-sidebar-foreground hover:text-sidebar-primary transition-colors"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </aside>
    </>
  );
};

export default DashboardSidebar;
