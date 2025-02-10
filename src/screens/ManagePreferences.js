import React, {useState} from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  Pressable,
  Modal,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import topics from './Topics';
import color from './color';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore'
import {SharedElement} from 'react-navigation-shared-element';

const ManagePreferences = ({navigation}) => {
  const [newPreferences, setNewPreferences] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [resetModal, setResetModal] = useState(false);
  const [updateModal, setUpdateModal] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);

  const deletePreferences = async () => {
    try {
      setResetLoading(true);
      const userId = auth().currentUser.uid;
      const preferencesCollection = firestore()
        .collection('Users')
        .doc(userId)
        .collection('Preferences');

      const snapshot = await preferencesCollection.get();

      const batch = firestore().batch();

      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      console.log('Preferences deleted successfully');
    } catch (error) {
      console.warn('Error deleting preferences:', error);
    } finally {
      setResetLoading(false);
      setShowModal(false);
      setResetModal(true);
    }
  };

  const updatePreferences = async () => {
    try {
      console.log(newPreferences)
      setUpdateLoading(true);
      const userId = auth().currentUser.uid;
      const userRef = firestore().collection('Users').doc(userId);
      const batch = firestore().batch();

      newPreferences.forEach(topic => {
        const preferenceRef = userRef.collection('Preferences').doc(topic);
        batch.set(preferenceRef, {score: firestore.FieldValue.increment(20)}, {merge: true});
      });

      await batch.commit();
    } catch (error) {
      console.error('Error updating preferences:', error);
    } finally {
      setResetModal(false)
      setShowModal(false)
      setUpdateLoading(false);
      setUpdateModal(true);
      setNewPreferences([])
    }
  };

  const togglePreference = item => {
    setNewPreferences(prev =>
      prev.includes(item)
        ? prev.filter(preference => preference !== item)
        : [...prev, item],
    );
  };

  return (
    <View style={{backgroundColor: 'black', flex: 1}}>
      <View
        style={{
          flexDirection: 'row',
          padding: 10,
          gap: 7,
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'space-between',
        }}>
        <View style={{flexDirection: 'row', gap: 10, alignItems: 'center'}}>
          <Icon
            name="chevron-back"
            size={28}
            color={color}
            onPress={() => navigation.goBack()}
          />
          <Text style={{color: 'white', fontWeight: 'bold', fontSize: 18}}>
            Manage Preferences
          </Text>
        </View>
        {newPreferences.length > 0 && (
          <Pressable
            style={{
              backgroundColor: color,
              padding: 5,
              alignItems: 'center',
              borderRadius: 2,
              paddingHorizontal: 10,
            }}
            onPress={() => setNewPreferences([])}>
            <Text style={{color: 'white'}}>Clear All</Text>
          </Pressable>
        )}
      </View>
      {topics.map((item, index) => (
        <TouchableOpacity
          key={index}
          onPress={() => togglePreference(item)}
          style={{
            padding: 10,
            backgroundColor: newPreferences.includes(item)
              ? '#1a1a1a'
              : 'black',
            marginVertical: 5,
          }}>
          <Text style={{color: 'white', fontSize: 15}}>{item}</Text>
        </TouchableOpacity>
      ))}
      <Pressable
        style={{
          width: '100%',
          position: 'absolute',
          bottom: 0,
          backgroundColor: newPreferences.length > 0 ? color : '#1a1a1a',
          alignItems: 'center',
          padding: 10,
        }}
        onPress={() => setShowModal(true)}>
        <Text style={{color: 'white', fontSize: 16}}>
          {' '}
          {newPreferences.length === 1
            ? 'Update Preference'
            : 'Update Preferences'}
        </Text>
      </Pressable>
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
            <Text style={{color: 'white', textAlign: 'center', fontSize: 17}}>
              Do you want to reset your previous preferences?
            </Text>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-evenly',
                width: '100%',
                marginTop: 10,
              }}>
              <Pressable
                disabled={resetLoading}
                onPress={deletePreferences}
                style={{
                  width: '48%',
                  backgroundColor: color,
                  padding: 10,
                  borderRadius: 5,
                  alignItems: 'center',
                }}>
                {resetLoading ? (
                  <ActivityIndicator size={'small'} color={'white'} />
                ) : (
                  <Text style={{color: 'white'}}>Reset Prefrences</Text>
                )}
              </Pressable>
              <Pressable
                disabled={updateLoading}
                style={{
                  width: '48%',
                  backgroundColor: '#1a1a1a',
                  padding: 10,
                  borderRadius: 5,
                  alignItems: 'center',
                }}
                onPress={updatePreferences}>
                {updateLoading ? (
                  <ActivityIndicator size={'small'} color={'white'} />
                ) : (
                  <Text style={{color: 'white'}}>Update Preferences</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
      <Modal
        transparent={true}
        visible={resetModal}
        animationType="slide"
        onRequestClose={() => setResetModal(false)}>
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
            <Text style={{color: 'white', textAlign: 'center', fontSize: 17}}>
              Your Preferences have been reset successfully
            </Text>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-evenly',
                width: '100%',
                marginTop: 10,
              }}>
              <Pressable
                disabled={updateLoading}
                style={{
                  width: '100%',
                  backgroundColor: '#1a1a1a',
                  padding: 10,
                  borderRadius: 5,
                  alignItems: 'center',
                }}
                onPress={updatePreferences}>
                {updateLoading ? (
                  <ActivityIndicator size={'small'} color={'white'} />
                ) : (
                  <Text style={{color: 'white'}}>Update Preferences</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
      <Modal
        transparent={true}
        visible={updateModal}
        animationType="slide"
        onRequestClose={() => setUpdateModal(false)}>
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
            <Text style={{color: 'white', textAlign: 'center', fontSize: 17}}>
              Your Preferences have been updated
            </Text>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-evenly',
                width: '100%',
                marginTop: 10,
              }}>
              <Pressable
                onPress={() => {
                  setUpdateModal(false)
                  navigation.goBack()
                }}
                style={{
                  width: '100%',
                  backgroundColor: color,
                  padding: 10,
                  borderRadius: 5,
                  alignItems: 'center',
                }}>
                <Text style={{color: 'white'}}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default ManagePreferences;
