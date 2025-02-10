import React, {useState, useRef} from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  FlatList,
  Text,
  Pressable,
  BackHandler,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import firestore from '@react-native-firebase/firestore';
import Icon from 'react-native-vector-icons/Ionicons';
import color from './color';
import {SharedElement} from 'react-navigation-shared-element';

export default function SearchBots({navigation}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const inputRef = useRef(null);

  const handleSearch = async text => {
    setSearchQuery(text);
    if (text.length === 0) {
      setSearchResults([]);
      return;
    }
    try {
      const botQuerySnapshot = await firestore()
        .collection('Bots')
        .where('Name', '>=', text)
        .where('Name', '<=', text + '\uf8ff')
        .orderBy('Name') 
        .orderBy('numberOfUses', 'desc') 
        .limit(10)
        .get();

      const bots = botQuerySnapshot.docs.map(doc => ({
        id: doc.id,
        type: 'bot',
        name: doc.data().Name,
        desc: doc.data().desc,
      }));

      setSearchResults(bots);
    } catch (error) {
      console.error('Error fetching search results: ', error);
    }
  };

  const handleItemPress = item => {
    if (item.type === 'bot') {
      navigation.navigate('BotScreen', {botId: item.id});
    }
  };

  const renderItem = ({item}) => (
    <Pressable style={styles.topicItem} onPress={() => handleItemPress(item)}>
      <View style={styles.itemContainer}>
        <Text style={styles.profilePic}>
          {item.name ? item.name[0].toUpperCase() : '?'}
        </Text>
        <View style={{justifyContent: 'center'}}>
          <Text style={styles.topicText}>{item.name || 'Unnamed Bot'}</Text>
          <Text
            style={styles.descriptionText}
            numberOfLines={1}
            ellipsizeMode="tail">
            {item.desc || 'No description available'}
          </Text>
        </View>
      </View>
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
            placeholder="Search bots"
            placeholderTextColor="grey"
            value={searchQuery}
            autoCorrect={false}
            onChangeText={handleSearch}
            returnKeyType="search"
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
  descriptionText: {
    fontSize: 16,
    color: 'grey',
    marginLeft: 10,
    maxWidth: '90%',
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
    borderRadius: 3,
    borderColor: '#ccc',
    margin: 10,
    width: '90%',
    alignSelf: 'center',
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topicText: {
    fontSize: 18,
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 10,
  },
  profilePic: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: color,
    textAlign: 'center',
    lineHeight: 40,
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
});



