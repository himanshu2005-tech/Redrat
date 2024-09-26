import React, {useEffect, useState} from 'react';
import {
  Text,
  View,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Image,
  Pressable,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

export default function PinnedChats({navigation}) {
  const [pinnedChats, setPinnedChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const currentUserUid = auth().currentUser.uid;

  const fetchPinnedChats = async () => {
    try {
      const pinnedChatsSnapshot = await firestore()
        .collection('Users')
        .doc(currentUserUid)
        .collection('ChatRooms')
        .get();

      const pinnedChatsData = pinnedChatsSnapshot.docs.map(doc => ({
        chatroomid: doc.id,
        ...doc.data(),
      }));

      const userDetailsPromises = pinnedChatsData.map(chat =>
        firestore().collection('Users').doc(chat.userId).get(),
      );

      const userDetailsSnapshots = await Promise.all(userDetailsPromises);
      const userDetails = userDetailsSnapshots.map((doc, index) => ({
        ...doc.data(),
        userId: pinnedChatsData[index].userId,
      }));

      const pinnedChatsWithUserDetails = pinnedChatsData.map((chat, index) => ({
        ...chat,
        userDetails: userDetails[index],
      }));

      console.log(pinnedChatsWithUserDetails);
      setPinnedChats(pinnedChatsWithUserDetails);
    } catch (error) {
      console.error('Error fetching pinned chats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPinnedChats();
  }, [currentUserUid]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPinnedChats();
  };

  const unpinChat = async chatroomid => {
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
      console.error('Error unpinning chat:', error);
    }
  };

  const renderChatItem = ({item}) => {
    const {userDetails, chatroomid} = item;
    return (
      <View style={styles.chatItemContainer}>
        <TouchableOpacity
          style={styles.chatItem}
          onPress={() => navigation.navigate('Chat', {id: userDetails.userId})}>
          <Image
            source={{uri: userDetails.profile_pic}}
            style={styles.avatar}
          />
          <Text style={styles.chatName}>{userDetails.name || 'User'}</Text>
        </TouchableOpacity>
        <Pressable
          style={styles.unpinButton}
          onPress={() => unpinChat(chatroomid)}>
          <Text style={{color: 'white'}}>Unpin</Text>
        </Pressable>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={{backgroundColor: 'black', flex: 1}}>
      <ActivityIndicator size="large" color="#FF3131" style={styles.loader} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Icon
          name="chevron-back"
          size={28}
          color="#FF3131"
          onPress={() => navigation.goBack()}
        />
        <Text style={styles.title}>Pinned Chats</Text>
      </View>
      {pinnedChats.length === 0 ? (
        <Text style={styles.noChatsText}>No pinned chats</Text>
      ) : (
        <FlatList
          data={pinnedChats}
          renderItem={renderChatItem}
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
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noChatsText: {
    fontSize: 18,
    color: 'gray',
    textAlign: 'center',
    marginTop: 20,
  },
  listContainer: {
    paddingHorizontal: 16,
  },
  chatItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  chatName: {
    flex: 1,
    fontSize: 18,
    color: 'white',
  },
  unpinButton: {
    padding: 8,
    borderColor: '#FF3131',
    borderWidth: 0.5,
    borderRadius: 5,
  },
  header: {
    backgroundColor: 'black',
    width: '100%',
    padding: 10,
    borderBottomWidth: 0.2,
    borderColor: '#ccc',
    margin: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    color: '#FF3131',
    marginLeft: 10,
    textAlign: 'center',
    letterSpacing: 1,
  },
});
