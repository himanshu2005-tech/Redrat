import React, { useState, useEffect } from 'react';
import {
  Text,
  View,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Image,
  RefreshControl,
  Pressable,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';
import {SharedElement} from 'react-navigation-shared-element';

export default function UserResults({ route, navigation }) {
  const { target, blockedUsers = [], blockedBy = [] } = route.params; 
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [target, blockedUsers]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const usersSnapshot = await firestore()
        .collection('Users')
        .where('name', '>=', target)
        .where('name', '<=', `${target}\uf8ff`)
        .limit(20)
        .get();

      const fetchedUsers = usersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const filteredUsers = fetchedUsers.filter(
        (user) => !blockedUsers.includes(user.id) && !blockedBy.includes(user.id)
      );
      setLoading(false);
      setUsers(filteredUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUsers();
    setRefreshing(false);
  };

  const renderUser = ({ item }) => (
    <Pressable
      style={styles.userContainer}
      onPress={() => navigation.navigate('UserProfile', { id: item.id })}
    >
      {item.profile_pic ? (
        <Image source={{ uri: item.profile_pic }} style={styles.profilePic} />
      ) : (
        <View style={styles.profilePicPlaceholder}>
          <Text style={styles.profilePicPlaceholderText}>
            {item.name[0]?.toUpperCase() || 'U'}
          </Text>
        </View>
      )}
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.name}</Text>
        <Text style={styles.userEmail}>{item.email || 'No email provided'}</Text>
      </View>
    </Pressable>
  );

  const renderSkeleton = () => (
    <SkeletonPlaceholder backgroundColor="#2c2c2c" highlightColor="#444">
      <View style={styles.userContainer}>
        <View style={styles.profilePic} />
        <View style={styles.userInfo}>
          <View style={styles.skeletonLine} />
          <View style={[styles.skeletonLine, { width: 100, marginTop: 6 }]} />
        </View>
      </View>
    </SkeletonPlaceholder>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        Array.from({ length: 5 }).map((_, index) => <React.Fragment key={index}>{renderSkeleton()}</React.Fragment>)
      ) : users.length > 0 ? (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          renderItem={renderUser}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#ffffff"
              colors={['#ffffff']}
            />
          }
        />
      ) : (
        <Text style={styles.noResultsText}>No users found.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    padding: 10,
  },
  userContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    backgroundColor: '#1a1a1a',
    padding: 10,
    borderRadius: 8,
  },
  profilePic: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#cccccc',
  },
  profilePicPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#cccccc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profilePicPlaceholderText: {
    color: 'white',
    fontSize: 20,
  },
  userInfo: {
    marginLeft: 15,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  userEmail: {
    fontSize: 14,
    color: 'grey',
  },
  noResultsText: {
    color: 'grey',
    fontSize: 18,
    alignSelf: 'center',
    marginTop: 20,
  },
  skeletonLine: {
    width: 120,
    height: 20,
    borderRadius: 4,
    backgroundColor: '#2c2c2c',
  },
});




