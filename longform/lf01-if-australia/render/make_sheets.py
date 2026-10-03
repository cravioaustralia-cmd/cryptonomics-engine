"""Contact sheet + chapter stills from the FINAL mp4 (what viewers see, B-roll and badge included).
final/contact-sheet.jpg : one frame every 15 s, 6 columns
final/chapters/*.jpg     : one full-res still per chapter (frame chosen inside the chapter's signature beat)
"""
import json, os, subprocess

HERE = os.path.dirname(os.path.abspath(__file__))
EP = os.path.abspath(os.path.join(HERE, '..'))
FINAL = os.path.join(EP, 'final', 'lf01-if-australia.mp4')
TL = json.load(open(os.path.join(HERE, 'timeline.json')))
M, C = TL['marks'], TL['chunks']
SPEED = json.load(open(os.path.join(EP, 'build', 'loudnorm.json'))).get('speed', 1.0)  # final plays faster than the edit timeline
os.makedirs(os.path.join(EP, 'final', 'chapters'), exist_ok=True)


def grab(t, path, w=None):
    t = t / SPEED
    vf = ['-vf', f'scale={w}:-2'] if w else []
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{t:.3f}', '-i', FINAL, '-frames:v', '1', '-q:v', '3'] + vf + [path], check=True)


def word(k, w):
    for x in C[k]['words']:
        if x['w'].lower().startswith(w):
            return x['s']


chapters = [
    ('00-cold-open', 'Cold open', word('V04', 'three') + 3.0),
    ('01-how-close-it-got', 'How close it got', word('V07', 'coastline') + 1.0),
    ('02-scenario-1-grab-the-north', 'Scenario 1: grab the north', word('V14', 'between') + 2.0),
    ('03-scenario-2-full-invasion', 'Scenario 2: full invasion', word('V24', 'states') + 1.0),
    ('04-scenario-3-cut-australia-off', 'Scenario 3: cut Australia off', word('V25', 'queensland') + 0.8),
    ('05-the-twist', 'The twist', word('V31', 'anzus') + 1.6),
    ('06-end-screen', 'End screen', M['endScreen'] + 3.0),
]
for slug, name, t in chapters:
    grab(t, os.path.join(EP, 'final', 'chapters', slug + '.jpg'))
    print(slug, round(t, 2))

tmp = os.path.join(EP, 'build', 'sheet')
import shutil
shutil.rmtree(tmp, ignore_errors=True)
os.makedirs(tmp, exist_ok=True)
times = [t * SPEED for t in range(0, int(TL['duration'] / SPEED), 15)]
for i, t in enumerate(times):
    grab(t + 0.5, os.path.join(tmp, f'{i:03d}.jpg'), 320)
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-framerate', '1', '-i', os.path.join(tmp, '%03d.jpg'),
                '-vf', f"tile=6x{(len(times) + 5) // 6}:padding=4:margin=4:color=0x1a1410", '-frames:v', '1', '-q:v', '3',
                os.path.join(EP, 'final', 'contact-sheet.jpg')], check=True)
print('contact sheet:', len(times), 'frames, every 15 s of the final')
