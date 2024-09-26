import React, { useState, useEffect } from 'react';
import { Text, View, Image, Pressable, ActivityIndicator } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import { useNavigation } from '@react-navigation/native';

export default function User({ id }) {
  const [pic, setPic] = useState();
  const [name, setName] = useState();
  const [loading, setLoading] = useState(true); // State to handle loading

  const navigation = useNavigation();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await firestore().collection('Users').doc(id).get();
        setPic(data.data().profile_pic);
        setName(data.data().name);
      } catch (error) {
        console.warn(error);
      } finally {
        setLoading(false); 
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <ActivityIndicator size="small" color="white" />;
  }

  return (
    <Pressable
      style={{
        marginRight: 20,
        alignItems: 'center',
        padding: 5,
        backgroundColor: '#1a1a1a',
        borderRadius: 8,
        flexDirection: 'row',
        gap: 10,
        alignItems: 'center',
      }}
      onPress={() =>
        navigation.navigate('UserProfile', {
          id: id,
        })
      }
    >
      <Image source={{ uri: pic }} style={{ height: 40, width: 40, borderRadius: 80 }} />
      <Text style={{ color: 'white', maxWidth: '100%', fontWeight: 'bold' }} numberOfLines={1} ellipsizeMode="tail">
        {name}
      </Text>
    </Pressable>
  );
}
