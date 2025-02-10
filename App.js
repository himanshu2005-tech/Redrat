import * as React from 'react';
import {useEffect, useState} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createSharedElementStackNavigator} from 'react-navigation-shared-element';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {BottomSheetModalProvider} from '@gorhom/bottom-sheet';
import {TransitionSpecs, CardStyleInterpolators} from '@react-navigation/stack';
import {Easing} from 'react-native-reanimated';
import messaging from '@react-native-firebase/messaging';
import HomeScreen from './src/screens/HomeScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import AuthCheck from './src/backdrop/AuthCheck';
import LoginScreen from './src/screens/LoginScreen';
import HomeStack from './src/backdrop/HomeStack';
import EditProfile from './src/screens/EditProfile';
import CreateNetwork from './src/screens/CreateNetwork';
import NetworkScreen from './src/screens/NetworkScreen';
import AddPost from './src/screens/AddPost';
import Post from './src/screens/Post';
import NetworkExpand from './src/screens/NetworkExpand';
import NotificationScreen from './src/screens/NotificationScreen';
import UserProfileScreen from './src/screens/UserProfileScreen';
import ChatScreen from './src/screens/ChatScreen';
import ImageExpand from './src/screens/ImageExpand';
import UserDetails from './src/screens/UserDetails';
import SavedScreen from './src/screens/SavedScreen';
import LikeScreen from './src/screens/LikeScreen';
import Home from './src/screens/Home';
import Chats from './src/screens/Chats';
import PostExpand from './src/screens/PostExpand';
import PinnedChats from './src/screens/PinnedChats';
import MyNetworks from './src/screens/MyNetworks';
import JoinedNetworks from './src/screens/JoinedNetworks';
import ShowAllImagesScreen from './src/screens/ShowAllImages';
import Repost from './src/screens/Repost';
import Panel from './src/screens/Panel';
import ShareTo from './src/screens/ShareTo';
import NetworkUsers from './src/screens/NetworkUsers';
import Banned from './src/screens/Banned';
import VideoExpand from './src/screens/VideoExpand';
import WebViewScreen from './src/screens/WebViewScreen';
import NetworkAdvanced from './src/screens/NetworkAdvanced';
import Request from './src/screens/Request';
import FriendUser from './src/screens/FriendUser';
import Search from './src/screens/Search';
import Trending from './src/screens/Trending';
import auth from '@react-native-firebase/auth';
import SearchResults from './src/screens/SearchResults';
import AddingUsers from './src/screens/AddingUsers';
import CreateHash from './src/screens/CreateHash';
import HashScreen from './src/screens/HashScreen';
import AddingHashes from './src/screens/AddingHashes';
import AddHashPicture from './src/screens/AddHashPicture';
import CommentExpand from './src/screens/CommentExpand';
import SupportingHashes from './src/screens/SupportingHashes';
import notifee, {AndroidImportance, EventType} from '@notifee/react-native';
import {navigationRef} from './NavigationListner';
import HashPosts from './src/screens/HashPosts';
import Bluing from './src/texting/Bluing';
import UserStatus from './src/screens/UserStatus';
import AdminTransfer from './src/screens/AdminTransfer';
import Inbox from './src/screens/Inbox';
import MyBots from './src/screens/MyBots';
import SearchBots from './src/screens/SearchBots';
import BotScreen from './src/screens/BotScreen';
import IntegrateBots from './src/screens/IntegrateBots';
import SignUpScreen from './src/screens/SignUpScreen';
import ChangePasswordScreen from './src/screens/ChangePasswordScreen';
import ShareNetwork from './src/screens/ShareNetwork';
import RulesUpdate from './src/screens/RulesUpdate';
import AddResponse from './src/screens/AddResponse';
import Responses from './src/screens/Responses';
import TribetDictionary from './src/screens/TribetDictionary';
import Tribet from './src/screens/Tribet';
import Report from './src/screens/Report';
import ReportedPosts from './src/screens/ReportedPosts';
import NetworkAnalytics from './src/screens/NetworkAnalytics';
import PostAnalytics from './src/screens/PostAnalytics';
import ReportAccount from './src/screens/ReportAccount';
import BlockAccount from './src/screens/BlockedAccounts';
import BlockedAccount from './src/screens/BlockedAccounts';
import {AdManager} from 'react-native-admob-native-ads';
import {getTrackingStatus} from 'react-native-tracking-transparency';
import NetworkAquisition from './src/screens/NetworkAquisition';
import AquireNetwork from './src/screens/AquireNetwork';
import Permissions from './src/screens/Permissions';
import PrivacyPolicy from './src/screens/PrivacyPolicy';
import Account from './src/screens/Account';
import NetworkBadge from './src/screens/NetworkBadge';
import TopicNetworks from './src/screens/TopicData';
import TopicData from './src/screens/TopicData';
import firestore from '@react-native-firebase/firestore';
import LinkExpand from './src/screens/LinkExpand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RecommendedHome from './src/screens/RecommendedHome';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import selectAppTheme from './src/screens/selectAppTheme';
import SelectPersonalizedNotifications from './src/screens/SelectPersonalizedNotifications';
import SelectPersonalizedNotificationsExpand from './src/screens/SelectPersonalizedNotificationsExpand';
import SubscriptionChatScreen from './src/screens/SubsciptionChatScreen';
import Preferences from './src/screens/Preferences';
import ManagePreferences from './src/screens/ManagePreferences';
import CustomFeed from './src/screens/CustomFeed';
import CreateCustomFeed from './src/screens/CreateCustomFeed';
import AddFeed from './src/screens/AddFeed';
import CustomFeedPosts from './src/screens/CustomFeedPosts';
import BuyBadges from './src/screens/BuyBadges';
import BadgePage from './src/screens/BadgePage';

