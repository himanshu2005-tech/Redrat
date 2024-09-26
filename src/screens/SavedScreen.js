import React, {useState, useEffect} from 'react';
import {
  Text,
  View,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import Post from './Post';
import { SharedElement } from 'react-navigation-shared-element';

const SavedScreen = ({navigation}) => {
  const [savedPosts, setSavedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const unsubscribe = firestore()
      .collection('Users')
      .doc(auth().currentUser.uid)
      .collection('saved')
      .orderBy('createdAt', 'desc')
      .onSnapshot(
        snapshot => {
          const posts = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          }));

          setSavedPosts(posts);
          setLoading(false);
        },
        error => {
          console.error('Error fetching liked posts:', error);
          setLoading(false);
        },
      );

    return () => unsubscribe();
  }, []);
  const onRefresh = () => {
    setRefreshing(true);
    fetchSavedPosts();
  };

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

  const renderFooter = () => {
    return (
      <View
        style={{height: 100, alignItems: 'center', justifyContent: 'center'}}>
        <Text style={{color: 'black'}}>All Saved Posts have been viewed</Text>
      </View>
    );
  };
  return (
    <View style={{flex: 1, backgroundColor: 'black'}}>
      <View style={styles.header}>
        <Icon
          name="chevron-back"
          size={28}
          color="#FF3131"
          onPress={() => navigation.goBack()}
        />
        <Text style={styles.title}>Saved</Text>
      </View>
      <FlatList
        data={savedPosts}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={{paddingHorizontal: 15}}
        ListFooterComponent={renderFooter}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 15,
    paddingBottom: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 0.3,
    borderColor: '#ccc',
  },
  title: {
    flex: 1,
    fontSize: 24,
    color: '#FF3131',
    marginLeft: 10,
    textAlign: 'center',
    letterSpacing: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
});

export default SavedScreen;
