import React, {useEffect, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import NetworkDisplay from './NetworkDisplay';
import Icon from 'react-native-vector-icons/Ionicons';
import color from './color';
import {SharedElement} from 'react-navigation-shared-element';

export default function JoinedNetworks({navigation}) {
  const [joinedNetworks, setJoinedNetworks] = useState([]);

  useEffect(() => {
    const fetchJoinedNetworks = async () => {
      try {
        const snapshot = await firestore()
          .collection('Users')
          .doc(auth().currentUser.uid)
          .collection("JoinedNetworks")
          .get();

          const userData = snapshot.docs.map(doc => doc.id);
          if (userData) {
            setJoinedNetworks(userData);
          } else {
            setJoinedNetworks([]);
          }
      } catch (error) {
        console.warn('Error fetching joined networks:', error);
      }
    };

    fetchJoinedNetworks();
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
        <Text style={styles.title}>Joined Networks</Text>
      </View>
      {joinedNetworks && joinedNetworks.length > 0 ? (
        joinedNetworks.map(item => (
          <NetworkDisplay key={item} network_id={item} />
        ))
      ) : (
        <Text style={styles.emptyText}>You haven't joined any channel yet</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: 'black',
    width: '100%',
    padding: 5,
    borderBottomWidth: 0.2,
    margin: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    color: 'white',
    marginLeft: 10,
    textAlign: 'center',
  },
  emptyText: {
    color: 'grey',
    fontSize: 15,
    textAlign: 'center',
    marginTop: 20,
  },
});
