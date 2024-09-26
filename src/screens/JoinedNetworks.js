import React, {useEffect, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import NetworkDisplay from './NetworkDisplay';

export default function JoinedNetworks() {
  const [joinedNetworks, setJoinedNetworks] = useState([]);

  useEffect(() => {
    const fetchJoinedNetworks = async () => {
      try {
        const snapshot = await firestore()
          .collection('Users')
          .doc(auth().currentUser.uid)
          .get();

        if (snapshot.exists) {
          const userData = snapshot.data();
          if (userData.joined_networks) {
            setJoinedNetworks(userData.joined_networks);
          } else {
            setJoinedNetworks([]);
          }
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
    padding: 15,
    borderBottomWidth: 0.2,
    borderColor: '#ccc',
    margin: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    color: '#FF3131',
    marginLeft: 10,
    textAlign: 'center',
    letterSpacing: 1,
  },
  emptyText: {
    color: 'grey',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
});
