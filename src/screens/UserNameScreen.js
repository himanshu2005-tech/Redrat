import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Switch,
  Image,
  Pressable,
  FlatList,
  ScrollView,
  PermissionsAndroid,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import storage from '@react-native-firebase/storage';
import * as ImagePicker from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/Ionicons';
import topics from './Topics';
import {openSettings} from 'react-native-permissions';
import color from './color';
import messaging from '@react-native-firebase/messaging';
import {SharedElement} from 'react-navigation-shared-element';

const groupedTopics = (topics, itemsPerGroup = 3) => {
  let grouped = [];
  for (let i = 0; i < topics.length; i += itemsPerGroup) {
    grouped.push(topics.slice(i, i + itemsPerGroup));
  }
  return grouped;
};

export default function UserNameScreen({onSuccess}) {
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [isLeftHand, setIsLeftHand] = useState(false);
  const [profilePic, setProfilePic] = useState(null);
  const [fcmToken, setFcmToken] = useState(null);
  const [selectedTopics, setSelectedTopics] = useState([]);
  const groupedTopicData = groupedTopics(topics);
  const [askPermission, setAskPermission] = useState(false);
  const [permissionStatement, setPermissionStatement] = useState('');

  const requestFCMPermission = async () => {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;
  
    if (enabled) {
      console.log('FCM Authorization status:', authStatus);
      const fcmToken = await messaging().getToken();
      if (fcmToken) {
        console.log('FCM Token:', fcmToken);
        setFcmToken(fcmToken)
      } else {
        console.log('Failed to fetch FCM token');
      }
    } else {
      Alert.alert('Permission Denied', 'You need to allow notifications to get an FCM token.');
    }
    return null;
  };
  
  useEffect(() => {
    requestFCMPermission()
  }, [])
  const checkPermission = async permission => {
    try {
      const result = await PermissionsAndroid.check(permission);

      let permissionName;
      if (permission === PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES) {
        permissionName = 'Photo Access';
      } else if (
        permission === PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO
      ) {
        permissionName = 'Video Access';
      } else {
        permissionName = 'Unknown Permission';
      }

      if (result) {
        console.log(`${permissionName} is granted.`);
        return true;
      } else {
        console.log(`${permissionName} is not granted.`);

        if (Platform.OS === 'android') {
          setPermissionStatement(permissionName);
          setAskPermission(true);
        }
        return false;
      }
    } catch (error) {
      console.warn('Permission check error:', error);
      return false;
    }
  };
  const validateName = input => {
    const regex = /^[a-z0-9.]*$/;
    if (!regex.test(input)) {
      setError(
        'Name must contain only lowercase letters, numbers, and periods.',
      );
    } else {
      setError('');
    }
    setName(input.replace(/[^a-z0-9.]/g, ''));
  };

  const toggleTopicSelection = topic => {
    setSelectedTopics(prev =>
      prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic],
    );
  };

  const pickImage = async () => {
    const granted = await checkPermission(
      PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
    );
    if (!granted) {
      return;
    }
    const result = await ImagePicker.launchImageLibrary({
      mediaType: 'photo',
    });

    if (result.assets) {
      const image = result.assets[0];
      setProfilePic(image.uri);
    }
  };

  const uploadImage = async uri => {
    const userId = auth().currentUser.uid;
    const filename = `profile_pics/${userId}/${Date.now()}.jpg`;
    const reference = storage().ref(filename);

    try {
      await reference.putFile(uri);
      return await reference.getDownloadURL();
    } catch (error) {
      setModalMessage('Error uploading image. Please try again.');
      setModalVisible(true);
      throw error;
    }
  };

  const validateAndSaveData = async () => {
    if (error || name === '' || bio === '') {
      setModalMessage('Please enter a valid name and bio.');
      setModalVisible(true);
      return;
    }

    setLoading(true);

    try {
      const usersSnapshot = await firestore()
        .collection('Users')
        .where('name', '==', name)
        .get();

      if (!usersSnapshot.empty) {
        setLoading(false);
        setModalMessage(
          'This name is already taken, please choose another one.',
        );
        setModalVisible(true);
        return;
      }

      let downloadURL = profilePic;

      if (profilePic && !profilePic.startsWith('http')) {
        downloadURL = await uploadImage(profilePic);
      }

      const userId = auth().currentUser.uid;
      const userRef = firestore().collection('Users').doc(userId);
      const batch = firestore().batch();

      batch.set(
        userRef,
        {
          name,
          bio,
          email: auth().currentUser.email,
          profile_pic: downloadURL,
          isPrivate,
          isLeftHand,
          fcmToken: firestore.FieldValue.arrayUnion(fcmToken),
          joined_on: firestore.FieldValue.serverTimestamp(),
          tribet: 0,
          mutedPostVideo: true,
          autoplayPostVideo: true,
          repeatPostVideo: true,
          openInDefaultBrowser: false,
          intrestedTopics: selectedTopics,
          postSortPreference: 'Featured',
          commentSortPreference: 'Featured',
          blurSensitiveContent: false,
        },
        {merge: true},
      );

      selectedTopics.forEach(topic => {
        const preferenceRef = userRef.collection('Preferences').doc(topic);
        batch.set(
          preferenceRef,
          {
            score: 20,
          },
          {merge: true},
        );
      });

      await batch.commit();

      setLoading(false);
      setModalMessage('Data saved successfully!');
      setModalVisible(true);
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      setLoading(false);
      setModalMessage('Error saving data. Please try again.');
      setModalVisible(true);
    }
  };

  const splitTopics = [
    topics.slice(0, Math.ceil(topics.length / 4)),
    topics.slice(Math.ceil(topics.length / 4), Math.ceil(topics.length / 2)),
    topics.slice(
      Math.ceil(topics.length / 2),
      Math.ceil((topics.length * 3) / 4),
    ),
    topics.slice(Math.ceil((topics.length * 3) / 4)),
  ];

  const renderTopic = item => (
    <View style={styles.topicRow}>
      <Pressable
        key={item}
        style={[
          styles.topicItem,
          selectedTopics.includes(item) && styles.selectedTopicItem,
        ]}
        onPress={() => toggleTopicSelection(item)}>
        <Text style={styles.topicText}>{item}</Text>
      </Pressable>
    </View>
  );

  return (
    <View style={{flex: 1, backgroundColor: 'black'}}>
      <ScrollView
        contentContainerStyle={{
          backgroundColor: 'black',
          alignItems: 'center',
          marginHorizontal: 10,
        }}>
        <TouchableOpacity onPress={pickImage} style={styles.imagePicker}>
          {profilePic ? (
            <View>
              <Image source={{uri: profilePic}} style={styles.profilePic} />
            </View>
          ) : (
            <View style={styles.profilePicPlaceholder}>
              <Icon name="person-circle" size={70} color={color} />
            </View>
          )}
          <View style={styles.plusIconContainer}>
            <Icon name="add-circle" size={24} color={color} />
          </View>
        </TouchableOpacity>

        {loading && <ActivityIndicator size="small" color={color} />}

        <TextInput
          value={name}
          onChangeText={validateName}
          placeholder="Username"
          style={styles.input}
          placeholderTextColor="grey"
          autoCapitalize="none"
        />
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TextInput
          value={bio}
          onChangeText={setBio}
          placeholder="Bio"
          style={[styles.input, styles.bioInput]}
          placeholderTextColor="grey"
          multiline={true}
          numberOfLines={7}
        />

        <View style={styles.switchContainer}>
          <Text style={styles.label}>Private Account:</Text>
          <Switch
            value={isPrivate}
            onValueChange={setIsPrivate}
            trackColor={{false: '#767577', true: color}}
            thumbColor={isPrivate ? color : '#f4f3f4'}
          />
        </View>

        <View style={styles.switchContainer}>
          <View>
            <Text style={styles.label}>Are you left handed?</Text>
            <Text style={styles.subText}>
              This setting will adjust the placement of post operations.
            </Text>
          </View>
          <Switch
            value={isLeftHand}
            onValueChange={setIsLeftHand}
            trackColor={{false: '#767577', true: color}}
            thumbColor={isLeftHand ? color : '#f4f3f4'}
          />
        </View>

        <Text style={{color: 'grey', margin: 10, fontSize: 14, textAlign: 'center'}}>
          The areas of interest cover various topics such as
        </Text>

        {splitTopics.map((topicArray, index) => (
          <ScrollView
            key={index}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scrollViewContent}>
            {topicArray.map(item => renderTopic(item))}
          </ScrollView>
        ))}

        {loading ? (
          <ActivityIndicator size="small" color={color} />
        ) : (
          <TouchableOpacity
            onPress={validateAndSaveData}
            style={styles.saveButton}>
            <Text style={styles.saveButtonText}>Create Redrat</Text>
          </TouchableOpacity>
        )}

        <Modal
          transparent={true}
          animationType="slide"
          visible={modalVisible}
          onRequestClose={() => setModalVisible(!modalVisible)}>
          <View style={styles.modalView}>
            <View style={styles.modalContent}>
              <Text style={styles.modalText}>{modalMessage}</Text>
              <TouchableOpacity
                style={[styles.button, styles.buttonClose]}
                onPress={() => setModalVisible(!modalVisible)}>
                <Text style={styles.textStyle}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        <Modal
          transparent={true}
          visible={askPermission}
          animationType="slide"
          onRequestClose={() => setAskPermission(false)}>
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
            }}>
            <View
              style={{
                backgroundColor: 'black',
                padding: 20,
                borderRadius: 10,
                width: '90%',
                alignItems: 'center',
              }}>
              <Text
                style={{
                  color: 'white',
                  fontSize: 16,
                  textAlign: 'center',
                  marginTop: 10,
                }}>
                {permissionStatement} Permission
              </Text>
              <Text
                style={{
                  color: 'white',
                  fontSize: 16,
                  textAlign: 'center',
                  marginTop: 10,
                }}>
                The {permissionStatement} permission is required to access media
                files. Please enable it in the settings.
              </Text>
              <Pressable
                style={{
                  backgroundColor: color,
                  width: '90%',
                  padding: 15,
                  borderRadius: 5,
                  alignItems: 'center',
                  marginTop: 10,
                }}
                onPress={openSettings}>
                <Text style={{color: 'white'}}>Open Settings</Text>
              </Pressable>
              <Pressable
                style={{
                  backgroundColor: '#1a1a1a',
                  width: '90%',
                  padding: 15,
                  borderRadius: 5,
                  alignItems: 'center',
                  marginTop: 10,
                }}
                onPress={() => setAskPermission(false)}>
                <Text style={{color: 'white'}}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
        <View style={{height: 50}} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 18,
    marginBottom: 20,
    color: color,
  },
  input: {
    borderWidth: 1,
    padding: 12,
    width: '100%',
    marginBottom: 12,
    borderRadius: 5,
    color: color,
    backgroundColor: '#1a1a1a',
    textAlignVertical: 'top',
    backgroundColor: '#1a1a1a',
    fontSize: 15
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
    fontSize: 14,
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: color,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 5,
    alignItems: 'center',
    width: '90%',
    marginTop: 15,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  modalView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  modalContent: {
    width: '85%',
    backgroundColor: 'black',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalText: {
    fontSize: 16,
    marginBottom: 20,
    color: 'grey',
  },
  button: {
    borderRadius: 5,
    padding: 10,
    elevation: 2,
  },
  buttonClose: {
    backgroundColor: color,
    width: '80%',
  },
  textStyle: {
    color: 'white',
    textAlign: 'center',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginVertical: 12,
  },
  label: {
    fontSize: 16,
    color: 'white',
  },
  subText: {
    fontSize: 12,
    color: 'gray',
    maxWidth: '90%',
  },
  profilePic: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  profilePicPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  plusIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'white',
    borderRadius: 12,
  },
  imagePicker: {
    marginBottom: 20,
    marginTop: 15,
  },
  scrollViewContent: {
    flexDirection: 'row',
  },
  topicRow: {
    marginRight: 10,
    marginTop: 10,
  },
  topicItem: {
    backgroundColor: '#1a1a1a',
    borderRadius: 5,
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  selectedTopicItem: {
    backgroundColor: color,
  },
  topicText: {
    color: 'white',
    fontSize: 14,
    padding: 15,
  },
});




