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

type JointCoord = { x: number; y: number };
type PoseJointName =
  | 'head'
  | 'lShoulder'
  | 'rShoulder'
  | 'lElbow'
  | 'rElbow'
  | 'lWrist'
  | 'rWrist'
  | 'lHip'
  | 'rHip'
  | 'lKnee'
  | 'rKnee'
  | 'lFoot'
  | 'rFoot'
  | 'lAnkle'
  | 'rAnkle'
  | 'shoulders'
  | 'hips'
  | 'wrists'
  | 'clubHead';

type PoseFrame = {
  frame: number;
  phase: string;
} & Partial<Record<PoseJointName, JointCoord>>;

const BODY_JOINTS: PoseJointName[] = [
  'head',
  'lShoulder',
  'rShoulder',
  'lElbow',
  'rElbow',
  'lWrist',
  'rWrist',
  'lHip',
  'rHip',
  'lKnee',
  'rKnee',
  'lAnkle',
  'rAnkle',
];

const BODY_SEGMENTS: [PoseJointName, PoseJointName][] = [
  ['head', 'lShoulder'],
  ['head', 'rShoulder'],
  ['lShoulder', 'rShoulder'],
  ['lShoulder', 'lElbow'],
  ['lElbow', 'lWrist'],
  ['rShoulder', 'rElbow'],
  ['rElbow', 'rWrist'],
  ['lShoulder', 'lHip'],
  ['rShoulder', 'rHip'],
  ['lHip', 'rHip'],
  ['lHip', 'lKnee'],
  ['lKnee', 'lAnkle'],
  ['rHip', 'rKnee'],
  ['rKnee', 'rAnkle'],
];

/** Convert stored joint coords (0-1 normalized or legacy 400x300) to 0-1 range. */
const normalizeJointCoord = (joint: JointCoord): JointCoord => {
  if (joint.x <= 1 && joint.y <= 1 && joint.x >= 0 && joint.y >= 0) {
    return { x: joint.x, y: joint.y };
  }
  return { x: joint.x / 400, y: joint.y / 300 };
};

/** Letterbox rect for object-contain video inside canvas. */
const computeVideoLetterbox = (
  canvasW: number,
  canvasH: number,
  videoW: number,
  videoH: number
) => {
  if (!videoW || !videoH) {
    return { drawX: 0, drawY: 0, drawW: canvasW, drawH: canvasH };
  }
  const videoAspect = videoW / videoH;
  const canvasAspect = canvasW / canvasH;
  if (videoAspect > canvasAspect) {
    const drawW = canvasW;
    const drawH = canvasW / videoAspect;
    return { drawX: 0, drawY: (canvasH - drawH) / 2, drawW, drawH };
  }
  const drawH = canvasH;
  const drawW = canvasH * videoAspect;
  return { drawX: (canvasW - drawW) / 2, drawY: 0, drawW, drawH };
};

const mapJointToCanvas = (
  joint: JointCoord,
  letterbox: { drawX: number; drawY: number; drawW: number; drawH: number }
) => {
  const norm = normalizeJointCoord(joint);
  return {
    x: letterbox.drawX + norm.x * letterbox.drawW,
    y: letterbox.drawY + norm.y * letterbox.drawH,
  };
};

const resolvePoseJoint = (pose: PoseFrame, name: PoseJointName): JointCoord | undefined => {
  if (pose[name]) return pose[name];
  if (name === 'lShoulder' || name === 'rShoulder') return pose.shoulders;
  if (name === 'lHip' || name === 'rHip') return pose.hips;
  if (name === 'lWrist' || name === 'rWrist' || name === 'lElbow' || name === 'rElbow') return pose.wrists;
  if (name === 'lAnkle') return pose.lFoot;
  if (name === 'rAnkle') return pose.rFoot;
  if (name === 'lFoot') return pose.lAnkle;
  if (name === 'rFoot') return pose.rAnkle;
  return undefined;
};

const hasDetailedBodyPose = (pose: PoseFrame): boolean => (
  Boolean(
    pose.lShoulder &&
    pose.rShoulder &&
    pose.lHip &&
    pose.rHip
  )
);

