import React, {useEffect, useState} from 'react';
import {View, Image, Pressable, Dimensions, Text} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import Bluing from '../texting/Bluing';
import Icon from 'react-native-vector-icons/Ionicons';
import {SharedElement} from 'react-navigation-shared-element';

export default function Pic({item, navigation, id, hash_id}) {
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height / 2;
  const imageSize = screenWidth - 20;
  const [userDetails, setUserDetails] = useState([]);
  const [userid, setUserid] = useState();

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        let userId;
        const data = await firestore()
          .collection('Hash')
          .doc(hash_id)
          .collection('Pictures')
          .doc(id)
          .get();
        userId = data.data().postedBy;
        setUserid(userId);
        const userDeatils = await firestore()
          .collection('Users')
          .doc(userId)
          .get();
        setUserDetails(userDeatils.data());
      } catch (error) {
        console.warn(error);
      }
    };
    fetchUserDetails();
  }, []);
  return (
    <Pressable style={{margin: 5}}>
      <Pressable
        style={{
          flexDirection: 'row',
          marginBottom: 9,
          alignItems: 'center',
          gap: 10,
          backgroundColor: '#1a1a1a',
          padding: 8,
          borderRadius: 7,
        }}
        onPress={() =>
          navigation.navigate('UserProfile', {
            id: userid,
          })
        }>
        <Image
          source={{uri: userDetails.profile_pic}}
          style={{height: 40, width: 40, borderRadius: 100}}
        />
        <Text style={{color: 'white', fontSize: 16}}>{userDetails.name}</Text>
      </Pressable>
      <Image
        source={{uri: item.imageUri}}
        style={{
          width: imageSize,
          height: screenHeight,
        }}
        resizeMode="cover"
      />
      <View style={{backgroundColor: '#1a1a1a', padding: 8, marginTop: 10, flexDirection: 'row', justifyContent:'space-between', alignItems: 'center'}}>
        <Bluing
          text={item.title}
          style={{color: 'white', fontSize: 15, borderRadius: 7}}
        />
        <Icon name="chatbox-outline" size={25} color="white" onPress={() => navigation.navigate("CommentExpand", {
          commentPath: `Hash/${hash_id}/Pictures/${id}`
        })}/>
      </View>
    </Pressable>
  );
}
