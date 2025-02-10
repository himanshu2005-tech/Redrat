import React, {Component} from 'react';
import {Text, View} from 'react-native';
import {createMaterialTopTabNavigator} from '@react-navigation/material-top-tabs';
import PostResults from './PostResults';
import UserResults from './UserResults';
import Icon from 'react-native-vector-icons/Ionicons';
import NetworkResults from './NetworkResults';
import HashResults from './HashResults';
import color from './color';
import {SharedElement} from 'react-navigation-shared-element';

const Tab = createMaterialTopTabNavigator();

export default function SearchResults({route, navigation}) {
  const {
    searchTarget,
    blockedUsers,
    blockedBy,
    isHashTag = false,
  } = route.params;
  console.log(searchTarget);
  return (
    <View style={{flex: 1, backgroundColor: 'black'}}>
      <View
        style={{
          backgroundColor: 'black',
          width: '100%',
          flexDirection: 'row',
          gap: 10,
          alignItems: 'center',
          padding: 5,
        }}>
        <Icon
          name="chevron-back"
          size={28}
          style={{margin: 5}}
          color={color}
          onPress={() => {
            navigation.goBack();
          }}
        />
        <Text
          style={{
            color: 'white',
            fontSize: 20,
            fontWeight: 'bold',
            maxWidth: '70%',
          }}
          numberOfLines={1}
          ellipsizeMode="tail">
          Search results for {searchTarget}
        </Text>
      </View>

      {isHashTag ? (
        <Tab.Navigator
          screenOptions={{
            tabBarActiveTintColor: 'white',
            tabBarIndicatorStyle: {
              backgroundColor: color,
            },
            tabBarScrollEnabled: true,
            tabBarLabelStyle: {fontSize: 15},
            tabBarItemStyle: {borderRadius: 200},
            tabBarStyle: {
              backgroundColor: 'black',
            },
          }}>
          <Tab.Screen
            name="Posts"
            component={PostResults}
            initialParams={{target: searchTarget}}
          />
        </Tab.Navigator>
      ) : (
        <Tab.Navigator
          screenOptions={{
            tabBarActiveTintColor: 'white',
            tabBarIndicatorStyle: {
              backgroundColor: color,
            },
            tabBarScrollEnabled: true,
            tabBarLabelStyle: {fontSize: 15},
            tabBarItemStyle: {borderRadius: 200},
            tabBarStyle: {
              backgroundColor: 'black',
            },
          }}>
          <Tab.Screen
            name="Posts"
            component={PostResults}
            initialParams={{target: searchTarget}}
          />
          <Tab.Screen
            name="Users"
            component={UserResults}
            initialParams={{
              target: searchTarget,
              blockedUsers: blockedUsers,
              blockedBy: blockedBy,
            }}
          />
          <Tab.Screen
            name="Networks"
            component={NetworkResults}
            initialParams={{target: searchTarget}}
          />
        </Tab.Navigator>
      )}
    </View>
  );
}
