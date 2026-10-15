#!/usr/bin/env python3
"""Final QC on a delivered MP4: format, durations, A/V sync, black/freeze/empty-frame scan (full runtime), loudness."""
import json, os, re, subprocess, sys
def run(cmd): return subprocess.run(cmd, capture_output=True, text=True)
def probe(p):
    j = json.loads(run(['ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', p]).stdout)
    v = next(s for s in j['streams'] if s['codec_type'] == 'video'); a = next(s for s in j['streams'] if s['codec_type'] == 'audio')
    return {'width': v['width'], 'height': v['height'], 'fps': v['r_frame_rate'], 'frames': int(v.get('nb_frames', 0)), 'v_dur': float(v['duration']), 'a_dur': float(a['duration']), 'fmt_dur': float(j['format']['duration']), 'a_rate': a['sample_rate'], 'size_mb': round(int(j['format']['size']) / 1e6, 1)}
def scan(p):
    e = run(['ffmpeg', '-hide_banner', '-i', p, '-vf', 'blackdetect=d=0.1:pix_th=0.10,freezedetect=n=0.001:d=1.5,scale=160:90,signalstats,metadata=print:file=-', '-an', '-f', 'null', '-'])
    black = re.findall(r'black_start:([\d.]+) black_end:([\d.]+)', e.stderr)
    freeze = re.findall(r'lavfi\.freezedetect\.freeze_start: ([\d.]+)', e.stderr + e.stdout)
    # empty frame: very low luma range (flat frame)
    ylow = [float(x) for x in re.findall(r'lavfi\.signalstats\.YLOW=([\d.]+)', e.stdout)]
    yhigh = [float(x) for x in re.findall(r'lavfi\.signalstats\.YHIGH=([\d.]+)', e.stdout)]
    yavg = [float(x) for x in re.findall(r'lavfi\.signalstats\.YAVG=([\d.]+)', e.stdout)]
    ymin = [float(x) for x in re.findall(r'lavfi\.signalstats\.YMIN=([\d.]+)', e.stdout)]; ymax = [float(x) for x in re.findall(r'lavfi\.signalstats\.YMAX=([\d.]+)', e.stdout)]
    flat = [i for i, (lo, hi) in enumerate(zip(ymin, ymax)) if hi - lo < 40]  # nothing on screen at all
    return {'black': black, 'freeze_starts': freeze, 'flat_frames': len(flat), 'flat_first': flat[:10], 'frames_scanned': len(yavg), 'min_yavg': round(min(yavg), 1) if yavg else None}
def loud(p):
    e = run(['ffmpeg', '-hide_banner', '-i', p, '-af', 'ebur128=peak=true:framelog=quiet', '-f', 'null', '-']).stderr
    return {'I_LUFS': float(re.findall(r'I:\s+(-?[\d.]+) LUFS', e)[-1]), 'TP_dBTP': float(re.findall(r'Peak:\s+(-?[\d.]+) dBFS', e)[-1]), 'LRA': float(re.findall(r'LRA:\s+([\d.]+) LU', e)[-1])}
if __name__ == '__main__':
    out = {}
    for p in sys.argv[1:]:
        r = probe(p); r['av_diff_frames'] = round(abs(r['v_dur'] - r['a_dur']) * 30, 2); r.update(scan(p)); r['loudness'] = loud(p); out[os.path.basename(p)] = r
        print(os.path.basename(p), json.dumps(r, indent=1))
    json.dump(out, open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data', 'qc_video.json'), 'w'), indent=1)
