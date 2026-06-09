import { google } from 'googleapis';
import fs from 'fs';

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

  try {
    const res = await yt.videos.insert({
      part: ['snippet', 'status'],
      requestBody: {
        snippet: {
          title,
          description,
          tags,
          categoryId: '27',
          defaultLanguage: 'en'
        },
        status: {
          privacyStatus: 'public',
          selfDeclaredMadeForKids: false
        }
      },
      media: { body: fs.createReadStream(videoPath) }
    });

    const url = `https://youtube.com/watch?v=${res.data.id}`;
    console.log('Uploaded to YouTube:', url);
    return url;
  } catch (err) {
    // If token is invalid/expired, try once more after explicit refresh
    if (err.code === 401 || err.code === 403 ||
        (err.message && err.message.includes('invalid_grant')) ||
        (err.message && err.message.includes('Token has been expired')) ||
        (err.message && err.message.includes(' unauthorized'))) {
      console.warn('YouTube upload failed with auth error, attempting token refresh...');
      try {
        const { credentials } = await oauth2.refreshAccessToken();
        oauth2.setCredentials(credentials);
        console.log('Token refreshed successfully, retrying upload...');

        const res = await yt.videos.insert({
          part: ['snippet', 'status'],
          requestBody: {
            snippet: {
              title,
              description,
              tags,
              categoryId: '27',
              defaultLanguage: 'en'
            },
            status: {
              privacyStatus: 'public',
              selfDeclaredMadeForKids: false
            }
          },
          media: { body: fs.createReadStream(videoPath) }
        });

        const url = `https://youtube.com/watch?v=${res.data.id}`;
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
