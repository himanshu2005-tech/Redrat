import React, {useState, useEffect} from 'react';
import {Text, View, Image, Pressable, TouchableOpacity, ScrollView} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { Timestamp } from '@react-native-firebase/firestore';
import { format } from 'date-fns';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import HashPosts from './HashPosts';
import HashPictures from './HashPictures';
import Bluing from '../texting/Bluing';

export default function HashScreen({navigation, route}) {
  const {hash} = route.params;
  const [hashDetails, setHashDetails] = useState([]);
  const [isMember, setIsMember] = useState(false);
  let formattedDate1 = 'Invalid date';
  let formattedDate2 = 'Invalid date';
  const Tab = createMaterialTopTabNavigator();

  if (hashDetails.expiresAt instanceof Timestamp) {
    const date1 = hashDetails.expiresAt.toDate();
    const date2 = hashDetails.createdAt.toDate();
    
    formattedDate1 = format(date1, 'd/M/yy h:mm a');
    formattedDate2 = format(date2, 'd/M/yy h:mm a');
  } else {
    console.error('Expected a Firebase Timestamp object.');
  }
  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const data = await firestore().collection('Hash').doc(hash).get();
        setHashDetails(data.data());
      } catch (error) {
        console.warn(error);
      }
    };

    fetchDetails();
  }, [isMember]);
  useEffect(() => {
    const fetch = async() => {
      try{
        const data = await firestore().collection('Hash').doc(hash).get();
        if(data.exists){
          const memData = data.data();
          setIsMember(memData.members?.includes(auth().currentUser.uid));
        }

      } catch(error){
        console.warn(error);
      }
    }
    fetch();
  }, [isMember])
  const joinHash = async() => {
    try{
      if(isMember){
        setIsMember(false);
        await firestore().collection('Hash').doc(hash).update({
          members: firestore.FieldValue.arrayRemove(auth().currentUser.uid),
          joined: firestore.FieldValue.increment(-1),
        })
        await firestore().collection('Users').doc(auth().currentUser.uid).update({
          hash: firestore.FieldValue.arrayRemove(auth().currentUser.uid),
        })
      } else {
        setIsMember(true);
        await firestore().collection('Hash').doc(hash).update({
          members: firestore.FieldValue.arrayUnion(auth().currentUser.uid),
          joined: firestore.FieldValue.increment(1),
        })
        await firestore().collection('Users').doc(auth().currentUser.uid).update({
          hash: firestore.FieldValue.arrayUnion(auth().currentUser.uid),
        })
      }
    } catch(error){
      console.warn(error);
    }
  }
  return (
    <ScrollView style={{flex: 1, backgroundColor: 'black'}}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          borderBottomWidth: 1,
          borderColor: '#1a1a1a',
          flexDirection: 'row',
        }}>
        <LinearGradient
          colors={['#FF512F', '#DD2476']}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 0}}
          style={{
            width: '100%',
            flexDirection: 'row',
            alignItems: 'center'
          }}>
          <Icon
            name="chevron-back"
            size={28}
            color="white"
            onPress={() => navigation.goBack()}
            style={{margin: 10}}
          />
          <Text
            style={{
              color: 'white',
              fontSize: 18,
              padding: 10,
              fontWeight: 'bold',
              alignSelf: 'center'
            }}>
            {hashDetails.hash}
          </Text>
        </LinearGradient>
      </View>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-evenly',
          alignItems: 'center',
          borderBottomWidth: 1,
          borderColor: '#1a1a1a',
          padding: 10,
        }}>
        <Image
          source={{uri: hashDetails.imageUri}}
          style={{height: 120, width: 120, borderRadius: 200 / 2}}
        />
        <View style={{gap: 20}}>
        <View style={{backgroundColor: '#1a1a1a', paddingHorizontal: 10, paddingVertical: 10, borderRadius: 10}}>
          <Text style={{color: 'white'}}>{formattedDate2}</Text>
        </View>
        <View style={{backgroundColor: '#1a1a1a', paddingHorizontal: 10, paddingVertical: 10, borderRadius: 10}}>
          <Text style={{color: 'white'}}>{formattedDate1}</Text>
        </View>
        </View>
      </View>
      <View style={{backgroundColor: '#1a1a1a', margin: 10, borderRadius: 10}}>
        <Bluing text={hashDetails.info} style={{color: 'white', margin: 10, fontSize: 16}} />
      </View>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-evenly',
          margin: 10,
        }}>
        <View style={{backgroundColor: '#1a1a1a',padding: 10, borderRadius: 10, width: "80%", alignItems: 'center'}}>
          <Text style={{color: 'grey', fontSize: 16}}>People Joined</Text>
          <Text style={{color: 'white', alignSelf: 'center', fontSize: 16, fontWeight: 'bold'}}>{hashDetails.joined || "0"}</Text>
        </View>
      </View>
      <View style={{margin: 10, borderBottomWidth: 1, borderColor: "#1a1a1a", padding: 10}}>
      <LinearGradient
      colors={isMember ? ['#1a1a1a', 'grey', '#1a1a1a'] : ['#FF512F', '#DD2476','#FF512F']}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 0}}
      style={{
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center', 
        borderRadius: 10
      }}>
        <TouchableOpacity style={{width: "100%", alignItems: 'center', padding: 10, flexDirection: 'row', justifyContent: 'center', gap:10}} onPress={joinHash}>
          <Text style={{fontSize: 16, color: 'white', alignSelf: 'center'}}>{isMember ? 'Supporting' : 'Support'}</Text>
          <Icon
            name="globe-outline"
            size={25}
            color="white"
            style={{alignSelf: 'center'}}
          />
        </TouchableOpacity>
      </LinearGradient>
      </View>
      <View>
      <Tab.Navigator
      screenOptions={{
        tabBarStyle: {backgroundColor: '#1a1a1a'},
        tabBarIndicatorStyle: {backgroundColor: '#FF512F'},
        tabBarLabelStyle: {color: 'white'},
      }}>
      <Tab.Screen name="Posts" component={HashPosts} initialParams={{hash}}/>
      <Tab.Screen name="Pictures" component={HashPictures} initialParams={{hash}}/>
    </Tab.Navigator>
      </View>
    </ScrollView>
  );
}
