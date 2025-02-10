import React, {useState, useRef, useEffect} from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  FlatList,
  Text,
  Pressable,
  Image,
  BackHandler,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import Icon from 'react-native-vector-icons/Ionicons';
import color from './color';
import {SharedElement} from 'react-navigation-shared-element';

export default function Search({navigation}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [blockedBy, setBlockedBy] = useState([]);
  const inputRef = useRef(null);

  useEffect(() => {
    const fetchBlockedUsers = async () => {
      try {
        const currentUserId = auth().currentUser.uid;
        const userDoc = await firestore()
          .collection('Users')
          .doc(currentUserId)
          .get();

        const blocked = userDoc.data()?.blockedUsers || [];
        const blockedBy = userDoc.data()?.blockedBy || [];
        setBlockedUsers(blocked);
        setBlockedBy(blockedBy);
      } catch (error) {
        console.error('Error fetching blocked users:', error);
      }
    };

    fetchBlockedUsers();
  }, []);
  
  const handleSearch = async text => {
    setSearchQuery(text);

    if (text.length === 0) {
      setSearchResults([]);
      return;
    }

    try {
      const currentUserId = auth().currentUser.uid;

      const userQuerySnapshot = await firestore()
        .collection('Users')
        .where('name', '>=', text)
        .where('name', '<=', text + '\uf8ff')
        .get();

      const networkQuerySnapshot = await firestore()
        .collection('Network')
        .where('network_name', '>=', text)
        .where('network_name', '<=', text + '\uf8ff')
        .get();

      const users = userQuerySnapshot.docs
        .map(doc => ({
          id: doc.id,
          type: 'user',
          ...doc.data(),
        }))
        .filter(
          user =>
            !blockedUsers.includes(user.id) && !blockedBy.includes(user.id),
        );

      const networks = networkQuerySnapshot.docs.map(doc => ({
        id: doc.id,
        type: 'network',
        ...doc.data(),
      }));

      setSearchResults([...users, ...networks]);
    } catch (error) {
      console.error('Error fetching search results: ', error);
    }
  };

  const handleItemPress = item => {
    if (item.type === 'network') {
      navigation.navigate('Network', {networkId: item.id});
    } else if (item.type === 'user') {
      navigation.navigate('UserProfile', {id: item.id});
    } else if (item.type === 'hash') {
      navigation.navigate('HashScreen', {hash: item.id});
    }
  };

  const renderItem = ({item}) => (
    <Pressable style={styles.topicItem} onPress={() => handleItemPress(item)}>
      {item.type === 'network' ? (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <Image source={{uri: item.profile_pic}} style={styles.profilePic} />
            <View style={{justifyContent: 'center'}}>
              <Text style={styles.topicText}>{item.network_name}</Text>
              <Text
                style={{fontSize: 15, color: 'grey', maxWidth: '90%'}}
                numberOfLines={1}
                ellipsizeMode="tail">
                {item.bio}
              </Text>
            </View>
          </View>
          <Text
            style={{
              color: 'grey',
              fontSize: 14,
              position: 'absolute',
              right: 7,
            }}>
            {item.network_type}
          </Text>
        </View>
      ) : item.type === 'user' ? (
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
          <Image source={{uri: item.profile_pic}} style={styles.profilePic} />
          <View>
            <Text style={styles.topicText}>{item.name}</Text>
            <Text
              style={styles.emailText}
              numberOfLines={1}
              ellipsizeMode="tail">
              {item.bio}
            </Text>
          </View>
        </View>
      ) : (
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
          <Image source={{uri: item.imageUri}} style={styles.profilePic} />
          <View>
            <Text style={styles.topicText}>{item.hash}</Text>
            <Text
              style={styles.emailText}
              numberOfLines={1}
              ellipsizeMode="middle">
              {item.info || 'No description'}
            </Text>
          </View>
        </View>
      )}
    </Pressable>
  );

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        if (searchQuery.length > 0) {
          setSearchQuery('');
          setSearchResults([]);
          return true;
        }
        return false;
      };

      BackHandler.addEventListener('hardwareBackPress', onBackPress);

      if (inputRef.current) {
        inputRef.current.focus();
      }

      return () =>
        BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, [searchQuery]),
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.inputWrapper}>
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            placeholder="Search networks, users, or hashes"
            placeholderTextColor="grey"
            value={searchQuery}
            autoCorrect={false}
            onChangeText={handleSearch}
            onSubmitEditing={() => {
              if (searchQuery) {
                console.log(searchQuery)
                navigation.navigate('SearchResults', {
                  searchTarget: searchQuery,
                  blockedUsers: blockedUsers,
                  blockedBy: blockedBy,
                });
              }
            }}
            selectTextOnFocus
            returnKeyType="search"
            selectionColor="#FF9999"
            autoFocus={true}
            autoCapitalize="none"
          />
          <Icon
            name="close-circle"
            size={20}
            color="grey"
            onPress={() => {
              setSearchQuery('');
              setSearchResults([]);
              if (inputRef.current) {
                inputRef.current.clear();
              }
            }}
            style={{right: 10}}
          />
        </View>
      </View>
      <FlatList
        data={searchResults}
        renderItem={renderItem}
        keyExtractor={item => item.id}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    margin: 10,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    paddingHorizontal: 10,
    justifyContent: 'space-between',
    alignSelf: 'center',
  },
  searchInput: {
    width: '95%',
    paddingVertical: 10,
    fontSize: 18,
    color: color,
    alignSelf: 'center',
  },
  topicItem: {
    backgroundColor: '#1a1a1a',
    padding: 8,
    borderRadius: 5,
    margin: 10,
    width: '95%',
    alignSelf: 'center',
  },
  topicText: {
    fontSize: 20,
    color: 'white',
    fontWeight: 'bold',
  },
  profilePic: {
    width: 40,
    height: 40,
    borderRadius: 25,
    marginRight: 10,
  },
  emailText: {
    color: 'grey',
    fontSize: 15,
    maxWidth: '90%',
  },
});


