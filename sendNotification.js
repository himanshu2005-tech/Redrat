const axios = require("axios").default;

async function getAccessToken() {
  try {
    const response = await axios.get("https://web-production-c4c5.up.railway.app/getAccessToken");

    if (response.data && response.data.accessToken) {
      return response.data.accessToken;
    } else {
      throw new Error("Access token not found in response");
    }
  } catch (error) {
    console.error("Error fetching access token:", error.message);
    throw new Error("Unable to get access token");
  }
}

async function sendPushNotification(title, tokens, message, id, type) {
  try {
    if (!Array.isArray(tokens) || tokens.length === 0) {
      throw new Error("FCM tokens must be a non-empty array");
    }

    if (!message) {
      throw new Error("Message must be defined");
    }

    const accessToken = await getAccessToken();

    const url = "https://fcm.googleapis.com/v1/projects/redrat-910fc/messages:send";

    for (const token of tokens) {
      const notificationMessage = {
        message: {
          token: token,
          notification: {
            title: title,
            body: message,
          },
          data: {
            id: String(id),
            type: String(type),
          },
        },
      };

      try {
        const response = await axios.post(url, notificationMessage, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        });

        console.log(`Notification sent successfully to ${token}:`, response.data);
      } catch (error) {
        console.error(`Error sending push notification to ${token}:`, error.response?.data || error.message);
      }
    }
  } catch (error) {
    console.error("Error sending notifications:", error.message);
  }
}

module.exports = sendPushNotification;
