import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Video, CheckCircle, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useData } from '@/contexts/DataContext';

const UploadVideoPage: React.FC = () => {
  const navigate = useNavigate();
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');
  const { uploadVideo } = useData();

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) validateAndSet(dropped);
  };

  const validateAndSet = (f: File) => {
    setError('');
    const validTypes = ['video/mp4', 'video/quicktime', 'video/webm', 'video/avi'];
    if (!validTypes.includes(f.type)) { setError('Invalid file type. Use MP4, MOV, WebM, or AVI.'); return; }
    if (f.size > 20 * 1024 * 1024) { setError('File too large. Maximum 20MB.'); return; }
    setFile(f);
  };

  const handleUpload = async () => {
    if (!file || !title) { setError('Please add a title and video file.'); return; }
    setUploading(true);
    const result = await uploadVideo(title, file, 8);
    setUploading(false);
    if (result.success) {
      setUploaded(true);
      if (result.videoId) {
        navigate(`/analysis/${result.videoId}`);
      }
    } else {
      setError('Upload failed. Is the server running?');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Upload Swing Video</h1>
        <p className="text-muted-foreground text-sm">Upload a video of your golf swing for AI analysis</p>
      </div>

      {uploaded ? (
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="golf-card text-center py-12">
          <CheckCircle size={48} className="text-green-400 mx-auto mb-4" />
          <h2 className="font-display text-2xl font-bold mb-2">Upload Successful!</h2>
          <p className="text-muted-foreground mb-6">Your video is being processed. AI analysis will begin shortly.</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => { setFile(null); setUploaded(false); setTitle(''); }} className="golf-btn-secondary">Upload Another</button>
            <a href="/videos" className="golf-btn-primary">View My Videos</a>
          </div>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-center gap-2 text-sm text-destructive">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <div>
            <label className="golf-label block mb-1.5">Video Title</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="golf-input w-full" placeholder="e.g., Driver Swing - Practice Round" />
          </div>

          <div
            className={`golf-card border-2 border-dashed cursor-pointer transition-all ${dragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'}`}
            onDragOver={e => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-input')?.click()}
          >
            <div className="py-12 text-center">
              {file ? (
                <div className="flex items-center gap-3 justify-center">
                  <Video size={24} className="text-gold" />
                  <div className="text-left">
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
                  </div>
                </div>
              ) : (
                <>
                  <Upload size={40} className="mx-auto text-muted-foreground mb-4" />
                  <p className="text-sm font-medium mb-1">Drag and drop your video here</p>
                  <p className="text-xs text-muted-foreground">MP4, MOV, WebM, AVI • Max 20MB</p>
                </>
              )}
            </div>
            <input id="file-input" type="file" accept="video/*" className="hidden" onChange={e => e.target.files?.[0] && validateAndSet(e.target.files[0])} />
          </div>

          <button onClick={handleUpload} disabled={!file || !title || uploading} className="golf-btn-primary w-full disabled:opacity-50">
            {uploading ? (
              <span className="flex items-center gap-2 justify-center">
                <span className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                Uploading...
              </span>
            ) : 'Upload & Analyze'}
          </button>

          <div className="golf-card bg-muted/50">
            <p className="golf-label mb-2">Tips for Best Results</p>
            <ul className="text-xs text-muted-foreground space-y-1.5">
              <li>• Record from a face-on or down-the-line angle</li>
              <li>• Ensure full body is visible in frame</li>
              <li>• Good lighting improves keypoint detection accuracy</li>
              <li>• 5-10 second clips work best</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadVideoPage;
