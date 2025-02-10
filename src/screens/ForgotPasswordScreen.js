import React, { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, Text, View, Modal, ActivityIndicator } from 'react-native';
import auth from '@react-native-firebase/auth';
import Icon from 'react-native-vector-icons/Ionicons';
import color from './color';
import {SharedElement} from 'react-navigation-shared-element';

const ForgotPasswordScreen = ({navigation}) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

  const handlePasswordReset = async () => {
    if (!email) {
      setError('Please enter your email address.');
      setModalVisible(true);
      return;
    }

    setLoading(true);
    setError('');
    try {
      await auth().sendPasswordResetEmail(email);
      setError('A password reset email has been sent to your inbox.');
      setModalVisible(true);
    } catch (error) {
      console.error('Password Reset Error:', error);
      setError(`Error: ${error.message}`);
      setModalVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setModalVisible(false);
    setError('');
  };

  return (
    <View style={styles.container}>
    <View style={{padding: 10}}>
      <Icon name="chevron-back" color={color} size={20} onPress={() => navigation.goBack()} />
    </View>
      <Text style={styles.title}>Forgot Password</Text>

      <TextInput
        style={styles.input}
        placeholder="Enter your email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        placeholderTextColor="grey"
      />

      <TouchableOpacity style={styles.button} onPress={handlePasswordReset} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="white" size="small" />
        ) : (
          <Text style={styles.buttonText}>Send Password Reset Email</Text>
        )}
      </TouchableOpacity>

      <Modal
        transparent={true}
        visible={modalVisible}
        animationType="slide"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalMessage}>{error}</Text>
            <TouchableOpacity style={styles.modalButton} onPress={closeModal}>
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: 'black',
  },
  title: {
    fontFamily: 'title3',
    fontSize: 40,
    color: '#FF3131',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    padding: 10,
    marginVertical: 10,
    borderWidth: 1,
    borderRadius: 5,
    color: 'white',
    backgroundColor: '#1a1a1a',
  },
  button: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#FF3131',
    borderRadius: 5,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: '80%',
    backgroundColor: '#1a1a1a',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalTitle: {
    color: '#FF3131',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalMessage: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButton: {
    backgroundColor: '#FF3131',
    paddingVertical: 5,
    width: "80%",
    alignItems: 'center',
    borderRadius: 5,
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ForgotPasswordScreen;
