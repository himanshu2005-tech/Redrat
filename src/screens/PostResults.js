import React, { useState, useEffect, Suspense, useMemo, useCallback } from 'react';
import {
  Text,
  View,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import { Pressable, ScrollView } from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/Ionicons';
import { splitString } from '../texting/textSplit';
import uuid from 'react-native-uuid';
import color from './color';
import { SharedElement } from 'react-navigation-shared-element';

const Post = React.lazy(() => import('./Post'));
const MemoizedPost = React.memo(Post);

const PostResults = ({ route }) => {
  const { target } = route.params;
  const [posts, setPosts] = useState([]);
  const [lastVisible, setLastVisible] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('Featured');

  const filters = ['Featured', 'Just In', 'Crowd Favorites', 'Snapshots', 'Motion Media'];

  useEffect(() => {
    resetPosts();
    fetchPosts();
  }, [target, filter]);

  const resetPosts = () => {
    setPosts([]);
    setLastVisible(null);
    setHasMore(true);
  };

  const fetchPosts = async (loadMore = false) => {
    if (loadMore && !hasMore) return;
    loadMore ? setLoadingMore(true) : setLoading(true);

    try {
      const string = splitString(target);
      const cleanedString = string.filter(item => item.trim() !== "");

      let postQuery = firestore().collection('Posts').where('title', 'array-contains-any', cleanedString);

      switch (filter) {
        case 'Featured':
          postQuery = postQuery.orderBy('likeCount', 'desc').orderBy('createdAt', 'desc');
          break;
        case 'Crowd Favorites':
          postQuery = postQuery.orderBy('likeCount', 'desc');
          break;
        case 'Just In':
          postQuery = postQuery.orderBy('createdAt', 'desc');
          break;
        case 'Snapshots':
          postQuery = postQuery.where('hasImages', '==', true);
          break;
        case 'Motion Media':
          postQuery = postQuery.where('hasVideo', '==', true);
          break;
      }

      if (loadMore && lastVisible) {
        postQuery = postQuery.startAfter(lastVisible);
      }

      const postSnapshot = await postQuery.get();

      const fetchedPosts = postSnapshot.docs.map(postDoc => ({
        post_id: postDoc.id,
        uniqueKey: postDoc.id,
        ...postDoc.data(),
      }));

      if (postSnapshot.docs.length > 0) {
        setLastVisible(postSnapshot.docs[postSnapshot.docs.length - 1]);
      } else {
        setHasMore(false);
      }

      setPosts(prevPosts => deduplicatePosts([...prevPosts, ...fetchedPosts]));
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  const deduplicatePosts = posts => {
    const seen = new Set();
    return posts.filter(post => {
      if (seen.has(post.uniqueKey)) return false;
      seen.add(post.uniqueKey);
      return true;
    });
  };

  const handleRefresh = () => {
    setRefreshing(true);
    resetPosts();
    fetchPosts();
  };

  const handleLoadMore = () => {
    if (!loadingMore) fetchPosts(true);
  };

  const renderPost = ({ item }) => (
    <SharedElement id={`item.${item.post_id}.post`}>
    <Suspense fallback={null}>
      <MemoizedPost post_id={item.post_id} key={uuid.v4()} />
    </Suspense>
    </SharedElement>
  );

  const renderFilter = useMemo(() => {
    return (
      <ScrollView
        horizontal
        contentContainerStyle={{ marginTop: 10 }}
        showsHorizontalScrollIndicator={false}
      >
        {filters.map(item => (
          <Pressable
            key={item}
            style={{
              paddingHorizontal: 20,
              padding: 10,
              backgroundColor: filter === item ? color : '#1a1a1a',
              borderRadius: 5,
              alignItems: 'center',
              justifyContent: 'center',
              marginLeft: 5,
              flexDirection: 'row',
              gap: 10,
            }}
            onPress={() => setFilter(item)}
          >
            <Icon
              color="white"
              size={20}
              name={
                item === 'Featured'
                  ? 'bar-chart'
                  : item === 'Crowd Favorites'
                  ? 'people'
                  : item === 'Just In'
                  ? 'archive'
                  : item === 'Snapshots'
                  ? 'image'
                  : 'play'
              }
            />
            <Text style={{ color: 'white' }}>{item}</Text>
          </Pressable>
        ))}
      </ScrollView>
    );
  }, [filter]);

  return (
    <View style={{ flex: 1, backgroundColor: 'black', justifyContent: 'center' }}>
      {loading && posts.length === 0 ? (
        <ActivityIndicator size="small" color={color} />
      ) : (
        <View style={{ flex: 1 }}>
          <FlatList
            data={posts}
            keyExtractor={item => item.uniqueKey}
            renderItem={renderPost}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
            ListHeaderComponent={renderFilter}
            ListEmptyComponent={
              <Text
                style={{
                  color: 'grey',
                  fontSize: 18,
                  alignSelf: 'center',
                  textAlign: 'center',
                  marginTop: 20,
                }}
              >
                No posts found.
              </Text>
            }
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            contentContainerStyle={{ paddingVertical: 0, flexGrow: 1 }}
          />
        </View>
      )}
    </View>
  );
};

export default PostResults;
