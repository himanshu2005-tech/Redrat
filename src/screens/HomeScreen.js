import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import firestore, { collection } from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { SharedElement } from 'react-navigation-shared-element';
import Post from './Post';

const HomeScreen = ({navigation}) => {
  const [networkIds, setNetworkIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [networkPosts, setNetworkPosts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [userIds, setUserIds] = useState([])

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      try {
        const user = auth().currentUser;

        const userDocRef = firestore().collection('Users').doc(user.uid);
        const userDoc = await userDocRef.get();

        if (userDoc.exists) {
          const userData = userDoc.data();
          const joinedNetworks = userData.joined_networks || [];
          setNetworkIds(joinedNetworks);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
    fetchPosts()
  }, []);
  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      try {
        const user = auth().currentUser;

        const userDocRef = firestore().collection('Users').doc(user.uid);
        const userDoc = await userDocRef.get();

        if (userDoc.exists) {
          const userData = userDoc.data();
          const id = userData.friends || [];
          setUserIds(id);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const fetchedPosts = [];
      const currentDate = new Date();
      const daysAgo = 20;
  
      for (const userId of userIds) {
        const querySnapshot = await firestore()
          .collection("Users")
          .doc(userId)
          .collection("Posts")
          .where(
            'createdAt',
            '>=',
            firestore.Timestamp.fromDate(
              new Date(currentDate - daysAgo * 24 * 60 * 60 * 1000),
            ),
          )
          .orderBy('createdAt', 'desc')
          .get();
  
        for (const doc of querySnapshot.docs) {
          const postData = doc.data();
  
          const userDoc = await firestore()
            .collection('Users')
            .doc(userId)
            .get();
          const userData = userDoc.data();
  
          const postWithUserData = {
            post_id: doc.id, 
            ...postData,
            user: userData,  
            network_id: postData.network_id || null,  
          };
  
          fetchedPosts.push(postWithUserData);
        }
      }
  
      for (const networkId of networkIds) {
        const querySnapshot = await firestore()
          .collection('Network')
          .doc(networkId)
          .collection('Posts')
          .where(
            'createdAt',
            '>=',
            firestore.Timestamp.fromDate(
              new Date(currentDate - daysAgo * 24 * 60 * 60 * 1000),
            ),
          )
          .orderBy('createdAt', 'desc')
          .get();
  
        for (const doc of querySnapshot.docs) {
          const postData = doc.data();
          const {posted_by} = postData;
  
          const userDoc = await firestore()
            .collection('Users')
            .doc(posted_by)
            .get();
          const userData = userDoc.data();
  
          const postWithUserData = {
            post_id: doc.id,
            ...postData,
            user: userData,  
            network_id: networkId, 
          };
  
          fetchedPosts.push(postWithUserData);
        }
      }
  
      const shuffledPosts = shuffleArray(fetchedPosts);
      setNetworkPosts(shuffledPosts);
  
      console.log("Fetched posts:", fetchedPosts.map(post => post.post_id));
      console.log("Shuffled posts:", shuffledPosts.map(post => post.post_id));
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  const shuffleArray = array => {
    let currentIndex = array.length, randomIndex;

    while (currentIndex !== 0) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;

      [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }

    return array;
  };

  useEffect(() => {
    if (networkIds.length > 0) {
      fetchPosts();
    } else {
      setLoading(false);
    }
  }, [networkIds]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPosts();
  };

  const renderFooter = () => {
    if (networkPosts.length === 0 && !loading) {
      return null;
    }

    return (
      <View style={styles.footer}>
        <Text style={styles.footerText}>All posts have been read</Text>
      </View>
    );
  };

  const renderPost = ({item}) => (
      <SharedElement id={`post.${item.post_id}`}>
        <Post post_id={item.post_id} network_id={item.network_id} />
      </SharedElement>
  )

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF3131" />
        </View>
      ) : (
        <FlatList
          data={networkPosts}
          keyExtractor={item => item.post_id}
          renderItem={renderPost}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={(
            <View style={styles.lottieContainer}>
              <Text style={{color: 'gray', fontSize: 14, marginTop: 20}}>
                Associate with network to display those posts
              </Text>
            </View>
          )}
          ListFooterComponent={renderFooter}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: 'black',
    width: '100%',
    padding: 15,
    borderBottomWidth: 0.2,
    borderColor: '#ccc',
    margin: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lottie: {
    width: 200,
    height: 200,
  },
  title: {
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
  },
  container: {
    backgroundColor: 'black',
    flex: 1
  },
  emptyMessage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  networkItem: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  networkName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'black',
  },
  networkType: {
    fontSize: 16,
    color: 'grey',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    height: 150,
  },
  footerText: {
    fontSize: 16,
    color: 'black',
  },
  lottieContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default HomeScreen;
