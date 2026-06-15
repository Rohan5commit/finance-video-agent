# Finance Video Agent

A fully automated AI pipeline that generates and publishes finance education videos to YouTube every 2 days.

## Architecture

```
GitHub Actions (cron Mon/Wed/Fri)
  └─► Currents API (fetch finance news — 1,000 requests/day free)
  └─► Twelve Data API (real-time market data)
  └─► NVIDIA NIM / Llama 3.1 (generate video script)
  └─► Kokoro TTS (text-to-speech narration)
  └─► Remotion v4 (server-side render 1920x1080 MP4)
  └─► YouTube Data API v3 (upload and publish)
```

## How It Works

1. **News Gathering** — Fetches top finance stories via Currents API with ~8 targeted queries
2. **Market Data** — Fetches real-time quotes for indices, stocks, crypto, and commodities via Twelve Data
3. **Script Generation** — NVIDIA NIM (Llama 3.1) writes a 5-6 minute video script with scenes, animation cues, and market data
4. **Narration** — Kokoro TTS generates audio narration
5. **Video Rendering** — Remotion renders the script to 1920x1080 MP4 on GitHub Actions (headless, no browser)
6. **YouTube Upload** — Google Data API v3 uploads and publishes the video automatically

## Required GitHub Secrets

| Secret | Description |
|--------|-------------|
| `NVIDIA_API_KEY` | NVIDIA NIM API key for Llama 3.1 |
| `CURRENTS_API_KEY` | Currents API key for news fetching (free: 1,000 req/day) |
| `TWELVE_DATA_API_KEY` | Twelve Data API key for real-time market data |
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
- **TTS:** Kokoro neural TTS (Python)
- **Video:** Remotion v4 (`@remotion/bundler`, `@remotion/renderer`)
- **APIs:** Currents API, Twelve Data, Google YouTube Data v3
- **CI/CD:** GitHub Actions (`ubuntu-latest`)
