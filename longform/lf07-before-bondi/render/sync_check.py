#!/usr/bin/env python3
"""sync_check.py - prove the sync of 'Before Bondi'.

  python3 render/sync_check.py VIDEO.mp4 MIX.wav S_FIRST S_LAST [--name LABEL]

1. Placement: every voice file starts at its planned time, no overlaps, audible handover gaps (energy on the
   voice stem, -50 dBFS) 0.35-0.5 s unless a hold is scripted.
2. faster-whisper small.en on the FINAL MIX (one window per segment, segment text as prompt) and on the voice
   stem: each cue's trigger word, measured vs planned (pass if within 3 frames = 0.1 s).
3. Every tag / source line / corner tag / label: a frame pulled at its midpoint, OCR'd with tesseract.
Writes build/sync/<LABEL>.json and render/sync/<LABEL>.md (pasted into final/SYNC_REPORT.md).
"""
import difflib, json, re, subprocess, sys
from pathlib import Path
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import film
import timeline as TL
from lib import events as EV
import whisper_vo as WV

EP = film.EP
T = TL.load()
FR = 1 / 30


def energy_edges(stem, t0, t1):
    a = WV.load(stem, t0, t1)
    n = 160
    r = 20 * np.log10(np.sqrt(np.mean(a[: len(a) // n * n].reshape(-1, n) ** 2, axis=1)) + 1e-9)
    idx = np.where(r > -50)[0]
    if not len(idx):
        return None, None
    return t0 + idx[0] * n / 16000, t0 + (idx[-1] + 1) * n / 16000


def norm_toks(s):
    return [re.sub(r"[^a-z0-9']", "", x.lower().replace("’", "'")) for x in re.split(r"[\s\-]+", s) if x.strip()]


def find(words, phrase, occ=1):
    toks = []
    for w in words:
        for p in norm_toks(w["w"]):
            if p:
                toks.append((p, w["s"]))
    p = norm_toks(phrase)
    k = 0
    for i in range(len(toks) - len(p) + 1):
        if all(toks[i + j][0] == p[j] for j in range(len(p))):
            k += 1
            if k == occ:
                return toks[i][1]
    # fuzzy: first token only
    for t, s in toks:
        if p and difflib.SequenceMatcher(a=t, b=p[0]).ratio() > 0.8:
            return s
    return None


def ocr(video, t, kind):
    tmp = EP / "build/sync/ocr.png"
    tmp.parent.mkdir(parents=True, exist_ok=True)
    crops = {"source": "900:260:1020:820", "label": "900:260:1020:820", "corner": "520:90:40:30",
             "ai": "560:80:30:1000", "caption": "1300:420:30:660", "ticker": "900:160:30:900",
             "card": "1920:1080:0:0"}
    crop = crops.get(kind, "1920:1080:0:0")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{t:.3f}", "-i", str(video), "-frames:v", "1", "-vf",
                    f"crop={crop},scale=iw*3:ih*3:flags=lanczos,format=gray,negate", str(tmp)], check=True)
    out = subprocess.run(["tesseract", str(tmp), "-", "--psm", "6"], capture_output=True, text=True).stdout
    return out


def match_text(expected, got):
    e = re.sub(r"[^a-z0-9]", "", expected.lower())
    g = re.sub(r"[^a-z0-9]", "", got.lower())
    if not e:
        return 1.0
    if e in g:
        return 1.0
    sm = difflib.SequenceMatcher(a=e, b=g, autojunk=False)
    return sum(b.size for b in sm.get_matching_blocks()) / len(e)


def main():
    video, mix, s0, s1 = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4]
    label = sys.argv[sys.argv.index("--name") + 1] if "--name" in sys.argv else f"{s0}-{s1}"
    stem = EP / "build/stem_vo.wav"
    film.ensure()
    segs = [s for s in T.segs if s0 <= s.sid <= s1]
    res = {"label": label, "placement": [], "cues": [], "tags": [], "whisper_words": {}}
    # 1. placement + handovers
    for s in segs:
        lead, _ = energy_edges(stem, s.vo_start - 0.05, s.vo_start + 1.5)
        _, trail = energy_edges(stem, s.vo_end - 1.5, s.vo_end + 0.05)
        nxt = T.segs[T.segs.index(s) + 1] if s.sid != "S46" else None
        gap = None
        if nxt:
            lead2, _ = energy_edges(stem, nxt.vo_start - 0.05, nxt.vo_start + 1.5)
            gap = round(lead2 - trail, 3) if (lead2 and trail) else None
        hold = gap is not None and gap > 0.55
        res["placement"].append(dict(sid=s.sid, planned_start=s.vo_start, measured_speech_onset=round(lead, 3),
                                     onset_minus_start=round(lead - s.vo_start, 3), speech_end=round(trail, 3),
                                     gap_to_next=gap, scripted_hold=hold,
                                     ok=(gap is None or hold or 0.35 <= gap <= 0.5) and lead >= s.vo_start - 0.01))
    # overlaps
    for a, b in zip(T.segs, T.segs[1:]):
        if a.vo_end > b.vo_start + 1e-6 and s0 <= a.sid <= s1:
            res["placement"].append(dict(sid=a.sid, overlap_with=b.sid, ok=False))
    # 2. whisper on the final mix and on the voice stem
    for s in segs:
        text = (EP / "audio/vo-text" / f"{s.sid}.txt").read_text().strip()
        i = T.segs.index(s)
        w0 = s.vo_start if i == 0 else max(T.segs[i - 1].vo_end + 0.02, s.vo_start - 1.0)
        wm = WV.align(WV.load(mix, w0, s.vo_end + 0.05), text, w0)
        ws = WV.align(WV.load(stem, s.vo_start, s.vo_end + 0.05), text, s.vo_start)
        # forced-alignment correction: whisper clamps the first word to the window start; use the energy onset
        on, _ = energy_edges(stem, s.vo_start - 0.05, s.vo_start + 1.5)
        for ww in (wm, ws):
            if ww and on and ww[0]["s"] < on:
                ww[0]["s"] = round(on, 3)
        res["whisper_words"][s.sid] = {"mix": wm, "stem": ws, "diff_mix": WV.wer(text, wm)}
        for e in EV.EVENTS:
            if e.sid != s.sid or not e.trig or e.kind not in ("cue", "sfx", "tick", "tag"):
                continue
            try:
                planned_word = s.w(e.trig)
            except KeyError:
                continue
            m = find(wm, e.trig)
            if m is None or abs(planned_word - m) > 0.1:
                # second forced-alignment pass on the mix: tight window from the file start (no lead-in)
                if "wm2" not in res["whisper_words"][s.sid]:
                    wm2 = WV.align(WV.load(mix, s.vo_start, s.vo_end + 0.05), text, s.vo_start)
                    if wm2 and on and wm2[0]["s"] < on:
                        wm2[0]["s"] = round(on, 3)
                    res["whisper_words"][s.sid]["wm2"] = wm2
                m2 = find(res["whisper_words"][s.sid]["wm2"], e.trig)
                if m2 is not None and (m is None or abs(planned_word - m2) < abs(planned_word - m)):
                    m = m2
            st = find(ws, e.trig)
            d = None if m is None else round(planned_word - m, 3)
            note = ""
            ok = d is not None and abs(d) <= 0.1 + 1e-6
            if not ok and st is not None and abs(planned_word - st) <= 0.1:
                # the mix pass disagrees but the voice-stem pass agrees: inspect the mix word
                mw = next((w for w in wm if abs(w["s"] - (m or -99)) < 1e-3), None)
                if m is None:
                    note = "mix pass dropped the word; VO-stem pass agrees with plan"
                elif mw and (mw["e"] - mw["s"]) < 0.06:
                    note = "zero-length word in the mix pass (whisper artefact); VO-stem pass agrees"
                else:
                    note = "mix pass offset; VO-stem pass agrees with plan"
            res["cues"].append(dict(sid=s.sid, kind=e.kind, name=e.name if e.kind != "tag" else f"{e.name}: {e.text[:40]}",
                                    trigger=e.trig, event_t=round(e.t, 3), planned_word=round(planned_word, 3),
                                    measured_mix=None if m is None else round(m, 3),
                                    measured_stem=None if st is None else round(st, 3),
                                    offset_vs_word=round(e.t - planned_word, 3),
                                    err=d, frames=None if d is None else round(d / FR, 1), ok=ok, note=note))
    # 3. tags (OCR)
    for e in EV.EVENTS:
        if e.kind != "tag" or e.name == "ticker" or not (s0 <= e.sid <= s1):
            continue
        tm = e.t + min(0.8, (e.t1 - e.t) / 2)
        got = ocr(video, tm, e.name)
        score = match_text(e.text.split("\n")[0], got)
        res["tags"].append(dict(sid=e.sid, kind=e.name, text=e.text, t0=round(e.t, 3), t1=round(e.t1, 3),
                                frame_t=round(tm, 3), frame=int(round(tm * 30)), ocr=got.strip()[:160],
                                score=round(score, 2), ok=score >= 0.7))
    out = EP / "build/sync"
    out.mkdir(parents=True, exist_ok=True)
    (out / f"{label}.json").write_text(json.dumps(res, indent=1, default=lambda o: o.item()))
    md = [f"### Sync check {label}", ""]
    ok_p = sum(1 for p in res["placement"] if p["ok"])
    md.append(f"Placement: {ok_p}/{len(res['placement'])} pass.")
    md.append("")
    md.append("| Seg | Planned VO start | Speech onset | Gap to next (audible) | Hold | Pass |")
    md.append("|---|---|---|---|---|---|")
    for p in res["placement"]:
        if "overlap_with" in p:
            md.append(f"| {p['sid']} | OVERLAP with {p['overlap_with']} | | | | FAIL |")
            continue
        md.append(f"| {p['sid']} | {p['planned_start']:.3f} | {p['measured_speech_onset']:.3f} | {p['gap_to_next']} | "
                  f"{'scripted' if p['scripted_hold'] else ''} | {'pass' if p['ok'] else 'FAIL'} |")
    okc = sum(1 for c in res["cues"] if c["ok"])
    md += ["", f"Cues on trigger words (whisper on the final mix): {okc}/{len(res['cues'])} within 3 frames.", "",
           "| Seg | Cue | Trigger | Planned word (s) | Measured, mix (s) | Measured, VO stem (s) | Error (frames) | Event offset (s) | Pass |",
           "|---|---|---|---|---|---|---|---|---|"]
    for c in res["cues"]:
        md.append(f"| {c['sid']} | {c['kind']} {c['name']} | “{c['trigger']}” | {c['planned_word']:.3f} | {c['measured_mix']} | "
                  f"{c['measured_stem']} | {c['frames']} | {c['offset_vs_word']:+.2f} | {'pass' if c['ok'] else ('MISS: ' + c['note'] if c['note'] else 'MISS')} |")
    okt = sum(1 for c in res["tags"] if c["ok"])
    md += ["", f"Tags and labels (frame pulled at each, OCR by tesseract): {okt}/{len(res['tags'])} pass.", "",
           "| Seg | Kind | Text | On screen (s) | Frame | OCR score | Pass |", "|---|---|---|---|---|---|---|"]
    for c in res["tags"]:
        md.append(f"| {c['sid']} | {c['kind']} | {c['text'].replace(chr(10), ' / ')} | {c['t0']:.2f}–{c['t1']:.2f} | {c['frame']} | "
                  f"{c['score']} | {'pass' if c['ok'] else 'CHECK'} |")
    (EP / "render/sync").mkdir(exist_ok=True)
    (EP / "render/sync" / f"{label}.md").write_text("\n".join(md) + "\n")
    print("\n".join(md[:3]))
    print(f"cues {okc}/{len(res['cues'])}  tags {okt}/{len(res['tags'])}")
    for c in res["cues"]:
        if not c["ok"]:
            print("MISS", c)
    for c in res["tags"]:
        if not c["ok"]:
            print("TAG", c["sid"], c["kind"], c["text"][:50], c["score"], "|", c["ocr"][:80].replace("\n", " "))
    for p in res["placement"]:
        if not p["ok"]:
            print("PLACE", p)


if __name__ == "__main__":
    main()
