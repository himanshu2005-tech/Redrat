import React, { useEffect, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';
import { View, ActivityIndicator } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import NotificationScreen from '../screens/NotificationScreen';
import UserNameScreen from '../screens/UserNameScreen';
import Home from '../screens/Home';
import { Text } from 'react-native';
import Trending from '../screens/Trending';

const Tab = createBottomTabNavigator();

export default function HomeStack({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [hasUsername, setHasUsername] = useState(false);

  useEffect(() => {
    const checkUsername = async () => {
      const userId = auth().currentUser.uid;
      const userDoc = await firestore().collection('Users').doc(userId).get();
      if (userDoc.exists && userDoc.data().name) {
        setHasUsername(true);
      } else {
        setHasUsername(false);
      }
      setLoading(false);
    };

    checkUsername();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'black' }}>
        <ActivityIndicator size="large" color="#FF3131" />
        <Text style={{color: "#FF3131", fontSize: 16}}>Checking for updates</Text>
      </View>
    );
  }

  if (!hasUsername) {
    return <UserNameScreen onSuccess={() => setHasUsername(true)} />;
  }

  return (
    <Tab.Navigator
      initialRouteName="Homes"
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Homes') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else if (route.name === 'Trending') {
            iconName = focused ? 'stats-chart' : 'stats-chart-outline';
          } else if (route.name === 'Notifications') {
            iconName = focused ? 'albums' : 'albums-outline';
          }
          size = focused ? size + 5 : size;

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#FF3131',
        tabBarInactiveTintColor: '#FF3131',
        tabBarStyle: styles.tabBarStyle,
        tabBarShowLabel: false,
        headerShown: false,
      })}
    >
      <Tab.Screen name="Homes" component={Home} />
      <Tab.Screen name="Trending" component={Trending} />
      <Tab.Screen name="Notifications" component={NotificationScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const styles = {
  tabBarStyle: {
    position: 'absolute',
    elevation: 0,
    backgroundColor: 'black',
    height: 70,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.5,
    elevation: 5,
  },
};
