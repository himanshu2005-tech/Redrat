import React, { useEffect, useState, useCallback } from 'react';
import { Text, View, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import Post from './Post';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

export default function Mentions() {
  const [posts, setPosts] = useState([]);
  const [lastDoc, setLastDoc] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const user = auth().currentUser;

  const fetchPosts = async (initial = false) => {
    setLoading(true);
    let query = firestore()
      .collection('Users')
      .doc(user.uid)
      .collection('Mentions')
      .orderBy('createdAt', 'desc')
      .limit(20);

    if (lastDoc && !initial) {
      query = query.startAfter(lastDoc);
    }

    try {
      const snapshot = await query.get();
      const postsArray = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      if (initial) {
        setPosts(postsArray);
      } else {
        setPosts(prevPosts => [...prevPosts, ...postsArray]);
      }

      if (snapshot.docs.length > 0) {
        setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      } else {
        setLastDoc(null);
      }
    } catch (error) {
      console.error('Error fetching posts: ', error);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchPosts(true);
  }, [user]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPosts(true).then(() => setRefreshing(false));
  }, []);

  const handleLoadMore = () => {
    if (!loading && lastDoc) {
      fetchPosts();
    }
  };

  const isCloseToBottom = ({ layoutMeasurement, contentOffset, contentSize }) => {
    const paddingToBottom = 20;
    return (
      layoutMeasurement.height + contentOffset.y >=
      contentSize.height - paddingToBottom
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: 'black' }}>
      {posts.length > 0 ? (
        <>
        <View style={{backgroundColor: "#1a1a1a", margin: 10, borderRadius: 4}}>
          <Text
            style={{
              color: 'white',
              fontSize: 25,
              margin: 10,
              fontWeight: 'bold',
            }}>
            Mentions
          </Text>
          </View>
          <ScrollView
            contentContainerStyle={{ paddingBottom: 100 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#FF3131']}
              />
            }
            onScroll={({ nativeEvent }) => {
              if (isCloseToBottom(nativeEvent)) {
                handleLoadMore();
              }
            }}
            scrollEventThrottle={400}>
            {posts.map(item => (
              <Post
                key={item.id}
                post_id={item.post_id}
                network_id={item.network_id}
              />
            ))}
            {loading && <ActivityIndicator size="large" color="#FF3131" />}
          </ScrollView>
        </>
      ) : (
        // Show message when there are no posts
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: 'white', fontSize: 18, alignSelf: 'center'}}>No posts available</Text>
        </View>
      )}
    </View>
  );
}
