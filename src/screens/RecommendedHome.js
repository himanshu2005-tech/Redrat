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
import Icon from 'react-native-vector-icons/Ionicons';
import color from './color';
import { SharedElement } from 'react-navigation-shared-element';

const Post = React.lazy(() => import('./Post'));

const MemoizedPost = React.memo(Post);

const RecommendedHome = ({navigation, route}) => {
  const {isShowBack} = route.params;
  const [networkIds, setNetworkIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [networkPosts, setNetworkPosts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [userIds, setUserIds] = useState([]);
  const [lastVisiblePost, setLastVisiblePost] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMorePosts, setLoadingMorePosts] = useState(false);
  const [userDetails, setUserDetails] = useState([]);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async (loadMore = false) => {
    if (!hasMore && loadMore) return;
    loadMore ? setLoadingMorePosts(true) : setLoading(true);

    try {
      const timestampLimit = firestore.Timestamp.fromDate(
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      );

      let newRecommendedPosts = [];
      const promises = [];

      const preferencesSnapshot = await firestore()
        .collection('Users')
        .doc(auth().currentUser.uid)
        .collection('Preferences')
        .orderBy('score', 'desc')
        .limit(8)
        .get();

      const preferredTopics = preferencesSnapshot.docs.map(doc => doc.id);

      if (preferredTopics && preferredTopics.length > 0) {
        console.log('PreferredTopics', preferredTopics);
        let recommendedQuery = firestore()
          .collection('Posts')
          .where('topic', 'array-contains-any', preferredTopics)
          .where('createdAt', '>=', timestampLimit)
          .orderBy('createdAt', 'desc')
          .orderBy('likeCount', 'desc')
          .limit(loadMore ? 5 : 2);

        if (loadMore && lastVisiblePost) {
          recommendedQuery = recommendedQuery.startAfter(lastVisiblePost);
        }

        promises.push(
          recommendedQuery.get().then(snapshot => {
            snapshot.forEach(doc => {
              newRecommendedPosts.push({post_id: doc.id, ...doc.data()});
            });
          }),
        );
      }

      console.log('Preferred posts', newRecommendedPosts);
      await Promise.all(promises);

      const uniquePosts = [
        ...new Map(
          newRecommendedPosts.map(post => [post.post_id, post]),
        ).values(),
      ];

      const shuffledPosts = shuffleArray(uniquePosts);

      if (shuffledPosts.length < (loadMore ? 5 : 2)) setHasMore(false);

      loadMore
        ? setNetworkPosts(prevPosts => {
            const newUniquePosts = shuffledPosts.filter(
              post => !prevPosts.find(p => p.post_id === post.post_id),
            );
            return injectAdsIntoPosts([...prevPosts, ...newUniquePosts]);
          })
        : setNetworkPosts(injectAdsIntoPosts(shuffledPosts));

      if (shuffledPosts.length > 0) {
        setLastVisiblePost(shuffledPosts[shuffledPosts.length - 1].createdAt);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
      setLoadingMorePosts(false);
      setRefreshing(false);
    }
  };

  const injectAdsIntoPosts = (posts, adFrequency = 10) => {
    const updatedPosts = [];
    let postCounter = 0;

    posts.forEach(post => {
      updatedPosts.push(post);
      postCounter++;

      if (postCounter >= adFrequency) {
        if (updatedPosts[updatedPosts.length - 1]?.type !== 'ad') {
          updatedPosts.push({
            type: 'ad',
            id: `ad-${uuid.v1()}`,
            adType: 'image',
          });
          postCounter = 0;
        }
      }
    });

    for (let i = 0; i < updatedPosts.length - 1; i++) {
      if (
        updatedPosts[i]?.type === 'ad' &&
        updatedPosts[i + 1]?.type === 'ad'
      ) {
        updatedPosts.splice(i + 1, 1);
      }
    }

    return updatedPosts;
  };

  const shuffleArray = array => {
    let currentIndex = array.length,
      randomIndex;
    while (currentIndex !== 0) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex],
        array[currentIndex],
      ];
    }
    return array;
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

  const renderPostOrAd = ({item, index}) => {
    if (item.type === 'ad') {
      return (
        <AdView
          loadOnMount={true}
          index={index}
          type={item.adType}
          media={false}
        />
      );
    }

    return (
      <SharedElement id={`item.${item.post_id}.post`}>
      <Suspense fallback={null}>
        <MemoizedPost post_id={item.post_id} network_id={item.network_id} />
      </Suspense>
      </SharedElement>
    );
  };

  return (
    <View style={styles.container}>
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={color} />
        </View>
      ) : (
        <View style={{width: '100%'}}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={{
              backgroundColor: '#1a1a1a',
              width: '95%',
              margin: 10,
              padding: 5,
              borderRadius: 3,
              flexDirection: 'row',
              gap: 5,
              alignItems: 'center'
            }}>
            {isShowBack && <Icon name="chevron-back" size={27} color={color} />}
            <Text
              style={{
                color: color,
                fontSize: 25,
                fontFamily: 'title3',
                marginLeft: 8,
              }}>
              Recommendations
            </Text>
          </Pressable>
          <FlatList
            data={networkPosts}
            keyExtractor={item => (item.type === 'ad' ? item.id : item.post_id)}
            renderItem={renderPostOrAd}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListFooterComponent={() => (
              <View
                style={{
                  height: 250,
                  width: '100%',
                  backgroundColor: 'black',
                  alignItems: 'center',
                }}>
                <Text
                  style={{color: 'grey', textAlign: 'center', marginTop: 20}}>
                  All posts have been viewed
                </Text>
              </View>
            )}
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
          />
        </View>
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
  header: {
    backgroundColor: '#1a1a1a',
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 25,
    fontWeight: 'bold',
    color: 'white',
  },
});

export default RecommendedHome;
