import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import Icon from 'react-native-vector-icons/Ionicons';
import Bluing from '../texting/Bluing';
import PinnedAnnouncement from './PinnedAnnoucement';
import color from './color';
import {SharedElement} from 'react-navigation-shared-element';

const Header = ({navigation, title}) => (
  <View style={styles.header}>
    <View style={{flexDirection: 'row', alignItems: 'center'}}>
      <Icon
        name="chevron-back"
        size={28}
        color={color}
        onPress={() => navigation.goBack()}
      />
      <Text style={{textAlign: 'center', color: 'white', fontSize: 18}} numberOfLines={1} ellipsizeMode="tail">
        {title}
      </Text>
    </View>
  </View>
);

const formatTimestamp = timestamp => {
  if (!timestamp) return '';
  const date = new Date(timestamp.seconds * 1000);
  const options = {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  };
  return new Intl.DateTimeFormat('en-US', options).format(date);
};

const Panel = ({navigation, route}) => {
  const {network_id, panel_name, admin} = route.params;
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [lastVisible, setLastVisible] = useState(null);
  const [loading, setLoading] = useState(false);
  const [networkDetails, setNetworkDetails] = useState(null);
  const currentUserId = auth().currentUser.uid;
  const PAGE_SIZE = 10;

  const fetchMessages = async (initial = false) => {
    if (loading) return;

    setLoading(true);
    try {
      const query = firestore()
        .collection('Network')
        .doc(network_id)
        .collection('Panel')
        .orderBy('timestamp', 'desc')
        .limit(PAGE_SIZE);

      const snapshot = initial
        ? await query.get()
        : await query.startAfter(lastVisible).get();

      if (!snapshot.empty) {
        const newMessages = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        setMessages(prev =>
          initial ? newMessages : [...prev, ...newMessages],
        );
        setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally{
      console.log("Loaidnng ")
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMessages(true);
  }, [network_id]);

  const loadMoreMessages = () => {
    if (!loading && lastVisible) {
      fetchMessages();
    }
  };

  const sendMessage = async () => {
    if (newMessage.trim() === '') return;

    try {
      await firestore()
        .collection('Network')
        .doc(network_id)
        .collection('Panel')
        .add({
          senderId: currentUserId,
          timestamp: firestore.FieldValue.serverTimestamp(),
          message: newMessage,
        });

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      navigation.goBack()
    }
  };

  return (
    <View style={styles.container}>
      <Header navigation={navigation} title={panel_name} />
      
      <FlatList
        data={messages}
        renderItem={({item}) => (
          <PinnedAnnouncement network_id={network_id} announcement_id={item.id} />
        )}
        keyExtractor={item => item.id}
        ListFooterComponent={
          loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading...</Text>
            </View>
          ) : (
            <TouchableOpacity style={styles.loadMoreButton} onPress={loadMoreMessages}>
              <Text style={styles.loadMoreText}>Load More</Text>
            </TouchableOpacity>
          )
        }
      />
      
      {currentUserId === admin && (
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type an announcement"
            placeholderTextColor="#ccc"
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
          />
          <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
            <Icon name="send-outline" size={25} color="white" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: 'black'},
  header: {backgroundColor: 'black', padding: 10},
  announcementContainer: {
    backgroundColor: '#1a1a1a',
    margin: 10,
    padding: 10,
    borderRadius: 5,
  },
  messageText: {color: 'white', fontSize: 16},
  timestamp: {color: '#ccc', fontSize: 12, textAlign: 'right'},
  loadMoreButton: {
    backgroundColor: color,
    padding: 5,
    borderRadius: 5,
    margin: 10,
  },
  loadMoreText: {color: 'white', textAlign: 'center'},
  inputContainer: {flexDirection: 'row', padding: 10},
  input: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    color: 'white',
    padding: 10,
    borderRadius: 5,
  },
  sendButton: {
    marginLeft: 10,
    backgroundColor: color,
    padding: 10,
    borderRadius: 5,
  },
  loadingText: {color: 'white', textAlign: 'center', padding: 10},
  loadingContainer: {padding: 10, alignItems: 'center'},
});

export default Panel;
