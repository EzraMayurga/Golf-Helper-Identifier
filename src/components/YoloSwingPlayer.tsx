import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Video, Circle, MoveRight, Eye, EyeOff, ShieldAlert, Sparkles, GitCompare, Activity } from 'lucide-react';
import { useData } from '@/contexts/DataContext';

interface DrawingShape {
  type: 'line' | 'circle';
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  color: string;
}

interface YoloSwingPlayerProps {
  videoId: string;
  swingScore?: number;
}

// ------------------------------------------------------------------
// Biomechanical 2D Trigonometry & Angle Arc Draw Helpers
// ------------------------------------------------------------------
const calculateAngle = (
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  p3: { x: number; y: number }
): number => {
  const ux = p1.x - p2.x;
  const uy = p1.y - p2.y;
  const vx = p3.x - p2.x;
  const vy = p3.y - p2.y;

  const dot = ux * vx + uy * vy;
  const magU = Math.sqrt(ux * ux + uy * uy);
  const magV = Math.sqrt(vx * vx + vy * vy);

  if (magU === 0 || magV === 0) return 0;
  
  let val = dot / (magU * magV);
  val = Math.max(-1, Math.min(1, val)); // Clamp precision errors
  
  const rad = Math.acos(val);
  return Math.round(rad * (180 / Math.PI));
};

const drawAngleArc = (
  ctx: CanvasRenderingContext2D,
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  p3: { x: number; y: number },
  angleVal: number,
  color: string = '#10b981'
) => {
  const angle1 = Math.atan2(p1.y - p2.y, p1.x - p2.x);
  const angle2 = Math.atan2(p3.y - p2.y, p3.x - p2.x);

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.shadowBlur = 6;
  ctx.shadowColor = color;
  
  ctx.beginPath();
  // Arc radius: 18px
  ctx.arc(p2.x, p2.y, 18, Math.min(angle1, angle2), Math.max(angle1, angle2));
  ctx.stroke();

  // Floating degree tag offset calculation
  let midAngle = (angle1 + angle2) / 2;
  if (Math.abs(angle1 - angle2) > Math.PI) {
    midAngle += Math.PI;
  }
  
  const dist = 32;
  const textX = p2.x + Math.cos(midAngle) * dist;
  const textY = p2.y + Math.sin(midAngle) * dist;

  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  
  const text = `${angleVal}°`;
  ctx.font = 'bold 9px monospace';
  const textWidth = ctx.measureText(text).width;
  const boxW = textWidth + 8;
  const boxH = 14;
  
  ctx.beginPath();
  ctx.roundRect(textX - boxW / 2, textY - boxH / 2, boxW, boxH, 4);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, textX, textY);
  ctx.restore();
};

