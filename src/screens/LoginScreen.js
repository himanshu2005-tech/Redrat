import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import color from './color';
import {SharedElement} from 'react-navigation-shared-element';

export default function LoginScreen({ onEmailSignIn, navigation }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

  const onEmailSignInHandler = async () => {
    setLoading(true);
    setError('');

    if (!email || !password) {
      setError('Please enter both email and password.');
      setModalVisible(true);
      setLoading(false);
      return;
    }

    try {
      await onEmailSignIn(email, password);
    } catch (error) {
      console.error(error);
      if (error.code === 'auth/invalid-email') {
        setError('Invalid email address.');
      } else if (error.code === 'auth/wrong-password') {
        setError('Incorrect password.');
      } else if (error.code === 'auth/user-not-found') {
        setError('User not found.');
      } else if (error.code === 'auth/network-request-failed') {
        setError('Network error. Please check your internet connection.');
      } else if(error.code === 'auth/invalid-email'){
        setError('Invalid Email');
      } else if(error.code === 'auth/invalid-credential'){
        setError('Invalid Credentials');
      }      
      else {
        setError('Failed to sign in. Please try again.');
      }
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
    <View style={styles.screen}>
      <Text style={styles.title}>Login</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="grey"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="grey"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <Text
        onPress={() => navigation.navigate('ForgotPasswordScreen')}
        style={styles.forgotPasswordText}>
        Forgot Password?
      </Text>

      <TouchableOpacity
        onPress={onEmailSignInHandler}
        style={styles.button}
        disabled={loading}>
        {loading ? (
          <ActivityIndicator color="white" size="small" />
        ) : (
          <Text style={styles.text}>Sign in</Text>
        )}
      </TouchableOpacity>

      <Modal
        transparent={true}
        visible={modalVisible}
        animationType="slide"
        onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Error</Text>
            <Text style={styles.modalMessage}>{error}</Text>
            <TouchableOpacity style={styles.modalButton} onPress={closeModal}>
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontFamily: 'title3',
    fontSize: 40,
    color: color,
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: color,
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'right',
    textDecorationLine: 'underline',
    paddingVertical: 5,
    alignSelf: 'flex-end',
    marginRight: 25,
  },
  input: {
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 10,
    paddingHorizontal: 10,
    color: 'white',
    backgroundColor: '#1a1a1a',
    width: '90%',
  },
  button: {
    backgroundColor: color,
    paddingVertical: 10,
    paddingHorizontal: 50,
    borderRadius: 5,
  },
  text: {
    color: 'white',
    fontSize: 25,
    fontFamily: 'title2',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: '80%',
    backgroundColor: 'black',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalTitle: {
    color: color,
    fontSize: 18,
    marginBottom: 10,
  },
  modalMessage: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButton: {
    backgroundColor: color,
    paddingVertical: 5,
    width: '80%',
    alignItems: 'center',
    borderRadius: 5,
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
  },
});
