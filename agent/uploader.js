import { google } from 'googleapis';
import fs from 'fs';

function sanitizeTags(tags) {
  if (!Array.isArray(tags)) return [];
  return tags
    .filter(t => typeof t === 'string' && t.trim())
    .map(t => t.replace(/[<>&"']/g, '').trim().slice(0, 30))
    .filter(t => t.length > 0)
    .slice(0, 50);
}

/**
 * Upload video to YouTube with automatic token refresh.
 * 
 * If the upload fails with a 401/403 token error, this will attempt
 * to refresh the access token once and retry.
 */
export async function uploadToYouTube(videoPath, title, description, tags) {
  const clientId = process.env.YOUTUBE_CLIENT_ID;
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
  const refreshToken = process.env.YOUTUBE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      'YouTube credentials missing. Required env vars: YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET, YOUTUBE_REFRESH_TOKEN. '
      + 'Run `node scripts/youtube-auth.js` to generate a new refresh token.'
    );
  }

  const oauth2 = new google.auth.OAuth2(clientId, clientSecret);
  oauth2.setCredentials({ refresh_token: refreshToken });

  // Listen for token refresh events to log them
  oauth2.on('tokens', (tokens) => {
    if (tokens.refresh_token) {
      console.log('YouTube OAuth token refreshed. New refresh token:', tokens.refresh_token.substring(0, 10) + '...');
      console.log('Update YOUTUBE_REFRESH_TOKEN in GitHub secrets with this value.');
    }
  });

  const yt = google.youtube({ version: 'v3', auth: oauth2 });

  if (!fs.existsSync(videoPath)) throw new Error(`Video file not found: ${videoPath}`);
  const stats = fs.statSync(videoPath);
  if (stats.size === 0) throw new Error('Video file is empty');
  if (stats.size > 128 * 1024 * 1024 * 1024) throw new Error('Video file exceeds 128GB');

  async function doUpload() {
    const res = await yt.videos.insert({
      part: ['snippet', 'status'],
      requestBody: {
        snippet: {
          title,
          description: description?.slice(0, 5000) || '',
          tags: sanitizeTags(tags),
          categoryId: process.env.YOUTUBE_CATEGORY_ID || '27',
          defaultLanguage: 'en'
        },
        status: {
          privacyStatus: process.env.YOUTUBE_PRIVACY || 'public',
          selfDeclaredMadeForKids: false
        }
      },
      media: { body: fs.createReadStream(videoPath) }
    });
    return `https://youtube.com/watch?v=${res.data.id}`;
  }

  try {
    const url = await doUpload();
    console.log('Uploaded to YouTube:', url);
    return url;
  } catch (err) {
    // If token is invalid/expired, try once more after explicit refresh
    const status = err.response?.status || err.code;
    const msg = err.message || '';
    const isAuthError = status === 401 || status === 403 ||
      msg.includes('invalid_grant') ||
      msg.includes('Token has been expired') ||
      msg.includes('unauthorized');

    if (isAuthError) {
      console.warn('YouTube upload failed with auth error, attempting token refresh...');
      try {
        const { credentials } = await oauth2.refreshAccessToken();
        oauth2.setCredentials(credentials);
        console.log('Token refreshed successfully, retrying upload...');
        const url = await doUpload();
        console.log('Uploaded to YouTube (after retry):', url);
        return url;
      } catch (retryErr) {
        console.error('YouTube upload failed after token refresh:', retryErr.message);
        console.error('You may need to generate a new refresh token. Run: node scripts/youtube-auth.js');
        throw retryErr;
      }
    }
    throw err;
  }
}