const Stack = createSharedElementStackNavigator();

notifee.onBackgroundEvent(async ({type, detail}) => {
  if (type === EventType.PRESS) {
    console.log('Notification pressed!', detail.notification);

    const notificationData = detail.notification?.data;
    if (notificationData?.type === 'CHAT_MESSAGE') {
      console.log('Opening Screen');
      const {id} = notificationData;

      navigate('Chat', {id: id});
    }
  }
});

messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('Message handled in the background!', remoteMessage);
});

const displayNotification = async remoteMessage => {
  await notifee.createChannel({
    id: 'default',
    name: 'Default Channel',
    importance: AndroidImportance.HIGH,
  });

  await notifee.displayNotification({
    title: remoteMessage.notification.title,
    body: remoteMessage.notification.body,
    android: {
      channelId: 'default',
    },
    data: remoteMessage.data,
  });
};

const customTransition = {
  transitionSpec: {
    open: {
      animation: 'timing',
      config: {
        duration: 300,
        easing: Easing.linear,
      },
    },
    close: {
      animation: 'timing',
      config: {
        duration: 300,
        easing: Easing.linear,
      },
    },
  },
  cardStyleInterpolator: ({current, next, layouts}) => {
    const translateX = current.progress.interpolate({
      inputRange: [0, 1],
      outputRange: [layouts.screen.width, 0],
    });

    return {
      cardStyle: {
        transform: [{translateX}],
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        backgroundColor: '#fff',
      },
    };
  },
};

const options = {
  headerBackTitleVisible: false,
  cardStyleInterpolator: ({ current: { progress } }) => {
    return {
      cardStyle: {
        opacity: progress
      }
    };
  }
};


