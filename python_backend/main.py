import json
import os
import subprocess
import cv2
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO
import torch

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

MAX_SAMPLES = 24
INFER_IMGSZ = 512


def get_video_rotation(video_path):
    try:
        out = subprocess.check_output(
            [
                'ffprobe', '-v', 'quiet', '-print_format', 'json',
                '-show_streams', video_path,
            ],
            stderr=subprocess.DEVNULL,
            timeout=15,
        )
        for stream in json.loads(out).get('streams', []):
            if stream.get('codec_type') != 'video':
                continue
            tags = stream.get('tags') or {}
            if 'rotate' in tags:
                return int(tags['rotate']) % 360
            for side in stream.get('side_data_list') or []:
                if side.get('rotation') is not None:
                    return int(side['rotation']) % 360
        return 0
    except Exception:
        return 0


def apply_rotation(frame, rotation):
    rot = rotation % 360
    if rot == 90:
        return cv2.rotate(frame, cv2.ROTATE_90_CLOCKWISE)
    if rot == 180:
        return cv2.rotate(frame, cv2.ROTATE_180)
    if rot in (270, -90):
        return cv2.rotate(frame, cv2.ROTATE_90_COUNTERCLOCKWISE)
    return frame


def display_dimensions(frame_w, frame_h, rotation):
    rot = abs(rotation) % 360
    if rot in (90, 270):
        return frame_h, frame_w
    return frame_w, frame_h


def select_person_keypoints(result, frame_h, frame_w, prev_center=None):
    if result.keypoints is None or result.keypoints.xy.numel() == 0:
        return None, None, None

    xy = result.keypoints.xy
    conf = result.keypoints.conf
    boxes = result.boxes

    best_idx = None
    best_score = float('-inf')
    best_center = None

    for i in range(len(xy)):
        kpts = xy[i].cpu().numpy()
        kpt_conf = conf[i].cpu().numpy() if conf is not None else None

        valid = []
        for j, (x, y) in enumerate(kpts):
            c = float(kpt_conf[j]) if kpt_conf is not None else 1.0
            if c >= 0.15 and x > 0 and y > 0:
                valid.append((float(x), float(y)))

        if len(valid) < 4:
            continue

        xs = [p[0] for p in valid]
        ys = [p[1] for p in valid]
        xmin, xmax = min(xs), max(xs)
        ymin, ymax = min(ys), max(ys)
        bw, bh = xmax - xmin, ymax - ymin

        if boxes is not None and len(boxes) > i:
            box = boxes.xyxy[i].cpu().numpy()
            bw = float(box[2] - box[0])
            bh = float(box[3] - box[1])
            cx = float((box[0] + box[2]) / 2)
            cy = float((box[1] + box[3]) / 2)
        else:
            cx, cy = (xmin + xmax) / 2, (ymin + ymax) / 2

        if bw < frame_w * 0.06 or bh < frame_h * 0.10:
            continue

        area = bw * bh
        score = area

        if frame_h * 0.08 < cy < frame_h * 0.98:
            score *= 1.2

        if prev_center is not None:
            dist = ((cx - prev_center[0]) ** 2 + (cy - prev_center[1]) ** 2) ** 0.5
            score -= dist * 1.5
        else:
            score += area * 0.1

        if score > best_score:
            best_score = score
            best_idx = i
            best_center = (cx, cy)

    if best_idx is None:
        return None, None, None

    return xy[best_idx].cpu().numpy(), best_center, best_idx


