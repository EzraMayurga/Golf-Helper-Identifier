import os
import cv2
import tempfile
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO
import numpy as np
import torch

# Bypass PyTorch 2.6 breaking change for older Ultralytics weights
original_load = torch.load
def safe_load(*args, **kwargs):
    kwargs['weights_only'] = False
    return original_load(*args, **kwargs)
torch.load = safe_load

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

print("Loading YOLOv8-Pose model...")
model = YOLO('yolov8n-pose.pt')
print("Model loaded successfully!")

from pydantic import BaseModel

class AnalyzeRequest(BaseModel):
    video_path: str

@app.post("/analyze")
async def analyze_video(req: AnalyzeRequest):
    print(f"Received video path: {req.video_path}")
    if not os.path.exists(req.video_path):
        return {"success": False, "message": "File not found"}
        
    cap = cv2.VideoCapture(req.video_path)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    
    keyframes_data = []
    
    # Sample up to 60 frames evenly across the video to avoid lag and ensure real-time tracking
    num_samples = min(total_frames, 60)
    target_frames = []
    for i in range(num_samples):
        # Calculate exactly which frame index to sample
        idx = int(i * (total_frames - 1) / (num_samples - 1)) if num_samples > 1 else 0
        target_frames.append(idx)
        
    # Store last known valid positions to prevent limbs from flying to (0,0) when obscured
    last_valid = {}
    
    for i, target in enumerate(target_frames):
        cap.set(cv2.CAP_PROP_POS_FRAMES, target)
        ret, frame = cap.read()
        if not ret:
            continue
            
        results = model(frame, verbose=False)
        percentage = (target / total_frames) * 100 if total_frames > 0 else 0
        
        # Determine logical phase (heuristically based on video percentage)
        if percentage < 20: phase = 'address'
        elif percentage < 45: phase = 'backswing'
        elif percentage < 65: phase = 'downswing'
        elif percentage < 85: phase = 'impact'
        else: phase = 'follow-through'
        
        if len(results) > 0 and len(results[0].keypoints) > 0 and results[0].keypoints.xy.numel() > 0:
            kpts = results[0].keypoints.xy[0].cpu().numpy()
            h, w = frame.shape[:2]
            
            def norm(x, y, joint_name):
                # If YOLO returns 0,0 (hidden/occluded), use the last valid position
                if x == 0 and y == 0:
                    return last_valid.get(joint_name, {"x": 200.0, "y": 150.0})
                
                # Normalize to standard 400x300 container map
                val = {"x": float(x/w * 400), "y": float(y/h * 300)}
                last_valid[joint_name] = val
                return val
            
            # Helper to safely average two YOLO keypoints
            def avg_kpt(idx1, idx2):
                x1, y1 = kpts[idx1][0], kpts[idx1][1]
                x2, y2 = kpts[idx2][0], kpts[idx2][1]
                if (x1 == 0 and y1 == 0) and (x2 != 0 or y2 != 0): return x2, y2
                if (x2 == 0 and y2 == 0) and (x1 != 0 or y1 != 0): return x1, y1
                return (x1 + x2)/2, (y1 + y2)/2
            
            sx, sy = avg_kpt(5, 6)
            hx, hy = avg_kpt(11, 12)
            wx, wy = avg_kpt(9, 10)
            
            # Artificial club head estimation (extend line from shoulder through wrist)
            dx = wx - sx
            dy = wy - sy
            cx = wx + dx * 0.6
            cy = wy + dy * 0.6
            
            frame_data = {
                "frame": float(percentage),
                "phase": phase,
                "head": norm(kpts[0][0], kpts[0][1], "head"),
                "shoulders": norm(sx, sy, "shoulders"),
                "hips": norm(hx, hy, "hips"),
                "lKnee": norm(kpts[13][0], kpts[13][1], "lKnee"),
                "lFoot": norm(kpts[15][0], kpts[15][1], "lFoot"),
                "rKnee": norm(kpts[14][0], kpts[14][1], "rKnee"),
                "rFoot": norm(kpts[16][0], kpts[16][1], "rFoot"),
                "wrists": norm(wx, wy, "wrists"),
                "clubHead": norm(cx, cy, "clubHead")
            }
            keyframes_data.append(frame_data)
            
    cap.release()
    
    # Basic logic for dynamic score based on detected head movement
    if len(keyframes_data) >= 2:
        head_drift = abs(keyframes_data[0]["head"]["x"] - keyframes_data[-1]["head"]["x"])
        swing_score = max(50, min(98, int(100 - head_drift * 0.4)))
    else:
        swing_score = 75
        
    injury_risk = max(5, int(100 - swing_score))
        
    return {
        "success": True,
        "poseKeyframes": keyframes_data,
        "swingScore": swing_score,
        "injuryRiskScore": injury_risk
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
