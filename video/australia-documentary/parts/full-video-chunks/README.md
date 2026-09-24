# Getting australia-full.mp4

GitHub Releases and Git LFS are both unavailable in the environment this
video was built in, and the assembled file (~240 MB) is over git's 100 MB
single-file limit — so it's committed here split into pieces.

## Easiest way (no command line): extract a ZIP

1. Download all three of these files into the **same folder**:
   `australia-full.z01`, `australia-full.z02`, `australia-full.zip`
   (there's also a fourth CLI-only chunk, `.part3`, from the command-line
   method below — ignore it for the ZIP method)
2. Open/extract `australia-full.zip`. Your OS finds the other two parts
   automatically and reassembles the video and subtitles.
   - **Windows**: install [7-Zip](https://7-zip.org) (free) if you don't
     have it — Windows' built-in extractor doesn't handle split zips.
     Right-click `australia-full.zip` → 7-Zip → Extract Here.
   - **Mac**: install [Keka](https://apps.apple.com/app/keka/id470158793)
     (free) or use `7z x australia-full.zip` in Terminal — the built-in
     Archive Utility doesn't handle split zips either.
   - **Linux**: `7z x australia-full.zip` (or `p7zip -d`).

You'll get `australia-full.mp4` and `australia-full.srt`.

## Command-line way

Download `australia-full.mp4.part0` through `.part3`, then:

```
cat australia-full.mp4.part0 australia-full.mp4.part1 australia-full.mp4.part2 australia-full.mp4.part3 > australia-full.mp4
```

## Verify (either method)

```
sha256sum australia-full.mp4
# 7549f81cd09707854f7c4af807961af7ee8905a3a822d5db6542a51846659f93
```

Subtitles are also at `../australia-full.srt` directly (not split; it's small).
