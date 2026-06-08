# Finance Video Agent

A fully automated AI pipeline that generates and publishes finance education videos to YouTube every 2 days.

## Architecture

```
GitHub Actions (cron every 2 days)
  └─► Tavily Search API (fetch finance news)
  └─► NVIDIA NIM / Llama 3.1 70B (generate video script)
  └─► Remotion v4 (server-side render 1920x1080 MP4)
  └─► YouTube Data API v3 (upload and publish)
```

## How It Works

1. **News Gathering** — Fetches top finance stories via Tavily Search with 3 parallel queries
2. **Script Generation** — NVIDIA NIM (Llama 3.1 70B) writes a 5-minute video script with scenes, animation cues, and market data
3. **Video Rendering** — Remotion renders the script to 1920x1080 MP4 on GitHub Actions (headless, no browser)
4. **YouTube Upload** — Google Data API v3 uploads and publishes the video automatically

## Required GitHub Secrets

| Secret | Description |
|--------|-------------|
| `NVIDIA_API_KEY` | NVIDIA NIM API key for Llama 3.1 70B |
| `TAVILY_API_KEY` | Tavily Search API key for news fetching |
| `YOUTUBE_CLIENT_ID` | Google Cloud OAuth 2.0 client ID |
| `YOUTUBE_CLIENT_SECRET` | Google Cloud OAuth 2.0 client secret |
| `YOUTUBE_REFRESH_TOKEN` | YouTube OAuth 2.0 refresh token |

## Getting a YouTube Refresh Token

1. Go to [Google Cloud Console](https://console.cloud.google.com) and create a project
2. Enable the YouTube Data API v3
3. Create OAuth 2.0 credentials (Desktop application)
4. Use the OAuth 2.0 Playground or a script to get a refresh token with `https://www.googleapis.com/auth/youtube.upload` scope
5. Add the refresh token as `YOUTUBE_REFRESH_TOKEN` in GitHub Secrets

## Manual Trigger

Go to the **Actions** tab in this repo, select **Generate Finance Video**, and click **Run workflow**.

## Stack

- **Runtime:** Node.js 20, ESM (`"type": "module"`)
- **LLM:** NVIDIA NIM — `meta/llama-3.1-70b-instruct`
- **Video:** Remotion v4 (`@remotion/bundler`, `@remotion/renderer`)
- **APIs:** Tavily Search, Google YouTube Data v3
- **CI/CD:** GitHub Actions (`ubuntu-latest`)
