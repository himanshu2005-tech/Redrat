import React, {useState, useEffect} from 'react';
import {View, Text, Image, StyleSheet} from 'react-native';
import firestore from '@react-native-firebase/firestore';

const MessageItem = ({senderId, message}) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      const userDoc = await firestore().collection('Users').doc(senderId).get();
      setUser(userDoc.data());
    };

    fetchUser();
  }, [senderId]);

  if (!user) {
    return null;
  }

  return (
    <View style={styles.messageContainer}>
      <Image source={{uri: user.profile_pic}} style={styles.profilePic} />
      <View>
        <Text style={styles.userName}>{user.name}</Text>
        <Text style={styles.messageText}>{message}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  profilePic: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  userName: {
    fontWeight: 'bold',
    color: '#FF3131',
  },
  messageText: {
    color: '#000',
  },
});

export default MessageItem;
