import React, { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { BookOpen, Play, Lock, Search } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const categories = ['All', 'Full Swing', 'Short Game', 'Putting', 'Fitness', 'Mental Game'];

const TutorialsPage: React.FC = () => {
  const { user } = useAuth();
  const { tutorials } = useData();
  const { toast } = useToast();
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const isPremium = true; // All tutorials are now free

  const filtered = (tutorials || []).filter(t => {
    if (category !== 'All' && t.category !== category) return false;
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleWatch = (tutorial: any, locked?: boolean) => {
    if (tutorial.videoUrl) {
      window.open(tutorial.videoUrl, '_blank');
    } else {
      toast({
        title: 'Video Tidak Tersedia 🎬',
        description: 'Tautan video tutorial ini belum dikonfigurasi.',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold flex items-center gap-2"><BookOpen className="text-gold" /> Tutorials</h1>
        <p className="text-muted-foreground text-sm">Learn from expert coaches</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} className="golf-input w-full pl-9" placeholder="Search tutorials..." />
        </div>
        <div className="flex gap-2 flex-wrap">
          {categories.map(c => (
            <button key={c} onClick={() => setCategory(c)} className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${category === c ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(tutorial => {
          const locked = tutorial.isPremium && !isPremium;
          return (
            <div 
              key={tutorial.id} 
              onClick={() => handleWatch(tutorial, locked)}
              className={`golf-card group cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:border-gold/50 ${locked ? 'opacity-75' : ''}`}
            >
              <div className="aspect-video bg-muted rounded-lg mb-4 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <Play size={40} className="text-gold fill-gold/20 scale-90 group-hover:scale-100 transition-transform duration-300" />
                </div>
                <Play size={32} className="text-muted-foreground group-hover:opacity-0 transition-opacity duration-300" />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs px-2 py-0.5 rounded-full bg-accent/20 text-accent-foreground">{tutorial.category}</span>
                <span className="text-xs text-muted-foreground">{tutorial.duration}</span>
              </div>
              <h3 className="font-medium text-sm mb-1 group-hover:text-gold transition-colors">{tutorial.title}</h3>
              <p className="text-xs text-muted-foreground line-clamp-2">{tutorial.description}</p>
              <p className="text-xs text-muted-foreground mt-2 font-medium">by {tutorial.coachName}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TutorialsPage;
