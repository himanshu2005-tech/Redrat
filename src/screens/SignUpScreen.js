import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Modal,
} from 'react-native';
import color from './color';
import {SharedElement} from 'react-navigation-shared-element';

export default function SignUpScreen(props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

  const onEmailSignUp = async () => {
    if(!email && !password && !confirmPassword){
      setError('Enter all the fields');
      setModalVisible(true);
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setModalVisible(true);
      return;
    }

    setLoading(true);
    setError('');
    try {
      await props.onEmailSignUp(email, password);
      props.navigation.navigate('Login');
    } catch (error) {
      console.error(error);
      setError('Failed to sign up. Please try again.');
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
      <Text style={styles.title}>Sign Up</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="grey"
        value={email}
        onChangeText={setEmail}
        autoCapitalize='none'
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="grey"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <TextInput
        style={styles.input}
        placeholder="Re-enter Password"
        placeholderTextColor="grey"
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        onEndEditing={onEmailSignUp}
      />

      <TouchableOpacity
        onPress={onEmailSignUp}
        style={styles.button}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" size="small" />
        ) : (
          <Text style={styles.text}>Sign Up</Text>
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
  error: {
    color: 'red',
    fontSize: 16,
    marginBottom: 10,
  },
  link: {
    marginTop: 15,
  },
  linkText: {
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
    backgroundColor: 'black',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalTitle: {
    color: color,
    fontSize: 20,
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
    width: "80%",
    alignItems: 'center',
    borderRadius: 5,
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
  },
});


