import React, {Suspense, useState, useEffect, lazy} from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
  Pressable,
  ActivityIndicator,
  Text,
  Modal,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {DrawerLayout} from 'react-native-gesture-handler';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import NetworkDisplay from './NetworkDisplay';
import TribetCard from './TribetCard';
import {createMaterialTopTabNavigator} from '@react-navigation/material-top-tabs';
import Animated, {FadeInUp, FadeOutDown, Layout} from 'react-native-reanimated';
import Motions from './Motions';
import Bluing from '../texting/Bluing';
import color from './color';
import {SharedElement} from 'react-navigation-shared-element';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SIDEBAR_WIDTH = SCREEN_WIDTH * 0.85;
const HomeScreen = lazy(() => import('./HomeScreen'));
const Inbox = lazy(() => import('./Inbox'));
const ProfileTabNavigator = createMaterialTopTabNavigator();

export default function Home({navigation}) {
  const [activeTab, setActiveTab] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [allMessages, setAllMessages] = useState([]);
  const [joinedNetworks, setJoinedNetworks] = useState([]);
  const [createdNetworks, setCreatedNetworks] = useState([]);
  const [joinedExpand, setJoinedExpand] = useState(true);
  const [createdExpand, setCreatedExpand] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [userDetails, setUserDetails] = useState([]);
  const [customFeeds, setCustomFeeds] = useState([])
  const drawerRef = React.useRef(null);

  const CONTENT_WIDTH = SCREEN_WIDTH;

  useEffect(() => {
    const fetchData = () => {
      const userId = auth().currentUser?.uid;
      if (!userId) return;

      const userDocRef = firestore().collection('Users').doc(userId);

      const unsubscribeMessages = userDocRef
        .collection('Inbox')
        .orderBy('createdAt', 'desc')
        .limit(50)
        .onSnapshot(
          snapshot => {
            const fetchedMessages = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
            }));

            setAllMessages(fetchedMessages);
            setLoading(false);

            userDocRef.get().then(userDoc => {
              const lastVisitedTime =
                userDoc.data()?.lastReadInboxTimestamp || null;

              const unreadMessages = fetchedMessages.filter(
                message =>
                  !lastVisitedTime ||
                  message.createdAt.toMillis() > lastVisitedTime.toMillis(),
              );

              setUnreadCount(unreadMessages.length);
              if (unreadCount > 0) {
                setActiveTab(1);
              }
            });
          },
          error => {
            console.error('Error fetching messages: ', error);
            setLoading(false);
          },
        );

      return unsubscribeMessages;
    };

    const unsubscribe = fetchData();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  useEffect(() => {
    const fetchFeeds = async () => {
      try {
        const feedData = await firestore()
          .collection('Users')
          .doc(auth().currentUser.uid)
          .collection('Feeds')
          .get();

        const fetchedFeeds = feedData.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        setCustomFeeds(fetchedFeeds);
      } catch (error) {
        console.warn(error);
      } 
    };

    fetchFeeds();
  }, []);

  useEffect(() => {
    const fetchJoinedNetworks = () => {
      const userRef = firestore()
        .collection('Users')
        .doc(auth().currentUser.uid);

      const unsubscribeUserDetails = userRef.onSnapshot(
        snapshot => {
          if (snapshot.exists) {
            const userData = snapshot.data();
            setUserDetails(userData);
            setCreatedNetworks(userData?.createdNetworks || []);
          } else {
            console.log('User document does not exist.');
          }
        },
        error => {
          console.warn('Error fetching user details: ', error);
        },
      );

      const unsubscribeJoinedNetworks = userRef
        .collection('JoinedNetworks')
        .onSnapshot(
          joinedSnapshot => {
            setJoinedNetworks(joinedSnapshot.docs.map(doc => doc.id) || []);
          },
          error => {
            console.warn('Error fetching joined networks: ', error);
          },
        );

      return () => {
        unsubscribeUserDetails();
        unsubscribeJoinedNetworks();
      };
    };

    const unsubscribe = fetchJoinedNetworks();
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const parallaxSlideTransition = ({current, next, inverted, layouts}) => {
    const translateX = Animated.interpolate(current.progress, {
      inputRange: [0, 1],
      outputRange: [layouts.screen.width, 0],
    });

    return {
      cardStyle: {
        transform: [{translateX}],
      },
    };
  };

  const renderSidebar = () => (
    <ScrollView contentContainerStyle={styles.sidebarContainer}>
      {userDetails.isLeftHand ? (
        <Pressable
          style={styles.toggleButton}
          onPress={() => drawerRef.current.closeDrawer()}>
          <Text style={{color: 'white', fontSize: 20, fontFamily: 'title3'}}>
            Redrat
          </Text>
          <Icon
            name="cog"
            size={25}
            color="grey"
            onPress={() => navigation.navigate('UserDetails')}
          />
        </Pressable>
      ) : (
        <Pressable
          style={styles.toggleButton}
          onPress={() => drawerRef.current.closeDrawer()}>
          <Icon
            name="cog"
            size={25}
            color="grey"
            onPress={() => navigation.navigate('UserDetails')}
          />
          <Text style={{color: 'white', fontSize: 20, fontFamily: 'title3'}}>
            Redrat
          </Text>
        </Pressable>
      )}

      <ScrollView>
        <View>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              width: '100%',
              marginHorizontal: 5,
            }}>
            <Image
              source={{uri: userDetails.profile_pic}}
              resizeMode="cover"
              style={{
                height: 60,
                width: 60,
                marginLeft: 4,
                borderRadius: 80,
                alignSelf: 'flex-start',
              }}
            />
            <View
              style={{
                alignItems: 'flex-start',
                justifyContent: 'space-evenly',
                gap: 5,
              }}>
              <Text style={{color: 'white', fontSize: 16, fontWeight: 'bold'}}>
                {userDetails.name}
              </Text>
              <Bluing
                text={userDetails.bio}
                style={{color: 'white', fontSize: 15, maxWidth: '90%'}}
                maxLength={40}
              />
            </View>
          </View>
          <Pressable
            onPress={() => {
              drawerRef.current.closeDrawer();
              navigation.navigate('RecommendedHome', {
                isShowBack: true,
              });
            }}
            style={{
              paddingVertical: 10,
              marginVertical: 5,
              width: '100%',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexDirection: 'row',
              marginLeft: 4,
            }}>
            <Text
              style={{
                color: 'white',
                fontSize: 18,
                marginLeft: 4,
                fontWeight: '900',
              }}>
              Personalized Recommendations
            </Text>
            <Icon name="chevron-forward" size={20} color="grey" />
          </Pressable>
          <Pressable
            onPress={() => {
              drawerRef.current.closeDrawer();
              navigation.navigate('CustomFeed');
            }}
            style={{
              paddingVertical: 10,
              marginVertical: 5,
              width: '100%',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexDirection: 'row',
              marginLeft: 4,
            }}>
            <Text
              style={{
                color: 'white',
                fontSize: 18,
                marginLeft: 4,
                fontWeight: '900',
              }}>
              Custom Feed
            </Text>
          </Pressable>
          {customFeeds.map((item, index) => (
            <Pressable
              key={index}
              style={{
                padding: 10,
                margin: 5,
                backgroundColor: '#1a1a1a',
                borderRadius: 8,
                justifyContent: 'space-between',
                flexDirection:'row',
                alignItems: 'center'
              }} 
              onPress={() => navigation.navigate("CustomFeedPosts", {
                feed: item
              })}
            >
              <Text style={{color: 'white', fontSize: 16}}>{item.feedName}</Text>
              <Icon name="chevron-forward" color="white" size={18} />
            </Pressable>
          ))}
          
          <Pressable
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: 10,
              marginBottom: 20,
            }}
            onPress={() => setJoinedExpand(!joinedExpand)}>
            <Text
              style={{
                color: 'white',
                fontSize: 18,
                marginLeft: 4,
                fontWeight: '900',
              }}>
              Joined networks
            </Text>
            <Icon
              size={20}
              name={joinedExpand ? 'chevron-up' : 'chevron-down'}
              color={'grey'}
            />
          </Pressable>
          {joinedExpand &&
            joinedNetworks &&
            (joinedNetworks.length > 0 ? (
              <ScrollView>
                {joinedNetworks.map((network, index) => (
                  <NetworkDisplay key={index} network_id={network} />
                ))}
              </ScrollView>
            ) : (
              <Text
                style={{
                  color: 'grey',
                  fontSize: 15,
                  textAlign: 'center',
                  marginBottom: 15,
                }}>
                Join Networks to add here
              </Text>
            ))}
        </View>
        <View>
          <Pressable
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: 10,
              marginBottom: 10,
            }}
            onPress={() => setCreatedExpand(!createdExpand)}>
            <Text
              style={{
                color: 'white',
                fontSize: 18,
                marginLeft: 4,
                fontWeight: '900',
              }}>
              Created networks
            </Text>
            <Icon
              size={20}
              name={createdExpand ? 'chevron-up' : 'chevron-down'}
              color={'grey'}
            />
          </Pressable>
          {createdExpand &&
            (createdNetworks.length > 0 ? (
              <ScrollView>
                {createdNetworks.map((network, index) => (
                  <NetworkDisplay key={index} network_id={network} />
                ))}
              </ScrollView>
            ) : (
              <View>
                <Text
                  style={{
                    color: 'grey',
                    fontSize: 15,
                    textAlign: 'center',
                    marginTop: 15,
                  }}>
                  No Networks Created
                </Text>
                <Pressable
                  style={{
                    backgroundColor: color,
                    padding: 10,
                    borderRadius: 5,
                    width: '90%',
                    alignSelf: 'center',
                    marginTop: 15,
                    alignItems: 'center',
                    opacity: userDetails.tribet > 500 ? 1 : 0.5,
                  }}
                  disabled={!(userDetails.tribet >= 500)}
                  onPress={() => {
                    drawerRef.current.closeDrawer();
                    navigation.navigate('Create');
                  }}>
                  <Text style={{color: 'white', fontSize: 15}}>
                    Create network
                  </Text>
                </Pressable>
              </View>
            ))}
        </View>
      </ScrollView>
    </ScrollView>
  );

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="small" color={color} />
      </View>
    );
  }

  return (
    <DrawerLayout
      ref={drawerRef}
      drawerWidth={SIDEBAR_WIDTH}
      drawerPosition={userDetails.isLeftHand ? 'left' : 'right'}
      renderNavigationView={renderSidebar}
      hideStatusBarOnOpen={true}
      drawerType="back">
      <View style={{flex: 1, backgroundColor: 'black'}}>
        <View
          style={{
            padding: 10,
            width: '100%',
            justifyContent: 'space-between',
            flexDirection: 'row',
            alignItems: 'center',
          }}>
          <Text style={{color: color, fontFamily: 'title3', fontSize: 25}}>
            Redrat
          </Text>
          <Pressable
            style={styles.drawerToggle}
            onPress={() => drawerRef.current.openDrawer()}>
            <Icon name="menu-outline" size={24} color="white" />
          </Pressable>
        </View>
        <ProfileTabNavigator.Navigator
          screenOptions={({route}) => ({
            tabBarLabelStyle: {
              fontSize: 15,
              letterSpacing: 1,
              color: 'white',
            },
            tabBarItemStyle: {
              width: 100,
              backgroundColor: '#1a1a1a',
              marginRight: 10,
              borderRadius: 50,
            },
            tabBarStyle: {backgroundColor: 'black'},
            tabBarIndicatorStyle: {
              backgroundColor: 'black',
              width: 50,
              alignSelf: 'center',
            },
            tabBarActiveTintColor: 'white',
            tabBarInactiveTintColor: 'grey',
            animationEnabled: true,
            swipeEnabled: true,
            lazy: true,
            lazyPlaceholder: () => (
              <View
                style={{
                  flex: 1,
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor: 'black',
                }}>
                <Text style={{color: 'white'}}>Loading...</Text>
              </View>
            ),
          })}
          tabBarBounces={true}
          optimizationsEnabled={true}>
          <ProfileTabNavigator.Screen
            name="Home"
            component={HomeScreen}
            options={{
              cardStyleInterpolator: parallaxSlideTransition,
              tabBarLabel: ({focused}) => (
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                  <Text
                    style={{
                      color: focused ? 'white' : 'grey',
                      fontSize: 15,
                      letterSpacing: 1,
                    }}>
                    HOME
                  </Text>
                </View>
              ),
            }}
          />

          <ProfileTabNavigator.Screen
            name="Inbox"
            component={Inbox}
            options={{
              cardStyleInterpolator: parallaxSlideTransition,
              tabBarLabel: ({focused}) => (
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                  <Text
                    style={{
                      color: focused ? 'white' : 'grey',
                      fontSize: 15,
                      letterSpacing: 1,
                    }}>
                    INBOX
                  </Text>
                  {unreadCount > 0 && (
                    <View
                      style={{
                        backgroundColor: color,
                        borderRadius: 50,
                        paddingVertical: 2,
                        paddingHorizontal: 6,
                        marginLeft: 10,
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}>
                      <Text
                        style={{
                          color: 'white',
                          fontSize: 12,
                          fontWeight: 'bold',
                        }}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </Text>
                    </View>
                  )}
                </View>
              ),
            }}
            initialParams={{allMessages: allMessages}}
          />
        </ProfileTabNavigator.Navigator>
      </View>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalText}>
              Swipe right to read unread messages in the Inbox
            </Text>
            <Pressable
              style={styles.closeModalButton}
              onPress={() => setModalVisible(false)}>
              <Text style={styles.closeModalText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </DrawerLayout>
  );
}

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
  sidebarContainer: {
    flex: 1,
    backgroundColor: 'black',
    paddingTop: 10,
  },
  toggleButton: {
    paddingVertical: 10,
    backgroundColor: 'black',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 10,
  },
  unreadMessagesIcon: {
    position: 'relative',
  },
  unreadCount: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: color,
    width: 20,
    height: 20,
    borderRadius: 10,
    textAlign: 'center',
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  drawerToggle: {
    right: 10,
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    backgroundColor: 'black',
    padding: 20,
    borderRadius: 5,
    width: '90%',
    alignItems: 'center',
  },
  modalText: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 15,
    color: 'grey',
    textAlign: 'center',
  },
  closeModalButton: {
    backgroundColor: color,
    padding: 10,
    borderRadius: 5,
    width: '90%',
    alignItems: 'center',
  },
  closeModalText: {
    color: 'white',
    fontSize: 16,
  },
});
