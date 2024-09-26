import React, { useState, useEffect } from 'react';
import { Text, View, FlatList, ActivityIndicator, StyleSheet, Image, RefreshControl, Pressable } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';

export default function HashResults({ route, navigation }) {
  const { target } = route.params;
  const [networks, setNetworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchNetworks();
  }, [target]);

  const fetchNetworks = async () => {
    setLoading(true);
    try {
      const networksSnapshot = await firestore()
        .collection('Hash')
        .where('hash', '>=', target)
        .where('hash', '<=', target + '\uf8ff') 
        .limit(200)
        .get();

      const fetchedNetworks = networksSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      setNetworks(fetchedNetworks);
    } catch (error) {
      console.error('Error fetching networks: ', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNetworks();
    setRefreshing(false);
  };

  const renderNetwork = ({ item }) => (
    <Pressable style={styles.networkContainer} onPress={() => navigation.navigate('HashScreen', { hash: item.id })}>
      <Image source={{ uri: item.imageUri }} style={styles.profilePic} />
      <View>
        <Text style={styles.networkName}>{item.hash}</Text>
        <Text style={styles.networkType} numberOfLines={1} ellipsizeMode="tail">{item.info}</Text>
      </View>
    </Pressable>
  );

  const renderSkeleton = () => (
    <SkeletonPlaceholder backgroundColor="#2c2c2c" highlightColor="#444">
      <View style={styles.networkContainer}>
        <View style={styles.profilePic} />
        <View>
          <View style={styles.skeletonLine} />
          <View style={[styles.skeletonLine, { width: 100, marginTop: 6 }]} />
        </View>
      </View>
    </SkeletonPlaceholder>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <>
          {renderSkeleton()}
          {renderSkeleton()}
          {renderSkeleton()}
        </>
      ) : (
        <FlatList
          data={networks}
          keyExtractor={(item) => item.id}
          renderItem={renderNetwork}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#ffffff" // Spinner color on iOS
              colors={['#ffffff']} // Spinner color on Android
            />
          }
        />
      )}
      {!loading && networks.length === 0 && (
        <Text style={styles.noResultsText}>No networks found.</Text>
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
  networkContainer: {
    marginBottom: 15,
    backgroundColor: '#1a1a1a',
    padding: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  profilePic: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#cccccc',
  },
  networkName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  networkType: {
    fontSize: 14,
    color: 'grey',
    maxWidth: "90%"
  },
  noResultsText: {
    color: '#555555',
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
