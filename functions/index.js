const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

exports.sendMessage = functions.https.onCall((data, context) => {
  const {message, title, token} = data;

  const payload = {
    notification: {
      title: title,
      body: message,
    },
  };

  return admin
      .messaging()
      .sendToDevice(token, payload)
      .then((response) => {
        console.log("Successfully sent message:", response);
        return {success: true};
      })
      .catch((error) => {
        console.error("Error sending message:", error);
        return {success: false};
      });
});
