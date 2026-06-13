import React, { useState } from 'react';
import { MessageSquare, Send } from 'lucide-react';
import { useData } from '@/contexts/DataContext';

const CoachFeedbackPage: React.FC = () => {
  const { videos, players, feedback: allFeedback, addFeedback } = useData();
  const [selectedVideo, setSelectedVideo] = useState('');
  const [feedback, setFeedback] = useState('');
  const [rating, setRating] = useState(4);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedVideo || !feedback.trim()) return;
    setSubmitting(true);
    const success = await addFeedback(selectedVideo, feedback, rating);
    setSubmitting(false);
    if (success) {
      setFeedback('');
      setSelectedVideo('');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold flex items-center gap-2"><MessageSquare className="text-gold" /> Player Feedback</h1>
        <p className="text-muted-foreground text-sm">Provide manual feedback on player swings</p>
      </div>

      {/* New feedback form */}
      <div className="golf-card">
        <h2 className="font-display text-lg font-semibold mb-4">Submit Feedback</h2>
        <div className="space-y-3">
          <div>
            <label className="golf-label block mb-1">Select Video</label>
            <select value={selectedVideo} onChange={e => setSelectedVideo(e.target.value)} className="golf-input w-full">
              <option value="">Choose a video...</option>
              {videos.map(v => {
                const player = players.find(p => p.id === v.playerId);
                return <option key={v.id} value={v.id}>{player?.name || 'Unknown'} - {v.title}</option>;
              })}
            </select>
          </div>
          <div>
            <label className="golf-label block mb-1">Rating</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(r => (
                <button key={r} onClick={() => setRating(r)} className={`w-10 h-10 rounded-lg font-bold text-sm transition-colors ${r <= rating ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  {r}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="golf-label block mb-1">Feedback</label>
            <textarea value={feedback} onChange={e => setFeedback(e.target.value)} className="golf-input w-full h-32 resize-none" placeholder="Detailed feedback for the player..." />
          </div>
          <button 
            onClick={handleSubmit} 
            disabled={submitting || !selectedVideo || !feedback.trim()} 
            className="golf-btn-primary flex items-center gap-2 text-sm disabled:opacity-50"
          >
            <Send size={16} /> {submitting ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </div>
      </div>

      {/* Previous feedback */}
      <div className="golf-card">
        <h2 className="font-display text-lg font-semibold mb-4">Previous Feedback</h2>
        <div className="space-y-3">
          {allFeedback.length === 0 ? (
            <p className="text-sm text-muted-foreground">No feedback left yet.</p>
          ) : (
            allFeedback.map(f => (
              <div key={f.id} className="bg-muted rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Video: {videos.find(v => v.id === f.videoId)?.title || 'Deleted Video'}</span>
                  <span className="text-xs text-muted-foreground">{f.createdAt}</span>
                </div>
                <p className="text-sm text-muted-foreground">{f.feedback}</p>
                <div className="mt-2 flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map(r => (
                    <span key={r} className={`text-xs ${r <= f.rating ? 'text-gold' : 'text-muted-foreground'}`}>★</span>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CoachFeedbackPage;
