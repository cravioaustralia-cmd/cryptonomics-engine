#!/usr/bin/env python3
"""lf10 audio mix: VO (unity gain, trimmed only) + chapter music beds + SFX on picture changes.

Writes build/out/mix_premaster.wav (48 kHz stereo float). Loudness is set later on the master only.
"""
import json, os, subprocess, sys
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
EP = os.path.dirname(HERE)
SR = 48000
plan = json.load(open(os.path.join(HERE, "out", "plan.json")))
DUR = plan["duration"]
N = int(round(DUR * SR))


def load(path, ch=2):
    b = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-f", "f32le", "-ac", str(ch), "-ar", str(SR), "-"], capture_output=True, check=True).stdout
    return np.frombuffer(b, np.float32).reshape(-1, ch).copy()


def db(x):
    return 10 ** (x / 20)


def fade(x, fi, fo):
    n = len(x)
    a = int(fi * SR)
    b = int(fo * SR)
    if a > 0:
        x[: min(a, n)] *= np.linspace(0, 1, min(a, n))[:, None]
    if b > 0:
        x[max(0, n - b):] *= np.linspace(1, 0, n - max(0, n - b))[:, None]
    return x


def lufs(path):
    out = subprocess.run(["ffmpeg", "-nostats", "-i", path, "-af", "ebur128", "-f", "null", "-"], capture_output=True, text=True).stderr
    for line in out.splitlines()[::-1]:
        if line.strip().startswith("I:"):
            return float(line.split()[1])
    raise RuntimeError(path)


vo = np.zeros((N, 2), np.float32)
mus = np.zeros((N, 2), np.float32)
sfx = np.zeros((N, 2), np.float32)

# ---------------------------------------------------------------- VO (unity gain)
speech = []
for v in plan["vo"]:
    x = load(v["path"], 1)
    a, b = int(v["src_in"] * SR), int(v["src_out"] * SR)
    x = fade(x[a:b].copy(), 0.008, 0.03)
    t0 = int(round(v["t"] * SR))
    vo[t0:t0 + len(x)] += x  # mono to both channels
    speech.append((v["t"], v["t"] + (b - a) / SR))

# ---------------------------------------------------------------- music
MDIR = os.path.join(EP, "audio", "music")
DUCK = -41.0   # music loudness under narration (pre-master LUFS)
OPEN = -27.0   # music loudness in holds with no narration
marks = plan["music"]
sections = []
for i, m in enumerate(marks):
    end = marks[i + 1]["t"] if i + 1 < len(marks) else DUR
    sections.append([m["track"], m["t"], end])
# MUS_06 takes over from MUS_05 in the pause before S42 (warm swell into the ending)
s42 = next(v for v in plan["vo"] if v["seg"] == "S42")["t"]
s45 = next(v for v in plan["vo"] if v["seg"] == "S45")["t"]
s44_end = next(v for v in plan["vo"] if v["seg"] == "S44")
s44_end = s44_end["t"] + s44_end["src_out"] - s44_end["src_in"]
for sct in sections:
    if sct[0] == "MUS_05_sober":
        sct[2] = s42 - 0.35
sections.append(["MUS_06_tense_resolve", s42 - 0.35, s44_end + 0.6])
sections.append(["MUS_06_tense_resolve@60", s45 - 0.8, DUR])
sections.sort(key=lambda s: s[1])

XF = 1.2
for name, t0, t1 in sections:
    track, _, off = name.partition("@")
    path = os.path.join(MDIR, track + ".mp3")
    g = db(-23.0 - lufs(path))  # normalise every bed to -23 LUFS before automation
    x = load(path) * g
    off = int(float(off or 0) * SR)
    need = int((t1 - t0 + XF) * SR)
    seq = x[off:]
    while len(seq) < need:  # loop with crossfade if the bed is shorter than its section
        k = int(2.0 * SR)
        tail, head = seq[-k:], x[:k]
        w = np.linspace(0, 1, k)[:, None]
        seq = np.concatenate([seq[:-k], tail * (1 - w) + head * w, x[k:]])
    seq = fade(seq[:need].copy(), 0.25, XF)
    a = int(t0 * SR)
    mus[a:a + len(seq)] += seq[: N - a]

# automation: duck under speech; open in long pauses
env = np.full(N, OPEN, np.float32)
for s, e in speech:
    env[int((s - 0.25) * SR):int((e + 0.15) * SR)] = DUCK
# keep music ducked through the short pauses between takes (< 1.3 s)
for (s1, e1), (s2, e2) in zip(speech, speech[1:]):
    if s2 - e1 < 1.3:
        env[int(e1 * SR):int(s2 * SR)] = DUCK
# smooth the envelope (0.45 s ramps)
k = int(0.45 * SR)
ker = np.ones(k, np.float32) / k
env = np.convolve(env, ker, mode="same")
gain = db(env - (-23.0))
# the beat after "The one holding the pencil": music resolves, then ~2 s of near silence
q0, q1 = s44_end + 0.6, s45 - 0.8
gain[int(q0 * SR):int(q1 * SR)] *= 0.0
# end: fade the bed out over the tail
gain[int((DUR - 2.6) * SR):] *= np.linspace(1, 0, N - int((DUR - 2.6) * SR))
mus *= gain[:, None]

