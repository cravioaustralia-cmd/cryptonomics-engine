"""Final assembly with ffmpeg only (no timeline app):
  map plate (build/map.mp4: map, cards, PIPs, full-screen Ken Burns photos, captions, credits)
  + 33 B-roll clips (B01-B32 + B12b), scaled 1280x720 -> 1920x1080, trimmed to their timeline length, MUTED
    (only the picture stream of each clip is read; its audio track is never mapped)
      entry  cut  : frame 1 of the film (B01)
             iris : zoom-through, the clip opens out of the pin head at frame centre over 0.3 s
             fade : soft dissolve over the previous clip or full-screen photo (0.5 s)
      exit   iris : the clip shrinks back into the pin over 0.35 s (camera then pulls out on the plate)
             fade : dissolves to the full-screen photo under it (0.5 s)
             hold : the next clip dissolves over it
  + "Dramatised reconstruction" label on B01 only
  + IF AUSTRALIA corner badge for the whole film (B-roll, photos and end screen included)
  + audio: build/master_speed.wav (the 1.28x master) or build/mix.wav at 1x
Usage: python3 compose.py [--speed 1.28] [--vbr KBPS | --crf N] [--out path] [--t0 S --t1 S]
"""
import argparse, json, os, subprocess

HERE = os.path.dirname(os.path.abspath(__file__))
EP = os.path.abspath(os.path.join(HERE, '..'))
BUILD = os.path.join(EP, 'build')
TL = json.load(open(os.path.join(HERE, 'timeline.json')))
ap = argparse.ArgumentParser()
ap.add_argument('--crf', type=float, default=None)
ap.add_argument('--vbr', type=int, default=None)
ap.add_argument('--out', default=os.path.join(EP, 'final', 'lf02-gallipoli.mp4'))
ap.add_argument('--preset', default='slow')
ap.add_argument('--speed', type=float, default=1.28)
ap.add_argument('--audio', default=None)
ap.add_argument('--t0', type=float, default=None)
ap.add_argument('--t1', type=float, default=None)
a = ap.parse_args()
audio = a.audio or os.path.join(BUILD, 'master_speed.wav' if a.speed != 1.0 else 'mix.wav')

CX, CY = 960, 511            # pin head: the pin tip is parked at frame centre, its head sits 29 px above
IRIS_IN, IRIS_OUT, RMAX, DIS = 0.30, 0.35, 1160, TL['dissolve']
SRC_SKIP = 0.25               # skip the first frames of each generated clip

inputs = ['-i', os.path.join(BUILD, 'map.mp4')]
for b in TL['broll']:
    inputs += ['-i', os.path.join(EP, 'broll', b['id'] + '.mp4')]
nb = len(TL['broll'])
inputs += ['-loop', '1', '-framerate', '30', '-i', os.path.join(HERE, 'assets', 'badge.png')]
inputs += ['-loop', '1', '-framerate', '30', '-i', os.path.join(HERE, 'assets', 'label_dramatised.png')]
inputs += ['-i', audio]
I_BADGE, I_LABEL, I_AUDIO = 1 + nb, 2 + nb, 3 + nb

f = ['[0:v]fps=30,format=yuv420p,setpts=PTS-STARTPTS[v0]']
cur = 'v0'
q = 4  # mask at quarter resolution
for i, b in enumerate(TL['broll']):
    D = b['dur']
    rin = f"({4}+{(RMAX - 16) / q:.1f}*(1-pow(1-min(T/{IRIS_IN},1),3)))" if b['entry'] == 'iris' else f'{RMAX / q:.1f}'
    rout = f"({4}+{(RMAX - 16) / q:.1f}*pow(min(({D}-T)/{IRIS_OUT},1),2))" if b['exit'] == 'iris' else f'{RMAX / q:.1f}'
    fin = f'min(1,T/{DIS})' if b['entry'] == 'fade' else ('min(1,T/0.12+0.35)' if b['entry'] == 'iris' else '1')
    fout = f'min(1,({D}-T)/{DIS})' if b['exit'] == 'fade' else '1'
    alpha = f"255*clip((min({rin},{rout})-hypot(X-{CX / q},Y-{CY / q}))/2.5+0.5,0,1)*{fin}*{fout}"
    f.append(f"color=c=black:s={1920 // q}x{1080 // q}:r=30:d={D},format=gray,geq=lum='{alpha}',scale=1920:1080:flags=bicubic[m{i}]")
    grade = 'eq=saturation=1.0:contrast=1.0' if b['warm'] else 'eq=saturation=0.9:contrast=1.02'
    f.append(f"[{i + 1}:v:0]trim=start={SRC_SKIP}:duration={D},setpts=PTS-STARTPTS,fps=30,"
             f"scale=1920:1080:force_original_aspect_ratio=increase:flags=lanczos,crop=1920:1080,{grade},format=yuv420p[k{i}]")
    f.append(f"[k{i}][m{i}]alphamerge,setpts=PTS+{b['tIn']:.4f}/TB[c{i}]")
    f.append(f'[{cur}][c{i}]overlay=0:0:eof_action=pass[vb{i}]')
    cur = f'vb{i}'
b1 = TL['broll'][0]
f.append(f"[{cur}][{I_LABEL}:v]overlay=0:0:enable='between(t,0.3,{b1['tOut'] - 0.35:.3f})':shortest=0[vl]")
f.append(f'[vl][{I_BADGE}:v]overlay=0:0:shortest=0' + (f',setpts=PTS/{a.speed},fps=30' if a.speed != 1.0 else '') + ',format=yuv420p[vout]')
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
