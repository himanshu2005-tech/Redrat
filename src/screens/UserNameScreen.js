import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ActivityIndicator, TouchableOpacity, Modal, StyleSheet, Switch } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import messaging from '@react-native-firebase/messaging';

export default function UserNameScreen({ onSuccess }) {
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [fcmToken, setFcmToken] = useState(null);  // State to hold FCM token

  useEffect(() => {
    // Request notification permission and get the FCM token
    const requestFCMToken = async () => {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        const token = await messaging().getToken();
        setFcmToken(token);
      } else {
        console.log('Notification permissions not granted.');
      }
    };

    requestFCMToken();
  }, []);

  const validateName = (input) => {
    const regex = /^[a-z0-9.]*$/;
    if (!regex.test(input)) {
      setError('Name must contain only lowercase letters, numbers, and periods.');
    } else {
      setError('');
    }
    setName(input.replace(/[^a-z0-9.]/g, ''));
  };

  const validateAndSaveData = async () => {
    if (error || name === '' || bio === '') {
      setModalMessage('Please enter a valid name and bio.');
      setModalVisible(true);
      return;
    }

    setLoading(true);

    try {
      const usersSnapshot = await firestore().collection('Users').where('name', '==', name).get();
      if (!usersSnapshot.empty) {
        setLoading(false);
        setModalMessage('This name is already taken, please choose another one.');
        setModalVisible(true);
        return;
      }

      const userId = auth().currentUser.uid;
      await firestore().collection('Users').doc(userId).set({
        name: name,
        bio: bio,
        email: auth().currentUser.email,
        profile_pic: auth().currentUser.photoURL,
        isPrivate: isPrivate,
        fcmToken: fcmToken,  // Save FCM token
        joined_on: firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      setLoading(false);
      setModalMessage('Username and bio saved successfully!');
      setModalVisible(true);
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error saving data:', error);
      setLoading(false);
      setModalMessage('An error occurred while saving data. Please try again.');
      setModalVisible(true);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16, backgroundColor: 'black' }}>
      <Text style={{ fontSize: 18, marginBottom: 20, color: "#FF3131" }}>Enter your username and bio</Text>

      {/* Username Input */}
      <TextInput
        value={name}
        onChangeText={validateName}
        placeholder="Username"
        style={styles.input}
        placeholderTextColor={"#FFEDED"}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {/* Bio Input */}
      <TextInput
        value={bio}
        onChangeText={setBio}
        placeholder="Bio"
        style={[styles.input, { height: 80 }]}
        placeholderTextColor={"#FFEDED"}
        multiline={true}
      />

      {/* Private/Public Switch */}
      <View style={styles.switchContainer}>
        <Text style={styles.switchLabel}>{isPrivate ? 'Private Account' : 'Public Account'}</Text>
        <Switch
          value={isPrivate}
          onValueChange={setIsPrivate}
          trackColor={{ false: "#1a1a1a", true: "#FF3131" }}
          thumbColor={"#FF3131"}
        />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF3131" />
          <Text style={styles.loadingText}>Checking for Updates</Text>
        </View>
      ) : (
        <TouchableOpacity onPress={validateAndSaveData} style={styles.saveButton}>
          <Text style={styles.saveButtonText}>Save Username and Bio</Text>
        </TouchableOpacity>
      )}

      {/* Modal */}
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
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 0.5,
    padding: 10,
    width: '100%',
    marginBottom: 10,
    borderRadius: 5,
    color: "#FF3131",
    textAlignVertical: 'top',
    backgroundColor: "#1a1a1a"
  },
  errorText: {
    color: 'red',
    marginBottom: 10
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'black'
  },
  loadingText: {
    color: "#FF3131",
    fontSize: 16
  },
  saveButton: {
    borderColor: "#FF3131",
    borderWidth: 0.5,
    width: "80%",
    backgroundColor: '#FF3131',
    alignItems: "center",
    padding: 15,
    borderRadius: 5
  },
  saveButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: 'bold'
  },
  modalView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalText: {
    marginBottom: 15,
    textAlign: 'center',
    fontSize: 16,
    color: '#FF3131',
  },
  button: {
    borderRadius: 10,
    padding: 10,
    elevation: 2,
  },
  buttonClose: {
    backgroundColor: '#FF3131',
  },
  textStyle: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  switchLabel: {
    color: "#FF3131",
    marginRight: 10,
  }
});