def build_frame_keypoints(kpts, kpt_conf, frame_w, frame_h, last_valid, phase, percentage):
    def pt_conf(idx):
        if kpt_conf is None:
            return 1.0
        return float(kpt_conf[idx])

    def norm(x, y, joint_name, idx_for_conf=None):
        c = pt_conf(idx_for_conf) if idx_for_conf is not None else 1.0
        if x <= 0 or y <= 0 or c < 0.15:
            return last_valid.get(joint_name)
        val = {"x": round(float(x / frame_w), 4), "y": round(float(y / frame_h), 4)}
        last_valid[joint_name] = val
        return val

    def avg_kpt(idx1, idx2, joint_name):
        x1, y1 = kpts[idx1][0], kpts[idx1][1]
        x2, y2 = kpts[idx2][0], kpts[idx2][1]
        c1, c2 = pt_conf(idx1), pt_conf(idx2)
        if c1 < 0.15 and c2 < 0.15:
            return last_valid.get(joint_name)
        if c1 < 0.15:
            return norm(x2, y2, joint_name, idx2)
        if c2 < 0.15:
            return norm(x1, y1, joint_name, idx1)
        return norm((x1 + x2) / 2, (y1 + y2) / 2, joint_name, idx1)

    def fallback_from_hips(name, hips_pt, dx, dy):
        if name in last_valid:
            return last_valid[name]
        if hips_pt:
            return {"x": round(hips_pt["x"] + dx, 4), "y": round(hips_pt["y"] + dy, 4)}
        return None

    head = norm(kpts[0][0], kpts[0][1], "head", 0)
    l_shoulder = norm(kpts[5][0], kpts[5][1], "lShoulder", 5)
    r_shoulder = norm(kpts[6][0], kpts[6][1], "rShoulder", 6)
    l_elbow = norm(kpts[7][0], kpts[7][1], "lElbow", 7)
    r_elbow = norm(kpts[8][0], kpts[8][1], "rElbow", 8)
    l_wrist = norm(kpts[9][0], kpts[9][1], "lWrist", 9)
    r_wrist = norm(kpts[10][0], kpts[10][1], "rWrist", 10)
    l_hip = norm(kpts[11][0], kpts[11][1], "lHip", 11)
    r_hip = norm(kpts[12][0], kpts[12][1], "rHip", 12)
    shoulders = avg_kpt(5, 6, "shoulders")
    hips = avg_kpt(11, 12, "hips")

    if not head and not shoulders and not hips:
        return None

    if not shoulders and head:
        shoulders = {"x": head["x"], "y": min(head["y"] + 0.08, 0.95)}
    if not hips and shoulders:
        hips = {"x": shoulders["x"], "y": min(shoulders["y"] + 0.12, 0.95)}
    if not head and shoulders:
        head = {"x": shoulders["x"], "y": max(shoulders["y"] - 0.08, 0.02)}

    l_knee = norm(kpts[13][0], kpts[13][1], "lKnee", 13) or fallback_from_hips("lKnee", hips, -0.03, 0.14)
    r_knee = norm(kpts[14][0], kpts[14][1], "rKnee", 14) or fallback_from_hips("rKnee", hips, 0.03, 0.14)
    l_foot = norm(kpts[15][0], kpts[15][1], "lFoot", 15) or fallback_from_hips("lFoot", l_knee, 0, 0.10)
    r_foot = norm(kpts[16][0], kpts[16][1], "rFoot", 16) or fallback_from_hips("rFoot", r_knee, 0, 0.10)
    wrists = avg_kpt(9, 10, "wrists") or (shoulders and {"x": shoulders["x"], "y": shoulders["y"] + 0.05})

    if not hips or not shoulders or not wrists:
        return None

    sx, sy = shoulders["x"] * frame_w, shoulders["y"] * frame_h
    wx, wy = wrists["x"] * frame_w, wrists["y"] * frame_h
    club_head = norm(wx + (wx - sx) * 0.65, wy + (wy - sy) * 0.65, "clubHead")
    if not club_head:
        club_head = {"x": round(wrists["x"] + 0.05, 4), "y": round(wrists["y"] + 0.08, 4)}

    for name, val in [
        ("head", head), ("shoulders", shoulders), ("hips", hips),
        ("lShoulder", l_shoulder), ("rShoulder", r_shoulder),
        ("lElbow", l_elbow), ("rElbow", r_elbow),
        ("lWrist", l_wrist), ("rWrist", r_wrist),
        ("lHip", l_hip), ("rHip", r_hip),
        ("lKnee", l_knee), ("rKnee", r_knee), ("lFoot", l_foot),
        ("rFoot", r_foot), ("wrists", wrists), ("clubHead", club_head),
    ]:
        if val:
            last_valid[name] = val

    return {
        "frame": float(percentage),
        "phase": phase,
        "head": head or last_valid.get("head") or shoulders,
        "lShoulder": l_shoulder or last_valid.get("lShoulder") or shoulders,
        "rShoulder": r_shoulder or last_valid.get("rShoulder") or shoulders,
        "lElbow": l_elbow or last_valid.get("lElbow") or wrists,
        "rElbow": r_elbow or last_valid.get("rElbow") or wrists,
        "lWrist": l_wrist or last_valid.get("lWrist") or wrists,
        "rWrist": r_wrist or last_valid.get("rWrist") or wrists,
        "lHip": l_hip or last_valid.get("lHip") or hips,
        "rHip": r_hip or last_valid.get("rHip") or hips,
        "shoulders": shoulders,
        "hips": hips,
        "lKnee": l_knee,
        "lFoot": l_foot,
        "rKnee": r_knee,
        "rFoot": r_foot,
        "lAnkle": l_foot,
        "rAnkle": r_foot,
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
    raw_w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)) or 640
    raw_h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT)) or 480
    rotation = get_video_rotation(req.video_path)
    display_w, display_h = display_dimensions(raw_w, raw_h, rotation)

    if total_frames <= 0:
        cap.release()
        return {"success": False, "message": "Invalid video file"}

    keyframes_data = []
    num_samples = min(total_frames, MAX_SAMPLES)
    target_frames = [
        int(i * (total_frames - 1) / (num_samples - 1)) if num_samples > 1 else 0
        for i in range(num_samples)
    ]

    last_valid = {}
    prev_center = None

    for target in target_frames:
        cap.set(cv2.CAP_PROP_POS_FRAMES, target)
        ret, frame = cap.read()
        if not ret:
            continue

        frame = apply_rotation(frame, rotation)
        h, w = frame.shape[:2]
        results = model(frame, verbose=False, conf=0.2, iou=0.5, imgsz=INFER_IMGSZ)

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
        return {"success": False, "message": "Could not detect golfer pose. Pastikan seluruh tubuh terlihat dalam frame."}

    head_drift = abs(keyframes_data[0]["head"]["x"] - keyframes_data[-1]["head"]["x"]) * 100
    swing_score = max(50, min(98, int(100 - head_drift * 0.35)))
    injury_risk = max(5, int(100 - swing_score))

    return {
        "success": True,
        "poseKeyframes": keyframes_data,
        "swingScore": swing_score,
        "injuryRiskScore": injury_risk,
        "videoWidth": display_w,
        "videoHeight": display_h,
        "videoRotation": rotation,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
