/**
 * YouTube OAuth2 Token Generator
 * 
 * Run this script locally to generate a new refresh token:
 *   node scripts/youtube-auth.js
 * 
 * Prerequisites:
 *   - YOUTUBE_CLIENT_ID and YOUTUBE_CLIENT_SECRET set in environment
 *   - A Google Cloud project with YouTube Data API v3 enabled
 *   - OAuth 2.0 credentials with redirect URI set to http://localhost:8765/oauth2callback
 * 
 * Steps:
 *   1. Run this script
 *   2. Open the authorization URL in your browser
 *   3. Sign in and authorize the app
 *   4. The script auto-captures the code - no manual paste needed!
 *   5. Copy the refresh token and add it as YOUTUBE_REFRESH_TOKEN in GitHub secrets
 */

import { google } from 'googleapis';
import http from 'http';
import { URL } from 'url';

const SCOPES = [
  'https://www.googleapis.com/auth/youtube.upload',
  'https://www.googleapis.com/auth/youtube'
];

const PORT = 8765;
const REDIRECT_URI = `http://localhost:${PORT}/oauth2callback`;

async function main() {
  const clientId = process.env.YOUTUBE_CLIENT_ID;
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error('Error: YOUTUBE_CLIENT_ID and YOUTUBE_CLIENT_SECRET must be set.');
    console.error('Set them in your environment:');
    console.error('  export YOUTUBE_CLIENT_ID=your_client_id');
    console.error('  export YOUTUBE_CLIENT_SECRET=your_client_secret');
    process.exit(1);
  }

  const oauth2 = new google.auth.OAuth2(clientId, clientSecret, REDIRECT_URI);

  const authUrl = oauth2.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent'
  });

  console.log('\n=== YouTube OAuth2 Token Generator ===\n');
  console.log('1. Open this URL in your browser:\n');
  console.log(authUrl);
  console.log('\n2. Sign in and authorize the app.');
  console.log('3. Waiting for OAuth callback on port ' + PORT + '...\n');

  // Start a local server to capture the OAuth callback
  const code = await new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const parsedUrl = new URL(req.url, `http://localhost:${PORT}`);
      
      if (parsedUrl.pathname === '/oauth2callback') {
        const code = parsedUrl.searchParams.get('code');
        const error = parsedUrl.searchParams.get('error');
        
        if (error) {
          res.writeHead(400, { 'Content-Type': 'text/html' });
          res.end(`<h1>Error: ${error}</h1><p>You can close this tab.</p>`);
          reject(new Error(`OAuth error: ${error}`));
          server.close();
          return;
        }
        
        if (code) {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end('<h1>Success!</h1><p>You can close this tab. The token has been generated.</p>');
          resolve(code);
          server.close();
        } else {
          res.writeHead(400, { 'Content-Type': 'text/html' });
          res.end('<h1>Error: No authorization code received</h1>');
          reject(new Error('No authorization code in callback'));
          server.close();
        }
      } else {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>Not Found</h1>');
      }
    });

    server.listen(PORT, () => {
      console.log(`Local server listening on port ${PORT}`);
    });

    // Timeout after 5 minutes
    setTimeout(() => {
      server.close();
      reject(new Error('Timeout waiting for OAuth callback (5 minutes)'));
    }, 5 * 60 * 1000);
  });

  try {
    const { tokens } = await oauth2.getToken(code);
    
    console.log('\n=== Success! ===\n');
    console.log('Access token:', tokens.access_token?.substring(0, 20) + '...');
    console.log('Refresh token:', tokens.refresh_token);
    console.log('Expires in:', tokens.expiry_date);
    
    console.log('\n=== Next Steps ===\n');
    console.log('Add this refresh token as a GitHub Actions secret:');
    console.log('  1. Go to: https://github.com/Rohan5commit/finance-video-agent/settings/secrets/actions');
    console.log('  2. Edit or create secret named YOUTUBE_REFRESH_TOKEN');
    console.log('  3. Paste this value:');
    console.log('\n' + tokens.refresh_token + '\n');
    
  } catch (err) {
    console.error('Error exchanging code for tokens:', err.message);
    process.exit(1);
  }
}

main();
