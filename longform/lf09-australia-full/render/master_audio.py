#!/usr/bin/env python3
"""Final loudness: -14 LUFS integrated, <= -1 dBTP (two-pass loudnorm, linear). Builds the 1.28x master audio."""
import json, os, re, subprocess
R = os.path.dirname(os.path.abspath(__file__)); M = os.path.join(R, 'cache', 'mix')
def ln(src, dst, pre=''):
    f1 = (pre + ',' if pre else '') + 'loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json'
    e = subprocess.run(['ffmpeg', '-hide_banner', '-i', src, '-af', f1, '-f', 'null', '-'], capture_output=True, text=True).stderr
    j = json.loads(e[e.rindex('{'):e.rindex('}') + 1])
    f2 = (pre + ',' if pre else '') + f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={j['input_i']}:measured_TP={j['input_tp']}:measured_LRA={j['input_lra']}:measured_thresh={j['input_thresh']}:offset={j['target_offset']}:linear=true:print_format=json"
    e2 = subprocess.run(['ffmpeg', '-hide_banner', '-y', '-i', src, '-af', f2 + ',aresample=48000', '-c:a', 'pcm_s24le', dst], capture_output=True, text=True).stderr
    j2 = json.loads(e2[e2.rindex('{'):e2.rindex('}') + 1]); return j2['normalization_type'], j2['output_i'], j2['output_tp']
# 1x
LIM = 'aresample=192000,alimiter=limit=0.63:attack=3:release=60:level=false,aresample=48000'
print('1x', ln(os.path.join(M, '_premaster_1x.wav'), os.path.join(M, 'mix_1x.wav'), LIM))
# master: speed the premix (no ticks) by 1.28 pitch-held, then add ticks on viewer time
info = json.load(open(os.path.join(R, '..', 'render', 'data', 'mix_info.json')))
sp = os.path.join(M, '_master_speed.wav')
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', os.path.join(M, '_premaster_noticks.wav'), '-af', 'atempo=1.28', '-c:a', 'pcm_f32le', sp], check=True)
ticks = [tv for tv, tf in info['ticks_master']]
inputs = ['-i', sp] + sum([['-i', os.path.join(R, 'cache', 'sfx', 'click.wav')] for _ in ticks], [])
fc = ''.join(f'[{i + 1}]volume=-16dB,adelay={int(tv * 1000)}|{int(tv * 1000)}[k{i}];' for i, tv in enumerate(ticks)) + '[0]' + ''.join(f'[k{i}]' for i in range(len(ticks))) + f'amix=inputs={len(ticks) + 1}:duration=first:normalize=0[o]'
withticks = os.path.join(M, '_master_ticks.wav')
subprocess.run(['ffmpeg', '-v', 'error', '-y'] + inputs + ['-filter_complex', fc, '-map', '[o]', '-c:a', 'pcm_f32le', withticks], check=True)
print('master', ln(withticks, os.path.join(M, 'mix_master.wav'), LIM))
