import React from 'react';
import { useData } from '@/contexts/DataContext';
import { LayoutDashboard, Users, Video, BarChart3, BookOpen, CreditCard, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, PieChart, Pie, Cell } from 'recharts';

const chartStyle = { background: 'hsl(150,8%,10%)', border: '1px solid hsl(150,10%,18%)', borderRadius: 8, color: '#fff', fontSize: 12 };

const AdminDashboard: React.FC = () => {
  const { players, coaches, videos, tutorials } = useData();

  const totalUsers = players.length + coaches.length;
  const premiumUsers = players.filter(p => p.subscriptionStatus === 'premium').length;
  const totalVideos = videos.length;

  const roleData = [
    { name: 'Players', value: players.length },
    { name: 'Coaches', value: coaches.length },
    { name: 'Admin', value: 1 },
  ];

  const subData = [
    { name: 'Free', value: players.filter(p => p.subscriptionStatus === 'free').length },
    { name: 'Premium', value: premiumUsers },
    { name: 'Expired', value: players.filter(p => p.subscriptionStatus === 'expired').length },
  ];

  const COLORS = ['hsl(150,40%,25%)', 'hsl(45,80%,55%)', 'hsl(0,72%,51%)'];

  // Combine recently joined users
  const recentUsers = [...players, ...coaches]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 7);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold flex items-center gap-2"><LayoutDashboard className="text-gold" /> Admin Dashboard</h1>
        <p className="text-muted-foreground text-sm">Platform overview and management</p>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: <Users size={20} />, label: 'Total Users', value: totalUsers },
          { icon: <CreditCard size={20} />, label: 'Premium Users', value: premiumUsers },
          { icon: <Video size={20} />, label: 'Total Videos', value: totalVideos },
          { icon: <BookOpen size={20} />, label: 'Tutorials', value: tutorials.length },
        ].map(stat => (
          <div key={stat.label} className="golf-stat-card">
            <div className="flex items-center gap-2 text-muted-foreground">{stat.icon}<span className="golf-label">{stat.label}</span></div>
            <p className="font-display text-3xl font-bold text-gold">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* User distribution */}
        <div className="golf-card">
          <h2 className="font-display text-xl font-semibold mb-4">User Roles</h2>
          <div className="h-48 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={roleData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {roleData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip contentStyle={chartStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Subscription */}
        <div className="golf-card">
          <h2 className="font-display text-xl font-semibold mb-4">Subscriptions</h2>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subData}>
                <XAxis dataKey="name" tick={{ fill: 'hsl(150,10%,55%)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'hsl(150,10%,55%)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={chartStyle} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {subData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* System status */}
      <div className="golf-card">
        <h2 className="font-display text-xl font-semibold mb-4 flex items-center gap-2"><Activity size={18} className="text-gold" /> System Status</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { label: 'AI Engine', status: 'Operational', color: 'text-green-400' },
            { label: 'Media API', status: 'Operational', color: 'text-green-400' },
            { label: 'Payment Gateway', status: 'Operational', color: 'text-green-400' },
          ].map(s => (
            <div key={s.label} className="bg-muted rounded-lg p-4 flex items-center justify-between">
              <span className="text-sm">{s.label}</span>
              <span className={`text-xs font-medium ${s.color}`}>● {s.status}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent users */}
      <div className="golf-card overflow-x-auto">
        <h2 className="font-display text-xl font-semibold mb-4">Recent Users</h2>
        <table className="w-full text-sm">
          <thead>
            <tr>{['Name', 'Email', 'Role', 'Subscription', 'Joined'].map(h => <th key={h} className="golf-table-header text-left">{h}</th>)}</tr>
          </thead>
          <tbody>
            {recentUsers.map(u => (
              <tr key={u.id} className="border-b border-border/50">
                <td className="py-3 font-medium">{u.name}</td>
                <td className="py-3 text-muted-foreground">{u.email}</td>
                <td className="py-3 capitalize">{u.role}</td>
                <td className="py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${u.subscriptionStatus === 'premium' ? 'bg-primary/10 text-gold' : 'bg-muted text-muted-foreground'}`}>{u.subscriptionStatus}</span></td>
                <td className="py-3 text-muted-foreground">{u.createdAt ? u.createdAt.split('T')[0] : 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminDashboard;
