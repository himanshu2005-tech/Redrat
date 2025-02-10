import React, {Suspense, useEffect, useState} from 'react';
import {FlatList, Text, View, StyleSheet} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import NetworkDisplaySuggestion from './NetworkDisplaySuggestion';
import Icon from 'react-native-vector-icons/Ionicons';
import {useNavigation} from '@react-navigation/native';
import {SharedElement} from 'react-navigation-shared-element';

export default function TrendingNetworks({item, index}) {
  const [networkIds, setNetworkIds] = useState([]);

  const navigation = useNavigation();

  useEffect(() => {
    const fetchNetworks = async () => {
      try {
        const data = await firestore()
          .collection('Network')
          .where('topic', '==', item)
          .orderBy('joined', 'desc')
          .limit(20)
          .get();

        const ids = data.docs.map(doc => doc.id);
        setNetworkIds(ids);
      } catch (error) {
        console.warn(error);
      }
    };

    fetchNetworks();
  }, [item]);

  if (networkIds.length === 0) {
    return null;
  }

  return (
    <View key={index} style={{marginVertical: 10}}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
        <Text style={styles.topicText}>More like {item}</Text>
        <Icon
          name="chevron-forward"
          color="grey"
          size={23}
          style={{marginRight: 10}}
          onPress={() =>
            navigation.navigate('TopicData', {
              topic: item,
            })
          }
        />
      </View>
      <FlatList
        data={networkIds}
        keyExtractor={item => item}
        renderItem={({item}) => (
          <Suspense>
            <NetworkDisplaySuggestion network_id={item} />
          </Suspense>
        )}
        horizontal={true}
        showsHorizontalScrollIndicator={true}
        pagingEnabled
        contentContainerStyle={{alignSelf: 'center', alignItems: 'center'}}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  topicText: {
    color: 'white',
    fontSize: 20,
    margin: 10,
    fontWeight: '900',
    flexWrap: 'wrap',
    width: '80%',
  },
});
