import React from 'react';
import { useData } from '@/contexts/DataContext';
import { Trophy, TrendingUp, TrendingDown, Minus, Crown } from 'lucide-react';
import { motion } from 'framer-motion';

const trendIcon = (t: string) => t === 'up' ? <TrendingUp size={14} className="text-green-400" /> : t === 'down' ? <TrendingDown size={14} className="text-destructive" /> : <Minus size={14} className="text-muted-foreground" />;

const LeaderboardPage: React.FC = () => {
  const { leaderboard, players, videos } = useData();

  const activeLeaderboard = leaderboard || [];

  // Handle premium empty state
  if (activeLeaderboard.length === 0) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto">
        <div className="text-center">
          <h1 className="font-display text-3xl font-bold flex items-center gap-2 justify-center"><Trophy className="text-gold" /> Leaderboard</h1>
          <p className="text-muted-foreground text-sm">Top players ranked by AI swing analysis score</p>
        </div>
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="golf-card p-12 text-center flex flex-col items-center justify-center space-y-4 border border-gold/10 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-gold/5 via-transparent to-transparent opacity-30" />
          <Trophy size={64} className="text-gold/40 animate-bounce" />
          <h2 className="font-display text-xl font-bold text-foreground">Leaderboard Kosong</h2>
          <p className="text-muted-foreground text-sm max-w-md">
            Belum ada user yang mengunggah analisis swing. Jadilah yang pertama memimpin klasemen!
          </p>
        </motion.div>
      </div>
    );
  }

  // Safeguard podium distribution for 1, 2, or 3 players
  const topPodium = activeLeaderboard.length >= 3 
    ? [activeLeaderboard[1], activeLeaderboard[0], activeLeaderboard[2]]
    : (activeLeaderboard.length === 2 ? [activeLeaderboard[1], activeLeaderboard[0]] : activeLeaderboard.slice(0, 3));

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="text-center">
        <h1 className="font-display text-3xl font-bold flex items-center gap-2 justify-center"><Trophy className="text-gold" /> Leaderboard</h1>
        <p className="text-muted-foreground text-sm">Top players ranked by AI swing analysis score</p>
      </div>

      {/* Top podium */}
      {topPodium.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-4 items-end">
          {topPodium.map((entry, i) => {
            const position = activeLeaderboard.length === 3 ? [2, 1, 3][i] : (activeLeaderboard.length === 2 ? [2, 1][i] : i + 1);
            const isFirst = position === 1;
            return (
              <motion.div
                key={entry.playerId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15 }}
                className={`golf-card text-center relative ${isFirst ? 'golf-card-glow border-primary/40 p-6' : 'p-4'}`}
              >
                {isFirst && <Crown size={24} className="text-gold mx-auto mb-2 animate-bounce" />}
                <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full mx-auto mb-3 flex items-center justify-center font-display text-lg sm:text-xl font-bold ${
                  isFirst ? 'golf-gradient-gold text-primary-foreground shadow-lg shadow-gold/20' : 'bg-muted text-foreground'
                }`}>
                  {entry.playerName.charAt(0)}
                </div>
                <p className="font-medium text-xs sm:text-sm truncate">{entry.playerName}</p>
                <p className="font-display text-xl sm:text-2xl font-bold text-gold mt-1">{entry.avgScore}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">#{position}</p>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Full table */}
      <div className="golf-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              {['Rank', 'Player', 'Score', 'Swings', 'Handicap', 'Trend'].map(h => (
                <th key={h} className="golf-table-header text-left">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {activeLeaderboard.map((entry, i) => (
              <motion.tr
                key={entry.playerId}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                className="border-b border-border/50 hover:bg-muted/30 transition-colors"
              >
                <td className="py-3">
                  <span className={`golf-rank-badge ${
                    entry.rank === 1 ? 'golf-gradient-gold text-primary-foreground shadow shadow-gold/20' :
                    entry.rank === 2 ? 'bg-gray-400/20 text-gray-300' :
                    entry.rank === 3 ? 'bg-amber-700/20 text-amber-600' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {entry.rank}
                  </span>
                </td>
                <td className="py-3 font-medium">{entry.playerName}</td>
                <td className="py-3 font-display font-bold text-gold">{entry.avgScore}</td>
                <td className="py-3 text-muted-foreground">{entry.totalSwings}</td>
                <td className="py-3 text-muted-foreground">{entry.handicap}</td>
                <td className="py-3">{trendIcon(entry.trend)}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LeaderboardPage;
