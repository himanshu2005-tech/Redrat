import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import Icon from 'react-native-vector-icons/Ionicons';
import Badge from './Badge';
import color from './color';

const BadgePage = ({navigation, route}) => {
  const {badge} = route.params;
  return (
    <View style={{backgroundColor:'black', flex: 1}}>
      <View style={{flexDirection: 'row', padding: 10, alignItems: 'center'}}>
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
          {badge.name}
        </Text>
      </View>
    </View>
  );
};

export default BadgePage;
