import React, {useState, useEffect} from 'react';
import {
  StyleSheet,
  FlatList,
  View,
  Text,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import moment from 'moment';

const Trending = ({navigation}) => {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHashtags = async () => {
      const today = moment().format('YYYY-MM-DD');

      try {
        const hashTagsSnapshot = await firestore()
          .collection('HashTags')
          .where('countForToday', '>', 0)
          .where('lastUpdated', '==', today)
          .orderBy('countForToday', 'desc')
          .limit(20)
          .get();

        const usageCounts = hashTagsSnapshot.docs.map(doc => ({
          id: doc.id,
          totalUsed: doc.data().totalUsed || 0,
          count: doc.data().countForToday || 0
        }));

        setTags(usageCounts);
        setLoading(false);
      } catch (error) {
        console.warn(error);
        setLoading(false);
      }
    };

    fetchHashtags();
  }, []);

  const renderItem = ({item}) => (
    <Pressable
      style={styles.tagContainer}
      onPress={() =>
        navigation.push('SearchResults', {
          searchTarget: item.id,
          isHash: true,
        })
      }>
      <View>
        <Text style={styles.tagText}>{item.id}</Text>
        <Text style={styles.tagUsage}>{item.count} used today</Text>
      </View>
      <Text style={styles.tagUsage}>{item.totalUsed}</Text>
    </Pressable>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={'#FF3131'} size={'small'} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Pressable
        style={styles.searchBar}
        onPress={() => navigation.navigate('Search')}>
        <Text style={styles.searchText}>Search networks or users</Text>
      </Pressable>

      {tags.length === 0 ? (
        <Text style={styles.noTrendingText}>No trending hashtags found.</Text>
      ) : (
        <View>
          <Text
            style={{
              color: '#FF3131',
              fontSize: 40,
              marginLeft: 10,
              fontWeight: 900,
              letterSpacing: 1,
            }}>
            Trending
          </Text>
          <FlatList
            data={tags}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            contentContainerStyle={{padding: 10}}
          />
        </View>
      )}
    </View>
  );
};

export default Trending;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
  searchBar: {
    width: '95%',
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    borderColor: 'grey',
    marginBottom: 20,
    margin: 10,
    alignSelf: 'center',
  },
  searchText: {
    color: 'grey',
    fontSize: 18,
  },
  tagContainer: {
    padding: 10,
    marginBottom: 10,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  tagText: {
    fontSize: 18,
    color: '#FF3131',
    fontWeight: 'bold',
  },
  tagUsage: {
    fontSize: 15,
    color: 'grey',
    padding: 3
  },
  noTrendingText: {
    color: 'white',
    textAlign: 'center',
    marginTop: 20,
  },
});