const drawBodySkeleton = (
  ctx: CanvasRenderingContext2D,
  pose: PoseFrame,
  showDetailed = true
) => {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.shadowBlur = 10;
  ctx.shadowColor = 'rgba(34, 211, 238, 0.55)';
  ctx.strokeStyle = showDetailed ? 'rgba(16, 185, 129, 0.88)' : '#00ff80';
  ctx.lineWidth = showDetailed ? 2.5 : 3;

  if (showDetailed && hasDetailedBodyPose(pose)) {
    BODY_SEGMENTS.forEach(([from, to]) => {
      const a = resolvePoseJoint(pose, from);
      const b = resolvePoseJoint(pose, to);
      if (!a || !b) return;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    });

    ctx.shadowBlur = 8;
    BODY_JOINTS.forEach((name) => {
      const joint = resolvePoseJoint(pose, name);
      if (!joint) return;
      ctx.fillStyle = name === 'head' ? '#67e8f9' : '#22c55e';
      ctx.beginPath();
      ctx.arc(joint.x, joint.y, name === 'head' ? 4.5 : 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.86)';
      ctx.lineWidth = 1.2;
      ctx.stroke();
    });

    ctx.restore();
    return;
  }

  const requiredLegacy = [pose.head, pose.shoulders, pose.hips, pose.lKnee, pose.lFoot, pose.rKnee, pose.rFoot, pose.wrists];
  if (requiredLegacy.some((joint) => !joint)) {
    ctx.restore();
    return;
  }

  ctx.beginPath();
  ctx.moveTo(pose.head!.x, pose.head!.y);
  ctx.lineTo(pose.shoulders!.x, pose.shoulders!.y);
  ctx.lineTo(pose.hips!.x, pose.hips!.y);
  ctx.lineTo(pose.lKnee!.x, pose.lKnee!.y);
  ctx.lineTo(pose.lFoot!.x, pose.lFoot!.y);
  ctx.moveTo(pose.hips!.x, pose.hips!.y);
  ctx.lineTo(pose.rKnee!.x, pose.rKnee!.y);
  ctx.lineTo(pose.rFoot!.x, pose.rFoot!.y);
  ctx.moveTo(pose.shoulders!.x, pose.shoulders!.y);
  ctx.lineTo(pose.wrists!.x, pose.wrists!.y);
  ctx.stroke();

  ctx.shadowBlur = 0;
  requiredLegacy.forEach((joint) => {
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.arc(joint!.x, joint!.y, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.4;
    ctx.stroke();
  });
  ctx.restore();
};

/** Detect old server-side fake fallback skeleton (centered dummy, not real YOLO). */
const isFakeFallbackKeyframes = (kfs: unknown): boolean => {
  if (!Array.isArray(kfs) || kfs.length === 0) return false;
  const head = (kfs[0] as { head?: JointCoord })?.head;
  if (!head) return false;
  if (Math.abs(head.x - 200) < 25 && Math.abs(head.y - 80) < 25 && kfs.length <= 6) return true;
  if (head.x <= 1 && head.y <= 1 && Math.abs(head.x - 0.5) < 0.08 && Math.abs(head.y - 0.27) < 0.08 && kfs.length <= 6) {
    return true;
  }
  return false;
};

export const YoloSwingPlayer: React.FC<YoloSwingPlayerProps> = ({ videoId, swingScore = 80 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const proCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const { videos, analysis, reanalyzeVideo } = useData();
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
  const [videoReady, setVideoReady] = useState(false);
  const [reanalyzing, setReanalyzing] = useState(false);
  const progressRef = useRef(0);
  const lastSliderUpdateRef = useRef(0);

  // ------------------------------------------------------------------
  // 5 standard swing phases keyframes coordinates (Fallback)
  // ------------------------------------------------------------------
  const defaultKeyframes: PoseFrame[] = [
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
  const poseSource = (analysisItem as any)?.poseSource as string | undefined;
  const analysisVideoW = (analysisItem as any)?.videoWidth as number | undefined;
  const analysisVideoH = (analysisItem as any)?.videoHeight as number | undefined;
  const hasYoloKeyframes = Array.isArray(rawKeyframes) && rawKeyframes.length > 0 && !isFakeFallbackKeyframes(rawKeyframes);
  const keyframes: PoseFrame[] = hasYoloKeyframes
    ? rawKeyframes
    : videoUrl
      ? []
      : defaultKeyframes;
  const isLiveYoloScan = hasYoloKeyframes && poseSource !== 'fallback';

  useEffect(() => {
    setVideoReady(false);
  }, [videoUrl]);

  const handleVideoReady = () => {
    setVideoReady(true);
  };

  // ------------------------------------------------------------------
  // Perfect ideal PGA Pro reference golfer keyframes (Pro Compare Model)
  // ------------------------------------------------------------------
  const proKeyframes: PoseFrame[] = [
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
  const getJointsForProgress = (p: number, dataKeyframes: PoseFrame[], allowDemoFallback = true): PoseFrame => {
    if (!dataKeyframes || dataKeyframes.length === 0) {
      if (allowDemoFallback && !videoUrl) {
        return getJointsForProgress(p, defaultKeyframes, false);
      }
      return {
        frame: p,
        phase: 'address',
        head: { x: 0, y: 0 },
        lShoulder: { x: 0, y: 0 },
        rShoulder: { x: 0, y: 0 },
        lElbow: { x: 0, y: 0 },
        rElbow: { x: 0, y: 0 },
        lWrist: { x: 0, y: 0 },
        rWrist: { x: 0, y: 0 },
        lHip: { x: 0, y: 0 },
        rHip: { x: 0, y: 0 },
        shoulders: { x: 0, y: 0 },
        hips: { x: 0, y: 0 },
        lKnee: { x: 0, y: 0 },
        lFoot: { x: 0, y: 0 },
        rKnee: { x: 0, y: 0 },
        rFoot: { x: 0, y: 0 },
        lAnkle: { x: 0, y: 0 },
        rAnkle: { x: 0, y: 0 },
        wrists: { x: 0, y: 0 },
        clubHead: { x: 0, y: 0 },
      };
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

    const lerpJoint = (j: PoseJointName) => {
      const start = resolvePoseJoint(startKf, j);
      const end = resolvePoseJoint(endKf, j);
      if (!start || !end) return undefined;
      return {
        x: interpolate(start.x, end.x, factor),
        y: interpolate(start.y, end.y, factor),
      };
    };

    return {
      phase: endKf.phase,
      frame: p,
      head: lerpJoint('head'),
      lShoulder: lerpJoint('lShoulder'),
      rShoulder: lerpJoint('rShoulder'),
      lElbow: lerpJoint('lElbow'),
      rElbow: lerpJoint('rElbow'),
      lWrist: lerpJoint('lWrist'),
      rWrist: lerpJoint('rWrist'),
      lHip: lerpJoint('lHip'),
      rHip: lerpJoint('rHip'),
      shoulders: lerpJoint('shoulders'),
      hips: lerpJoint('hips'),
      lKnee: lerpJoint('lKnee'),
      lFoot: lerpJoint('lFoot'),
      rKnee: lerpJoint('rKnee'),
      rFoot: lerpJoint('rFoot'),
      lAnkle: lerpJoint('lAnkle') || lerpJoint('lFoot'),
      rAnkle: lerpJoint('rAnkle') || lerpJoint('rFoot'),
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
    const p = (video.currentTime / video.duration) * 100;
    progressRef.current = p;
    const now = Date.now();
    if (now - lastSliderUpdateRef.current > 120) {
      setProgress(p);
      lastSliderUpdateRef.current = now;
    }
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

  // Canvas draw loop — rAF for smooth playback without React re-render lag
  const drawStateRef = useRef({
    showSkeleton,
    showAngles,
    keyframes,
    videoUrl,
    isLiveYoloScan,
    analysisVideoW: 0,
    analysisVideoH: 0,
    drawings,
    isDrawing,
    startPoint,
    currentPoint,
    activeTool,
  });
  drawStateRef.current = {
    showSkeleton,
    showAngles,
    keyframes,
    videoUrl,
    isLiveYoloScan,
    analysisVideoW: analysisVideoW || 0,
    analysisVideoH: analysisVideoH || 0,
    drawings,
    isDrawing,
    startPoint,
    currentPoint,
    activeTool,
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let rafId = 0;

    const draw = () => {
      const ctx = canvas.getContext('2d');
      const video = videoRef.current;
      if (!ctx) {
        rafId = requestAnimationFrame(draw);
        return;
      }

      const ds = drawStateRef.current;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (!ds.videoUrl) {
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

      const letterbox = computeVideoLetterbox(
        canvas.width,
        canvas.height,
        ds.analysisVideoW || video?.videoWidth || 0,
        ds.analysisVideoH || video?.videoHeight || 0
      );
      const mapPoint = (joint: JointCoord) => mapJointToCanvas(joint, letterbox);

      const currentProgress = video?.duration
        ? (video.currentTime / video.duration) * 100
        : progressRef.current;

      const rawPose = getJointsForProgress(currentProgress, ds.keyframes, !ds.videoUrl);
      const mapOptionalPoint = (joint?: JointCoord) => joint ? mapPoint(joint) : undefined;
      const pose: PoseFrame = {
        frame: rawPose.frame,
        phase: rawPose.phase,
        head: mapOptionalPoint(rawPose.head),
        lShoulder: mapOptionalPoint(rawPose.lShoulder),
        rShoulder: mapOptionalPoint(rawPose.rShoulder),
        lElbow: mapOptionalPoint(rawPose.lElbow),
        rElbow: mapOptionalPoint(rawPose.rElbow),
        lWrist: mapOptionalPoint(rawPose.lWrist),
        rWrist: mapOptionalPoint(rawPose.rWrist),
        lHip: mapOptionalPoint(rawPose.lHip),
        rHip: mapOptionalPoint(rawPose.rHip),
        shoulders: mapOptionalPoint(rawPose.shoulders),
        hips: mapOptionalPoint(rawPose.hips),
        lKnee: mapOptionalPoint(rawPose.lKnee),
        lFoot: mapOptionalPoint(rawPose.lFoot),
        rKnee: mapOptionalPoint(rawPose.rKnee),
        rFoot: mapOptionalPoint(rawPose.rFoot),
        lAnkle: mapOptionalPoint(rawPose.lAnkle),
        rAnkle: mapOptionalPoint(rawPose.rAnkle),
        wrists: mapOptionalPoint(rawPose.wrists),
        clubHead: mapOptionalPoint(rawPose.clubHead),
      };

      if (ds.showSkeleton && (ds.isLiveYoloScan || !ds.videoUrl)) {
        drawBodySkeleton(ctx, pose, true);

        if (pose.wrists && pose.clubHead) {
          ctx.save();
          ctx.strokeStyle = '#fbbf24';
          ctx.lineWidth = 2.5;
          ctx.shadowBlur = 8;
          ctx.shadowColor = 'rgba(251, 191, 36, 0.7)';
          ctx.beginPath();
          ctx.moveTo(pose.wrists.x, pose.wrists.y);
          ctx.lineTo(pose.clubHead.x, pose.clubHead.y);
          ctx.stroke();

          ctx.fillStyle = '#fbbf24';
          ctx.beginPath();
          ctx.arc(pose.clubHead.x, pose.clubHead.y, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.3;
          ctx.stroke();
          ctx.restore();
        }
      }

      if (currentProgress >= 65 && ds.showSkeleton && (ds.isLiveYoloScan || !ds.videoUrl)) {
        const impactRaw = getJointsForProgress(65, ds.keyframes, !ds.videoUrl);
        if (impactRaw.clubHead) {
          const impactClub = mapPoint(impactRaw.clubHead);
          const flightProgress = Math.min(1, (currentProgress - 65) / 35);
          const ballEndX = impactClub.x + 120;
          const ballEndY = impactClub.y - 80;
          const ctrlX = impactClub.x + 50;
          const ctrlY = impactClub.y - 100;
          const ballX = Math.pow(1 - flightProgress, 2) * impactClub.x + 2 * (1 - flightProgress) * flightProgress * ctrlX + Math.pow(flightProgress, 2) * ballEndX;
          const ballY = Math.pow(1 - flightProgress, 2) * impactClub.y + 2 * (1 - flightProgress) * flightProgress * ctrlY + Math.pow(flightProgress, 2) * ballEndY;

          ctx.beginPath();
          ctx.moveTo(impactClub.x, impactClub.y);
          ctx.quadraticCurveTo(ctrlX, ctrlY, ballX, ballY);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.setLineDash([5, 5]);
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.beginPath();
          ctx.arc(ballX, ballY, 4, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.shadowBlur = 8;
          ctx.shadowColor = '#00ffff';
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }

      if (ds.showAngles && ds.showSkeleton && (ds.isLiveYoloScan || !ds.videoUrl)) {
        const leftAnkle = pose.lAnkle || pose.lFoot;
        const rightAnkle = pose.rAnkle || pose.rFoot;
        if (pose.hips && pose.shoulders && pose.lKnee && pose.rKnee && leftAnkle && rightAnkle) {
          const lKneeAngle = calculateAngle(pose.hips, pose.lKnee, leftAnkle);
          const rKneeAngle = calculateAngle(pose.hips, pose.rKnee, rightAnkle);
          const lHipAngle = calculateAngle(pose.shoulders, pose.hips, pose.lKnee);
          drawAngleArc(ctx, pose.hips, pose.lKnee, leftAnkle, lKneeAngle, '#00ff80');
          drawAngleArc(ctx, pose.hips, pose.rKnee, rightAnkle, rKneeAngle, '#00ff80');
          drawAngleArc(ctx, pose.shoulders, pose.hips, pose.lKnee, lHipAngle, '#fbbf24');
        }
      }

      ctx.shadowBlur = 8;
      ds.drawings.forEach((shape) => {
        ctx.strokeStyle = shape.color;
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
          ctx.beginPath();
          ctx.arc(shape.startX, shape.startY, Math.sqrt(dx * dx + dy * dy), 0, Math.PI * 2);
          ctx.stroke();
        }
      });

      if (ds.isDrawing && ds.startPoint && ds.currentPoint) {
        ctx.strokeStyle = 'rgba(255, 51, 102, 0.9)';
        ctx.shadowColor = 'rgba(255, 51, 102, 0.9)';
        ctx.lineWidth = 3;
        if (ds.activeTool === 'line') {
          ctx.beginPath();
          ctx.moveTo(ds.startPoint.x, ds.startPoint.y);
          ctx.lineTo(ds.currentPoint.x, ds.currentPoint.y);
          ctx.stroke();
        } else if (ds.activeTool === 'circle') {
          const dx = ds.currentPoint.x - ds.startPoint.x;
          const dy = ds.currentPoint.y - ds.startPoint.y;
          ctx.beginPath();
          ctx.arc(ds.startPoint.x, ds.startPoint.y, Math.sqrt(dx * dx + dy * dy), 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      ctx.shadowBlur = 0;
      rafId = requestAnimationFrame(draw);
    };

    rafId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafId);
  }, [videoReady, videoUrl, keyframes]);

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
              onLoadedMetadata={handleVideoReady}
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
            {isLiveYoloScan ? 'YOLO Live Scan' : 'Your Swing'}
          </div>
          {!isLiveYoloScan && videoUrl && (
            <div className="absolute bottom-3 left-3 right-3 px-2 py-2 rounded bg-amber-500/90 text-[10px] font-medium text-white text-center backdrop-blur-sm space-y-1.5">
              <p>Pose detection belum akurat. Silakan upload ulang atau scan ulang video.</p>
              <button
                type="button"
                disabled={reanalyzing}
                onClick={async () => {
                  setReanalyzing(true);
                  await reanalyzeVideo(videoId);
                  setReanalyzing(false);
                }}
                className="px-3 py-1 rounded bg-white/20 hover:bg-white/30 text-[10px] font-bold disabled:opacity-50"
              >
                {reanalyzing ? 'Scanning...' : 'Scan Ulang YOLO'}
              </button>
            </div>
          )}
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
