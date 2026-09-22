#!/usr/bin/env bash
# Procedurally synthesizes the channel's SFX library with ffmpeg (no sample
# packs / no external audio assets). Re-run any time to regenerate.
set -euo pipefail
cd "$(dirname "$0")/.."

mkdir -p public/sfx

# whoosh — filtered pink-noise swell, used on transitions
ffmpeg -y -f lavfi -i "anoisesrc=d=0.35:colour=pink:amplitude=0.6" \
  -af "highpass=f=300,lowpass=f=4000,afade=t=in:d=0.05,afade=t=out:st=0.18:d=0.17,volume=1.4" \
  -ar 44100 -c:a libmp3lame -q:a 4 public/sfx/whoosh.mp3 -loglevel error

# pop — short sine click, used on quick reveals
ffmpeg -y -f lavfi -i "aevalsrc=0.8*sin(2*PI*900*t)*exp(-60*t):d=0.08" \
  -ar 44100 -c:a libmp3lame -q:a 4 public/sfx/pop.mp3 -loglevel error

# cash-register — two-tone bell chime, used on money reveals
ffmpeg -y -f lavfi -i "aevalsrc=0.5*sin(2*PI*1500*t)*exp(-6*t)+0.4*sin(2*PI*1880*t)*exp(-6*t):d=0.6" \
  -ar 44100 -c:a libmp3lame -q:a 4 public/sfx/cash-register.mp3 -loglevel error

# thud — low sine hit, used on heavy drops (e.g. "BLOCKCHAIN")
ffmpeg -y -f lavfi -i "aevalsrc=0.9*sin(2*PI*70*t)*exp(-18*t):d=0.3" \
  -ar 44100 -c:a libmp3lame -q:a 4 public/sfx/thud.mp3 -loglevel error

# record-scratch — filtered noise burst with an abrupt cutoff, used on the "pause" beat
ffmpeg -y -f lavfi -i "anoisesrc=d=0.3:colour=white:amplitude=0.7" \
  -af "bandpass=f=1200:width_type=h:w=900,afade=t=in:d=0.02,afade=t=out:st=0.14:d=0.14" \
  -ar 44100 -c:a libmp3lame -q:a 4 public/sfx/record-scratch.mp3 -loglevel error

echo "Wrote public/sfx/{whoosh,pop,cash-register,thud,record-scratch}.mp3"
