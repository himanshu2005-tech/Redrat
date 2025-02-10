import React, {useEffect, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import NetworkDisplay from './NetworkDisplay';
import Icon from 'react-native-vector-icons/Ionicons';
import color from './color';
import {SharedElement} from 'react-navigation-shared-element';

export default function MyNetworks({navigation}) {
  const [createdNetworks, setCreatedNetworks] = useState([]);

  useEffect(() => {
    const fetchCreatedNetworks = async () => {
      try {
        const snapshot = await firestore()
          .collection('Users')
          .doc(auth().currentUser.uid)
          .get();

        if (snapshot.exists) {
          const userData = snapshot.data();
          if (userData.createdNetworks) {
            setCreatedNetworks(userData.createdNetworks);
          } else {
            setCreatedNetworks([]);
          }
        }
      } catch (error) {
        console.warn('Error fetching created networks:', error);
      }
    };

    fetchCreatedNetworks();
  }, []);

  return (
    <View style={{backgroundColor: 'black', flex: 1}}>
      <View style={styles.header}>
        <Icon
          name="chevron-back"
          size={25}
          color={color}
          onPress={() => navigation.goBack()}
          style={{alingSelf: 'left'}}
        />
        <Text style={styles.title}>My Networks</Text>
      </View>
      {createdNetworks && createdNetworks.length > 0 ? (
        createdNetworks.map(item => (
          <NetworkDisplay key={item} network_id={item} />
        ))
      ) : (
        <Text style={styles.emptyText}>
          You haven't created any networks yet.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: 'black',
    width: '100%',
    padding: 5,
    margin: 10,
    flexDirection: 'row',
    alignItems:'center'
  },
  title: {
    fontSize: 20,
    color: 'white',
    marginLeft: 10,
    textAlign: 'center',
    alingSelf: 'center'
  },
  emptyText: {
    color: 'grey',
    fontSize: 15,
    textAlign: 'center',
    marginTop: 20,
  },
});
