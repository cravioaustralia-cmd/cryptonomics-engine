#!/usr/bin/env bash
# s35 mix: VO (raw Atlas) + "Desert City" ducked under VO + sparse SFX → two-pass loudnorm master (target -13.5 in, lands ~-14 LUFS after AAC; TP -2.0).
# Usage: bash render/mix.sh <silent.mp4> <out.mp4>
set -euo pipefail
EP="$(cd "$(dirname "$0")/.." && pwd)"
SILENT="$1"; OUT="$2"
DUR=47.736
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT

# SFX cues: file|at(s)|gain|trim(s)
CUES=(
  "wind_blowing_mixkit1474.mp3|0.00|0.30|3.2"
  "impact_hit.mp3|4.70|0.40|2.5"
  "whoosh_1.mp3|7.20|0.38|1.6"
  "paper_rustle.mp3|10.30|0.40|1.8"
  "pen_writing_mixkit2536.mp3|12.95|0.38|1.6"
  "pen_writing_mixkit2536.mp3|17.90|0.38|2.5"
  "whoosh_1.mp3|21.20|0.36|1.6"
  "whoosh_1.mp3|37.40|0.32|1.6"
  "impact_hit.mp3|40.70|0.50|2.5"
)

inputs=(-i "$EP/audio/vo.mp3" -i "$EP/music/desert_city_kevin_macleod.mp3")
fc="[0:a]aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo,highpass=f=70,apad=whole_dur=${DUR},asplit=2[vo][key];"
# music: bed level, fade in/out, ducked by VO
fc+="[1:a]aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo,atrim=0:${DUR},volume=0.07,afade=t=in:st=0:d=0.8,afade=t=out:st=$(echo "$DUR-1.6" | bc):d=1.6[mus0];"
fc+="[mus0][key]sidechaincompress=threshold=0.03:ratio=5:attack=40:release=450:makeup=1[mus];"
mix="[vo][mus]"; n=2; i=2
for c in "${CUES[@]}"; do
  IFS='|' read -r f at g tr <<<"$c"
  inputs+=(-i "$EP/sfx/$f")
  ms=$(printf '%.0f' "$(echo "$at*1000" | bc)")
  fc+="[$i:a]aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo,atrim=0:${tr},afade=t=out:st=$(echo "$tr-0.4" | bc):d=0.4,volume=${g},adelay=${ms}|${ms}[s$i];"
  mix+="[s$i]"; n=$((n+1)); i=$((i+1))
done
fc+="${mix}amix=inputs=${n}:duration=first:normalize=0,atrim=0:${DUR}[pre]"

ffmpeg -y -loglevel error "${inputs[@]}" -filter_complex "$fc" -map "[pre]" -c:a pcm_f32le "$TMP/pre.wav"

# two-pass loudnorm on the master only
J=$(ffmpeg -hide_banner -i "$TMP/pre.wav" -af loudnorm=I=-13.5:TP=-2.0:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
g(){ echo "$J" | python3 -c "import json,sys;print(json.load(sys.stdin)['$1'])"; }
ffmpeg -y -loglevel error -i "$TMP/pre.wav" -af "loudnorm=I=-13.5:TP=-2.0:LRA=11:measured_I=$(g input_i):measured_TP=$(g input_tp):measured_LRA=$(g input_lra):measured_thresh=$(g input_thresh):offset=$(g target_offset):linear=true,aresample=48000" -c:a pcm_s16le "$TMP/master.wav"

ffmpeg -y -loglevel error -i "$SILENT" -i "$TMP/master.wav" -map 0:v -map 1:a -c:v copy -c:a aac -b:a 256k -ar 48000 -t "$DUR" -movflags +faststart "$OUT"
echo "muxed → $OUT"
