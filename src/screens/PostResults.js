import React, { useState, useEffect } from 'react';
import { Text, View, FlatList, ActivityIndicator } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import Post from './Post';

export default function PostResults({ route }) {
  const { target } = route.params;
  const [posts, setPosts] = useState([]);
  const [lastVisible, setLastVisible] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, [target]);

  const fetchPosts = async (isLoadMore = false) => {
    if (loading || loadingMore) return;

    if (isLoadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const networksSnapshot = await firestore().collection('Network').get();
      let allPosts = [];
      
      await Promise.all(
        networksSnapshot.docs.map(async (networkDoc) => {
          const network_id = networkDoc.id;
          let postQuery = networkDoc.ref.collection('Posts').orderBy('createdAt', 'desc').limit(20);

          if (lastVisible) {
            postQuery = postQuery.startAfter(lastVisible);
          }

          const postSnapshot = await postQuery.get();
          const fetchedPosts = postSnapshot.docs.map((postDoc) => {
            const postData = postDoc.data();
            const post_id = postDoc.id;
            if (postData.title.includes(target) || postData.information.includes(target)) {
              return { network_id, post_id, ...postData };
            }
            return null;
          }).filter(post => post !== null);

          if (fetchedPosts.length > 0) {
            allPosts = [...allPosts, ...fetchedPosts];
            setLastVisible(postSnapshot.docs[postSnapshot.docs.length - 1]);
          }
        })
      );

      if (allPosts.length < 20) {
        setHasMore(false);
      }

      const shuffledPosts = shuffleArray(allPosts);
      setPosts((prevPosts) => (isLoadMore ? [...prevPosts, ...shuffledPosts] : shuffledPosts));
    } catch (error) {
      console.error('Error fetching posts: ', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const shuffleArray = (array) => {
    const shuffledArray = [...array];
    for (let i = shuffledArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
    }
    return shuffledArray;
  };

  const loadMorePosts = () => {
    if (!loadingMore && hasMore) {
      fetchPosts(true);
    }
  };

  const renderPost = ({ item }) => (
    <View>
      <Post network_id={item.network_id} post_id={item.post_id} />
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: 'black' }}>
      {loading && posts.length === 0 ? (
        <ActivityIndicator size="large" color="#ffffff" />
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.post_id}
          renderItem={renderPost}
          onEndReached={loadMorePosts}
          onEndReachedThreshold={0.5}
          ListFooterComponent={loadingMore && hasMore ? <ActivityIndicator size="small" color="#ffffff" /> : null}
        />
      )}
      {posts.length === 0 && !loading && (
        <Text style={{ color: "#1a1a1a", fontSize: 18, alignSelf: 'center' }}>No posts found.</Text>
      )}
    </View>
  );
}
