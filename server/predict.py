import sys
import json
import os
import joblib
import numpy as np

MODEL_PATH = os.path.join(os.path.dirname(__file__), 'data', 'model_from_csv.pkl')
METRICS_PATH = os.path.join(os.path.dirname(__file__), 'data', 'metrics_from_csv.json')

if not os.path.exists(MODEL_PATH):
    print(json.dumps({'success': False, 'message': 'Model not found', 'model_path': MODEL_PATH}))
    sys.exit(1)

model = joblib.load(MODEL_PATH)
metrics = {}
if os.path.exists(METRICS_PATH):
    try:
        with open(METRICS_PATH, 'r') as f:
            metrics = json.load(f)
    except Exception:
        metrics = {}

feature_cols = metrics.get('feature_columns', [])
labels = metrics.get('labels', None)  # labels are strings

# Read JSON payload from stdin or as first arg
if len(sys.argv) > 1:
    payload = json.loads(sys.argv[1])
else:
    payload = json.load(sys.stdin)

features = payload.get('features') if isinstance(payload, dict) else None
if features is None:
    print(json.dumps({'success': False, 'message': 'Missing features in payload'}))
    sys.exit(1)

# Build feature vector in correct order
if feature_cols:
    try:
        x = [float(features.get(c, 0.0)) for c in feature_cols]
    except Exception as e:
        print(json.dumps({'success': False, 'message': f'Invalid features: {e}'}))
        sys.exit(1)
else:
    # if no feature columns available, try to infer order from provided dict
    keys = sorted(list(features.keys()))
    x = [float(features[k]) for k in keys]

X = np.array(x).reshape(1, -1)
try:
    pred = model.predict(X)
    # model may return numeric labels; map to string using metrics labels if available
    pred0 = int(pred[0])
    label_str = None
    if labels is not None and len(labels) > pred0:
        label_str = labels[pred0]
    else:
        label_str = str(pred0)
    # if model supports predict_proba
    proba = None
    if hasattr(model, 'predict_proba'):
        proba = model.predict_proba(X).tolist()
    print(json.dumps({'success': True, 'prediction': label_str, 'prediction_raw': int(pred0), 'proba': proba}))
except Exception as e:
    print(json.dumps({'success': False, 'message': str(e)}))
    sys.exit(1)
