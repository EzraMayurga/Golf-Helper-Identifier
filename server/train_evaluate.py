import os
import argparse
import json
import cv2
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_recall_fscore_support, confusion_matrix
import joblib
from tqdm import tqdm


def extract_video_features(video_path, n_frames=16, hist_size=(32, 32, 32)):
    """Extract a simple feature vector from a video by sampling frames and computing color histograms."""
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise RuntimeError(f"Cannot open video: {video_path}")

    frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    if frame_count <= 0:
        cap.release()
        raise RuntimeError(f"Empty video: {video_path}")

    indices = np.linspace(0, frame_count - 1, n_frames, dtype=int)
    feats = []
    for idx in indices:
        cap.set(cv2.CAP_PROP_POS_FRAMES, int(idx))
        ret, frame = cap.read()
        if not ret or frame is None:
            # pad with zeros
            feats.append(np.zeros(sum(hist_size)))
            continue
        hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
        h = cv2.calcHist([hsv], [0], None, [hist_size[0]], [0, 180])
        s = cv2.calcHist([hsv], [1], None, [hist_size[1]], [0, 256])
        v = cv2.calcHist([hsv], [2], None, [hist_size[2]], [0, 256])
        vec = np.concatenate([h.flatten(), s.flatten(), v.flatten()])
        vec = vec / (np.linalg.norm(vec) + 1e-9)
        feats.append(vec)

    cap.release()
    feats = np.array(feats)
    return feats.mean(axis=0)


def load_labels(labels_csv):
    df = pd.read_csv(labels_csv)
    # Accept either header or no-header (then assume two columns)
    if df.shape[1] == 2 and list(df.columns) != ['filename', 'label']:
        df.columns = ['filename', 'label']
    return df


def main(videos_dir, labels_csv, output_metrics, output_model):
    df = load_labels(labels_csv)
    X = []
    y = []

    for _, row in tqdm(df.iterrows(), total=len(df), desc='Extracting features'):
        filename = row['filename']
        label = row['label']
        # Accept either absolute/relative path in CSV or filename relative to videos_dir
        if os.path.isabs(filename) or os.path.exists(filename):
            video_path = filename
        else:
            video_path = os.path.join(videos_dir, filename)
        if not os.path.exists(video_path):
            print(f"Warning: file not found, skipping: {video_path}")
            continue
        try:
            feat = extract_video_features(video_path)
            X.append(feat)
            y.append(label)
        except Exception as e:
            print(f"Failed processing {video_path}: {e}")

    if len(X) == 0:
        raise RuntimeError('No features extracted. Check videos and labels.')

    X = np.vstack(X)
    y = np.array(y)

    # Train/test split
    stratify = y if len(np.unique(y)) > 1 else None
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=stratify)

    clf = RandomForestClassifier(n_estimators=200, random_state=42)
    clf.fit(X_train, y_train)

    y_pred = clf.predict(X_test)

    acc = accuracy_score(y_test, y_pred)
    precision, recall, f1, support = precision_recall_fscore_support(y_test, y_pred, average=None, labels=np.unique(np.concatenate([y_test, y_pred])))
    precision_macro, recall_macro, f1_macro, _ = precision_recall_fscore_support(y_test, y_pred, average='macro')
    per_class = {}
    labels = list(np.unique(np.concatenate([y_test, y_pred])))
    for i, lab in enumerate(labels):
        per_class[str(lab)] = {
            'precision': float(precision[i]),
            'recall': float(recall[i]),
            'f1': float(f1[i]),
            'support': int(support[i])
        }

    cm = confusion_matrix(y_test, y_pred, labels=labels).tolist()

    metrics = {
        'accuracy': float(acc),
        'macro_precision': float(precision_macro),
        'macro_recall': float(recall_macro),
        'macro_f1': float(f1_macro),
        'per_class': per_class,
        'labels': labels,
        'confusion_matrix': cm,
        'n_train': int(len(X_train)),
        'n_test': int(len(X_test))
    }

    os.makedirs(os.path.dirname(output_metrics), exist_ok=True)
    with open(output_metrics, 'w') as f:
        json.dump(metrics, f, indent=2)

    if output_model:
        joblib.dump(clf, output_model)

    print('Training complete. Metrics saved to', output_metrics)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--videos-dir', required=True)
    parser.add_argument('--labels-csv', required=True)
    parser.add_argument('--output-metrics', default='server/data/metrics.json')
    parser.add_argument('--output-model', default='server/data/model.pkl')
    args = parser.parse_args()

    main(args.videos_dir, args.labels_csv, args.output_metrics, args.output_model)
