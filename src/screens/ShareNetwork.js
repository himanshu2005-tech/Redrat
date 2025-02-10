import React, {useState, useEffect, Suspense} from 'react';
import {
  Text,
  View,
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  TouchableOpacity,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import {useRoute} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import color from './color';
import {SharedElement} from 'react-navigation-shared-element';

const Post = React.lazy(() => import('./Post'));

export default function ShareNetwork({navigation}) {
  const [savedPosts, setSavedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastVisible, setLastVisible] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sortingOrder, setSortingOrder] = useState('ASC');
  const [showModal, setShowModal] = useState(false);

  const route = useRoute();
  const {network_id, network_name} = route.params;

  useEffect(() => {
    fetchSavedPosts();
  }, [network_id, sortingOrder]);

  const fetchSavedPosts = async (loadMore = false) => {
    if (loadMore) setLoadingMore(true);
    else setLoading(true);

    try {
      let query = firestore()
        .collection('Users')
        .doc(auth().currentUser.uid)
        .collection('Saves')
        .where('network_id', '==', network_id);
      if (sortingOrder === 'ASC') {
        query = query.orderBy('savedAt');
      } else {
        query = query.orderBy('savedAt', 'desc');
      }
      query = query.limit(10);

      if (loadMore && lastVisible) {
        query = query.startAfter(lastVisible);
      }

      const snapshot = await query.get();
      const posts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      if (loadMore) {
        setSavedPosts(prevPosts => [...prevPosts, ...posts]);
      } else {
        setSavedPosts(posts);
      }

      setLastVisible(snapshot.docs[snapshot.docs.length - 1] || null);
    } catch (error) {
      console.warn('Error fetching saved posts:', error?.message || error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMorePosts = () => {
    if (!loadingMore && lastVisible) {
      fetchSavedPosts(true);
    }
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return <ActivityIndicator size="small" color={color} />;
  };

  return (
    <View style={{backgroundColor: 'black', flex: 1}}>
      <View
        style={{
          backgroundColor: 'black',
          padding: 15,
          borderBottomWidth: 0.7,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
        <View style={{flexDirection: 'row', alignItems: 'center', gap: 3}}>
          <Icon
            name="chevron-back"
            size={28}
            color={color}
            onPress={() => navigation.goBack()}
          />
          <Text
            style={{
              color: color,
              fontSize: 20,
              textAlign: 'left',
              fontWeight: 'bold',
            }}>
            {network_name}
          </Text>
        </View>
        <TouchableOpacity
          style={{flexDirection: 'row', alignItems: 'center', gap: 2}}
          onPress={() => setShowModal(true)}>
          <Text style={{color: 'grey', fontSize: 15}}>
            {sortingOrder === 'ASC' ? 'Old to New' : 'New to Old'}
          </Text>
          <Icon name={'chevron-down'} color="grey" size={20} />
        </TouchableOpacity>
      </View>
      {loading ? (
        <ActivityIndicator size="small" color={color} />
      ) : savedPosts.length === 0 ? (
        <Text style={{color: 'white', textAlign: 'center', marginTop: 20}}>
          No saved posts found.
        </Text>
      ) : (
        <FlatList
          data={savedPosts}
          keyExtractor={item => item.id}
          renderItem={({item}) => (
            <SharedElement id={`item.${item.post_id}.post`}>
            <Suspense fallback={null}>
              <Post post_id={item.post_id} />
            </Suspense>
            </SharedElement>
          )}
          onEndReached={loadMorePosts}
          onEndReachedThreshold={0}
          ListFooterComponent={renderFooter}
        />
      )}
      <Modal
        transparent={true}
        visible={showModal}
        animationType="fade"
        onRequestClose={() => setShowModal(false)}>
        <Pressable
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          }}
          onPress={() => setShowModal(false)}>
          <View
            style={{
              backgroundColor: 'black',
              padding: 20,
              borderRadius: 10,
              width: '90%',
              alignItems: 'center',
            }}>
            <Text style={{color: 'white', fontSize: 16}}>
              Select Sorting Option
            </Text>
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                width: '100%',
                marginTop: 20,
              }}
              onPress={() => {
                setShowModal(false);
                setSortingOrder('ASC');
              }}>
              <Icon
                name={
                  sortingOrder === 'ASC'
                    ? 'radio-button-on'
                    : 'radio-button-off'
                }
                color="white"
                size={30}
              />
              <Text style={{color: 'white'}}>Old to New</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                width: '100%',
                marginTop: 20,
              }}
              onPress={() => {
                setShowModal(false);
                setSortingOrder('DESC');
              }}>
              <Icon
                name={
                  sortingOrder === 'DESC'
                    ? 'radio-button-on'
                    : 'radio-button-off'
                }
                color="white"
                size={30}
              />
              <Text style={{color: 'white'}}>New to Old</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

