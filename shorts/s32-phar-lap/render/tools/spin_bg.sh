#!/bin/sh
# render spin frames with two workers (from both ends of the list; finished frames are skipped by camera key)
cd "$(dirname "$0")" && node dump_spins.mjs && python3 make_spin.py > /tmp/spin.log 2>&1 &
cd "$(dirname "$0")" && sleep 3 && python3 make_spin.py --reverse > /tmp/spin2.log 2>&1 &
wait
