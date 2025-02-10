import React, { useEffect, useState } from 'react';
import { View, FlatList, Text } from 'react-native';
import RenderInboxMessage from './RenderInboxMessage';
import { format } from 'date-fns';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import color from './color';
import {SharedElement} from 'react-navigation-shared-element';

export default function Inbox({route}) {
  const [allMessages, setAllMessages] = useState([])
  useEffect(() => {
    const unsubscribe = firestore()
      .collection("Users")
      .doc(auth().currentUser.uid)
      .collection('Inbox')
      .orderBy('createdAt', 'desc')
      .limit(50)
      .onSnapshot(
        snapshot => {
          const fetchedMessages = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          }));
          console.log(fetchedMessages); 
          setAllMessages(fetchedMessages)
        },
        error => {
          console.warn(error);
        }
      );
  
    return () => unsubscribe();
  }, []);
  
  useEffect(() => {
    const userId = auth().currentUser?.uid;
    if (!userId) return;

    firestore()
      .collection('Users')
      .doc(userId)
      .update({
        lastReadInboxTimestamp: firestore.FieldValue.serverTimestamp(),
      })
      .then(() => console.log('Updated lastReadInboxTimestamp'))
      .catch(error => console.warn('Error updating timestamp:', error));
  }, []);

  const groupMessages = messagesList => {
    const grouped = {};
    if (!Array.isArray(messagesList)) {
      console.warn('Expected an array, but received:', messagesList);
      return {}; 
    }

    messagesList.forEach(item => {
      const createdAt = item.createdAt?.seconds
        ? new Date(item.createdAt.seconds * 1000)
        : new Date();
      const dateKey = format(createdAt, 'yyyy-MM-dd');

      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(item);
    });

    return grouped;
  };

  // Safely check if allMessages is defined and is an array
  const groupedMessages = Array.isArray(allMessages) ? groupMessages(allMessages) : {};

  const renderSection = (date, messages) => {
    if (!messages.length) return null;

    return (
      <View key={date}>
        <View
          style={{
            backgroundColor: '#1a1a1a',
            width: '95%',
            alignSelf: 'center',
            borderRadius: 3,
            paddingVertical: 5,
            marginVertical: 5,
          }}>
          <Text
            style={{
              fontWeight: '900',
              fontSize: 25,
              color: 'white',
              paddingLeft: 20,
            }}>
            {date}
          </Text>
        </View>
        {messages.map(item => (
          <RenderInboxMessage key={item.id} item={item} />
        ))}
      </View>
    );
  };

  if (!Array.isArray(allMessages) || !allMessages.length) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'black',
        }}>
        <Text style={{ color: 'grey', fontSize: 18 }}>No Inbox Messages</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: 'black' }}>
      <View
        style={{
          backgroundColor: '#1a1a1a',
          width: '95%',
          margin: 10,
          padding: 5,
          borderRadius: 3,
        }}>
        <Text
          style={{
            color: color,
            fontSize: 25,
            fontFamily: 'title3',
            marginLeft: 8,
          }}>
          Inbox
        </Text>
      </View>
      <FlatList
        data={Object.entries(groupedMessages)}
        keyExtractor={([date]) => date}
        renderItem={({ item }) => renderSection(item[0], item[1])}
        contentContainerStyle={{ paddingBottom: 80 }}
      />
    </View>
  );
}
