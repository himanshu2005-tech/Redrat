import React, {useCallback, useMemo, useRef, useState, useEffect} from 'react';
import {
  Text,
  View,
  Image,
  StyleSheet,
  Pressable,
  Alert,
  Modal,
  ScrollView,
  Button,
  FlatList,
  ActivityIndicator,
  Linking,
  Dimensions,
  TextInput,
  Animated,
  FlatListComponent,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import Icon from 'react-native-vector-icons/Ionicons';
import auth from '@react-native-firebase/auth';
import {useNavigation} from '@react-navigation/native';
import ImageCollage from './ImageCollage';
import {useIsFocused} from '@react-navigation/native';
import {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetModalProvider,
  BottomSheetBackdrop,
  TouchableOpacity,
} from '@gorhom/bottom-sheet';
import Video from 'react-native-video';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';
import User from './User';
import LinearGradient from 'react-native-linear-gradient';
import Hash from './Hash';
import Bluing from '../texting/Bluing';
import * as Animatable from 'react-native-animatable';
import {useWindowDimensions} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import updateTribet from './updateTribet';
import VideoComponent from './VideoComponent';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  PanGestureHandler,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import {concatString} from '../texting/textSplit';
import color from './color';
import {SharedElement} from 'react-navigation-shared-element';

const {height} = Dimensions.get('window');
export default function Post({post_id, isSub}) {
  const [postData, setPostData] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [networkPic, setNetworkPic] = useState(null);
  const [isMember, setIsMember] = useState(FlatListComponent);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [adminDetails, setAdminDetails] = useState({});
  const [isLeftHand, setIsLeftHand] = useState();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [networkDetails, setNetworkDetails] = useState([]);
  const [isPinned, setIsPinned] = useState(false);
  const navigation = useNavigation();
  const [name, setName] = useState();
  const bottomSheetModalRef = useRef(null);
  const [polls, setPolls] = useState([]);
  const videoContainerRef = useRef(null);
  const [votedId, setVotedId] = useState();
  const [likeLoading, setLikeLoading] = useState();
  const [saveLoading, setSaveLoading] = useState();
  const sendPushNotification = require('../../sendNotification');
  const [opac, setOpac] = useState(false);
  const [isToxic, setIsToxic] = useState(false);
  const [showAppreciationModal, setShowAppreciationModal] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [appreciationLoading, setAppreciationLoading] = useState(false);
  const [tribetAmount, setTribetAmount] = useState();
  const [confirmationMessage, setConfirmationMessage] = useState();
  const [authorDetails, setAuthorDetails] = useState([]);
  const [requestLoading, setRequestLoading] = useState(false);

  const animation = useRef(new Animated.Value(1)).current;

  const animateLike = () => {
    Animated.sequence([
      Animated.timing(animation, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(animation, {
        toValue: 1.5,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(animation, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  useEffect(() => {
    let unsubscribeLikes;
    let unsubscribeSaves;
    let unsubscribePolls;

    const fetchAllData = async () => {
      try {
        setLoading(true);

        const currentUserUid = auth().currentUser?.uid;
        const postRef = firestore().collection('Posts').doc(post_id);

        const postDoc = await postRef.get();
        const postDetails = postDoc.exists ? postDoc.data() : null;

        if (!postDetails) {
          setLoading(false);
          return;
        }

        const userDetailsJson = await AsyncStorage.getItem('userDetails');
        const userDetails = userDetailsJson
          ? JSON.parse(userDetailsJson)
          : null;

        const joinedDetailsJson = await AsyncStorage.getItem('joinedNetworks');
        const joinedDetails = joinedDetailsJson
          ? JSON.parse(joinedDetailsJson)
          : null;

        if (userDetails?.blockedUsers?.includes(postDetails.posted_by)) {
          setLoading(false);
          return;
        }

        const [networkDoc, authorDoc, isMember] = await Promise.all([
          firestore().collection('Network').doc(postDetails.network_id).get(),
          firestore().collection('Users').doc(postDetails.posted_by).get(),
        ]);

        const networkDetails = networkDoc.exists ? networkDoc.data() : null;
        const authorDocument = authorDoc.exists ? authorDoc.data() : null;

        unsubscribeLikes = postRef
          .collection('Likes')
          .doc(currentUserUid)
          .onSnapshot(doc => setLiked(doc.exists));

        unsubscribeSaves = postRef
          .collection('Saves')
          .doc(currentUserUid)
          .onSnapshot(doc => setSaved(doc.exists));

        unsubscribePolls = postRef.collection('Polls').onSnapshot(snapshot => {
          const updatedPolls = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          }));

          setPolls(updatedPolls);

          const currentUserVote = updatedPolls.find(poll =>
            poll.voterId?.includes(currentUserUid),
          );
          setVotedId(currentUserVote ? currentUserVote.id : null);
        });

        setIsMember(joinedDetails.includes(postDetails.network_id));
        setPostData(postDetails);
        setUserData(userDetails);
        setAuthorDetails(authorDocument);
        setNetworkDetails(networkDetails);
        setLikeCount(postDetails.likeCount);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };

    fetchAllData();

    return () => {
      if (unsubscribeLikes) unsubscribeLikes();
      if (unsubscribeSaves) unsubscribeSaves();
      if (unsubscribePolls) unsubscribePolls();
    };
  }, [post_id]);

  const snapPoints = useMemo(() => ['95%'], []);

  const handlePresentModalPress = useCallback(() => {
    setOpac(true);
    bottomSheetModalRef.current?.present();
  }, []);

  const handleClosePress = () => bottomSheetModalRef.current?.close();

  const handleDelete = async () => {
    handleClosePress();
    setShowDeleteModal(true);
  };
  const confirmDelete = async () => {
    try {
      const userId = auth().currentUser?.uid;

      const postRef = firestore().collection('Posts').doc(post_id);

      await postRef.delete();
      setShowDeleteModal(false);
    } catch (error) {
      console.error('Error deleting post:', error);
      Alert.alert('Error', 'Failed to delete post. Please try again later.');
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
  };

  const handleLike = async () => {
    handleClosePress();
    try {
      if (likeLoading) {
        return;
      }
      animateLike();
      const userId = auth().currentUser?.uid;
      if (!userId || !postData?.network_id || !post_id) {
        console.warn('Missing userId, network_id, or post_id');
        return;
      }

      setLikeLoading(true);
      const postRef = firestore().collection('Posts').doc(post_id);

      const likeDocRef = postRef.collection('Likes').doc(userId);

      const userLikesRef = firestore()
        .collection('Users')
        .doc(userId)
        .collection('Likes')
        .doc(post_id);

      const notificationRef = firestore()
        .collection('Users')
        .doc(postData.posted_by)
        .collection('Notifications')
        .doc(post_id);

      const preferenceRef = firestore()
        .collection('Users')
        .doc(userId)
        .collection('Preferences')
        .doc(networkDetails?.topic);

      const batch = firestore().batch();

      const likeSnapshot = await likeDocRef.get();

      if (likeSnapshot.exists) {
        setLikeCount(likeCount - 1);
        setLiked(false);
        batch.delete(likeDocRef);
        batch.delete(userLikesRef);

        batch.update(postRef, {
          likeCount: firestore.FieldValue.increment(-1),
          likePoint: firestore.FieldValue.increment(-2),
        });

        batch.update(notificationRef, {
          likedBy: firestore.FieldValue.arrayRemove(userId),
        });

        batch.set(preferenceRef, {
          score: firestore.FieldValue.increment(-2),
        });
      } else {
        setLikeCount(likeCount + 1);
        setLiked(true);
        batch.set(likeDocRef, {
          userId: userId,
          likedAt: firestore.FieldValue.serverTimestamp(),
        });

        batch.set(userLikesRef, {
          post_id: post_id,
          likedAt: firestore.FieldValue.serverTimestamp(),
        });

        batch.update(postRef, {
          likeCount: firestore.FieldValue.increment(1),
          likePoint: firestore.FieldValue.increment(2),
        });

        batch.set(
          notificationRef,
          {
            type: 'like',
            likedBy: firestore.FieldValue.arrayUnion(userId),
            post_id: post_id,
            lastUpdated: firestore.FieldValue.serverTimestamp(),
          },
          {merge: true},
        );

        batch.set(
          preferenceRef,
          {score: firestore.FieldValue.increment(2)},
          {merge: true},
        );
        //sendPushNotification(userData.name, authorDetails.fcmToken, "Liked your post", "POST_LIKE")
      }

      await batch.commit();
      console.log('Like operation completed');
    } catch (error) {
      setLiked(!liked);
      console.error('Error updating likes:', error);
    } finally {
      setLikeLoading(false);
    }
  };

  const timeAgo = timestamp => {
    if (!timestamp) {
      return 'Unknown time';
    }

    const now = new Date();
    const seconds = Math.floor((now - timestamp.toDate()) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) {
      return Math.floor(interval) + ' years ago';
    } else if (interval >= 1) {
      return '1 year ago';
    }

    interval = seconds / 2592000;
    if (interval > 1) {
      return Math.floor(interval) + ' months ago';
    } else if (interval >= 1) {
      return '1 month ago';
    }

    interval = seconds / 86400;
    if (interval > 1) {
      return Math.floor(interval) + ' days ago';
    } else if (interval >= 1) {
      return '1 day ago';
    }

    interval = seconds / 3600;
    if (interval > 1) {
      return Math.floor(interval) + ' hours ago';
    } else if (interval >= 1) {
      return '1 hour ago';
    }

    interval = seconds / 60;
    if (interval > 1) {
      return Math.floor(interval) + ' minutes ago';
    } else if (interval >= 1) {
      return '1 minute ago';
    }

    return 'just now';
  };

  const handleSave = async () => {
    handleClosePress();
    try {
      if (saveLoading) {
        return;
      }
      setSaveLoading(true);
      const userId = auth().currentUser?.uid;
      if (!userId || !postData?.network_id || !post_id) {
        console.warn('User ID, network ID, or post ID is missing.');
        return;
      }

      const postRef = firestore().collection('Posts').doc(post_id);

      const savedDocRef = postRef.collection('Saves').doc(userId);

      const userSavesRef = firestore()
        .collection('Users')
        .doc(userId)
        .collection('Saves')
        .doc(post_id);

      const preferenceRef = firestore()
        .collection('Users')
        .doc(userId)
        .collection('Preferences')
        .doc(networkDetails?.topic);

      const snapshot = await savedDocRef.get();
      const batch = firestore().batch();

      if (snapshot.exists) {
        batch.delete(savedDocRef);
        batch.delete(userSavesRef);
        batch.update(postRef, {
          saveCount: firestore.FieldValue.increment(-1),
          savePoint: firestore.FieldValue.increment(-4),
        });

        batch.set(preferenceRef, {
          score: firestore.FieldValue.increment(-4),
        });

        setSaved(false);
      } else {
        batch.set(savedDocRef, {
          userId: userId,
          savedAt: firestore.FieldValue.serverTimestamp(),
        });

        batch.set(userSavesRef, {
          post_id: post_id,
          savedAt: firestore.FieldValue.serverTimestamp(),
          network_id: postData?.network_id,
        });

        batch.update(postRef, {
          saveCount: firestore.FieldValue.increment(1),
          savePoint: firestore.FieldValue.increment(4),
        });

        batch.set(
          preferenceRef,
          {score: firestore.FieldValue.increment(4)},
          {merge: true},
        );

        setSaved(true);
      }

      await batch.commit();
      console.log('Save operation completed');
    } catch (error) {
      console.error('Error updating saved posts:', error);
    } finally {
      setSaveLoading(false);
    }
  };

  const pinPost = async () => {
    handleClosePress();
    try {
      if (isPinned) {
        setIsPinned(false);
        await firestore()
          .collection('Network')
          .doc(postData?.network_id)
          .update({
            pinned_posts: firestore.FieldValue.arrayRemove(post_id),
          });
      } else {
        setIsPinned(true);
        await firestore()
          .collection('Network')
          .doc(postData?.network_id)
          .update({
            pinned_posts: firestore.FieldValue.arrayUnion(post_id),
          });
      }
    } catch (error) {
      console.warn(error);
    }
  };
  const navigateThroughBottomNetworks = () => {
    handleClosePress();
    navigation.navigate('Network', {
      networkId: postData.network_id,
    });
  };
  const onRepost = () => {
    handleClosePress();
    navigation.navigate('Repost', {
      post: postData,
      network_id: postData?.network_id,
      post_id: post_id,
    });
  };
  const navigateThroughBottomUser = () => {
    handleClosePress();
    navigation.navigate('UserProfile', {id: postData.posted_by});
  };

  const postAnalytics = () => {
    handleClosePress();
    navigation.navigate('PostAnalytics', {
      post_id: post_id,
    });
  };

  const onReport = () => {
    handleClosePress();
    navigation.navigate('Report', {
      post_id: post_id,
      network_id: postData?.network_id,
      networkDetails: networkDetails,
      postData: postData,
    });
  };

  const formatLargeNumber = num => {
    if (num >= 1e9) {
      return (num / 1e9).toFixed(1) + 'B';
    }
    if (num >= 1e6) {
      return (num / 1e6).toFixed(1) + 'M';
    }
    if (num >= 1e3) {
      return (num / 1e3).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const handlePollClick = async id => {
    try {
      if (votedId === id) {
        await firestore()
          .collection('Posts')
          .doc(post_id)
          .collection('Polls')
          .doc(id)
          .update({
            voterId: firestore.FieldValue.arrayRemove(auth().currentUser.uid),
          });
        setVotedId(null);
      } else {
        if (votedId) {
          await firestore()
            .collection('Posts')
            .doc(post_id)
            .collection('Polls')
            .doc(votedId)
            .update({
              voterId: firestore.FieldValue.arrayRemove(auth().currentUser.uid),
            });
        }

        await firestore()
          .collection('Posts')
          .doc(post_id)
          .collection('Polls')
          .doc(id)
          .update({
            voterId: firestore.FieldValue.arrayUnion(auth().currentUser.uid),
          });

        setVotedId(id);
      }
    } catch (error) {
      console.warn(error);
    }
  };

  const handleJoinNetwork = async () => {
    try {
      // Fetch current joined networks from AsyncStorage
      const currentJoinedNetworks =
        JSON.parse(await AsyncStorage.getItem('joinedNetworks')) || [];

      // Check if the user is already a member of the network
      if (currentJoinedNetworks.includes(postData.network_id)) {
        setIsMember(true); // Directly set as member
      } else {
        // If not, run the join network logic
        await joinNetwork(); // Call joinNetwork function to join the network
      }
    } catch (error) {
      console.error('Error checking joined networks:', error);
    }
  };

  const joinNetwork = async () => {
    try {
      setRequestLoading(true);

      // Update Firestore with the new member
      await firestore()
        .collection('Network')
        .doc(postData.network_id)
        .update({
          joined: firestore.FieldValue.increment(1),
        });

      await firestore()
        .collection('Network')
        .doc(postData.network_id)
        .collection('Members')
        .doc(auth().currentUser.uid)
        .set(
          {
            joined_at: firestore.FieldValue.serverTimestamp(),
          },
          {merge: true},
        );

      await firestore()
        .collection('Users')
        .doc(auth().currentUser.uid)
        .collection('JoinedNetworks')
        .doc(postData.network_id)
        .set(
          {
            joined_at: firestore.FieldValue.serverTimestamp(),
          },
          {merge: true},
        );

      // Update joinedNetworks in AsyncStorage
      const currentJoinedNetworks =
        JSON.parse(await AsyncStorage.getItem('joinedNetworks')) || [];
      if (!currentJoinedNetworks.includes(postData.network_id)) {
        currentJoinedNetworks.push(postData.network_id);
        await AsyncStorage.setItem(
          'joinedNetworks',
          JSON.stringify(currentJoinedNetworks),
        );
      }

      // Update Tribet with a join action
      await updateTribet(
        auth().currentUser.uid,
        30,
        `Joined ${networkDetails.network_name} network`,
      );

      // Send greeting message if needed
      if (
        networkDetails?.bots?.includes('PKGEuUczNm6Ebcp2fxVG') &&
        networkDetails.greetMessage
      ) {
        await firestore()
          .collection('Users')
          .doc(auth().currentUser.uid)
          .collection('Inbox')
          .add({
            message: networkDetails.greetMessage,
            createdAt: firestore.FieldValue.serverTimestamp(),
            sentBy: 'PKGEuUczNm6Ebcp2fxVG',
            network_id: postData.network_id,
            type: 'greet_message',
          });
        console.log('Greet Message sent!!');
      }

      setIsMember(true);
    } catch (error) {
      console.error('Error joining network:', error);
      setRequestLoading(false);
    }
  };

  const appreciate = async () => {
    try {
      setAppreciationLoading(true);
      const final = await updateTribet(
        postData.posted_by,
        tribetAmount,
        'Appreciation Post',
        true,
      );

      if (final) {
        setShowAppreciationModal(false);
        setConfirmationMessage(
          'Your Tribet Coins have been successfully transferred. Thank you for your appreciation!',
        );
        setShowConfirmation(true);
      } else {
        setShowAppreciationModal(false);
        setConfirmationMessage(
          'Insufficient Tribet Coins to complete the transaction. Please ensure you have enough balance to proceed.',
        );
        setShowConfirmation(true);
      }
    } catch (error) {
      console.warn(error);
    } finally {
      setAppreciationLoading(false);
    }
  };

  if (networkDetails.network_type === 'private' && !isMember) {
    return null;
  }

  if (
    userData?.blockedUsers?.includes(postData?.posted_by) ||
    userData?.blockedBy?.includes(postData?.posted_by)
  ) {
    console.log(
      'checking',
      userData?.blockedUsers?.includes(postData?.posted_by),
    );
    console.log('checking', userData?.blockedBy?.includes(postData?.posted_by));
    return null;
  }

  if (loading) {
    return (
      <SkeletonPlaceholder backgroundColor="black" highlightColor="#1a1a1a">
        <View style={styles.skeletonHeader}>
          <View style={styles.skeletonNetworkPic} />
          <View style={styles.skeletonUserInfo}>
            <View style={styles.skeletonNetworkName} />
            <View style={styles.skeletonUserName} />
          </View>
        </View>
        <View style={styles.skeletonImage} />
        <View style={styles.skeletonTitle} />
        <View style={styles.skeletonInfo} />
      </SkeletonPlaceholder>
    );
  }

  if (isToxic) {
    return (
      <View
        style={{
          flex: 1,
          padding: 10,
          backgroundColor: '#1a1a1a',
          margin: 10,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 5,
        }}>
        <Text style={{color: 'grey', textAlign: 'center', fontSize: 18}}>
          Post blocked by
        </Text>
        <Text
          style={{color: color, textAlign: 'center', fontSize: 18}}
          onPress={() =>
            navigation.push('BotScreen', {
              botId: 'kgSpt39Ip2vB2u6v3vIs',
            })
          }>
          {' '}
          GuardianBot
        </Text>
      </View>
    );
  }
  if (
    networkDetails &&
    networkDetails.bannedUsers &&
    networkDetails.bannedUsers.includes(auth().currentUser.uid)
  ) {
    return null;
  }

  if (!userData) {
    return (
      <View
        style={{
          flex: 1,
          padding: 10,
          backgroundColor: '#1a1a1a',
          margin: 10,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 5,
        }}>
        <Text style={{color: 'grey', textAlign: 'center', fontSize: 18}}>
          Author not available
        </Text>
      </View>
    );
  }

  if (!networkDetails) {
    return (
      <View
        style={{
          flex: 1,
          padding: 10,
          backgroundColor: '#1a1a1a',
          margin: 10,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 5,
        }}>
        <Text style={{color: 'grey', textAlign: 'center', fontSize: 18}}>
          Network not available
        </Text>
      </View>
    );
  }

  return (
    <SharedElement id={`item.${post_id}.post`}>
      <Pressable
        style={styles.container}
        ref={videoContainerRef}
        onPress={() =>
          navigation.navigate('PostExpand', {
            post_id: post_id,
            network_id: postData.network_id,
          })
        }
        onLongPress={handleSave}>
        {opac && (
          <View style={{backgroundColor: 'rgba(0, 0, 0, 0.2)', flex: 1}}></View>
        )}
        {postData && (
          <>
            <View style={styles.headerContainer}>
              <Pressable
                onPress={() =>
                  !isSub
                    ? navigation.navigate('Network', {
                        networkId: postData.network_id,
                      })
                    : navigation.navigate('PostExpand', {
                        post_id: post_id,
                        network_id: postData.network_id,
                      })
                }>
                <Image
                  source={{uri: networkDetails.profile_pic}}
                  style={styles.networkPic}
                />
              </Pressable>
              <View style={styles.networkUserInfo}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    gap: 10,
                  }}>
                  <View>
                    <Text
                      style={styles.networkName}
                      onPress={() =>
                        !isSub
                          ? navigation.navigate('Network', {
                              networkId: postData.network_id,
                            })
                          : navigation.navigate('PostExpand', {
                              post_id: post_id,
                              network_id: postData.network_id,
                            })
                      }
                      numberOfLines={1}
                      ellipsizeMode="tail">
                      {postData.network_name || 'Unknown Network'}
                    </Text>
                    <Text
                      style={styles.userName}
                      onPress={() =>
                        !isSub
                          ? navigation.navigate('UserProfile', {
                              id: postData.posted_by,
                            })
                          : navigation.navigate('PostExpand', {
                              post_id: post_id,
                              network_id: postData.network_id,
                            })
                      }>
                      {authorDetails?.name || 'Unknown User'}
                    </Text>
                  </View>
                  {isMember ? null : (
                    <Pressable
                      disabled={requestLoading}
                      onPress={handleJoinNetwork}
                      style={{
                        paddingHorizontal: 20,
                        backgroundColor: '#1a1a1a',
                        marginLeft: 10,
                      }}>
                      {requestLoading ? (
                        <ActivityIndicator size={'small'} color={'white'} />
                      ) : (
                        <Icon name="link" size={25} color="white" />
                      )}
                    </Pressable>
                  )}
                </View>
                <View style={{flexDirection: 'row', gap: 4}}>
                  <Text style={styles.postedAgo}>
                    {timeAgo(postData.createdAt) || ''}
                  </Text>
                  {!isSub ? (
                    <Icon
                      name={'ellipsis-vertical'}
                      size={22}
                      color={color}
                      onPress={handlePresentModalPress}
                      style={{marginRight: 10}}
                    />
                  ) : null}
                </View>
              </View>
            </View>
            {postData.imageUrls && (
              <View>
                <ImageCollage
                  imageUrls={postData.imageUrls}
                  isSensitive={postData.isSensitive}
                  currentUserDetails={userData}
                />
              </View>
            )}
            {postData.videoUrl && (
              <VideoComponent
                videoUri={postData.videoUrl}
                network_pic={networkPic}
                network_name={postData.network_name}
                network_id={postData.network_id}
                information={postData.information}
                currentUserDetails={userData}
                isSensitive={postData.isSensitive}
              />
            )}
            <Bluing
              text={
                Array.isArray(postData?.title)
                  ? concatString(postData.title)
                  : ''
              }
              style={styles.title}
            />
            <Bluing
              text={
                Array.isArray(postData?.information)
                  ? concatString(postData.information)
                  : ''
              }
              style={styles.info}
            />

            <View
              style={{
                flexDirection: 'row',
                gap: 5,
                flexWrap: 'wrap',
                marginTop: 3,
              }}>
              {postData?.selectedSubtopics.map((subtopic, index) => (
                <Pressable
                  key={index}
                  style={styles.subtopicBox}
                  onPress={() =>
                    !isSub
                      ? navigation.navigate('Network', {
                          networkId: postData.network_id,
                          subtopic: subtopic,
                        })
                      : navigation.navigate('PostExpand', {
                          post_id: post_id,
                          network_id: postData.network_id,
                        })
                  }>
                  <Text style={styles.subtopicText}>{subtopic || ' '}</Text>
                </Pressable>
              ))}
            </View>
            {postData.repost_post_id && (
              <View
                style={{
                  width: '98%',
                  alignSelf: 'flex-start',
                  borderColor: '#1a1a1a',
                  borderWidth: 1,
                  borderRadius: 3,
                }}>
                <Post post_id={postData.repost_post_id} isSub={true} />
              </View>
            )}
            {postData.isPollPost && (
              <ScrollView>
                {polls.map(poll => {
                  const totalVotes = polls.reduce(
                    (acc, p) => acc + (p.voterId?.length || 0),
                    0,
                  );
                  const pollVotes = poll.voterId?.length || 0;
                  const percentage = totalVotes
                    ? (pollVotes / totalVotes) * 100
                    : 0;

                  return (
                    <View key={poll.id} style={{marginBottom: 10}}>
                      <Pressable
                        style={{
                          padding: 10,
                          backgroundColor:
                            votedId === poll.id ? color : '#1a1a1a',
                          borderRadius: 5,
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                        }}
                        onPress={() => handlePollClick(poll.id)}>
                        <Text style={{color: 'white', fontSize: 14}}>
                          {poll.poll_name}
                        </Text>
                        <Text style={{color: 'white'}}>{pollVotes}</Text>
                      </Pressable>
                      <View
                        style={{
                          height: 10,
                          backgroundColor: '#1a1a1a',
                          borderRadius: 5,
                          overflow: 'hidden',
                          marginTop: 5,
                        }}>
                        <View
                          style={{
                            width: `${percentage}%`,
                            height: '100%',
                            backgroundColor: color,
                          }}
                        />
                      </View>
                      <Text
                        style={{
                          color: 'grey',
                          fontSize: 12,
                          marginTop: 5,
                          textAlign: 'right',
                        }}>
                        {percentage.toFixed(1)}%
                      </Text>
                    </View>
                  );
                })}
              </ScrollView>
            )}

            {postData.takeResponses && (
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  marginTop: 10,
                }}>
                <Pressable
                  style={{
                    backgroundColor: '#1a1a1a',
                    padding: 12,
                    borderRadius: 8,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width:
                      (postData.posted_by || networkDetails.admin) ===
                      auth().currentUser.uid
                        ? '80%'
                        : '100%',
                    shadowColor: '#000',
                    shadowOffset: {width: 0, height: 2},
                    shadowOpacity: 0.3,
                    shadowRadius: 4,
                    elevation: 5,
                  }}
                  onPress={() =>
                    isSub
                      ? navigation.navigate('PostExpand', {
                          post_id: post_id,
                          network_id: postData.network_id,
                        })
                      : navigation.navigate('AddResponse', {
                          post_id: post_id,
                        })
                  }>
                  <Text
                    style={{
                      color: '#f5f5f5',
                      fontSize: 16,
                      fontWeight: '500',
                      marginRight: 5,
                    }}>
                    Add Response
                  </Text>
                  <Icon name={'add'} color={'#9e9e9e'} size={22} />
                </Pressable>
                {(postData.posted_by || networkDetails.admin) ===
                  auth().currentUser.uid && (
                  <Pressable
                    style={{
                      backgroundColor: '#1a1a1a',
                      padding: 10,
                      borderRadius: 8,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '17%',
                      shadowColor: '#000',
                      shadowOffset: {width: 0, height: 2},
                      shadowOpacity: 0.3,
                      shadowRadius: 4,
                      elevation: 5,
                    }}
                    onPress={() =>
                      !isSub
                        ? navigation.navigate('Responses', {
                            post_id: post_id,
                            title: postData.title,
                            network_id: postData.network_id,
                          })
                        : navigation.navigate('PostExpand', {
                            post_id: post_id,
                            network_id: postData.network_id,
                          })
                    }>
                    <Icon name={'menu'} color={'#9e9e9e'} size={22} />
                  </Pressable>
                )}
              </View>
            )}
            {postData.links && postData.links.length > 0 && (
              <View>
                {postData.links.slice(0, 1).map((link, index) => (
                  <Pressable
                    key={index}
                    onPress={() => {
                      let url = link;

                      if (
                        !url.startsWith('http://') &&
                        !url.startsWith('https://')
                      ) {
                        url = `https://${url}`;
                      }

                      if (!isSub) {
                        if (userData.openInDefaultBrowser) {
                          Linking.openURL(url).catch(err => {
                            console.error('Failed to open URL:', err);
                            Alert.alert(
                              'Error',
                              'Could not open the URL. Please try again.',
                            );
                          });
                        } else {
                          navigation.navigate('Web', {url});
                        }
                      } else {
                        navigation.navigate('PostExpand', {
                          post_id,
                          network_id: postData.network_id,
                        });
                      }
                    }}
                    style={{
                      marginBottom: 5,
                      backgroundColor: '#1a1a1a',
                      padding: 8,
                      borderRadius: 6,
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                    }}>
                    <Text
                      style={{
                        color: color,
                        maxWidth: '90%',
                      }}
                      numberOfLines={3}
                      ellipseMode="tail">
                      {link}
                    </Text>
                    <Icon name={'open-outline'} size={27} color={color} />
                  </Pressable>
                ))}

                {postData.links.length > 1 && (
                  <Pressable
                    onPress={() =>
                      navigation.navigate('LinkExpand', {
                        links: postData.links,
                        userData: userData,
                      })
                    }
                    style={{
                      marginTop: 5,
                      backgroundColor: '#1a1a1a',
                      padding: 8,
                      borderRadius: 6,
                      flexDirection: 'row',
                      justifyContent: 'center',
                    }}>
                    <Text style={{color: color, fontWeight: 'bold'}}>
                      Show {postData.links.length - 1} more links
                    </Text>
                  </Pressable>
                )}
              </View>
            )}

            {!isSub && (
              <ScrollView
                style={{flexDirection: 'row', gap: 10}}
                horizontal
                showsHorizontalScrollIndicator={false}>
                {postData.users &&
                  postData.users.length > 0 &&
                  postData.users.map((id, index) => (
                    <User key={index} id={id} />
                  ))}
              </ScrollView>
            )}
            {!isSub ? (
              <View
                style={{
                  backgroundColor: '#1a1a1a',
                  padding: 3,
                  borderRadius: 5,
                  flexDirection: 'row',
                  width: '100%',
                  gap: 15,
                  alignItems: 'center',
                  justifyContent: userData.isLeftHand
                    ? 'flex-start'
                    : 'flex-end',
                  marginTop: 8,
                }}>
                {userData.isLeftHand && (
                  <Pressable
                    style={{
                      marginLeft: userData.isLeftHand ? 0 : 10,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 3,
                    }}
                    onPress={handleLike}>
                    <Animated.View style={{transform: [{scale: animation}]}}>
                      <Icon
                        name={
                          liked
                            ? 'arrow-up-circle-sharp'
                            : 'arrow-up-circle-outline'
                        }
                        size={34}
                        color={color}
                      />
                    </Animated.View>
                    <Text style={{color: 'white', fontSize: 16}}>
                      {likeCount}
                    </Text>
                  </Pressable>
                )}

                <Pressable style={{marginRight: 10}} onPress={handleSave}>
                  <Icon
                    name={saved ? 'bookmark' : 'bookmark-outline'}
                    size={28}
                    color={color}
                  />
                </Pressable>
                {postData.posted_by === auth().currentUser.uid ? null : (
                  <Pressable onPress={() => setShowAppreciationModal(true)}>
                    <Icon name={'gift'} size={28} color={color} />
                  </Pressable>
                )}
                {!userData.isLeftHand && (
                  <Pressable
                    style={{
                      marginLeft: userData.isLeftHand ? 0 : 10,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 3,
                    }}
                    onPress={handleLike}>
                    <Text style={{color: 'white', fontSize: 16}}>
                      {likeCount || ' '}
                    </Text>
                    <Animated.View style={{transform: [{scale: animation}]}}>
                      <Icon
                        name={
                          liked
                            ? 'arrow-up-circle-sharp'
                            : 'arrow-up-circle-outline'
                        }
                        size={34}
                        color={color}
                      />
                    </Animated.View>
                  </Pressable>
                )}
              </View>
            ) : null}

            <Modal
              visible={showDeleteModal}
              transparent={true}
              animationType="slide">
              <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>Delete Post</Text>
                  <Text style={styles.modalText}>
                    Are you sure you want to delete this post?
                  </Text>
                  <View style={styles.modalButtons}>
                    <Pressable
                      style={[styles.modalButton, styles.cancelButton]}
                      onPress={cancelDelete}>
                      <Text style={styles.buttonText}>Cancel</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.modalButton, styles.deleteButton]}
                      onPress={confirmDelete}>
                      <Text style={[styles.buttonText, {color: 'white'}]}>
                        Delete
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            </Modal>
            <BottomSheetModal
              ref={bottomSheetModalRef}
              index={0}
              snapPoints={snapPoints}
              enablePanDownToClose
              handleStyle={{backgroundColor: '#404040', zIndex: 100}}
              handleIndicatorStyle={{backgroundColor: 'grey'}}>
              <BottomSheetView style={{backgroundColor: '#404040', flex: 1}}>
                <Pressable
                  onPress={navigateThroughBottomNetworks}
                  style={{
                    flexDirection: 'row',
                    padding: 15,
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                  <Text style={{color: 'white'}}>View Network</Text>
                </Pressable>
                <Pressable
                  onPress={navigateThroughBottomUser}
                  style={{
                    flexDirection: 'row',
                    padding: 15,
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                  <Text style={{color: 'white'}}>View User</Text>
                </Pressable>
                {(postData.posted_by === auth().currentUser.uid ||
                  networkDetails.admin === auth().currentUser.uid) && (
                  <Pressable
                    onPress={postAnalytics}
                    style={{
                      flexDirection: 'row',
                      padding: 15,
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}>
                    <Text style={{color: 'red'}}>View Post Analytics</Text>
                    <Icon name={'analytics'} size={26} color="red" />
                  </Pressable>
                )}
                <Pressable
                  style={{
                    flexDirection: 'row',
                    padding: 15,
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                  onPress={onReport}>
                  <Text style={{color: 'red'}}>Report</Text>
                  <Icon name={'warning'} size={26} color="red" />
                </Pressable>
                {(postData.posted_by === auth().currentUser.uid ||
                  networkDetails.admin === auth().currentUser.uid) && (
                  <Pressable
                    onPress={handleDelete}
                    style={{
                      flexDirection: 'row',
                      padding: 15,
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}>
                    <Text style={{color: 'red'}}>Delete Post</Text>
                    <Icon name={'trash-outline'} size={26} color="red" />
                  </Pressable>
                )}
                <Pressable
                  onPress={handleLike}
                  style={{
                    flexDirection: 'row',
                    padding: 15,
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                  <Text style={{color: liked ? color : 'white'}}>
                    {liked ? 'Dislike' : 'Like'}
                  </Text>
                  <Animated.View style={{transform: [{scale: animation}]}}>
                    <Icon
                      name={
                        liked
                          ? 'arrow-up-circle-sharp'
                          : 'arrow-up-circle-outline'
                      }
                      size={26}
                      color={color}
                    />
                  </Animated.View>
                </Pressable>
                <Pressable
                  onPress={handleSave}
                  style={{
                    flexDirection: 'row',
                    padding: 15,
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                  <Text style={{color: 'white'}}>Save</Text>
                  <Icon
                    name={saved ? 'bookmark' : 'bookmark-outline'}
                    size={30}
                    color="white"
                  />
                </Pressable>
                {!postData.isRepost &&
                  networkDetails.network_type !== 'private' && (
                    <Pressable
                      style={{
                        flexDirection: 'row',
                        padding: 15,
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                      onPress={onRepost}>
                      <Text style={{color: 'white'}}>Repost</Text>
                      <Icon name="git-branch" size={29} color="white" />
                    </Pressable>
                  )}
                {networkDetails.admin === auth().currentUser.uid && (
                  <Pressable
                    style={{
                      flexDirection: 'row',
                      padding: 15,
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                    onPress={pinPost}>
                    <Text style={{color: isPinned ? color : 'white'}}>
                      {isPinned ? 'Unpin Post' : 'Pin Post'}
                    </Text>
                    <Icon
                      name={'pin'}
                      size={29}
                      color={isPinned ? color : 'white'}
                    />
                  </Pressable>
                )}
                <Pressable
                  onPress={handleClosePress}
                  style={{
                    flexDirection: 'row',
                    padding: 15,
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                  <Text style={{color: 'white'}}>Cancel</Text>
                  <Icon
                    name={'arrow-down-circle-sharp'}
                    size={26}
                    color="white"
                  />
                </Pressable>
              </BottomSheetView>
            </BottomSheetModal>
          </>
        )}
        <Modal
          transparent={true}
          visible={showAppreciationModal}
          animationType="slide"
          onRequestClose={() => setShowAppreciationModal(false)}>
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
            }}>
            <View
              style={{
                backgroundColor: 'black',
                padding: 20,
                borderRadius: 10,
                width: '90%',
                alignItems: 'center',
              }}>
              <Icon name={'gift'} size={60} color={color} />
              <Text
                style={{
                  color: 'white',
                  fontSize: 15,
                  textAlign: 'center',
                  marginTop: 10,
                }}>
                Show your appreciation to the author of this post by
                transferring Tribet coins
              </Text>
              <TextInput
                style={{
                  backgroundColor: '#1a1a1a',
                  width: '90%',
                  marginTop: 15,
                  color: 'black',
                  borderRadius: 5,
                  paddingLeft: 10,
                  color: 'white',
                }}
                value={tribetAmount}
                onChangeText={input => setTribetAmount(input)}
                placeholder="Enter Tribet amount"
                placeholderTextColor={'grey'}
                keyboardType="numeric"
              />
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-evenly',
                  width: '100%',
                  marginTop: 10,
                }}>
                <Pressable
                  style={{
                    width: '48%',
                    backgroundColor: color,
                    padding: 10,
                    borderRadius: 5,
                    alignItems: 'center',
                    opacity: tribetAmount ? 1 : 0.5,
                  }}
                  disabled={!tribetAmount}
                  onPress={appreciate}>
                  {appreciationLoading ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <Text style={{color: 'white'}}>Transfer Tribet</Text>
                  )}
                </Pressable>
                <Pressable
                  style={{
                    width: '48%',
                    backgroundColor: '#1a1a1a',
                    padding: 10,
                    borderRadius: 5,
                    alignItems: 'center',
                  }}
                  onPress={() => setShowAppreciationModal(false)}>
                  <Text style={{color: 'white'}}>Cancel</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
        <Modal
          transparent={true}
          visible={showConfirmation}
          animationType="slide"
          onRequestClose={() => setShowConfirmation(false)}>
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
            }}>
            <View
              style={{
                backgroundColor: 'black',
                padding: 20,
                borderRadius: 10,
                width: '90%',
                alignItems: 'center',
              }}>
              <Text
                style={{
                  color: 'white',
                  fontSize: 16,
                  textAlign: 'center',
                  marginTop: 10,
                }}>
                {confirmationMessage}
              </Text>
              <Pressable
                style={{
                  backgroundColor: '#1a1a1a',
                  width: '90%',
                  padding: 15,
                  borderRadius: 5,
                  alignItems: 'center',
                  marginTop: 10,
                }}
                onPress={() => setShowConfirmation(false)}>
                <Text style={{color: 'white'}}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </Pressable>
    </SharedElement>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 8,
    backgroundColor: 'black',
    borderRadius: 3,
    marginTop: 2,
    width: '100%',
    borderRadius: 3,
    flex: 1,
    borderRadius: 5,
  },
  contentContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  networkPic: {
    width: 40,
    height: 40,
    borderRadius: 25,
    marginRight: 12,
  },
  networkUserInfo: {
    flex: 1,
    justifyContent: 'space-between',
    flexDirection: 'row',
  },
  networkName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'black',
    maxWidth: '70%',
  },
  userName: {
    fontSize: 14,
    color: 'gray',
  },
  info: {
    fontSize: 16,
    color: 'black',
  },
  subtopicsContainer: {
    marginTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  subtopicBox: {
    backgroundColor: '#1a1a1a',
    paddingVertical: 2,
    paddingHorizontal: 5,
    borderRadius: 2,
    paddingLeft: 3,
  },
  subtopicText: {
    fontSize: 14,
    color: 'white',
  },
  imageCollage: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  collageImage: {
    width: '48%',
    height: 100,
    marginBottom: 4,
  },
  moreImagesOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreImagesText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  singleImage: {
    width: '100%',
    height: 300,
    marginBottom: 4,
  },
  deleteAnimation: {
    height: 30,
    width: 30,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageSlider: {
    width: '100%',
    height: 300,
  },
  userContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 3,
  },
  username: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    color: 'black',
  },
  email: {
    fontSize: 16,
    color: color,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
  modalContent: {
    backgroundColor: 'black',
    padding: 20,
    borderRadius: 10,
    width: '90%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: 'green',
  },
  modalText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    color: 'white',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginHorizontal: 10,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'white',
  },
  deleteButton: {
    backgroundColor: color,
  },
  buttonText: {
    fontSize: 16,
    color: 'black',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  networkPic: {
    width: 45,
    height: 45,
    borderRadius: 25,
    marginRight: 8,
  },
  networkUserInfo: {
    flex: 1,
    justifyContent: 'space-between',
    flexDirection: 'row',
  },
  networkName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  userName: {
    fontSize: 14,
    color: 'gray',
  },
  postedAgo: {
    color: 'grey',
  },
  title: {
    fontSize: 17,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 8,
  },
  seenTitle: {
    fontSize: 19,
    fontWeight: 'bold',
    color: 'grey',
    marginTop: 8,
  },
  info: {
    fontSize: 17,
    color: 'white',
  },
  seenInfo: {
    fontSize: 16,
    color: 'grey',
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 8,
  },
  subtopicsContainer: {
    marginTop: 5,
    flexDirection: 'row',
    gap: 10,
  },
  subtopicsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: 'black',
  },
  subtopicBox: {
    backgroundColor: '#1a1a1a',
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginBottom: 6,
  },
  subtopicText: {
    fontSize: 14,
    color: 'white',
  },
  userContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 3,
  },
  username: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    color: 'black',
  },
  email: {
    fontSize: 16,
    color: color,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalContent: {
    backgroundColor: 'black',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: 'white',
  },
  modalText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    color: 'white',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginHorizontal: 10,
    alignItems: 'center',
    width: '45%',
  },
  cancelButton: {
    backgroundColor: '#1a1a1a',
  },
  deleteButton: {
    backgroundColor: color,
  },
  buttonText: {
    fontSize: 16,
    color: 'white',
  },
  imageCollage: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  collageImage: {
    width: '48%',
    height: 50,
    marginBottom: 4,
  },
  moreImagesOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreImagesText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  singleImage: {
    width: '100%',
    height: 50,
    marginBottom: 4,
  },
  skeletonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  skeletonNetworkPic: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  skeletonUserInfo: {
    flex: 1,
  },
  skeletonNetworkName: {
    width: 100,
    height: 20,
    borderRadius: 4,
    marginBottom: 6,
  },
  skeletonUserName: {
    width: 60,
    height: 15,
    borderRadius: 4,
  },
  skeletonImage: {
    width: '100%',
    height: 150,
    borderRadius: 10,
    marginVertical: 10,
  },
  skeletonTitle: {
    width: '60%',
    height: 20,
    borderRadius: 4,
    marginVertical: 6,
    marginLeft: 10,
  },
  skeletonInfo: {
    width: '80%',
    height: 15,
    borderRadius: 4,
    marginLeft: 10,
  },
});
