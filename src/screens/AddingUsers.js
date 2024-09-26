import React, { useState } from 'react';
import { Text, View, TextInput, FlatList, TouchableOpacity, StyleSheet, Image } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import Icon from 'react-native-vector-icons/Ionicons';

export default function AddingUsers({ navigation, route }) {
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);

  const { updateSelectedUsers } = route.params || {};

  const fetchUsers = async (query) => {
    if (!query) {
      setSearchResults([]);
      return;
    }

    try {
      const usersSnapshot = await firestore()
        .collection('Users')
        .where('name', '>=', query)
        .where('name', '<=', query + '\uf8ff')
        .limit(20)
        .get();

      const fetchedUsers = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      setSearchResults(fetchedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleUserSelection = (user) => {
    if (!selectedUsers.some(u => u.id === user.id)) {
      setSelectedUsers([...selectedUsers, user]);
    }
  };

  const handleDone = () => {
    if (updateSelectedUsers) {
      updateSelectedUsers(selectedUsers);
    }
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <View style={{marginBottom: 20}}>
        <Icon name="chevron-down" color='white' size={20} onPress={() => navigation.goBack()} />
      </View>
      {selectedUsers.length > 0 && (
        <View style={styles.selectedUsersContainer}>
          <Text style={styles.selectedUsersTitle}>Selected Users:</Text>
          {selectedUsers.map((user) => (
            <TouchableOpacity key={user.id} style={styles.userContainer}>
              {user.profile_pic ? (
                <Image source={{ uri: user.profile_pic }} style={styles.profilePic} />
              ) : (
                <View style={styles.profilePicPlaceholder}>
                  <Text style={styles.profilePicPlaceholderText}>{user.name[0]}</Text>
                </View>
              )}
              <View>
                <Text style={styles.userName}>{user.name}</Text>
                <Text style={styles.bio} numberOfLines={1} ellipsizeMode="tail">{user.bio}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
      <TextInput
        style={styles.searchInput}
        placeholder="Search users..."
        placeholderTextColor="grey"
        value={searchText}
        onChangeText={(text) => {
          setSearchText(text);
          fetchUsers(text);
        }}
      />

      {searchResults.length > 0 && (
        <FlatList
          data={searchResults}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.userContainer} onPress={() => handleUserSelection(item)}>
              {item.profile_pic ? (
                <Image source={{ uri: item.profile_pic }} style={styles.profilePic} />
              ) : (
                <View style={styles.profilePicPlaceholder}>
                  <Text style={styles.profilePicPlaceholderText}>{item.name[0]}</Text>
                </View>
              )}
              <View>
                <Text style={styles.userName}>{item.name}</Text>
                <Text style={styles.bio} numberOfLines={1} ellipsizeMode="tail">{item.bio}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
      <TouchableOpacity style={styles.doneButton} onPress={handleDone}>
        <Text style={styles.doneButtonText}>Done</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    padding: 10,
  },
  searchInput: {
    height: 40,
    borderColor: 'grey',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 10,
    color: 'white',
  },
  bio: {
    color: 'grey'
  },
  userContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    backgroundColor: "#1a1a1a",
    borderRadius: 10,
    marginBottom: 10,
    padding: 10
  },
  profilePic: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  profilePicPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#666',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profilePicPlaceholderText: {
    color: 'white',
    fontSize: 18,
  },
  userName: {
    color: 'white',
    fontSize: 16,
  },
  selectedUsersContainer: {
    marginTop: 20,
  },
  selectedUsersTitle: {
    color: 'white',
    fontSize: 18,
    marginBottom: 10,
  },
  doneButton: {
    marginTop: 20,
    backgroundColor: '#1a1a1a',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  doneButtonText: {
    color: 'white',
    fontSize: 16,
  },
});
