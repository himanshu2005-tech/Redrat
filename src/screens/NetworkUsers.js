import React, {useEffect, useState} from 'react';
import {
  Text,
  View,
  Image,
  Pressable,
  Alert,
  TextInput,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import firestore from '@react-native-firebase/firestore';
import {useNavigation} from '@react-navigation/native';
import auth from '@react-native-firebase/auth';
import {FlashList} from '@shopify/flash-list';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';
import color from './color';
import {SharedElement} from 'react-navigation-shared-element';

const DisplayUser = ({userId, networkId, onUserAction}) => {
  const [userDetails, setUserDetails] = useState(null);
  const navigation = useNavigation();

  if(auth().currentUser.uid === userId){
    return null;
  }
  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const data = await firestore().collection('Users').doc(userId).get();
        if (data.exists) {
          setUserDetails(data.data());
        } else {
          setUserDetails(null);
        }
      } catch (error) {
        console.warn(error);
        setUserDetails(null);
      }
    };
    fetchUserDetails();
  }, [userId]);

  if (userDetails === null) {
    return null;
  }

  const kickOutUser = async () => {
    try {
      await firestore()
        .collection('Network')
        .doc(networkId)
        .collection('Members')
        .doc(userId)
        .delete();
      await firestore()
        .collection('Users')
        .doc(userId)
        .collection('JoinedNetworks')
        .doc(networkId)
        .delete();
      Alert.alert(
        'User Kicked Out',
        'The user has been successfully kicked out.',
      );
      onUserAction(userId, 'kicked');
    } catch (error) {
      console.warn(error);
      Alert.alert('Error', 'There was an error kicking out the user.');
    }
  };

  const banUser = async () => {
    try {
      await firestore()
        .collection('Network')
        .doc(networkId)
        .collection('Members')
        .doc(userId)
        .delete();
      await firestore()
        .collection('Users')
        .doc(userId)
        .collection('JoinedNetworks')
        .doc(networkId)
        .delete();
      await firestore()
        .collection('Network')
        .doc(networkId)
        .update({
          bannedUsers: firestore.FieldValue.arrayUnion(userId),
        });
      Alert.alert('User Banned', 'The user has been successfully banned.');
      onUserAction(userId, 'banned');
    } catch (error) {
      console.warn(error);
      Alert.alert('Error', 'There was an error banning the user.');
    }
  };

  if (!userDetails) {
    return (
      <SkeletonPlaceholder>
        <SkeletonPlaceholder.Item
          flexDirection="row"
          alignItems="center"
          justifyContent="space-between"
          paddingHorizontal={10}
          marginVertical={10}
          gap={10}>
          <SkeletonPlaceholder.Item width={40} height={40} borderRadius={20} />
          <SkeletonPlaceholder.Item flex={1} marginLeft={10}>
            <SkeletonPlaceholder.Item
              width="80%"
              height={20}
              borderRadius={4}
            />
          </SkeletonPlaceholder.Item>
          <SkeletonPlaceholder.Item width={70} height={30} borderRadius={5} />
          <SkeletonPlaceholder.Item width={70} height={30} borderRadius={5} />
        </SkeletonPlaceholder.Item>
      </SkeletonPlaceholder>
    );
  }

  return (
    <Pressable
      style={{
        padding: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
      onPress={() => navigation.navigate('UserProfile', {id: userId})}>
      <View style={{flexDirection: 'row', alignItems: 'center'}}>
        {userDetails.profile_pic ? (
          <Image
            source={{uri: userDetails.profile_pic}}
            style={{height: 38, width: 38, borderRadius: 20, marginRight: 10}}
          />
        ) : (
          <View
            style={{
              height: 40,
              width: 40,
              borderRadius: 20,
              backgroundColor: 'grey',
              marginRight: 10,
            }}
          />
        )}
        <Text
          style={{color: 'white', fontSize: 16, maxWidth: '80%'}}
          numberOfLines={1}
          ellipsizeMode="tail">
          {userDetails.name || 'Unknown User'}
        </Text>
      </View>
      <View style={{flexDirection: 'row', gap: 15}}>
        <Pressable
          style={{
            backgroundColor: color,
            paddingHorizontal: 10,
            paddingVertical: 8,
            borderRadius: 3,
          }}
          onPress={kickOutUser}>
          <Text style={{color: 'white'}}>Kick out</Text>
        </Pressable>
        <Pressable
          style={{
            backgroundColor: '#1a1a1a',
            paddingHorizontal: 10,
            paddingVertical: 8,
            borderRadius: 3,
          }}
          onPress={banUser}>
          <Text style={{color: 'white'}}>Ban User</Text>
        </Pressable>
      </View>
    </Pressable>
  );
};

export default function NetworkUsers({navigation, route}) {
  const {network_id, network_name} = route.params;
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const currentUserId = auth().currentUser.uid;

  const fetchUsers = async () => {
    setRefreshing(true);
    setLoading(true);
    try {
      const data = await firestore()
        .collection('Network')
        .doc(network_id)
        .collection('Members')
        .limit(100)
        .get();
      const members = data.docs.map(doc => doc.id);

      setUsers(members);
      setFilteredUsers(members);
    } catch (error) {
      console.warn(error);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [network_id]);

  useEffect(() => {
    const filterUsers = () => {
      const results = users.filter(userId =>
        userId.toLowerCase().includes(searchQuery.toLowerCase()),
      );
      setFilteredUsers(results);
    };
    filterUsers();
  }, [searchQuery, users]);

  const handleUserAction = (userId, action) => {
    setUsers(prevUsers => prevUsers.filter(id => id !== userId));
    setFilteredUsers(prevUsers => prevUsers.filter(id => id !== userId));
  };

  return (
    <View style={{backgroundColor: 'black', flex: 1}}>
      <View
        style={{
          padding: 10,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
          <Icon
            name="chevron-back"
            size={25}
            color={color}
            onPress={() => navigation.goBack()}
          />
          <Text
            style={{
              color: 'white',
              fontWeight: 'bold',
              fontSize: 19,
              marginLeft: 5,
            }}>
            {network_name}
          </Text>
        </View>
        <Pressable
          style={{
            backgroundColor: '#1a1a1a',
            paddingHorizontal: 15,
            padding: 8,
            borderRadius: 5,
          }}
          onPress={() =>
            navigation.navigate('Banned', {
              network_id: network_id,
            })
          }>
          <Text style={{color: 'white', fontWeight: 'bold'}}>Banned Users</Text>
        </Pressable>
      </View>

      <TextInput
        style={{
          height: 40,
          borderRadius: 5,
          paddingHorizontal: 10,
          margin: 10,
          color: color,
          backgroundColor: '#1a1a1a',
        }}
        placeholder={`Search ${network_name}`}
        placeholderTextColor="grey"
        onChangeText={setSearchQuery}
        value={searchQuery}
      />

      <FlashList
        data={filteredUsers}
        renderItem={({item}) => (
          <DisplayUser
            userId={item}
            networkId={network_id}
            onUserAction={handleUserAction}
          />
        )}
        estimatedItemSize={70}
        keyExtractor={item => item}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={fetchUsers} />
        }
      />
    </View>
  );
}