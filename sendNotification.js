const axios = require("axios").default;

async function getAccessToken() {
  try {
    // Ensure your server is running at this URL
    const response = await axios.get("http://11.12.21.180:3000/getAccessToken");

    if (response.data && response.data.accessToken) {
      return response.data.accessToken;  // Adjust to your actual response structure
    } else {
      throw new Error("Access token not found in response");
    }
  } catch (error) {
    console.error("Error fetching access token:", error.message);
    throw new Error("Unable to get access token");
  }
}

async function sendPushNotification(title, token, message) {
    try {
      // Log token and message to verify
      console.log("FCM Token:", token);
      console.log("Message:", message);
  
      if (!token || !message) {
        throw new Error("FCM token and message must be defined");
      }
  
      const accessToken = await getAccessToken();
  
      const url = "https://fcm.googleapis.com/v1/projects/redrat-910fc/messages:send";
  
      const notificationMessage = {
        message: {
          token: token, // User's FCM Token
          notification: {
            title: title,
            body: message,
          },
        },
      };
  
      const response = await axios.post(url, notificationMessage, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });
  
      console.log("Notification sent successfully:", response.data);
    } catch (error) {
      console.error("Error sending push notification:", error.message);
    }
  }
  

module.exports = sendPushNotification;
