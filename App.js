import * as React from 'react';
import { useEffect } from 'react';
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
import CreateCrusade from './src/screens/CreateHash';
import CreateHash from './src/screens/CreateHash';
import HashScreen from './src/screens/HashScreen';
import AddingHashes from './src/screens/AddingHashes';
import AddHashPicture from './src/screens/AddHashPicture';
import PicExpand from './src/screens/PicExpand';
import Pic from './src/screens/Pic';
import CommentExpand from './src/screens/CommentExpand';
import SupportingHashes from './src/screens/SupportingHashes';
import notifee, { AndroidImportance, EventType } from '@notifee/react-native';

const Stack = createSharedElementStackNavigator();

notifee.onBackgroundEvent(async ({ type, detail }) => {
  if (type === EventType.PRESS) {
    console.log('Notification pressed!', detail.notification);
    // Handle navigation if needed
  }
});

// Handle background and quit state notifications
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('Message handled in the background!', remoteMessage);
  await displayNotification(remoteMessage);
});

// Function to display notification using Notifee
const displayNotification = async (remoteMessage) => {
  // Create a channel (required for Android)
  await notifee.createChannel({
    id: 'default',
    name: 'Default Channel',
    importance: AndroidImportance.HIGH,
  });

  // Display the notification
  await notifee.displayNotification({
    title: remoteMessage.notification.title,
    body: remoteMessage.notification.body,
    android: {
      channelId: 'default',
    },
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

export default function App() {
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
        <NavigationContainer>
          <Stack.Navigator
            screenOptions={{
              headerShown: false,
              ...customTransition,
            }}
            initialRouteName="AUTH_CHECK">
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="AUTH_CHECK" component={AuthCheck} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="CreateHash" component={CreateHash} />
            <Stack.Screen name="HOME_STACK" component={HomeStack} />
            <Stack.Screen name="Trending" component={Trending} />
            <Stack.Screen name="HashScreen" component={HashScreen} />
            <Stack.Screen
              name="Search"
              component={Search}
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

            <Stack.Screen name="Edit" component={EditProfile} />
            <Stack.Screen name="Create" component={CreateNetwork} />
            <Stack.Screen name="Pic" component={Pic} />
            <Stack.Screen name="Network" component={NetworkScreen} />
            <Stack.Screen name="Add" component={AddPost} />
            <Stack.Screen name="SearchResults" component={SearchResults} />
            <Stack.Screen name="NetworkAdvanced" component={NetworkAdvanced} />
            <Stack.Screen name="Post" component={Post} />
            <Stack.Screen
              name="PicExpand"
              component={PicExpand}
              sharedElements={route => {
                const {id} = route.params;
                return [
                  {
                    id: `pic.${id}.photo`,
                    animation: 'move',
                    resize: 'clip',
                  },
                ];
              }}
              options={{
                transitionSpec: {
                  open: {
                    animation: 'spring',
                    config: {stiffness: 100, damping: 15},
                  },
                  close: {animation: 'timing', config: {duration: 200}},
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
              name="CommentExpand"
              component={CommentExpand}
              options={{
                transitionSpec: {
                  open: {
                    animation: 'spring',
                    config: {stiffness: 100, damping: 15},
                  },
                  close: {animation: 'timing', config: {duration: 200}},
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
                  close: {animation: 'timing', config: {duration: 200}},
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
                  close: {animation: 'timing', config: {duration: 200}},
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
                  close: {animation: 'timing', config: {duration: 200}},
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
                  close: {animation: 'timing', config: {duration: 200}},
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
                  close: {animation: 'timing', config: {duration: 200}},
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
                  close: {animation: 'timing', config: {duration: 200}},
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
                  close: {animation: 'timing', config: {duration: 200}},
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
                  close: {animation: 'timing', config: {duration: 200}},
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
              sharedElements={route => {
                const {post_id} = route.params;
                return [
                  {
                    id: `post.${post_id}`,
                    animation: 'move',
                    resize: 'clip',
                  },
                ];
              }}
              options={{
                transitionSpec: {
                  open: {
                    animation: 'spring',
                    config: {stiffness: 100, damping: 15},
                  },
                  close: {animation: 'timing', config: {duration: 200}},
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
            <Stack.Screen name="SupportingHashes" component={SupportingHashes} />
            <Stack.Screen
              name="VideoExpand"
              component={VideoExpand}
              options={{
                transitionSpec: {
                  open: {
                    animation: 'spring',
                    config: {stiffness: 100, damping: 15},
                  },
                  close: {animation: 'timing', config: {duration: 200}},
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
                  close: {animation: 'timing', config: {duration: 200}},
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
                  close: {animation: 'timing', config: {duration: 200}},
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
