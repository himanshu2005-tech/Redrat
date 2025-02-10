import React, {useState, useEffect} from 'react';
import {
  StyleSheet,
  FlatList,
  View,
  Text,
  Pressable,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import moment from 'moment';
import topics from './Topics';
import TrendingNetworks from './TrendingNetworks';
import auth from '@react-native-firebase/auth';
import uuid from 'react-native-uuid';
import RecommendedPosts from './RecommendedPosts';
import color from './color';
import {SharedElement} from 'react-navigation-shared-element';

const Trending = ({navigation}) => {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userDetails, setUserDetails] = useState([]);

  useEffect(() => {
    const fetchHashtags = async () => {
      const today = moment().format('YYYY-MM-DD');
      const yesterday = moment().subtract(1, 'days').format('YYYY-MM-DD');
      const currentHour = moment().hour();

      try {
        let hashTagsSnapshot;

        if (currentHour >= 1) {
          hashTagsSnapshot = await firestore()
            .collection('HashTags')
            .where('countForToday', '>', 0)
            .where('lastUpdated', '==', today)
            .orderBy('countForToday', 'desc')
            .limit(20)
            .get();
        } else {
          hashTagsSnapshot = await firestore()
            .collection('HashTags')
            .where('countForToday', '>', 0)
            .where('lastUpdated', '==', yesterday)
            .orderBy('countForToday', 'desc')
            .limit(20)
            .get();
        }

        const usageCounts = hashTagsSnapshot.docs.map(doc => ({
          id: doc.id,
          totalUsed: doc.data().totalUsed || 0,
          count: doc.data().countForToday || 0,
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

  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const userId = auth().currentUser?.uid;
        if (!userId) {
          console.warn('User not authenticated.');
          return;
        }

        const preferencesSnapshot = await firestore()
          .collection('Users')
          .doc(userId)
          .collection('Preferences')
          .orderBy('score', 'desc')
          .limit(5)
          .get();

        const preferences = preferencesSnapshot.docs.map(doc => ({
          topic: doc.id,
        }));

        console.log(preferences);
        setUserDetails(preferences);
      } catch (error) {
        console.error('Error fetching preferences:', error);
      }
    };

    fetchPreferences();
  }, []);

  const renderItem = ({item}) => (
    <Pressable
      style={styles.tagContainer}
      onPress={() => {
        console.log(item.id);
        navigation.push('SearchResults', {
          searchTarget: item.id,
          blockedUsers: [],
          blockedBy: [],
          isHashTag: true,
        });
      }}>
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
        <ActivityIndicator color={color} size={'small'} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Pressable
        style={styles.searchBar}
        onPress={() => navigation.navigate('Search')}>
        <Text style={styles.searchText}>Search networks or users</Text>
      </Pressable>

      <View style={{paddingVertical: 10}}>
        <Text style={styles.trendingTitle}>Trending</Text>
        <View style={{marginTop: 10}}>
          <FlatList
            data={tags}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 10,
            }}
          />
        </View>
      </View>

      <View style={{flex: 1, paddingVertical: 10}}>
        <RecommendedPosts key={uuid.v4()} userDetails={userDetails} />
      </View>
      {userDetails.map(item => (
        <TrendingNetworks key={item.topic} item={item.topic} />
      ))}
      <View style={{height: 500}} />
    </ScrollView>
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
    marginRight: 10,
    borderRadius: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width:"100%",
    borderWidth: 0.5,
    borderColor:'grey'
  },
  tagText: {
    fontSize: 18,
    color: color,
    fontWeight: 'bold',
  },
  tagUsage: {
    fontSize: 15,
    color: 'grey',
    padding: 8,
  },
  trendingTitle: {
    color: color,
    fontSize: 40,
    marginLeft: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  noTrendingText: {
    color: 'grey',
    textAlign: 'center',
    marginTop: 20,
  },
});
