import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Text,
  View,
  FlatList,
  ScrollView,
  TouchableOpacity,
  Button,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import Icon from 'react-native-vector-icons/Ionicons';
import Post from './Post';
import color from './color';
import {SharedElement} from 'react-navigation-shared-element';

export default function TopicPosts({ route }) {
  const { topic } = route.params;
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastVisible, setLastVisible] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [filter, setFilter] = useState('Just In');
  const [sortOption, setSortOption] = useState('Just In');

  const toggleSortOption = (option) => {
    setSortOption(option);
    setFilter(option);
  };

  const fetchPosts = async (loadMore = false) => {

    if (loadMore && !hasMore) return;

    loadMore ? setLoadingMore(true) : setLoading(true);

    try {
      let postsRef = firestore()
        .collection('Posts')
        .where('topic', 'array-contains', topic);

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
      }

      if (loadMore && lastVisible) {
        postsRef = postsRef.startAfter(lastVisible); 
      }

      const snapshot = await postsRef.limit(10).get(); 
      if (!snapshot.empty) {
        const fetchedPosts = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
        setPosts(prevPosts => (loadMore ? [...prevPosts, ...fetchedPosts] : fetchedPosts));
      } else {
        setHasMore(false); 
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      loadMore ? setLoadingMore(false) : setLoading(false);
    }
  };

  useEffect(() => {
    setPosts([])
    fetchPosts(); 
  }, [filter]);

  const handleLoadMore = () => {
    if (!loadingMore) {
      fetchPosts(true); 
    }
  };

  const renderFooter = () => {
    if (loadingMore) {
      return <ActivityIndicator size="small" color={color} />;
    }
    if (!hasMore) {
      return (
        <View style={{ height: 100, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: 'white' }}>No more posts available</Text>
        </View>
      );
    }
    return null;
  };

  if (loading && !loadingMore) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={color} />
      </View>
    );
  }

  return (
    <View style={{ backgroundColor: 'black', flex: 1 }}>
      <Text
        style={{ color: color, margin: 15, fontSize: 20, fontWeight: '900' }}>
        Posts on {topic}
      </Text>
      <View style={{ width: '100%' }}>
        <ScrollView
          contentContainerStyle={{
            flexDirection: 'row',
            gap: 15,
            paddingVertical: 10,
            paddingHorizontal: 5,
          }}
          horizontal
          nestedScrollEnabled
          showsHorizontalScrollIndicator={false}>
          {['Featured', 'Just In', 'Crowd Favorites', 'Snapshots', 'Motion Media'].map((option) => (
            <TouchableOpacity
              key={option}
              onPress={() => toggleSortOption(option)}
              style={{
                backgroundColor: sortOption === option ? color : '#333',
                paddingVertical: 10,
                paddingHorizontal: 20,
                borderRadius: 5,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                marginRight: 10,
              }}>
              <Icon
                name={
                  option === 'Featured'
                    ? 'bar-chart'
                    : option === 'Just In'
                    ? 'archive'
                    : option === 'Crowd Favorites'
                    ? 'people'
                    : option === 'Snapshots'
                    ? 'image'
                    : 'play'
                }
                size={20}
                color={sortOption === option ? 'white' : 'white'}
              />
              <Text style={{ color: 'white', fontSize: 16 }}>{option}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {posts.length === 0 ? (
        <Text style={{ color: 'grey', textAlign: 'center', fontSize: 15, marginTop: "50%", marginHorizontal: 10 }}>No posts match the criteria applied in this filter. Please modify your input to check for different results</Text>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <SharedElement id={`item.${item.id}.post`}>
              <Post post_id={item.id} network_id={item.network_id} />
            </SharedElement>
          )}
          ListFooterComponent={renderFooter}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={1}
        />
      )}
    </View>
  );
}
