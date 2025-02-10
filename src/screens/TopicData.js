import React from 'react';
import {Text, View} from 'react-native';
import {createMaterialTopTabNavigator} from '@react-navigation/material-top-tabs';
import Icon from 'react-native-vector-icons/Ionicons';
import {NavigationContainer} from '@react-navigation/native';
import TopicNetworks from './TopicNetworks';
import TopicPosts from './TopicPosts';
import color from './color';
import {SharedElement} from 'react-navigation-shared-element';

const Tab = createMaterialTopTabNavigator();

function TopicData({route, navigation}) {
  const {topic} = route.params;

  return (
    <View style={{flex: 1, backgroundColor: 'black'}}>
      <View
        style={{
          backgroundColor: 'black',
          padding: 15,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
          <Icon
            name="chevron-back"
            size={28}
            color={color}
            onPress={() => navigation.goBack()}
          />
          <Text
            style={{
              color: color,
              fontSize: 20,
              fontWeight: 'bold',
              marginLeft: 10,
            }}>
            {topic}
          </Text>
        </View>
      </View>
      <Tab.Navigator
        screenOptions={({route}) => ({
          tabBarLabelStyle: {
            fontSize: 15,
            letterSpacing: 1,
            color: 'white',
          },
          tabBarItemStyle: {
            width: 150,
            backgroundColor: '#1a1a1a',
            marginRight: 10,
            borderRadius: 50,
          },
          tabBarStyle: {backgroundColor: 'black'},
          tabBarIndicatorStyle: {
            backgroundColor: 'black',
            width: 100,
            alignSelf: 'center',
          },
          tabBarActiveTintColor: 'white',
          tabBarInactiveTintColor: 'grey',
          animationEnabled: true,
          swipeEnabled: true,
          lazy: true,
          lazyPlaceholder: () => (
            <View
              style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: 'black',
              }}>
              <Text style={{color: 'white'}}>Loading...</Text>
            </View>
          ),
        })}
        tabBarBounces={true}
        optimizationsEnabled={true}>
        <Tab.Screen
          name="Networks"
          component={TopicNetworks}
          options={{
            tabBarLabel: ({focused}) => (
              <View style={{flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10}}>
                <Text
                  style={{
                    color: focused ? 'white' : 'grey',
                    fontSize: 15,
                    letterSpacing: 1,
                    
                  }}>
                  Networks
                </Text>
              </View>
            ),
          }}
          initialParams={{topic: topic}}
        />
        <Tab.Screen
          name="Posts"
          component={TopicPosts}
          options={{
            tabBarLabel: ({focused}) => (
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <Text
                  style={{
                    color: focused ? 'white' : 'grey',
                    fontSize: 15,
                    letterSpacing: 1,
                  }}>
                  Posts
                </Text>
              </View>
            ),
          }}
          initialParams={{topic: topic}}
        />
      </Tab.Navigator>
    </View>
  );
}

export default TopicData;


