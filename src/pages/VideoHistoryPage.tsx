import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Video, Trash2, Eye, BarChart3 } from 'lucide-react';

const VideoHistoryPage: React.FC = () => {
  const { user } = useAuth();
  const { videos: allVideos, deleteVideo } = useData();
  const videos = allVideos.filter(v => v.playerId === (user?.id || 'p1'));

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this swing video and its associated reports?')) {
      await deleteVideo(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">My Videos</h1>
          <p className="text-muted-foreground text-sm">{videos.length} videos uploaded</p>
        </div>
        <Link to="/upload" className="golf-btn-primary text-sm">Upload New</Link>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {videos.map(video => (
          <div key={video.id} className="golf-card group">
            <div className="aspect-video bg-muted rounded-lg mb-4 flex items-center justify-center relative overflow-hidden">
              <Video size={36} className="text-muted-foreground" />
              <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Link to={`/analysis/${video.id}`} className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground hover:scale-110 transition-transform" title={video.status === 'analyzed' ? 'View Analysis' : 'View Video'}>
                  {video.status === 'analyzed' ? <BarChart3 size={16} /> : <Eye size={16} />}
                </Link>
                <button 
                  onClick={() => handleDelete(video.id)}
                  className="w-9 h-9 rounded-full bg-destructive flex items-center justify-center text-destructive-foreground hover:scale-110 transition-transform"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <h3 className="font-medium text-sm truncate">{video.title}</h3>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-muted-foreground">{video.uploadDate}</span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                video.status === 'analyzed' ? 'bg-green-400/10 text-green-400' :
                video.status === 'processing' ? 'bg-yellow-400/10 text-yellow-400' :
                'bg-muted text-muted-foreground'
              }`}>{video.status}</span>
            </div>
            <span className="text-xs text-muted-foreground">{video.duration}s</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VideoHistoryPage;
