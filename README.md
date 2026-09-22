# cryptonomics-engine

Automated YouTube Shorts, built with [Remotion](https://www.remotion.dev) (React for video).

## What's in here

- `src/TestShort.tsx` — a test composition (`TestShort`): vertical 1080x1920, 30fps, 10 seconds, with animated text.
- `src/Root.tsx` — registers all compositions.
- `.github/workflows/render.yml` — a GitHub Actions workflow you can trigger manually to render a video and download it as an artifact, no local setup required.
- `.agents/skills/` — official [Remotion Agent Skills](https://www.remotion.dev/docs/ai/skills), installed via `npx remotion skills add`, so AI coding agents follow Remotion best practices in this repo.

## Local development

```bash
npm install
npm run dev      # opens Remotion Studio to preview compositions
npm run render   # renders TestShort to out/video.mp4
```

## Rendering from GitHub (no computer needed)

Go to the **Actions** tab → **Render video** workflow → **Run workflow**. When it finishes, download the `video` artifact.
