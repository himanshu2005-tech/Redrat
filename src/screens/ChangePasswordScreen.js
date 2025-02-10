import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  Pressable,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import Icon from 'react-native-vector-icons/Ionicons';
import color from './color';
import {SharedElement} from 'react-navigation-shared-element';

const ChangePasswordScreen = ({navigation}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

  const reauthenticate = async currentPassword => {
    const user = auth().currentUser;
    const cred = auth.EmailAuthProvider.credential(user.email, currentPassword);
    return user.reauthenticateWithCredential(cred);
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      setModalVisible(true);
      return;
    }
    setLoading(true);

    try {
      await reauthenticate(currentPassword);
      await auth().currentUser.updatePassword(newPassword);
      setError('Your password has been changed.');
      setModalVisible(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      handleAuthError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthError = error => {
    let message = 'Invalid credentials. Please verify and try again';
    if (error.code === 'auth/wrong-password') {
      message = 'The current password is incorrect.';
    } else if (error.code === 'auth/weak-password') {
      message =
        'The new password is too weak. Please choose a stronger password.';
    }
    setError(message);
    setModalVisible(true);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Icon
          name="chevron-back"
          size={28}
          color="#FF3131"
          onPress={() => navigation.goBack()}
        />
        <Text style={styles.title}>Change password</Text>
      </View>
      <TextInput
        style={styles.input}
        placeholder="Current Password"
        placeholderTextColor="#aaaaaa"
        secureTextEntry
        value={currentPassword}
        onChangeText={setCurrentPassword}
      />
      <TextInput
        style={styles.input}
        placeholder="New Password"
        placeholderTextColor="#aaaaaa"
        secureTextEntry
        value={newPassword}
        onChangeText={setNewPassword}
      />
      <TextInput
        style={styles.input}
        placeholder="Confirm New Password"
        placeholderTextColor="#aaaaaa"
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />
      <TouchableOpacity
        style={styles.button}
        onPress={handleChangePassword}
        disabled={
          loading || !currentPassword || !confirmPassword || !newPassword
        }>
        <Text style={styles.buttonText}>
          {loading ? 'Changing...' : 'Change Password'}
        </Text>
      </TouchableOpacity>
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalText}>{error}</Text>
            <Pressable
              style={styles.modalButton}
              onPress={() => setModalVisible(false)}>
              <Text style={styles.modalButtonText}>OK</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
};

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
    fontSize: 24,
    color: color,
    marginLeft: 10,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 15,
    color: '#FFFFFF',
    backgroundColor: '#1a1a1a',
    width: '90%',
    alignSelf: 'center',
  },
  button: {
    backgroundColor: color,
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    width: '90%',
    alignSelf: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'black',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  modalText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 15,
    textAlign: 'center',
  },
  modalButton: {
    backgroundColor: color,
    borderRadius: 5,
    paddingHorizontal: 20,
    paddingVertical: 10,
    width: '80%',
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
});

export default ChangePasswordScreen;
