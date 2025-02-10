import React from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import color from './color';
import firestore from '@react-native-firebase/firestore'
import auth from '@react-native-firebase/auth'
import {SharedElement} from 'react-navigation-shared-element';


const SelectPersonalizedNotifications = ({ navigation, route }) => {
  const { network_id, networkDetails } = route.params;

  return (
    <View style={{ flex: 1, backgroundColor: 'black' }}>
      <View
        style={{
          flexDirection: 'row',
          padding: 10,
          gap: 7,
          alignItems: 'center',
        }}
      >
        <Icon
          name="chevron-back"
          size={28}
          color={color}
          onPress={() => navigation.goBack()}
        />
        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 18 }}>
          Subscribe to topics
        </Text>
      </View>
      <FlatList
        data={networkDetails.sub_topics}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={{
              paddingVertical: 20,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: 10
            }}
            onPress={() => navigation.navigate("SelectPersonalizedNotificationsExpand", {
                network_id: network_id,
                subtopic: item
            })}
          >
            <Text style={{ color: 'white', fontSize: 16 }}>{item}</Text>
            <Icon name="chevron-forward" size={20} color="white" />
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

export default SelectPersonalizedNotifications;
