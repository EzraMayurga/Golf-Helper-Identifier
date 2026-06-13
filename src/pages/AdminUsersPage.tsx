import React, { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { Users, Search, Edit, Trash2, Shield } from 'lucide-react';

const AdminUsersPage: React.FC = () => {
  const { players, coaches } = useData();
  const [search, setSearch] = useState('');
  
  const allUsers = [...players, ...coaches];
  const filtered = allUsers.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold flex items-center gap-2"><Users className="text-gold" /> User Management</h1>
          <p className="text-muted-foreground text-sm">{allUsers.length} total users</p>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} className="golf-input w-full pl-9" placeholder="Search users..." />
      </div>

      <div className="golf-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>{['Name', 'Email', 'Role', 'Status', 'Actions'].map(h => <th key={h} className="golf-table-header text-left">{h}</th>)}</tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-6 text-center text-muted-foreground">No users found.</td>
              </tr>
            ) : (
              filtered.map(u => (
                <tr key={u.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="py-3 font-medium">{u.name}</td>
                  <td className="py-3 text-muted-foreground">{u.email}</td>
                  <td className="py-3"><span className="capitalize flex items-center gap-1">{u.role === 'coach' && <Shield size={12} className="text-gold" />}{u.role}</span></td>
                  <td className="py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${u.subscriptionStatus === 'premium' ? 'bg-primary/10 text-gold' : 'bg-muted text-muted-foreground'}`}>{u.subscriptionStatus}</span></td>
                  <td className="py-3 flex gap-1">
                    <button className="w-7 h-7 rounded bg-muted flex items-center justify-center hover:bg-muted/80"><Edit size={13} /></button>
                    <button className="w-7 h-7 rounded bg-destructive/10 flex items-center justify-center text-destructive hover:bg-destructive/20"><Trash2 size={13} /></button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminUsersPage;
