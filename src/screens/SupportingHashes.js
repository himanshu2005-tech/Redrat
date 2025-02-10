import React, { useState, useEffect } from 'react';
import { Text, View, FlatList, Pressable, TextInput, StyleSheet, ScrollView, Image} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import firestore from '@react-native-firebase/firestore';
import Hash from './Hash';
import LinearGradient from 'react-native-linear-gradient';

export default function SupportingHashes({ route, navigation }) {
  const { network_id } = route.params;
  const [hashes, setHashes] = useState([]);
  const [selectedHashes, setSelectedHashes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredHashes, setFilteredHashes] = useState([]);
  const currentTime = firestore.Timestamp.now();

  useEffect(() => {
    const fetchHashes = async () => {
      try {
        const hashSnapshot = await firestore()
          .collection('Hash')
          .where('expiresAt', '>', currentTime)
          .get();

        const hashList = hashSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        setHashes(hashList);
        setFilteredHashes(hashList); 
      } catch (error) {
        console.log('Error fetching hashes: ', error);
      }
    };

    const fetchSupportedHashes = async () => {
      try {
        const networkDoc = await firestore()
          .collection('Network')
          .doc(network_id)
          .get();

        if (networkDoc.exists) {
          const networkData = networkDoc.data();
          setSelectedHashes(networkData.supportedHashes || []);
        }
      } catch (error) {
        console.log('Error fetching network data: ', error);
      }
    };

    fetchHashes();
    fetchSupportedHashes();
  }, [network_id]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredHashes([]); 
    } else {
      const lowercasedQuery = searchQuery.toLowerCase();
      setFilteredHashes(
        hashes.filter(hash => 
          (hash.hash?.toLowerCase() || '').includes(lowercasedQuery)
        )
      );
    }
  }, [searchQuery, hashes]);

  const toggleHashSelection = async (hash) => {
    const isSelected = selectedHashes.includes(hash.id);

    const newHashes = isSelected
      ? selectedHashes.filter(h => h !== hash.id)
      : [...selectedHashes, hash.id];

    setSelectedHashes(newHashes);

    try {
      if (isSelected) {
        await firestore()
          .collection('Network')
          .doc(network_id)
          .update({
            supportedHashes: firestore.FieldValue.arrayRemove(hash.id),
          });
      } else {
        await firestore()
          .collection('Network')
          .doc(network_id)
          .update({
            supportedHashes: firestore.FieldValue.arrayUnion(hash.id),
          });
      }
    } catch (error) {
      console.log('Error updating supported hashes: ', error);
    }
  };

  return (
    <View style={{ backgroundColor: 'black', flex: 1 }}>
      <View
        style={{
          flexDirection: 'row',
          padding: 10,
          gap: 7,
          borderBottomWidth: 0.7,
          borderColor: '#1a1a1a',
        }}>
        <Icon
          name="chevron-back"
          size={28}
          color="#FF3131"
          onPress={() => navigation.goBack()}
        />
        <Text
          style={{
            color: 'white',
            fontWeight: 'bold',
            fontSize: 18,
            marginLeft: 10,
          }}>
          Support Hashes
        </Text>
      </View>

      {selectedHashes.length > 0 && (
        <ScrollView horizontal style={styles.selectedHashesContainer}>
          {selectedHashes.map(hashId => {
            const hash = hashes.find(h => h.id === hashId);
            return (
              <Pressable key={hashId} style={styles.selectedHash}>
              <Hash id={hash?.id} showing={() => toggleHashSelection(hash)} />
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      <TextInput
        style={styles.searchBar}
        placeholder="Search Hashes..."
        placeholderTextColor="#777"
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      <FlatList
        data={filteredHashes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable onPress={() => toggleHashSelection(item)}>
          <LinearGradient
          colors={selectedHashes.includes(item.id) ? ['#FF512F', '#DD2476'] : ["#1a1a1a", "grey", "#1a1a1a"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            alignItems: 'center', padding: 10, backgroundColor: "#1a1a1a", borderRadius: 8, flexDirection: 'row', gap: 10, alignSelf: 'center', marginTop: 10, width: "95%"
          }}
        >
          <Image source={{uri: item.imageUri}} style={{ height: 40, width: 40, borderRadius: 80 }} />
          <Text style={{ color: 'white', fontSize: 14, fontWeight: 'bold' }}>{item.hash}</Text>
        </LinearGradient>
        </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  searchBar: {
    backgroundColor: '#1a1a1a',
    color: 'white',
    padding: 10,
    borderRadius: 5,
    margin: 10,
    fontSize: 16,
  },
  selectedHashesContainer: {
    maxHeight: 100,
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  closeIcon: {
    marginLeft: 5,
  },
});
