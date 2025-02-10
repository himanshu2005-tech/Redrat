// const express = require("express");
// const { JWT } = require("google-auth-library");
// const fs = require("fs");
// const path = require("path");

// const app = express();
// const PORT = process.env.PORT || 3000;

// const SERVICE_ACCOUNT_FILE = path.join(__dirname, 'src', 'backend', 'verel-39144-firebase-adminsdk-jh2ks-216d57c237.json');
// const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_FILE, 'utf8'));
// const SCOPES = ["https://www.googleapis.com/auth/firebase.messaging"];

// const client = new JWT({
//   email: serviceAccount.client_email,
//   key: serviceAccount.private_key,
//   scopes: SCOPES,
// });

// app.get("/getAccessToken", async (req, res) => {
//   try {
//     const tokens = await client.authorize();
//     res.json({ accessToken: tokens.access_token });
//   } catch (error) {
//     console.error("Error getting access token:", error);
//     res.status(500).json({ error: "Failed to get access token" });
//   }
// });

// app.listen(PORT, () => {
//   console.log(`Server is running on http://localhost:${PORT}`);
// });
