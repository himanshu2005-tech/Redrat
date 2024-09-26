import React, { Component } from 'react'
import { Text, View } from 'react-native'
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import PostResults from './PostResults';
import UserResults from './UserResults';
import Icon from 'react-native-vector-icons/Ionicons';
import NetworkResults from './NetworkResults';
import HashResults from './HashResults';

const Tab = createMaterialTopTabNavigator();

export default function SearchResults({route, navigation}){
    const {searchTarget, isHash} = route.params
    return (
        <View style={{flex: 1, backgroundColor: 'black'}}>
        <View style={{backgroundColor: 'black', width: "100%", flexDirection: 'row', gap: 10, alignItems: 'center', paddingTop: 7, paddingBottom: 7,borderBottomWidth:0.7, borderColor: "#1a1a1a"}}>
        <Icon
        name="chevron-back"
        size={28}
        style={{margin: 8}}
        color="#FF3131"
        onPress={() => {
          navigation.goBack();
        }}
      />
      <Text style={{color: "#FF3131", fontSize: 20, fontWeight: 'bold', letterSpacing: 1}}>{searchTarget}</Text>
        </View>
        <Tab.Navigator screenOptions={{
            tabBarActiveTintColor:'white',
            tabBarIndicatorStyle: {
              backgroundColor: '#FF3131',
            },
            tabBarScrollEnabled: true,
            tabBarLabelStyle: {fontSize: 15},
            tabBarItemStyle: { borderRadius: 200 },
            tabBarStyle: {
              backgroundColor: 'black',
            },
          }}>
          <Tab.Screen 
          name="Posts" 
          component={PostResults} 
          initialParams={{ target: searchTarget }} 
        />
        {!isHash && (
          <>
          <Tab.Screen 
          name="Users" 
          component={UserResults} 
          initialParams={{ target: searchTarget }} 
        />
        <Tab.Screen 
        name="Networks" 
        component={NetworkResults} 
        initialParams={{ target: searchTarget }} 
      />  
      <Tab.Screen 
        name="Hashes" 
        component={HashResults} 
        initialParams={{ target: searchTarget }} 
      />  
      </>
        )}
          </Tab.Navigator>
          </View>
    )
}
