import React, {useState, useEffect, useCallback} from 'react';
import {Text, View, StyleSheet, Pressable, Image, Modal} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import {SHA256} from 'crypto-js';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';
import color from './color';
import {SharedElement} from 'react-navigation-shared-element';

const UserChat = ({item, onDeleteChat}) => {
  const navigation = useNavigation();
  const [userDetails, setUserDetails] = useState(null);
  const [chatRoomInfo, setChatRoomInfo] = useState(null);
  const [chatRoomId, setChatRoomId] = useState(null);
  const [lastSeen, setLastSeen] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false)
  const currentUserUid = auth().currentUser.uid;

  const generateChatRoomId = useCallback(() => {
    const sortedUids = [item.userId, currentUserUid].sort();
    const concatenatedIds = sortedUids.join('');
    const generatedHash = SHA256(concatenatedIds).toString();
    setChatRoomId(generatedHash);
  }, [item.userId, currentUserUid]);

  useEffect(() => {
    generateChatRoomId();
  }, [generateChatRoomId]);

  useEffect(() => {
    if (chatRoomId) {
      const unsubscribeChatRoom = firestore()
        .collection('ChatRooms')
        .doc(chatRoomId)
        .onSnapshot(
          chatRoomDoc => {
            if (chatRoomDoc.exists) {
              setChatRoomInfo(chatRoomDoc.data());
            }
          },
          error => {
            console.error('Error fetching chat room info:', error);
          },
        );

      const unsubscribeLastSeen = firestore()
        .collection('ChatRooms')
        .doc(chatRoomId)
        .collection('Members')
        .doc(currentUserUid)
        .onSnapshot(
          memberDoc => {
            if (memberDoc.exists) {
              setLastSeen(memberDoc.data().lastSeen);
            }
          },
          error => {
            console.warn('Error fetching last seen:', error);
          },
        );

      return () => {
        unsubscribeChatRoom();
        unsubscribeLastSeen();
      };
    }
  }, [chatRoomId, currentUserUid]);

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const userDoc = await firestore()
          .collection('Users')
          .doc(item.userId)
          .get();
        if (userDoc.exists) {
          setUserDetails(userDoc.data());
        }
      } catch (error) {
        console.error('Error fetching user details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, [item.userId]);

  const timeAgo = timestamp => {
    if (!timestamp) return 'No timestamp';

    const now = new Date();
    const then = new Date(timestamp.seconds * 1000);
    const difference = now - then;

    const seconds = Math.floor(difference / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ago`;
    } else if (hours > 0) {
      return `${hours}h ago`;
    } else if (minutes > 0) {
      return `${minutes}m ago`;
    } else {
      return `${seconds}s ago`;
    }
  };

  const isNewMessage = () => {
    if (!chatRoomInfo?.lastMessageTimestamp || !lastSeen) return false;
    const lastSeenTime = lastSeen.seconds;
    const lastMessageTime = chatRoomInfo.lastMessageTimestamp.seconds;
    return lastMessageTime > lastSeenTime;
  };

  if (loading) {
    return (
      <SkeletonPlaceholder>
        <View style={styles.chatItem}>
          <View style={styles.detailsContainer}>
            <View style={styles.profilePicSkeleton} />
            <View style={styles.textSkeleton}>
              <View style={styles.nameSkeleton} />
              <View style={styles.messageSkeleton} />
            </View>
          </View>
        </View>
      </SkeletonPlaceholder>
    );
  }

  if(!userDetails){
    return null
  }
  return (
    <View>
      <Pressable
        style={styles.chatItem}
        onPress={() => navigation.navigate('Chat', {id: item.userId})}>
        <View style={styles.chatDetails}>
          <View style={styles.detailsContainer}>
            <Image
              source={{uri: userDetails?.profile_pic}}
              style={styles.profilePic}
            />
            <View style={styles.textContainer}>
              <Text
                style={[styles.chatText, isNewMessage() && styles.boldText]}>
                {userDetails?.name || 'Unknown User'}
              </Text>
              <Text
                style={[styles.chatTextLast, isNewMessage() && styles.boldText]}
                numberOfLines={1}
                ellipsizeMode="tail">
                {chatRoomInfo?.lastMessageText || 'No message here'}
              </Text>
            </View>
          </View>
          <View style={styles.timestampContainer}>
            {chatRoomInfo?.lastMessageTimestamp && (
              <Text style={styles.timestamp}>
                {timeAgo(chatRoomInfo.lastMessageTimestamp)}
              </Text>
            )}
          </View>
        </View>
      </Pressable>
      <Modal
        transparent={true}
        visible={showModal}
        animationType="slide"
        onRequestClose={() => showModal(false)}>
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
              <Text style={{color: 'white'}}>Remove Chat from feed?</Text>
              <View style={{width: "100%", flexDirection: 'row', alignItems: 'center',justifyContent: 'space-between', marginTop: 5}}>
                <Pressable style={{width: "45%", backgroundColor: color, padding: 10, borderRadius: 5, alignItems: 'center'}} onPress={onDeleteChat}>
                  <Text style={{color: 'white'}}>Delete</Text>
                </Pressable>
                <Pressable style={{width: "45%", backgroundColor: '#1a1a1a', padding: 10, borderRadius: 5, alignItems: 'center'}} onPress={() => setShowModal(false)}>
                  <Text style={{color: 'white'}}>Cancel</Text>
                </Pressable>
              </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  chatItem: {
    padding: 10,
    alignItems: 'center',
    backgroundColor: 'black',
    borderRadius: 5,
    marginBottom: 6,
  },
  chatDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detailsContainer: {
    flexDirection: 'row',
    flex: 1,
  },
  profilePic: {
    height: 40,
    width: 40,
    borderRadius: 20,
  },
  profilePicSkeleton: {
    height: 40,
    width: 40,
    borderRadius: 20,
    backgroundColor: '#e1e1e1',
  },
  textSkeleton: {
    flex: 1,
    marginLeft: 10,
  },
  nameSkeleton: {
    width: '60%',
    height: 16,
    borderRadius: 4,
    backgroundColor: '#e1e1e1',
    marginBottom: 5,
  },
  messageSkeleton: {
    width: '80%',
    height: 14,
    borderRadius: 4,
    backgroundColor: '#e1e1e1',
  },
  textContainer: {
    flex: 1,
    marginLeft: 10,
  },
  chatText: {
    color: 'white',
    fontSize: 16,
  },
  chatTextLast: {
    color: 'grey',
    fontSize: 16,
  },
  boldText: {
    fontWeight: 'bold',
    color: 'white',
  },
  timestampContainer: {
    justifyContent: 'center',
  },
  timestamp: {
    color: 'grey',
  },
});

export default UserChat;




