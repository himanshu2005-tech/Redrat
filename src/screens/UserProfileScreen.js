import React, { useEffect, useState } from 'react';
import {
  Text,
  View,
  StyleSheet,
  ScrollView,
  Image,
  RefreshControl,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import ProfileScreen from './ProfileScreen';
import Icon from 'react-native-vector-icons/Ionicons';
import Post from './Post';
import Bluing from '../texting/Bluing';

export default function UserProfileScreen({ route, navigation }) {
  const { id } = route.params;
  const user = auth().currentUser;
  const [userDetails, setUserDetails] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [requested, setRequested] = useState(false);
  const [isRequested, setIsRequested] = useState(false);
  const [friend, setFriend] = useState(false);
  const [posts, setPosts] = useState([]);
  const [lastDoc, setLastDoc] = useState(null);
  const [isPrivate, setIsPrivate] = useState(false);

  const fetchPosts = async (initial = false) => {
    if (initial) {
      setLastDoc(null); 
      setPosts([]);  
    }

    setLoading(true);

    let query = firestore()
      .collection('Users')
      .doc(id)
      .collection("Posts")
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
  }, [id]);

  useEffect(() => {
    const unsubscribe = firestore().collection('Users').doc(id).onSnapshot(snapshot => {
      const userData = snapshot.data();
      setUserDetails(userData);
      setIsPrivate(userData.isPrivate);

      const isFriend = userData?.friends?.includes(auth().currentUser.uid);
      setFriend(isFriend);

      firestore().collection('Users').doc(auth().currentUser.uid).get().then(currentUserDoc => {
        const currentUserData = currentUserDoc.data();
        const isRequested = currentUserData?.requested?.includes(id);
        setRequested(isRequested);

        const hasRequest = userData?.requested?.includes(auth().currentUser.uid);
        setIsRequested(hasRequest);
      });
    });

    return () => unsubscribe();
  }, [id]);

  const onFollow = async () => {
    try {
      const userUid = auth().currentUser?.uid;
      if (!userUid) {
        console.error('User is not authenticated');
        return;
      }
  
      const currentUserDoc = firestore().collection('Users').doc(userUid);
      const currentUserData = (await currentUserDoc.get()).data();
  
      if (!currentUserData) {
        console.error('Current user data not found');
        return;
      }
  
      const userCollectionRef = firestore().collection('Users').doc(id);
      
      if(!isPrivate){
        await firestore().collection('Users').doc(id).update({
          friends: firestore.FieldValue.arrayUnion(auth().currentUser.uid),
        });

        await firestore().collection('Users').doc(auth().currentUser.uid).update({
          friends: firestore.FieldValue.arrayUnion(id),
        });

        return ;
      }

      if (requested) {
        await currentUserDoc.update({
          requested: firestore.FieldValue.arrayRemove(id),
        });
        await userCollectionRef.collection('Requests').doc(userUid).delete();
        setRequested(false);
      } else {
        await currentUserDoc.update({
          requested: firestore.FieldValue.arrayUnion(id),
        });
        await userCollectionRef.collection('Requests').doc(userUid).set({
          type: 'friend_request',
          userId: userUid,
          createdAt: firestore.FieldValue.serverTimestamp(),
        });
        setRequested(true);
      }
    } catch (error) {
      console.error('Error updating follow status:', error);
    }
  };
  

  const cancelRequest = async () => {
    try {
      const userCollectionRef = firestore().collection('Users').doc(auth().currentUser.uid);
      const userUid = auth().currentUser?.uid;
      await firestore().collection('Users').doc(id).update({
        requested: firestore.FieldValue.arrayRemove(auth().currentUser.uid),
      });
      await userCollectionRef.collection('Requests').doc(id).delete();
      setIsRequested(false);
    } catch (error) {
      console.warn('Error canceling request:', error);
    }
  };

  const onRequestAccept = async () => {
    try {
      const userCollectionRef = firestore().collection('Users').doc(auth().currentUser.uid);
      const userUid = auth().currentUser?.uid;
      await firestore().collection('Users').doc(id).update({
        requested: firestore.FieldValue.arrayRemove(auth().currentUser.uid),
        friends: firestore.FieldValue.arrayUnion(auth().currentUser.uid),
      });
      await firestore().collection('Users').doc(auth().currentUser.uid).update({
        friends: firestore.FieldValue.arrayUnion(id),
      });
      await userCollectionRef.collection('Requests').doc(id).delete();
      setIsRequested(false);
      setFriend(true);
    } catch (error) {
      console.error('Error accepting request:', error);
    }
  };

  const removeFriend = async () => {
    try {
      await firestore().collection('Users').doc(auth().currentUser.uid).update({
        friends: firestore.FieldValue.arrayRemove(id),
      });
      await firestore().collection('Users').doc(id).update({
        friends: firestore.FieldValue.arrayRemove(auth().currentUser.uid),
      });
      setFriend(false);
      setIsRequested(true);
    } catch (error) {
      console.error('Error removing friend:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUserData();
    setRefreshing(false);
  };

  if (id === auth().currentUser.uid) {
    return <ProfileScreen />;
  }


  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Icon name="chevron-back" size={28} color="#FF3131" onPress={() => navigation.goBack()} />
        <Text style={styles.title}>{userDetails.name}</Text>
      </View>
      <View style={styles.profileInformation}>
        <Image source={{ uri: userDetails.profile_pic }} style={styles.profilePic} />
        <View>
          <Text style={styles.name}>{userDetails.name}</Text>
          <Text style={styles.email}>{userDetails.email}</Text>
        </View>
      </View>
      <View style={{backgroundColor: "#1a1a1a", width: "90%", alignSelf: 'center', margin: 10, padding: 4, borderRadius: 5}}>
        <Bluing text={userDetails.bio} style={{color: 'white', fontSize: 17, margin: 10}} />
      </View>
      {(!isRequested && !friend) && (
        <Pressable
          style={[styles.followContainer, requested && { backgroundColor: 'grey' }]}
          onPress={onFollow}
        >
          <Text style={styles.followText}>
            {requested ? 'Requested' : 'Follow'}
          </Text>
        </Pressable>
      )}
      {isRequested && (
        <View style={styles.actionContainer}>
          <Pressable style={styles.acceptButton} onPress={onRequestAccept}>
            <Text style={styles.actionText}>Accept Request</Text>
          </Pressable>
          <Pressable style={styles.cancelButton} onPress={cancelRequest}>
            <Text style={styles.actionText}>Cancel</Text>
          </Pressable>
        </View>
      )}
      {friend && (
        <View style={styles.actionContainer}>
          <Pressable style={styles.chatButton} onPress={() => navigation.navigate("Chat", {
            id: id
          })}>
            <Text style={styles.actionText}>Chat</Text>
          </Pressable>
          <Pressable style={styles.removeFriendButton} onPress={removeFriend}>
            <Text style={styles.actionText}>Remove friend</Text>
          </Pressable>
        </View>
      )}
      {posts.length > 0 && friend && (
        <Text style={{ color: 'white', fontSize: 25, margin: 10, fontWeight: 'bold' }}>Posts</Text>
      )}
      {isPrivate ? (
        loading ? (
          <ActivityIndicator style={styles.loader} size="large" color="#FF3131" />
        ) : friend ? (
          posts.length > 0 ? (
            posts.map((item) => (
              <Post key={item.post_id} post_id={item.post_id} network_id={item.network_id} />
            ))
          ) : (
            <Text style={styles.noPostsText}>No posts available</Text>
          )
        ) : (
          <Text style={styles.noPostsText}>This account is private.</Text>
        )
      ) : posts.length > 0 ? (
        posts.map((item) => (
          <Post key={item.post_id} post_id={item.post_id} network_id={item.network_id} />
        ))
      ) : (
        <Text style={styles.noPostsText}>No posts available</Text>
      )}
      
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'black',
    flex: 1,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
  header: {
    backgroundColor: 'black',
    width: '100%',
    padding: 10,
    borderBottomWidth: 0.2,
    borderColor: '#ccc',
    margin: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    fontSize: 18,
    color: 'white',
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  email: {
    fontSize: 15,
    color: 'grey',
    letterSpacing: 1,
  },
  title: {
    fontSize: 24,
    color: '#FF3131',
    marginLeft: 10,
    textAlign: 'center',
    letterSpacing: 1,
  },
  profileInformation: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 0.5,
    borderColor: '#ccc',
    justifyContent: 'space-evenly',
  },
  profilePic: {
    width: 100,
    height: 100,
    borderRadius: 50,
    margin: 10,
  },
  followContainer: {
    width: '90%',
    backgroundColor: '#FF3131',
    alignSelf: 'center',
    alignItems: 'center',
    margin: 10,
    padding: 10,
    borderRadius: 5,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  followText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
  actionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    marginTop: 10,
  },
  acceptButton: {
    backgroundColor: '#FF3131',
    width: '48%',
    padding: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  cancelButton: {
    backgroundColor: '#1a1a1a',
    width: '48%',
    padding: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  chatButton: {
    backgroundColor: '#FF3131',
    width: '48%',
    padding: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  removeFriendButton: {
    backgroundColor: '#1a1a1a',
    width: '48%',
    padding: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  actionText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '400',
  },
});
