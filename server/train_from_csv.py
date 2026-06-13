import os
import argparse
import json
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_recall_fscore_support, confusion_matrix
import joblib


def detect_label_column(df):
    candidates = ['label','class','action','category','target','y']
    for c in candidates:
        if c in df.columns:
            return c
    # try to find a non-numeric column with few unique values
    for col in df.columns:
        if df[col].dtype == object or not np.issubdtype(df[col].dtype, np.number):
            if df[col].nunique() <= 50:
                return col
    return None


def prepare_features(df, label_col):
    from sklearn.preprocessing import LabelEncoder
    import ast
    
    # Drop columns that are obviously file paths
    drop_like = []
    for col in df.columns:
        if col == label_col:
            continue
        if 'file' in col.lower() or 'path' in col.lower() or 'video' in col.lower():
            drop_like.append(col)
    # Start with dataframe without label and path-like columns
    df_feat = df.drop(columns=drop_like + [label_col], errors='ignore').copy()

    # Feature engineering: parse `events` column if exists (list-like strings) and `bbox` column
    engineered = {}
    if 'events' in df_feat.columns:
        def parse_events(s):
            try:
                # Expect format like "[0, 47, 65, ...]"
                arr = ast.literal_eval(s) if pd.notna(s) else []
                if not isinstance(arr, (list, tuple)):
                    return [0, 0, 0, 0, 0]
                if len(arr) == 0:
                    return [0, 0, 0, 0, 0]
                arr_vals = [float(x) for x in arr]
                return [len(arr), np.mean(arr_vals), np.min(arr_vals), np.max(arr_vals), np.std(arr_vals) if len(arr)>1 else 0]
            except Exception:
                return [0, 0, 0, 0, 0]

        ev_counts = []
        ev_means = []
        ev_mins = []
        ev_maxs = []
        ev_stds = []
        for v in df_feat['events'].fillna(''):
            c, m, mn, mx, st = parse_events(v)
            ev_counts.append(c)
            ev_means.append(m)
            ev_mins.append(mn)
            ev_maxs.append(mx)
            ev_stds.append(st)
        engineered['events_count'] = ev_counts
        engineered['events_mean'] = ev_means
        engineered['events_min'] = ev_mins
        engineered['events_max'] = ev_maxs
        engineered['events_std'] = ev_stds
        df_feat = df_feat.drop(columns=['events'])

    if 'bbox' in df_feat.columns:
        # bbox expected like [x y w h] or array string; compute width, height, area, and aspect ratio
        def parse_bbox(s):
            try:
                arr = ast.literal_eval(s) if pd.notna(s) else []
                if isinstance(arr, (list, tuple)) and len(arr)>=4:
                    x, y, w, h = map(float, arr[:4])
                    return [w, h, w*h, w/h if h!=0 else 0]
                # some rows use space-separated values
                parts = str(s).strip().replace('[','').replace(']','').split()
                if len(parts)>=4:
                    x, y, w, h = map(float, parts[:4])
                    return [w, h, w*h, w/h if h!=0 else 0]
            except Exception:
                pass
            return [0.0, 0.0, 0.0, 0.0]

        b_w = []
        b_h = []
        b_area = []
        b_aspect = []
        for v in df_feat['bbox'].fillna(''):
            w, h, area, aspect = parse_bbox(v)
            b_w.append(w)
            b_h.append(h)
            b_area.append(area)
            b_aspect.append(aspect)
        engineered['bbox_w'] = b_w
        engineered['bbox_h'] = b_h
        engineered['bbox_area'] = b_area
        engineered['bbox_aspect_ratio'] = b_aspect
        df_feat = df_feat.drop(columns=['bbox'])

    # Add engineered features into dataframe
    for k, arr in engineered.items():
        df_feat[k] = arr

    # Label encode categorical columns: sex, club, view, player
    categorical_cols = ['sex', 'view']  # exclude 'club' since it's the label
    label_encoders = {}
    for col in categorical_cols:
        if col in df_feat.columns:
            le = LabelEncoder()
            df_feat[col] = le.fit_transform(df_feat[col].fillna('unknown'))
            label_encoders[col] = le

    # Keep only numeric columns
    numeric_cols = df_feat.select_dtypes(include=[np.number]).columns.tolist()
    if len(numeric_cols) == 0:
        raise RuntimeError('No numeric feature columns found. Provide a CSV with numeric features or preprocess videos first.')

    X = df_feat[numeric_cols].fillna(0).values
    y = df[label_col].values
    return X, y, numeric_cols


