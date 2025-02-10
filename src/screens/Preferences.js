import React, {useState} from 'react';
import {View, Text, Pressable, Modal, ActivityIndicator} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import color from './color';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import {SharedElement} from 'react-navigation-shared-element';

const Preferences = ({navigation}) => {
  const [showModal, setShowModal] = React.useState(false);
  const [loading, setLoading] = useState(false);

  const deletePreferences = async () => {
    try {
      setLoading(true);
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
      setLoading(false);
      setShowModal(false)
      navigation.goBack()
    }
  };

  return (
    <View style={{backgroundColor: 'black', flex: 1}}>
      <View style={{flexDirection: 'row', padding: 10, alignItems: 'center'}}>
        <Icon
          name="chevron-back"
          size={28}
          color={color}
          onPress={() => navigation.goBack()}
        />
        <Text
          style={{
            color: 'white',
            fontWeight: 'bold',
            fontSize: 18,
            marginLeft: 10,
          }}>
          Preferences
        </Text>
      </View>
      <View>
        <Pressable
          style={{
            padding: 10,
            justifyContent: 'space-between',
            flexDirection: 'row',
            alignItems: 'center',
          }}
          onPress={() => navigation.navigate('ManagePreferences')}>
          <Text style={{color: 'white', fontSize: 17}}>Manage Preferences</Text>
          <Icon name="chevron-forward" size={20} color={'white'} />
        </Pressable>
        <Pressable
          style={{
            padding: 10,
            justifyContent: 'space-between',
            flexDirection: 'row',
            alignItems: 'center',
          }}
          onPress={() => setShowModal(true)}>
          <Text style={{color: 'white', fontSize: 17}}>Reset Preferences</Text>
          <Icon name="chevron-forward" size={20} color={'white'} />
        </Pressable>
      </View>
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
            <Text style={{color: 'white', textAlign: 'center', fontSize: 15}}>
              Are you sure you want to reset your preferences? Confirming will
              clear your current settings and apply new ones
            </Text>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-evenly',
                width: '100%',
                marginTop: 10,
              }}>
              <Pressable
                onPress={deletePreferences}
                disabled={loading}
                style={{
                  width: '48%',
                  backgroundColor: color,
                  padding: 10,
                  borderRadius: 5,
                  alignItems: 'center',
                }}>
                {loading ? (
                  <ActivityIndicator size={'small'} color={'white'} />
                ) : (
                  <Text style={{color: 'white'}}>Confirm Deletion</Text>
                )}
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
    </View>
  );
};

export default Preferences;
