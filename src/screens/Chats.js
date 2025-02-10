import React, { useState, useEffect } from 'react';
import {
  Text,
  View,
  FlatList,
  RefreshControl,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import UserChat from './UserChat';
import color from './color';
import {SharedElement} from 'react-navigation-shared-element';

export default function Chats() {
  const [pinnedChats, setPinnedChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastVisible, setLastVisible] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const currentUserUid = auth().currentUser.uid;
  const pageSize = 10;

  const fetchBlocked = async () => {
    try {
      const userDoc = await firestore()
        .collection('Users')
        .doc(currentUserUid)
        .get();
      setBlockedUsers(userDoc.data()?.blockedUsers || []);
    } catch (error) {
      console.warn('Error fetching blocked users:', error);
    }
  };

  const fetchInitialChats = async () => {
    setLoading(true);
    try {
      const querySnapshot = await firestore()
        .collection('Users')
        .doc(currentUserUid)
        .collection('ChatRooms')
        .orderBy('gaingOrderTimeStamp', 'desc')
        .limit(pageSize)
        .get();

      const chats = querySnapshot.docs.map(doc => ({
        chatroomid: doc.id,
        userId: doc.data().userId,
      }));

      setPinnedChats(chats);
      setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
    } catch (error) {
      console.error('Error fetching initial chats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlocked();
    fetchInitialChats();
  }, []);

  const fetchMoreChats = async () => {
    if (!lastVisible || loadingMore) return;

    setLoadingMore(true);
    try {
      const querySnapshot = await firestore()
        .collection('Users')
        .doc(currentUserUid)
        .collection('ChatRooms')
        .orderBy('gaingOrderTimeStamp', 'desc')
        .startAfter(lastVisible)
        .limit(pageSize)
        .get();

      const moreChats = querySnapshot.docs.map(doc => ({
        chatroomid: doc.id,
        userId: doc.data().userId,
      }));

      setPinnedChats(prevChats => [...prevChats, ...moreChats]);
      setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
    } catch (error) {
      console.error('Error fetching more chats:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const deleteChat = async chatroomid => {
    try {
      await firestore()
        .collection('Users')
        .doc(currentUserUid)
        .collection('ChatRooms')
        .doc(chatroomid)
        .delete();

      setPinnedChats(prevChats =>
        prevChats.filter(chat => chat.chatroomid !== chatroomid),
      );
    } catch (error) {
      console.error('Error deleting chat:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchInitialChats();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="small" color="#FF3131" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Chats</Text>
      </View>

      {pinnedChats.length === 0 ? (
        <Text style={styles.noChatsText}>No Chats</Text>
      ) : (
        <FlatList
          data={pinnedChats.filter(chat => !blockedUsers.includes(chat.userId))}
          renderItem={({ item }) => (
            <UserChat
              item={item}
              onDeleteChat={() => deleteChat(item.chatroomid)}
            />
          )}
          keyExtractor={item => item.chatroomid}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          onEndReached={fetchMoreChats}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore && (
              <ActivityIndicator size="small" color="#FF3131" />
            )
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'black',
  },
  header: {
    backgroundColor: '#1a1a1a',
    width: '95%',
    margin: 10,
    padding: 5,
    borderRadius: 3,
  },
  headerText: {
    color: color,
    fontSize: 25,
    marginLeft: 8,
  },
  noChatsText: {
    fontSize: 14,
    color: 'gray',
    textAlign: 'center',
    marginTop: 20,
  },
  listContainer: {
    justifyContent: 'center',
  },
});
