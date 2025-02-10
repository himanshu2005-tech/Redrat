import React, {useState, useEffect} from 'react';
import {Text, View, Image, Pressable, AccessibilityInfo} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import {SharedElement} from 'react-navigation-shared-element';

export default function UserComponent({item, navigation}) {
  const [isFollowing, setIsFollowing] = useState(false);
  return (
    <Pressable
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        justifyContent: 'space-between',
      }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
          {item.profile_pic ? (
            <Image
              source={{uri: item.profile_pic}}
              style={{
                width: 45,
                height: 45,
                borderRadius: 20,
                marginRight: 10,
              }}
            />
          ) : (
            <Icon
              name="person-circle-outline"
              size={40}
              color="white"
              style={{marginRight: 10}}
            />
          )}
          <View>
            <Text style={{color: 'white', fontSize: 19, fontWeight: 'bold'}}>
              {item.name}
            </Text>
            <Text
              style={{color: 'grey', fontSize: 14, maxWidth: '80%'}}
              numberOfLines={1}>
              {item.bio}
            </Text>
          </View>
        </View>
      </View>
      <Pressable
        onPress={() => navigation.navigate('UserProfile', {id: item.id})}
        style={{
          backgroundColor: '#1a1a1a',
          alignSelf: 'center',
          paddingHorizontal: 8,
          paddingVertical: 5,
          borderRadius: 3,
          position: 'absolute',
          right: 5
        }}>
        <Text style={{color: 'white', fontSize: 16}}>View Profile</Text>
      </Pressable>
    </Pressable>
  );
}





