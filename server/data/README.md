Usage notes for training with a Kaggle video dataset

1) Download the Kaggle dataset (videos) manually or with the Kaggle CLI:
   - Dataset link chosen: https://www.kaggle.com/datasets/marcmarais/videos-160

2) Place video files under `server/data/videos/`.

3) Create a labels CSV at `server/data/labels.csv` with two columns (no header required, or header `filename,label`):
   - `filename` should be the video file name (e.g. `video_001.mp4`).
   - `label` is the class label for that video (string or integer).

4) Install Python deps (create venv recommended):

```bash
python -m venv .venv
.\.venv\Scripts\activate
pip install -r server/requirements.txt
```

5) Run training (80% train / 20% test by default):

```bash
python server/train_evaluate.py --videos-dir server/data/videos --labels-csv server/data/labels.csv --output-metrics server/data/metrics.json --output-model server/data/model.pkl
```

6) After run, the script will save:
   - `server/data/metrics.json` — metrics including accuracy, precision, recall, f1, confusion matrix
   - `server/data/model.pkl` — trained model (joblib)

7) The backend exposes `/api/model-metrics` to read metrics (the server must be running).

Notes:
- This script uses a lightweight feature extraction (color histograms) as an example baseline. For advanced video classification use pretrained video models or extract optical-flow / pose features.
- If you want, I can add automated Kaggle download using the Kaggle API if you provide your Kaggle token (`kaggle.json`).
 
UCF101 specific
----------------
If you want to use the UCF101 dataset (http://crcv.ucf.edu/data/UCF101.php):

1. Download and extract the dataset so it has the structure `<ucf_root>/<class_name>/*.avi`.
2. Run the helper to generate `server/data/labels.csv`:

```bash
python server/prepare_ucf101.py --ucf-root <path_to_ucf_root> --out-videos server/data/videos --labels server/data/labels.csv
```

By default the script references the original UCF101 files by absolute path (no copy). Add `--copy` to copy files into `server/data/videos` if you prefer.

After labels are created, run training:

```bash
python server/train_evaluate.py --videos-dir server/data/videos --labels-csv server/data/labels.csv --output-metrics server/data/metrics.json
```

Note: UCF101 is large; consider using `--max-per-class` in `prepare_ucf101.py` to create a smaller sample for quick experiments.
