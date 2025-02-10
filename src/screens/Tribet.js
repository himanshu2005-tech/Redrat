import React, {useState, useEffect} from 'react';
import {Text, View, FlatList} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import TribetCard from './TribetCard'; 
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import color from './color';
import {SharedElement} from 'react-navigation-shared-element';

export default function Tribet({navigation}) {
  const [tribetDetails, setTribetDetails] = useState([]);

  useEffect(() => {
    const fetchTribetDetails = async () => {
      try {
        const tribetHistory = await firestore()
          .collection('Users')
          .doc(auth().currentUser.uid)
          .collection('Tribet')
          .orderBy('timestamp', 'desc')
          .limit(50)
          .get();

        const tribetData = tribetHistory.docs.map(doc => ({
          id: doc.id,
          data: doc.data(),
        }));

        setTribetDetails(tribetData);
      } catch (error) {
        console.warn('Error fetching Tribet details:', error);
      }
    };

    fetchTribetDetails();
  }, []);

  return (
    <View style={{backgroundColor: 'black', flex: 1}}>
      <View
        style={{
          padding: 10,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
        }}>
        <Icon
          size={30}
          color={color}
          name="chevron-back"
          onPress={() => navigation.goBack()}
        />
        <Text style={{color: 'white', fontSize: 22, fontWeight: 'bold'}}>
          Tribet
        </Text>
      </View>

      <View style={{padding: 10}}>
        <TribetCard id={auth().currentUser.uid} />
      </View>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
        <Text
          style={{
            color: 'white',
            margin: 10,
            fontSize: 18,
            fontWeight: 'bold',
          }}>
          Tribet History
        </Text>
        <Text style={{color: 'grey', margin: 10}}>Limit to 50 past transactions</Text>
      </View>

      <FlatList
        data={tribetDetails}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({item}) => (
          <View
            style={{
              backgroundColor: '#1a1a1a',
              borderRadius: 5,
              padding: 13,
              margin: 10,
            }}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
              <Text
                style={{
                  color: 'white',
                  fontSize: 16,
                  maxWidth: '85%',
                }}>
                {item.data.message}
              </Text>
              <Text
                style={{
                  color: item.data.tribet < 0 ? 'red' : '#32CD32',
                  fontSize: 16,
                  fontWeight: 'bold',
                }}>
                {item.data.tribet >= 0
                  ? `+${item.data.tribet}`
                  : item.data.tribet}
              </Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}




