import React, {useState, useEffect, useRef, useMemo, useCallback} from 'react';
import {
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Pressable,
  Modal,
  Animated,
  PanResponder,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import {launchImageLibrary, launchCamera} from 'react-native-image-picker';
import storage from '@react-native-firebase/storage';
import {SHA256} from 'crypto-js';
import moment from 'moment';
import {messagingRef, firestoreRef, authRef} from './firebase';
import {
  FlingGestureHandler,
  Directions,
  State,
} from 'react-native-gesture-handler';
import {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetModalProvider,
  BottomSheetBackdrop,
} from '@gorhom/bottom-sheet';
import Post from './Post';
import Video from 'react-native-video';
import {Swipeable} from 'react-native-gesture-handler';
import {useNavigation} from '@react-navigation/native';
import Bluing from '../texting/Bluing';
import ChatEmpty from './ChatEmpty';
import color from './color';
import {SharedElement} from 'react-navigation-shared-element';

export default function ChatScreen({route}) {
  const navigation = useNavigation();
  const {id} = route.params;
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [chatroomid, setChatroomid] = useState('');
  const currentUserUid = auth().currentUser.uid;
  const [imageUri, setImageUri] = useState('');
  const [sent, setSent] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [loadingUserDetails, setLoadingUserDetails] = useState(true);
  const [pinning, setPinning] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [sending, setSending] = useState(false);
  const [networkProfilePics, setNetworkProfilePics] = useState({});
  const [videoUri, setVideoUri] = useState('');
  const [reply, setReply] = useState(null);
  const bottomSheetModalRef = useRef(null);
  const [paused, setPaused] = useState(true);
  const [myPic, setMyPic] = useState();
  const [myName, setMyName] = useState();
  const videoRef = useRef(null);
  const [lastSeen, setLastSeen] = useState();
  const sendPushNotification = require('../../sendNotification');

  useEffect(() => {
    const generateChatRoomId = () => {
      if (id && currentUserUid) {
        const sortedUids = [id, currentUserUid].sort();
        const concatenatedIds = sortedUids.join('');
        const generatedHash = SHA256(concatenatedIds).toString();
        setChatroomid(generatedHash);
        console.log('chatrokm', chatroomid);
      }
    };

    generateChatRoomId();
  }, [id, currentUserUid]);

  const [lastVisible, setLastVisible] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (!chatroomid || !id) return;

    const unsubscribe = firestore()
      .collection('ChatRooms')
      .doc(chatroomid)
      .collection('Members')
      .doc(id)
      .onSnapshot(
        doc => {
          if (doc.exists) {
            setLastSeen(doc.data().lastSeen);
          } else {
            console.warn('Document does not exist');
          }
        },
        error => {
          console.warn('Error fetching lastSeen:', error);
        },
      );

    return () => unsubscribe();
  }, [messages, id, chatroomid, navigation]);

  useEffect(() => {
    const fetchPic = async () => {
      const data = await firestore()
        .collection('Users')
        .doc(auth().currentUser.uid)
        .get();
      setMyPic(data.data().profile_pic);
      setMyName(data.data().name);
    };
    fetchPic();
  }, []);

  const togglePlayPause = () => {
    setPaused(!paused);
  };

  const handleVideoEnd = () => {
    setPaused(true);
  };

  const snapPoints = useMemo(() => ['50%'], []);

  const handlePresentModalPress = useCallback(() => {
    bottomSheetModalRef.current?.present();
  }, []);
  const handleClosePress = () => bottomSheetModalRef.current?.close();
  const handleSheetChanges = useCallback(index => {
    console.log('handleSheetChanges', index);
  }, []);

  const fetchNetworkPic = async networkId => {
    try {
      const data = await firestore().collection('Network').doc(networkId).get();
      return data.data().profile_pic;
    } catch (error) {
      console.warn(error);
      return null;
    }
  };

  useEffect(() => {
    const fetchProfilePics = async () => {
      const networkIds = messages
        .filter(message => message.type === 'network')
        .map(message => message.network_id);

      const uniqueNetworkIds = [...new Set(networkIds)];

      const profilePics = {};

      for (const networkId of uniqueNetworkIds) {
        profilePics[networkId] = await fetchNetworkPic(networkId);
      }

      setNetworkProfilePics(profilePics);
    };

    if (messages.length > 0) {
      fetchProfilePics();
    }
  }, [messages]);

  useEffect(() => {
    const fetchData = async () => {
      setLoadingUserDetails(true);
      try {
        const userDoc = await firestore().collection('Users').doc(id).get();
        if (userDoc.exists) {
          setUserDetails(userDoc.data());
        } else {
          console.log('No such document!');
        }
      } catch (error) {
        console.error('Error fetching user data: ', error);
      }
      setLoadingUserDetails(false);
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (chatroomid) {
      const unsubscribe = firestore()
        .collection('ChatRooms')
        .doc(chatroomid)
        .collection('Messages')
        .orderBy('createdAt', 'desc')
        .limit(20)
        .onSnapshot(snapshot => {
          const newMessages = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          }));

          if (newMessages.length > 0) {
            setMessages(prevMessages => {
              const existingIds = prevMessages.map(msg => msg.id);
              const filteredNewMessages = newMessages.filter(
                msg => !existingIds.includes(msg.id),
              );
              return [...filteredNewMessages, ...prevMessages];
            });
          }
        });

      return () => unsubscribe();
    }
  }, [chatroomid]);

  const fetchMessages = async (loadMore = false) => {
    if (loading || !chatroomid) return;

    setLoading(true);

    let query = firestore()
      .collection('ChatRooms')
      .doc(chatroomid)
      .collection('Messages')
      .orderBy('createdAt', 'desc')
      .limit(20);

    if (loadMore && lastVisible) {
      query = query.startAfter(lastVisible);
    }

    const snapshot = await query.get();

    if (!snapshot.empty) {
      const newMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      setMessages(prevMessages =>
        loadMore ? [...prevMessages, ...newMessages] : newMessages,
      );

      setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
    } else {
      setHasMore(false);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchMessages();
  }, [chatroomid]);

  useEffect(() => {
    const checkPinnedStatus = async () => {
      try {
        const pinDoc = await firestore()
          .collection('Users')
          .doc(currentUserUid)
          .collection('ChatRooms')
          .doc(chatroomid)
          .get();

        setIsPinned(pinDoc.exists);
      } catch (error) {
        console.error('Error checking pinned status:', error);
      }
    };

    if (chatroomid) {
      checkPinnedStatus();
    }
  }, [chatroomid, currentUserUid]);

  const updateLastSeen = async () => {
    try {
      await firestore()
        .collection('ChatRooms')
        .doc(chatroomid)
        .collection('Members')
        .doc(auth().currentUser.uid)
        .set(
          {
            lastSeen: firestore.FieldValue.serverTimestamp(),
          },
          {merge: true},
        );
    } catch (error) {
      console.warn('Error updating last seen:', error);
    }
  };

  useEffect(() => {
    if (chatroomid) {
      const unsubscribe = firestore()
        .collection('ChatRooms')
        .doc(chatroomid)
        .collection('Messages')
        .onSnapshot(snapshot => {
          if (!snapshot.metadata.hasPendingWrites) {
            updateLastSeen();
          }
        });

      return () => unsubscribe();
    }
  }, [chatroomid, id, navigation, messages.length]);

  const pinChat = async () => {
    setPinning(true);
    try {
      await firestore()
        .collection('Users')
        .doc(auth().currentUser.uid)
        .collection('ChatRooms')
        .doc(chatroomid)
        .set({userId: id});
      await firestore()
        .collection('Users')
        .doc(id)
        .collection('ChatRooms')
        .doc(chatroomid)
        .set({userId: auth().currentUser.uid});
      console.log('Chat Pinned');
    } catch (error) {
      console.warn('Error pinning chat:', error);
    }
  };

  const handleSend = async () => {
    if (message.trim() === '' && !imageUri && !videoUri) return;

    setSending(true);
    console.log("UserDetails", userDetails)
    sendPushNotification(myName, userDetails.fcmToken, message, {
      id: auth().currentUser.uid,
      type: "CHAT_MESSAGE"
    });

    const newMessage = {
      text: message,
      createdAt: firestore.FieldValue.serverTimestamp(),
      senderId: currentUserUid,
    };

    try {
      setImageUri('');
      setVideoUri('');
      setMessage('');
      const chatroomDocRef = firestore()
        .collection('ChatRooms')
        .doc(chatroomid);
      const chatroomSnapshot = await chatroomDocRef
        .collection('Messages')
        .get();
      const messages = chatroomSnapshot.docs;
      const messagesCount = messages.length;

      if (messagesCount === 0) {
        await pinChat();
      }

      if (imageUri) {
        const filename = imageUri.substring(imageUri.lastIndexOf('/') + 1);
        const uploadUri =
          Platform.OS === 'ios' ? imageUri.replace('file://', '') : imageUri;
        const storageRef = storage().ref(`images/${filename}`);
        await storageRef.putFile(uploadUri);
        newMessage.image = await storageRef.getDownloadURL();
      }

      if (videoUri) {
        const filename = videoUri.substring(videoUri.lastIndexOf('/') + 1);
        const uploadUri =
          Platform.OS === 'ios' ? videoUri.replace('file://', '') : videoUri;
        const storageRef = storage().ref(`videos/${filename}`);
        await storageRef.putFile(uploadUri);
        newMessage.video = await storageRef.getDownloadURL();
      }

      let lastMessageText = '';

      if (newMessage.text) {
        lastMessageText = newMessage.text;
      } else if (newMessage.image) {
        lastMessageText = 'Image File';
      } else if (newMessage.video) {
        lastMessageText = 'Video file';
      } else if (newMessage.replyPost) {
        lastMessageText = 'Post';
      }

      try {
        await firestore()
          .collection('Users')
          .doc(auth().currentUser.uid)
          .collection('ChatRooms')
          .doc(chatroomid)
          .update({
            lastMessageText,
            gaingOrderTimeStamp: firestore.FieldValue.serverTimestamp(),
          });
      } catch (error) {
        console.warn(error);
      }
      try {
        await firestore()
          .collection('Users')
          .doc(id)
          .collection('ChatRooms')
          .doc(chatroomid)
          .update({
            lastMessageText,
            gaingOrderTimeStamp: firestore.FieldValue.serverTimestamp(),
          });
      } catch (error) {
        console.warn(error);
      }

      await chatroomDocRef.set({
        lastMessageText,
        lastMessageTimestamp: firestore.FieldValue.serverTimestamp(),
      });

      if (reply) {
        if (reply.text) {
          newMessage.replyText = reply.text;
        } else if (reply.image) {
          newMessage.replyImage = reply.image;
        } else if (reply.video) {
          newMessage.replyVideo = reply.video;
        } else if (reply.type === 'post_share') {
          newMessage.replyPost = [reply.post_id, reply.network_id];
        } else if (reply.network_name) {
          newMessage.replyNetwork = reply.network_name;
          newMessage.replyNetworkId = reply.network_id;
        }
        newMessage.replyingTo = id;
      }

      await chatroomDocRef.collection('Messages').add(newMessage);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setSending(false);
      setSent(true);
      setReply(null);
    }
  };

  const handleMediaPicker = async () => {
    handleClosePress();
    launchImageLibrary({mediaType: 'mixed'}, response => {
      if (response.assets && response.assets.length > 0) {
        const asset = response.assets[0];
        if (asset.type.startsWith('image/')) {
          setImageUri(asset.uri);
        } else if (asset.type.startsWith('video/')) {
          setVideoUri(asset.uri);
        }
      }
    });
  };
  const handleLongPress = message => {
    setSelectedMessage(message);
    setModalVisible(true);
  };
  const takePhoto = async () => {
    handleClosePress();
    const options = {
      mediaType: 'photo',
      includeBase64: false,
      maxHeight: 200,
      maxWidth: 200,
    };

    launchCamera(options, response => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.error) {
        console.log('ImagePicker Error: ', response.error);
      } else if (response.customButton) {
        console.log('User tapped custom button: ', response.customButton);
      } else {
        const source = {uri: response.assets[0].uri};
        setImageUri(source.uri);
      }
    });
  };

  const onCancel = () => {
    setImageUri('');
    setVideoUri('');
  };
  const deleteMessage = async () => {
    if (selectedMessage) {
      try {
        await firestore()
          .collection('ChatRooms')
          .doc(chatroomid)
          .collection('Messages')
          .doc(selectedMessage.id)
          .delete();
        console.log('Message deleted');
      } catch (error) {
        console.error('Error deleting message:', error);
      } finally {
        const chatroomDocRef = firestore()
          .collection('ChatRooms')
          .doc(chatroomid);

        await firestore()
          .collection('Users')
          .doc(auth().currentUser.uid)
          .collection('ChatRooms')
          .doc(chatroomid)
          .update({
            lastMessageText: `${myName} has deleted a message`,
          });

        await chatroomDocRef.set({
          lastMessageText: `${myName} has deleted a message`,
        });
      }
      setSelectedMessage(null);
      setModalVisible(false);
    }
  };

  const renderMessageItem = ({item, isReply}) => {
    const isCurrentUser = item.senderId === currentUserUid;
    const translateX = new Animated.Value(0);

    const handleReply = message => {
      console.log('Replying to:', message);
      setReply(message);
      resetPosition();
    };

    const resetPosition = () => {
      Animated.timing(translateX, {
        toValue: 0,
        duration: 900,
        useNativeDriver: true,
      }).start();
    };

    const onFling = ({nativeEvent}) => {
      if (nativeEvent.state === State.END) {
        Animated.timing(translateX, {
          toValue: isCurrentUser ? -100 : 100,
          duration: 50,
          useNativeDriver: true,
        }).start(() => handleReply(item));
      }
    };

    const ReplyContent = () => {
      if (item.replyingTo) {
        if (item.replyImage) {
          return (
            <Pressable
              onPress={() =>
                navigation.navigate('ImageExpand', {images: item.replyImage})
              }>
              <Image
                source={{uri: item.replyImage}}
                style={{height: 80, width: 80, opacity: 0.6}}
              />
            </Pressable>
          );
        }
        if (item.replyVideo) {
          return (
            <Pressable
              onPress={() =>
                navigation.navigate('VideoExpand', {videoUri: item.replyVideo})
              }>
              <Video
                source={{uri: item.replyVideo}}
                style={{height: 80, width: 80, opacity: 0.6}}
                resizeMode="cover"
                controls={false}
                muted={false}
                pictureInPicture={true}
                paused={true}
                selectedVideoTrack={{
                  type: 'resolution',
                  value: 720,
                }}
              />
              <View style={{position: 'absolute', right: 5, bottom: 5}}>
                <Pressable>
                  <Icon
                    name={paused ? 'play' : 'pause'}
                    size={20}
                    color={color}
                  />
                </Pressable>
              </View>
            </Pressable>
          );
        }
        if (item.replyNetwork) {
          return (
            <Pressable
              onPress={() =>
                navigation.navigate('Network', {networkId: item.replyNetworkId})
              }>
              <Text style={{color: 'white', fontSize: 15, opacity: 0.6}}>
                {item.replyNetwork}
              </Text>
            </Pressable>
          );
        }
        if (item.replyPost) {
          const [post_id, network_id] = item.replyPost;
          return (
            <View style={{opacity: 0.6, width: '80%'}}>
              <Post post_id={post_id} network_id={network_id} isSub={true} />
            </View>
          );
        }
        if (item.replyText) {
          return (
            <Pressable>
              <Text style={{color: 'white', fontSize: 15, opacity: 0.6}}>
                {item.replyText}
              </Text>
            </Pressable>
          );
        }
      }
    };
    const MessageContent = () => {
      if (isReply) {
        if (item.image || item.video) {
          return (
            <View>
              <View
                style={{
                  marginBottom: 8,
                  backgroundColor: 'rgba(0, 0, 0, 0.2)',
                  borderRadius: 5,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}>
                {item.senderId === id ? (
                  <>
                    <Image
                      source={{uri: userDetails?.profile_pic}}
                      style={{width: 45, height: 45}}
                    />
                    <Text style={{color: 'white', padding: 5}}>
                      {userDetails?.name}
                    </Text>
                  </>
                ) : (
                  <>
                    <Image
                      source={{uri: myPic}}
                      style={{width: 45, height: 45}}
                    />
                    <Text style={{color: 'white', padding: 5}}>
                      Replying to Yourself
                    </Text>
                  </>
                )}
              </View>
              <View
                style={{
                  alignItems: 'flex-end',
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                }}>
                <Icon
                  name={'close'}
                  size={22}
                  color={'white'}
                  onPress={() => setReply(null)}
                />
                <View style={{flexDirection: 'row', gap: 10}}>
                  {item.image ? (
                    <Icon name={'image'} size={22} color={'white'} />
                  ) : (
                    <Icon name={'play'} size={22} color={'white'} />
                  )}
                  <Text style={{color: 'white', fontSize: 18}}>
                    {item.image ? 'Image' : 'Video'}
                  </Text>
                </View>
              </View>
            </View>
          );
        }
        if (item.type == 'network') {
          const networkPicUri = networkProfilePics[item.network_id];
          return (
            <View>
              <View
                style={{
                  marginBottom: 8,
                  backgroundColor: 'rgba(0, 0, 0, 0.2)',
                  borderRadius: 5,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}>
                {item.senderId === id ? (
                  <>
                    <Image
                      source={{uri: userDetails?.profile_pic}}
                      style={{width: 45, height: 45}}
                    />
                    <Text style={{color: 'white', padding: 5}}>
                      {userDetails?.name}
                    </Text>
                  </>
                ) : (
                  <>
                    <Image
                      source={{uri: myPic}}
                      style={{width: 45, height: 45}}
                    />
                    <Text style={{color: 'white', padding: 5}}>
                      Replying to Yourself
                    </Text>
                  </>
                )}
              </View>
              <View
                style={{
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                }}>
                <Icon
                  name={'close'}
                  size={22}
                  color={'white'}
                  onPress={() => setReply(null)}
                />
                <View
                  style={{flexDirection: 'row', gap: 4, alignItems: 'center'}}>
                  <Image
                    source={{uri: networkPicUri}}
                    style={styles.networkImage}
                  />
                  <Text style={styles.networkName(isCurrentUser)}>
                    {item.network_name}
                  </Text>
                </View>
              </View>
            </View>
          );
        }
        if (item.type === 'post_share') {
          return (
            <View>
              <View
                style={{
                  marginBottom: 8,
                  backgroundColor: 'rgba(0, 0, 0, 0.2)',
                  borderRadius: 5,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}>
                {item.senderId === id ? (
                  <>
                    <Image
                      source={{uri: userDetails?.profile_pic}}
                      style={{width: 45, height: 45}}
                    />
                    <Text style={{color: 'white', padding: 5}}>
                      {userDetails?.name}
                    </Text>
                  </>
                ) : (
                  <>
                    <Image
                      source={{uri: myPic}}
                      style={{width: 45, height: 45}}
                    />
                    <Text style={{color: 'white', padding: 5}}>
                      Replying to Yourself
                    </Text>
                  </>
                )}
              </View>
              <View
                style={{
                  alignItems: 'flex-end',
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                }}>
                <Icon
                  name={'close'}
                  size={22}
                  color={'white'}
                  onPress={() => setReply(null)}
                />
                <View style={{flexDirection: 'row', gap: 10}}>
                  <Icon name={'tablet-landscape'} size={22} color={'white'} />
                  <Text style={{color: 'white', fontSize: 18}}>Post</Text>
                </View>
              </View>
            </View>
          );
        }
        return (
          <View>
            <View
              style={{
                marginBottom: 8,
                backgroundColor: 'rgba(0, 0, 0, 0.2)',
                borderRadius: 5,
                flexDirection: 'row',
                alignItems: 'center',
              }}>
              {item.senderId === id ? (
                <>
                  <Image
                    source={{uri: userDetails?.profile_pic}}
                    style={{width: 45, height: 45}}
                  />
                  <Text style={{color: 'white', padding: 5}}>
                    {userDetails?.name}
                  </Text>
                </>
              ) : (
                <>
                  <Image
                    source={{uri: myPic}}
                    style={{width: 45, height: 45}}
                  />
                  <Text style={{color: 'white', padding: 5}}>
                    Replying to Yourself
                  </Text>
                </>
              )}
            </View>
            <View
              style={{
                alignItems: 'flex-end',
                flexDirection: 'row',
                justifyContent: 'space-between',
              }}>
              <Icon
                name={'close'}
                size={22}
                color={'white'}
                onPress={() => setReply(null)}
              />
              <View style={{flexDirection: 'row', gap: 10, maxWidth: '80%'}}>
                <Text
                  style={{color: 'white', fontSize: 18}}
                  numberOfLines={2}
                  ellipsizeMode="tail">
                  {item.text}
                </Text>
              </View>
            </View>
          </View>
        );
      }
      if (item.video) {
        return (
          <Pressable
            onLongPress={() => (isCurrentUser ? handleLongPress(item) : null)}
            style={[
              styles.videoContainer,
              {
                alignSelf: isCurrentUser ? 'flex-end' : 'flex-start',
                backgroundColor: isCurrentUser ? '#1a1a1a' : color,
              },
            ]}
            onPress={() =>
              navigation.navigate('VideoExpand', {videoUri: item.video})
            }>
            <Video
              source={{uri: item.video}}
              style={{
                height: 200,
                width: '100%',
                alignSelf: isCurrentUser ? 'flex-end' : 'flex-start',
              }}
              resizeMode="cover"
              controls={false}
              muted={false}
              pictureInPicture={true}
              paused={true}
              selectedVideoTrack={{
                type: 'resolution',
                value: 720,
              }}
            />
            <View style={{position: 'absolute', right: 5, left: 5}}>
              <Pressable>
                <Icon
                  name={paused ? 'play' : 'pause'}
                  size={30}
                  color={isCurrentUser ? color : '#1a1a1a'}
                />
              </Pressable>
            </View>
          </Pressable>
        );
      }

      if (item.type === 'network') {
        const networkPicUri = networkProfilePics[item.network_id];
        return (
          <Pressable
            onLongPress={() => (isCurrentUser ? handleLongPress(item) : null)}
            style={[
              styles.networkContainer,
              {alignSelf: isCurrentUser ? 'flex-end' : 'flex-start'},
            ]}
            onPress={() =>
              navigation.navigate('Network', {networkId: item.network_id})
            }>
            <View style={styles.networkDetails}>
              <Image
                source={{uri: networkPicUri}}
                style={styles.networkImage}
              />
              <Text style={styles.networkName(isCurrentUser)}>
                {item.network_name}
              </Text>
              <Icon
                name={'chevron-forward'}
                size={22}
                color={isCurrentUser ? 'white' : color}
              />
            </View>
          </Pressable>
        );
      }

      if (item.type === 'post_share') {
        return (
          <Pressable
            onLongPress={() => (isCurrentUser ? handleLongPress(item) : null)}>
            <View
              style={[
                styles.messageContainer,
                isCurrentUser && styles.currentUserMessage,
              ]}>
              <Pressable
                style={styles.postShare}
                onPress={() =>
                  navigation.navigate('PostExpand', {
                    post_id: item.post_id,
                    network_id: item.network_id,
                  })
                }>
                <Text style={{color: 'white'}}>
                  {!isCurrentUser ? userDetails.name : 'You'} shared a post from{' '}
                  <Text style={{color: 'white', fontWeight: 'bold'}}>
                    {item.network_name}
                  </Text>
                </Text>
              </Pressable>
            </View>
          </Pressable>
        );
      }
      return (
        <Pressable
          style={[
            styles.textMessage,
            {backgroundColor: isCurrentUser ? '#1a1a1a' : color},
            {alignSelf: isCurrentUser ? 'flex-end' : 'flex-start'},
          ]}
          onLongPress={() => (isCurrentUser ? handleLongPress(item) : null)}>
          {item.image && (
            <Pressable
              onPress={() =>
                navigation.navigate('ImageExpand', {images: item.image})
              }
              onLongPress={() =>
                isCurrentUser ? handleLongPress(item) : null
              }>
              <Image source={{uri: item.image}} style={styles.image} />
            </Pressable>
          )}
          {item.text && <Bluing text={item.text} style={{color: 'white'}} />}
        </Pressable>
      );
    };

    return (
      <FlingGestureHandler
        direction={isCurrentUser ? Directions.LEFT : Directions.RIGHT}
        onHandlerStateChange={onFling}>
        <Animated.View style={{transform: [{translateX}]}}>
          {item.replyingTo ? (
            <View
              style={{
                alignItems: isCurrentUser ? 'flex-end' : 'flex-start',
                borderRightWidth: isCurrentUser ? 10 : 0,
                borderLeftWidth: isCurrentUser ? 0 : 10,
                borderColor: '#1a1a1a',
                padding: 10,
                borderRadius: 4,
              }}>
              <ReplyContent />
            </View>
          ) : null}
          <MessageContent />
        </Animated.View>
      </FlingGestureHandler>
    );
  };

  if (loadingUserDetails) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={color} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}>
      <View style={styles.header}>
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
          <Icon
            name={'chevron-back'}
            size={24}
            color={color}
            onPress={() => navigation.goBack()}
          />
          <Image
            source={{uri: userDetails?.profile_pic}}
            style={styles.profilePic}
          />
          <Text
            style={styles.headerTitle}
            onPress={() =>
              navigation.navigate('UserProfile', {
                id: id,
              })
            }>
            {userDetails.name}
          </Text>
        </View>
      </View>
      {messages.length > 0 ? (
        <FlatList
          data={messages}
          renderItem={renderMessageItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.messagesList}
          inverted
          ListFooterComponent={
            hasMore && (
              <TouchableOpacity
                style={{
                  width: '90%',
                  alignSelf: 'center',
                  backgroundColor: '#1a1a1a',
                  padding: 15,
                  borderRadius: 5,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 15,
                  justifyContent: 'center',
                }}
                onPress={() => fetchMessages(true)}
                disabled={loading}>
                <Icon name="receipt" color="white" size={18} />
                <Text
                  style={{color: 'white', textAlign: 'center', fontSize: 14}}>
                  {loading
                    ? 'Fetching New Messages'
                    : 'Load new messages if available'}
                </Text>
              </TouchableOpacity>
            )
          }
        />
      ) : (
        <ChatEmpty userDetails={userDetails} id={id} />
      )}
      {reply && (
        <View
          style={{backgroundColor: '#1a1a1a', padding: 10, borderRadius: 5}}>
          {renderMessageItem({item: reply, isReply: true})}
        </View>
      )}
      {imageUri ? (
        <View style={styles.selectedImageContainer}>
          <Image source={{uri: imageUri}} style={styles.selectedImage} />
          <TouchableOpacity
            onPress={onCancel}
            style={{
              backgroundColor: color,
              paddingHorizontal: 20,
              padding: 5,
              borderRadius: 5,
              marginTop: 10,
              alignItems: 'center',
              marginBottom: 10,
              alignSelf: 'center',
            }}>
            <Icon
              name={'close-outline'}
              size={20}
              color="white"
              style={{alignSelf: 'flex-end', marginBottom: 4}}
            />
          </TouchableOpacity>
        </View>
      ) : null}
      {videoUri ? (
        <View style={styles.selectedImageContainer}>
          <Video
            source={{uri: videoUri}}
            style={{width: '100%', height: 200}}
            resizeMode="cover"
            controls={false}
            muted={false}
            pictureInPicture={true}
            paused={paused}
            ref={videoRef}
            repeat={true}
            onEnd={handleVideoEnd}
            selectedVideoTrack={{
              type: 'resolution',
              value: 720,
            }}
          />
          <View
            style={{
              position: 'absolute',
              bottom: 65,
              right: 40,
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              borderRadius: 300 / 2,
              padding: 10,
            }}>
            <Pressable onPress={togglePlayPause}>
              <Icon name={paused ? 'play' : 'pause'} size={30} color={color} />
            </Pressable>
          </View>
          <TouchableOpacity
            onPress={onCancel}
            style={{
              backgroundColor: color,
              paddingHorizontal: 20,
              padding: 5,
              borderRadius: 5,
              marginTop: 10,
              alignItems: 'center',
              marginBottom: 10,
              alignSelf: 'center',
            }}>
            <Icon
              name={'close-outline'}
              size={20}
              color="white"
              style={{alignSelf: 'flex-end', marginBottom: 4}}
            />
          </TouchableOpacity>
        </View>
      ) : null}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={message}
          onChangeText={text => setMessage(text)}
          placeholder="Type a message"
          placeholderTextColor={'grey'}
          multiline
        />
        {sending ? (
          <ActivityIndicator color={'#1a1a1a'} size={'small'} />
        ) : (
          <TouchableOpacity onPress={handleSend} style={styles.sendButton}>
            <Icon name="send" size={24} color={color} />
          </TouchableOpacity>
        )}
      </View>
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalText}>Delete this message?</Text>
          <View style={styles.modalContent}>
            <TouchableOpacity
              onPress={deleteMessage}
              style={styles.deleteButton}>
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={styles.cancelButton}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <BottomSheetModal
        ref={bottomSheetModalRef}
        index={0}
        snapPoints={snapPoints}
        onChange={handleSheetChanges}
        handleStyle={{backgroundColor: 'black'}}
        handleIndicatorStyle={{backgroundColor: 'black'}}
        backdropComponent={props => (
          <BottomSheetBackdrop
            {...props}
            disappearsOnIndex={-1}
            appearsOnIndex={0}
            style={{backgroundColor: 'black'}}
          />
        )}>
        <BottomSheetView style={{backgroundColor: 'black', flex: 1}}>
          <Pressable
            style={{
              backgroundColor: 'black',
              padding: 18,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 15,
            }}
            onPress={takePhoto}>
            <Icon
              name="camera"
              size={20}
              color={color}
              style={{marginLeft: 10}}
            />
            <Text style={{color: 'white', fontSize: 16}}>Camera</Text>
          </Pressable>
          <Pressable
            style={{
              backgroundColor: 'black',
              padding: 18,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 15,
            }}
            onPress={handleMediaPicker}>
            <Icon
              name="image"
              size={20}
              color={color}
              style={{marginLeft: 10}}
            />
            <Text style={{color: 'white', fontSize: 16}}>Media</Text>
          </Pressable>
        </BottomSheetView>
      </BottomSheetModal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  selectedImage: {
    height: 150,
    width: 150,
    alignSelf: 'center',
  },
  profilePic: {
    width: 30,
    height: 30,
    borderRadius: 17.5,
    marginRight: 10,
  },
  sharedPostContainer: {
    paddingVertical: 4,
    borderRadius: 10,
    maxWidth: '80%',
    width: '80%',
    padding: 10,
    justifyContent: 'space-evenly',
    marginTop: 10,
  },
  postText: {
    fontSize: 14,
    marginBottom: 5,
    fontWeight: 'bold',
    maxWidth: '90%',
  },
  postTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 5,
    maxWidth: '90%',
    color: 'black',
  },
  postInfo: {
    fontSize: 14,
    color: '#555',
    maxWidth: '90%',
  },
  selectedImageContainer: {
    backgroundColor: 'black',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 10 : 10,
    paddingBottom: 10,
    backgroundColor: 'black',
    elevation: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: color,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
  loadingIndicator: {
    marginLeft: 8,
  },
  pinButton: {
    padding: 8,
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    flexGrow: 1,
    backgroundColor: 'black',
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    maxWidth: '60%',
    marginBottom: 16,
    borderRadius: 2,
    borderWidth: 0.9,
    borderColor: '#1a1a1a',
  },
  profilePic: {
    width: 38,
    height: 38,
    borderRadius: 16,
    marginRight: 8,
  },
  messageImage: {
    width: 150,
    height: 150,
    borderRadius: 8,
    marginLeft: 8,
  },
  messageText: {
    backgroundColor: '#E5E5E5',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 12,
    fontSize: 16,
    color: '#333',
  },
  currentUserTextPost: {
    color: 'white',
  },
  currentUserText: {
    color: 'white',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopColor: '#E5E5E5',
    backgroundColor: 'black',
  },
  input: {
    flex: 1,
    marginRight: 8,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    paddingHorizontal: 16,
    backgroundColor: 'black',
    borderRadius: 6,
    fontSize: 16,
    color: color,
    backgroundColor: '#1a1a1a',
  },
  imagePickerButton: {
    padding: 8,
  },
  sendButton: {
    padding: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderWidth: 1,
    borderColor: 'grey',
  },
  modalContent: {
    backgroundColor: 'black',
    borderRadius: 8,
    width: '80%',
    alignItems: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalText: {
    fontSize: 18,
    marginBottom: 24,
    color: 'white',
  },
  deleteButton: {
    backgroundColor: color,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: '48%',
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: '#1a1a1a',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: '48%',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
  },
  videoContainer: {
    backgroundColor: '#333',
    width: '70%',
    marginBottom: 10,
    borderRadius: 10,
    overflow: 'hidden',
  },
  video: {
    width: '100%',
    height: 200,
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 15,
    padding: 10,
    right: 20,
    bottom: 20,
  },
  networkContainer: {
    backgroundColor: '#282828',
    width: '70%',
    flexDirection: 'row',
    marginBottom: 10,
    alignItems: 'center',
    borderRadius: 10,
    justifyContent: 'space-between',
    padding: 10,
  },
  networkDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  networkImage: {
    height: 40,
    width: 40,
    borderRadius: 20,
    marginRight: 15,
  },
  networkName: isCurrentUser => ({
    color: isCurrentUser ? 'white' : '#FF6B6B',
    fontWeight: 'bold',
    fontSize: 18,
  }),
  timestamp: {
    color: '#bbb',
    alignSelf: 'flex-end',
    position: 'absolute',
    bottom: 5,
    right: 10,
    fontSize: 12,
  },
  currentUserMessage: {
    alignSelf: 'flex-end',
    maxWidth: '90%',
  },
  postShare: {
    width: '100%',
    padding: 50,
  },
  textMessage: {
    width: '80%',
    padding: 10,
    borderRadius: 5,
    marginVertical: 8,
    shadowRadius: 5,
    shadowOffset: {width: 0, height: 2},
  },
  image: {
    height: 150,
    width: '100%',
    borderRadius: 10,
    marginBottom: 5,
  },
  text: isCurrentUser => ({
    color: isCurrentUser ? '#f9f9f9' : '#333',
    fontSize: 16,
    lineHeight: 22,
  }),
  replyAction: {
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    padding: 10,
    margin: 5,
    borderRadius: 5,
  },
  replyText: {
    color: 'white',
    fontWeight: 'bold',
  },
  replyContainer: {
    backgroundColor: '#555',
    borderRadius: 10,
    marginVertical: 5,
    padding: 10,
  },
});
