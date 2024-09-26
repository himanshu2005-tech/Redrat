import React, {Component} from 'react';
import {Pressable, Text, View} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

export default function NetworkAdvanced({route, navigation}) {
  const {network_id} = route.params;
  return (
    <View style={{backgroundColor: 'black', flex: 1}}>
      <View
        style={{
          flexDirection: 'row',
          padding: 10,
          gap: 7,
          borderBottomWidth: 0.7,
          borderColor: '#1a1a1a',
        }}>
        <Icon
          name="chevron-back"
          size={28}
          color="#FF3131"
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
            backgroundColor: '#1a1a1a',
            margin: 10,
            padding: 10,
            borderRadius: 5,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center'
          }} onPress={() => navigation.navigate("SupportingHashes", {
            network_id: network_id
          })}>
          <Text style={{color: 'white', fontSize: 15}}>Support Hashes</Text>
          <Icon
            name="chevron-forward-outline"
            size={25}
            color="#FF3131"
          />
        </Pressable>
      </View>
    </View>
  );
}
