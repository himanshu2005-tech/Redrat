import React, {useEffect, useState} from 'react';
import {
  FlatList,
  Pressable,
  Text,
  View,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import color from './color';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

const AddFeed = ({navigation, route}) => {
  const {id} = route.params; // network_id passed
  const [feeds, setFeeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFeeds, setSelectedFeeds] = useState(new Set());

  useEffect(() => {
    const fetchFeeds = async () => {
      try {
        const userDocRef = firestore()
          .collection('Users')
          .doc(auth().currentUser.uid)
          .collection('Feeds');
        const snapshot = await userDocRef.get();

        if (!snapshot.empty) {
          const userFeeds = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          }));
          setFeeds(userFeeds);

          // Check if the current network is already added to each feed
          const initialSelected = new Set(
            userFeeds
              .filter(feed => feed.networks && feed.networks.includes(id))
              .map(feed => feed.id),
          );
          setSelectedFeeds(initialSelected);
        }
      } catch (error) {
        console.warn('Error fetching feeds:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeeds();
  }, [id]);

  const toggleNetwork = async feedId => {
    try {
      const feedRef = firestore()
        .collection('Users')
        .doc(auth().currentUser.uid)
        .collection('Feeds')
        .doc(feedId);

      const feed = feeds.find(feed => feed.id === feedId);
      const updatedNetworks = feed.networks || [];

      if (selectedFeeds.has(feedId)) {
        // Remove network_id from this feed
        await feedRef.update({
          networks: firestore.FieldValue.arrayRemove(id),
        });
        selectedFeeds.delete(feedId);
      } else {
        // Add network_id to this feed
        await feedRef.update({
          networks: firestore.FieldValue.arrayUnion(id),
        });
        selectedFeeds.add(feedId);
      }

      setSelectedFeeds(new Set(selectedFeeds)); // Update state
    } catch (error) {
      console.warn('Error updating feed:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={color} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Icon
          name="chevron-back"
          size={28}
          color={color}
          onPress={() => navigation.goBack()}
        />
        <Text style={styles.headerText}>Add Network to Custom Feed</Text>
      </View>

      {feeds.length > 0 ? (
        <FlatList
          data={feeds}
          keyExtractor={item => item.id}
          renderItem={({item}) => (
            <Pressable
              style={[
                styles.feedItem,
                selectedFeeds.has(item.id) && styles.selectedFeed,
              ]}
              onPress={() => toggleNetwork(item.id)}>
              <Text style={styles.feedText}>{item.feedName}</Text>
              {selectedFeeds.has(item.id) && (
                <Icon name="checkmark" size={20} color="white" />
              )}
            </Pressable>
          )}
        />
      ) : (
        <Text style={styles.noFeedsText}>No custom feeds found.</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'black',
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    padding: 10,
    alignItems: 'center',
  },
  headerText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
    marginLeft: 10,
  },
  feedItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    marginVertical: 5,
    marginHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#1a1a1a',
  },
  selectedFeed: {
    backgroundColor: color,
  },
  feedText: {
    color: 'white',
    fontSize: 16,
  },
  noFeedsText: {
    color: 'grey',
    textAlign: 'center',
    marginTop: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AddFeed;
