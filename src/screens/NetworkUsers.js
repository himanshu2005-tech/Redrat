import React, { useEffect, useState } from 'react';
import { Text, View, Image, Pressable, Alert, TextInput, RefreshControl } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import firestore from '@react-native-firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import auth from '@react-native-firebase/auth';
import { FlashList } from '@shopify/flash-list';
import firebase from '@react-native-firebase/app'

const DisplayUser = ({ userId, networkId, onUserAction }) => {
  const [userDetails, setUserDetails] = useState({});
  const navigation = useNavigation();

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

  const kickOutUser = async () => {
    try {
      await firestore().collection('Network').doc(networkId).update({
        members: firestore.FieldValue.arrayRemove(userId),
        joined: firebase.firestore.FieldValue.increment(-1),
      });
      await firestore().collection('Users').doc(userId).update({
        joined_networks: firestore.FieldValue.arrayRemove(networkId),
      });
      Alert.alert('User Kicked Out', 'The user has been successfully kicked out.');
      onUserAction(userId, 'kicked');
    } catch (error) {
      console.warn(error);
      Alert.alert('Error', 'There was an error kicking out the user.');
    }
  };

  const banUser = async () => {
    try {
      await firestore().collection('Network').doc(networkId).update({
        members: firestore.FieldValue.arrayRemove(userId),
        joined: firebase.firestore.FieldValue.increment(-1),
        bannedUsers: firestore.FieldValue.arrayUnion(userId),
      });
      await firestore().collection('Users').doc(userId).update({
        joined_networks: firestore.FieldValue.arrayRemove(networkId),
      });
      Alert.alert('User Banned', 'The user has been successfully banned.');
      onUserAction(userId, 'banned');
    } catch (error) {
      console.warn(error);
      Alert.alert('Error', 'There was an error banning the user.');
    }
  };

  return (
    <Pressable
      style={{
        padding: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 0.7,
        borderColor: 'grey',
      }}
      onPress={() => navigation.navigate("UserProfile", { id: userId })}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {userDetails.profile_pic ? (
          <Image
            source={{ uri: userDetails.profile_pic }}
            style={{ height: 38, width: 38, borderRadius: 20, marginRight: 10 }}
          />
        ) : (
          <View style={{ height: 40, width: 40, borderRadius: 20, backgroundColor: 'grey', marginRight: 10 }} />
        )}
        <Text style={{ color: 'white', fontSize: 16, maxWidth: "80%" }} numberOfLines={1} ellipsizeMode="tail">
          {userDetails.name || 'Unknown User'}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 15 }}>
        <Pressable style={{ backgroundColor: '#FF3131', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 3 }} onPress={kickOutUser}>
          <Text style={{ color: 'white' }}>Kick out</Text>
        </Pressable>
        <Pressable style={{ backgroundColor: 'white', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 3 }} onPress={banUser}>
          <Text style={{ color: '#FF3131' }}>Ban User</Text>
        </Pressable>
      </View>
    </Pressable>
  );
};

export default function NetworkUsers({ navigation, route }) {
  const { network_id, network_name } = route.params;
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const currentUserId = auth().currentUser.uid;

  const fetchUsers = async () => {
    setRefreshing(true);
    try {
      const data = await firestore().collection('Network').doc(network_id).get();
      const members = data.data().members || [];

      const filteredMembers = await Promise.all(members.map(async (userId) => {
        const userDoc = await firestore().collection('Users').doc(userId).get();
        const userData = userDoc.data();
        if (userData.admin === currentUserId) return null; 
        return userId !== currentUserId ? userId : null; 
      }));

      setUsers(filteredMembers.filter(id => id)); 
      setFilteredUsers(filteredMembers.filter(id => id)); 
    } catch (error) {
      console.warn(error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [network_id, currentUserId]);

  useEffect(() => {
    const filterUsers = async () => {
      const results = await Promise.all(users.map(async (userId) => {
        const userDoc = await firestore().collection('Users').doc(userId).get();
        const userData = userDoc.data();
        return userData && userData.name && userData.name.toLowerCase().includes(searchQuery.toLowerCase()) ? userId : null;
      }));

      setFilteredUsers(results.filter(id => id)); 
    };

    filterUsers();
  }, [searchQuery, users]);

  const handleUserAction = (userId, action) => {
    setUsers(prevUsers => prevUsers.filter(id => id !== userId));
    setFilteredUsers(prevUsers => prevUsers.filter(id => id !== userId));
  };

  return (
    <View style={{ backgroundColor: 'black', flex: 1 }}>
      <View style={{ padding: 15, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 0.7, borderColor: 'grey', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Icon
            name="chevron-back"
            size={25}
            color="#FF3131"
            onPress={() => navigation.goBack()}
          />
          <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 18, marginLeft: 10 }}>{network_name}</Text>
        </View>
        <Pressable style={{ backgroundColor: "#FF3131", paddingHorizontal: 15, padding: 8, borderRadius: 5 }} onPress={() => navigation.navigate("Banned", {
          network_id: network_id
        })}>
          <Text style={{ color: 'white', fontWeight: 'bold' }}>Banned Users</Text>
        </Pressable>
      </View>

      <TextInput
        style={{
          height: 40,
          borderRadius: 5,
          paddingHorizontal: 10,
          margin: 10,
          color: '#FF3131',
          backgroundColor: '#1a1a1a'
        }}
        placeholder={`Search ${network_name}`}
        placeholderTextColor="grey"
        onChangeText={setSearchQuery}
        value={searchQuery}
      />

      <FlashList
        data={filteredUsers}
        renderItem={({ item }) => (
          <DisplayUser userId={item} networkId={network_id} onUserAction={handleUserAction} />
        )}
        estimatedItemSize={70}
        keyExtractor={(item) => item}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchUsers} />}
      />
    </View>
  );
}
