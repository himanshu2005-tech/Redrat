import React, {useState, useEffect} from 'react';
import {
  Text,
  View,
  FlatList,
  ActivityIndicator,
  Pressable,
  Modal,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import firestore from '@react-native-firebase/firestore';
import Post from './Post';
import auth from '@react-native-firebase/auth'
import color from './color';
import {SharedElement} from 'react-navigation-shared-element';

export default function ReportedPosts({navigation, route}) {
  const {network_id, networkDetails} = route.params;
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastDoc, setLastDoc] = useState(null);
  const [isFetching, setIsFetching] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [banModalVisible, setBanModalVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [status, setStatus] = useState()
  const [removeLoading, setRemoveLoading] = useState(false)


  React.useEffect(() => {
    if(networkDetails.admin != auth().currentUser.uid){
      navigation.popToTop();
    }
  }, [network_id, networkDetails])
  const removePost = async () => {
    try {
      console.log('Deleting Post ID:', selectedPost.id);
      setStatus("Deleting Post...");
      await firestore()
        .collection('Posts')
        .doc(selectedPost.id)
        .delete();
      console.log('Deleted post from Posts collection');
  
      await firestore()
        .collection('Network')
        .doc(network_id)
        .collection('ReportedPosts')
        .doc(selectedPost.id)
        .delete();
      console.log('Deleted post from Reports collection');
  
      setStatus("");
      setPosts(prev => prev.filter(post => post.id !== selectedPost.id));
      setModalVisible(false);
    } catch (error) {
      console.log('Error deleting post:', error);
      setStatus("");
      Alert.alert('Error', 'Failed to delete the post. Please try again.');
    }
  };
  
  const removeHealthyPost = async(id) => {
    setRemoveLoading(true)
    try{
      await firestore()
        .collection('Network')
        .doc(network_id)
        .collection('ReportedPosts')
        .doc(id)
        .delete();
      console.log('Deleted post from Reports collection');
      setPosts(prev => prev.filter(post => post.id !== id));
    } catch(error){
      console.warn(error)
    } finally{
      setRemoveLoading(false)
    }
  }
  const banUser = async () => {
    try {
      setStatus("Banning User...");
      await removePost();
  
      const userDoc = await firestore()
        .collection('Users')
        .doc(selectedPost.posted_by)
        .get();
  
      if (!userDoc.exists) {
        setStatus("");
        setBanModalVisible(false);
        setPosts(prev => prev.filter(post => post.id !== selectedPost.id));
        Alert.alert('User not found', 'The user has deleted their account.');
        return; 
      }
  

      await firestore()
        .collection('Network')
        .doc(network_id)
        .update({
          members: firestore.FieldValue.arrayRemove(selectedPost.posted_by),
          joined: firestore.FieldValue.increment(-1),
          bannedUsers: firestore.FieldValue.arrayUnion(selectedPost.posted_by),
        });
  
      const networkRef = firestore()
        .collection('Users')
        .doc(selectedPost.posted_by)
        .collection('JoinedNetworks')
        .doc(network_id);
  
      const networkDoc = await networkRef.get();
  
      if (networkDoc.exists) {
        await networkRef.delete();
      }
  
      setStatus("");
      setBanModalVisible(false);
      setPosts(prev => prev.filter(post => post.id !== selectedPost.id));
    } catch (error) {
      setStatus("");
      Alert.alert('Error', 'Failed to ban the user. Please try again.');
    }
  };
  
  

  const fetchPosts = async (startAfter = null) => {
    setIsFetching(true);
    let query = firestore()
      .collection('Network')
      .doc(network_id)
      .collection('ReportedPosts')
      .orderBy('report_count', 'desc')
      .limit(10);

    if (startAfter) query = query.startAfter(startAfter);

    const snapshot = await query.get();
    const fetchedPosts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
    setPosts(prev => [...prev, ...fetchedPosts]);
    setLoading(false);
    setIsFetching(false);
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const renderPost = ({item}) => (
    <View
      style={{
        marginHorizontal: 10,
        backgroundColor: '#1a1a1a',
        marginBottom: 10,
        padding: 4,
      }}>
      <SharedElement id={`item.${item.post_id}.post`}>
      <Post post_id={item.post_id} />
      </SharedElement>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-evenly',
        }}>
        <Pressable
          style={{
            backgroundColor: color,
            padding: 10,
            borderRadius: 5,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 10,
            marginTop: 10,
            flexDirection: 'row',
            justifyContent: 'space-between',
          }}
          onPress={() => {
            setSelectedPost(item);
            setModalVisible(true);
          }}>
          <Text style={{color: 'white'}}>Remove Post</Text>
        </Pressable>
        <Pressable
          style={{
            backgroundColor: 'white',
            padding: 10,
            borderRadius: 5,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 10,
            marginTop: 10,
            flexDirection: 'row',
            justifyContent: 'space-between',
          }}
          onPress={() => {
            setSelectedPost(item);
            setBanModalVisible(true);
          }}>
          <Text style={{color: color}}>Remove Post and Ban User</Text>
        </Pressable>
      </View>

      <Pressable
          style={{
            backgroundColor: 'white',
            padding: 10,
            borderRadius: 5,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 10,
            marginTop: 10,
            flexDirection: 'row',
            margin: 10
          }}
          onPress={() => {
            removeHealthyPost(item.id)
          }}>
          {!removeLoading ? (
            <Text style={{color: color}}>Post is Healthy</Text>
          ) : (
            <ActivityIndicator color={color} size={"small"} />
          )}
          
        </Pressable>
      <Text style={{color: 'white'}}>No of reports: {item.report_count}</Text>
    </View>
  );

  const handleLoadMore = () => {
    if (!isFetching && lastDoc) fetchPosts(lastDoc);
  };

  return (
    <View style={{flex: 1, backgroundColor: 'black'}}>
      <View style={{flexDirection: 'row', alignItems: 'center', margin: 10}}>
        <Icon
          name="chevron-back"
          color={color}
          size={28}
          onPress={() => navigation.goBack()}
        />
        <Text style={{fontSize: 18, color: 'white', marginLeft: 10}}>
          Reported Posts
        </Text>
        <Text
          style={{color: 'grey', fontSize: 14, position: 'absolute', right: 5}}>
          Violated Network Rules
        </Text>
      </View>
      {loading ? (
        <ActivityIndicator
          size="large"
          color={color}
          style={{marginTop: 20}}
        />
      ) : (
        <FlatList
          data={posts}
          renderItem={renderPost}
          keyExtractor={item => item.id}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            isFetching ? (
              <ActivityIndicator size="small" color={color} />
            ) : null
          }
        />
      )}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}>
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0,0,0,0.7)',
          }}>
          <View
            style={{
              backgroundColor: 'black',
              borderRadius: 10,
              padding: 20,
              alignItems: 'center',
              width: '90%',
            }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: 'bold',
                marginBottom: 20,
                color: 'white',
                textAlign: 'center',
              }}>
              Are you sure you want to remove this post?
            </Text>
            <View
              style={{flexDirection: 'row', justifyContent: 'space-evenly', width: "100%", alignItems: 'center'}}>
              <Pressable
                style={{
                  backgroundColor: color,
                  padding: 10,
                  borderRadius: 5,
                  width: '48%',
                  alignItems: 'center',
                }}
                onPress={removePost}>

                <Text style={{color: 'white', fontWeight: 'bold'}}>Yes</Text>
              </Pressable>
              <Pressable
                style={{
                  backgroundColor: '#CCCCCC',
                  padding: 10,
                  borderRadius: 5,
                  width: '48%',
                  alignItems: 'center',
                }}
                onPress={() => setModalVisible(false)}>
                <Text style={{color: color}}>No</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={banModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setBanModalVisible(false)}>
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0,0,0,0.7)',
          }}>
          <View
            style={{
              backgroundColor: 'black',
              borderRadius: 10,
              padding: 20,
              alignItems: 'center',
              width: '90%',
            }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: 'bold',
                marginBottom: 20,
                color: 'grey',
                textAlign: 'center',
              }}>
              Are you sure you want to remove this post and ban the user?
            </Text>
            <View
              style={{flexDirection: 'row', justifyContent: 'space-evenly', width: "100%"}}>
              <Pressable
                style={{
                  backgroundColor: color,
                  padding: 10,
                  borderRadius: 5,
                  width: "45%",
                  alignItems: 'center'
                }}
                onPress={banUser}>
                <Text style={{color: 'white', fontWeight: 'bold'}}>Yes</Text>
              </Pressable>
              <Pressable
                style={{
                  backgroundColor: '#CCCCCC',
                  padding: 10,
                  borderRadius: 5,
                  width: "45%",
                  alignItems: 'center'
                }}
                onPress={() => setBanModalVisible(false)}>
                <Text style={{color: color}}>No</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}


