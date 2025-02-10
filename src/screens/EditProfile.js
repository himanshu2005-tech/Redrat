import React, {useState, useEffect} from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
  Image,
  Modal,
  PermissionsAndroid
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import {launchImageLibrary} from 'react-native-image-picker';
import {Switch} from './Switch';
import {openSettings} from 'react-native-permissions';
import color from './color';
import {SharedElement} from 'react-navigation-shared-element';

export default function EditProfile({navigation}) {
  const [displayName, setDisplayName] = useState('');
  const [defaultDisplayName, setDefaultDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [defaultBio, setDefaultBio] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [defaultIsPrivate, setDefaultIsPrivate] = useState(false);
  const [profilePic, setProfilePic] = useState(null);
  const [defaultProfilePic, setDefaultProfilePic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [askPermission, setAskPermission] = useState(false);
  const [permissionStatement, setPermissionStatement] = useState('');

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

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        const user = auth().currentUser;
        if (user) {
          const userDoc = await firestore()
            .collection('Users')
            .doc(user.uid)
            .get();
          const userData = userDoc.data();
          if (userData) {
            setDisplayName(userData.name);
            setDefaultDisplayName(userData.name);
            setBio(userData.bio || '');
            setDefaultBio(userData.bio || '');
            setIsPrivate(userData.isPrivate || false);
            setDefaultIsPrivate(userData.isPrivate || false);
            setProfilePic(userData.profile_pic || null);
            setDefaultProfilePic(userData.profile_pic || null);
          }
        }
      } catch (error) {
        console.error('Error fetching user profile: ', error);
        Alert.alert('Error', 'Failed to fetch user profile. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const updateProfile = async () => {
    try {
      const user = auth().currentUser;
      if (user) {
        const regex = /^[a-z0-9.]*$/;
        if (!regex.test(displayName)) {
          Alert.alert(
            'Invalid Display Name',
            'Display name must contain only lowercase letters, numbers, and periods.',
          );
          return;
        }

        if (!displayName || !bio) {
          Alert.alert('Invalid Input', 'Display name and bio cannot be empty.');
          return;
        }

        const usersSnapshot = await firestore()
          .collection('Users')
          .where('name', '==', displayName)
          .get();
        if (!usersSnapshot.empty && displayName !== defaultDisplayName) {
          Alert.alert(
            'Duplicate Username',
            'This username is already taken. Please choose another one.',
          );
          return;
        }

        await firestore().collection('Users').doc(user.uid).update({
          name: displayName,
          bio: bio,
          isPrivate: isPrivate,
          profile_pic: profilePic,
        });

        Alert.alert('Success', 'Profile updated successfully!');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error updating profile: ', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    }
  };

  const handleImagePicker = async () => {
    const granted = await checkPermission(
      PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
    );
    if (!granted) {
      return;
    }
    try {
      const result = await launchImageLibrary({mediaType: 'photo'});
      if (result.assets && result.assets.length > 0) {
        const image = result.assets[0];
        const user = auth().currentUser;
        if (user) {
          const storageRef = storage().ref(`profile_pics/${user.uid}`);
          const uploadTask = await storageRef.putFile(image.uri);
          const downloadURL = await storageRef.getDownloadURL();
          setProfilePic(downloadURL);
        }
      }
    } catch (error) {
      console.error('Error uploading image: ', error);
      Alert.alert('Error', 'Failed to upload image. Please try again.');
    }
  };

  const hasChanges = () => {
    return (
      displayName !== defaultDisplayName ||
      bio !== defaultBio ||
      isPrivate !== defaultIsPrivate ||
      profilePic !== defaultProfilePic
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator
          size={'small'}
          color={color}
          style={{marginTop: '100%'}}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Icon
          name="chevron-back"
          size={25}
          color="#FF3131"
          onPress={() => navigation.goBack()}
        />
        <Text style={styles.title}>Edit Profile</Text>
      </View>
      <View style={styles.content}>
        <Pressable
          onPress={handleImagePicker}
          style={styles.profilePicContainer}>
          <Image source={{uri: profilePic}} style={styles.profilePic} />
          <Text style={styles.changePicText}>Change Profile Picture</Text>
        </Pressable>

        <Text style={styles.label}>Display Name:</Text>
        <TextInput
          style={styles.input}
          value={displayName}
          onChangeText={text => setDisplayName(text.replace(/[^a-z0-9.]/g, ''))}
        />

        <Text style={styles.label}>Bio:</Text>
        <TextInput
          style={[styles.input, {height: 100, textAlignVertical: 'top'}]}
          value={bio}
          onChangeText={setBio}
          multiline={true}
        />

        <View style={styles.switchContainer}>
          <Text style={styles.label}>Private Account:</Text>
          <Switch
            value={isPrivate}
            onPress={() => setIsPrivate(prevState => !prevState)}
            style={{width: 50, height: 25}}
          />
        </View>
      </View>
      <Pressable
        style={[
          styles.button,
          {backgroundColor: hasChanges() ? color : '#1a1a1a'},
        ]}
        onPress={updateProfile}
        disabled={!hasChanges()}>
        <Text style={styles.buttonText}>Update</Text>
      </Pressable>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  header: {
    padding: 15,
    borderBottomWidth: 0.2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    color: color,
    marginLeft: 10,
  },
  content: {
    padding: 10,
  },
  label: {
    fontSize: 18,
    color: 'white',
  },
  input: {
    width: '100%',
    padding: 10,
    backgroundColor: '#1a1a1a',
    borderRadius: 5,
    fontSize: 14,
    borderWidth: 1,
    color: color,
    marginBottom: 20,
    marginTop: 15,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  profilePicContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profilePic: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  changePicText: {
    color: color,
    fontSize: 14,
  },
  button: {
    padding: 10,
    borderRadius: 4,
    alignItems: 'center',
    position: 'absolute',
    bottom: 5,
    width: '100%',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
  },
});
