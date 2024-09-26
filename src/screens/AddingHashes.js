import React, { useState } from 'react';
import { Text, View, TextInput, FlatList, TouchableOpacity, StyleSheet, Image } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import Icon from 'react-native-vector-icons/Ionicons';

export default function AddingHashes({ navigation, route }) {
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedHashes, setSelectedHashes] = useState([]);

  const { updateSelectedHashes } = route.params || {};

  const fetchHash = async (query) => {
    if (!query) {
      setSearchResults([]);
      return;
    }
  
    try {
      const hashesSnapshot = await firestore()
        .collection('Hash')
        .where('hash', '>=', query)
        .where('hash', '<=', query + '\uf8ff')
        .limit(20)
        .get();
  
      const currentTime = new Date(); 
  
      const fetchedHashes = hashesSnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
        }))
        .filter(hash => hash.expiresAt.toDate() > currentTime); 
  
      setSearchResults(fetchedHashes);
    } catch (error) {
      console.error('Error fetching hashes:', error);
    }
  };
  
  
  const handleHashSelection = (hash) => {
    if (!selectedHashes.some(h => h.id === hash.id)) {
      setSelectedHashes([...selectedHashes, hash]);
    }
  };

  const handleDone = () => {
    if (updateSelectedHashes) {
      updateSelectedHashes(selectedHashes);
    }
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <View style={{marginBottom: 20}}>
        <Icon name="chevron-down" color='white' size={20} onPress={() => navigation.goBack()} />
      </View>
      {selectedHashes.length > 0 && (
        <View style={styles.selectedHashesContainer}>
          <Text style={styles.selectedHashesTitle}>Selected Hashes:</Text>
          {selectedHashes.map((hash) => (
            <TouchableOpacity key={hash.id} style={styles.hashContainer}>
              {hash.imageUri ? (
                <Image source={{ uri: hash.imageUri }} style={styles.profilePic} />
              ) : (
                <View style={styles.profilePicPlaceholder}>
                  <Text style={styles.profilePicPlaceholderText}>{hash.hash[0]}</Text>
                </View>
              )}
              <View style={{marginLeft: 10}}>
                <Text style={styles.hashName}>{hash.hash}</Text>
                <Text style={styles.info} numberOfLines={1} ellipsizeMode="tail">{hash.info}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
      <TextInput
        style={styles.searchInput}
        placeholder="Search hash..."
        placeholderTextColor="grey"
        value={searchText}
        onChangeText={(text) => {
          setSearchText(text);
          fetchHash(text);
        }}
      />

      {searchResults.length > 0 && (
        <FlatList
          data={searchResults}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.hashContainer} onPress={() => handleHashSelection(item)}>
              {item.imageUri ? (
                <Image source={{ uri: item.imageUri }} style={styles.profilePic} />
              ) : (
                <View style={styles.profilePicPlaceholder}>
                  <Text style={styles.profilePicPlaceholderText}>{item.hash[0]}</Text>
                </View>
              )}
              <View style={{marginLeft: 10}}>
                <Text style={styles.hashName}>{item.hash}</Text>
                <Text style={styles.info} numberOfLines={1} ellipsizeMode="tail">{item.info}</Text>
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
  info: {
    color: 'grey',
    maxWidth: "90%"
  },
  hashContainer: {
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
  hashName: {
    color: 'white',
    fontSize: 16,
  },
  selectedHashesContainer: {
    marginTop: 20,
  },
  selectedHashesTitle: {
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
