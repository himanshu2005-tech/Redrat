import React, {useState, useEffect} from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import Post from './Post';
import Animated from 'react-native-reanimated';
import {SharedElement} from 'react-navigation-shared-element';

export default function RenderScreen({network_id, topic, filter}) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        let postsRef = firestore()
          .collection('Network')
          .doc(network_id)
          .collection('Posts');
  
        if (topic !== 'All') {
          postsRef = postsRef.where('selectedSubtopics', 'array-contains', topic);
        }
  
        if (filter === "New") {
          postsRef = postsRef.orderBy('createdAt', 'desc');
        } else if (filter === "Popular") {
          postsRef = postsRef.orderBy('likeCount', 'desc');
        }
  
        const snapshot = await postsRef.get();
  
        if (!snapshot.empty) {
          let fetchedPosts = [];
          snapshot.forEach(doc => {
            fetchedPosts.push({ id: doc.id, ...doc.data() });
          });
          setPosts(fetchedPosts);
        } else {
          console.log('No posts found for topic:', topic);
        }
      } catch (error) {
        console.error('Error fetching posts:', error);
      } finally {
        setLoading(false);
        console.log("topic", topic);
        console.log("filter", filter);
      }
    };
  
    fetchPosts();
  }, [network_id, topic, filter]);
  

  const renderEmptyComponent = () => (
    <Text style={styles.emptyText}>
      {topic === 'All' ? 'No posts' : `No networks posts on ${topic}`}
    </Text>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF3131" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        keyExtractor={item => item.id}
        renderItem={({item}) => (
          <SharedElement id={`post.${item.id}`}>
            <Post post_id={item.id} network_id={network_id} />
          </SharedElement>
        )}
        contentContainerStyle={styles.flatListContent}
        ListEmptyComponent={renderEmptyComponent()}
      />
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
  flatListContent: {
    flexGrow: 1,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
    color: 'black',
  },
});
