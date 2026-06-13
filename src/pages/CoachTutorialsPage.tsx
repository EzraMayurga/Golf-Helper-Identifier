import React, { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { BookOpen, Plus, Edit, Trash2, X, Check } from 'lucide-react';

const CoachTutorialsPage: React.FC = () => {
  const { tutorials, addTutorial } = useData();
  const { user } = useAuth();
  
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Full Swing');
  const [description, setDescription] = useState('');
  const [isPremium, setIsPremium] = useState(false);
  const [duration, setDuration] = useState('10 min');
  const [videoUrl, setVideoUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Filter tutorials to only show this coach's tutorials
  const coachTutorials = tutorials.filter(t => t.coachId === user?.id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    setSubmitting(true);
    const success = await addTutorial(title, description, category, isPremium, duration, videoUrl);
    setSubmitting(false);

    if (success) {
      setTitle('');
      setCategory('Full Swing');
      setDescription('');
      setIsPremium(false);
      setDuration('10 min');
      setVideoUrl('');
      setShowForm(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold flex items-center gap-2">
            <BookOpen className="text-gold" /> Tutorial Management
          </h1>
          <p className="text-muted-foreground text-sm">Create and manage your video lessons and tutorials</p>
        </div>
        {!showForm && (
          <button 
            onClick={() => setShowForm(true)} 
            className="golf-btn-primary text-sm flex items-center gap-2"
          >
            <Plus size={16} /> New Tutorial
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="golf-card animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-semibold">Create New Tutorial</h2>
            <button 
              type="button" 
              onClick={() => setShowForm(false)} 
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="golf-label block mb-1">Title</label>
                <input 
                  value={title} 
                  onChange={e => setTitle(e.target.value)} 
                  required 
                  className="golf-input w-full" 
                  placeholder="e.g. Perfecting Your Stance" 
                />
              </div>
              <div>
                <label className="golf-label block mb-1">Category</label>
                <select 
                  value={category} 
                  onChange={e => setCategory(e.target.value)} 
                  className="golf-input w-full"
                >
                  <option>Full Swing</option>
                  <option>Short Game</option>
                  <option>Putting</option>
                  <option>Fitness</option>
                  <option>Mental Game</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="golf-label block mb-1">Duration</label>
                <input 
                  value={duration} 
                  onChange={e => setDuration(e.target.value)} 
                  required 
                  className="golf-input w-full" 
                  placeholder="e.g. 12 min" 
                />
              </div>
              <div>
                <label className="golf-label block mb-1">YouTube URL</label>
                <input 
                  value={videoUrl} 
                  onChange={e => setVideoUrl(e.target.value)} 
                  className="golf-input w-full" 
                  placeholder="e.g. https://youtube.com/watch?v=..." 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2 pt-2">
                <input 
                  type="checkbox" 
                  id="premium" 
                  checked={isPremium} 
                  onChange={e => setIsPremium(e.target.checked)} 
                  className="rounded bg-background border-muted text-primary focus:ring-primary w-4 h-4" 
                />
                <label htmlFor="premium" className="text-sm font-medium select-none">
                  Premium only (requires active membership)
                </label>
              </div>
            </div>

            <div>
              <label className="golf-label block mb-1">Description</label>
              <textarea 
                value={description} 
                onChange={e => setDescription(e.target.value)} 
                required 
                className="golf-input w-full h-24 resize-none" 
                placeholder="Describe the drills and key learning points in this lesson..." 
              />
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
                disabled={submitting || !title.trim() || !description.trim()} 
                className="golf-btn-primary text-sm flex items-center gap-1 disabled:opacity-50"
              >
                {submitting ? 'Publishing...' : <><Check size={16} /> Publish Lesson</>}
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="golf-card">
        <h2 className="font-display text-lg font-semibold mb-4">Your Published Tutorials</h2>
        {coachTutorials.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            No tutorials published yet. Click "New Tutorial" to create one.
          </p>
        ) : (
          <div className="space-y-3">
            {coachTutorials.map(t => (
              <div key={t.id} className="bg-muted rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-12 bg-background border border-muted rounded-lg flex items-center justify-center">
                    <BookOpen size={20} className="text-gold" />
                  </div>
                  <div>
                    <h3 className="font-medium text-sm text-foreground">{t.title}</h3>
                    <p className="text-xs text-muted-foreground">
                      {t.category} • {t.duration} {t.isPremium && <span className="text-gold font-semibold ml-1">★ Premium</span>}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className="text-xs text-muted-foreground self-center mr-2">{t.createdAt}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CoachTutorialsPage;
