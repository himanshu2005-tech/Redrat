import React, {useState, useEffect} from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import Icon from 'react-native-vector-icons/Ionicons';
import color from './color';
import {SharedElement} from 'react-native-shared-element';

const Post = React.lazy(() => import('./Post'));

export default function LikeScreen({navigation}) {
  const [likedPosts, setLikedPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastVisible, setLastVisible] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  const fetchLikedPosts = async (loadMore = false) => {
    if (loadMore && !hasMore) return;

    loadMore ? setLoadingMore(true) : setLoading(true);

    try {
      const currentUser = auth().currentUser.uid;
      let postsRef = firestore()
        .collection('Users')
        .doc(currentUser)
        .collection('Likes')
        .orderBy('likedAt', 'desc')
        .limit(15);

      if (loadMore && lastVisible) {
        postsRef = postsRef.startAfter(lastVisible);
      }

      const snapshot = await postsRef.get();
      if (!snapshot.empty) {
        const fetchedPosts = snapshot.docs.map(doc => ({
          id: doc.id,
        }));

        setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
        setLikedPosts(prev =>
          loadMore ? [...prev, ...fetchedPosts] : fetchedPosts,
        );
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error fetching liked posts:', error);
    } finally {
      loadMore ? setLoadingMore(false) : setLoading(false);
    }
  };

  useEffect(() => {
    fetchLikedPosts();
  }, []);

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      setLoadingMore(true);
      fetchLikedPosts(true);
    }
  };

  const renderFooter = () => {
    if (loadingMore) {
      return <ActivityIndicator size="small" color={color} />;
    }
    if (!hasMore) {
      return (
        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>No more liked posts</Text>
        </View>
      );
    }
    return null;
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <Icon
        name={'chevron-back'}
        size={25}
        color={color}
        onPress={() => navigation.goBack()}
      />
      <Text style={styles.headerText}>Liked Posts</Text>
    </View>
  );

  if (loading && !loadingMore) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={color} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={likedPosts}
        keyExtractor={item => item.id}
        renderItem={({item}) => (
          <SharedElement id={`item.${item.id}.post`}>
            <React.Suspense fallback={null}>
              <Post post_id={item.id} />
            </React.Suspense>
          </SharedElement>
        )}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        contentContainerStyle={styles.flatListContent}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0}
        scrollEventThrottle={16}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  flatListContent: {
    flexGrow: 1,
  },
  headerContainer: {
    padding: 10,
    alignItems: 'center',
    flexDirection: 'row',
    height: 60,
  },
  headerText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  footerContainer: {
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerText: {
    color: 'white',
  },
});
