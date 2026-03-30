const { google } = require('googleapis');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '.env.local') });

async function test() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const calendarId = process.env.GOOGLE_CALENDAR_ID;

  console.log('Testing with:');
  console.log('Email:', email);
  console.log('Calendar ID:', calendarId);
  console.log('Key exists:', !!privateKey);

  if (!email || !privateKey || !calendarId) {
    console.error('Missing env variables');
    return;
  }

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: email,
        private_key: privateKey,
      },
      scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
    });
    const calendar = google.calendar({ version: 'v3', auth });
    const res = await calendar.events.list({
      calendarId: calendarId,
      timeMin: (new Date()).toISOString(),
      maxResults: 1,
    });
    console.log('Success! Connection verified.');
  } catch (err) {
    console.error('Connection Failed:');
    console.error(err.message);
    if (err.response) {
      console.error('Status:', err.response.status);
      console.error('Data:', JSON.stringify(err.response.data, null, 2));
    }
  }
}

test();
