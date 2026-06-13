import React from 'react';
import { useData } from '@/contexts/DataContext';
import { Users, Video, BarChart3 } from 'lucide-react';

const CoachPlayersPage: React.FC = () => {
  const { players } = useData();
  const activePlayers = players.filter(p => !['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8'].includes(p.id));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold flex items-center gap-2"><Users className="text-gold" /> Players</h1>
        <p className="text-muted-foreground text-sm">Review and manage assigned players</p>
      </div>

      {activePlayers.length === 0 ? (
        <div className="golf-card p-12 text-center flex flex-col items-center justify-center space-y-4 border border-gold/10">
          <Users size={48} className="text-gold/40 animate-pulse" />
          <h2 className="font-display text-lg font-bold text-foreground">Data Pemain Kosong</h2>
          <p className="text-muted-foreground text-sm max-w-sm">
            Belum ada pemain nyata yang terdaftar di dalam sistem saat ini.
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {activePlayers.map(player => (
            <div key={player.id} className="golf-card">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center font-display font-bold text-lg">{player.name.charAt(0)}</div>
                <div>
                  <p className="font-medium">{player.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{player.subscriptionStatus}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="text-center"><p className="golf-label">Handicap</p><p className="font-display font-bold text-gold">{player.handicap}</p></div>
                <div className="text-center"><p className="golf-label">Videos</p><p className="font-display font-bold">{player.totalVideos}</p></div>
                <div className="text-center"><p className="golf-label">Avg Score</p><p className="font-display font-bold text-gold">{player.avgScore}</p></div>
              </div>
              <div className="flex gap-2">
                <button className="golf-btn-secondary flex-1 !py-2 text-xs flex items-center justify-center gap-1"><Video size={14} /> Videos</button>
                <button className="golf-btn-primary flex-1 !py-2 text-xs flex items-center justify-center gap-1"><BarChart3 size={14} /> Review</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CoachPlayersPage;
