import React, {Component} from 'react';
import {Image, Pressable, Text, View} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import {SharedElement} from 'react-navigation-shared-element';


export default function NetworkBadge({id}) {
  const [networkDetails, setNetworkDetails] = React.useState([]);

  React.useEffect(() => {
    const fetchNetworkDetails = async () => {
      try {
        const data = await firestore().collection('Network').doc(id).get();
        setNetworkDetails(data.data());
      } catch (error) {
        console.warn(error);
      }
    };

    fetchNetworkDetails();
  }, []);
  return (
    <View
      style={{
        width: '95%',
        alignSelf: 'center',
        alignItems: 'center',
        backgroundColor: '#1a1a1a',
        paddingVertical: 10,
        borderRadius: 15,
      }}
      >
      <Image
        source={{uri: networkDetails?.networkBackground}}
        style={{height: 150, width: "100%", position: 'absolute', borderRadius: 15,}}
      />
      <Image
        source={{uri: networkDetails?.profile_pic}}
        style={{height: 120, width: 120, borderRadius: 150/2}}
      />
      <View style={{alignItems: 'center', marginTop: 15}}>
        <Text style={{color: 'white', fontSize: 30, fontWeight: 'bold'}}>{networkDetails?.network_name}</Text>
        <Text style={{color: 'white'}}>{networkDetails?.joined}</Text>
        <Text style={{color: 'grey'}}>{networkDetails?.topic}</Text>
        <Text
          style={{color: 'grey', maxWidth: '90%', textAlign: 'center', marginTop: 10}}
          numberOfLines={5}
          ellipsizeMode="tail">
          {networkDetails?.bio}
        </Text>
      </View>
    </View>
  );
}
