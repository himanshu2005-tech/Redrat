import React, { useState, useEffect } from 'react';
import { Pressable, Text, View, FlatList, ActivityIndicator } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import Pic from './Pic';

export default function HashPictures({ route, navigation }) {
  const { hash } = route.params;
  const [pictures, setPictures] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPic = async () => {
    try {
      const pictureSnapshot = await firestore()
        .collection("Hash")
        .doc(hash)
        .collection("Pictures")
        .orderBy("createdAt", "desc")
        .get();

      const pictureList = pictureSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      setPictures(pictureList);
      setLoading(false);
    } catch (error) {
      console.warn('Error fetching pictures:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPic();
  }, []);

  const renderItem = ({ item }) => (
    <Pic item={item} id={item.id} navigation={navigation} hash_id={hash} />
  );

  return (
    <View style={{ backgroundColor: 'black', flex: 1 }}>
      <View>
        <Pressable
          style={{
            backgroundColor: '#1a1a1a',
            margin: 10,
            padding: 10,
            borderRadius: 10,
            alignItems: 'center',
          }}
          onPress={() =>
            navigation.navigate('AddHashPicture', {
              hash: hash,
            })
          }>
          <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>
            Add Post
          </Text>
        </Pressable>
      </View>

      <View style={{ flex: 1 }}>
        {loading ? (
          <ActivityIndicator size="large" color="#FF3131" />
        ) : (
          <FlatList
            data={pictures}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            numColumns={3} 
            columnWrapperStyle={{ justifyContent: 'space-around' }} 
            contentContainerStyle={{ padding: 5 }} 
            ListEmptyComponent={() => (
              <Text style={{ color: 'white', textAlign: 'center', marginTop: 20 }}>
                No pictures available.
              </Text>
            )}
          />
        )}
      </View>
    </View>
  );
}
