import React, { useState, useEffect } from 'react';
import { Text, View, FlatList, TouchableOpacity, Pressable } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import FriendUser from './FriendUser';

export default function Request({ navigation }) {
  const [requestData, setRequestData] = useState([]);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const unsubscribe = firestore()
          .collection('Users')
          .doc(auth().currentUser.uid)
          .collection('Requests') 
          .onSnapshot(snapshot => {
            const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setRequestData(requests);
          });
        return () => unsubscribe();
      } catch (error) {
        console.warn(error);
      }
    };

    fetchRequests();
  }, []);

  const handlePress = (request) => {
    navigation.navigate('FriendUser', { request });
  };

  return (
    <View style={{ flex: 1, backgroundColor: 'black' }}>
      <View style={{ flexDirection: 'row', padding: 10, gap: 15 }}>
        <Icon name="close" size={28} color="#FF3131" onPress={() => navigation.goBack()} />
        <Text style={{ color: 'white', fontSize: 20, color: "#FF3131", fontWeight: '600' }}>Requests</Text>
      </View>
      <FlatList
        data={requestData}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) =><FriendUser item={item} />}
      />
    </View>
  );
}
