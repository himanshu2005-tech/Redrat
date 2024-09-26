// getAccessToken.js
const {JWT} = require('google-auth-library');
const serviceAccount = require('../Redrat/android/redrat-910fc-firebase-adminsdk-ublgn-113bb102c6.json'); // Ensure this path is correct

const SCOPES = ['https://www.googleapis.com/auth/firebase.messaging'];

const client = new JWT({
  email: serviceAccount.client_email,
  key: serviceAccount.private_key.replace(/\\n/g, '\n'), // Ensure the key is correctly formatted
  scopes: SCOPES,
});

async function getAccessToken() {
  try {
    const tokens = await client.authorize();
    console.log(tokens.access_token);
    return tokens.access_token;
  } catch (error) {
    console.error('Error fetching access token:', error.message);
    throw error; // Optional: rethrow the error for handling further up the call stack
  }
}

getAccessToken()
