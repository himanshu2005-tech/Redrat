import React, {useRef, useMemo, useCallback, useState} from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import Icon from 'react-native-vector-icons/Ionicons';
import {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetBackdrop,
} from '@gorhom/bottom-sheet';
import {TouchableOpacity} from 'react-native-gesture-handler';
import firestore from '@react-native-firebase/firestore';
import PostControls from './PostControls';
import TribetCard from './TribetCard';
import color from './color';
import messaging from '@react-native-firebase/messaging';
import {SharedElement} from 'react-navigation-shared-element';

export default function UserDetails({navigation}) {
  const bottomSheetModalRef = useRef(null);
  const [showModal, setShowModal] = useState(false);
  const [takeModal, setTakeModal] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState(auth().currentUser.email);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [userDetails, setUserDetails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showTribetCard, setShowTribetCard] = useState(false);
  const [signOut, setSignOut] = useState(false);

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
        return fcmToken;
      } else {
        console.log('Failed to fetch FCM token');
      }
    } else {
      Alert.alert(
        'Permission Denied',
        'You need to allow notifications to get an FCM token.',
      );
    }
    return null;
  };

  const handleSignOut = async () => {
    try {
      const token = await requestFCMPermission();
      console.log(token);
      await firestore()
        .collection('Users')
        .doc(auth().currentUser.uid)
        .update({
          fcmToken: firestore.FieldValue.arrayRemove(token),
        });
      setSignOut(false);
      navigation.goBack();

      auth().signOut();
    } catch (error) {
      console.warn(error);
    }
  };

  const confirmDeletion = async () => {
    setShowModal(false);
    setTakeModal(true);
  };
  const deleteAccount = async () => {
    try {
      setDeleteLoading(true);

      const user = auth().currentUser;

      if (!user) {
        console.warn('No user is currently logged in');
        setDeleteLoading(false);
        return;
      }

      if (!confirmEmail || !confirmPassword) {
        console.warn('Please provide email and password for confirmation.');
        setDeleteLoading(false);
        return;
      }

      if (user.email !== confirmEmail) {
        console.warn('Provided email does not match the logged-in user.');
        setDeleteLoading(false);
        return;
      }
      const credential = auth.EmailAuthProvider.credential(
        confirmEmail,
        confirmPassword,
      );

      try {
        await user.reauthenticateWithCredential(credential);
        navigation.replace('AUTH_CHECK');
        console.log('Reauthentication successful.');
      } catch (error) {
        console.warn(
          'Reauthentication failed. Please check your email and password.',
          error.message,
        );
        setDeleteLoading(false);
        return;
      }

      const userDoc = await firestore().collection('Users').doc(user.uid).get();
      if (!userDoc.exists) {
        console.warn('User document does not exist in Firestore.');
      } else {
        await firestore().collection('Users').doc(user.uid).delete();
        console.log('User document deleted successfully from Firestore.');
      }

      try {
        await user.delete();
        console.log('Account deleted successfully.');
      } catch (error) {
        console.warn('Error deleting the user account:', error.message);
        setDeleteLoading(false);
        return;
      }
    } catch (error) {
      console.warn(
        'An error occurred during the account deletion process:',
        error.message,
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <View
        style={{
          backgroundColor: 'black',
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <ActivityIndicator color={color} size="small" />
      </View>
    );
  }

  return (
    <ScrollView style={{backgroundColor: 'rgba(0,0,0,0.93)', flex: 1}}>
      <View style={styles.header}>
        <Icon
          name="chevron-back"
          size={28}
          color={color}
          onPress={() => navigation.goBack()}
        />
        <Text style={styles.title}>Profile</Text>
      </View>
      <Text
        style={{
          marginLeft: 14,
          color: 'white',
          fontSize: 18,
          marginTop: 10,
          fontWeight: 'bold',
        }}>
        Networks
      </Text>
      <View style={{margin: 10, backgroundColor: 'black', borderRadius: 5}}>
        <Pressable
          style={styles.container}
          onPress={() => navigation.navigate('MyNetworks')}>
          <Text style={{color: 'white', fontSize: 15}}>My Network</Text>
          <Icon name="chevron-forward-outline" size={25} color={'white'} />
        </Pressable>
        <Pressable
          style={styles.container}
          onPress={() => navigation.navigate('JoinedNetworks')}>
          <Text style={{color: 'white', fontSize: 15}}>Joined Networks</Text>
          <Icon name="chevron-forward-outline" size={25} color={'white'} />
        </Pressable>
      </View>
      <Text
        style={{
          marginLeft: 14,
          color: 'white',
          fontSize: 18,
          fontWeight: 'bold',
        }}>
        Account Activity
      </Text>
      <View style={{margin: 10, backgroundColor: 'black', borderRadius: 5}}>
        <Pressable
          style={styles.container}
          onPress={() => navigation.navigate('Like')}>
          <Text style={{color: 'white', fontSize: 15}}>Likes</Text>
          <Icon name="chevron-forward-outline" size={25} color={'white'} />
        </Pressable>
        <Pressable
          style={styles.container}
          onPress={() => navigation.navigate('Saved')}>
          <Text style={{color: 'white', fontSize: 15}}>Saved</Text>
          <Icon name="chevron-forward-outline" size={25} color={'white'} />
        </Pressable>
        <Pressable
          style={styles.container}
          onPress={() => navigation.navigate('BlockedAccount')}>
          <Text style={{color: 'white', fontSize: 15}}>Blocked Accounts</Text>
          <Icon name="chevron-forward-outline" size={25} color={'white'} />
        </Pressable>
        <Pressable
          style={styles.container}
          onPress={() => navigation.navigate('Preferences')}>
          <Text style={{color: 'white', fontSize: 15}}>Preferences</Text>
          <Icon name="chevron-forward-outline" size={25} color={'white'} />
        </Pressable>
      </View>
      <Text
        style={{
          marginLeft: 14,
          color: 'white',
          fontSize: 18,
          fontWeight: 'bold',
        }}>
        Tribet
      </Text>
      <View style={{margin: 10, backgroundColor: 'black', borderRadius: 5}}>
        <Pressable
          style={styles.container}
          onPress={() => setShowTribetCard(true)}>
          <Text style={{color: 'white', fontSize: 15}}>Tribet</Text>
          <Icon name="chevron-forward-outline" size={25} color={'white'} />
        </Pressable>
        <Pressable
          style={styles.container}
          onPress={() => navigation.navigate('Tribet')}>
          <Text style={{color: 'white', fontSize: 15}}>Tribet History</Text>
          <Icon name="chevron-forward-outline" size={25} color={'white'} />
        </Pressable>
        <Pressable
          style={styles.container}
          onPress={() => navigation.navigate('TribetDictionary')}>
          <Text style={{color: 'white', fontSize: 15}}>Tribet dictionary</Text>
          <Icon name="chevron-forward-outline" size={25} color={'white'} />
        </Pressable>
        {/*
                  <Pressable
          style={styles.container}
          onPress={() => navigation.navigate('BuyBadges')}>
          <Text style={{color: 'white', fontSize: 15}}>Buy Badges</Text>
          <Icon name="chevron-forward-outline" size={25} color={'white'} />
        </Pressable>
        */}
      </View>
      <PostControls />
      <Text
        style={{
          marginLeft: 14,
          color: 'white',
          fontSize: 18,
          fontWeight: 'bold',
        }}>
        Device Controls
      </Text>
      <View style={{margin: 10, backgroundColor: 'black', borderRadius: 5}}>
        <Pressable
          style={styles.container}
          onPress={() => navigation.navigate('Permissions')}>
          <Text style={{color: 'white', fontSize: 15}}>Device Permissions</Text>
          <Icon name="chevron-forward-outline" size={25} color={'white'} />
        </Pressable>
      </View>
      <Text
        style={{
          marginLeft: 14,
          color: 'white',
          fontSize: 18,
          fontWeight: 'bold',
        }}>
        About
      </Text>
      <View style={{margin: 10, backgroundColor: 'black', borderRadius: 5}}>
        <Pressable
          style={styles.container}
          onPress={() => navigation.navigate('Account')}>
          <Text style={{color: 'white', fontSize: 15}}>Account Overview</Text>
          <Icon name="chevron-forward-outline" size={25} color={'white'} />
        </Pressable>
        <Pressable
          style={styles.container}
          onPress={() =>
            navigation.navigate('Web', {
              url: 'https://www.termsfeed.com/live/9a31fd84-285f-42a9-b1bf-1f9024854e8f',
            })
          }>
          <Text style={{color: 'white', fontSize: 15}}>Privacy Policy</Text>
          <Icon name="chevron-forward-outline" size={25} color={'white'} />
        </Pressable>
        {/*
        <Pressable
          style={styles.container}
          onPress={() =>
            navigation.navigate('Web', {
              url: 'https://www.termsfeed.com/live/4a2bb8fb-c3da-41a5-8d6f-c052826342c3',
            })
          }>
          <Text style={{color: 'white', fontSize: 15}}>Terms of Use</Text>
          <Icon name="chevron-forward-outline" size={25} color={'white'} />
        </Pressable>
        */}
      </View>
      <Text
        style={{
          marginLeft: 14,
          color: 'white',
          fontSize: 18,
          fontWeight: 'bold',
        }}>
        Edit
      </Text>
      <View style={{margin: 10, backgroundColor: 'black', borderRadius: 5}}>
        <Pressable
          style={styles.container}
          onPress={() => navigation.navigate('ChangePassword')}>
          <Text style={{color: 'white', fontSize: 15}}>Change Password</Text>
          <Icon name="chevron-forward-outline" size={25} color={'white'} />
        </Pressable>
        <Pressable
          style={styles.container}
          onPress={() => navigation.navigate('Edit')}>
          <Text style={{color: 'white', fontSize: 15}}>Edit Profile</Text>
          <Icon name="chevron-forward-outline" size={25} color={'white'} />
        </Pressable>
        <Pressable style={styles.container} onPress={() => setSignOut(true)}>
          <Text style={{color: 'red', fontSize: 15}}>Sign Out</Text>
          <Icon name="chevron-forward-outline" size={25} color={'red'} />
        </Pressable>
        <Pressable style={styles.container} onPress={() => setShowModal(true)}>
          <Text style={{color: 'red', fontSize: 15}}>Delete Account</Text>
          <Icon name="chevron-forward-outline" size={25} color={'red'} />
        </Pressable>
      </View>
      <Modal
        transparent={true}
        visible={signOut}
        animationType="slide"
        onRequestClose={() => setSignOut(false)}>
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
            <Text style={{color: 'white'}}>
              Are you sure you want to sign out your account??
            </Text>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-evenly',
                width: '100%',
                marginTop: 10,
              }}>
              <Pressable
                style={{
                  width: '48%',
                  backgroundColor: color,
                  padding: 10,
                  borderRadius: 5,
                  alignItems: 'center',
                }}
                onPress={handleSignOut}>
                <Text style={{color: 'white'}}>Sign Out</Text>
              </Pressable>
              <Pressable
                style={{
                  width: '48%',
                  backgroundColor: '#1a1a1a',
                  padding: 10,
                  borderRadius: 5,
                  alignItems: 'center',
                }}
                onPress={() => setSignOut(false)}>
                <Text style={{color: 'white'}}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
      <Modal
        transparent={true}
        visible={showModal}
        animationType="slide"
        onRequestClose={() => setShowModal(false)}>
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
            <Text style={{color: 'white'}}>
              Are you sure you want to delete your account??
            </Text>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-evenly',
                width: '100%',
                marginTop: 10,
              }}>
              <Pressable
                style={{
                  width: '48%',
                  backgroundColor: color,
                  padding: 10,
                  borderRadius: 5,
                  alignItems: 'center',
                }}
                onPress={confirmDeletion}>
                <Text style={{color: 'white'}}>Confirm Deletion</Text>
              </Pressable>
              <Pressable
                style={{
                  width: '48%',
                  backgroundColor: '#1a1a1a',
                  padding: 10,
                  borderRadius: 5,
                  alignItems: 'center',
                }}
                onPress={() => setShowModal(false)}>
                <Text style={{color: 'white'}}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
      <Modal
        transparent={true}
        visible={showTribetCard}
        animationType="slide"
        onRequestClose={() => setShowTribetCard(false)}>
        <Pressable
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          }}
          onPress={() => setShowTribetCard(false)}>
          <View
            style={{
              backgroundColor: 'black',
              padding: 20,
              borderRadius: 10,
              width: '100%',
              alignItems: 'center',
              gap: 15,
            }}>
            <TribetCard id={auth().currentUser.uid} />
          </View>
        </Pressable>
      </Modal>
      <Modal
        transparent={true}
        visible={showModal}
        animationType="slide"
        onRequestClose={() => setShowModal(false)}>
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
            <Text style={{color: 'white'}}>
              Are you sure you want to delete your account??
            </Text>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-evenly',
                width: '100%',
                marginTop: 10,
              }}>
              <Pressable
                style={{
                  width: '48%',
                  backgroundColor: color,
                  padding: 10,
                  borderRadius: 5,
                  alignItems: 'center',
                }}
                onPress={confirmDeletion}>
                <Text style={{color: 'white'}}>Confirm Deletion</Text>
              </Pressable>
              <Pressable
                style={{
                  width: '48%',
                  backgroundColor: '#1a1a1a',
                  padding: 10,
                  borderRadius: 5,
                  alignItems: 'center',
                }}
                onPress={() => setShowModal(false)}>
                <Text style={{color: 'white'}}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
      <Modal
        transparent={true}
        visible={takeModal}
        animationType="slide"
        onRequestClose={() => setTakeModal(false)}>
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
            <Text style={{color: 'white', textAlign: 'left'}}>
              Enter your password:{' '}
            </Text>
            <TextInput
              value={auth().currentUser.email}
              style={{
                backgroundColor: '#1a1a1a',
                margin: 10,
                borderRadius: 5,
                color: 'white',
                width: '100%',
                paddingLeft: 10,
              }}
              readOnly={true}
            />
            <TextInput
              value={confirmPassword}
              style={{
                backgroundColor: '#1a1a1a',
                margin: 10,
                borderRadius: 5,
                color: 'white',
                width: '100%',
                paddingLeft: 10,
              }}
              onChangeText={input => setConfirmPassword(input)}
              placeholder="Enter password"
              placeholderTextColor={'grey'}
              secureTextEntry
            />
            <View
              style={{
                flexDirection: 'row',
                width: '100%',
                alignItems: 'center',
                justifyContent: 'space-between',
                margintop: 15,
              }}>
              {userDetails.isBidding ? (
                <Pressable
                  style={{
                    width: '48%',
                    padding: 10,
                    borderRadius: 5,
                    alignItems: 'center',
                    backgroundColor: color,
                  }}>
                  {deleteLoading ? (
                    <ActivityIndicator size={'small'} color="white" />
                  ) : (
                    <Text style={{color: 'white'}}>
                      You are currently bidding for a network and cannot
                      initliaze account deletion
                    </Text>
                  )}
                </Pressable>
              ) : (
                <Pressable
                  style={{
                    width: '48%',
                    padding: 10,
                    borderRadius: 5,
                    alignItems: 'center',
                    backgroundColor: color,
                  }}
                  onPress={deleteAccount}>
                  {deleteLoading ? (
                    <ActivityIndicator size={'small'} color="white" />
                  ) : (
                    <Text style={{color: 'white'}}>Delete Account</Text>
                  )}
                </Pressable>
              )}
              <Pressable
                style={{
                  width: '48%',
                  padding: 10,
                  borderRadius: 5,
                  alignItems: 'center',
                  backgroundColor: '#1a1a1a',
                }}
                onPress={() => setTakeModal(false)}>
                <Text style={{color: 'white'}}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderColor: 'grey',
    padding: 15,
    justifyContent: 'space-between',
    flexDirection: 'row',
    alignItems: 'center',
  },
  header: {
    position: 'sticky',
    top: 0,
    zIndex: 100,
    backgroundColor: 'black',
    width: '100%',
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    color: color,
    marginLeft: 10,
  },
});