export const YoloSwingPlayer: React.FC<YoloSwingPlayerProps> = ({ videoId, swingScore = 80 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const proCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const { videos, analysis } = useData();
  const videoItem = videos.find(v => v.id === videoId);
  const analysisItem = analysis.find(a => a.videoId === videoId);
  const videoUrl = videoItem?.videoUrl || "https://assets.mixkit.co/videos/preview/mixkit-golf-player-swinging-his-driver-at-the-range-31580-large.mp4";

  // Playback & Analysis Mode States
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0 to 100
  const [speed, setSpeed] = useState<0.25 | 0.5 | 1>(1);
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [showAngles, setShowAngles] = useState(true);
  const [isCompareMode, setIsCompareMode] = useState(false);

  // Drawing markup states
  const [activeTool, setActiveTool] = useState<'none' | 'line' | 'circle'>('none');
  const [drawings, setDrawings] = useState<DrawingShape[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [currentPoint, setCurrentPoint] = useState<{ x: number; y: number } | null>(null);

  // ------------------------------------------------------------------
  // 5 standard swing phases keyframes coordinates (Fallback)
  // ------------------------------------------------------------------
  const defaultKeyframes = [
    {
      frame: 0,
      phase: 'address',
      head: { x: 200, y: 80 },
      shoulders: { x: 200, y: 110 },
      hips: { x: 195, y: 160 },
      lKnee: { x: 185, y: 190 },
      lFoot: { x: 180, y: 220 },
      rKnee: { x: 205, y: 190 },
      rFoot: { x: 210, y: 220 },
      wrists: { x: 198, y: 145 },
      clubHead: { x: 175, y: 220 },
    },
    {
      frame: 25,
      phase: 'backswing',
      head: { x: 198, y: 78 },
      shoulders: { x: 192, y: 110 },
      hips: { x: 192, y: 160 },
      lKnee: { x: 192, y: 190 },
      lFoot: { x: 180, y: 220 },
      rKnee: { x: 205, y: 190 },
      rFoot: { x: 210, y: 220 },
      wrists: { x: 155, y: 95 },
      clubHead: { x: 125, y: 65 },
    },
    {
      frame: 50,
      phase: 'downswing',
      head: { x: 200, y: 82 },
      shoulders: { x: 198, y: 110 },
      hips: { x: 198, y: 160 },
      lKnee: { x: 185, y: 190 },
      lFoot: { x: 180, y: 220 },
      rKnee: { x: 202, y: 190 },
      rFoot: { x: 210, y: 220 },
      wrists: { x: 185, y: 130 },
      clubHead: { x: 155, y: 105 },
    },
    {
      frame: 65,
      phase: 'impact',
      head: { x: 202, y: 84 },
      shoulders: { x: 204, y: 110 },
      hips: { x: 206, y: 158 },
      lKnee: { x: 180, y: 190 },
      lFoot: { x: 180, y: 220 },
      rKnee: { x: 200, y: 190 },
      rFoot: { x: 210, y: 220 },
      wrists: { x: 204, y: 145 },
      clubHead: { x: 195, y: 220 },
    },
    {
      frame: 100,
      phase: 'follow-through',
      head: { x: 215, y: 78 },
      shoulders: { x: 218, y: 105 },
      hips: { x: 216, y: 155 },
      lKnee: { x: 180, y: 190 },
      lFoot: { x: 180, y: 220 },
      rKnee: { x: 200, y: 190 },
      rFoot: { x: 208, y: 216 },
      wrists: { x: 238, y: 92 },
      clubHead: { x: 260, y: 65 },
    },
  ];
  
  const rawKeyframes = (analysisItem as any)?.poseKeyframes;
  const keyframes = Array.isArray(rawKeyframes) && rawKeyframes.length > 0
    ? rawKeyframes
    : defaultKeyframes;

  // ------------------------------------------------------------------
  // Perfect ideal PGA Pro reference golfer keyframes (Pro Compare Model)
  // ------------------------------------------------------------------
  const proKeyframes = [
    {
      frame: 0,
      phase: 'address',
      head: { x: 200, y: 75 },
      shoulders: { x: 200, y: 105 },
      hips: { x: 195, y: 155 },
      lKnee: { x: 185, y: 185 },
      lFoot: { x: 180, y: 220 },
      rKnee: { x: 205, y: 185 },
      rFoot: { x: 210, y: 220 },
      wrists: { x: 198, y: 140 },
      clubHead: { x: 175, y: 220 },
    },
    {
      frame: 25,
      phase: 'backswing',
      head: { x: 200, y: 74 }, // Perfectly stabilized head
      shoulders: { x: 194, y: 105 },
      hips: { x: 194, y: 155 },
      lKnee: { x: 190, y: 188 },
      lFoot: { x: 180, y: 220 },
      rKnee: { x: 204, y: 186 },
      rFoot: { x: 210, y: 220 },
      wrists: { x: 150, y: 90 }, // Higher hands, perfect wrist hinge!
      clubHead: { x: 120, y: 55 },
    },
    {
      frame: 50,
      phase: 'downswing',
      head: { x: 200, y: 76 },
      shoulders: { x: 198, y: 105 },
      hips: { x: 200, y: 155 },
      lKnee: { x: 182, y: 188 },
      lFoot: { x: 180, y: 220 },
      rKnee: { x: 200, y: 186 },
      rFoot: { x: 210, y: 220 },
      wrists: { x: 180, y: 125 }, // Perfect wrist lag maintenance!
      clubHead: { x: 145, y: 95 },
    },
    {
      frame: 65,
      phase: 'impact',
      head: { x: 200, y: 78 },
      shoulders: { x: 202, y: 105 },
      hips: { x: 210, y: 153 }, // Perfect open hips rotation
      lKnee: { x: 178, y: 185 },
      lFoot: { x: 180, y: 220 },
      rKnee: { x: 198, y: 188 },
      rFoot: { x: 210, y: 220 },
      wrists: { x: 206, y: 140 },
      clubHead: { x: 195, y: 220 },
    },
    {
      frame: 100,
      phase: 'follow-through',
      head: { x: 210, y: 74 },
      shoulders: { x: 215, y: 100 },
      hips: { x: 215, y: 150 },
      lKnee: { x: 178, y: 185 },
      lFoot: { x: 180, y: 220 },
      rKnee: { x: 198, y: 185 },
      rFoot: { x: 206, y: 212 },
      wrists: { x: 242, y: 88 },
      clubHead: { x: 265, y: 55 },
    },
  ];

  // Interpolation helper
  const interpolate = (start: number, end: number, factor: number) => {
    return start + (end - start) * factor;
  };

  // Get active joint positions for the current progress
  const getJointsForProgress = (p: number, dataKeyframes: typeof keyframes) => {
    if (!dataKeyframes || dataKeyframes.length === 0) {
      return getJointsForProgress(p, defaultKeyframes);
    }

    let startIndex = 0;
    let endIndex = 0;
    // Default to the last frame if progress exceeds max frame
    startIndex = dataKeyframes.length - 1;
    endIndex = dataKeyframes.length - 1;

    for (let i = 0; i < dataKeyframes.length - 1; i++) {
      if (p >= dataKeyframes[i].frame && p <= dataKeyframes[i + 1].frame) {
        startIndex = i;
        endIndex = i + 1;
        break;
      }
    }

    const startKf = dataKeyframes[startIndex];
    const endKf = dataKeyframes[endIndex];

    const range = endKf.frame - startKf.frame;
    const factor = range === 0 ? 0 : (p - startKf.frame) / range;

    const lerpJoint = (j: 'head' | 'shoulders' | 'hips' | 'lKnee' | 'lFoot' | 'rKnee' | 'rFoot' | 'wrists' | 'clubHead') => {
      return {
        x: interpolate(startKf[j].x, endKf[j].x, factor),
        y: interpolate(startKf[j].y, endKf[j].y, factor),
      };
    };

    return {
      phase: endKf.phase,
      head: lerpJoint('head'),
      shoulders: lerpJoint('shoulders'),
      hips: lerpJoint('hips'),
      lKnee: lerpJoint('lKnee'),
      lFoot: lerpJoint('lFoot'),
      rKnee: lerpJoint('rKnee'),
      rFoot: lerpJoint('rFoot'),
      wrists: lerpJoint('wrists'),
      clubHead: lerpJoint('clubHead'),
    };
  };

  // Synchronize HTML5 video playback with isPlaying state
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) {
      video.play().catch(err => console.warn('[Video] Play interrupted:', err));
    } else {
      video.pause();
    }
  }, [isPlaying]);

  // Synchronize speed with HTML5 video playbackRate
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = speed;
  }, [speed]);

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video || !video.duration) return;
    setProgress((video.currentTime / video.duration) * 100);
  };

  const handleProgressChange = (newProgress: number) => {
    setProgress(newProgress);
    setIsPlaying(false);
    const video = videoRef.current;
    if (video && video.duration) {
      video.currentTime = (newProgress / 100) * video.duration;
    }
  };

  // Playback timer loop (ONLY for baseline canvas mode when videoUrl is null)
  useEffect(() => {
    if (videoUrl) return; 

    let animFrame: number;
    let lastTime = Date.now();

    const loop = () => {
      if (isPlaying) {
        const now = Date.now();
        const delta = now - lastTime;
        lastTime = now;

        setProgress((prev) => {
          const next = prev + (delta * 0.02 * speed);
          return next >= 100 ? 0 : next; 
        });
      } else {
        lastTime = Date.now();
      }
      animFrame = requestAnimationFrame(loop);
    };

    animFrame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrame);
  }, [isPlaying, speed, videoUrl]);

  // ------------------------------------------------------------------
  // 1. Draw loop for User's Swing Canvas
  // ------------------------------------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw golf grid backdrop (ONLY if no real videoUrl is present)
    if (!videoUrl) {
      ctx.fillStyle = 'hsl(150,15%,5%)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = 'rgba(255,255,255,0.03)';
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 30) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(195, 220, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    // --- Letterbox alignment math for object-contain ---
    const video = videoRef.current;
    let drawW = canvas.width;
    let drawH = canvas.height;
    let drawX = 0;
    let drawY = 0;

    if (video && video.videoWidth > 0 && video.videoHeight > 0) {
      const videoAspect = video.videoWidth / video.videoHeight;
      const canvasAspect = canvas.width / canvas.height;

      if (videoAspect > canvasAspect) {
        drawW = canvas.width;
        drawH = canvas.width / videoAspect;
        drawY = (canvas.height - drawH) / 2;
      } else {
        drawH = canvas.height;
        drawW = canvas.height * videoAspect;
        drawX = (canvas.width - drawW) / 2;
      }
    }

    const mapPoint = (joint: {x: number, y: number}) => {
      // Un-scale the 400x300 Python normalization
      const x_norm = joint.x / 400;
      const y_norm = joint.y / 300;
      return {
        x: drawX + x_norm * drawW,
        y: drawY + y_norm * drawH
      };
    };

    const rawPose = getJointsForProgress(progress, keyframes);
    const pose = {
      phase: rawPose.phase,
      head: mapPoint(rawPose.head),
      shoulders: mapPoint(rawPose.shoulders),
      hips: mapPoint(rawPose.hips),
      lKnee: mapPoint(rawPose.lKnee),
      lFoot: mapPoint(rawPose.lFoot),
      rKnee: mapPoint(rawPose.rKnee),
      rFoot: mapPoint(rawPose.rFoot),
      wrists: mapPoint(rawPose.wrists),
      clubHead: mapPoint(rawPose.clubHead)
    };

    // Draw standard vector body outlines
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'hsl(150,10%,30%)';

    // Left Leg
    ctx.beginPath();
    ctx.moveTo(pose.hips.x, pose.hips.y);
    ctx.lineTo(pose.lKnee.x, pose.lKnee.y);
    ctx.lineTo(pose.lFoot.x, pose.lFoot.y);
    ctx.stroke();

    // Right Leg
    ctx.beginPath();
    ctx.moveTo(pose.hips.x, pose.hips.y);
    ctx.lineTo(pose.rKnee.x, pose.rKnee.y);
    ctx.lineTo(pose.rFoot.x, pose.rFoot.y);
    ctx.stroke();

    // Torso
    ctx.beginPath();
    ctx.moveTo(pose.hips.x, pose.hips.y);
    ctx.lineTo(pose.shoulders.x, pose.shoulders.y);
    ctx.stroke();

    // Arms
    ctx.beginPath();
    ctx.moveTo(pose.shoulders.x, pose.shoulders.y);
    ctx.lineTo(pose.wrists.x, pose.wrists.y);
    ctx.stroke();

    // Club Shaft
    ctx.strokeStyle = '#d1d5db';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(pose.wrists.x, pose.wrists.y);
    ctx.lineTo(pose.clubHead.x, pose.clubHead.y);
    ctx.stroke();

    // Club Head
    ctx.fillStyle = '#4b5563';
    ctx.beginPath();
    ctx.arc(pose.clubHead.x, pose.clubHead.y, 4, 0, Math.PI * 2);
    ctx.fill();

    // Head
    ctx.fillStyle = 'hsl(150,10%,40%)';
    ctx.beginPath();
    ctx.arc(pose.head.x, pose.head.y, 10, 0, Math.PI * 2);
    ctx.fill();

    // Glowing YOLO Skeleton Overlay
    if (showSkeleton) {
      ctx.shadowBlur = 10;
      ctx.shadowColor = 'rgba(0, 255, 128, 0.8)';
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#00ff80'; // Neon green

      ctx.beginPath();
      ctx.moveTo(pose.head.x, pose.head.y);
      ctx.lineTo(pose.shoulders.x, pose.shoulders.y);
      ctx.moveTo(pose.shoulders.x, pose.shoulders.y);
      ctx.lineTo(pose.hips.x, pose.hips.y);
      ctx.moveTo(pose.hips.x, pose.hips.y);
      ctx.lineTo(pose.lKnee.x, pose.lKnee.y);
      ctx.lineTo(pose.lFoot.x, pose.lFoot.y);
      ctx.moveTo(pose.hips.x, pose.hips.y);
      ctx.lineTo(pose.rKnee.x, pose.rKnee.y);
      ctx.lineTo(pose.rFoot.x, pose.rFoot.y);
      ctx.moveTo(pose.shoulders.x, pose.shoulders.y);
      ctx.lineTo(pose.wrists.x, pose.wrists.y);
      ctx.stroke();

      ctx.strokeStyle = '#fbbf24'; // Neon Gold club trace
      ctx.beginPath();
      ctx.moveTo(pose.wrists.x, pose.wrists.y);
      ctx.lineTo(pose.clubHead.x, pose.clubHead.y);
      ctx.stroke();

      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ff3366'; // Glowing keypoint nodes

      const joints = [
        pose.head, pose.shoulders, pose.hips,
        pose.lKnee, pose.lFoot, pose.rKnee, pose.rFoot,
        pose.wrists
      ];

      joints.forEach((joint) => {
        ctx.fillStyle = '#ff3366';
        ctx.beginPath();
        ctx.arc(joint.x, joint.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(pose.clubHead.x, pose.clubHead.y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();
    }

    // Dynamic Ball Flight Trajectory Tracking
    if (progress >= 65) {
      // Impact is at frame 65
      const impactRaw = getJointsForProgress(65, keyframes);
      const impactClub = mapPoint(impactRaw.clubHead);
      
      const flightProgress = Math.min(1, (progress - 65) / 35); // 0 to 1
      
      // Calculate realistic ball trajectory (parabolic)
      const ballEndX = impactClub.x + 200; // Ball travels forward
      const ballEndY = impactClub.y - 120; // Ball travels up
      const ctrlX = impactClub.x + 80;
      const ctrlY = impactClub.y - 150;
      
      const ballX = Math.pow(1 - flightProgress, 2) * impactClub.x + 
                    2 * (1 - flightProgress) * flightProgress * ctrlX + 
                    Math.pow(flightProgress, 2) * ballEndX;
                    
      const ballY = Math.pow(1 - flightProgress, 2) * impactClub.y + 
                    2 * (1 - flightProgress) * flightProgress * ctrlY + 
                    Math.pow(flightProgress, 2) * ballEndY;
                    
      // Trace Line
      ctx.beginPath();
      ctx.moveTo(impactClub.x, impactClub.y);
      ctx.quadraticCurveTo(ctrlX, ctrlY, ballX, ballY);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.setLineDash([5, 5]);
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Glowing Golf Ball
      ctx.beginPath();
      ctx.arc(ballX, ballY, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.shadowBlur = 12;
      ctx.shadowColor = '#00ffff';
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // Biomechanical Joint Angle Calculator (Overlay)
    if (showAngles) {
      const lKneeAngle = calculateAngle(pose.hips, pose.lKnee, pose.lFoot);
      const rKneeAngle = calculateAngle(pose.hips, pose.rKnee, pose.rFoot);
      const lHipAngle = calculateAngle(pose.shoulders, pose.hips, pose.lKnee);

      drawAngleArc(ctx, pose.hips, pose.lKnee, pose.lFoot, lKneeAngle, '#00ff80');
      drawAngleArc(ctx, pose.hips, pose.rKnee, pose.rFoot, rKneeAngle, '#00ff80');
      drawAngleArc(ctx, pose.shoulders, pose.hips, pose.lKnee, lHipAngle, '#fbbf24');
    }

    // User drawn swing markups
    ctx.shadowBlur = 8;
    drawings.forEach((shape) => {
      ctx.strokeStyle = shape.color;
      ctx.fillStyle = shape.color;
      ctx.shadowColor = shape.color;
      ctx.lineWidth = 3;

      if (shape.type === 'line') {
        ctx.beginPath();
        ctx.moveTo(shape.startX, shape.startY);
        ctx.lineTo(shape.endX, shape.endY);
        ctx.stroke();
      } else if (shape.type === 'circle') {
        const dx = shape.endX - shape.startX;
        const dy = shape.endY - shape.startY;
        const radius = Math.sqrt(dx * dx + dy * dy);
        ctx.beginPath();
        ctx.arc(shape.startX, shape.startY, radius, 0, Math.PI * 2);
        ctx.stroke();
      }
    });

    // Active markup preview drawing
    if (isDrawing && startPoint && currentPoint) {
      ctx.strokeStyle = 'rgba(255, 51, 102, 0.9)';
      ctx.shadowColor = 'rgba(255, 51, 102, 0.9)';
      ctx.lineWidth = 3;

      if (activeTool === 'line') {
        ctx.beginPath();
        ctx.moveTo(startPoint.x, startPoint.y);
        ctx.lineTo(currentPoint.x, currentPoint.y);
        ctx.stroke();
      } else if (activeTool === 'circle') {
        const dx = currentPoint.x - startPoint.x;
        const dy = currentPoint.y - startPoint.y;
        const radius = Math.sqrt(dx * dx + dy * dy);
        ctx.beginPath();
        ctx.arc(startPoint.x, startPoint.y, radius, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    ctx.shadowBlur = 0;
  }, [progress, showSkeleton, showAngles, drawings, isDrawing, startPoint, currentPoint, activeTool, videoUrl]);

  // ------------------------------------------------------------------
  // 2. Draw loop for PGA Pro Sync Reference Canvas
  // ------------------------------------------------------------------
  useEffect(() => {
    if (!isCompareMode) return;
    const canvas = proCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dynamic high-tech green matrix grid for Pro Model
    ctx.fillStyle = 'hsl(155, 25%, 3%)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = 'rgba(16, 185, 129, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Golf Ball Pro Setup
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(195, 220, 5, 0, Math.PI * 2);
    ctx.fill();

    const pose = getJointsForProgress(progress, proKeyframes);

    // Draw Vector Body
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)'; // Sleek emerald green

    // Left Leg
    ctx.beginPath();
    ctx.moveTo(pose.hips.x, pose.hips.y);
    ctx.lineTo(pose.lKnee.x, pose.lKnee.y);
    ctx.lineTo(pose.lFoot.x, pose.lFoot.y);
    ctx.stroke();

    // Right Leg
    ctx.beginPath();
    ctx.moveTo(pose.hips.x, pose.hips.y);
    ctx.lineTo(pose.rKnee.x, pose.rKnee.y);
    ctx.lineTo(pose.rFoot.x, pose.rFoot.y);
    ctx.stroke();

    // Torso
    ctx.beginPath();
    ctx.moveTo(pose.hips.x, pose.hips.y);
    ctx.lineTo(pose.shoulders.x, pose.shoulders.y);
    ctx.stroke();

    // Arms
    ctx.beginPath();
    ctx.moveTo(pose.shoulders.x, pose.shoulders.y);
    ctx.lineTo(pose.wrists.x, pose.wrists.y);
    ctx.stroke();

    // Club Shaft (Pro gold path)
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(pose.wrists.x, pose.wrists.y);
    ctx.lineTo(pose.clubHead.x, pose.clubHead.y);
    ctx.stroke();

    // Club Head
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(pose.clubHead.x, pose.clubHead.y, 4, 0, Math.PI * 2);
    ctx.fill();

    // Head
    ctx.fillStyle = 'rgba(16, 185, 129, 0.5)';
    ctx.beginPath();
    ctx.arc(pose.head.x, pose.head.y, 10, 0, Math.PI * 2);
    ctx.fill();

    // Pro glowing YOLO skeleton overlay
    if (showSkeleton) {
      ctx.shadowBlur = 10;
      ctx.shadowColor = 'rgba(16, 185, 129, 0.8)';
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#10b981'; // Vivid emerald

      ctx.beginPath();
      ctx.moveTo(pose.head.x, pose.head.y);
      ctx.lineTo(pose.shoulders.x, pose.shoulders.y);
      ctx.moveTo(pose.shoulders.x, pose.shoulders.y);
      ctx.lineTo(pose.hips.x, pose.hips.y);
      ctx.moveTo(pose.hips.x, pose.hips.y);
      ctx.lineTo(pose.lKnee.x, pose.lKnee.y);
      ctx.lineTo(pose.lFoot.x, pose.lFoot.y);
      ctx.moveTo(pose.hips.x, pose.hips.y);
      ctx.lineTo(pose.rKnee.x, pose.rKnee.y);
      ctx.lineTo(pose.rFoot.x, pose.rFoot.y);
      ctx.moveTo(pose.shoulders.x, pose.shoulders.y);
      ctx.lineTo(pose.wrists.x, pose.wrists.y);
      ctx.stroke();

      ctx.shadowBlur = 0;
      ctx.fillStyle = '#10b981';
      
      const joints = [
        pose.head, pose.shoulders, pose.hips,
        pose.lKnee, pose.lFoot, pose.rKnee, pose.rFoot,
        pose.wrists
      ];
      joints.forEach((j) => {
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.arc(j.x, j.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();
      });
    }

    // Biomechanical Joint Angle Calculator for Pro reference
    if (showAngles) {
      const lKneeAngle = calculateAngle(pose.hips, pose.lKnee, pose.lFoot);
      const rKneeAngle = calculateAngle(pose.hips, pose.rKnee, pose.rFoot);
      const lHipAngle = calculateAngle(pose.shoulders, pose.hips, pose.lKnee);

      drawAngleArc(ctx, pose.hips, pose.lKnee, pose.lFoot, lKneeAngle, '#10b981');
      drawAngleArc(ctx, pose.hips, pose.rKnee, pose.rFoot, rKneeAngle, '#10b981');
      drawAngleArc(ctx, pose.shoulders, pose.hips, pose.lKnee, lHipAngle, '#fbbf24');
    }
  }, [progress, showSkeleton, showAngles, isCompareMode]);

  // Drawing event handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeTool === 'none') return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDrawing(true);
    setStartPoint({ x, y });
    setCurrentPoint({ x, y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !startPoint) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setCurrentPoint({ x, y });
  };

  const handleMouseUp = () => {
    if (!isDrawing || !startPoint || !currentPoint) return;

    if (activeTool !== 'none') {
      const newShape: DrawingShape = {
        type: activeTool,
        startX: startPoint.x,
        startY: startPoint.y,
        endX: currentPoint.x,
        endY: currentPoint.y,
        color: 'hsl(45,80%,55%)', // Neon Gold markup
      };
      setDrawings((prev) => [...prev, newShape]);
    }

    setIsDrawing(false);
    setStartPoint(null);
    setCurrentPoint(null);
  };

  const clearDrawings = () => {
    setDrawings([]);
  };

  const activePose = getJointsForProgress(progress, keyframes);

  return (
    <div className="golf-card overflow-hidden flex flex-col h-full bg-slate-900 border border-slate-800" ref={containerRef}>
      {/* Header toolbar */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-950/80 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Video className="text-gold animate-pulse" size={16} />
          <span className="text-sm font-semibold tracking-wide font-display text-slate-200 uppercase">YOLO Pose Sync Analysis</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/20">
            YOLO v8 active
          </span>
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-gold/10 text-gold border border-gold/20 flex items-center gap-1">
            <Sparkles size={10} /> Active Frame: {Math.round(progress)}%
          </span>
        </div>
      </div>

      {/* Advanced Biomechanical Markups & Compare Action Bars */}
      <div className="flex flex-wrap items-center justify-between px-3 py-2 bg-slate-950/40 border-b border-slate-850 gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted-foreground mr-1">Markup Tools:</span>
          <button
            onClick={() => setActiveTool('line')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
              activeTool === 'line' ? 'bg-primary text-primary-foreground shadow-md' : 'bg-muted hover:bg-muted/80 text-muted-foreground'
            }`}
            title="Draw Spine/Shaft Alignment Line"
          >
            <MoveRight size={13} /> Line
          </button>
          <button
            onClick={() => setActiveTool('circle')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
              activeTool === 'circle' ? 'bg-primary text-primary-foreground shadow-md' : 'bg-muted hover:bg-muted/80 text-muted-foreground'
            }`}
            title="Draw Head Stability Circle"
          >
            <Circle size={13} /> Circle
          </button>
          {drawings.length > 0 && (
            <button
              onClick={clearDrawings}
              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20 transition-all flex items-center gap-1"
            >
              <RotateCcw size={12} /> Clear ({drawings.length})
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {/* Biomechanical Angles toggle */}
          <button
            onClick={() => setShowAngles(!showAngles)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              showAngles ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-muted text-muted-foreground'
            }`}
            title="Toggle calculated knee/hip angles"
          >
            <Activity size={13} />
            Angles: {showAngles ? 'ON' : 'OFF'}
          </button>

          {/* Side-by-Side Pro Comparison toggle */}
          <button
            onClick={() => setIsCompareMode(!isCompareMode)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              isCompareMode ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold shadow-lg shadow-emerald-500/5' : 'bg-muted hover:bg-muted/80 text-muted-foreground'
            }`}
            title="Compare your swing with a perfect PGA Pro side-by-side"
          >
            <GitCompare size={13} />
            Compare Pro: {isCompareMode ? 'ACTIVE' : 'OFF'}
          </button>

          {/* Skeleton toggle */}
          <button
            onClick={() => setShowSkeleton(!showSkeleton)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
              showSkeleton ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-muted text-muted-foreground'
            }`}
            title="Toggle YOLO skeleton overlay"
          >
            {showSkeleton ? <Eye size={13} /> : <EyeOff size={13} />}
          </button>
        </div>
      </div>

      {/* Video / Canvas Split-Screen Responsive Viewport */}
      <div className={`relative flex-grow flex flex-col ${isCompareMode ? 'lg:flex-row' : 'items-center justify-center'} bg-black p-4 gap-6 select-none min-h-[300px]`}>
        
        {/* PANEL 1: USER GOLFER VIEW */}
        <div className="relative w-[400px] h-[260px] max-w-full flex items-center justify-center border border-slate-800 rounded-lg overflow-hidden shadow-2xl">
          {videoUrl && (
            <video
              ref={videoRef}
              src={videoUrl}
              onTimeUpdate={handleTimeUpdate}
              className="absolute inset-0 w-full h-full object-contain"
              muted
              playsInline
            />
          )}
          <canvas
            ref={canvasRef}
            width={400}
            height={260}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            className={`absolute inset-0 w-full h-full bg-transparent ${
              activeTool !== 'none' ? 'cursor-crosshair' : 'cursor-default'
            }`}
          />
          {/* Label Tag */}
          <div className="absolute top-3 right-3 px-2 py-0.5 rounded bg-blue-600/90 text-[9px] font-bold text-white uppercase tracking-wider shadow-md backdrop-blur-sm">
            Your Swing
          </div>
        </div>

        {/* PANEL 2: PGA PRO Sync REFERENCE VIEW */}
        {isCompareMode && (
          <div className="relative w-[400px] h-[260px] max-w-full flex items-center justify-center border border-emerald-500/20 rounded-lg overflow-hidden shadow-2xl animate-fade-in">
            <canvas
              ref={proCanvasRef}
              width={400}
              height={260}
              className="absolute inset-0 w-full h-full"
            />
            {/* Label Tag */}
            <div className="absolute top-3 right-3 px-2 py-0.5 rounded bg-emerald-600/90 text-[9px] font-bold text-white uppercase tracking-wider shadow-md backdrop-blur-sm flex items-center gap-1 border border-emerald-500/20">
              <Sparkles size={9} /> PGA Pro Model
            </div>
          </div>
        )}

        {/* Phase overlay inside video */}
        <div className="absolute top-6 left-6 px-3 py-1 rounded bg-slate-950/80 border border-slate-850 backdrop-blur-sm select-none">
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold font-display">Active Phase</p>
          <p className="text-xs font-bold text-gold uppercase tracking-wide font-display">{activePose.phase}</p>
        </div>

        {/* Click-to-draw hint */}
        {activeTool !== 'none' && (
          <div className="absolute bottom-6 left-6 px-3 py-1 rounded bg-gold/10 text-gold border border-gold/20 flex items-center gap-1.5 text-xs backdrop-blur-sm shadow-lg">
            <ShieldAlert size={12} className="animate-bounce" /> Click and drag on video to draw marks
          </div>
        )}
      </div>

      {/* Synchronized Timeline & Control bars */}
      <div className="px-4 py-3 bg-slate-950/80 border-t border-slate-800 space-y-2">
        {/* Playback Progress Slider */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground w-8">0.0s</span>
          <input
            type="range"
            min={0}
            max={100}
            value={progress}
            onChange={(e) => {
              handleProgressChange(Number(e.target.value));
            }}
            className="flex-grow h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-gold"
          />
          <span className="text-xs text-muted-foreground w-8">0.8s</span>
        </div>

        {/* Buttons Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-10 h-10 rounded-full bg-primary text-primary-foreground hover:bg-primary/95 shadow-md flex items-center justify-center transition-transform hover:scale-105"
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} className="translate-x-0.5" />}
            </button>
            <button
              onClick={() => {
                setProgress(0);
                setIsPlaying(false);
                const video = videoRef.current;
                if (video) video.currentTime = 0;
              }}
              className="w-8 h-8 rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 flex items-center justify-center transition-colors"
              title="Reset Frame"
            >
              <RotateCcw size={14} />
            </button>
          </div>

          {/* Unified speed controller */}
          <div className="flex items-center gap-1 rounded-lg bg-slate-900 border border-slate-800 p-0.5">
            {([0.25, 0.5, 1] as const).map((spd) => (
              <button
                key={spd}
                onClick={() => setSpeed(spd)}
                className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                  speed === spd ? 'bg-gold text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
