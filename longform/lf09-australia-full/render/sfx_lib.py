#!/usr/bin/env python3
"""Build the SFX library (48 kHz stereo WAV, peak -12 dBFS) from the supplied free SFX, plus a few
synthesised utility sounds (pop/click/ping/tones/swishes) generated here with ffmpeg (no third-party audio)."""
import os, subprocess
EP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SFX = os.path.join(EP, 'audio', 'sfx'); OUT = os.path.join(EP, 'render', 'cache', 'sfx'); os.makedirs(OUT, exist_ok=True)
F = lambda n: os.path.join(SFX, n)
# name -> (source or None for synth, filter chain, max seconds)
LIB = {
 'bass_impact': (F('SFX_bass_impact.wav'), '', 3), 'whoosh': (F('SFX_whoosh_set.wav'), '', 1.6), 'swoop': (F('SFX_whoosh_set.wav'), 'asetrate=48000*0.8,aresample=48000', 1.8),
 'sweep': (F('SFX_whoosh_set.wav'), 'highpass=f=400', 1.6), 'reverse_whoosh': (F('SFX_whoosh_set.wav'), 'atrim=0:1.6,areverse', 1.6),
 'tick_roll': (F('SFX_tick_roll.wav'), '', 1.6), 'shutter': (F('SFX_shutter.wav'), '', 0.8), 'flash': (F('SFX_shutter.wav'), 'highpass=f=800', 0.6),
 'drone_low': (F('SFX_drone_low.mp3'), '', 6), 'rumble': (F('SFX_drone_low.mp3'), 'lowpass=f=180,volume=6dB', 2.5), 'hum': (F('SFX_drone_low.mp3'), 'lowpass=f=400', 2.0),
 'thread_snap': (F('SFX_thread_snap.mp3'), '', 1.2), 'snap': (F('SFX_thread_snap.mp3'), '', 0.8), 'rope': (F('SFX_thread_snap.mp3'), 'asetrate=48000*0.85,aresample=48000', 1.5), 'creak': (F('SFX_thread_snap.mp3'), 'asetrate=48000*0.6,aresample=48000,lowpass=f=1500', 1.5),
 'slot_roll': (F('SFX_slot_roll.mp3'), '', 1.8), 'spin': (F('SFX_slot_roll.mp3'), '', 1.0),
 'marker': (F('SFX_marker.wav'), '', 1.0), 'pen': (F('SFX_marker.wav'), '', 1.4), 'zip': (F('SFX_marker.wav'), 'atempo=1.6', 0.8),
 'split_flap': (F('SFX_split_flap.mp3'), '', 1.6), 'paper_slide': (F('SFX_paper_slide.wav'), '', 1.0), 'paper_rip': (F('SFX_paper_slide.wav'), 'highpass=f=600', 1.0),
 'page_turn': (F('SFX_paper_slide.wav'), '', 0.9), 'card_fan': (F('SFX_paper_slide.wav'), 'atempo=1.3', 0.9), 'rustle': (F('SFX_paper_slide.wav'), 'lowpass=f=3000', 1.0),
 'stamp': (F('SFX_stamp.wav'), '', 1.0), 'thud': (F('SFX_stamp.wav'), 'lowpass=f=500,volume=4dB', 0.8), 'thunk': (F('SFX_stamp.wav'), 'lowpass=f=700,volume=3dB', 0.8), 'drop': (F('SFX_stamp.wav'), 'lowpass=f=900', 0.8),
 'chain_rattle': (F('SFX_chain_rattle.mp3'), '', 1.6), 'jet': (F('SFX_jet_soft.wav'), '', 3.0), 'glass_clink': (F('SFX_glass_clink.mp3'), '', 1.5),
 'heartbeat': (F('SFX_heartbeat.mp3'), '', 1.0), 'pulse': (F('SFX_heartbeat.mp3'), 'lowpass=f=300', 1.0),
 'clock': (F('SFX_clock_ticks.wav'), '', 2.0), 'clock_whirr': (F('SFX_clock_ticks.wav'), 'atempo=2.0', 1.0),
 'lamp': (F('SFX_lamp_click.mp3'), '', 0.6), 'switch': (F('SFX_lamp_click.mp3'), '', 0.6),
 'padlock_break': (F('SFX_padlock_break.mp3'), '', 1.6), 'receipt': (F('SFX_receipt_printer.mp3'), '', 1.8),
 'room_tone': (F('SFX_room_tone.mp3'), '', 600),
 # synthesised utilities
 'pop': (None, "aevalsrc='0.9*sin(2*PI*(900-700*t)*t)*exp(-30*t)':d=0.18", 0.2),
 'click': (None, "aevalsrc='0.9*sin(2*PI*2400*t)*exp(-90*t)+0.4*(random(0)-0.5)*exp(-160*t)':d=0.08", 0.1),
 'tick': (None, "aevalsrc='0.9*sin(2*PI*1800*t)*exp(-60*t)':d=0.12", 0.15),
 'type_thud': (None, "aevalsrc='0.9*sin(2*PI*(120-60*t)*t)*exp(-22*t)+0.3*(random(0)-0.5)*exp(-80*t)':d=0.25", 0.3),
 'ping': (None, "aevalsrc='0.6*sin(2*PI*1320*t)*exp(-7*t)+0.25*sin(2*PI*2640*t)*exp(-10*t)':d=0.7", 0.8),
 'swipe': (None, "anoisesrc=d=0.45:c=pink:a=0.6,afade=t=in:d=0.15,afade=t=out:st=0.2:d=0.25,bandpass=f=2500:w=1800", 0.5),
 'needle': (None, "anoisesrc=d=0.5:c=pink:a=0.5,afade=t=in:d=0.2,afade=t=out:st=0.25:d=0.25,bandpass=f=1500:w=900", 0.5),
 'riser': (None, "aevalsrc='0.4*sin(2*PI*(200+900*t*t)*t)':d=1.4,afade=t=in:d=1.2,afade=t=out:st=1.25:d=0.15", 1.4),
 'swell': (None, "aevalsrc='0.35*sin(2*PI*110*t)+0.25*sin(2*PI*165*t)+0.15*sin(2*PI*220*t)':d=2.2,afade=t=in:d=1.6,afade=t=out:st=1.7:d=0.5", 2.2),
 'glitch': (None, "aevalsrc='0.5*sin(2*PI*700*t)*lt(mod(t,0.04),0.02)+0.3*(random(0)-0.5)':d=0.22", 0.25),
 'shimmer': (None, "aevalsrc='0.25*sin(2*PI*2093*t)+0.2*sin(2*PI*2637*t)+0.15*sin(2*PI*3136*t)':d=1.2,afade=t=in:d=0.25,afade=t=out:st=0.4:d=0.8", 1.2),
 'wind': (None, "anoisesrc=d=3:c=brown:a=0.5,lowpass=f=600,afade=t=in:d=1,afade=t=out:st=1.8:d=1.2", 3),
 'whirr': (None, "aevalsrc='0.4*sin(2*PI*(180+40*sin(2*PI*14*t))*t)':d=0.9,afade=t=out:st=0.6:d=0.3", 0.9),
 'tone': (None, "aevalsrc='0.4*sin(2*PI*440*t)*exp(-2*t)+0.2*sin(2*PI*660*t)*exp(-2.5*t)':d=1.2", 1.2),
 'tone_a': (None, "aevalsrc='0.4*sin(2*PI*392*t)*exp(-2*t)':d=1.0", 1.0), 'tone_b': (None, "aevalsrc='0.4*sin(2*PI*330*t)*exp(-2*t)':d=1.0", 1.0),
 'chord': (None, "aevalsrc='0.25*sin(2*PI*330*t)+0.25*sin(2*PI*392*t)+0.2*sin(2*PI*494*t)':d=1.6,afade=t=in:d=0.05,afade=t=out:st=0.4:d=1.2", 1.6),
 'hmm': (None, "aevalsrc='0.4*sin(2*PI*(150+15*sin(2*PI*2*t))*t)':d=0.8,afade=t=in:d=0.1,afade=t=out:st=0.4:d=0.4", 0.8),
 'descend': (None, "aevalsrc='0.35*sin(2*PI*(600-350*t)*t)':d=1.0,afade=t=out:st=0.5:d=0.5", 1.0), 'dip': (None, "aevalsrc='0.35*sin(2*PI*(500-300*t)*t)':d=0.6,afade=t=out:st=0.3:d=0.3", 0.6),
 'fade_tone': (None, "aevalsrc='0.3*sin(2*PI*262*t)':d=0.9,afade=t=out:st=0.1:d=0.8", 0.9),
 'settle': (None, "aevalsrc='0.3*sin(2*PI*196*t)*exp(-3*t)':d=1.0", 1.0), 'twist': (None, "aevalsrc='0.35*sin(2*PI*(300+200*sin(2*PI*1.2*t))*t)':d=0.9,afade=t=out:st=0.5:d=0.4", 0.9),
 'tape_stop': (None, "aevalsrc='0.35*sin(2*PI*(400-380*t)*t)':d=0.9,afade=t=out:st=0.6:d=0.3", 0.9),
 'clash': (None, "anoisesrc=d=0.3:c=white:a=0.5,highpass=f=1500,afade=t=out:st=0.05:d=0.25", 0.3),
}
def build(name):
    src, flt, mx = LIB[name]; out = os.path.join(OUT, name + '.wav')
    if src:
        chain = (flt + ',' if flt else '') + f"atrim=0:{mx},afade=t=out:st={max(0, mx - 0.25)}:d=0.25,aformat=sample_rates=48000:channel_layouts=stereo"
        cmd = ['ffmpeg', '-v', 'error', '-y', '-i', src, '-af', chain, out]
    else:
        cmd = ['ffmpeg', '-v', 'error', '-y', '-f', 'lavfi', '-i', flt, '-af', 'aformat=sample_rates=48000:channel_layouts=stereo', out]
    subprocess.run(cmd, check=True)
    if name != 'room_tone':  # peak-normalise to -12 dBFS
        st = subprocess.run(['ffmpeg', '-i', out, '-af', 'volumedetect', '-f', 'null', '-'], capture_output=True, text=True).stderr
        mxv = float(st.split('max_volume:')[1].split('dB')[0]); tmp = out + '.tmp.wav'
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', out, '-af', f'volume={-12 - mxv}dB', tmp], check=True); os.replace(tmp, out)
if __name__ == '__main__':
    from concurrent.futures import ThreadPoolExecutor
    with ThreadPoolExecutor(4) as ex: list(ex.map(build, LIB))
    print(len(os.listdir(OUT)), 'sfx built')
