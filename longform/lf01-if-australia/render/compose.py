"""Final assembly with ffmpeg only (no timeline app):
  map plate (+ optional re-rendered patch segments)
  + 12 B-roll zoom-throughs: iris opens from the pin over 0.3 s, clip plays its Part 2 length,
    iris closes back into the pin over 0.35 s (camera then pulls out on the plate)
  + "Dramatised reconstruction" label on B01 only
  + IF AUSTRALIA corner badge for the whole film, end screen included
  + mastered audio (build/master.wav)
Usage: python3 compose.py [--crf N | --vbr KBPS] [--out path] [--t0 S --t1 S]  (t0/t1 = quick partial test)
"""
import argparse, json, os, subprocess

HERE = os.path.dirname(os.path.abspath(__file__))
EP = os.path.abspath(os.path.join(HERE, '..'))
BUILD = os.path.join(EP, 'build')
TL = json.load(open(os.path.join(HERE, 'timeline.json')))
ap = argparse.ArgumentParser()
ap.add_argument('--crf', type=float, default=None)
ap.add_argument('--vbr', type=int, default=None, help='two-pass target video kbit/s')
ap.add_argument('--out', default=os.path.join(EP, 'final', 'lf01-if-australia.mp4'))
ap.add_argument('--preset', default='slow')
ap.add_argument('--t0', type=float, default=None)
ap.add_argument('--t1', type=float, default=None)
ap.add_argument('--speed', type=float, default=1.0, help='play picture faster by this factor (audio must already be stretched to match)')
ap.add_argument('--audio', default=os.path.join(BUILD, 'master.wav'))
a = ap.parse_args()

CX, CY = 960, 511  # pin head (pin tip parked at frame centre; head sits 29 px above)
IRIS_IN, IRIS_OUT, RMAX = 0.30, 0.35, 1160
SRC_SKIP = 0.25  # skip the first frames of each generated clip

patches = []
pp = os.path.join(BUILD, 'patches.json')
if os.path.exists(pp):
    patches = json.load(open(pp))

inputs = ['-i', os.path.join(BUILD, 'map.mp4')]
for b in TL['broll']:
    inputs += ['-i', os.path.join(EP, 'broll', b['id'] + '.mp4')]
inputs += ['-loop', '1', '-framerate', '30', '-i', os.path.join(HERE, 'assets', 'badge.png')]
inputs += ['-loop', '1', '-framerate', '30', '-i', os.path.join(HERE, 'assets', 'label_dramatised.png')]
inputs += ['-i', a.audio]
for p in patches:
    inputs += ['-i', p['file']]
nb = len(TL['broll'])
I_BADGE, I_LABEL, I_AUDIO = 1 + nb, 2 + nb, 3 + nb

f = ['[0:v]fps=30,format=yuv420p,setpts=PTS-STARTPTS[v0]']
cur = 'v0'
for j, p in enumerate(patches):
    f.append(f"[{I_AUDIO + 1 + j}:v]fps=30,format=yuv420p,setpts=PTS-STARTPTS+{p['start']:.4f}/TB[p{j}]")
    f.append(f'[{cur}][p{j}]overlay=0:0:eof_action=pass[vp{j}]')
    cur = f'vp{j}'
for i, b in enumerate(TL['broll']):
    D = b['dur']
    grade = ('colorbalance=rs=0.04:gs=0.01:bs=-0.05:rm=0.03:bm=-0.03,eq=saturation=1.06' if b['id'] == 'B12'
             else 'eq=saturation=0.9:contrast=1.02')
    # iris mask computed at quarter resolution (cheap), upscaled smooth, then alpha-merged onto the clip
    R = (f"min({4}+{(RMAX - 16) / 4:.1f}*(1-pow(1-min(T/{IRIS_IN},1),3)),{4}+{(RMAX - 16) / 4:.1f}*pow(min(({D}-T)/{IRIS_OUT},1),2))")
    alpha = f"255*clip(({R}-hypot(X-{CX / 4},Y-{CY / 4}))/2.5+0.5,0,1)*min(1,T/0.12+0.35)"
    f.append(f"color=c=black:s=480x270:r=30:d={D},format=gray,geq=lum='{alpha}',scale=1920:1080:flags=bicubic[m{i}]")
    f.append(
        f"[{i + 1}:v:0]trim=start={SRC_SKIP}:duration={D},setpts=PTS-STARTPTS,fps=30,"
        f"scale=1920:1080:force_original_aspect_ratio=increase:flags=lanczos,crop=1920:1080,{grade},format=yuv420p[k{i}]")
    f.append(f"[k{i}][m{i}]alphamerge,setpts=PTS+{b['tIn']:.4f}/TB[c{i}]")
    f.append(f'[{cur}][c{i}]overlay=0:0:eof_action=pass[vb{i}]')
    cur = f'vb{i}'
b1 = TL['broll'][0]
f.append(f"[{cur}][{I_LABEL}:v]overlay=60:960:enable='between(t,{b1['tIn'] + 0.3:.3f},{b1['tOut'] - 0.35:.3f})':shortest=0[vl]")
f.append(f'[vl][{I_BADGE}:v]overlay=40:34:shortest=0' + (f',setpts=PTS/{a.speed},fps=30' if a.speed != 1.0 else '') + ',format=yuv420p[vout]')
graph = ';'.join(f)

dur = TL['duration'] / a.speed
trim = []
if a.t0 is not None:
    trim = ['-ss', str(a.t0), '-t', str((a.t1 or dur) - a.t0)]
os.makedirs(os.path.dirname(a.out), exist_ok=True)
venc = ['-c:v', 'libx264', '-preset', a.preset, '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-g', '60', '-bf', '3']
base = ['ffmpeg', '-y', '-hide_banner', '-nostats', '-loglevel', 'warning'] + inputs + ['-filter_complex', graph, '-map', '[vout]', '-map', f'{I_AUDIO}:a', '-t', f'{dur:.3f}'] + trim
aenc = ['-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-movflags', '+faststart']
if a.vbr:
    log = os.path.join(BUILD, 'x264pass')
    subprocess.run(base + venc + ['-b:v', f'{a.vbr}k', '-pass', '1', '-passlogfile', log, '-an', '-f', 'mp4', os.devnull], check=True)
    subprocess.run(base + venc + ['-b:v', f'{a.vbr}k', '-maxrate', f'{int(a.vbr * 2.2)}k', '-bufsize', f'{a.vbr * 4}k', '-pass', '2', '-passlogfile', log] + aenc + [a.out], check=True)
else:
    subprocess.run(base + venc + ['-crf', str(a.crf or 18)] + aenc + [a.out], check=True)
print('wrote', a.out, os.path.getsize(a.out) // (1024 * 1024), 'MB')
