import React, { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar, Plus, Clock, X, Check } from 'lucide-react';

const CoachSchedulePage: React.FC = () => {
  const { schedules, createSchedule } = useData();
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Filter schedules to only show this coach's slots
  const coachSlots = schedules.filter(s => s.coachId === user?.id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !time) return;

    setSubmitting(true);
    const success = await createSchedule(date, time);
    setSubmitting(false);

    if (success) {
      setDate('');
      setTime('');
      setShowForm(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold flex items-center gap-2">
            <Calendar className="text-gold" /> Schedule
          </h1>
          <p className="text-muted-foreground text-sm">Manage your coaching sessions and availability</p>
        </div>
        {!showForm && (
          <button 
            onClick={() => setShowForm(true)} 
            className="golf-btn-primary text-sm flex items-center gap-2"
          >
            <Plus size={16} /> Add Slot
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="golf-card animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-lg">Add Availability Slot</h3>
            <button 
              type="button" 
              onClick={() => setShowForm(false)} 
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="golf-label block mb-1">Date</label>
              <input 
                type="date" 
                value={date} 
                onChange={e => setDate(e.target.value)} 
                required 
                className="golf-input w-full"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div>
              <label className="golf-label block mb-1">Time</label>
              <input 
                type="time" 
                value={time} 
                onChange={e => setTime(e.target.value)} 
                required 
                className="golf-input w-full"
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <button 
              type="button" 
              onClick={() => setShowForm(false)} 
              className="px-4 py-2 text-sm bg-muted rounded-lg hover:bg-muted/80 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={submitting || !date || !time} 
              className="golf-btn-primary text-sm flex items-center gap-1 disabled:opacity-50"
            >
              {submitting ? 'Creating...' : <><Check size={16} /> Create Slot</>}
            </button>
          </div>
        </form>
      )}

      <div className="golf-card">
        <h2 className="font-display text-lg font-semibold mb-4">Your Session Slots</h2>
        {coachSlots.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            No availability slots created yet. Click "Add Slot" to open your calendar.
          </p>
        ) : (
          <div className="space-y-3">
            {coachSlots.map(slot => (
              <div key={slot.id} className="flex items-center justify-between bg-muted rounded-lg p-4">
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">{slot.date}</p>
                    <p className="font-display text-lg font-bold text-gold flex items-center gap-1">
                      <Clock size={14} /> {slot.time}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{slot.playerName || 'Open Slot'}</p>
                    <p className="text-xs text-muted-foreground capitalize">{slot.type}</p>
                  </div>
                </div>
                <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                  slot.type === 'booked' ? 'bg-primary/10 text-gold' : 'bg-accent/20 text-accent-foreground'
                }`}>
                  {slot.type === 'booked' ? 'Booked' : 'Available'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CoachSchedulePage;
