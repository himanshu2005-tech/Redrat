import axios from 'axios';

const apiKey = 'AIzaSyCCNkbOo7NnZDf0F61JT3tkXXGpEorBYfQ';

export const checkMaliciousLinks = async (links) => {
    console.log(links)
  const body = {
    client: {
      clientId: '452965554229-8o4d4arrm1d35arvoab0rj0ruj1gs446.apps.googleusercontent.com', 
      clientVersion: '1.0'
    },
    threatInfo: {
      threatTypes: ['MALWARE', 'SOCIAL_ENGINEERING', 'UNWANTED_SOFTWARE', 'POTENTIALLY_HARMFUL_APPLICATION'],
      platformTypes: ['ANY_PLATFORM'],
      threatEntryTypes: ['URL'],
      threatEntries: links.map(link => ({ url: link })),
    }
  };

  try {
    const response = await axios.post(`https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKey}`, body);
    console.log('API Response:', response.data);
    if (response.data.matches && response.data.matches.length > 0) {
      return response.data.matches;
    } else {
      console.log("No malicious links found.");
      return [];
    }
  } catch (error) {
    console.error('Error checking links:', error.response ? error.response.data : error.message);
    return [];
  }
};
