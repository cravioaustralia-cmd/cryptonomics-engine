#!/bin/sh
set -e
cd "$(dirname "$0")"
node capture.mjs collect data/cues.json
python3 mix.py
python3 master_audio.py
node capture.mjs video out/video_1x.mp4 --workers 4
node capture.mjs video out/video_master.mp4 --master --workers 4
sh deliver.sh
python3 qc_video.py out/lf09_1x.mp4 out/lf09_master_1.28x.mp4 > data/qc_video.log 2>&1
echo ALLDONE
