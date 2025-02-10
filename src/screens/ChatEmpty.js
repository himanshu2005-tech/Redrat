import React, {Component} from 'react';
import {Text, View, Image, Pressable} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import Bluing from '../texting/Bluing';
import {SharedElement} from 'react-navigation-shared-element';

export default function ChatEmpty({userDetails, id}) {
  const navigation = useNavigation();
  const formatTimestamp = timestamp => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    const formattedTime = date.toLocaleTimeString();
    return `${formattedTime}`;
  };

  const formatDate = timestamp => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    const formattedDate = date.toLocaleDateString();
    return `${formattedDate}`;
  };

  return (
    <Pressable
      style={{
        alignItems: 'center',
        flex: 1,
        justifySelf: 'flex-end',
        width: '100%',
      }}>
      <View
        style={{
          alignSelf: 'center',
          justifySelf: 'flex-end',
          marginTop: '50%',
          alignItems: 'center',
        }}>
        <Image
          source={{uri: userDetails?.profile_pic}}
          style={{
            height: 100,
            width: 100,
            borderRadius: 100 / 2,
            marginBottom: 8,
          }}
        />
        <Text style={{color: 'white', fontSize: 19}}>{userDetails.name}</Text>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            maxWidth: '80%',
          }}>
          <Bluing
            text={userDetails.bio}
            style={{color: 'grey', textAlign: 'center'}}
          />
        </View>
        <Pressable
          style={{
            backgroundColor: '#1a1a1a',
            marginTop: 15,
            borderRadius: 5,
            maxWidth: "80%",
          }}
          onPress={() =>
            navigation.navigate('UserProfile', {
              id: id,
            })
          }>
          <Text style={{color: 'white', fontSize: 15, padding: 10}}>
            View Profile
          </Text>
        </Pressable>
      </View>
    </Pressable>
  );
}
