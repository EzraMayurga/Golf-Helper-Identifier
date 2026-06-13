import React, { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, BarChart, Bar } from 'recharts';
import { TrendingUp, TrendingDown, Activity, Shield, Users } from 'lucide-react';
import { motion } from 'framer-motion';

const chartStyle = { background: 'hsl(150,8%,10%)', border: '1px solid hsl(150,10%,18%)', borderRadius: 8, color: '#fff', fontSize: 12 };

const ProgressPage: React.FC = () => {
  const { user } = useAuth();
  const { videos, analysis, players, coaches } = useData();

  // Determine active player whose progress is being viewed
  const isCoach = user?.role === 'coach';
  const coachData = isCoach ? coaches.find(c => c.id === user.id) : null;
  const assignedPlayers = isCoach && coachData
    ? players.filter(p => !['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8'].includes(p.id))
    : [];

  const [selectedPlayerId, setSelectedPlayerId] = useState<string>(() => {
    if (isCoach) {
      return assignedPlayers[0]?.id || '';
    }
    return user?.id || '';
  });

  const activePlayer = players.find(p => p.id === selectedPlayerId);
  const playerVideos = selectedPlayerId ? videos.filter(v => v.playerId === selectedPlayerId) : [];
  const playerAnalyses = selectedPlayerId ? analysis.filter(a => playerVideos.some(v => v.id === a.videoId)) : [];

  // Dynamically compute weekly progress from real swing analysis records
  const getWeeklyProgress = (analyses: any[]) => {
    if (!analyses || analyses.length === 0) return [];
    
    // Sort chronologically (oldest first)
    const sorted = [...analyses].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    const firstDate = new Date(sorted[0].createdAt);
    
    // Group by week offset (7-day intervals)
    const weeklyGroups: { [key: string]: any[] } = {};
    sorted.forEach(a => {
      const scanDate = new Date(a.createdAt);
      const diffTime = Math.abs(scanDate.getTime() - firstDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const weekNum = Math.max(1, Math.ceil((diffDays + 1) / 7));
      const weekLabel = `Week ${weekNum}`;
      
      if (!weeklyGroups[weekLabel]) {
        weeklyGroups[weekLabel] = [];
      }
      weeklyGroups[weekLabel].push(a);
    });

    const progressList: any[] = [];
    let prevAvgScore = 0;
    
    Object.keys(weeklyGroups).forEach((weekLabel, index) => {
      const group = weeklyGroups[weekLabel];
      const avgScore = Math.round(group.reduce((sum, item) => sum + item.swingScore, 0) / group.length);
      const avgInjuryRisk = Math.round(group.reduce((sum, item) => sum + item.injuryRiskScore, 0) / group.length);
      const swingsAnalyzed = group.length;
      
      // Calculate percentage improvement
      const improvement = index === 0 ? 0 : Number((((avgScore - prevAvgScore) / prevAvgScore) * 100).toFixed(1));
      
      progressList.push({
        week: weekLabel,
        avgScore,
        swingsAnalyzed,
        injuryRisk: avgInjuryRisk,
        improvement
      });
      
      prevAvgScore = avgScore;
    });
    
    return progressList;
  };

  const activeProgress = getWeeklyProgress(playerAnalyses);

  // Render empty state if there's no data
  const renderEmptyState = () => (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="golf-card p-12 text-center flex flex-col items-center justify-center space-y-4 border border-gold/10 relative overflow-hidden mt-6"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-gold/5 via-transparent to-transparent opacity-30" />
      <Activity size={64} className="text-gold/40 animate-pulse" />
      <h2 className="font-display text-xl font-bold text-foreground">Data Progress Kosong</h2>
      <p className="text-muted-foreground text-sm max-w-md">
        {isCoach 
          ? `Pemain ${activePlayer?.name || ''} belum memiliki data analisis swing yang tersimpan.`
          : 'Belum ada data progress. Mulailah mengunggah video swing Anda untuk melacak statistik perkembangan swing secara langsung!'}
      </p>
    </motion.div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Progress Tracking</h1>
          <p className="text-muted-foreground text-sm">Your weekly performance over time</p>
        </div>

        {/* Coach Selector */}
        {isCoach && assignedPlayers.length > 0 && (
          <div className="flex items-center gap-2 bg-muted/50 p-2 rounded-lg border border-border">
            <Users size={16} className="text-gold" />
            <span className="text-xs font-medium text-muted-foreground">Pilih Pemain:</span>
            <select
              value={selectedPlayerId}
              onChange={e => setSelectedPlayerId(e.target.value)}
              className="bg-transparent border-none text-xs font-semibold text-foreground focus:ring-0 cursor-pointer outline-none"
            >
              {assignedPlayers.map(p => (
                <option key={p.id} value={p.id} className="bg-[#0b0c0b] text-foreground">
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {activeProgress.length === 0 ? (
        renderEmptyState()
      ) : (
        <>
          {/* Summary Row */}
          {(() => {
            const latest = activeProgress[activeProgress.length - 1];
            const first = activeProgress[0];
            const totalImprovement = first.avgScore > 0 
              ? ((latest.avgScore - first.avgScore) / first.avgScore * 100).toFixed(1)
              : '0.0';

            return (
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="golf-stat-card">
                  <div className="flex items-center gap-2 text-muted-foreground"><TrendingUp size={18} /> <span className="golf-label">Total Improvement</span></div>
                  <p className="font-display text-3xl font-bold text-green-400">+{totalImprovement}%</p>
                </div>
                <div className="golf-stat-card">
                  <div className="flex items-center gap-2 text-muted-foreground"><Activity size={18} /> <span className="golf-label">Current Avg Score</span></div>
                  <p className="font-display text-3xl font-bold text-gold">{latest.avgScore}</p>
                </div>
                <div className="golf-stat-card">
                  <div className="flex items-center gap-2 text-muted-foreground"><Shield size={18} /> <span className="golf-label">Injury Risk Trend</span></div>
                  <p className="font-display text-3xl font-bold text-red-400">{latest.injuryRisk}%</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1"><TrendingDown size={12} className="text-green-400" /> Dynamic scan rate</p>
                </div>
              </div>
            );
          })()}

          {/* Charts */}
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="golf-card">
              <h2 className="font-display text-xl font-semibold mb-4">Swing Score Trend</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={activeProgress}>
                    <XAxis dataKey="week" tick={{ fill: 'hsl(150,10%,55%)', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis domain={[50, 100]} tick={{ fill: 'hsl(150,10%,55%)', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={chartStyle} />
                    <Line type="monotone" dataKey="avgScore" stroke="hsl(45,80%,55%)" strokeWidth={2.5} dot={{ fill: 'hsl(45,80%,55%)', r: 4 }} name="Avg Score" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="golf-card">
              <h2 className="font-display text-xl font-semibold mb-4">Swings Analyzed per Week</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={activeProgress}>
                    <XAxis dataKey="week" tick={{ fill: 'hsl(150,10%,55%)', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'hsl(150,10%,55%)', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={chartStyle} />
                    <Bar dataKey="swingsAnalyzed" fill="hsl(150,40%,25%)" radius={[4, 4, 0, 0]} name="Swings" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="golf-card lg:col-span-2">
              <h2 className="font-display text-xl font-semibold mb-4">Injury Risk Trend</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={activeProgress}>
                    <XAxis dataKey="week" tick={{ fill: 'hsl(150,10%,55%)', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fill: 'hsl(150,10%,55%)', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={chartStyle} />
                    <Line type="monotone" dataKey="injuryRisk" stroke="hsl(0,72%,51%)" strokeWidth={2} dot={{ fill: 'hsl(0,72%,51%)', r: 4 }} name="Injury Risk %" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Weekly table */}
          <div className="golf-card overflow-x-auto">
            <h2 className="font-display text-xl font-semibold mb-4">Weekly Breakdown</h2>
            <table className="w-full text-sm">
              <thead>
                <tr>
                  {['Week', 'Avg Score', 'Swings', 'Injury Risk', 'Improvement'].map(h => (
                    <th key={h} className="golf-table-header text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activeProgress.map(p => (
                  <tr key={p.week} className="border-b border-border/50">
                    <td className="py-3">{p.week}</td>
                    <td className="py-3 font-semibold text-gold">{p.avgScore}</td>
                    <td className="py-3">{p.swingsAnalyzed}</td>
                    <td className="py-3">{p.injuryRisk}%</td>
                    <td className={`py-3 font-medium ${p.improvement >= 0 ? 'text-green-400' : 'text-destructive'}`}>
                      {p.improvement >= 0 ? '+' : ''}{p.improvement}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default ProgressPage;
