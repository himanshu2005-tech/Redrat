import React, {useState, useEffect, Suspense} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Pressable,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import NetworkSuggestions from './NetworkSuggestions';
import {AdView} from '../ads/AdView';
import uuid from 'react-native-uuid';
import color from './color';
import {SharedElement} from 'react-navigation-shared-element';
import Icon from 'react-native-vector-icons/Ionicons';

const Post = React.lazy(() => import('./Post'));

const CustomFeedPosts = ({navigation, route}) => {
  const {feed} = route.params;
  const [networkPosts, setNetworkPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastVisiblePost, setLastVisiblePost] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMorePosts, setLoadingMorePosts] = useState(false);

  const fetchPosts = async (loadMore = false) => {
    if (!hasMore && loadMore) return;

    loadMore ? setLoadingMorePosts(true) : setLoading(true);

    try {
      const timestampLimit = firestore.Timestamp.fromDate(
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      );

      let newNetworkPosts = [];
      const promises = [];

      if (feed.networks && feed.networks.length > 0) {
        const chunks = chunkArray(feed.networks, 10);
        chunks.forEach(chunk => {
          let networkQuery = firestore()
            .collection('Posts')
            .where('network_id', 'in', chunk)
            .where('createdAt', '>=', timestampLimit)
            .orderBy('createdAt', 'desc')
            .limit(10);

          if (loadMore && lastVisiblePost) {
            networkQuery = networkQuery.startAfter(lastVisiblePost);
          }

          promises.push(
            networkQuery.get().then(snapshot => {
              snapshot.forEach(doc => {
                newNetworkPosts.push({post_id: doc.id, ...doc.data()});
              });
            }),
          );
        });
      }

      await Promise.all(promises);

      const uniquePosts = [
        ...new Map(newNetworkPosts.map(post => [post.post_id, post])).values(),
      ];

      if (uniquePosts.length < (loadMore ? 5 : 10)) setHasMore(false);

      loadMore
        ? setNetworkPosts(prevPosts => {
            const newUniquePosts = uniquePosts.filter(
              post => !prevPosts.find(p => p.post_id === post.post_id),
            );
            return injectAdsIntoPosts([...prevPosts, ...newUniquePosts]);
          })
        : setNetworkPosts(injectAdsIntoPosts(uniquePosts));

      if (uniquePosts.length > 0) {
        setLastVisiblePost(uniquePosts[uniquePosts.length - 1].createdAt);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
      setLoadingMorePosts(false);
      setRefreshing(false);
    }
  };

  const chunkArray = (array, size) =>
    array.reduce(
      (acc, _, i) => (i % size ? acc : [...acc, array.slice(i, i + size)]),
      [],
    );

  const injectAdsIntoPosts = (posts, adFrequency = 10) => {
    const updatedPosts = [];
    let postCounter = 0;

    posts.forEach(post => {
      updatedPosts.push(post);
      postCounter++;

      if (postCounter >= adFrequency) {
        updatedPosts.push({
          type: 'ad',
          id: `ad-${uuid.v4()}`,
          adType: 'image',
        });
        postCounter = 0;
      }
    });

    return updatedPosts;
  };

  const onRefresh = () => {
    setRefreshing(true);
    setHasMore(true);
    fetchPosts();
  };

  const handleLoadMore = () => {
    if (!loadingMorePosts) {
      fetchPosts(true);
    }
  };

  const renderPostOrAd = ({item}) => {
    if (item.type === 'ad') {
      return (
        <AdView
          loadOnMount={true}
          index={item.id}
          type={item.adType}
          media={false}
        />
      );
    }

    return (
      <SharedElement id={`item.${item.post_id}.post`}>
        <Suspense fallback={<ActivityIndicator size="small" color={color} />}>
          <Post post_id={item.post_id} network_id={item.network_id} />
        </Suspense>
      </SharedElement>
    );
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  if (networkPosts.length === 0) {
    return (
      <View style={{backgroundColor: 'black', flex: 1}}>
        <View style={{flexDirection: 'row', padding: 10, alignItems: 'center'}}>
          <Icon
            name="chevron-back"
            size={28}
            color={color}
            onPress={() => navigation.goBack()}
          />
          <Text
            style={{
              color: 'white',
              fontWeight: 'bold',
              fontSize: 18,
              marginLeft: 10,
            }}>
            {feed.feedName}
          </Text>
        </View>

        <View
          style={{
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            gap: 15,
            marginBottom: 15,
          }}>
          <Icon name="add-circle" size={50} color={'white'} />
          <Text
            style={{
              color: 'white',
              fontWeight: 'bold',
              fontSize: 19,
              marginBottom: 15,
            }}>
            Add Networks to Customize this feed
          </Text>
        </View>
      </View>
    );
  }
  return (
    <View style={styles.container}>
      <View style={{flexDirection: 'row', padding: 10, alignItems: 'center'}}>
        <Icon
          name="chevron-back"
          size={28}
          color={color}
          onPress={() => navigation.goBack()}
        />
        <Text
          style={{
            color: 'white',
            fontWeight: 'bold',
            fontSize: 18,
            marginLeft: 10,
          }}>
          {feed.feedName}
        </Text>
      </View>
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={color} />
        </View>
      ) : (
        <FlatList
          data={networkPosts}
          keyExtractor={item => (item.type === 'ad' ? item.id : item.post_id)}
          renderItem={renderPostOrAd}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListFooterComponent={() =>
            !hasMore && (
              <View style={styles.footerContainer}>
                <Text style={styles.footerText}>
                  All posts have been viewed
                </Text>
              </View>
            )
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.8}
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          windowSize={10}
          getItemLayout={(data, index) => ({
            length: 300,
            offset: 300 * index,
            index,
          })}
          extraData={networkPosts}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'black',
    flex: 1,
    width: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerContainer: {
    height: 250,
    width: '100%',
    backgroundColor: 'black',
    alignItems: 'center',
  },
  footerText: {
    color: 'grey',
    textAlign: 'center',
    marginTop: 20,
  },
});

export default CustomFeedPosts;
