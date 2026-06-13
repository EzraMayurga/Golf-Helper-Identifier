import React from 'react';
import { FileText, Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

const chartStyle = { background: 'hsl(150,8%,10%)', border: '1px solid hsl(150,10%,18%)', borderRadius: 8, color: '#fff', fontSize: 12 };

const data = [
  { month: 'Jan', users: 12, videos: 30 },
  { month: 'Feb', users: 18, videos: 45 },
  { month: 'Mar', users: 22, videos: 58 },
  { month: 'Apr', users: 30, videos: 72 },
  { month: 'May', users: 35, videos: 90 },
  { month: 'Jun', users: 42, videos: 110 },
];

const AdminReportsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold flex items-center gap-2"><FileText className="text-gold" /> Reports</h1>
          <p className="text-muted-foreground text-sm">Platform analytics and reports</p>
        </div>
        <button className="golf-btn-secondary text-sm flex items-center gap-2"><Download size={16} /> Export</button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="golf-card">
          <h2 className="font-display text-xl font-semibold mb-4">User Growth</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <XAxis dataKey="month" tick={{ fill: 'hsl(150,10%,55%)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'hsl(150,10%,55%)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={chartStyle} />
                <Bar dataKey="users" fill="hsl(45,80%,55%)" radius={[4, 4, 0, 0]} name="New Users" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="golf-card">
          <h2 className="font-display text-xl font-semibold mb-4">Video Uploads</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <XAxis dataKey="month" tick={{ fill: 'hsl(150,10%,55%)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'hsl(150,10%,55%)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={chartStyle} />
                <Bar dataKey="videos" fill="hsl(150,40%,25%)" radius={[4, 4, 0, 0]} name="Videos" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminReportsPage;
