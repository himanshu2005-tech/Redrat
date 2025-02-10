import React, {useEffect, useState} from 'react';
import auth from '@react-native-firebase/auth';
import {createMaterialTopTabNavigator} from '@react-navigation/material-top-tabs';
import LoginScreen from '../screens/LoginScreen';
import SignUpScreen from '../screens/SignUpScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import HomeStack from './HomeStack';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import color from '../screens/color';

const Tab = createMaterialTopTabNavigator();

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    backgroundColor: '#000000',
  },
  tabBarStyle: {
    elevation: 4,
    backgroundColor: '#1a1a1a',
    borderRadius: 5,
    width: '100%',
    marginTop: 10,
  },
  tabLabelStyle: {
    fontSize: 15,
    textAlign: 'center',
  },
  tabBarIndicator: {
    backgroundColor: color,
    borderRadius: 2,
  },
  verificationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0d0d0d',
    padding: 20,
  },
  verificationText: {
    color: '#FFFFFF',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  resendButton: {
    marginTop: 20,
    paddingVertical: 12,
    backgroundColor: color,
    borderRadius: 10,
    width: '80%',
    alignItems: 'center',
  },
  resendButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  headerText: {
    color: color,
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
    fontFamily: 'title3',
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#1a1a1a',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    alignItems: 'center',
  },
  modalText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: "rgba(0,0, 0,0.8)",
    borderRadius: 5,
    width: "100%",
    alignItems: 'center'
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
});

const AuthTabs = ({onEmailSignIn, onEmailSignUp}) => {
  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        tabBarLabelStyle: {
          fontSize: 15,
          letterSpacing: 1,
          color: 'white',
        },
        tabBarItemStyle: {
          width: 100,
          backgroundColor: '#1a1a1a',
          marginRight: 10,
          borderRadius: 50,
        },
        tabBarStyle: {backgroundColor: 'black', marginTop: 15},
        tabBarIndicatorStyle: {
          backgroundColor: 'black',
          width: 50,
          alignSelf: 'center',
        },
        tabBarActiveTintColor: 'white',
        tabBarInactiveTintColor: 'grey',
        animationEnabled: true,
        swipeEnabled: true,
        lazy: true,
        lazyPlaceholder: () => (
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: 'black',
            }}>
            <Text style={{color: 'white'}}>Loading...</Text>
          </View>
        ),
      })}>
      <Tab.Screen
        name="Login"
        options={{
          tabBarLabel: ({color}) => (
            <Text style={[styles.tabLabelStyle, {color}]}>Login</Text>
          ),
        }}>
        {props => <LoginScreen {...props} onEmailSignIn={onEmailSignIn} />}
      </Tab.Screen>
      <Tab.Screen
        name="Sign Up"
        options={{
          tabBarLabel: ({color}) => (
            <Text style={[styles.tabLabelStyle, {color}]}>Sign Up</Text>
          ),
        }}>
        {props => <SignUpScreen {...props} onEmailSignUp={onEmailSignUp} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
};

export default function AuthCheck() {
  const [authenticated, setAuthenticated] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [user, setUser] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(currentUser => {
      if (currentUser) {
        setUser(currentUser);
        setAuthenticated(true);
        setEmailVerified(currentUser.emailVerified);
      } else {
        setAuthenticated(false);
        setEmailVerified(false);
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const intervalId = setInterval(async () => {
      if (user && !user.emailVerified) {
        try {
          await auth().currentUser.reload();
          setEmailVerified(auth().currentUser.emailVerified);
        } catch (error) {
          console.error('Error reloading user data:', error);
        }
      }
    }, 5000);

    return () => clearInterval(intervalId);
  }, [user]);

  const handleEmailSignUp = async (email, password) => {
    try {
      const userCredential = await auth().createUserWithEmailAndPassword(
        email,
        password,
      );
      await userCredential.user.sendEmailVerification();
      setErrorMessage('Verification email sent. Please check your inbox.');
      setModalVisible(true);
    } catch (error) {
      handleAuthError(error, 'sign up');
    }
  };

  const handleEmailSignIn = async (email, password) => {
    try {
      const userCredential = await auth().signInWithEmailAndPassword(
        email,
        password,
      );
      await userCredential.user.reload();

      if (!userCredential.user.emailVerified) {
        setErrorMessage('Please verify your email before logging in.');
        setModalVisible(true);
        await auth().signOut();
      }
    } catch (error) {
      handleAuthError(error, 'sign in');
    }
  };

  const handleAuthError = (error, action) => {
    console.error(`Error during ${action}:`, error);
    let message = 'An error occurred. Please try again later.';

    if (error.code === 'auth/network-request-failed') {
      message = 'Network error. Please check your connection and try again.';
    } else if (error.code === 'auth/email-already-in-use') {
      message = 'This email address is already in use.';
    } else if (error.code === 'auth/invalid-email') {
      message = 'Invalid email format.';
    } else if (error.code === 'auth/user-not-found') {
      message = 'No user found with this email.';
    } else if (error.code === 'auth/wrong-password') {
      message = 'Incorrect password. Please try again.';
    } else if (error.code === 'auth/weak-password') {
      message = 'Password should be at least 6 characters.';
    } else if(error.code === 'auth/invalid-credential'){
      message='Invalid Credentials';
    }  

    setErrorMessage(message);
    setModalVisible(true);
  };

  if (authenticated && emailVerified) {
    return <HomeStack />;
  }

  if (authenticated && !emailVerified) {
    return (
      <View style={styles.verificationContainer}>
        <Text style={styles.verificationText}>
          Please verify your email before logging in. A verification email has
          been sent to your inbox.
        </Text>
        <TouchableOpacity
          style={styles.resendButton}
          onPress={() => auth().currentUser.sendEmailVerification()}>
          <Text style={styles.resendButtonText}>Resend Verification Email</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}></View>
      <AuthTabs
        onEmailSignIn={handleEmailSignIn}
        onEmailSignUp={handleEmailSignUp}
      />
      <Modal
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalText}>{errorMessage}</Text>
            <Pressable
              style={styles.modalButton}
              onPress={() => setModalVisible(false)}>
              <Text style={styles.modalButtonText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
