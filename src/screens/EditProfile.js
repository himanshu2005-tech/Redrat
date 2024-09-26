import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Switch,
  Pressable,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

export default function EditProfile({ navigation }) {
  const [displayName, setDisplayName] = useState('');
  const [defaultDisplayName, setDefaultDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [defaultBio, setDefaultBio] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [defaultIsPrivate, setDefaultIsPrivate] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
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
            'Display name must contain only lowercase letters, numbers, and periods.'
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
            'This username is already taken. Please choose another one.'
          );
          return;
        }

        await firestore().collection('Users').doc(user.uid).update({
          name: displayName,
          bio: bio,
          isPrivate: isPrivate,
        });

        Alert.alert('Success', 'Profile updated successfully!');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error updating profile: ', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    }
  };

  const hasChanges = () => {
    return (
      displayName !== defaultDisplayName ||
      bio !== defaultBio ||
      isPrivate !== defaultIsPrivate
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Icon
          name="chevron-back"
          size={28}
          color="#FF3131"
          onPress={() => navigation.goBack()}
        />
        <Text style={styles.title}>Edit Profile</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.label}>Display Name:</Text>
        <TextInput
          style={styles.input}
          value={displayName}
          onChangeText={(text) => setDisplayName(text.replace(/[^a-z0-9.]/g, ''))}
        />

        <Text style={styles.label}>Bio:</Text>
        <TextInput
          style={[styles.input, { height: 100 }]}
          value={bio}
          onChangeText={setBio}
          multiline={true}
        />

        <View style={styles.switchContainer}>
          <Text style={styles.label}>Private Account:</Text>
          <Switch
            value={isPrivate}
            onValueChange={setIsPrivate}
            trackColor={{ false: '#767577', true: '#FF3131' }}
            thumbColor={isPrivate ? '#FF3131' : '#f4f3f4'}
          />
        </View>

        <Pressable
          style={[
            styles.button,
            { backgroundColor: hasChanges() ? '#FF3131' : 'grey' },
          ]}
          onPress={updateProfile}
          disabled={!hasChanges()} 
        >
          <Text style={styles.buttonText}>Update Profile</Text>
        </Pressable>
      </View>
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
    borderColor: 'grey',
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    color: '#FF3131',
    marginLeft: 10,
  },
  content: {
    padding: 20,
  },
  label: {
    fontSize: 18,
    color: 'white',
    marginBottom: 10,
  },
  input: {
    width: '100%',
    padding: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 2,
    fontSize: 17,
    borderWidth: 1,
    borderColor: 'grey',
    color: '#FF3131',
    marginBottom: 20,
    textAlignVertical: 'top',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  button: {
    padding: 15,
    borderRadius: 4,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
  },
});