# ---------------------------------------------------------------- SFX
SDIR = os.path.join(EP, "audio", "sfx")
SFX_LEN = {"SFX_crowd_murmur": 3.5, "SFX_press_machinery_hum": 5.5, "SFX_vintage_phone_ring": 1.6, "SFX_record_scratch": 0.9, "SFX_typewriter": 2.0, "SFX_bass_impact": 2.5, "SFX_drone_low": 6.8, "SFX_heartbeat": 7.5}
SFX_GAIN = -18.0  # dB peak target for a gain=1.0 hit (pre-master)


def put_sfx(name, t, gain=1.0, length=None, fi=0.005, fo=0.25):
    x = load(os.path.join(SDIR, name + (".wav" if os.path.exists(os.path.join(SDIR, name + ".wav")) else ".mp3")))
    ln = length or SFX_LEN.get(name)
    if ln:
        x = x[: int(ln * SR)]
    pk = np.max(np.abs(x)) + 1e-9
    x = fade(x / pk * db(SFX_GAIN) * gain, fi, fo)
    a = int(t * SR)
    sfx[a:a + len(x)] += x[: N - a]
    return (t, t + len(x) / SR)


sfx_log = []
for s in plan["sfx"]:
    fi = 0.6 if s["name"] in ("SFX_crowd_murmur", "SFX_press_machinery_hum") else 0.005
    rng = put_sfx(s["name"], s["t"], s["gain"], fi=fi, fo=0.6 if fi > 0.1 else 0.2)
    sfx_log.append((s["name"], *rng))
# cold open: low drone + clock ticks under the lead-in and first line
sfx_log.append(("SFX_drone_low", *put_sfx("SFX_drone_low", 0.0, 0.55, fi=0.8, fo=1.5)))
for k in range(2):  # ticks only in the lead-in, before the first word
    sfx_log.append(("SFX_clock_ticks", *put_sfx("SFX_clock_ticks", 0.25 + k * 0.8, 0.35, fo=0.05)))
# chapter holds: whoosh on the picture change; title: low hit
for c in plan["chapters"][1:]:
    sfx_log.append(("SFX_whoosh_set", *put_sfx("SFX_whoosh_set", c["t"], 0.45, fo=0.4)))
title_t = plan["title_t"]
sfx_log.append(("SFX_bass_impact", *put_sfx("SFX_bass_impact", title_t, 0.8, fo=1.0)))
# S10 stamp lands with the record-scratch cut
for s in plan["sfx"]:
    if s["name"] == "SFX_record_scratch":
        sfx_log.append(("SFX_stamp", *put_sfx("SFX_stamp", s["t"] + 0.12, 0.6, fo=0.3)))
# S26 four-leader montage: heartbeat bed, low
s26 = next(v for v in plan["vo"] if v["seg"] == "S26")
hb = s26["t"] + 11.0
sfx_log.append(("SFX_heartbeat", *put_sfx("SFX_heartbeat", hb, 0.5, fi=0.5, fo=1.0)))

mix = vo + mus + sfx
os.makedirs(os.path.join(HERE, "out"), exist_ok=True)
out = os.path.join(HERE, "out", "mix_premaster.wav")
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ac", "2", "-ar", str(SR), "-i", "-", "-c:a", "pcm_f32le", out], input=mix.astype(np.float32).tobytes(), check=True)
vo_only = os.path.join(HERE, "out", "vo_only.wav")
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ac", "2", "-ar", str(SR), "-i", "-", "-ac", "1", "-c:a", "pcm_s16le", vo_only], input=vo.astype(np.float32).tobytes(), check=True)

# report hits whose onset lands on voiced narration (energy-based, 10 ms frames; beds excluded)
beds = {"SFX_crowd_murmur", "SFX_press_machinery_hum", "SFX_drone_low", "SFX_heartbeat"}
hop = SR // 100
vmono = vo[:, 0]
nfr = len(vmono) // hop
vdb = 20 * np.log10(np.sqrt(np.mean(vmono[: nfr * hop].reshape(nfr, hop) ** 2, axis=1)) + 1e-9)
print(f"mix written: {DUR:.2f}s; sfx placed: {len(sfx_log)}")
bad = 0
for name, a, b in sfx_log:
    if name in beds:
        continue
    f0, f1 = int(a * 100), int((a + 0.15) * 100)
    if np.max(vdb[f0:f1]) > -38:
        bad += 1
        print(f"  SFX onset on voiced narration: {name} @ {a:.2f} (VO peak {np.max(vdb[f0:f1]):.1f} dB)")
json.dump(dict(sfx=sorted({x[0] for x in sfx_log}), music=sorted({x[0].split("@")[0] for x in sections})), open(os.path.join(HERE, "out", "audio_used.json"), "w"), indent=1)
print(f"SFX hits checked: {sum(1 for x in sfx_log if x[0] not in beds)}, on words: {bad}")
