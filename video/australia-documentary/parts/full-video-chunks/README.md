# Reassembling australia-full.mp4

GitHub Releases and Git LFS are both unavailable in the environment this
video was built in, and the assembled file (~240 MB) is over git's 100 MB
single-file limit — so it's committed here split into three < 100 MB
chunks instead.

To reassemble it (from this directory):

```
cat australia-full.mp4.part0 australia-full.mp4.part1 australia-full.mp4.part2 > australia-full.mp4
```

Or from the `video/australia-documentary` directory:

```
cat parts/full-video-chunks/australia-full.mp4.part* > parts/australia-full.mp4
```

Verify the reassembled file's SHA-256 matches:

```
sha256sum australia-full.mp4
# 908251cf1d04402fe428b71a69d7fbcc1da39d63067c989077f472bbbaaadf89
```

Subtitles are at `../australia-full.srt` (not split; it's small).
