import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { getScoreColor, getScoreLabel, getRiskColor, getRiskLabel } from '@/services/aiService';
import { Upload, Video, BarChart3, Trophy, TrendingUp, AlertTriangle, ArrowRight, Activity } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

const anim = (i: number) => ({ initial: { opacity: 0, y: 15 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.1 } });

const PlayerDashboard: React.FC = () => {
  const { user } = useAuth();
  const { videos, analysis, leaderboard } = useData();
  
  const currentUserId = user?.id || 'p1';
  const playerVideos = videos.filter(v => v.playerId === currentUserId);
  const playerAnalyses = analysis.filter(a => playerVideos.some(v => v.id === a.videoId));

  // Dynamically compute weekly progress from real swing analysis records
  const getWeeklyProgress = (analyses: any[]) => {
    if (!analyses || analyses.length === 0) return [];
    
    // Sort chronologically (oldest first)
    const sorted = [...analyses].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    const firstDate = new Date(sorted[0].createdAt);
    
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
    Object.keys(weeklyGroups).forEach((weekLabel) => {
      const group = weeklyGroups[weekLabel];
      const avgScore = Math.round(group.reduce((sum, item) => sum + item.swingScore, 0) / group.length);
      progressList.push({
        week: weekLabel,
        avgScore
      });
    });
    
    return progressList;
  };

  const activeProgress = getWeeklyProgress(playerAnalyses);

  const latestAnalysis = analysis.find(a => {
    const vid = videos.find(v => v.id === a.videoId);
    return vid && vid.playerId === currentUserId;
  });
  const playerRank = leaderboard.find(l => l.playerId === currentUserId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground text-sm">Your golf performance overview</p>
        </div>
        <Link to="/upload" className="golf-btn-primary inline-flex items-center gap-2 text-sm">
          <Upload size={16} /> Upload Swing
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: <Video size={20} />, label: 'Total Videos', value: playerVideos.length, color: 'text-blue-400' },
          { icon: <Activity size={20} />, label: 'Latest Score', value: latestAnalysis?.swingScore || '-', color: getScoreColor(latestAnalysis?.swingScore || 0) },
          { icon: <Trophy size={20} />, label: 'Rank', value: playerRank ? `#${playerRank.rank}` : '-', color: 'text-gold' },
          { icon: <AlertTriangle size={20} />, label: 'Injury Risk', value: latestAnalysis ? `${latestAnalysis.injuryRiskScore}%` : '-', color: getRiskColor(latestAnalysis?.injuryRiskScore || 0) },
        ].map((stat, i) => (
          <motion.div key={stat.label} {...anim(i)} className="golf-stat-card">
            <div className="flex items-center gap-2 text-muted-foreground">
              {stat.icon}
              <span className="golf-label">{stat.label}</span>
            </div>
            <p className={`font-display text-3xl font-bold ${stat.color}`}>{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Progress chart */}
        <motion.div {...anim(4)} className="golf-card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-semibold">Progress</h2>
            <Link to="/progress" className="text-xs text-gold hover:underline flex items-center gap-1">View all <ArrowRight size={12} /></Link>
          </div>
          <div className="h-52">
            {activeProgress.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4">
                <Activity size={32} className="text-gold/40 animate-pulse mb-2" />
                <p className="text-xs text-muted-foreground max-w-xs">
                  Belum ada data progress. Mulailah mengunggah video swing Anda untuk melacak statistik perkembangan!
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={activeProgress}>
                  <XAxis dataKey="week" tick={{ fill: 'hsl(150,10%,55%)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[50, 100]} tick={{ fill: 'hsl(150,10%,55%)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: 'hsl(150,8%,10%)', border: '1px solid hsl(150,10%,18%)', borderRadius: 8, color: '#fff', fontSize: 12 }} />
                  <Line type="monotone" dataKey="avgScore" stroke="hsl(45,80%,55%)" strokeWidth={2} dot={{ fill: 'hsl(45,80%,55%)', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        {/* Latest analysis */}
        <motion.div {...anim(5)} className="golf-card">
          <h2 className="font-display text-xl font-semibold mb-4">Latest Analysis</h2>
          {latestAnalysis ? (
            <div className="space-y-3">
              <div className="text-center mb-4">
                <p className={`font-display text-5xl font-bold ${getScoreColor(latestAnalysis.swingScore)}`}>{latestAnalysis.swingScore}</p>
                <p className="text-sm text-muted-foreground">{getScoreLabel(latestAnalysis.swingScore)}</p>
              </div>
              {latestAnalysis.swingPhases.map(phase => (
                <div key={phase.phase} className="flex items-center justify-between text-sm">
                  <span className="capitalize text-muted-foreground">{phase.phase}</span>
                  <span className={`font-semibold ${getScoreColor(phase.score)}`}>{phase.score}</span>
                </div>
              ))}
              <Link to={`/analysis/${latestAnalysis.videoId}`} className="block text-center text-xs text-gold hover:underline mt-2">View Full Report →</Link>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No analysis yet. Upload a video to get started.</p>
          )}
        </motion.div>
      </div>

      {/* Recent videos */}
      <motion.div {...anim(6)} className="golf-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-semibold">Recent Videos</h2>
          <Link to="/videos" className="text-xs text-gold hover:underline flex items-center gap-1">View all <ArrowRight size={12} /></Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {playerVideos.map(video => (
            <div key={video.id} className="bg-muted rounded-lg p-4 group hover:bg-muted/80 transition-colors">
              <div className="aspect-video bg-background rounded-lg mb-3 flex items-center justify-center">
                <Video size={32} className="text-muted-foreground" />
              </div>
              <h3 className="text-sm font-medium truncate">{video.title}</h3>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-muted-foreground">{video.uploadDate}</span>
                <span className={`text-xs font-medium capitalize ${video.status === 'analyzed' ? 'text-green-400' : video.status === 'processing' ? 'text-gold' : 'text-muted-foreground'}`}>
                  {video.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default PlayerDashboard;
