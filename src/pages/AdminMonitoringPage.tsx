import React from 'react';
import { Monitor, Activity, CheckCircle, AlertTriangle, Server } from 'lucide-react';

const services = [
  { name: 'AI Engine v2.4', status: 'operational', uptime: '99.97%', latency: '45ms' },
  { name: 'Media API', status: 'operational', uptime: '99.99%', latency: '12ms' },
  { name: 'Payment Gateway', status: 'operational', uptime: '99.95%', latency: '180ms' },
  { name: 'Database', status: 'operational', uptime: '99.99%', latency: '3ms' },
  { name: 'Auth Service', status: 'operational', uptime: '99.98%', latency: '22ms' },
  { name: 'CDN / Storage', status: 'operational', uptime: '100%', latency: '8ms' },
];

const AdminMonitoringPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold flex items-center gap-2"><Monitor className="text-gold" /> System Monitoring</h1>
        <p className="text-muted-foreground text-sm">Real-time system health and performance</p>
      </div>

      <div className="golf-card-glow text-center py-6">
        <CheckCircle size={32} className="text-green-400 mx-auto mb-2" />
        <p className="font-display text-xl font-bold">All Systems Operational</p>
        <p className="text-sm text-muted-foreground">Last checked: just now</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map(s => (
          <div key={s.name} className="golf-card">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Server size={16} className="text-muted-foreground" />
                <span className="text-sm font-medium">{s.name}</span>
              </div>
              <span className="text-xs text-green-400 font-medium">● {s.status}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><p className="golf-label">Uptime</p><p className="text-sm font-semibold text-green-400">{s.uptime}</p></div>
              <div><p className="golf-label">Latency</p><p className="text-sm font-semibold text-gold">{s.latency}</p></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminMonitoringPage;
