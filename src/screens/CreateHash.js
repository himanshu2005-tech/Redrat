import React, { useState } from 'react';
import {
  Text,
  View,
  TextInput,
  Pressable,
  Platform,
  Image,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import storage from '@react-native-firebase/storage';
import { launchImageLibrary } from 'react-native-image-picker';
import LinearGradient from 'react-native-linear-gradient';

export default function CreateHash({ navigation }) {
  const [inputValue, setInputValue] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [info, setInfo] = useState('');
  const [date, setDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState('');
  const [imageUri, setImageUri] = useState('');
  const [uploading, setUploading] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');

  const handleChangeText = async (text) => {
    setInputValue(text);
    const trimmedText = text.trim();
    if (trimmedText === '' || /\s/.test(trimmedText)) {
      setValidationMessage('Hash name cannot be empty and should not contain spaces.');
    } else {
      const hashCollection = firestore().collection('Hash');
      const hashQuery = await hashCollection
        .where('hash', '==', trimmedText)
        .get();

      if (!hashQuery.empty) {
        setValidationMessage('This hash is already in use. Please choose a different one.');
      } else {
        setValidationMessage('');
      }
    }
  };

  const handleDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    
    currentDate.setHours(0, 0, 0, 0);
    
    setShowDatePicker(Platform.OS === 'ios');
    setDate(currentDate);
    setSelectedDate(currentDate.toLocaleDateString());
  };
  

  const handleSave = async () => {
    try {
      const hashName = inputValue.trim();
      if (hashName === '' || /\s/.test(hashName)) {
        alert('Please enter a valid hash name (no spaces allowed).');
        return;
      }

      setUploading(true);

      let imageDownloadUrl = '';
      if (imageUri) {
        const filename = imageUri.substring(imageUri.lastIndexOf('/') + 1);
        const uploadUri =
          Platform.OS === 'ios' ? imageUri.replace('file://', '') : imageUri;
        const storageRef = storage().ref(`hashpictures/${filename}`);
        await storageRef.putFile(uploadUri);
        imageDownloadUrl = await storageRef.getDownloadURL();
      }

      const timestamp = firestore.Timestamp.fromDate(date); 

      const hashCollection = firestore().collection('Hash');
      const hashQuery = await hashCollection
        .where('hash', '==', hashName)
        .get();

      if (!hashQuery.empty) {
        alert('This hash is already in use. Please choose a different one.');
      } else {
        const hashRef = await hashCollection.add({
          hash: hashName,
          expiresAt: timestamp,
          createdAt: firestore.FieldValue.serverTimestamp(),
          createdBy: auth().currentUser.uid,
          imageUri: imageDownloadUrl || null,
          info: info || '',
        });
        const documentId = hashRef.id;
        alert('Hash created successfully!');
        navigation.goBack()
        navigation.navigate('HashScreen', {
          hash: documentId,
        });
      }
    } catch (error) {
      console.error('Error saving hash: ', error);
      alert('An error occurred while saving the hash. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const selectImage = async () => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        includeBase64: false,
      },
      (response) => {
        if (response.didCancel) {
          console.log('User cancelled image picker');
        } else if (response.errorCode) {
          console.log('ImagePicker Error: ', response.errorMessage);
        } else if (response.assets && response.assets.length > 0) {
          const asset = response.assets[0];
          if (asset.type.startsWith('image/')) {
            setImageUri(asset.uri);
          } else {
            console.log('Selected media is not an image.');
          }
        }
      },
    );
  };

  return (
    <View style={{ backgroundColor: 'black', flex: 1 }}>
      <View
        style={{
          padding: 14,
          borderBottomWidth: 1,
          borderColor: '#1a1a1a',
          flexDirection: 'row',
          alignItems: 'center',
        }}>
        <Icon
          name="chevron-back"
          size={25}
          color="#FF3131"
          onPress={() => navigation.goBack()}
        />
        <Text style={{ color: 'white', fontSize: 20, marginLeft: 10 }}>
          Create a{' '}
        </Text>
        <Text style={{ color: '#FF3131', fontSize: 20, fontWeight: 'bold' }}>
          HASH
        </Text>
      </View>
      <View style={{ margin: 10 }}>
        <Text style={{ color: 'white', fontSize: 18 }}>Create a HASH</Text>
        <LinearGradient
          colors={['#FF512F', '#DD2476']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={{
            borderRadius: 5,
            padding: 2,
            marginTop: 10,
          }}>
          <TextInput
            style={{
              width: '100%',
              backgroundColor: 'rgba(0, 0, 0, 0)',
              borderRadius: 5,
              padding: 15,
              fontSize: 17,
              color: 'white',
            }}
            value={inputValue}
            onChangeText={handleChangeText}
            placeholder="Enter hash name"
            placeholderTextColor="white"
          />
        </LinearGradient>
        {validationMessage ? (
          <Text style={{ color: 'red', marginTop: 10 }}>{validationMessage}</Text>
        ) : null}
        <Text style={{ color: 'white', fontSize: 18, marginTop: 10 }}>
          Make Hash functional until:{' '}
        </Text>
        <Pressable
          onPress={() => setShowDatePicker(true)}
          style={{
            marginTop: 10,
            width: '95%',
            backgroundColor: '#1a1a1a',
            padding: 15,
            borderRadius: 5,
          }}>
          <Text style={{ color: 'white' }}>
            Select Date: {selectedDate || ''}
          </Text>
        </Pressable>
        {showDatePicker && (
          <DateTimePicker
            testID="dateTimePicker"
            value={date}
            mode="date"
            display="default"
            onChange={handleDateChange}
            minimumDate={new Date()}
          />
        )}
        <Text style={{ color: 'white', fontSize: 18, marginTop: 10 }}>
          What's your hash about?
        </Text>
        <TextInput
          style={{
            backgroundColor: '#1a1a1a',
            width: '95%',
            marginTop: 10,
            borderRadius: 5,
            padding: 10,
            fontSize: 17,
            color: '#FF3131',
          }}
          value={info}
          onChangeText={setInfo}
          placeholder="Explain HASH."
          placeholderTextColor="#FF3131"
          multiline={true}
          numberOfLines={4}
          textAlignVertical="top"
        />
        {imageUri && (
          <Image source={{uri: imageUri}} style={{height: 130, width: 130,borderRadius: 10, margin: 10, alignSelf: 'center'}} />
        )}
        <Pressable
          onPress={selectImage}
          style={{
            marginTop: 10,
            width: '95%',
            backgroundColor: '#1a1a1a',
            padding: 15,
            borderRadius: 5,
          }}>
          <Text style={{ color: 'white', fontSize: 17 }}>
            {imageUri ? 'Change Hash Pic' : 'Select Hash Pic'}
          </Text>
        </Pressable>
        <Pressable
          onPress={handleSave}
          style={{
            marginTop: 20,
            width: '95%',
            backgroundColor: '#FF3131',
            padding: 15,
            borderRadius: 5,
            alignItems: 'center',
          }}>
          {uploading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={{ color: 'white', fontSize: 17 }}>Save HASH</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}
