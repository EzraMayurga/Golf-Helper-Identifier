import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Users, Video, Calendar, BookOpen, Star, MessageSquare } from 'lucide-react';

const CoachDashboard: React.FC = () => {
  const { user } = useAuth();
  const { coaches, players, videos, schedules, tutorials } = useData();
  
  const coach = coaches.find(c => c.id === user?.id) || coaches[0] || { id: 'c1', certification: 'Instructor', specialty: 'Full Swing', assignedPlayers: [] };
  const assignedPlayers = players.filter(p => !['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8'].includes(p.id));
  const todaySchedules = schedules.filter(s => s.coachId === coach.id);
  const coachTutorials = tutorials.filter(t => t.coachId === coach.id);
  const videosToReview = videos.filter(v => assignedPlayers.some(p => p.id === v.playerId));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Coach Dashboard</h1>
        <p className="text-muted-foreground text-sm">{coach.certification} • {coach.specialty}</p>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-4 gap-4">
        {[
          { icon: <Users size={20} />, label: 'Players', value: assignedPlayers.length },
          { icon: <Video size={20} />, label: 'Videos to Review', value: videosToReview.length },
          { icon: <Calendar size={20} />, label: 'Today Sessions', value: todaySchedules.filter(s => s.type === 'booked').length },
          { icon: <BookOpen size={20} />, label: 'Tutorials', value: coachTutorials.length },
        ].map(stat => (
          <div key={stat.label} className="golf-stat-card">
            <div className="flex items-center gap-2 text-muted-foreground">{stat.icon}<span className="golf-label">{stat.label}</span></div>
            <p className="font-display text-3xl font-bold text-gold">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Assigned players */}
        <div className="golf-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-semibold">Assigned Players</h2>
            <Link to="/coach/players" className="text-xs text-gold hover:underline">View All →</Link>
          </div>
          <div className="space-y-3">
            {assignedPlayers.length === 0 ? (
              <p className="text-xs text-muted-foreground py-6 text-center">
                Belum ada pemain yang terdaftar atau ditugaskan untuk Anda saat ini.
              </p>
            ) : (
              assignedPlayers.map(player => (
                <div key={player.id} className="flex items-center justify-between bg-muted rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center text-sm font-bold">{player.name.charAt(0)}</div>
                    <div>
                      <p className="text-sm font-medium">{player.name}</p>
                      <p className="text-xs text-muted-foreground">Handicap: {player.handicap} • Score: {player.avgScore}</p>
                    </div>
                  </div>
                  <Link to={`/coach/players/${player.id}`} className="text-xs text-gold hover:underline">Review</Link>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Schedule */}
        <div className="golf-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-semibold">Today's Schedule</h2>
            <Link to="/coach/schedule" className="text-xs text-gold hover:underline">Manage →</Link>
          </div>
          <div className="space-y-3">
            {todaySchedules.map(slot => (
              <div key={slot.id} className="flex items-center justify-between bg-muted rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-mono text-gold">{slot.time}</span>
                  <span className="text-sm">{slot.playerName || 'Available'}</span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${slot.type === 'booked' ? 'bg-primary/10 text-gold' : 'bg-accent/20 text-accent-foreground'}`}>
                  {slot.type}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoachDashboard;
