"""1x cut: lay the 37 voice takes end to end with designed gaps -> timeline.json.
Every take keeps its own length (no trimming, no speed change). Word times are absolute on the 1x clock."""
import json, os

HERE = os.path.dirname(os.path.abspath(__file__))
W = json.load(open(os.path.join(HERE, 'whisper-raw.json')))
INTRO = 6.6           # series sting + title before S01
TAIL = 5.0            # end card hold after S37
DEFAULT_GAP = 0.9
CHAPTER_GAP = 2.0     # chapter changes: the bed comes up here
MIDROLL_GAP = 2.8     # suggested mid-roll points (after S17, S23, S29): never on a word
GAP = {'S03': 1.2, 'S04': CHAPTER_GAP, 'S08': CHAPTER_GAP, 'S11': CHAPTER_GAP, 'S14': CHAPTER_GAP,
       'S17': MIDROLL_GAP, 'S21': CHAPTER_GAP, 'S23': MIDROLL_GAP, 'S29': MIDROLL_GAP,
       'S34': CHAPTER_GAP, 'S35': CHAPTER_GAP, 'S05': 1.1, 'S06': 1.4, 'S16': 1.6, 'S28': 1.4}
t = INTRO
takes = {}
for i in range(1, 38):
    k = f'S{i:02d}'
    d = W[k]['duration']
    takes[k] = {'start': round(t, 3), 'end': round(t + d, 3), 'dur': d,
                'words': [{'w': x['w'], 's': round(t + x['s'], 3), 'e': round(t + x['e'], 3)} for x in W[k]['words']]}
    t += d + (GAP.get(k, DEFAULT_GAP) if i < 37 else 0)
dur = t + TAIL
json.dump({'intro': INTRO, 'duration': round(dur, 3), 'takes': takes}, open(os.path.join(HERE, 'timeline.json'), 'w'), indent=0)
print(f'1x cut: {dur:.2f} s ({dur / 60:.2f} min); at 1.28x: {dur / 1.28:.2f} s ({dur / 1.28 / 60:.2f} min)')
