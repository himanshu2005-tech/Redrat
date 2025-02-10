import React, {useEffect, useState} from 'react';
import {
  Pressable,
  Text,
  View,
  FlatList,
  Image,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import firestore from '@react-native-firebase/firestore';
import UserComponent from './UserComponent';
import color from './color';
import {SharedElement} from 'react-navigation-shared-element';

export default function UserStatus({navigation, route}) {
  const {id, status} = route.params;
  const [userList, setUserList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserStatus = async () => {
      try {
        const userDoc = await firestore().collection('Users').doc(id).get();
        const userData = userDoc.data();
        const ids = userData[status] || [];

        const usersPromises = ids.map(async userId => {
          const userRef = await firestore()
            .collection('Users')
            .doc(userId)
            .get();
          return {id: userId, ...userRef.data()};
        });

        const users = await Promise.all(usersPromises);
        setUserList(users);
      } catch (error) {
        console.error('Error fetching user status:', error);
        setError('Failed to load user data.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserStatus();
  }, [id, status]);

  const unFollow = async () => {
    try {
    } catch (error) {
      console.warn(error);
    }
  };
  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'black',
        }}>
        <ActivityIndicator size="large" color={color} />
      </View>
    );
  }

  if (error) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'black',
        }}>
        <Text style={{color: 'white'}}>{error}</Text>
      </View>
    );
  }

  if (userList.length === 0) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: 'black',
        }}>
        <View style={{padding: 10, flexDirection: 'row', alignItems: 'center'}}>
          <Icon
            name="chevron-back"
            size={28}
            color={color}
            onPress={() => navigation.goBack()}
          />
          <Text style={{color: 'white', fontSize: 19}}>
            {status === 'followers' ? 'Followers' : 'Following'}
          </Text>
        </View>
        <Text style={{margin: 10, alignSelf: 'center', fontSize: 15, color: 'grey', marginTop: "50%"}}>No {status} yet</Text>
      </View>
    );
  }

  return (
    <View style={{backgroundColor: 'black', flex: 1}}>
      <View style={{padding: 10, flexDirection: 'row', alignItems: 'center'}}>
        <Icon
          name="chevron-back"
          size={28}
          color={color}
          onPress={() => navigation.goBack()}
        />
        <Text style={{color: 'white', fontSize: 19}}>
          {status === 'followers' ? 'Followers' : 'Following'}
        </Text>
      </View>

      <FlatList
        data={userList}
        keyExtractor={item => item.id}
        renderItem={({item}) => (
          <UserComponent item={item} navigation={navigation} />
        )}
      />
    </View>
  );
}
