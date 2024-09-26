import React, { useState, useEffect } from 'react';
import { Text, View, Image, Pressable, ActivityIndicator } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';

export default function Hash({ id, showing }) {
  const [hash, setHash] = useState(null); 
  const navigation = useNavigation();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await firestore().collection('Hash').doc(id).get();
        if (data.exists) {
          setHash(data.data());
        }
      } catch (error) {
        console.warn(error);
      }
    };

    fetchData();
  }, [id]);

  if (!hash) {
    return (
      <View style={{ justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <ActivityIndicator color={"white"} />
      </View>
    );
  }

  const currentTime = new Date().getTime();
  const expiresAt = hash.expiresAt.toMillis(); 

  if (currentTime >= expiresAt) {
    return null; 
  }

  return (
    <Pressable 
      onPress={() => {
        if (!showing) {
          navigation.navigate("HashScreen", { hash: id });
        } else {
          showing();
        }
      }}
    >
      <LinearGradient
        colors={['#FF512F', '#DD2476']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{
          marginRight: 10,
          alignItems: 'center',
          padding: 5,
          backgroundColor: "#1a1a1a",
          borderRadius: 8,
          flexDirection: 'row',
          gap: 10,
          alignItems: 'center',
          marginTop: 10
        }}
      >
        <Image
          source={{ uri: hash.imageUri }}
          style={{ height: 40, width: 40, borderRadius: 80 }}
        />
        <Text style={{ color: 'white', fontSize: 14, fontWeight: 'bold' }}>{hash.hash}</Text>
      </LinearGradient>
    </Pressable>
  );
}
