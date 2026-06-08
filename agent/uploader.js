import { google } from 'googleapis';
import fs from 'fs';

export async function uploadToYouTube(videoPath, title, description, tags) {
  const oauth2 = new google.auth.OAuth2(
    process.env.YOUTUBE_CLIENT_ID,
    process.env.YOUTUBE_CLIENT_SECRET
  );
  oauth2.setCredentials({ refresh_token: process.env.YOUTUBE_REFRESH_TOKEN });
  
  const yt = google.youtube({ version: 'v3', auth: oauth2 });
  
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
}
