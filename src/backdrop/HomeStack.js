import React, { useEffect, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';
import {
  View,
  ActivityIndicator,
  Text,
  Image,
  Button,
  PermissionsAndroid,
  Alert,
  Platform,
  Linking,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import Home from '../screens/Home';
import ProfileScreen from '../screens/ProfileScreen';
import NotificationScreen from '../screens/NotificationScreen';
import UserNameScreen from '../screens/UserNameScreen';
import Trending from '../screens/Trending';
import MyBots from '../screens/MyBots';
import TribetCard from '../screens/TribetCard';
import { useNavigation } from '@react-navigation/native';
import Chats from '../screens/Chats';
import { openSettings } from 'react-native-permissions';
import color from '../screens/color';
import messaging from '@react-native-firebase/messaging';


const Tab = createBottomTabNavigator();

const requestPermissions = async (setPermissionsGranted, setPermissionsMessage) => {
  try {
    let permissionsGranted = true;
    let permissionsMessage = '';

    const cameraGranted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA);
    if (cameraGranted !== PermissionsAndroid.RESULTS.GRANTED) {
      permissionsGranted = false;
      permissionsMessage = 'Camera access is not allowed';
    }
    if (Platform.OS === 'android' && Platform.Version >= 33) {
      const mediaImagesPermission = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES);
      const mediaVideoPermission = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO);
      if (mediaImagesPermission !== PermissionsAndroid.RESULTS.GRANTED || mediaVideoPermission !== PermissionsAndroid.RESULTS.GRANTED) {
        permissionsGranted = false;
        permissionsMessage = 'Photo/video access is not allowed';
      }
    }
    if (Platform.OS === 'android' && Platform.Version >= 33) {
      const notificationPermission = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
      if (notificationPermission !== PermissionsAndroid.RESULTS.GRANTED) {
        permissionsGranted = false;
        permissionsMessage = 'Notification access is not allowed';
      }
    }

    setPermissionsGranted(permissionsGranted);
    setPermissionsMessage(permissionsMessage);
  } catch (error) {
    console.warn('Error requesting permissions:', error);
  }
};

export default function HomeStack({}) {
  const [loading, setLoading] = useState(true);
  const [hasUsername, setHasUsername] = useState(false);
  const [permissionsGranted, setPermissionsGranted] = useState(true);
  const [permissionsMessage, setPermissionsMessage] = useState('');
  const [lastNotificationVisited, setLastNotificationVisited] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [profilePic, setProfilePic] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [tribetDisplay, setTribetDisplay] = useState(false);
  const navigation = useNavigation();
  

  const requestFCMPermission = async () => {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;
  
    if (enabled) {
      console.log('FCM Authorization status:', authStatus);
      const fcmToken = await messaging().getToken();
      if (fcmToken) {
        console.log('FCM Token:', fcmToken);
        return fcmToken;
      } else {
        console.log('Failed to fetch FCM token');
      }
    } else {
      Alert.alert(
        'Permission Denied',
        'You need to allow notifications to get an FCM token.',
      );
    }
    return null;
  };
  
  useEffect(() => {
    let isSubscribed = true;
  
    const checkUsername = async () => {
      try {
        const userId = auth().currentUser?.uid;
        const userDoc = await firestore().collection('Users').doc(userId).get();
  
        if (isSubscribed) {
          if (userDoc.exists) {
            const userData = userDoc.data();
            setHasUsername(!!userData.name);
            setLastNotificationVisited(userData.lastNotificationsVisited || null);
            setProfilePic(userData.profile_pic);
            const currentToken = await requestFCMPermission();
            if (currentToken && userData.fcmToken !== currentToken) {
              await firestore()
                .collection('Users')
                .doc(userId)
                .update({
                  fcmToken: firestore.FieldValue.arrayUnion(currentToken), 
                });
            }
          } else {
            setHasUsername(false);
          }
          setLoading(false);
        }
      } catch (error) {
        if (isSubscribed) {
          console.warn('Error fetching user data:', error);
          setLoading(false);
        }
      }
    };
  
    checkUsername();
  
    return () => {
      isSubscribed = false;
    };
  }, []);
  

  useEffect(() => {
    if (!permissionsGranted) {
      requestPermissions(setPermissionsGranted, setPermissionsMessage);
    }
  }, [permissionsGranted]);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'black',
        }}>
        <Text style={{color: "#FF3131", fontWeight: 900, fontSize: 20, fontFamily: 'title3'}}>Redrat</Text>
      </View>
    );
  }

  if (!hasUsername) {
    return <UserNameScreen onSuccess={() => setHasUsername(true)} />;
  }

  return (
    <View style={{ flex: 1 }}>
      {!permissionsGranted && (
        <View>
          <Text>{permissionsMessage}</Text>
          <Button title="Request permissions" onPress={() => requestPermissions(setPermissionsGranted, setPermissionsMessage)} />
        </View>
      )}
      {permissionsGranted && (
        <Tab.Navigator
          initialRouteName="Homes"
          screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color, size }) => {
              let iconName;

              if (route.name === 'Homes') {
                iconName = focused ? 'square' : 'square-outline';
              } else if (route.name === 'Profile') {
                if (profilePic) {
                  return (
                    <Image
                      source={{ uri: profilePic }}
                      style={{
                        width: focused ? size + 8 : size + 5,
                        height: focused ? size + 8 : size + 5,
                        borderRadius: focused ? 5 : 20,
                        borderColor: 'white',
                        borderWidth: focused ? 1 : 0,
                      }}
                    />
                  );
                } else {
                  iconName = focused ? 'person' : 'person-outline';
                }
              } else if (route.name === 'Trending') {
                iconName = focused ? 'podium' : 'podium-outline';
              } else if (route.name === 'Notifications') {
                iconName = focused ? 'layers' : 'layers-outline';
              } else if (route.name === 'MyBots') {
                iconName = focused ? 'prism' : 'prism-outline';
              } else if (route.name === 'Chats') {
                iconName = focused ? 'chatbubble' : 'chatbubble-outline';
              }
              size = focused ? size + 5 : size;

              return iconName ? (
                <Icon name={iconName} size={size} color={color} />
              ) : null;
            },
            tabBarActiveTintColor: color,
            tabBarInactiveTintColor: color,
            tabBarStyle: {
              position: 'absolute',
              backgroundColor: '#1a1a1a',
              height: 55,
              borderTopWidth: 0,
              bottom: 10,
              margin: 20,
              borderRadius: 55,
              elevation: 5,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -5 },
              shadowOpacity: 0.2,
              shadowRadius: 5,
              
            },
            tabBarShowLabel: false,
            headerShown: false,
            
            cardStyleInterpolator: ({ current, next, layouts }) => {
              return {
                cardStyle: {
                  opacity: current.progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 1],
                  }),
                  transform: [
                    {
                      translateX: current.progress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [layouts.screen.width, 0],
                      }),
                    },
                    {
                      scale: current.progress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1.2, 1],
                      }),
                    },
                  ],
                },
              };
            },
          })}>
          <Tab.Screen name="Homes" component={Home} />
          <Tab.Screen name="Trending" component={Trending} />
          <Tab.Screen
            name="Profile"
            component={ProfileScreen}
            initialParams={{ profilePic }}
          />
          <Tab.Screen name="MyBots" component={MyBots} />
          <Tab.Screen name="Chats" component={Chats} />
          <Tab.Screen
            name="Notifications"
            component={NotificationScreen}
            options={{
              tabBarBadge: unreadCount > 0 ? unreadCount : null,
            }}
          />
        </Tab.Navigator>
      )}
    </View>
  );
}
