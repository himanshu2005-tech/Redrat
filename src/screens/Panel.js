import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Image,
  Pressable,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import Icon from 'react-native-vector-icons/Ionicons';

const Header = ({navigation, title, onPressIdCard}) => (
  <View style={styles.header}>
    <View style={styles.headerContent}>
      <Icon
        name="chevron-back"
        size={28}
        color="#FF3131"
        onPress={() => navigation.goBack()}
      />
      <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">{title}</Text>
    </View>
  </View>
);

const Panel = ({navigation, route}) => {
  const {network_id, network_name} = route.params;
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [userDetailsMap, setUserDetailsMap] = useState({});
  const [recording, setRecording] = useState(false);
  const [audioPath, setAudioPath] = useState('');
  const currentUserId = auth().currentUser.uid;

  useEffect(() => {
    const unsubscribe = firestore()
      .collection('Network')
      .doc(network_id)
      .collection('Panel')
      .orderBy('timestamp', 'desc')
      .onSnapshot(querySnapshot => {
        const msgs = querySnapshot.docs.map(doc => {
          return {id: doc.id, ...doc.data()};
        });
        setMessages(msgs);
      });

    return () => unsubscribe();
  }, [network_id]);

  useEffect(() => {
    const fetchUserDetails = async userId => {
      const userDoc = await firestore().collection('Users').doc(userId).get();
      if (userDoc.exists) {
        return userDoc.data();
      }
      return null;
    };

    const fetchAllUserDetails = async () => {
      const userIds = [...new Set(messages.map(message => message.senderId))];
      const userDetails = await Promise.all(userIds.map(fetchUserDetails));
      const userDetailsMap = userIds.reduce((acc, userId, index) => {
        acc[userId] = userDetails[index];
        return acc;
      }, {});
      setUserDetailsMap(userDetailsMap);
    };

    fetchAllUserDetails();
  }, [messages]);

  const sendMessage = async () => {
    if (newMessage.trim() === '' && audioPath === '') {
      return;
    }

    let messageData = {
      senderId: currentUserId,
      timestamp: firestore.FieldValue.serverTimestamp(),
    };

    if (newMessage.trim() !== '') {
      messageData.message = newMessage;
    }

    await firestore()
      .collection('Network')
      .doc(network_id)
      .collection('Panel')
      .add(messageData);

    setNewMessage('');
    setAudioPath('');
  };

  const renderItem = ({item}) => {
    const userDetails = userDetailsMap[item.senderId];

    if (!userDetails) {
      return null;
    }

    const isCurrentUser = item.senderId === currentUserId;

    const renderMessageContent = () => {
        return (
          <View
            style={[
              styles.messageContent,
              isCurrentUser
                ? styles.currentUserMessageContent
                : styles.otherUserMessageContent,
            ]}>
            {!isCurrentUser && (
              <Pressable onPress={() => navigation.navigate("UserProfile", {id: item.senderId})}>
              <Text style={{color: 'white', fontWeight: 'bold'}}>
                {userDetails.name}
              </Text>
              </Pressable>
            )}
            <Text
              style={
                isCurrentUser ? styles.currentUserText : styles.otherUserText
              }>
              {item.message}
            </Text>
          </View>
        );
    };

    return (
      <View
        style={[
          styles.messageContainer,
          isCurrentUser ? styles.currentUserMessage : styles.otherUserMessage,
        ]}>
        {!isCurrentUser && (
          <Pressable onPress={() => navigation.navigate("UserProfile", {id: item.senderId})}>
          <Image
            source={{uri: userDetails.profile_pic}}
            style={styles.profileImage}
          />
          </Pressable>
        )}
        {renderMessageContent()}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Header
        navigation={navigation}
        title={`${network_name}'s Panel`}
        onPressIdCard={() => setModalVisible(true)}
      />
      <FlatList
        data={messages}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.messageList}
      />
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type a message"
          value={newMessage}
          onChangeText={setNewMessage}
          placeholderTextColor={"#ccc"}
        />
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  header: {
    position: 'sticky',
    top: 0,
    zIndex: 100,
    backgroundColor: 'black',
    width: '100%',
    paddingVertical: 15,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 0.2,
    borderColor: '#ccc',
  },
  currentUserText: {
    color: '#FF3131',
  },
  otherUserText: {
    color: 'white',
  },
  headerContent: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  title: {
    flex: 1,
    fontSize: 24,
    color: 'white',
    marginLeft: 10,
    textAlign: 'center',
    maxWidth: "90%"
  },
  messageList: {
    padding: 10,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 10,
    alignItems: 'center',
  },
  currentUserMessage: {
    justifyContent: 'flex-end',
  },
  otherUserMessage: {
    justifyContent: 'flex-start',
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  messageContent: {
    maxWidth: '70%',
    padding: 10,
    borderRadius: 10,
  },
  currentUserMessageContent: {
    backgroundColor: '#FFEDED',
    marginLeft: 10,
    alignItems: 'flex-end',
  },
  otherUserMessageContent: {
    backgroundColor: '#FF3131',
    marginRight: 10,
  },
  senderName: {
    fontWeight: 'bold',
    color: '#FF3131',
    marginBottom: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    color: "white",
  },
  input: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    paddingHorizontal: 10,
    color: "#ccc",
  },
  sendButton: {
    backgroundColor: '#FF3131',
    borderRadius: 20,
    paddingHorizontal: 20,
    justifyContent: 'center',
    marginLeft: 10,
  },
  sendButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#FF3131',
  },
  modalButton: {
    padding: 10,
    borderRadius: 5,
    marginTop: 20,
    width: '50%',
    alignItems: 'center',
    backgroundColor: '#FF3131',
  },
  modalButtonText: {
    fontSize: 16,
    color: 'white',
  },
  voiceMessageContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  recordButton: {
    backgroundColor: '#FF3131',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  recordButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  audioMessage: {
    backgroundColor: '#007bff', // customize background color for audio messages
  },
  
});

export default Panel;
