import React, {Component} from 'react';
import {Pressable, Text, View} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import auth from '@react-native-firebase/auth'
import color from './color';
import {SharedElement} from 'react-navigation-shared-element';

export default function NetworkAdvanced({route, navigation}) {
  const {network_id, networkDetails} = route.params;
  React.useEffect(() => {
    if(networkDetails.admin != auth().currentUser.uid){
      navigation.popToTop();
    }
  }, [network_id, networkDetails])
  return (
    <View style={{backgroundColor: 'black', flex: 1}}>
      <View
        style={{
          flexDirection: 'row',
          padding: 10,
          gap: 7,
        }}>
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
          Advanced Options
        </Text>
      </View>
      <View>
        <Pressable
          style={{
            backgroundColor: 'black',
            padding: 13,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
          onPress={() =>
            navigation.navigate('NetworkAnalytics', {
              network_id: network_id,
              networkDetails: networkDetails
            })
          }>
          <Text style={{color: 'white', fontSize: 16}}>View Network Analytics</Text>
          <Icon name="chevron-forward-outline" size={25} color={color} />
        </Pressable>
        <Pressable
          style={{
            backgroundColor: 'black',
            padding: 13,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            opacity: networkDetails.isSetForAcquisition ? 0.5 : 1
          }}
          disabled={networkDetails.isSetForAcquisition}
          onPress={() =>
            navigation.navigate('AdminTransfer', {
              network_id: network_id,
              networkDetails: networkDetails
            })
          }>
          <Text style={{color: 'white', fontSize: 16}}>Admin Transfer</Text>
          <Icon name="chevron-forward-outline" size={25} color={color} />
        </Pressable>
        <Pressable
          style={{
            backgroundColor: 'black',
            padding: 13,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
          onPress={() =>
            navigation.navigate('IntegrateBots', {
              network_id: network_id,
              networkDetails: networkDetails
            })
          }>
          <Text style={{color: 'white', fontSize: 16}}>Integrate Bots</Text>
          <Icon name="chevron-forward-outline" size={25} color={color} />
        </Pressable>
        <Pressable
          style={{
            backgroundColor: 'black',
            padding: 13,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
          onPress={() =>
            navigation.navigate('RulesUpdate', {
              network_id: network_id,
              networkDetails: networkDetails
            })
          }>
          <Text style={{color: 'white', fontSize: 16}}>Rules Update</Text>
          <Icon name="chevron-forward-outline" size={25} color={color} />
        </Pressable>
        <Pressable
          style={{
            backgroundColor: 'black',
            padding: 13,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
          onPress={() =>
            navigation.navigate('ReportedPosts', {
              network_id: network_id,
              networkDetails: networkDetails
            })
          }>
          <Text style={{color: 'white', fontSize: 16}}>Reported Posts</Text>
          <Icon name="chevron-forward-outline" size={25} color={color} />
        </Pressable>
        <Pressable
          style={{
            backgroundColor: 'black',
            padding: 13,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            opacity: networkDetails.isAdminTransferring ? 0.5 : 1
          }}
          disabled={networkDetails.isAdminTransferring}
          onPress={() =>
            navigation.navigate('NetworkAquisition', {
              network_id: network_id,
              networkDetails: networkDetails
            })
          }>
          <Text style={{color: 'white', fontSize: 16}}>Acquisition</Text>
          <Icon name="chevron-forward-outline" size={25} color={color} />
        </Pressable>
      </View>
    </View>
  );
}
