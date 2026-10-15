#!/usr/bin/env python3
"""Grade, crop and extract B-roll to 1920x1080 30 fps JPEG frames for the renderer.
- AI clips: crop the top-left 1128x634 region (removes the Grok watermark, bottom-right) then scale.
- Passport clip: heavy blur box over the passport cover (no national crest visible).
- Classroom clip: blur box over the handwritten whiteboard.
- All: slight warmth, soft vignette (grain is added live by the renderer).
"""
import subprocess, os, sys, json
EP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.path.join(EP, 'render', 'cache', 'clips')
GRADE = "eq=contrast=1.04:saturation=1.04,colorbalance=rm=0.035:gm=0.005:bm=-0.035:rh=0.02:bh=-0.025,vignette=angle=PI/5.5"
AI_CROP = "crop=1128:634:0:0,scale=1920:1080:flags=lanczos"
FIT = "scale=1920:1080:force_original_aspect_ratio=increase:flags=lanczos,crop=1920:1080"
CLIPS = {
  'BR_AI_canberra_dawn_fog': ('broll/BR_AI_canberra_dawn_fog.mp4', AI_CROP),
  'BR_AI_outback_aerial_empty': ('broll/BR_AI_outback_aerial_empty.mp4', AI_CROP),
  'BR_AI_1990s_lounge_tv_glow': ('broll/BR_AI_1990s_lounge_tv_glow.mp4', AI_CROP),
  'BR_AI_election_night_empty_hall': ('broll/BR_AI_election_night_empty_hall.mp4', AI_CROP),
  'BR_AI_cafe_empty_morning': ('broll/BR_AI_cafe_empty_morning.mp4', AI_CROP),
  'BR_AI_strategy_room_whiteboard': ('broll/BR_AI_strategy_room_whiteboard.mp4', AI_CROP),
  'BR_STOCK_construction_worker_scaffold': ('footage/BR_STOCK_construction_worker_scaffold.mp4', FIT),
  'BR_STOCK_melbourne_aerial_dusk': ('footage/BR_STOCK_melbourne_aerial_dusk.mp4', FIT),
  'BR_STOCK_motorway_traffic_aus': ('footage/BR_STOCK_motorway_traffic_aus.mp4', FIT),
  'BR_STOCK_parliament_house_canberra': ('footage/BR_STOCK_parliament_house_canberra.mp4', FIT),
  'BR_STOCK_plane_landing_sydney': ('footage/BR_STOCK_plane_landing_sydney.mp4', FIT),
  'BR_STOCK_sydney_street_timelapse': ('footage/BR_STOCK_sydney_street_timelapse.mp4', FIT),
  'BR_STOCK_university_campus_aerial': ('footage/BR_STOCK_university_campus_aerial.mp4', FIT),
  'BR_STOCK_airport_arrivals_board': ('footage/stock/BR_STOCK_airport_arrivals_board.mp4', FIT),
  'BR_STOCK_apartment_cranes': ('footage/stock/BR_STOCK_apartment_cranes.mp4', FIT),
  'BR_STOCK_hospital_corridor_empty': ('footage/stock/BR_STOCK_hospital_corridor_empty.mp4', FIT),
  'BR_STOCK_lecture_hall_empty': ('footage/stock/BR_STOCK_lecture_hall_empty.mp4',
      FIT + ",split[a][b];[b]crop=780:470:580:120,boxblur=28:4[bl];[a][bl]overlay=580:120"),
  'BR_STOCK_nurse_corridor_back': ('footage/stock/BR_STOCK_nurse_corridor_back.mp4', FIT),
  'BR_STOCK_passport_desk_generic': ('footage/stock/BR_STOCK_passport_desk_generic.mp4',
      FIT + ",gblur=sigma=9,split[a][b];[b]crop=760:580:600:290,gblur=sigma=26[bl];[a][bl]overlay=600:290,gblur=sigma=3"),
  'BR_STOCK_rental_inspection_keys': ('footage/stock/BR_STOCK_rental_inspection_keys.mp4', FIT),
}
STILLS = {
  'BR_STOCK_adelaide_skyline': 'footage/BR_STOCK_adelaide_skyline.jpg',
  'BR_STOCK_house_sold_sign': 'footage/BR_STOCK_house_sold_sign.jpg',
}
def run(name, src, vf):
    out = os.path.join(CACHE, name); os.makedirs(out, exist_ok=True)
    if os.path.exists(os.path.join(out, 'DONE')): return name, None
    full = f"fps=30,{vf},{GRADE},format=yuvj420p"
    subprocess.run(['ffmpeg','-v','error','-y','-i',os.path.join(EP,src),'-an','-filter_complex',full,
                    '-q:v','3',os.path.join(out,'%05d.jpg')], check=True)
    n = len([f for f in os.listdir(out) if f.endswith('.jpg')])
    open(os.path.join(out,'DONE'),'w').write(str(n)); return name, n
if __name__ == '__main__':
    from concurrent.futures import ThreadPoolExecutor
    with ThreadPoolExecutor(3) as ex:
        for r in ex.map(lambda kv: run(kv[0], *kv[1]), CLIPS.items()): print(r, flush=True)
    sd = os.path.join(EP,'render','cache','stills'); os.makedirs(sd, exist_ok=True)
    for k, src in STILLS.items():
        subprocess.run(['ffmpeg','-v','error','-y','-i',os.path.join(EP,src),'-vf',f"scale=2400:-2:flags=lanczos,{GRADE}",'-q:v','2',os.path.join(sd,k+'.jpg')],check=True)
    counts = {k: int(open(os.path.join(CACHE,k,'DONE')).read() or 0) for k in CLIPS}
    json.dump(counts, open(os.path.join(EP,'render','cache','clip_frames.json'),'w'), indent=1)
    print(counts)
