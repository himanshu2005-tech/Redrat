import { firebase } from '@react-native-firebase/firestore'
import React, { useState, useEffect } from 'react'
import { Text, View, Image, Pressable } from 'react-native'
import firestore from '@react-native-firebase/firestore'
import auth from '@react-native-firebase/auth'
import { useNavigation } from '@react-navigation/native'
import color from './color'
import {SharedElement} from 'react-navigation-shared-element';

export default function FriendUser({item}){
    const navigation = useNavigation()
    const [userData, setUserData] = useState([])
    useEffect(() => {
        const fetchUserDetails = async() => {
            try{
                const userData = await firestore().collection("Users").doc(item.userId).get();
                setUserData(userData.data())
            } catch(error){
                console.warn(error)
            }
        }
        fetchUserDetails()
    }, [])
    const onRequestAccept = async () => {
        try {
          await firestore().collection('Users').doc(item.userId).update({
            requested: firestore.FieldValue.arrayRemove(auth().currentUser.uid),
            friends: firestore.FieldValue.arrayUnion(auth().currentUser.uid),
          });
          await firestore().collection('Users').doc(auth().currentUser.uid).update({
            friends: firestore.FieldValue.arrayUnion(item.userId),
          });
          await firestore().collection('Users').doc(auth().currentUser.uid).collection("Requests").doc(item.id).delete();
        } catch (error) {
          console.error('Error accepting request:', error);
        }
      };
      const cancelRequest = async () => {
        try {
          await firestore().collection('Users').doc(item.userId).update({
            requested: firestore.FieldValue.arrayRemove(auth().currentUser.uid),
          });
          await firestore().collection('Users').doc(auth().currentUser.uid).collection("Requests").doc(item.id).delete();
        } catch (error) {
          console.warn('Error canceling request:', error);
        }
      };
    return (
        <>
      <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
      <View style={{flexDirection: 'row', alignItems: 'center', gap: 10, maxWidth: "60%"}}>
      <Image source={{uri: userData.profile_pic}} style={{height: 40, width: 40, borderRadius: 20, marginLeft: 10}} />
        <Text style={{color: color, fontSize: 20, fontWeight: 'bold'}}>{userData.name}</Text>
        </View>
        <View style={{flexDirection: 'row', gap: 10}}>
        <Pressable style={{backgroundColor: color, padding: 10, borderRadius: 4}} onPress={onRequestAccept}>
            <Text style={{color: 'white', fontSize: 18}}>Accept</Text>
        </Pressable>
        <Pressable style={{backgroundColor: "#1a1a1a", padding: 10, borderRadius: 4}} onPress={cancelRequest}>
            <Text style={{color: 'white', fontSize: 18}}>Cancel</Text>
        </Pressable>
        </View>
      </View>
      <Pressable onPress={() => navigation.navigate("UserProfile", {
        id: item.userId
    })} style={{backgroundColor: "#1a1a1a", padding: 10, alignItems: 'center', margin: 10, borderRadius: 10}}>
      <Text style={{color: 'white', fontSize: 18, flexWrap: 'wrap'}}>wants to be your friend</Text>
      </Pressable>
      </>
    )
}
