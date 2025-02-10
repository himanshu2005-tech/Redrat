import React, {useEffect, useRef, useState} from 'react';
import {
  Text,
  View,
  Image,
  Pressable,
  Animated,
  Modal,
  TextInput,
  Clipboard,
  ToastAndroid,
  ActivityIndicator,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import {useNavigation} from '@react-navigation/native';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';
import Bluing from '../texting/Bluing';
import auth from '@react-native-firebase/auth';
import uuid from 'react-native-uuid';
import Icon from 'react-native-vector-icons/Ionicons';
import color from './color';
import {SharedElement} from 'react-navigation-shared-element';

export default function RenderInboxMessage({item}) {
  const [networkDetails, setNetworkDetails] = useState(null);
  const [botName, setBotName] = useState('');
  const [loading, setLoading] = useState(true);
  const [showConfirmationModal, setShowConfirmtionModal] = useState(false);
  const [networkAccessModal, setNetworkAccessModal] = useState(false);
  const [errorModal, setErrorModal] = useState(false);
  const [status, setStatus] = useState(' ');
  const [reVerificationPin, setReverificationPin] = useState();
  const navigation = useNavigation();
  const [pin, setPin] = useState();
  const [pinVerifyLoading, setPinVerifyLoading] = useState(false);
  const animatedValues = useRef([]).current;

  const copyToClipboard = value => {
    Clipboard.setString(value);
    ToastAndroid.show('Pin copied', ToastAndroid.LONG);
  };
  useEffect(() => {
    const fetchNetworkDetails = async () => {
      try {
        setLoading(true);
        const data = await firestore()
          .collection('Network')
          .doc(item.network_id)
          .get();
        setNetworkDetails(data.data());
      } catch (error) {
        console.warn(error);
      } finally {
        setLoading(false);
      }
    };
    fetchNetworkDetails();
  }, [item]);

  useEffect(() => {
    if (item.sentBy) {
      const fetchBotName = async () => {
        try {
          const data = await firestore()
            .collection('Bots')
            .doc(item.sentBy)
            .get();
          setBotName(data.data().Name + '    ');
        } catch (error) {
          console.warn(error);
        }
      };
      fetchBotName();
    } else {
      setBotName('');
    }
  }, [item]);

  const onReject = async () => {
    try {
      await firestore().collection('Network').doc(item.network_id).update({
        adminConfirmationWaiting: [],
        networkReVerification: null,
        isAdminTransferring: false,
      });
      await firestore()
        .collection('Users')
        .doc(auth().currentUser.uid)
        .collection('Inbox')
        .doc(item.id)
        .delete();
    } catch (error) {
      console.warn(error);
    }
  };
  useEffect(() => {
    if (botName) {
      const nameChars = botName.split('');
      animatedValues.length = 0;

      nameChars.forEach(() => {
        animatedValues.push(new Animated.Value(0));
      });

      const animations = animatedValues.map((value, index) => {
        return Animated.timing(value, {
          toValue: 1,
          duration: 200,
          delay: index * 100,
          useNativeDriver: true,
        });
      });

      Animated.stagger(100, animations).start(() => {
        animatedValues.forEach(value => value.setValue(0));
        Animated.loop(Animated.stagger(100, animations)).start();
      });
    }
  }, [botName]);

  const generateUUID = async () => {
    setReverificationPin(uuid.v4);
  };
  const verifyAdminAccessPin = async item => {
    try {
      setPinVerifyLoading(true);
      if (item.pin === pin) {
        await generateUUID();
        await firestore()
          .collection('Users')
          .doc(auth().currentUser.uid)
          .collection('Inbox')
          .doc(item.id)
          .update({
            status: 'ADMIN_REQUEST_SENT',
            reVerificationPin: reVerificationPin,
          });

        console.log('done1');

        await firestore()
          .collection('Network')
          .doc(item.network_id)
          .update({
            adminConfirmationWaiting:
              firestore.FieldValue.arrayUnion('REVERIFICATION'),
            networkReVerification: reVerificationPin,
          });
        console.log('done1');
        setShowConfirmtionModal(false);
        setNetworkAccessModal(true);
      } else {
        await firestore().collection('Network').doc(item.network_id).update({
          adminConfirmationWaiting: [],
          isAdminTransferring: false
        });
        await firestore()
          .collection('Users')
          .doc(auth().currentUser.uid)
          .collection('Inbox')
          .doc(item.id)
          .delete();
        setErrorModal(true);
      }
    } catch (error) {
      console.warn(error);
    } finally {
      setPinVerifyLoading(false);
    }
  };
  const renderBotName = () => {
    return botName.split('').map((char, index) => {
      const animatedValue = animatedValues[index] || new Animated.Value(0);
      return (
        <Animated.Text
          key={index}
          style={{
            opacity: animatedValue,
            transform: [
              {
                scale: animatedValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 1],
                }),
              },
            ],
            color: color,
            letterSpacing: 2,
          }}>
          {char}
        </Animated.Text>
      );
    });
  };

  if (!networkDetails) {
    return null;
  }
  if (loading) {
    return (
      <SkeletonPlaceholder>
        <SkeletonPlaceholder.Item
          flexDirection="row"
          alignItems="center"
          margin={10}>
          <SkeletonPlaceholder.Item width={40} height={40} borderRadius={200} />
          <SkeletonPlaceholder.Item
            marginLeft={10}
            width={150}
            height={20}
            borderRadius={4}
          />
        </SkeletonPlaceholder.Item>
        <SkeletonPlaceholder.Item
          width={200}
          height={15}
          borderRadius={4}
          marginTop={6}
        />
        <SkeletonPlaceholder.Item
          width={100}
          height={20}
          borderRadius={4}
          marginTop={10}
        />
      </SkeletonPlaceholder>
    );
  }

  if (item.type === 'greet_message' || item.type === 'comment_reply') {
    return (
      <View style={{margin: 10}}>
        <Pressable
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            backgroundColor: '#1a1a1a',
            padding: 5,
            borderRadius: 3,
          }}
          onPress={() =>
            navigation.push('Network', {
              networkId: item.network_id,
            })
          }>
          {networkDetails.profile_pic && (
            <Image
              source={{uri: networkDetails.profile_pic}}
              style={{height: 40, width: 40, borderRadius: 200}}
            />
          )}
          <Text style={{color: 'white', fontSize: 16}}>
            {networkDetails.network_name || 'No Name'}
          </Text>
        </Pressable>
        <Bluing
          style={{color: 'white', fontSize: 15, marginTop: 10}}
          text={item.message}
        />

        <View>
          {botName && (
            <Pressable
              style={{
                backgroundColor: '#1a1a1a',
                alignItems: 'flex-end',
                padding: 3,
                marginTop: 10,
                borderRadius: 3,
              }}
              onPress={() =>
                navigation.navigate('BotScreen', {
                  botId: item.sentBy,
                })
              }>
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                {renderBotName()}
              </View>
            </Pressable>
          )}
          {!botName && (
            <Text style={{color: 'white', fontSize: 14, marginTop: 10}}>
              No bot associated with this message
            </Text>
          )}
        </View>
      </View>
    );
  }

  if (item.type === 'response') {
    return (
      <View style={{margin: 10}}>
        <Pressable
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            backgroundColor: '#1a1a1a',
            padding: 5,
            borderRadius: 3,
          }}
          onPress={() =>
            navigation.navigate('Network', {
              networkId: item.network_id,
            })
          }>
          <Image
            source={{uri: networkDetails.profile_pic}}
            style={{height: 40, width: 40, borderRadius: 200}}
          />
          <Text style={{color: 'white', fontSize: 16}}>
            {networkDetails.network_name}
          </Text>
        </Pressable>
        <Bluing
          style={{color: 'white', fontSize: 15, marginTop: 10}}
          text={item.message}
        />
        <Pressable
          style={{
            backgroundColor: '#1a1a1a',
            alignItems: 'flex-end',
            padding: 3,
            marginTop: 10,
            borderRadius: 3,
          }}
          onPress={() =>
            navigation.navigate('Responses', {
              response_id: item.response_id,
              post_id: item.post_id,
              network_id: item.network_id,
            })
          }>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <Text style={{color: color, letterSpacing: 2}}>Response</Text>
          </View>
        </Pressable>
      </View>
    );
  }
  if (item.type === 'admin_transfer') {
    return (
      <View style={{margin: 10}}>
        <Pressable
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            backgroundColor: '#1a1a1a',
            padding: 5,
            borderRadius: 3,
          }}
          onPress={() =>
            navigation.navigate('Network', {
              networkId: item.network_id,
            })
          }>
          <Image
            source={{uri: networkDetails.profile_pic}}
            style={{height: 40, width: 40, borderRadius: 200}}
          />
          <Text style={{color: 'white', fontSize: 16}}>
            {networkDetails.network_name}
          </Text>
        </Pressable>
        <Bluing
          style={{
            color: 'white',
            fontSize: 15,
            marginTop: 10,
          }}
          text={item.message}
        />

        <View style={{marginTop: 10}}>
          {item.status === 'ADMIN_REQUEST_SENT' ? (
            <View
              style={{
                backgroundColor: '#1a1a1a',
                padding: 10,
                width: '90%',
                alignSelf: 'center',
                borderRadius: 5,
                alignItems: 'center',
              }}>
              <Text style={{color: 'white'}}>Waiting for Admin's approval</Text>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  justifyContent: 'space-evenly',
                }}>
                <Text style={{color: 'white', textAlign: 'center', margin: 10}}>
                  {item.reVerificationPin}
                </Text>
                <Icon
                  color="grey"
                  size={20}
                  name="copy-outline"
                  onPress={() => copyToClipboard(item.reVerificationPin)}
                />
              </View>
            </View>
          ) : (
            <View>
              <View
                style={{
                  width: '100%',
                  justifyContent: 'space-evenly',
                  flexDirection: 'row',
                }}>
                <Pressable
                  style={{
                    backgroundColor: color,
                    width: '48%',
                    alignItems: 'center',
                    padding: 10,
                    borderRadius: 5,
                  }}
                  onPress={() => setShowConfirmtionModal(true)}>
                  <Text style={{color: 'white'}}>Take up admin</Text>
                </Pressable>
                <Pressable
                  style={{
                    backgroundColor: '#1a1a1a',
                    width: '48%',
                    alignItems: 'center',
                    padding: 10,
                    borderRadius: 5,
                  }}
                  onPress={onReject}
                  >
                  <Text style={{color: 'white'}}>Reject</Text>
                </Pressable>
              </View>
              <Pressable
                style={{
                  backgroundColor: color,
                  marginTop: 10,
                  padding: 10,
                  alignItems: 'center',
                  borderRadius: 5,
                }}
                onPress={() =>
                  navigation.navigate('Chat', {
                    id: item.administrator,
                  })
                }>
                <Text style={{color: 'white'}}>
                  Start a chat with the Administrator
                </Text>
              </Pressable>
            </View>
          )}
        </View>
        <Modal
          visible={showConfirmationModal}
          transparent={true}
          animationType="slide">
          <Pressable
            style={{
              flex: 1,
              backgroundColor: 'rgba(0, 0,0, 0.5)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onPress={() => setShowConfirmtionModal(false)}>
            <View
              style={{
                width: '90%',
                backgroundColor: 'black',
                padding: 15,
                borderRadius: 5,
              }}>
              <Text
                style={{
                  color: 'white',
                  textAlign: 'center',
                  fontSize: 16,
                  fontWeight: 'bold',
                }}>
                Are you sure you want to accept the admin rights for{' '}
                {networkDetails.network_name}?
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
                onChangeText={setPin}
                value={pin}
              />
              <Text style={{color: 'red', textAlign: 'center', margin: 10}}>
                Please enter the correct PIN. An incorrect entry will require
                restarting the transfer process from the beginning.
              </Text>
              <Pressable
                style={{
                  backgroundColor: color,
                  width: '95%',
                  alignSelf: 'center',
                  padding: 10,
                  borderRadius: 5,
                  alignItems: 'center',
                  marginTop: 10,
                }}
                onPress={() => verifyAdminAccessPin(item)}>
                {pinVerifyLoading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={{color: 'white', textAlign: 'center'}}>
                    Verify PIN to proceed with the admin access request
                  </Text>
                )}
              </Pressable>
            </View>
          </Pressable>
        </Modal>
        <Modal
          visible={networkAccessModal}
          transparent={true}
          animationType="slide">
          <Pressable
            style={{
              flex: 1,
              backgroundColor: 'rgba(0, 0,0, 0.5)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onPress={() => setNetworkAccessModal(false)}>
            <View
              style={{
                width: '90%',
                backgroundColor: 'black',
                padding: 15,
                borderRadius: 5,
              }}>
              <Text style={{textAlign: 'center', color: 'white'}}>
                PIN verified. Additional verification from the admin is required
                to proceed
              </Text>
              <Text style={{color: 'grey', textAlign: 'center', marginTop: 10}}>
                Share this pin with the admin
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  justifyContent: 'space-evenly',
                }}>
                <Text style={{color: 'white', textAlign: 'center', margin: 10}}>
                  {item.reVerificationPin}
                </Text>
                <Icon
                  color="grey"
                  size={20}
                  name="copy-outline"
                  onPress={() => copyToClipboard(item.reVerificationPin)}
                />
              </View>
            </View>
          </Pressable>
        </Modal>
        <Modal visible={errorModal} transparent={true} animationType="slide">
          <Pressable
            style={{
              flex: 1,
              backgroundColor: 'rgba(0, 0,0, 0.5)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onPress={() => setErrorModal(false)}>
            <View
              style={{
                width: '90%',
                backgroundColor: 'black',
                padding: 15,
                borderRadius: 5,
              }}>
              <Text style={{color: 'red', fontSize: 15, textAlign: 'center'}}>
                PIN incorrect. Please restart the transfer process.
              </Text>
            </View>
          </Pressable>
        </Modal>
      </View>
    );
  }

  return null;
}
