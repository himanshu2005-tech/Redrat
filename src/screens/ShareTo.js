import React, { useState, useEffect } from 'react';
import { Text, View, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import {SHA256} from 'crypto-js';
import Icon from 'react-native-vector-icons/Ionicons';

export default function ShareTo({ route, navigation }) {
  const { post_id, network_id, post_title, post_information, network_name } = route.params;
  const [chats, setChats] = useState([]);
  const [sending, setSending] = useState({});

  useEffect(() => {
    const getChats = async () => {
      try {
        const unsubscribe = firestore()
          .collection('Users')
          .doc(auth().currentUser.uid)
          .collection('ChatRooms')
          .onSnapshot(async (snapshot) => {
            const chatDataPromises = snapshot.docs.map(async (doc) => {
              const chatData = doc.data();
              const userDoc = await firestore()
                .collection('Users')
                .doc(chatData.userId)
                .get();
              return {
                id: doc.id,
                data: chatData,
                user: userDoc.exists ? userDoc.data() : null,
              };
            });
            const chatData = await Promise.all(chatDataPromises);
            setChats(chatData);
            console.log(chatData);
          });
        return () => unsubscribe();
      } catch (error) {
        console.warn(error);
      }
    };

    getChats();
  }, []);

  const handleSend = async (chatId, userId) => {
    setSending((prev) => ({ ...prev, [chatId]: 'sending' }));
    try {
      await firestore()
        .collection('ChatRooms')
        .doc(chatId)
        .collection('Messages')
        .add({
          post_id,
          network_id,
          createdAt: firestore.FieldValue.serverTimestamp(),
          senderId: auth().currentUser.uid,
          post_title,
          post_information,
          network_name,
          type: "post_share"
        });
        console.log(userId)
      setSending((prev) => ({ ...prev, [chatId]: 'sent' }));
      const sortedUids = [userId, auth().currentUser.uid].sort();
      const concatenatedIds = sortedUids.join('');
      const generatedHash = SHA256(concatenatedIds).toString();

      const chatroomDocRef = firestore().collection('ChatRooms').doc(chatId);

      await firestore()
            .collection('Users')
            .doc(auth().currentUser.uid)
            .collection('ChatRooms')
            .doc(chatId)
            .update({
                lastMessageText: "Post",
                gaingOrderTimeStamp: firestore.FieldValue.serverTimestamp()
            });
        await firestore()
            .collection('Users')
            .doc(userId)
            .collection('ChatRooms')
            .doc(generatedHash)
            .update({
                lastMessageText: "Post",
                gaingOrderTimeStamp: firestore.FieldValue.serverTimestamp()
            });

        await chatroomDocRef.set({
            lastMessageText: "Post",
            lastMessageTimestamp: firestore.FieldValue.serverTimestamp(),
        });

      console.log('Post shared successfully');
    } catch (error) {
      setSending((prev) => ({ ...prev, [chatId]: 'error' }));
      console.warn('Error sharing post:', error);
    }
  };

  return (
    <View style={{ backgroundColor: 'black', flex: 1 }}>
      <View
        style={{
          backgroundColor: 'black',
          padding: 15,
          borderBottomWidth: 0.7,
          borderColor: 'grey',
          flexDirection:'row',
          gap:20
        }}
      >
      <Icon name="chevron-down-outline" size={24} color="#FF3131" style={{alignSelf: 'left'}} onPress={()=> navigation.goBack()} />
        <Text
          style={{
            color: '#FF3131',
            fontSize: 18,
            fontWeight: 'bold',
            textAlign: 'center',
          }}
        >
          Share to
        </Text>
      </View>
      {chats.map((chat) => (
        <View
          key={chat.id}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            borderBottomWidth: 1,
            borderBottomColor: '#ccc',
            justifyContent: 'space-between',
            padding: 10,
          }}
        >
          {chat.user && (
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <Image
                source={{ uri: chat.user.profile_pic }}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  marginRight: 10,
                }}
              />
              <Text style={{ fontSize: 18, color: 'white', flex: 1 }}>
                {chat.user.name}
              </Text>
            </View>
          )}
          <TouchableOpacity
            style={{
              backgroundColor: sending[chat.id] === 'sent' ? 'black' : '#FF3131',
              paddingHorizontal: 10,
              borderRadius: 5,
              paddingVertical: 3,
            }}
            onPress={() => handleSend(chat.id, chat.data.userId)}
            disabled={sending[chat.id] === 'sending' || sending[chat.id] === 'sent'}
          >
            {sending[chat.id] === 'sending' ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={{ color: sending[chat.id] === 'sent' ? '#FF3131' : 'white' }}>
                {sending[chat.id] === 'sent' ? 'Sent' : 'Send'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
}
