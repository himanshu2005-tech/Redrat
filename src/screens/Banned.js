import React, { useEffect, useState } from 'react';
import { Pressable, Text, View, Image, Alert, TextInput, RefreshControl } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import Icon from 'react-native-vector-icons/Ionicons';
import { FlashList } from '@shopify/flash-list';
import color from './color';
import {SharedElement} from 'react-navigation-shared-element';

const DisplayUser = ({ userId, network_id, onUnban }) => {
  const [userDetails, setUserDetails] = useState({});

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const data = await firestore().collection('Users').doc(userId).get();
        if (data.exists) {
          setUserDetails(data.data());
        }
      } catch (error) {
        console.warn(error);
      }
    };
    fetchUserDetails();
  }, [userId]);

  const unBan = async () => {
    try {
      await firestore().collection('Network').doc(network_id).update({
        bannedUsers: firestore.FieldValue.arrayRemove(userId),
      });
      Alert.alert('User unbanned', 'The user has been successfully unbanned.');
      onUnban(userId);
    } catch (error) {
      console.warn(error);
      Alert.alert('Error', 'There was an error unbanning the user.');
    }
  };

  return (
    <Pressable style={{ justifyContent: 'space-between', flexDirection: 'row', alignItems: 'center' }}>
      <View style={{ flexDirection: 'row', padding: 15, alignItems: 'center' }}>
        <Image
          source={{ uri: userDetails.profile_pic }}
          style={{ height: 38, width: 38, borderRadius: 20, marginRight: 10 }}
        />
        <Text style={{ color: 'white', fontSize: 16, maxWidth: "80%" }} numberOfLines={1} ellipsizeMode="tail">
          {userDetails.name || 'Unknown User'}
        </Text>
      </View>
      <View style={{ alignItems: 'center' }}>
        <Pressable style={{ backgroundColor: color, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 3 }} onPress={unBan}>
          <Text style={{ color: 'white', fontWeight: 'bold' }}>Unban User</Text>
        </Pressable>
      </View>
    </Pressable>
  );
};

export default function Banned({ route, navigation }) {
  const { network_id } = route.params;
  const [bannedUsers, setBannedUsers] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [userDetails, setUserDetails] = useState({});

  const fetchUsers = async () => {
    try {
      const data = await firestore()
        .collection('Network')
        .doc(network_id)
        .get();
      if (data.exists) {
        const bannedUsersList = data.data().bannedUsers || [];
        setBannedUsers(bannedUsersList);

        const details = {};
        await Promise.all(bannedUsersList.map(async (userId) => {
          const userDoc = await firestore().collection('Users').doc(userId).get();
          if (userDoc.exists) {
            details[userId] = userDoc.data();
          }
        }));
        setUserDetails(details);
      }
    } catch (error) {
      console.warn(error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [network_id]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUsers();
    setRefreshing(false);
  };

  const handleUnban = (userId) => {
    setBannedUsers((prev) => prev.filter((id) => id !== userId));
  };

  const filteredUsers = bannedUsers.filter(userId => {
    const userDetail = userDetails[userId] || {};
    return userDetail.name && userDetail.name.toLowerCase().includes(searchText.toLowerCase());
  });

  return (
    <View style={{ backgroundColor: 'black', flex: 1 }}>
      <View style={{
        padding: 15,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Icon
            name="chevron-down-outline"
            size={25}
            color={color}
            onPress={() => navigation.goBack()}
          />
          <Text style={{
            color: 'white',
            fontWeight: 'bold',
            fontSize: 18,
            marginLeft: 10,
          }}>
            Banned Users
          </Text>
        </View>
      </View>

      <TextInput
        style={{
          height: 40,
          borderRadius: 5,
          paddingHorizontal: 10,
          margin: 10,
          color: 'white',
          backgroundColor: '#1a1a1a'
        }}
        placeholder="Search"
        placeholderTextColor="grey"
        value={searchText}
        onChangeText={setSearchText}
      />

      <FlashList
        data={filteredUsers}
        renderItem={({ item }) => (
          <DisplayUser userId={item} network_id={network_id} onUnban={handleUnban} />
        )}
        estimatedItemSize={70}
        keyExtractor={(item) => item}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </View>
  );
}
