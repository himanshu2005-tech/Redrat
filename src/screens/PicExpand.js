import React, { useState, useEffect } from 'react';
import {
  View,
  FlatList,
  Text,
  Pressable,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import firestore from '@react-native-firebase/firestore';
import LinearGradient from 'react-native-linear-gradient';
import DropDownPicker from 'react-native-dropdown-picker';
import {SharedElement} from 'react-navigation-shared-element';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function CommentExpand({ route }) {
  const { key, commentPath } = route.params;
  const [comments, setComments] = useState([]);
  const [lastVisible, setLastVisible] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('new');
  const [openDropdown, setOpenDropdown] = useState(false);
  const filters = [
    { label: 'New', value: 'new' },
    { label: 'Hot', value: 'hot' },
    { label: 'Most Popular', value: 'mostPopular' },
  ];

  const fetchComments = async (isRefresh = false) => {
    setLoading(true);
    try {
      const query = firestore()
        .collection(`${commentPath}/Comments`)
        .orderBy(
          filter === 'mostPopular' ? 'likeCount' : 'createdAt',
          filter === 'new' || filter === 'mostPopular' ? 'desc' : 'asc'
        )
        .startAfter(isRefresh ? null : lastVisible || 0)
        .limit(10);

      const snapshot = await query.get();
      if (!snapshot.empty) {
        const fetchedComments = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setComments((prevComments) =>
          isRefresh ? fetchedComments : [...prevComments, ...fetchedComments]
        );
        setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
      }
    } catch (error) {
      console.log('Error fetching comments:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchComments(true);
  }, [filter]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchComments(true).finally(() => setRefreshing(false));
  };

  const renderComment = ({ item }) => (
    <View
      style={{
        backgroundColor: '#1a1a1a',
        padding: 10,
        marginBottom: 10,
        borderRadius: 10,
        width: SCREEN_WIDTH - 20,
        alignSelf: 'center',
      }}>
      <Text style={{ color: 'white', marginBottom: 5 }}>{item.content}</Text>
      <Text style={{ color: 'grey', fontSize: 12 }}>
        {item.createdAt?.toDate().toLocaleString()}
      </Text>
      <Text style={{ color: 'grey', fontSize: 12 }}>Likes: {item.likeCount}</Text>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: 'black' }}>
      <LinearGradient
        colors={['#FF512F', '#DD2476']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{
          padding: 10,
          position: 'absolute',
          top: 10,
          left: 10,
          zIndex: 1,
          borderRadius: 100,
        }}>
        <Icon name={'close'} size={30} color="white" onPress={() => route.params.navigation.goBack()} />
      </LinearGradient>

      <View style={{ padding: 20 }}>
        <DropDownPicker
          open={openDropdown}
          value={filter}
          items={filters}
          setOpen={setOpenDropdown}
          setValue={setFilter}
          style={{
            backgroundColor: '#1a1a1a',
            borderColor: 'grey',
          }}
          dropDownContainerStyle={{
            backgroundColor: '#1a1a1a',
            borderColor: 'grey',
          }}
          labelStyle={{ color: 'white' }}
          textStyle={{ color: 'white' }}
        />
      </View>

      <FlatList
        data={comments}
        renderItem={renderComment}
        keyExtractor={(item) => item.id}
        onEndReached={() => fetchComments()}
        onEndReachedThreshold={0.5}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListFooterComponent={
          loading ? (
            <ActivityIndicator size="large" color="#FF512F" style={{ marginVertical: 20 }} />
          ) : null
        }
      />
    </View>
  );
}
