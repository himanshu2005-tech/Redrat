import React, { useState, useEffect } from 'react';
import {
  Text,
  View,
  FlatList,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import UserChat from './UserChat';

export default function Chats() {
  const [pinnedChats, setPinnedChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const currentUserUid = auth().currentUser.uid;

  useEffect(() => {
    const unsubscribe = firestore()
      .collection('Users')
      .doc(currentUserUid)
      .collection('ChatRooms')
      .orderBy('gaingOrderTimeStamp', 'desc')
      .onSnapshot(snapshot => {
        const pinnedChatsData = snapshot.docs.map(doc => ({
          chatroomid: doc.id,
          userId: doc.data().userId,
        }));

        setPinnedChats(pinnedChatsData);
        setLoading(false); 
        if (refreshing) {
          setRefreshing(false); 
        }
      }, error => {
        console.error('Error fetching pinned chats:', error);
        setLoading(false); 
        if (refreshing) {
          setRefreshing(false);
        }
      });

    return () => unsubscribe();
  }, [currentUserUid]);

  const onRefresh = () => {
    setRefreshing(true);
  };

  const renderSkeletonPlaceholder = () => (
    <SkeletonPlaceholder backgroundColor="#FFEDED">
      <SkeletonPlaceholder.Item flexDirection="row" alignItems="center" padding={10}>
        <SkeletonPlaceholder.Item width={100} height={20} borderRadius={4} />
      </SkeletonPlaceholder.Item>
      <SkeletonPlaceholder.Item marginTop={10} flexDirection="row" alignItems="center" padding={10}>
        <SkeletonPlaceholder.Item width={100} height={20} borderRadius={4} />
      </SkeletonPlaceholder.Item>
    </SkeletonPlaceholder>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        {renderSkeletonPlaceholder()}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {pinnedChats.length === 0 ? (
        <Text style={styles.noChatsText}>No pinned chats</Text>
      ) : (
        <FlatList
          data={pinnedChats}
          renderItem={({ item }) => <UserChat item={item} />}
          keyExtractor={item => item.chatroomid}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
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
  noChatsText: {
    fontSize: 14,
    color: 'gray',
    textAlign: 'center',
    marginTop: 20,
  },
  listContainer: {
    paddingHorizontal: 16,
  },
});