export default function App() {
  const saveUserDetailsToStorage = async data => {
    try {
      const jsonValue = JSON.stringify(data);
      console.log('Info Saved!!');
      await AsyncStorage.setItem('userDetails', jsonValue);
    } catch (error) {
      console.warn('Error saving user details to AsyncStorage:', error);
    }
  };

  const saveJoinedNetworks = async data => {
    try {
      const jsonValue = JSON.stringify(data);
      console.log('joined Networks saved Saved!!');
      await AsyncStorage.setItem('joinedNetworks', jsonValue);
    } catch (error) {
      console.warn('Error saving joinedNetworks details to AsyncStorage:', error);
    }
  };

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(async user => {
      if (user) {
        try {
          const userId = user.uid;
          const userDoc = await firestore()
            .collection('Users')
            .doc(userId)
            .get();

          const networkData = await firestore().collection("Users").doc(auth().currentUser.uid).collection('JoinedNetworks').get();
          if (userDoc.exists) {
            const userData = userDoc.data();
            await saveUserDetailsToStorage(userData);
            await saveJoinedNetworks(networkData.docs.map(doc => doc.id))
          } else {
            console.warn('User document does not exist');
          }
        } catch (error) {
          console.warn('Error fetching user details:', error);
        }
      } else {
        console.warn('User is logged out');
      }
    });

    return () => unsubscribe();
  }, []);

  const config = {
    maxAdContetRating: 'MA',
    tagForChildDirectedTreatment: false,
    tagForUnderAgeConsent: false,
  };

  useEffect(() => {
    const init = async () => {
      const trackingStatus = await getTrackingStatus();

      let trackingAuthorized = false;
      if (trackingStatus === 'authorized' || trackingStatus === 'unavailable') {
        trackingAuthorized = true;
      }
      AdManager.isTestDevice().then(result => console.log(result));
      await AdManager.setRequestConfiguration({
        trackingAuthorized,
        ...config,
      });
    };

    init();
  }, []);

  useEffect(() => {
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      console.log('Message received in the foreground!', remoteMessage);
      await displayNotification(remoteMessage);
    });

    return () => {
      unsubscribe();
    };
  }, []);
  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <BottomSheetModalProvider>
        <NavigationContainer ref={navigationRef}>
          <Stack.Navigator
            screenOptions={{
              headerShown: false,
              transitionSpec: {
                open: {
                  animation: 'timing',
                  config: {
                    duration: 150,
                    easing: Easing.out(Easing.ease),
                  },
                },
                close: {
                  animation: 'timing',
                  config: {
                    duration: 150,
                    easing: Easing.out(Easing.ease),
                  },
                },
              },
              cardStyleInterpolator: ({
                current: {progress},
                layouts: {screen},
              }) => ({
                cardStyle: {
                  transform: [
                    {
                      translateX: progress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [screen.width, 0],
                      }),
                    },
                    {
                      scale: progress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.98, 1], // Slight zoom effect for smoothness
                      }),
                    },
                  ],
                },
              }),
            }}
            initialRouteName="AUTH_CHECK">
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Preferences" component={Preferences} />
            <Stack.Screen
              name="ManagePreferences"
              component={ManagePreferences}
            />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="AdminTransfer" component={AdminTransfer} />
            <Stack.Screen name="RecommendedHome" component={RecommendedHome} />
            <Stack.Screen name="appTheme" component={selectAppTheme} />
            <Stack.Screen name="CustomFeed" component={CustomFeed} />
            <Stack.Screen name="Bluing" component={Bluing} />
            <Stack.Screen name="AddFeed" component={AddFeed} />
            <Stack.Screen name="CreateCustomFeed" component={CreateCustomFeed} />
            <Stack.Screen
              name="SubscriptionChatScreen"
              component={SubscriptionChatScreen}
            />
            <Stack.Screen
              name="SelectPersonalizedNotifications"
              component={SelectPersonalizedNotifications}
            />
            <Stack.Screen
              name="SelectPersonalizedNotificationsExpand"
              component={SelectPersonalizedNotificationsExpand}
            />
            <Stack.Screen
              name="ReportAcccount"
              component={ReportAccount}
              options={{
                transitionSpec: {
                  open: {animation: 'timing', config: {duration: 300}},
                  close: {animation: 'timing', config: {duration: 300}},
                },
                cardStyleInterpolator: ({current}) => ({
                  cardStyle: {
                    transform: [
                      {
                        translateY: current.progress.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-500, 0],
                        }),
                      },
                    ],
                    opacity: current.progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 1],
                    }),
                  },
                }),
              }}
            />
            <Stack.Screen name="BlockedAccount" component={BlockedAccount} />
            <Stack.Screen name="AUTH_CHECK" component={AuthCheck} />
            <Stack.Screen name="UserStatus" component={UserStatus} />
            <Stack.Screen name="CustomFeedPosts" component={CustomFeedPosts} />
            <Stack.Screen name="BuyBadges" component={BuyBadges} />
            <Stack.Screen name="BadgePage" component={BadgePage} />
            <Stack.Screen
              name="NetworkAnalytics"
              component={NetworkAnalytics}
            />
            <Stack.Screen name="PostAnalytics" component={PostAnalytics} />
            <Stack.Screen name="ShareNetwork" component={ShareNetwork} />
            <Stack.Screen name="SignUpScreen" component={SignUpScreen} />
            <Stack.Screen
              name="ChangePassword"
              component={ChangePasswordScreen}
            />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen
              name="AquireNetwork"
              component={AquireNetwork}
              options={{
                transitionSpec: {
                  open: {animation: 'timing', config: {duration: 150}},
                  close: {animation: 'timing', config: {duration: 150}},
                },
                cardStyleInterpolator: ({current}) => ({
                  cardStyle: {
                    transform: [
                      {
                        translateY: current.progress.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-500, 0],
                        }),
                      },
                    ],
                    opacity: current.progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 1],
                    }),
                  },
                }),
              }}
            />
            <Stack.Screen name="CreateHash" component={CreateHash} />
            <Stack.Screen
              name="ForgotPasswordScreen"
              component={ForgotPasswordScreen}
            />
            <Stack.Screen name="Permissions" component={Permissions} />
            <Stack.Screen name="TopicData" component={TopicData} />
            <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicy} />
            <Stack.Screen name="NetworkBadge" component={NetworkBadge} />
            <Stack.Screen name="Account" component={Account} />
            <Stack.Screen name="HOME_STACK" component={HomeStack} />
            <Stack.Screen
              name="NetworkAquisition"
              component={NetworkAquisition}
            />
            <Stack.Screen name="Trending" component={Trending} />
            <Stack.Screen name="BotScreen" component={BotScreen} />
            <Stack.Screen name="HashScreen" component={HashScreen} />
            <Stack.Screen name="HashPosts" component={HashPosts} />
            <Stack.Screen name="RulesUpdate" component={RulesUpdate} />
            <Stack.Screen name="IntegrateBots" component={IntegrateBots} />
            <Stack.Screen
              name="AddResponse"
              component={AddResponse}
              options={{
                transitionSpec: {
                  open: {animation: 'timing', config: {duration: 150}},
                  close: {animation: 'timing', config: {duration: 150}},
                },
                cardStyleInterpolator: ({current}) => ({
                  cardStyle: {
                    transform: [
                      {
                        translateY: current.progress.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-500, 0],
                        }),
                      },
                    ],
                    opacity: current.progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 1],
                    }),
                  },
                }),
              }}
            />
            <Stack.Screen
              name="Responses"
              component={Responses}
              options={{
                transitionSpec: {
                  open: {animation: 'timing', config: {duration: 150}},
                  close: {animation: 'timing', config: {duration: 150}},
                },
                cardStyleInterpolator: ({current}) => ({
                  cardStyle: {
                    transform: [
                      {
                        translateY: current.progress.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-500, 0],
                        }),
                      },
                    ],
                    opacity: current.progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 1],
                    }),
                  },
                }),
              }}
            />
            <Stack.Screen
              name="SearchBots"
              component={SearchBots}
              options={{
                transitionSpec: {
                  open: {animation: 'timing', config: {duration: 150}},
                  close: {animation: 'timing', config: {duration: 150}},
                },
                cardStyleInterpolator: ({current}) => ({
                  cardStyle: {
                    transform: [
                      {
                        translateY: current.progress.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-500, 0],
                        }),
                      },
                    ],
                    opacity: current.progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 1],
                    }),
                  },
                }),
              }}
            />
            <Stack.Screen
              name="Search"
              component={Search}
              options={{
                transitionSpec: {
                  open: {animation: 'timing', config: {duration: 150}},
                  close: {animation: 'timing', config: {duration: 150}},
                },
                cardStyleInterpolator: ({current}) => ({
                  cardStyle: {
                    transform: [
                      {
                        translateY: current.progress.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-500, 0],
                        }),
                      },
                    ],
                    opacity: current.progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 1],
                    }),
                  },
                }),
              }}
            />

            <Stack.Screen name="Edit" component={EditProfile} />
            <Stack.Screen name="Create" component={CreateNetwork} />
            <Stack.Screen name="Network" component={NetworkScreen} />
            <Stack.Screen name="Add" component={AddPost} />
            <Stack.Screen name="SearchResults" component={SearchResults} />
            <Stack.Screen name="Inbox" component={Inbox} />
            <Stack.Screen name="NetworkAdvanced" component={NetworkAdvanced} />
            <Stack.Screen name="Post" component={Post} />
            <Stack.Screen
              name="TribetDictionary"
              component={TribetDictionary}
            />
            <Stack.Screen name="Tribet" component={Tribet} />
            <Stack.Screen name="MyBots" component={MyBots} />
            <Stack.Screen
              name="CommentExpand"
              component={CommentExpand}
              options={{
                transitionSpec: {
                  open: {
                    animation: 'spring',
                    config: {stiffness: 100, damping: 15},
                  },
                  close: {animation: 'timing', config: {duration: 100}},
                },
                cardStyleInterpolator: ({current, next, layouts}) => {
                  return {
                    cardStyle: {
                      transform: [
                        {
                          translateY: current.progress.interpolate({
                            inputRange: [0, 1],
                            outputRange: [500, 0],
                          }),
                        },
                      ],
                      opacity: current.progress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 1],
                      }),
                    },
                  };
                },
              }}
            />
            <Stack.Screen
              name="Report"
              component={Report}
              options={{
                transitionSpec: {
                  open: {
                    animation: 'spring',
                    config: {stiffness: 100, damping: 15},
                  },
                  close: {animation: 'timing', config: {duration: 100}},
                },
                cardStyleInterpolator: ({current, next, layouts}) => {
                  return {
                    cardStyle: {
                      transform: [
                        {
                          translateY: current.progress.interpolate({
                            inputRange: [0, 1],
                            outputRange: [500, 0],
                          }),
                        },
                      ],
                      opacity: current.progress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 1],
                      }),
                    },
                  };
                },
              }}
            />

            <Stack.Screen name="NetworkExpand" component={NetworkExpand} />
            <Stack.Screen name="Notifications" component={NotificationScreen} />
            <Stack.Screen name="UserProfile" component={UserProfileScreen} />
            <Stack.Screen name="Chat" component={ChatScreen} />
            <Stack.Screen name="ReportedPosts" component={ReportedPosts} />
            <Stack.Screen name="Friend" component={FriendUser} />
            <Stack.Screen
              name="Banned"
              component={Banned}
              options={{
                transitionSpec: {
                  open: {
                    animation: 'spring',
                    config: {stiffness: 100, damping: 15},
                  },
                  close: {animation: 'timing', config: {duration: 100}},
                },
                cardStyleInterpolator: ({current, next, layouts}) => {
                  return {
                    cardStyle: {
                      transform: [
                        {
                          translateY: current.progress.interpolate({
                            inputRange: [0, 1],
                            outputRange: [500, 0],
                          }),
                        },
                      ],
                      opacity: current.progress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 1],
                      }),
                    },
                  };
                },
              }}
            />
            <Stack.Screen
              name="AddingUsers"
              component={AddingUsers}
              options={{
                transitionSpec: {
                  open: {
                    animation: 'spring',
                    config: {stiffness: 100, damping: 15},
                  },
                  close: {animation: 'timing', config: {duration: 100}},
                },
                cardStyleInterpolator: ({current, next, layouts}) => {
                  return {
                    cardStyle: {
                      transform: [
                        {
                          translateY: current.progress.interpolate({
                            inputRange: [0, 1],
                            outputRange: [500, 0],
                          }),
                        },
                      ],
                      opacity: current.progress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 1],
                      }),
                    },
                  };
                },
              }}
            />
            <Stack.Screen
              name="AddHashPicture"
              component={AddHashPicture}
              options={{
                transitionSpec: {
                  open: {
                    animation: 'spring',
                    config: {stiffness: 100, damping: 15},
                  },
                  close: {animation: 'timing', config: {duration: 100}},
                },
                cardStyleInterpolator: ({current, next, layouts}) => {
                  return {
                    cardStyle: {
                      transform: [
                        {
                          translateY: current.progress.interpolate({
                            inputRange: [0, 1],
                            outputRange: [500, 0],
                          }),
                        },
                      ],
                      opacity: current.progress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 1],
                      }),
                    },
                  };
                },
              }}
            />
            <Stack.Screen
              name="AddingHashes"
              component={AddingHashes}
              options={{
                transitionSpec: {
                  open: {
                    animation: 'spring',
                    config: {stiffness: 100, damping: 15},
                  },
                  close: {animation: 'timing', config: {duration: 100}},
                },
                cardStyleInterpolator: ({current, next, layouts}) => {
                  return {
                    cardStyle: {
                      transform: [
                        {
                          translateY: current.progress.interpolate({
                            inputRange: [0, 1],
                            outputRange: [500, 0],
                          }),
                        },
                      ],
                      opacity: current.progress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 1],
                      }),
                    },
                  };
                },
              }}
            />
            <Stack.Screen
              name="ImageExpand"
              component={ImageExpand}
              options={{
                transitionSpec: {
                  open: {
                    animation: 'spring',
                    config: {stiffness: 100, damping: 15},
                  },
                  close: {animation: 'timing', config: {duration: 100}},
                },
                cardStyleInterpolator: ({current, next, layouts}) => {
                  return {
                    cardStyle: {
                      transform: [
                        {
                          translateY: current.progress.interpolate({
                            inputRange: [0, 1],
                            outputRange: [500, 0],
                          }),
                        },
                      ],
                      opacity: current.progress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 1],
                      }),
                    },
                  };
                },
              }}
            />
            <Stack.Screen name="UserDetails" component={UserDetails} />
            <Stack.Screen name="Saved" component={SavedScreen} />
            <Stack.Screen
              name="Request"
              component={Request}
              options={{
                transitionSpec: {
                  open: {
                    animation: 'spring',
                    config: {stiffness: 100, damping: 15},
                  },
                  close: {animation: 'timing', config: {duration: 100}},
                },
                cardStyleInterpolator: ({current, next, layouts}) => {
                  return {
                    cardStyle: {
                      transform: [
                        {
                          translateY: current.progress.interpolate({
                            inputRange: [0, 1],
                            outputRange: [500, 0],
                          }),
                        },
                      ],
                      opacity: current.progress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 1],
                      }),
                    },
                  };
                },
              }}
            />
            <Stack.Screen
              name="Web"
              component={WebViewScreen}
              options={{
                transitionSpec: {
                  open: {
                    animation: 'spring',
                    config: {stiffness: 100, damping: 15},
                  },
                  close: {animation: 'timing', config: {duration: 100}},
                },
                cardStyleInterpolator: ({current, next, layouts}) => {
                  return {
                    cardStyle: {
                      transform: [
                        {
                          translateY: current.progress.interpolate({
                            inputRange: [0, 1],
                            outputRange: [500, 0],
                          }),
                        },
                      ],
                      opacity: current.progress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 1],
                      }),
                    },
                  };
                },
              }}
            />
            <Stack.Screen name="Like" component={LikeScreen} />
            <Stack.Screen name="Homes" component={Home} />
            <Stack.Screen name="Chats" component={Chats} />
            <Stack.Screen name="Panel" component={Panel} />
            <Stack.Screen
              name="Repost"
              component={Repost}
              options={{
                transitionSpec: {
                  open: {
                    animation: 'spring',
                    config: {stiffness: 100, damping: 15},
                  },
                  close: {animation: 'timing', config: {duration: 100}},
                },
                cardStyleInterpolator: ({current, next, layouts}) => {
                  return {
                    cardStyle: {
                      transform: [
                        {
                          translateY: current.progress.interpolate({
                            inputRange: [0, 1],
                            outputRange: [500, 0],
                          }),
                        },
                      ],
                      opacity: current.progress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 1],
                      }),
                    },
                  };
                },
              }}
            />
            <Stack.Screen
              name="PostExpand"
              component={PostExpand}
              options={{
                transitionSpec: {
                  open: {
                    animation: 'spring',
                    config: {stiffness: 100, damping: 15},
                  },
                  close: {animation: 'timing', config: {duration: 300}},
                },
                cardStyleInterpolator: ({current, next, layouts}) => {
                  return {
                    cardStyle: {
                      transform: [
                        {
                          translateY: current.progress.interpolate({
                            inputRange: [0, 1],
                            outputRange: [500, 0],
                          }),
                        },
                      ],
                      opacity: current.progress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 1],
                      }),
                    },
                  };
                },
              }}
            />

            <Stack.Screen name="PinnedChats" component={PinnedChats} />
            <Stack.Screen name="MyNetworks" component={MyNetworks} />
            <Stack.Screen name="JoinedNetworks" component={JoinedNetworks} />
            <Stack.Screen name="NetworkUsers" component={NetworkUsers} />
            <Stack.Screen name="LinkExpand" component={LinkExpand} />
            <Stack.Screen
              name="SupportingHashes"
              component={SupportingHashes}
            />
            <Stack.Screen
              name="VideoExpand"
              component={VideoExpand}
              options={{
                transitionSpec: {
                  open: {
                    animation: 'spring',
                    config: {stiffness: 100, damping: 15},
                  },
                  close: {animation: 'timing', config: {duration: 100}},
                },
                cardStyleInterpolator: ({current, next, layouts}) => {
                  return {
                    cardStyle: {
                      transform: [
                        {
                          translateY: current.progress.interpolate({
                            inputRange: [0, 1],
                            outputRange: [500, 0],
                          }),
                        },
                      ],
                      opacity: current.progress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 1],
                      }),
                    },
                  };
                },
              }}
            />
            <Stack.Screen
              name="Share"
              component={ShareTo}
              options={{
                transitionSpec: {
                  open: {
                    animation: 'spring',
                    config: {stiffness: 100, damping: 15},
                  },
                  close: {animation: 'timing', config: {duration: 100}},
                },
                cardStyleInterpolator: ({current, next, layouts}) => {
                  return {
                    cardStyle: {
                      transform: [
                        {
                          translateY: current.progress.interpolate({
                            inputRange: [0, 1],
                            outputRange: [500, 0],
                          }),
                        },
                      ],
                      opacity: current.progress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 1],
                      }),
                    },
                  };
                },
              }}
            />
            <Stack.Screen
              name="ShowAll"
              component={ShowAllImagesScreen}
              options={{
                transitionSpec: {
                  open: {
                    animation: 'spring',
                    config: {stiffness: 100, damping: 15},
                  },
                  close: {animation: 'timing', config: {duration: 100}},
                },
                cardStyleInterpolator: ({current, next, layouts}) => {
                  return {
                    cardStyle: {
                      transform: [
                        {
                          translateY: current.progress.interpolate({
                            inputRange: [0, 1],
                            outputRange: [500, 0],
                          }),
                        },
                      ],
                      opacity: current.progress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 1],
                      }),
                    },
                  };
                },
              }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}
