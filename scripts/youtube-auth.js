/**
 * YouTube OAuth2 Token Generator
 * 
 * Run this script locally to generate a new refresh token:
 *   node scripts/youtube-auth.js
 * 
 * Prerequisites:
 *   - YOUTUBE_CLIENT_ID and YOUTUBE_CLIENT_SECRET set in environment or .env
 *   - A Google Cloud project with YouTube Data API v3 enabled
 *   - OAuth 2.0 credentials with redirect URI set to http://localhost:3000
 * 
 * Steps:
 *   1. Run this script
 *   2. Open the authorization URL in your browser
 *   3. Sign in and authorize the app
 *   4. You'll be redirected to localhost - copy the code from the URL
 *   5. Paste the code when prompted
 *   6. Copy the refresh token and add it as YOUTUBE_REFRESH_TOKEN in GitHub secrets
 */

import { google } from 'googleapis';
import http from 'http';
import url from 'url';
import readline from 'readline';

const SCOPES = [
  'https://www.googleapis.com/auth/youtube.upload',
  'https://www.googleapis.com/auth/youtube'
];

const REDIRECT_URI = 'http://localhost:3000/oauth2callback';

async function main() {
  const clientId = process.env.YOUTUBE_CLIENT_ID;
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error('Error: YOUTUBE_CLIENT_ID and YOUTUBE_CLIENT_SECRET must be set.');
    console.error('Set them in your environment or a .env file:');
    console.error('  export YOUTUBE_CLIENT_ID=your_client_id');
    console.error('  export YOUTUBE_CLIENT_SECRET=your_client_secret');
    process.exit(1);
  }

  const oauth2 = new google.auth.OAuth2(clientId, clientSecret, REDIRECT_URI);

  const authUrl = oauth2.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent'  // Force consent to get a new refresh token
  });

  console.log('\n=== YouTube OAuth2 Token Generator ===\n');
  console.log('1. Open this URL in your browser:\n');
  console.log(authUrl);
  console.log('\n2. Sign in and authorize the app.');
  console.log('3. You\'ll be redirected to localhost (which may show an error - that\'s normal).\n');

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const code = await new Promise(resolve => {
    rl.question('4. Paste the authorization code here: ', resolve);
  });
  rl.close();

  try {
    const { tokens } = await oauth2.getToken(code.trim());
    
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
