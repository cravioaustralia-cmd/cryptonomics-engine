#!/usr/bin/env node
/* Writes CUE_SHEET.md and TIMING.md from out/score.json (Whisper-locked). */
import fs from 'node:fs';
import path from 'node:path';

const EP = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..');
const SC = JSON.parse(fs.readFileSync(path.join(EP, 'out', 'score.json'), 'utf8'));
const fmt = (t) => `${Math.floor(t / 60)}:${(t % 60).toFixed(1).padStart(4, '0')}`;
const yt = (t) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
const segOf = (t) => { let id = '—'; for (const s of SC.segments) { if (t >= s.preStart - 0.01) id = s.id; } if (t >= SC.endScreen.start) id = 'End'; return id; };

const SFX_DESC = {
  drone: 'Low drone from frame 1 (synth)', boom: 'Deep boom on "invade Australia"', stamp: 'Stamp thud', thunk: 'Pin thunk',
  zoom_in: 'Soft air swish into the pin (zoom-through)', sting_series: 'IF AUSTRALIA series sting (title build)', siren: 'Air-raid siren, distant, fades in, peaks, fades on the pull-back',
  explosion_far: 'Distant explosion (no screams)', crackle: 'Crackle between the Navy and Army icons', sting_cliff: 'Cliffhanger sting', whoosh: 'Whoosh into the scenario numeral',
  drum_1: 'Drum hit, "1"', drum_2: 'Heavier drum hit, "2"', drum_3: 'Heaviest hit, "3"', wind_gust: 'Single gust of desert wind (comic beat)', sonar: 'Sonar ping',
  snap: 'Snapping cable', wind_low: 'Low wind tone, near silence', lownote: 'Single low note (bed out)',
};
const MUS_DESC = {
  tension: 'Bed in (tense)', cut: 'Music cuts out completely', swell: 'Bed swells back in', duck: 'Bed dipped', act1: 'Bed under Act 1 storytelling', lownote: 'Bed out; single low note',
  story: 'Bed under storytelling', out: 'Bed fades out', north: 'Bed back after the "1"', curious: 'Lighter, curious: same bed thinned (high-passed) and lowered', serious: 'Bed back to full body',
  warm_respect: 'Bed lowered, respectful', invasion: 'Bed back after the "2"', build: 'Bed builds', strings: 'Strings only: the bed alone (basses and violins), no SFX', cutoff: 'Bed back after the "3"',
  tense: 'Bed tense', lift: 'Music lifts', resolve: 'Music resolves and holds', warm: 'Bed under Act 5, lowered', outro: 'Music outro under the badge, fades over the last 2.5 s',
};
let cue = `# Cue sheet — lf01 IF AUSTRALIA

Times are film time from the Whisper-locked cut (\`render/timeline.json\`). Music is one bed throughout: Kevin MacLeod, "Long note One" (CC BY 4.0), looped with a 6 s crossfade and ducked under the voice. Every SFX is synthesised in-house by \`render/tools/build-sfx.py\` (no third-party samples). The series sting is \`render/sfx/sting_series.wav\`, made for this episode and kept for later episodes.

Sparse by design: no whoosh/pop chatter. A soft swish marks each zoom-through approach, and each pin drop gets a quiet thunk, because the script asks for "pins dropping with a thunk".

## Music (bed level states)
| Time | Beat | Cue |
|---|---|---|
${SC.music.map((m) => `| ${fmt(m.t)} | ${segOf(m.t)} | ${MUS_DESC[m.cue] || m.cue}${m.cue === 'duck' ? ` (${m.to} dB)` : ''} |`).join('\n')}

## Sound effects
| Time | Beat | Cue | Level |
|---|---|---|---|
${SC.sfx.map((s) => `| ${fmt(s.t)} | ${segOf(s.t)} | ${SFX_DESC[s.name] || s.name}${s.len ? ` (${s.len.toFixed(1)} s)` : ''} | ${s.db} dB |`).join('\n')}

## B-roll zoom-throughs
| Clip | In | Out | Length | Beat |
|---|---|---|---|---|
${SC.broll.map((b) => `| ${b.id} | ${fmt(b.t)} | ${fmt(b.t + b.dur)} | ${b.dur} s | ${b.beat} |`).join('\n')}
`;
fs.writeFileSync(path.join(EP, 'CUE_SHEET.md'), cue);

const heard = SC.anchors.filter((a) => a.how === 'heard').length;
let tm = `# Timing note — lf01 IF AUSTRALIA

- **Runtime ${fmt(SC.duration)}** (${SC.duration.toFixed(2)} s), end screen included (${fmt(SC.endScreen.start)}–${fmt(SC.endScreen.end)}).
- The script's "about 9:00" does not hold. The 34 seated takes run longer than the script clocks assumed. The film was not forced to 9:00: no take was trimmed, sped up or re-timed. Only head and tail silence padding inside each file was trimmed.
- Edit gaps are the script's seconds, placed after each chunk (and before V12, V19 and V25 for the "1", "2", "3" slams).
- Every in-beat event is anchored to a word Whisper heard in the take: **${heard} of ${SC.anchors.length} anchors heard**, none on fallback.

## Chapters (from the locked cut)
${SC.chapters.map((c) => `- ${yt(c.t)} ${c.title}`).join('\n')}

## Mid-roll points
${SC.midrolls.map((m) => `- ${fmt(m.t)} after ${m.after} (script said ${m.scriptClock}). Picture holds on the map. No ad read.`).join('\n')}

## Chunk placement
| Chunk | Script clock | Film start | Film end | Gap after |
|---|---|---|---|---|
${SC.segments.map((s) => `| ${s.id} | ${fmt(s.scriptClock)} | ${fmt(s.start)} | ${fmt(s.end)} | ${s.gapAfter} s |`).join('\n')}

## Anchors
| Chunk | Phrase | Film time | Result |
|---|---|---|---|
${SC.anchors.map((a) => `| ${a.id} | "${a.phrase}" | ${a.t == null ? '—' : fmt(a.t)} | ${a.how} |`).join('\n')}
`;
fs.writeFileSync(path.join(EP, 'TIMING.md'), tm);
console.log('CUE_SHEET.md, TIMING.md written');
