import React, { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { User, Play, Image as ImageIcon } from 'lucide-react';

const ProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser } = useAuth();
  const { players, coaches, videos } = useData();

  const profileUserId = id || currentUser?.id;
  
  const profileUser = useMemo(() => {
    return [...players, ...coaches].find(u => u.id === profileUserId) || currentUser;
  }, [id, players, coaches, currentUser, profileUserId]);

  const userVideos = useMemo(() => {
    return videos.filter(v => v.playerId === profileUserId);
  }, [videos, profileUserId]);

  if (!profileUser) {
    return <div className="text-center p-8 text-muted-foreground">User not found</div>;
  }

  const isOwnProfile = currentUser?.id === profileUser.id;

  return (
    <div className="max-w-4xl mx-auto">
      {/* IG-style Header */}
      <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-12 p-4">
        <div className="w-32 h-32 md:w-40 md:h-40 rounded-full golf-gradient-gold p-1 flex-shrink-0">
          <div className="w-full h-full rounded-full bg-slate-900 border-4 border-background flex items-center justify-center">
            <span className="font-display text-5xl font-bold text-gold">
              {profileUser.name?.charAt(0).toUpperCase()}
            </span>
          </div>
        </div>

        <div className="flex-1 text-center md:text-left">
          <div className="flex flex-col md:flex-row items-center gap-4 mb-4">
            <h1 className="font-display text-2xl font-bold">{profileUser.name}</h1>
            <div className="flex gap-2">
              {isOwnProfile ? (
                <button className="px-4 py-1.5 rounded-lg bg-sidebar-accent text-sm font-medium hover:bg-sidebar-accent/80 transition-colors">
                  Edit Profile
                </button>
              ) : (
                <>
                  <button className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
                    Follow
                  </button>
                  <Link to="/chat" className="px-4 py-1.5 rounded-lg bg-sidebar-accent text-sm font-medium hover:bg-sidebar-accent/80 transition-colors">
                    Message
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className="flex justify-center md:justify-start gap-6 mb-4 text-sm">
            <div><span className="font-bold text-foreground">{userVideos.length}</span> <span className="text-muted-foreground">posts</span></div>
            <div><span className="font-bold text-foreground">1.2k</span> <span className="text-muted-foreground">followers</span></div>
            <div><span className="font-bold text-foreground">84</span> <span className="text-muted-foreground">following</span></div>
          </div>

          <div className="text-sm max-w-md">
            <p className="font-medium">{profileUser.role === 'coach' ? 'Pro Golf Coach 🏌️‍♂️' : 'Golf Enthusiast ⛳️'}</p>
            <p className="text-muted-foreground mt-1">Sharing my swing journey and trying to get better everyday. Let's talk golf!</p>
          </div>
        </div>
      </div>

      <div className="border-t border-border mb-6">
        <div className="flex justify-center gap-12">
          <div className="border-t-2 border-primary py-4 flex items-center gap-2 text-sm font-medium text-foreground">
            <ImageIcon size={16} /> POSTS
          </div>
        </div>
      </div>

      {/* IG-style Post Grid */}
      {userVideos.length > 0 ? (
        <div className="grid grid-cols-3 gap-1 md:gap-4">
          {userVideos.map(video => (
            <Link 
              key={video.id} 
              to={`/analysis/${video.id}`}
              className="aspect-square bg-sidebar-accent relative group overflow-hidden"
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <Play size={32} className="text-muted-foreground/50" />
              </div>
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-2">
                <div className="flex items-center gap-1.5 text-white font-medium">
                  <Play size={16} className="fill-white" /> 
                  {video.status === 'analyzed' ? 'Analyzed' : 'Processing'}
                </div>
                <p className="text-xs text-white/80 px-2 text-center truncate w-full">{video.title}</p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-full border-2 border-muted flex items-center justify-center mx-auto mb-4">
            <Play size={24} className="text-muted-foreground" />
          </div>
          <h2 className="text-xl font-bold font-display mb-2">No Posts Yet</h2>
          {isOwnProfile ? (
             <p className="text-muted-foreground text-sm">Upload a swing video to start sharing.</p>
          ) : (
             <p className="text-muted-foreground text-sm">This user hasn't posted any swings.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
