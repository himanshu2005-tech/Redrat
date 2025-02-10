import React, {useEffect, useState, useCallback} from 'react';
import {
  Text,
  View,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import Post from './Post';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import color from './color';
import { SharedElement } from 'react-navigation-shared-element';

export default function Mentions({id}) {
  const [posts, setPosts] = useState([]);
  const [lastDoc, setLastDoc] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchPosts = async (initial = false) => {
    if (loading || loadingMore) return;

    if (initial) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    let query = firestore()
      .collection('Users')
      .doc(id)
      .collection('Mentions')
      .orderBy('createdAt', 'desc')
      .limit(15);

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
    setLoadingMore(false);
  };

  useEffect(() => {
    fetchPosts(true);
  }, [id]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPosts(true).then(() => setRefreshing(false));
  }, []);

  const renderFooter = () => {
    if (!loadingMore)
      return (
        <View style={{flex: 1, backgroundColor: 'black', height: 300}}></View>
      );
    return (
      <ActivityIndicator
        size="large"
        color={color}
        style={{marginVertical: 20}}
      />
    );
  };

  return (
    <View style={{flex: 1, backgroundColor: 'black'}}>
      <FlatList
        data={posts}
        keyExtractor={item => item.id}
        renderItem={({item}) => (
          <SharedElement id={`item.${item.post_id}.post`}>
            <Post post_id={item.post_id} />
          </SharedElement>
        )}
        ListHeaderComponent={
          <View
            style={{backgroundColor: '#1a1a1a', margin: 10, borderRadius: 4}}>
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
        }
        ListEmptyComponent={
          !loading && (
            <View
              style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
              <Text
                style={{
                  color: 'grey',
                  fontSize: 18,
                  alignSelf: 'center',
                  paddingBottom: 200,
                  marginTop: 30,
                }}>
                No Mentions available
              </Text>
            </View>
          )
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[color]}
          />
        }
        ListFooterComponent={renderFooter}
        onEndReached={() => {
          if (lastDoc) fetchPosts(false);
        }}
        onEndReachedThreshold={0}
        contentContainerStyle={{
          flex: 1,
          backgroundColor: 'black',
          height: '100%',
        }}
      />
      {loading && posts.length === 0 && (
        <ActivityIndicator size="large" color={color} style={{marginTop: 20}} />
      )}
    </View>
  );
}
