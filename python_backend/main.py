import os
import cv2
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO
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


def select_person_keypoints(result, frame_h, frame_w, prev_center=None):
    """Pick the golfer: largest visible person, with temporal tracking across frames."""
    if result.keypoints is None or result.keypoints.xy.numel() == 0:
        return None, None, None

    xy = result.keypoints.xy
    conf = result.keypoints.conf
    best_idx = None
    best_score = float('-inf')
    best_center = None

    for i in range(len(xy)):
        kpts = xy[i].cpu().numpy()
        kpt_conf = conf[i].cpu().numpy() if conf is not None else None

        valid = []
        for j, (x, y) in enumerate(kpts):
            c = float(kpt_conf[j]) if kpt_conf is not None else 1.0
            if c >= 0.25 and x > 1 and y > 1:
                valid.append((x, y))

        if len(valid) < 5:
            continue

        xs = [p[0] for p in valid]
        ys = [p[1] for p in valid]
        xmin, xmax = min(xs), max(xs)
        ymin, ymax = min(ys), max(ys)
        bw, bh = xmax - xmin, ymax - ymin

        if bw < frame_w * 0.08 or bh < frame_h * 0.15:
            continue

        area = bw * bh
        cx, cy = (xmin + xmax) / 2, (ymin + ymax) / 2

        score = area
        if frame_h * 0.12 < cy < frame_h * 0.92:
            score *= 1.15
        else:
            score *= 0.4

        if prev_center is not None:
            dist = ((cx - prev_center[0]) ** 2 + (cy - prev_center[1]) ** 2) ** 0.5
            score -= dist * 1.8

        if score > best_score:
            best_score = score
            best_idx = i
            best_center = (cx, cy)

    if best_idx is None:
        return None, None, None

    return xy[best_idx].cpu().numpy(), best_center, best_idx


def build_frame_keypoints(kpts, kpt_conf, frame_w, frame_h, last_valid, phase, percentage):
    """Map YOLO COCO keypoints to swing joints using normalized 0-1 coordinates."""

    def pt_conf(idx):
        if kpt_conf is None:
            return 1.0
        return float(kpt_conf[idx])

    def norm(x, y, joint_name, idx_for_conf=None):
        c = pt_conf(idx_for_conf) if idx_for_conf is not None else 1.0
        if x <= 1 and y <= 1:
            return last_valid.get(joint_name)
        if c < 0.25:
            return last_valid.get(joint_name)
        val = {"x": round(float(x / frame_w), 4), "y": round(float(y / frame_h), 4)}
        last_valid[joint_name] = val
        return val

    def avg_kpt(idx1, idx2, joint_name):
        x1, y1 = kpts[idx1][0], kpts[idx1][1]
        x2, y2 = kpts[idx2][0], kpts[idx2][1]
        c1, c2 = pt_conf(idx1), pt_conf(idx2)
        if c1 < 0.25 and c2 < 0.25:
            return last_valid.get(joint_name)
        if c1 < 0.25:
            return norm(x2, y2, joint_name, idx2)
        if c2 < 0.25:
            return norm(x1, y1, joint_name, idx1)
        return norm((x1 + x2) / 2, (y1 + y2) / 2, joint_name, idx1)

    head = norm(kpts[0][0], kpts[0][1], "head", 0)
    shoulders = avg_kpt(5, 6, "shoulders")
    hips = avg_kpt(11, 12, "hips")
    l_knee = norm(kpts[13][0], kpts[13][1], "lKnee", 13)
    r_knee = norm(kpts[14][0], kpts[14][1], "rKnee", 14)
    l_foot = norm(kpts[15][0], kpts[15][1], "lFoot", 15)
    r_foot = norm(kpts[16][0], kpts[16][1], "rFoot", 16)
    wrists = avg_kpt(9, 10, "wrists")

    required = [head, shoulders, hips, l_knee, r_knee, l_foot, r_foot, wrists]
    if any(j is None for j in required):
        return None

    sx = shoulders["x"] * frame_w
    sy = shoulders["y"] * frame_h
    wx = wrists["x"] * frame_w
    wy = wrists["y"] * frame_h
    club_head = norm(wx + (wx - sx) * 0.65, wy + (wy - sy) * 0.65, "clubHead")

    if club_head is None:
        return None

    return {
        "frame": float(percentage),
        "phase": phase,
        "head": head,
        "shoulders": shoulders,
        "hips": hips,
        "lKnee": l_knee,
        "lFoot": l_foot,
        "rKnee": r_knee,
        "rFoot": r_foot,
        "wrists": wrists,
        "clubHead": club_head,
    }


@app.post("/analyze")
async def analyze_video(req: AnalyzeRequest):
    print(f"Received video path: {req.video_path}")
    if not os.path.exists(req.video_path):
        return {"success": False, "message": "File not found"}

    cap = cv2.VideoCapture(req.video_path)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    frame_w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)) or 640
    frame_h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT)) or 480

    if total_frames <= 0:
        cap.release()
        return {"success": False, "message": "Invalid video file"}

    keyframes_data = []
    num_samples = min(total_frames, 60)
    target_frames = []
    for i in range(num_samples):
        idx = int(i * (total_frames - 1) / (num_samples - 1)) if num_samples > 1 else 0
        target_frames.append(idx)

    last_valid = {}
    prev_center = None

    for target in target_frames:
        cap.set(cv2.CAP_PROP_POS_FRAMES, target)
        ret, frame = cap.read()
        if not ret:
            continue

        h, w = frame.shape[:2]
        results = model(frame, verbose=False, conf=0.25, iou=0.45, imgsz=640)

        percentage = (target / max(total_frames - 1, 1)) * 100
        if percentage < 20:
            phase = 'address'
        elif percentage < 45:
            phase = 'backswing'
        elif percentage < 65:
            phase = 'downswing'
        elif percentage < 85:
            phase = 'impact'
        else:
            phase = 'follow-through'

        if len(results) == 0:
            continue

        kpts, center, person_idx = select_person_keypoints(results[0], h, w, prev_center)
        if kpts is None:
            continue

        prev_center = center
        kpt_conf = None
        if results[0].keypoints.conf is not None:
            kpt_conf = results[0].keypoints.conf[person_idx].cpu().numpy()

        frame_data = build_frame_keypoints(kpts, kpt_conf, w, h, last_valid, phase, percentage)
        if frame_data:
            keyframes_data.append(frame_data)

    cap.release()

    if len(keyframes_data) < 2:
        return {"success": False, "message": "Could not detect golfer pose in video. Ensure full body is visible."}

    head_drift = abs(keyframes_data[0]["head"]["x"] - keyframes_data[-1]["head"]["x"]) * 100
    swing_score = max(50, min(98, int(100 - head_drift * 0.35)))
    injury_risk = max(5, int(100 - swing_score))

    return {
        "success": True,
        "poseKeyframes": keyframes_data,
        "swingScore": swing_score,
        "injuryRiskScore": injury_risk,
        "videoWidth": frame_w,
        "videoHeight": frame_h,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
