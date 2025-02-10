import React, {useState} from 'react';
import {Text, View, TextInput, Pressable} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import color from './color';
import {SharedElement} from 'react-navigation-shared-element';



export default function AddResponse({route, navigation}) {
  const {network_id, post_id} = route.params;
  const [response, setResponse] = useState('');
  const sendResponse = async () => {
    try {
      await firestore()
        .collection('Posts')
        .doc(post_id)
        .collection('Responses')
        .add({
            response: response,
            createdAt: firestore.FieldValue.serverTimestamp(),
            response_by: auth().currentUser.uid
        });

        setResponse('')
        navigation.goBack()
    } catch (error) {
      console.warn(error);
    }
  };
  return (
    <View style={{backgroundColor: 'black', flex: 1}}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          padding: 10,
          gap: 10,
        }}>
        <Icon
          name={'chevron-up'}
          color= {color}
          size={25}
          onPress={() => navigation.goBack()}
        />
        <Text style={{color: 'white', fontSize: 20}}>Response</Text>
      </View>
      <TextInput
        style={{
          backgroundColor: '#1a1a1a',
          color: 'white',
          fontSize: 16,
          padding: 15,
          borderRadius: 10,
          margin: 10,
          textAlignVertical: 'top',
          flex: 1,
        }}
        placeholder="Write your response here..."
        placeholderTextColor="#9e9e9e"
        multiline={true}
        value={response}
        onChangeText={(input) => setResponse(input)}
      />
      <Pressable
        style={{
          backgroundColor: color,
          padding: 10,
          margin: 10,
          borderRadius: 5,
          alignItems: 'center',
        }}
        onPress={sendResponse}>
        <Text style={{color: 'white', fontSize: 15}}>Send Response</Text>
      </Pressable>
    </View>
  );
}
