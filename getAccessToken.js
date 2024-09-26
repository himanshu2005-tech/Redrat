import { CLIENT_EMAIL, PRIVATE_KEY } from "@env";
const { JWT } = require("google-auth-library");
const axios = require("axios");

const SCOPES = ["https://www.googleapis.com/auth/firebase.messaging"];

const client = new JWT({
  email: CLIENT_EMAIL,
  key: PRIVATE_KEY.replace(/\\n/g, '\n'), // Replace escaped new lines if needed
  scopes: SCOPES,
});

async function getAccessToken() {
  const tokens = await client.authorize();
  console.log(tokens.access_token);
  return tokens.access_token;
}

getAccessToken();
