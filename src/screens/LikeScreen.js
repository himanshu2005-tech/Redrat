import React, { useState, useEffect } from 'react';
import {
  Text,
  View,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import Post from './Post';
import { SharedElement } from 'react-navigation-shared-element';

const LikeScreen = ({ navigation }) => {
  const [likedPosts, setLikedPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = firestore()
      .collection('Users')
      .doc(auth().currentUser.uid)
      .collection('likes')
      .orderBy('createdAt', 'desc')
      .onSnapshot(
        snapshot => {
          const posts = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          }));
          setLikedPosts(posts);
          setLoading(false);
        },
        error => {
          console.error('Error fetching liked posts:', error);
          setLoading(false);
        }
      );

    return () => unsubscribe();
  }, []);

  const renderItem = ({ item }) => (
    <SharedElement id={`post.${item.post_id}`}>
      <Post network_id={item.network_id} post_id={item.post_id} />
    </SharedElement>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF3131" />
      </View>
    );
  }

  const renderFooter = () => (
    <View style={styles.footerContainer}>
      <Text style={styles.footerText}>All Liked Posts have been viewed</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Icon
          name="chevron-back"
          size={28}
          color="#FF3131"
          onPress={() => navigation.goBack()}
        />
        <Text style={styles.title}>Liked</Text>
      </View>
      <FlatList
        data={likedPosts}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListFooterComponent={renderFooter}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  header: {
    backgroundColor: 'black',
    paddingVertical: 15,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 0.2,
    borderColor: '#ccc',
    gap: 20,
  },
  title: {
    flex: 1,
    fontSize: 24,
    color: '#FF3131',
    textAlign: 'center',
    letterSpacing: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
  footerContainer: {
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerText: {
    color: 'white',
  },
  listContent: {
    paddingHorizontal: 15,
  },
});

export default LikeScreen;
