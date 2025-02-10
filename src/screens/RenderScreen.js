import React, {useState, useEffect, Suspense} from 'react';
import {
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
  FlatList,
  Dimensions,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import {debounce} from 'lodash';
import {AdView} from '../ads/AdView';
import uuid from 'react-native-uuid';
import {splitString} from '../texting/textSplit';
import { SharedElement } from 'react-navigation-shared-element';

const Post = React.lazy(() => import('./Post'));

const injectAdsIntoPosts = (posts, adFrequency = 10) => {
  const updatedPosts = [];
  posts.forEach((post, index) => {
    updatedPosts.push(post);
    if ((index + 1) % adFrequency === 0) {
      updatedPosts.push({
        type: 'ad',
        id: `ad-${uuid.v1()}`,
        adType: 'image',
      });
    }
  });
  return updatedPosts.filter(
    (item, index, array) =>
      item.type !== 'ad' || array[index - 1]?.type !== 'ad',
  );
};

export default function RenderScreen({
  network_id,
  topic,
  filter,
  searchInput,
  isSearchInput,
}) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastVisible, setLastVisible] = useState(null);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  const debouncedFetch = debounce(() => fetchPosts(true), 500);

  useEffect(() => {
    debouncedFetch();
    return () => debouncedFetch.cancel();
  }, [searchInput, network_id, topic, filter, isSearchInput]);

  const fetchPosts = async (isInitialLoad = false) => {
    if (loading || isFetchingMore) return;
    if (isInitialLoad) setLoading(true);
    else setIsFetchingMore(true);

    try {
      let postsRef = firestore()
        .collection('Posts')
        .where('network_id', '==', network_id);

      if (topic !== 'All' && topic) {
        postsRef = postsRef.where('selectedSubtopics', 'array-contains', topic);
      }

      switch (filter) {
        case 'Featured':
          postsRef = postsRef
            .orderBy('likeCount', 'desc')
            .orderBy('createdAt', 'desc');
          break;
        case 'Just In':
          postsRef = postsRef.orderBy('createdAt', 'desc');
          break;
        case 'Crowd Favorites':
          postsRef = postsRef.orderBy('likeCount', 'desc');
          break;
        case 'Snapshots':
          postsRef = postsRef.where('hasImages', '==', true);
          break;
        case 'Motion Media':
          postsRef = postsRef.where('hasVideo', '==', true);
          break;
        default:
          break;
      }

      if (searchInput.trim()) {
        const keywords = splitString(searchInput).filter(word => word.trim());
        if (keywords.length) {
          postsRef = postsRef.where('title', 'array-contains-any', keywords);
        }
      }

      if (lastVisible) {
        postsRef = postsRef.startAfter(lastVisible);
      }

      const snapshot = await postsRef.limit(2).get();
      console.log('Fetching.//');
      const fetchedPosts = snapshot.empty
        ? []
        : snapshot.docs.map(doc => ({id: doc.id, ...doc.data()}));

      const uniquePosts = [
        ...new Map(
          [...(isInitialLoad ? [] : posts), ...fetchedPosts].map(item => [
            item.id,
            item,
          ]),
        ).values(),
      ];

      setPosts(injectAdsIntoPosts(uniquePosts));
      setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      if (isInitialLoad) setLoading(false);
      else setIsFetchingMore(false);
    }
  };

  const renderNoPosts = () => (
    <View style={styles.noPostsContainer}>
      <Text style={styles.noPostsText}>
        {searchInput.trim()
          ? 'No posts found'
          : 'A blank canvas... what will your first post be?'}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#FF3131" />
        </View>
      ) : posts.length > 0 ? (
        <FlatList
          data={posts}
          keyExtractor={item => item.id}
          renderItem={({item}) =>
            item.type === 'ad' ? (
              <Suspense
                fallback={<ActivityIndicator size="small" color="#FF3131" />}>
                <AdView
                  loadOnMount={true}
                  index={item.id}
                  type={item.adType}
                  media={false}
                />
              </Suspense>
            ) : (
              <SharedElement id={`item.${item.id}.post`}>
                <Suspense fallback={null}>
                  <Post post_id={item.id} />
                </Suspense>
              </SharedElement>
            )
          }
          onEndReached={() => fetchPosts(false)}
          onEndReachedThreshold={1}
        />
      ) : (
        renderNoPosts()
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  noPostsContainer: {
    height: Dimensions.get('screen').height / 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noPostsText: {
    color: 'grey',
    fontSize: 15,
  },
});
