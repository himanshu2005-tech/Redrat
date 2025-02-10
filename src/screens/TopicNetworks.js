import React, {useState, useEffect} from 'react';
import {Text, View, FlatList, ActivityIndicator} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import NetworkDisplaySuggestion from './NetworkDisplaySuggestion';
import color from './color';
import {SharedElement} from 'react-navigation-shared-element';

export default function TopicNetworks({route}) {
  const {topic} = route.params;
  const [networkIds, setNetworkIds] = useState([]);
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchNetworks = async () => {
      try {
        setLoading(true)
        const data = await firestore()
          .collection('Network')
          .where('topic', '==', topic)
          .orderBy("joined", "desc")
          .limit(20)
          .get();

        const networkList = data.docs.map(doc => doc.id);
        setNetworkIds(networkList);
      } catch (error) {
        console.log(error);
      } finally{
        setLoading(false)
      }
    };

    fetchNetworks();
  }, [topic]);


  if(loading){
    return (
        <ActivityIndicator size="small" color={color} />
    )
  }
  return (
    <View style={{backgroundColor: 'black', flex: 1}}>
      <Text
        style={{color: color, margin: 10, fontSize: 20, fontWeight: '900'}}>
        Networks on {topic}
      </Text>

      {networkIds.length === 0 ? (
        <Text style={{color: 'white', textAlign: 'center'}}>
          No networks found.
        </Text>
      ) : (
        <FlatList
          data={networkIds}
          keyExtractor={item => item}
          renderItem={({item}) => (
            <View style={{marginHorizontal: 10, alignItems: 'center'}}>
              <NetworkDisplaySuggestion network_id={item} />
            </View>
          )}
        />
      )}
    </View>
  );
}



