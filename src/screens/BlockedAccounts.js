import React, {Component} from 'react';
import {
  Text,
  View,
  Pressable,
  Image,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import Icon from 'react-native-vector-icons/Ionicons';
import {FlashList} from '@shopify/flash-list';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';
import unBlockUser from './unBlockUser';
import color from './color';
import {SharedElement} from 'react-navigation-shared-element';

const DisplayUser = ({userId, onUnblock}) => {
  const [userDetails, setUserDetails] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [blockLoading, setBlockLoading] = React.useState(false);

  const handleUnBlock = async id => {
    setBlockLoading(true);
    await unBlockUser({
      blocker_id: auth().currentUser.uid,
      blocked_id: id,
    });
    setBlockLoading(false);
    onUnblock(id);
  };

  React.useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        setLoading(true);
        const data = await firestore().collection('Users').doc(userId).get();
        if (data.exists) {
          setUserDetails(data.data());
        }
      } catch (error) {
        console.warn(error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserDetails();
  }, [userId]);

  if (loading) {
    return (
      <SkeletonPlaceholder>
        <View style={{flexDirection: 'row', padding: 15, alignItems: 'center'}}>
          <View
            style={{width: 38, height: 38, borderRadius: 20, marginRight: 10}}
          />
          <View style={{flex: 1}}>
            <View
              style={{
                width: '60%',
                height: 16,
                borderRadius: 4,
                marginBottom: 5,
              }}
            />
            <View style={{width: '80%', height: 14, borderRadius: 4}} />
          </View>
        </View>
      </SkeletonPlaceholder>
    );
  }

  return (
    <Pressable
      style={{
        justifyContent: 'space-between',
        flexDirection: 'row',
        alignItems: 'center',
      }}>
      <View style={{flexDirection: 'row', padding: 15, alignItems: 'center'}}>
        <Image
          source={{uri: userDetails?.profile_pic}}
          style={{height: 38, width: 38, borderRadius: 20, marginRight: 10}}
        />
        <View>
          <Text
            style={{
              color: 'white',
              fontSize: 16,
              maxWidth: '80%',
              fontWeight: 'bold',
            }}
            numberOfLines={1}
            ellipsizeMode="tail">
            {userDetails?.name || 'Unknown User'}
          </Text>
          <Text
            style={{color: 'grey', fontSize: 14, maxWidth: '80%'}}
            numberOfLines={1}
            ellipsizeMode="tail">
            {userDetails?.bio || 'Unknown Bio'}
          </Text>
        </View>
      </View>
      <View style={{alignItems: 'center', position: 'absolute', right: 10}}>
        <Pressable
          style={{
            backgroundColor: color,
            paddingHorizontal: 10,
            paddingVertical: 8,
            borderRadius: 3,
          }}
          disabled={blockLoading}
          onPress={() => handleUnBlock(userId)}>
          {blockLoading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={{color: 'white', fontWeight: 'bold'}}>
              UnBlock User
            </Text>
          )}
        </Pressable>
      </View>
    </Pressable>
  );
};

export default function BlockedAccount({navigation}) {
  const [blockedUsers, setBlockedUsers] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchBlockedUsers = async () => {
      try {
        const data = await firestore()
          .collection('Users')
          .doc(auth().currentUser.uid)
          .get();
        setBlockedUsers(data.data().blockedUsers);
        setLoading(false);
      } catch (error) {
        console.log(error);
        setLoading(false);
      }
    };

    fetchBlockedUsers();
  }, []);

  const handleUnblockUser = async userId => {
    const success = await unBlockUser(auth().currentUser.uid, userId);
    console.log(success);
    setBlockedUsers(prevUsers => prevUsers.filter(id => id !== userId));
  };

  if (loading) {
    return (
      <View
        style={{
          backgroundColor: 'black',
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <ActivityIndicator size="small" color={color} />
      </View>
    );
  }

  return (
    <View style={{backgroundColor: 'black', flex: 1}}>
      <View style={{flexDirection: 'row', padding: 10, gap: 7}}>
        <Icon
          name="chevron-back"
          size={28}
          color={color}
          onPress={() => navigation.goBack()}
        />
        <Text
          style={{
            color: 'white',
            fontWeight: 'bold',
            fontSize: 18,
            marginLeft: 7,
          }}>
          Blocked Accounts
        </Text>
      </View>

      <FlashList
        data={blockedUsers}
        renderItem={({item}) => (
          <DisplayUser userId={item} onUnblock={handleUnblockUser} />
        )}
        estimatedItemSize={70}
        keyExtractor={item => item}
        ListEmptyComponent={() => (
          <View
            style={{
              flex: 1,
              backgroundColor: 'black',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Text style={{color: 'grey', textAlign: 'center', marginTop: 20, fontSize: 15}}>No Blocked Users</Text>
          </View>
        )}
      />
    </View>
  );
}
