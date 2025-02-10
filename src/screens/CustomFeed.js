import React, {useEffect, useState} from 'react';
import {
  FlatList,
  Pressable,
  Text,
  View,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import color from './color';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

const CustomFeed = ({navigation}) => {
  const [feeds, setFeeds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeeds = async () => {
      try {
        const feedData = await firestore()
          .collection('Users')
          .doc(auth().currentUser.uid)
          .collection('Feeds')
          .get();

        const fetchedFeeds = feedData.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        setFeeds(fetchedFeeds);
      } catch (error) {
        console.warn(error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeeds();
  }, []);

  const renderFeedItem = ({item}) => (
    <View
      style={{
        backgroundColor: '#1a1a1a',
        padding: 15,
        borderRadius: 5,
        marginVertical: 5,
        marginHorizontal: 10,
        justifyContent:'space-between',
        flexDirection:'row',
        alignItems:'center'
      }}>
      <Text style={{color: 'white', fontSize: 16}}>{item.feedName}</Text>
      <Text style={{color: 'white', fontSize: 14, color:'grey'}}>Feed</Text>
    </View>
  );

  return (
    <View style={{backgroundColor: 'black', flex: 1}}>
      <View style={{flexDirection: 'row', padding: 10, alignItems: 'center'}}>
        <Icon
          name="chevron-back"
          size={28}
          color={color}
          onPress={() => navigation.goBack()}
        />
        <Text
          style={{
            color: 'white',
            fontWeight: 'bold',
            fontSize: 18,
            marginLeft: 10,
          }}>
          Custom Feed
        </Text>
      </View>

      <Pressable
        style={{
          backgroundColor: color,
          width: '80%',
          padding: 10,
          borderRadius: 5,
          alignItems: 'center',
          alignSelf: 'center',
          marginVertical: 10,
        }}
        onPress={() => navigation.navigate('CreateCustomFeed')}>
        <Text style={{color: 'white', fontSize: 16}}>Create Custom Feed</Text>
      </Pressable>

      {loading ? (
        <ActivityIndicator color="white" size="large" style={{marginTop: 20}} />
      ) : feeds.length > 0 ? (
        <FlatList
          data={feeds}
          keyExtractor={item => item.id}
          renderItem={renderFeedItem}
          contentContainerStyle={{paddingBottom: 20}}
        />
      ) : (
        <Text style={{color: 'grey', textAlign: 'center', marginTop: 20}}>
          No custom feeds available. Create one!
        </Text>
      )}
    </View>
  );
};

export default CustomFeed;
