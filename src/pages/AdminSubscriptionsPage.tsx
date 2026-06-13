import React from 'react';
import { CreditCard } from 'lucide-react';
import { useData } from '@/contexts/DataContext';

const AdminSubscriptionsPage: React.FC = () => {
  const { players } = useData();

  const subs = players.map(p => ({
    id: p.id,
    name: p.name,
    status: p.subscriptionStatus,
    type: p.subscriptionStatus === 'premium' ? 'Monthly' : '-',
    amount: p.subscriptionStatus === 'premium' ? '$19' : '$0',
  }));

  const activePremiumCount = subs.filter(s => s.status === 'premium').length;
  const totalRevenue = activePremiumCount * 19; // Dynamic demo billing calculation

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold flex items-center gap-2"><CreditCard className="text-gold" /> Subscriptions</h1>
        <p className="text-muted-foreground text-sm">Manage user subscriptions and billing</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div className="golf-stat-card"><span className="golf-label">Active Premium Revenue</span><p className="font-display text-3xl font-bold text-gold">${totalRevenue}</p></div>
        <div className="golf-stat-card"><span className="golf-label">Active Premium</span><p className="font-display text-3xl font-bold text-green-400">{activePremiumCount}</p></div>
        <div className="golf-stat-card"><span className="golf-label">Conversion Rate</span><p className="font-display text-3xl font-bold text-gold">
          {subs.length > 0 ? ((activePremiumCount / subs.length) * 100).toFixed(0) : 0}%
        </p></div>
      </div>

      <div className="golf-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr>{['User', 'Status', 'Plan', 'Amount'].map(h => <th key={h} className="golf-table-header text-left">{h}</th>)}</tr></thead>
          <tbody>
            {subs.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-6 text-center text-muted-foreground">No players found.</td>
              </tr>
            ) : (
              subs.map(s => (
                <tr key={s.id} className="border-b border-border/50">
                  <td className="py-3 font-medium">{s.name}</td>
                  <td className="py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${s.status === 'premium' ? 'bg-primary/10 text-gold' : s.status === 'expired' ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground'}`}>{s.status}</span></td>
                  <td className="py-3 text-muted-foreground">{s.type}</td>
                  <td className="py-3 font-medium">{s.amount}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminSubscriptionsPage;
