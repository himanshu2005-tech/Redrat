import React, {useState, useEffect} from 'react';
import {Text, View, FlatList, Dimensions, ScrollView} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import Post from './Post';
import Icon from 'react-native-vector-icons/Ionicons';
import {useNavigation} from '@react-navigation/native';
import {SharedElement} from 'react-navigation-shared-element';

const {height, width} = Dimensions.get('screen');

export default function RecommendedPosts({userDetails}) {
  const [posts, setPosts] = useState([]);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchPosts = async () => {
      const topics = userDetails.map(item => item.topic).flat();

      try {
        const postData = await firestore()
          .collection('Posts')
          .where('topic', 'array-contains-any', topics)
          .where('hasImages', '==', true)
          .limit(10)
          .get();

        const postList = postData.docs.map(doc => doc.id);
        setPosts(postList);
        console.log(postList);
      } catch (error) {
        console.warn(error);
      }
    };

    if (userDetails && userDetails.length > 0) {
      fetchPosts();
    }
  }, [userDetails]);

  const renderPost = ({item}) => (
    <SharedElement id={`item.${item}.post`}>
      <View key={item} style={{width}} nestedScrollEnabled={true}>
        <Post post_id={item} isSub={true} />
      </View>
    </SharedElement>
  );

  if (posts.length == 0) {
    return null;
  }
  return (
    <View style={{flex: 1, flexGrow: 1}}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
        <Text
          style={{color: 'white', fontSize: 25, margin: 10, fontWeight: 900}}>
          Recommended Posts
        </Text>
        <Icon
          name="chevron-forward"
          color="grey"
          size={23}
          style={{marginRight: 10}}
          onPress={() =>
            navigation.push('RecommendedHome', {
              userDetails: userDetails,
              isShowBack: true,
            })
          }
        />
      </View>
      <FlatList
        data={posts}
        horizontal
        pagingEnabled
        renderItem={renderPost}
        keyExtractor={item => item.toString()}
      />
    </View>
  );
}
