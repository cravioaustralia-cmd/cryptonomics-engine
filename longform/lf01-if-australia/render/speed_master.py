"""1.28x master: stretch the finished pre-master mix (build/mix.wav) with ffmpeg atempo (WSOLA), pitch held (voice does not rise),
then the SAME master chain as mix.py -- make-up gain, 4x oversampled peak limiter, two-pass LINEAR loudnorm -- on this
file only. Writes build/master_speed.wav and build/loudnorm.json (the speed master's numbers)."""
import json, os, subprocess, sys
import numpy as np
import pyloudnorm as pyln

SPEED = float(sys.argv[1]) if len(sys.argv) > 1 else 1.28
EP = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
B = os.path.join(EP, 'build')
SR = 48000
src, st, out = os.path.join(B, 'mix.wav'), os.path.join(B, 'mix_speed.wav'), os.path.join(B, 'master_speed.wav')
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-af',
                f'atempo={SPEED}',
                '-c:a', 'pcm_f32le', st], check=True)
x = np.frombuffer(subprocess.check_output(['ffmpeg', '-v', 'error', '-i', st, '-f', 'f32le', '-']), np.float32).reshape(-1, 2)
pre = pyln.Meter(SR).integrated_loudness(x.astype(np.float64))
CEIL = -3.0
PRE = f'volume={-14.0 - pre:.2f}dB,aresample=192000,alimiter=limit={10 ** (CEIL / 20):.4f}:attack=3:release=80:level=false:asc=1,aresample=48000:resampler=soxr:precision=28,'


def measure(inp, extra=''):
    e = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', inp, '-af', f'{extra}loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'], capture_output=True, text=True).stderr
    return json.loads(e[e.rindex('{'):e.rindex('}') + 1])


m1 = measure(st, PRE)
af = PRE + (f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={m1['input_i']}:measured_TP={m1['input_tp']}:measured_LRA={m1['input_lra']}:"
            f"measured_thresh={m1['input_thresh']}:offset={m1['target_offset']}:linear=true:print_format=json,aresample=48000:resampler=soxr:precision=28")
e = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-y', '-i', st, '-af', af, '-c:a', 'pcm_s24le', out], capture_output=True, text=True).stderr
m2 = json.loads(e[e.rindex('{'):e.rindex('}') + 1])
ln = json.load(open(os.path.join(B, 'loudnorm.json')))
vo = ln['vo_lufs_untouched']
json.dump({'speed': SPEED, 'stretch': f'ffmpeg atempo={SPEED} (WSOLA time-stretch, pitch unchanged)', 'vo_lufs_untouched': vo, 'premaster_lufs': pre,
           'master_chain': PRE + 'loudnorm(two-pass, linear)', 'pass1': m1, 'pass2': m2, 'verify_master': measure(out)},
          open(os.path.join(B, 'loudnorm.json'), 'w'), indent=1)
print(f'speed {SPEED}: stretched pre-master {pre:.1f} LUFS, {len(x) / SR:.2f} s; pass2 {m2["normalization_type"]}, out I {m2["output_i"]} TP {m2["output_tp"]}')
