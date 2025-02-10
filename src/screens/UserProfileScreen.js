import React, {useEffect, useState, useCallback} from 'react';
import {
  Text,
  View,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  Dimensions,
  Modal,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import Icon from 'react-native-vector-icons/Ionicons';
import Bluing from '../texting/Bluing';
import ProfileScreen from './ProfileScreen';
import {createMaterialTopTabNavigator} from '@react-navigation/material-top-tabs';
import PostUsers from './PostUsers';
import Mentions from './Mentions';
import ProfileTabs from './ProfileTabs';
import TribetCard from './TribetCard';
import blockUser from './blockUser';
import unBlockUser from './unBlockUser';
import color from './color';
import moment from 'moment';
import {SharedElement} from 'react-navigation-shared-element';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function UserProfileScreen({route, navigation}) {
  const {id} = route.params;
  const currentUser = auth().currentUser;
  const [userDetails, setUserDetails] = useState({});
  const [requested, setRequested] = useState(false);
  const [isFollower, setIsFollower] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [alreadyRequested, setAlreadyRequested] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [name, setName] = useState();
  const [token, setToken] = useState();
  const [activeTab, setActiveTab] = useState(0);
  const Tab = createMaterialTopTabNavigator();
  const sendPushNotification = require('../../sendNotification');
  const [modalVisible, setModalVisible] = useState(false);
  const [reportModal, setReportModal] = useState(false);
  const [confirmBlock, setConfirmBlock] = useState(false);
  const [blockLoading, setBlockLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true); 
    const unsubscribe = firestore()
      .collection('Users')
      .doc(id)
      .onSnapshot(snapshot => {
        if (snapshot.exists) {
          const data = snapshot.data();
          setUserDetails(data);
          setFollowersCount(
            Array.isArray(data?.followers) ? data.followers.length : 0,
          );
          setFollowingCount(
            Array.isArray(data?.following) ? data.following.length : 0,
          );
        }
        setLoading(false); 
      });

    return () => unsubscribe();
  }, [id]);

  const joinedOn = userDetails.joined_on?.toDate();

  useEffect(() => {
    const fetch = async () => {
      setLoading(true); 
      try {
        const data = await firestore()
          .collection('Users')
          .doc(auth().currentUser.uid)
          .get();
        setName(data.data().name);
        setToken(data.data().fcmToken);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false); 
      }
    };
    fetch();
  }, []);

  useEffect(() => {
    const fetchRequestedStatus = async () => {
      setLoading(true); 
      try {
        const userDoc = await firestore().collection('Users').doc(id).get();
        const currentUserData = userDoc.data();

        if (currentUserData) {
          const isRequested = currentUserData?.requested?.includes(
            currentUser.uid,
          );
          setRequested(isRequested);
        }
      } catch (error) {
        console.warn(error);
      } finally {
        setLoading(false); 
      }
    };
    fetchRequestedStatus();
  }, [id]);

  useEffect(() => {
    const unsubscribe = firestore()
      .collection('Users')
      .doc(currentUser.uid)
      .onSnapshot(snapshot => {
        if (snapshot.exists) {
          const currentUserData = snapshot.data();

          if (currentUserData) {
            setAlreadyRequested(currentUserData?.requested?.includes(id));
            setIsFollower(currentUserData?.followers?.includes(id));
            setIsFollowing(currentUserData?.following?.includes(id));
          }
        }
      });

    return () => unsubscribe();
  }, [id]);

  const onRefresh = useCallback(() => {
    try {
      setRefreshing(true);
      fetch();
    } catch (error) {
      console.warn(error);
    } finally {
      setRefreshing(false);
    }
  }, []);
  const confirmRequest = async () => {
    try {
      sendPushNotification(
        'Accept Request',
        userDetails.fcmToken,
        `${name} accepted your request`,
        {
          id: id,
          type: 'FOLLOW_REQUEST',
        },
      );
      await firestore()
        .collection('Users')
        .doc(currentUser.uid)
        .update({
          requested: firestore.FieldValue.arrayRemove(id),
          followers: firestore.FieldValue.arrayUnion(id),
        });
      await firestore()
        .collection('Users')
        .doc(id)
        .update({
          following: firestore.FieldValue.arrayUnion(currentUser.uid),
        });
      setIsFollower(true);
    } catch (error) {
      console.warn(error);
    }
  };

  const onFollowBack = async () => {
    try {
      sendPushNotification(
        'Follow Back Request',
        userDetails.fcmToken,
        `${name} followed you back`,
        {
          id: id,
          type: 'FOLLOW_REQUEST',
        },
      );
      await firestore()
        .collection('Users')
        .doc(currentUser.uid)
        .update({
          following: firestore.FieldValue.arrayUnion(id),
        });

      await firestore()
        .collection('Users')
        .doc(id)
        .update({
          followers: firestore.FieldValue.arrayUnion(currentUser.uid),
        });
      setIsFollowing(true);
    } catch (error) {
      console.warn(error);
    }
  };

  const handleBlock = async id => {
    setBlockLoading(true);

    const success = await blockUser({
      blocker_id: auth().currentUser.uid,
      blocked_id: id,
    });

    if (success) {
      setBlockLoading(false);
      setConfirmBlock(false);
    } else {
      setBlockLoading(false);
      setConfirmBlock(false);
    }
  };
  const handleUnBlock = async id => {
    setBlockLoading(true);

    const success = await unBlockUser({
      blocker_id: auth().currentUser.uid,
      blocked_id: id,
    });

    if (success) {
      setBlockLoading(false);
    } else {
      setBlockLoading(false);
    }
  };

  const unFollow = async () => {
    try {
      await firestore()
        .collection('Users')
        .doc(currentUser.uid)
        .update({
          following: firestore.FieldValue.arrayRemove(id),
        });
      await firestore()
        .collection('Users')
        .doc(id)
        .update({
          followers: firestore.FieldValue.arrayRemove(auth().currentUser.uid),
        });
    } catch (error) {
      console.warn(error);
    }
  };
  const cancelRequest = async () => {
    try {
      await firestore()
        .collection('Users')
        .doc(currentUser.uid)
        .update({
          requested: firestore.FieldValue.arrayRemove(id),
        });
    } catch (error) {
      console.warn(error);
    }
  };

  const onFollow = async () => {
    try {
      if (userDetails.isPrivate) {
        sendPushNotification(
          'Follow Request',
          userDetails.fcmToken,
          `${name} requested to follow you`,
          {
            id: auth().currentUser.uid,
            type: 'FOLLOW_REQUEST',
          },
        );
        await firestore()
          .collection('Users')
          .doc(id)
          .update({
            requested: firestore.FieldValue.arrayUnion(currentUser.uid),
          });
        await firestore()
          .collection('Users')
          .doc(id)
          .collection('Notifications')
          .add({
            type: 'follow',
            followedBy: auth().currentUser.uid,
            lastUpdated: firestore.FieldValue.serverTimestamp(),
          });
        setRequested(true);
      } else {
        await firestore()
          .collection('Users')
          .doc(id)
          .update({
            followers: firestore.FieldValue.arrayUnion(currentUser.uid),
          });

        await firestore()
          .collection('Users')
          .doc(currentUser.uid)
          .update({
            following: firestore.FieldValue.arrayUnion(id),
          });

        setIsFollowing(true);
      }
    } catch (error) {
      console.warn(error);
    }
  };

  if (id === currentUser.uid) {
    return <ProfileScreen />;
  }
  
  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'black',
        }}>
        <ActivityIndicator size="small" color={color} />
      </View>
    );
  }

  if (userDetails.blockedBy?.includes(auth().currentUser.uid)) {
    return (
      <View
        style={{
          backgroundColor: 'black',
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Text style={{color: 'white'}}>
          You have blocked {userDetails.name}
        </Text>
        <Pressable
          style={{
            width: '90%',
            alignItems: 'center',
            padding: 10,
            borderRadius: 5,
            backgroundColor: color,
            marginTop: 10,
          }}
          onPress={() => handleUnBlock(id)}>
          {blockLoading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={{color: 'white'}}>Unblock user</Text>
          )}
        </Pressable>
      </View>
    );
  }

  const MainComponent = () => {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <Icon
              name="chevron-back"
              size={25}
              color={color}
              onPress={() => navigation.goBack()}
            />
            <Text style={styles.title}>{userDetails.name}</Text>
          </View>
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 15}}>
            <Icon
              name="card"
              size={28}
              color={color}
              onPress={() => setModalVisible(true)}
              style={{right: 5}}
            />
            <Icon
              name="menu"
              size={28}
              color={color}
              onPress={() => setReportModal(true)}
              style={{right: 5}}
            />
          </View>
        </View>

        <View style={styles.profileInformation}>
          <View style={{alignItems: 'center', margin: 8}}>
            <Image
              source={{uri: userDetails.profile_pic}}
              style={styles.profilePic}
            />
            <Text style={styles.name}>{userDetails.name}</Text>
          </View>
          <Pressable
            style={{
              alignItems: 'center',
              backgroundColor: '#1a1a1a',
              padding: 10,
              borderRadius: 3,
            }}
            onPress={() =>
              isFollowing
                ? navigation.push('UserStatus', {
                    id: id,
                    status: 'followers',
                  })
                : null
            }>
            <Text style={{color: isFollowing ? 'white' : 'grey', fontSize: 18}}>
              Followers
            </Text>
            <Text style={{color: isFollowing ? 'white' : 'grey', fontSize: 16}}>
              {followersCount}
            </Text>
          </Pressable>
          <Pressable
            style={{
              alignItems: 'center',
              backgroundColor: '#1a1a1a',
              padding: 10,
              borderRadius: 3,
            }}
            onPress={() =>
              isFollowing
                ? navigation.push('UserStatus', {
                    id: id,
                    status: 'following',
                  })
                : null
            }>
            <Text style={{color: isFollowing ? 'white' : 'grey', fontSize: 18}}>
              Following
            </Text>
            <Text style={{color: isFollowing ? 'white' : 'grey', fontSize: 16}}>
            {followingCount}
            </Text>
          </Pressable>
        </View>

        <View
          style={{
            backgroundColor: '#1a1a1a',
            width: '90%',
            alignSelf: 'center',
            margin: 10,
            padding: 4,
            borderRadius: 5,
          }}>
          <Bluing
            text={userDetails.bio}
            style={{color: 'white', fontSize: 17, margin: 10}}
          />
        </View>

        {!alreadyRequested && !isFollower && !isFollowing ? (
          <Pressable
            onPress={onFollow}
            style={{
              width: '90%',
              backgroundColor: requested ? 'grey' : color,
              margin: 10,
              alignItems: 'center',
              padding: 10,
              alignSelf: 'center',
            }}>
            <Text style={{color: 'white', fontSize: 18}}>
              {requested ? 'Requested' : 'Follow'}
            </Text>
          </Pressable>
        ) : null}

        {alreadyRequested && (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-evenly',
              maxWidth: '90%',
              alignSelf: 'center',
              gap: 10,
            }}>
            <Pressable
              style={{
                backgroundColor: color,
                width: '45%',
                alignItems: 'center',
                padding: 10,
                borderRadius: 3,
              }}
              onPress={confirmRequest}>
              <Text style={{color: 'white', fontSize: 16}}>
                Confirm Request
              </Text>
            </Pressable>
            <Pressable
              style={{
                backgroundColor: '#1a1a1a',
                width: '45%',
                alignItems: 'center',
                padding: 10,
                borderRadius: 3,
              }}
              onPress={cancelRequest}>
              <Text style={{color: 'white', fontSize: 16}}>Cancel Request</Text>
            </Pressable>
          </View>
        )}

        {isFollower && !isFollowing ? (
          <Pressable
            style={{
              width: '90%',
              backgroundColor: color,
              padding: 10,
              alignSelf: 'center',
              borderRadius: 3,
              alignItems: 'center',
            }}
            onPress={onFollowBack}>
            <Text style={{color: 'white'}}>Follow back</Text>
          </Pressable>
        ) : null}
        {isFollowing && (
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-evenly',
              marginBottom: 20,
            }}>
            <Pressable
              style={{
                width: '40%',
                backgroundColor: color,
                alignSelf: 'center',
                borderRadius: 3,
                alignItems: 'center',
                padding: 10,
              }}
              onPress={() =>
                navigation.navigate('Chat', {
                  id: id,
                })
              }>
              <Text style={{color: 'white', fontSize: 18}}>Chat</Text>
            </Pressable>
            <Pressable
              style={{
                backgroundColor: '#1a1a1a',
                width: '40%',
                alignItems: 'center',
                borderRadius: 3,
                padding: 10,
              }}
              onPress={unFollow}>
              <Text style={{color: color, fontSize: 18}}>Unfollow</Text>
            </Pressable>
          </View>
        )}
        <Modal
          transparent={true}
          visible={modalVisible}
          animationType="slide"
          onRequestClose={() => setModalVisible(false)}>
          <Pressable
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
            }}
            onPress={() => setModalVisible(false)}>
            <View
              style={{
                backgroundColor: 'black',
                borderRadius: 10,
                width: '95%',
                alignItems: 'center',
                margin: 4,
              }}>
              <TribetCard id={id} />
            </View>
          </Pressable>
        </Modal>
        <Modal
          transparent={true}
          visible={reportModal}
          animationType="slide"
          onRequestClose={() => setReportModal(false)}>
          <Pressable
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
            }}
            onPress={() => setReportModal(false)}>
            <View
              style={{
                backgroundColor: 'black',
                borderRadius: 10,
                width: '90%',
                alignItems: 'center',
                margin: 4,
                padding: 10
              }}>
              <View
                style={{
                  width: '90%',
                  backgroundColor: '#1a1a1a',
                  padding: 10,
                  borderRadius: 5,
                  alignItems: 'center',
                }}>
                <Text style={{color: 'white'}}>Perform Account Operations</Text>
              </View>
              <Pressable
                style={{
                  width: '100%',
                  padding: 15,
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexDirection: 'row',
                }}
                onPress={() => {
                  setReportModal(false);
                  navigation.navigate('ReportAcccount', {
                    reportedUserId: id,
                  });
                }}>
                <Text style={{color: 'white'}}>Report User</Text>
                <Icon name="chevron-forward" size={20} color="white" />
              </Pressable>
              <Pressable
                style={{
                  width: '100%',
                  padding: 15,
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexDirection: 'row',
                }}
                onPress={() => {
                  setReportModal(false);
                  setConfirmBlock(true);
                }}>
                <Text style={{color: 'white'}}>Block User</Text>
                <Icon name="chevron-forward" size={20} color="white" />
              </Pressable>
              <Text style={{color: 'grey', alignSelf: 'flex-end', marginHorizontal: 10}}>Joined on {joinedOn ? moment(joinedOn).format('DD MMMM YYYY') : 'N/A'}</Text>
            </View>
          </Pressable>
        </Modal>
        <Modal
          transparent={true}
          visible={confirmBlock}
          animationType="slide"
          onRequestClose={() => setConfirmBlock(false)}>
          <Pressable
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
            }}
            onPress={() => setConfirmBlock(false)}>
            <View
              style={{
                backgroundColor: 'black',
                borderRadius: 10,
                width: '90%',
                alignItems: 'center',
                margin: 4,
                padding: 15,
              }}>
              <Text style={{color: 'white', margin: 15}}>
                Are you sure you want to block this account?
              </Text>
              <Text style={{color: 'white', margin: 10}}>
                - They will no longer be able to send you messages or interact
                with you directly.
              </Text>
              <Text style={{color: 'white', margin: 10}}>
                - They will not be able to see your posts, likes, or comments.
              </Text>
              <Text style={{color: 'white', margin: 10}}>
                - They will be removed from your followers and following lists.
              </Text>
              <Text style={{color: 'white', margin: 10}}>
                - You will be removed from their followers and following lists.
              </Text>
              <Text style={{color: 'white', margin: 10}}>
                - You can unblock them at any time from your settings, but the
                relationship will not be automatically restored.
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                }}>
                <Pressable
                  style={{
                    width: '45%',
                    alignItems: 'center',
                    padding: 10,
                    borderRadius: 5,
                    backgroundColor: color,
                  }}
                  onPress={() => handleBlock(id)}>
                  {blockLoading ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text style={{color: 'white'}}>Block User</Text>
                  )}
                </Pressable>
                <Pressable
                  style={{
                    width: '45%',
                    alignItems: 'center',
                    padding: 10,
                    borderRadius: 5,
                    backgroundColor: '#1a1a1a',
                  }}>
                  <Text style={{color: 'white'}}>Cancel</Text>
                </Pressable>
              </View>
            </View>
          </Pressable>
        </Modal>
      </View>
    );
  };
  return (
    <View style={{backgroundColor: 'black', flex: 1}}>
      <FlatList
        data={[1]}
        ListHeaderComponent={MainComponent}
        ListFooterComponent={
          isFollowing ? (
            <ProfileTabs id={id} />
          ) : (
            <View style={{backgroundColor: 'black', flex: 1}}></View>
          )
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'black',
    flex: 1,
  },
  tabBarStyle: {
    elevation: 0,
    backgroundColor: '#1a1a1a',
    height: 70,
    justifyContent: 'center',
    borderRadius: 10,
    margin: 10,
  },
  header: {
    backgroundColor: 'black',
    width: '100%',
    padding: 5,
    margin: 7,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 22,
    color: color,
  },
  profileInformation: {
    alignItems: 'center',
    justifyContent: 'space-evenly',
    flexDirection: 'row',
  },
  profilePic: {
    width: 100,
    height: 100,
    borderRadius: 50,
    margin: 10,
  },
  name: {
    fontSize: 18,
    color: 'white',
    fontWeight: 'bold',
  },
});




