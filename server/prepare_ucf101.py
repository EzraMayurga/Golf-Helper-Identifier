"""
Prepare UCF101 dataset for training.

Usage:
  - Download and extract UCF101 so the structure is: <ucf_root>/<class_name>/*.avi
  - Run:
      python server/prepare_ucf101.py --ucf-root <path_to_ucf_root> --out-videos server/data/videos --labels server/data/labels.csv

This script will create `out-videos` (if missing) and generate a CSV with `filename,label` where `filename` is the relative path under `out-videos`.

Note: To avoid copying large files, by default this script will create a small shim CSV that references the original files using absolute paths. If you prefer to copy videos into `out-videos`, pass `--copy` (requires disk space).
"""
import os
import argparse
import csv
import shutil


def gather_ucf(ucf_root, out_videos, labels_csv, copy_files=False, max_per_class=None):
    os.makedirs(out_videos, exist_ok=True)
    entries = []
    classes = sorted([d for d in os.listdir(ucf_root) if os.path.isdir(os.path.join(ucf_root, d))])
    for cls in classes:
        cls_dir = os.path.join(ucf_root, cls)
        vids = sorted([f for f in os.listdir(cls_dir) if os.path.isfile(os.path.join(cls_dir, f)) and f.lower().endswith(('.avi','.mp4','.mov'))])
        if max_per_class:
            vids = vids[:max_per_class]
        for v in vids:
            src = os.path.join(cls_dir, v)
            if copy_files:
                dst_name = f"{cls}__{v}"
                dst = os.path.join(out_videos, dst_name)
                if not os.path.exists(dst):
                    shutil.copy2(src, dst)
                relpath = dst_name
            else:
                # Use absolute path to original file to avoid copying
                relpath = os.path.abspath(src)
            entries.append((relpath, cls))
    # write labels CSV
    os.makedirs(os.path.dirname(labels_csv), exist_ok=True)
    with open(labels_csv, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['filename','label'])
        for fn, lab in entries:
            writer.writerow([fn, lab])
    print(f"Prepared {len(entries)} entries. Labels written to {labels_csv}")


if __name__ == '__main__':
    p = argparse.ArgumentParser()
    p.add_argument('--ucf-root', required=True, help='Path to extracted UCF101 root (folders per class)')
    p.add_argument('--out-videos', default='server/data/videos', help='Output videos directory (for copy mode)')
    p.add_argument('--labels', default='server/data/labels.csv', help='Output labels CSV')
    p.add_argument('--copy', action='store_true', help='Copy videos into out-videos (may require large disk)')
    p.add_argument('--max-per-class', type=int, default=None, help='Limit number of videos per class')
    args = p.parse_args()

    gather_ucf(args.ucf_root, args.out_videos, args.labels, copy_files=args.copy, max_per_class=args.max_per_class)
