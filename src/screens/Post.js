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
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import Icon from 'react-native-vector-icons/Ionicons';
import auth from '@react-native-firebase/auth';
import {useNavigation} from '@react-navigation/native';
import ImageCollage from './ImageCollage';
import {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetModalProvider,
  BottomSheetBackdrop,
} from '@gorhom/bottom-sheet';
import Video from 'react-native-video';
import Animated from 'react-native-reanimated';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';
import User from './User';
import LinearGradient from 'react-native-linear-gradient';
import Hash from './Hash';
import Bluing from '../texting/Bluing';

export default function Post({post_id, network_id, isSub}) {
  const [postData, setPostData] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [networkPic, setNetworkPic] = useState(null);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [adminDetails, setAdminDetails] = useState({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const navigation = useNavigation();
  const bottomSheetModalRef = useRef(null);

  const [paused, setPaused] = useState(true);
  const videoRef = useRef(null);

  const togglePlayPause = () => {
    setPaused(!paused);
  };

  const handleVideoEnd = () => {
    setPaused(true);
  };
  const snapPoints = useMemo(() => ['85%'], []);

  const handlePresentModalPress = useCallback(() => {
    bottomSheetModalRef.current?.present();
  }, []);
  const handleClosePress = () => bottomSheetModalRef.current?.close();
  const handleSheetChanges = useCallback(index => {
    console.log('handleSheetChanges', index);
  }, []);

  useEffect(() => {
    const fetchNetworkPic = async () => {
      try {
        const doc = await firestore()
          .collection('Network')
          .doc(network_id)
          .get();
        if (doc.exists) {
          setNetworkPic(doc.data().profile_pic);
        } else {
          console.warn('No such document!');
        }
      } catch (error) {
        console.warn('Error getting document:', error);
      }
    };

    fetchNetworkPic();
  }, [network_id]);

  const handleDelete = async () => {
    setShowDeleteModal(true);
  };

  const openLink = url => {
    try {
      Linking.openURL(url);
    } catch (error) {
      console.warn(error);
    }
  };

  const confirmDelete = async () => {
    try {
      const userId = auth().currentUser?.uid;

      const postRef = firestore()
        .collection('Network')
        .doc(network_id)
        .collection('Posts')
        .doc(post_id);

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
    try {
      const userId = auth().currentUser?.uid;
      if (!userId || !network_id || !post_id) {
        console.warn('Missing userId, network_id, or post_id');
        return;
      }
  
      const postRef = firestore()
        .collection('Network')
        .doc(network_id)
        .collection('Posts')
        .doc(post_id);
  
      const likePostRef = firestore()
        .collection('Users')
        .doc(userId)
        .collection('likes')
        .doc(post_id);
  
      const notificationRef = firestore()
        .collection('Users')
        .doc(postData.posted_by)
        .collection('Notifications')
        .doc(`${post_id}_${userId}_like`);
  
      const batch = firestore().batch();
  
      if (liked) {
        setLiked(false);
        batch.update(postRef, {
          likes: firestore.FieldValue.arrayRemove(userId),
          likeCount: firestore.FieldValue.increment(-1),
        });
  
        await likePostRef.delete();
  

        batch.delete(notificationRef);
  
      } else {
        setLiked(true);
  
        batch.update(postRef, {
          likes: firestore.FieldValue.arrayUnion(userId),
          likeCount: firestore.FieldValue.increment(1),
        });
  
        await likePostRef.set({
          network_id: network_id,
          post_id: post_id,
          createdAt: firestore.FieldValue.serverTimestamp(),
        });
  
        batch.set(notificationRef, {
          type: 'like',
          likedBy: userId,
          post_id: post_id,
          network_id: network_id,
          createdAt: firestore.FieldValue.serverTimestamp(),
        });
      }
  
      await batch.commit();
      console.log('Like operation completed');
    } catch (error) {
      setLiked(!liked); 
      console.error('Error updating likes:', error);
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
    try {
      const userId = auth().currentUser?.uid;

      if (!userId || !network_id || !post_id) {
        console.warn('User ID, network ID, or post ID is missing.');
        return;
      }

      const savedPostRef = firestore()
        .collection('Users')
        .doc(userId)
        .collection('saved')
        .doc(post_id);

      const postRef = firestore()
        .collection('Network')
        .doc(network_id)
        .collection('Posts')
        .doc(post_id);

      const snapshot = await savedPostRef.get();
      const batch = firestore().batch();

      if (snapshot.exists) {
        batch.delete(savedPostRef);
        batch.update(postRef, {
          saveCount: firestore.FieldValue.increment(-1),
        });
        setSaved(false);
      } else {
        batch.set(savedPostRef, {
          network_id: network_id,
          post_id: post_id,
          createdAt: firestore.FieldValue.serverTimestamp(),
        });
        batch.update(postRef, {
          saveCount: firestore.FieldValue.increment(1),
        });
        setSaved(true);
      }

      await batch.commit();
    } catch (error) {
      console.error('Error updating saved posts:', error);
    }
  };

  useEffect(() => {
    const fetchAdminDetails = async () => {
      try {
        const networkDoc = await firestore()
          .collection('Network')
          .doc(network_id)
          .get();
        if (networkDoc.exists) {
          const adminId = networkDoc.data()?.admin;
          if (adminId) {
            const adminDoc = await firestore()
              .collection('Users')
              .doc(adminId)
              .get();
            if (adminDoc.exists) {
              setAdminDetails(adminDoc.data());
              console.log(adminDoc.data());
            } else {
              console.warn('Admin user document does not exist');
            }
          } else {
            console.warn('No admin ID found in network document');
          }
        } else {
          console.warn(
            'Network document does not exist for network_id:',
            network_id,
          );
        }
      } catch (error) {
        console.error('Error fetching network or admin data:', error);
      }
    };

    fetchAdminDetails();
  }, [network_id]);

  const navigateToShare = () => {
    handleClosePress();
    navigation.navigate('Share', {
      post_id: post_id,
      network_id: network_id,
      post_title: postData.title,
      post_information: postData.information,
      network_name: postData.network_name,
    });
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
      network_id: network_id,
      post_id: post_id,
    });
  };
  const navigateThroughBottomUser = () => {
    handleClosePress();
    navigation.navigate('UserProfile', {id: postData.posted_by});
  };
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const userId = auth().currentUser?.uid;
        if (!userId || !network_id || !post_id) {
          return;
        }

        const postRef = firestore()
          .collection('Network')
          .doc(network_id)
          .collection('Posts')
          .doc(post_id);

        const unsubscribe = postRef.onSnapshot(doc => {
          if (doc.exists) {
            const postData = doc.data();
            setPostData(postData);
            setLiked(
              postData.likes?.includes(auth().currentUser?.uid) || false,
            );
            setLikeCount(postData.likes?.length || 0);
          } else {
            setPostData(null);
          }
        });

        const savedPostDoc = await firestore()
          .collection('Users')
          .doc(userId)
          .collection('saved')
          .doc(post_id)
          .get();
        if (savedPostDoc.exists) {
          setSaved(true);
        }
      } catch (error) {
        setSaved(false);
        console.error('Error checking status:', error);
      }
    };

    checkStatus();
  }, [network_id, post_id]);

  useEffect(() => {
    const fetchPostData = async () => {
      try {
        const postDoc = await firestore()
          .collection('Network')
          .doc(network_id)
          .collection('Posts')
          .doc(post_id)
          .get();

        if (postDoc.exists) {
          const postData = postDoc.data();
          setPostData(postData);

          const userDoc = await firestore()
            .collection('Users')
            .doc(postData.posted_by)
            .get();

          if (userDoc.exists) {
            setUserData(userDoc.data());
          } else {
            console.warn(
              'User document does not exist for posted_by:',
              postData.posted_by,
            );
          }
        } else {
          console.warn('Post document does not exist for post_id:', post_id);
          setPostData(null);
        }
      } catch (error) {
        console.error('Error fetching post data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPostData();
  }, [post_id, network_id]);

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

  if (loading) {
    return (
      <SkeletonPlaceholder backgroundColor="#3A3A3A">
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
  if (!loading) {
  }
  return (
    <Pressable
      style={styles.container}
      onPress={() =>
        navigation.navigate('PostExpand', {
          post_id: post_id,
          network_id: network_id,
        })
      }>
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
                      network_id: network_id,
                    })
              }>
              <Image source={{uri: networkPic}} style={styles.networkPic} />
            </Pressable>
            <View style={styles.networkUserInfo}>
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
                          network_id: network_id,
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
                          network_id: network_id,
                        })
                  }>
                  {userData?.name || 'Unknown User'}
                </Text>
              </View>
              <View style={{flexDirection: 'row', gap: 4}}>
                <Text style={styles.postedAgo}>
                  {timeAgo(postData.createdAt) || ''}
                </Text>
                {!isSub ? (
                  <Icon
                    name={'ellipsis-vertical'}
                    size={22}
                    color="#FF3131"
                    onPress={handlePresentModalPress}
                  />
                ) : null}
              </View>
            </View>
          </View>
          {postData.imageUrls && (
            <ImageCollage imageUrls={postData.imageUrls} />
          )}
          <Pressable
            onPress={() =>
              navigation.navigate('VideoExpand', {
                videoUri: postData.videoUrl,
                network_pic: networkPic,
                network_name: postData.network_name,
                network_id: network_id,
              })
            }>
            {postData.videoUrl && (
              <View
                style={{
                  position: 'relative',
                  width: '100%',
                  height: 270,
                  borderRadius: 10,
                }}>
                <Video
                  source={{uri: postData.videoUrl}}
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
                    bottom: 10,
                    right: 10,
                    backgroundColor: 'rgba(0, 0, 0, 0.6)',
                    borderRadius: 300 / 2,
                    padding: 10,
                  }}>
                  <Pressable onPress={togglePlayPause}>
                    <Icon
                      name={paused ? 'play' : 'pause'}
                      size={30}
                      color="#FF3131"
                    />
                  </Pressable>
                </View>
              </View>
            )}
          </Pressable>
          <Bluing text={postData.title || '' } style={styles.title} />
          <Bluing text={postData.information || ''} style={styles.info} />
          <View
            style={{
              flexDirection: 'row',
              gap: 5,
              flexWrap: 'wrap',
              marginTop: 5,
            }}>
            {postData.selectedSubtopics.map((subtopic, index) => (
              <Pressable
                key={index}
                style={styles.subtopicBox}
                onPress={() =>
                  navigation.navigate('Network', {
                    networkId: network_id,
                    subtopic: subtopic,
                  })
                }>
                <Text style={styles.subtopicText}>{subtopic || ' '}</Text>
              </Pressable>
            ))}
          </View>
          {postData.links && postData.links.length > 0 && (
            <View>
              {postData.links.map((link, index) => (
                <Pressable
                  key={index}
                  onPress={() => {
                    if (!isSub) {
                      navigation.navigate('Web', {url: link});
                    } else {
                      navigation.navigate('PostExpand', {post_id, network_id});
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
                      color: '#FF3131',
                      textDecorationLine: 'underline',
                      maxWidth: '90%',
                    }}>
                    {link}
                  </Text>
                  <Icon name={'open-outline'} size={27} color="#FF3131" />
                </Pressable>
              ))}
            </View>
          )}
          {postData.reposted_from_network && (
            <Pressable
              style={{
                backgroundColor: 'black',
                paddingVertical: 5,
                paddingHorizontal: 10,
                borderRadius: 15,
                marginVertical: 5,
                alignSelf: 'flex-start',
                borderColor: '#1a1a1a',
                borderWidth: 1,
              }}
              onPress={() =>
                !isSub
                  ? navigation.navigate('Network', {
                      networkId: postData.reposted_network_id,
                    })
                  : navigation.navigate('PostExpand', {
                      post_id: post_id,
                      network_id: network_id,
                    })
              }>
              <Text style={{color: 'grey', fontSize: 15, fontWeight: 'bold'}}>
                Reposted From {postData.reposted_from_network || ' '}
              </Text>
            </Pressable>
          )}
          <ScrollView
           style={{flexDirection: 'row', gap: 10}} horizontal showsHorizontalScrollIndicator={false}>
          {postData.users && postData.users.length > 0 && (
           postData.users.map((id, index) => (
            <User key={index} id={id} />
           ))
          )}
          </ScrollView>
          <ScrollView style={{flexDirection: 'row', gap: 10}} horizontal showsHorizontalScrollIndicator={false}>
          {postData.hashes && postData.hashes.length > 0 && (
           postData.hashes.map((id, index) => (
            <Hash key={index} id={id} />
           ))
          )}
          </ScrollView>
          {!isSub ? (
            <View
              style={{
                backgroundColor: '#1a1a1a',
                borderColor: '#ccc',
                padding: 5,
                borderRadius: 5,
                flexDirection: 'row',
                width: '100%',
                gap: 15,
                alignItems: 'flex-end',
                justifyContent: 'flex-end',
                marginTop: 8,
              }}>
              <Pressable
                style={{
                  marginLeft: 10,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 3,
                }}
                onPress={handleLike}>
                <Icon
                  name={liked ? 'heart' : 'heart-outline'}
                  size={28}
                  color="#FF3131"
                />
                <Text style={{color: 'white', fontSize: 16}}>
                  {postData.likeCount || ' '}
                </Text>
              </Pressable>
              <Pressable
                style={{marginRight: 10}}
                onPress={() =>
                  navigation.navigate('PostExpand', {
                    post_id: post_id,
                    network_id: network_id,
                  })
                }>
                <Icon name={'chatbox-outline'} size={28} color="#FF3131" />
              </Pressable>
              <Pressable style={{marginRight: 10}} onPress={handleSave}>
                <Icon
                  name={saved ? 'bookmark' : 'bookmark-outline'}
                  size={28}
                  color="#FF3131"
                />
              </Pressable>
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
            onChange={handleSheetChanges}
            handleStyle={{backgroundColor: '#404040', zIndex: 100}}
            handleIndicatorStyle={{backgroundColor: 'grey'}}
            backdropComponent={props => (
              <BottomSheetBackdrop
                {...props}
                disappearsOnIndex={-1}
                appearsOnIndex={0}
                style={{backgroundColor: 'black'}}
              />
            )}>
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
              <Pressable
                style={{
                  flexDirection: 'row',
                  padding: 15,
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
                onPress={navigateToShare}>
                <Text style={{color: 'white'}}>Share</Text>
                <Icon name={'share'} size={26} color="white" />
              </Pressable>
              <Pressable
                style={{
                  flexDirection: 'row',
                  padding: 15,
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                <Text style={{color: 'red'}}>
                  Report (Under Implementation)
                </Text>
                <Icon name={'warning'} size={26} color="red" />
              </Pressable>
              {(postData.posted_by === auth().currentUser.uid ||
                adminDetails.email === auth().currentUser.email) && (
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
                <Text style={{color: liked ? '#FF3131' : 'white'}}>Like</Text>
                <Icon
                  name={liked ? 'heart' : 'heart-outline'}
                  size={30}
                  color={liked ? '#FF3131' : 'white'}
                />
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
              <Pressable
                style={{
                  flexDirection: 'row',
                  padding: 15,
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
                onPress={onRepost}>
                <Text style={{color: 'white'}}>Repost</Text>
                {!postData.reposted_from_network && (
                  <Icon name={'git-branch'} size={29} color="white" />
                )}
              </Pressable>
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
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 8,
    backgroundColor: 'black',
    borderRadius: 3,
    marginTop: 2,
    width: '100%',
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
    width: 45,
    height: 45,
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
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: 2,
    marginBottom: 6,
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
    color: '#FF3131',
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
    borderWidth: 1,
    borderColor: '#ccc',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'white',
  },
  deleteButton: {
    backgroundColor: '#FF3131',
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
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 8,
  },
  info: {
    fontSize: 16,
    marginBottom: 2,
    color: 'white',
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
    color: '#FF3131',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
    borderWidth: 1,
    borderColor: '#ccc',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'white',
  },
  deleteButton: {
    backgroundColor: '#FF3131',
  },
  buttonText: {
    fontSize: 16,
    color: 'black',
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
    height: 200,
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