def main(csv_path, label_col_arg, test_size, output_metrics, output_model, random_state):
    if not os.path.exists(csv_path):
        raise FileNotFoundError(f'CSV not found: {csv_path}')

    df = pd.read_csv(csv_path)
    label_col = label_col_arg or detect_label_column(df)
    if not label_col:
        print('Available columns:', list(df.columns))
        raise RuntimeError('Could not auto-detect label column. Rerun with --label-col <column_name>')

    print('Using label column:', label_col)
    X, y, feature_cols = prepare_features(df, label_col)

    # Encode labels if not numeric (handle pandas StringDtype safely)
    from pandas.api.types import is_numeric_dtype
    if not is_numeric_dtype(df[label_col]):
        from sklearn.preprocessing import LabelEncoder
        le = LabelEncoder()
        y_enc = le.fit_transform(y)
        label_encoder = le
    else:
        y_enc = y
        label_encoder = None

    X_train, X_test, y_train, y_test = train_test_split(X, y_enc, test_size=test_size, random_state=random_state, stratify=y_enc if len(np.unique(y_enc))>1 else None)

    # Use class_weight='balanced' to help rare classes
    clf = RandomForestClassifier(n_estimators=200, random_state=random_state, class_weight='balanced')
    clf.fit(X_train, y_train)
    y_pred = clf.predict(X_test)

    acc = accuracy_score(y_test, y_pred)
    precision, recall, f1, support = precision_recall_fscore_support(y_test, y_pred, average=None, labels=np.unique(np.concatenate([y_test, y_pred])))
    precision_macro, recall_macro, f1_macro, _ = precision_recall_fscore_support(y_test, y_pred, average='macro')

    labels = list(np.unique(np.concatenate([y_test, y_pred])))
    # if we used label encoder, convert back
    if label_encoder is not None:
        labels_str = [str(label_encoder.inverse_transform([int(l)])[0]) for l in labels]
    else:
        labels_str = [str(l) for l in labels]

    per_class = {}
    for i, lab in enumerate(labels_str):
        per_class[lab] = {
            'precision': float(precision[i]) if i < len(precision) else 0.0,
            'recall': float(recall[i]) if i < len(recall) else 0.0,
            'f1': float(f1[i]) if i < len(f1) else 0.0,
            'support': int(support[i]) if i < len(support) else 0
        }

    cm = confusion_matrix(y_test, y_pred, labels=labels).tolist()

    metrics = {
        'accuracy': float(acc),
        'macro_precision': float(precision_macro),
        'macro_recall': float(recall_macro),
        'macro_f1': float(f1_macro),
        'per_class': per_class,
        'labels': labels_str,
        'confusion_matrix': cm,
        'n_train': int(len(X_train)),
        'n_test': int(len(X_test)),
        'feature_columns': feature_cols
    }

    os.makedirs(os.path.dirname(output_metrics), exist_ok=True)
    with open(output_metrics, 'w') as f:
        json.dump(metrics, f, indent=2)

    if output_model:
        joblib.dump(clf, output_model)

    print('Training complete. Metrics saved to', output_metrics)


if __name__ == '__main__':
    p = argparse.ArgumentParser()
    p.add_argument('--csv', default='server/data/GolfDB.csv')
    p.add_argument('--label-col', default=None, help='Name of label column (if not auto-detected)')
    p.add_argument('--test-size', type=float, default=0.2)
    p.add_argument('--output-metrics', default='server/data/metrics_from_csv.json')
    p.add_argument('--output-model', default='server/data/model_from_csv.pkl')
    p.add_argument('--random-state', type=int, default=42)
    args = p.parse_args()
    main(args.csv, args.label_col, args.test_size, args.output_metrics, args.output_model, args.random_state)
