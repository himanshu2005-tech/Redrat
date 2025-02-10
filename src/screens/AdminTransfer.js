import React, {useState, useEffect} from 'react';
import {
  Text,
  View,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  Pressable,
  Modal,
  ActivityIndicator,
  Clipboard,
  ToastAndroid,
  Alert,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import Icon from 'react-native-vector-icons/Ionicons';
import Bluing from '../texting/Bluing';
import uuid from 'react-native-uuid';
import color from './color';
import {SharedElement} from 'react-navigation-shared-element';

export default function AdminTransfer({navigation, route}) {
  const {network_id, networkDetails} = route.params;
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState([]);
  const [showConfirmationModal, setShowConfirmtionModal] = useState(false);
  const [transferLoading, setTransferLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [pin, setPin] = useState(uuid.v4());
  const [userDetails, setUserDetails] = useState([]);
  const [reVerificationPin, setReverificationPin] = useState();

  React.useEffect(() => {
    if (networkDetails.admin != auth().currentUser.uid) {
      navigation.popToTop();
    }
  }, [network_id, networkDetails]);

  const copyToClipboard = value => {
    Clipboard.setString(value);
    ToastAndroid.show('Pin copied', ToastAndroid.LONG);
  };

  useEffect(() => {
    if (searchQuery.length > 0) {
      const fetchUsers = async () => {
        try {
          const usersSnapshot = await firestore()
            .collection('Users')
            .where('name', '>=', searchQuery)
            .where('name', '<=', searchQuery + '\uf8ff')
            .limit(30)
            .get();
          const usersList = usersSnapshot.docs
            .map(doc => ({
              id: doc.id,
              ...doc.data(),
            }))
            .filter(user => user.id !== auth().currentUser.uid);
          setUsers(usersList);
        } catch (error) {
          console.error('Error fetching users:', error);
        }
      };
      fetchUsers();
    } else {
      setUsers([]);
    }
  }, [searchQuery]);

  const fetchUserDetails = async id => {
    try {
      const data = await firestore().collection('Users').doc(id).get();
      setUserDetails(data.data());
    } catch (error) {
      console.warn(error);
    }
  };

  const onReject = async () => {
    console.log(networkDetails.adminConfirmationWaiting[0]);
    try {
      await firestore()
        .collection('Users')
        .doc(networkDetails.adminConfirmationWaiting[0])
        .collection('Inbox')
        .doc(network_id)
        .delete();
      await firestore().collection('Network').doc(network_id).update({
        adminConfirmationWaiting: [],
        networkReVerification: null,
        isAdminTransferring: false,
      });
      navigation.popToTop();
    } catch (error) {
      console.warn(error);
    }
  };
  const onFinalTransfer = async pin => {
    try {
      if (reVerificationPin === networkDetails.networkReVerification) {
        console.log(
          'PIN',
          pin,
          'real pin',
          networkDetails.networkReVerification,
        );
        await firestore()
          .collection('Users')
          .doc(networkDetails.adminConfirmationWaiting[0])
          .collection('Inbox')
          .doc(network_id)
          .delete();
        await firestore().collection('Network').doc(network_id).update({
          admin: networkDetails.adminConfirmationWaiting[0],
          adminConfirmationWaiting: [],
          networkReVerification: null,
          isAdminTransferring: false,
        });
        navigation.goBack();
        navigation.goBack();
        navigation.goBack();
        navigation.goBack();
      } else {
        Alert.alert('WRONG PIN');
      }
    } catch (error) {
      console.warn(error);
    }
  };
  const assignAdminRequest = async () => {
    try {
      setTransferLoading(true);
      await firestore()
        .collection('Network')
        .doc(network_id)
        .update({
          adminConfirmationWaiting: [selectedUser.id, pin],
          isAdminTransferring: true,
        });
      await firestore()
        .collection('Users')
        .doc(selectedUser.id)
        .collection('Inbox')
        .doc(network_id)
        .set({
          message: message,
          createdAt: firestore.FieldValue.serverTimestamp(),
          type: 'admin_transfer',
          network_id: network_id,
          administrator: auth().currentUser.uid,
          pin: pin,
        });
    } catch (error) {
      console.warn(error);
    } finally {
      setTransferLoading(false);
      setShowConfirmtionModal(false);
      navigation.goBack()
      navigation.goBack()
    }
  };
  useEffect(() => {
    if (
      Array.isArray(networkDetails?.adminConfirmationWaiting) &&
      networkDetails.adminConfirmationWaiting.length > 0
    ) {
      fetchUserDetails(networkDetails?.adminConfirmationWaiting[0]);
    }
  }, [networkDetails]);

  if (
    Array.isArray(networkDetails?.adminConfirmationWaiting) &&
    networkDetails.adminConfirmationWaiting.length > 0
  ) {
    console.log('Array has elements, rendering content...');

    return (
      <View style={{backgroundColor: 'black', flex: 1}}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            padding: 10,
            gap: 10,
          }}>
          <Icon
            name="chevron-back"
            color={color}
            size={25}
            onPress={() => navigation.goBack()}
          />
          <Text style={{color: 'white', fontSize: 18}}>Admin Transfer</Text>
        </View>
        <View
          style={{
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: '50%',
            gap: 10,
          }}>
          <Image
            source={{uri: userDetails.profile_pic}}
            style={{height: 150, width: 150, borderRadius: 90}}
          />
          <Text style={{color: 'white', fontSize: 15, fontWeight: 'bold'}}>
            {userDetails.name}
          </Text>
          <Bluing
            text={userDetails.bio}
            style={{color: 'white', textAlign: 'center'}}
          />
        </View>
        {networkDetails.adminConfirmationWaiting.includes('REVERIFICATION') ? (
          <View style={{alignItems: 'center'}}>
            <Text style={{color: 'grey', marginTop: 15}}>
              Enter Re-Verification PIN:
            </Text>
            <TextInput
              style={{
                backgroundColor: '#1a1a1a',
                borderRadius: 5,
                width: '90%',
                alignSelf: 'center',
                marginTop: 15,
                color: 'grey',
                paddingLeft: 10,
              }}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              placeholderTextColor={'grey'}
              onChangeText={setReverificationPin}
              value={reVerificationPin}
            />
            <View
              style={{
                width: '100%',
                justifyContent: 'space-evenly',
                flexDirection: 'row',
                alignItems: 'center',
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
                onPress={() =>
                  onFinalTransfer(networkDetails.networkReVerification)
                }>
                <Text style={{color: 'white'}}>Verify</Text>
              </Pressable>
              <Pressable
                style={{
                  width: '48%',
                  backgroundColor: '#1a1a1a',
                  padding: 10,
                  borderRadius: 5,
                  alignItems: 'center',
                }}
                onPress={onReject}>
                <Text style={{color: 'white'}}>Cancel Transfer</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={{alignItems: 'center', justifyContent: 'center'}}>
            <Text style={{color: 'grey', textAlign: 'center'}}>
              Waiting for admin request approval
            </Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                justifyContent: 'space-evenly',
              }}>
              <Text style={{color: 'white', textAlign: 'center', margin: 10}}>
                {networkDetails.adminConfirmationWaiting[1]}
              </Text>
              <Icon
                color="grey"
                size={20}
                name="copy-outline"
                onPress={() => copyToClipboard(pin)}
              />
            </View>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={{flex: 1, backgroundColor: 'black'}}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          padding: 10,
          gap: 10,
        }}>
        <Icon
          name="chevron-back"
          color={color}
          size={25}
          onPress={() => navigation.goBack()}
        />
        <Text style={{color: 'white', fontSize: 18}}>Admin Transfer</Text>
      </View>
      <TextInput
        style={styles.searchInput}
        placeholder="Search for a user"
        placeholderTextColor="grey"
        value={searchQuery}
        onChangeText={text => setSearchQuery(text)}
      />
      <FlatList
        data={users}
        keyExtractor={item => item.id}
        renderItem={({item}) => (
          <TouchableOpacity style={styles.userItem}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
              <Image
                source={{uri: item.profile_pic}}
                style={{height: 40, width: 40, borderRadius: 200}}
              />
              <View style={{maxWidth: '90%', zIndex: 1}}>
                <Text style={styles.userName}>{item.name}</Text>
                <Text style={styles.bio} numberOfLines={1} ellipsizeMode="tail">
                  {item.bio}
                </Text>
              </View>
            </View>
            <Pressable
              style={{
                backgroundColor: color,
                position: 'absolute',
                right: 5,
                padding: 10,
                paddingLeft: 18,
                zIndex: 5,
                borderRadius: 5,
              }}
              onPress={() => {
                setSelectedUser(item);
                setShowConfirmtionModal(true);
              }}>
              <Text style={{color: 'white'}}>Request</Text>
            </Pressable>
          </TouchableOpacity>
        )}
        ListEmptyComponent={() => (
          <Text style={styles.emptyText}>No users found</Text>
        )}
      />
      <Modal
        visible={showConfirmationModal}
        transparent={true}
        animationType="slide">
        <Pressable
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onPress={() => setShowConfirmtionModal(false)}>
          <View
            style={{
              backgroundColor: 'black',
              padding: 15,
              width: '95%',
              alignSelf: 'center',
            }}>
            <Text
              style={{
                color: 'white',
                textAlign: 'center',
                margin: 10,
                fontSize: 20,
                fontWeight: 'bold',
              }}>
              Admin Confirmation Transfer
            </Text>
            <View style={{alignItems: 'center', justifyContent: 'center'}}>
              <Image
                source={{uri: selectedUser.profile_pic}}
                style={{width: 100, height: 100, borderRadius: 400 / 2}}
              />
              <Text
                style={{
                  color: 'white',
                  textAlign: 'center',
                  fontWeight: 'bold',
                  fontSize: 17,
                }}>
                {selectedUser.name}
              </Text>
              <Bluing
                text={selectedUser.bio}
                style={{color: 'white', textAlign: 'center'}}
              />
            </View>

            <TextInput
              style={{
                backgroundColor: '#1a1a1a',
                width: '90%',
                borderRadius: 5,
                alignSelf: 'center',
                marginTop: 10,
                paddingLeft: 10,
                color: 'white',
                textAlignVertical: 'top',
              }}
              multiline
              numberOfLines={5}
              placeholder="Enter a message for the admin transfer request"
              placeholderTextColor={'grey'}
              onChangeText={setMessage}
              value={message}
            />
            <Text style={{color: 'grey', textAlign: 'center', marginTop: 10}}>
              Pin for taking up admin
            </Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                justifyContent: 'space-evenly',
              }}>
              <Text style={{color: 'white', textAlign: 'center', margin: 10}}>
                {pin}
              </Text>
              <Icon
                color="grey"
                size={20}
                name="copy-outline"
                onPress={() => copyToClipboard(pin)}
              />
            </View>
            <View
              style={{
                marginTop: 15,
              }}>
              <View
                style={{
                  width: '100%',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-evenly',
                }}>
                <Pressable
                  style={{
                    backgroundColor: color,
                    width: '48%',
                    padding: 10,
                    borderRadius: 5,
                    alignItems: 'center',
                    opacity: !message ? 0.5 : 1,
                  }}
                  disabled={!message}
                  onPress={assignAdminRequest}>
                  {transferLoading ? (
                    <ActivityIndicator size={'small'} color="white" />
                  ) : (
                    <Text style={{color: 'white'}}>Request</Text>
                  )}
                </Pressable>
                <Pressable
                  style={{
                    backgroundColor: '#1a1a1a',
                    width: '48%',
                    padding: 10,
                    borderRadius: 5,
                    alignItems: 'center',
                  }}
                  onPress={() => setShowConfirmtionModal(false)}>
                  <Text style={{color: 'white'}}>Cancel</Text>
                </Pressable>
              </View>
              <Pressable
                style={{
                  backgroundColor: color,
                  width: '100%',
                  marginTop: 10,
                  borderRadius: 5,
                  padding: 10,
                  alignItems: 'center',
                }}
                onPress={() => {
                  setShowConfirmtionModal(false);
                  navigation.navigate('UserProfile', {
                    id: selectedUser.id,
                  });
                }}>
                <Text style={{color: 'white'}}>Check Profile</Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  searchInput: {
    height: 40,
    borderRadius: 8,
    paddingLeft: 10,
    marginBottom: 10,
    backgroundColor: '#1a1a1a',
    margin: 10,
    color: 'white',
  },
  userItem: {
    padding: 10,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    marginHorizontal: 10,
    justifyContent: 'space-between',
  },
  userName: {
    color: 'white',
    fontSize: 18,
  },
  bio: {
    color: 'grey',
    maxWidth: '90%',
  },
  emptyText: {
    color: 'grey',
    textAlign: 'center',
    marginTop: 10,
  },
});
