import React, {useEffect, useState} from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  TextInput,
  ScrollView,
  Modal,
  Image,
  Platform,
  ActivityIndicator,
  Alert,
  PermissionsAndroid,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import {launchImageLibrary} from 'react-native-image-picker';
import auth from '@react-native-firebase/auth';
import {openSettings} from 'react-native-permissions';
import color from './color';
import {Switch} from './Switch';
import {SharedElement} from 'react-navigation-shared-element';

const {width} = Dimensions.get('window');
export default function NetworkExpand({navigation, route}) {
  const {
    network_name,
    network_id,
    network_type,
    joined,
    rules,
    bio,
    isAdminOnly,
    networkDetails,
  } = route.params;
  const [newRules, setNewRules] = useState(rules);
  const [isUpdating, setIsUpdating] = useState(false);
  const [networkBio, setNetworkBio] = useState(bio);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [greetingMessage, setGreetingMessage] = useState(
    networkDetails.greetMessage,
  );
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(isAdminOnly);
  const [networkData, setNetworkData] = useState([]);

  const [askPermission, setAskPermission] = useState(false);
  const [permissionStatement, setPermissionStatement] = useState('');

  const checkPermission = async permission => {
    try {
      const result = await PermissionsAndroid.check(permission);

      let permissionName;
      if (permission === PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES) {
        permissionName = 'Photo Access';
      } else if (
        permission === PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO
      ) {
        permissionName = 'Video Access';
      } else {
        permissionName = 'Unknown Permission';
      }

      if (result) {
        console.log(`${permissionName} is granted.`);
        return true;
      } else {
        console.log(`${permissionName} is not granted.`);

        if (Platform.OS === 'android') {
          setPermissionStatement(permissionName);
          setAskPermission(true);
        }
        return false;
      }
    } catch (error) {
      console.warn('Permission check error:', error);
      return false;
    }
  };
  useEffect(() => {
    const unsubscribe = firestore()
      .collection('Network')
      .doc(network_id)
      .onSnapshot(
        snapshot => {
          if (snapshot.exists) {
            const networkData = snapshot.data();
            if (networkData?.admin && auth()?.currentUser?.uid) {
              if (networkData.admin !== auth().currentUser.uid) {
                navigation.popToTop();
              } else {
                networkData.rules && setNewRules(networkData.rules);
                networkData.bio && setNetworkBio(networkData.bio);
                networkData.greetMessage &&
                  setGreetingMessage(networkData.greetMessage);
                setNetworkData(networkData);
              }
            }
          } else {
            console.warn('Network document does not exist.');
            navigation.popToTop();
          }
        },
        error => {
          console.error('Error listening for admin changes:', error);
        },
      );

    return () => {
      unsubscribe();
    };
  }, []);

  const toggleswitchAdmin = () => setIsAdmin(previousstate => !previousstate);

  const selectProfilePic = async () => {
    const granted = await checkPermission(
      PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
    );
    if (!granted) {
      return;
    }
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        maxWidth: 500,
        maxHeight: 500,
        quality: 1,
      });

      if (result.didCancel) {
        console.log('User cancelled image picker');
        return;
      }

      if (result.error) {
        console.error('ImagePicker Error: ', result.error);
        Alert.alert('Error', 'Failed to pick image');
        return;
      }

      const uri = result.assets[0].uri;
      setSelectedImage(uri);
    } catch (error) {
      console.error('Error selecting profile picture:', error);
      Alert.alert('Error', 'Failed to select profile picture');
    }
  };

  const updateNetworkDetails = async () => {
    Alert.alert('Update Started', 'Updating network details...');
    setIsUpdating(true);

    try {
      let profilePicUrl = null;

      if (selectedImage) {
        const filename = selectedImage.substring(
          selectedImage.lastIndexOf('/') + 1,
        );
        const uploadUri =
          Platform.OS === 'ios'
            ? selectedImage.replace('file://', '')
            : selectedImage;

        setLoading(true);

        const storageRef = storage().ref(`networkProfilePics/${filename}`);
        await storageRef.putFile(uploadUri);
        profilePicUrl = await storageRef.getDownloadURL();

        setLoading(false);
      }

      const updateData = {};
      if (newRules !== undefined) updateData.rules = newRules;
      if (networkBio !== undefined) updateData.bio = networkBio;
      if (isAdmin !== undefined) updateData.isAdminOnly = isAdmin;
      if (greetingMessage !== undefined)
        updateData.greetMessage = greetingMessage;
      if (profilePicUrl) updateData.profile_pic = profilePicUrl;

      // Perform Firestore update
      if (Object.keys(updateData).length === 0) {
        throw new Error('No valid fields to update');
      }

      await firestore()
        .collection('Network')
        .doc(network_id)
        .update(updateData);

      Alert.alert('Success', 'Network details updated successfully');
    } catch (error) {
      console.error('Error updating network details:', error);
      Alert.alert('Error', error.message || 'Failed to update network details');
    } finally {
      setIsUpdating(false);
    }
  };

  const deleteNetworkAndPosts = async networkId => {
    try {
      const postsRef = firestore()
        .collection('Network')
        .doc(networkId)
        .collection('Posts');
      const batch = firestore().batch();

      const snapshot = await postsRef.get();
      snapshot.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();

      await firestore().collection('Network').doc(networkId).delete();

      console.log(`Network ${networkId} and its posts deleted successfully.`);
    } catch (error) {
      console.error('Error deleting network and posts:', error);
    } finally {
      setShowDeleteModal(false);
      navigation.goBack();
    }
  };

  return (
    <ScrollView style={{backgroundColor: 'black', flex: 1}}>
      <View style={styles.header}>
        <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
          <Icon
            name="chevron-back"
            size={28}
            color={color}
            onPress={() => navigation.goBack()}
          />
          <Text style={styles.title}>{network_name}</Text>
        </View>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
          }}>
          <Icon
            name="cog"
            size={28}
            color={color}
            onPress={() =>
              navigation.navigate('NetworkAdvanced', {
                network_id: network_id,
                networkDetails: networkData,
              })
            }
          />
          <Icon
            name="person"
            size={28}
            color={color}
            onPress={() =>
              navigation.navigate('NetworkUsers', {
                network_name: network_name,
                network_id: network_id,
              })
            }
          />
        </View>
      </View>
      <View style={{backgroundColor: 'black'}}>
        <Text style={styles.title_command}>Network Name: </Text>
        <TextInput
          style={styles.textInput}
          value={network_name}
          editable={false}
        />
        <Text style={styles.title_command}>Network Type: </Text>
        <TextInput
          style={styles.textInput}
          value={network_type}
          editable={false}
        />
        <View style={styles.privatechannelcontainer}>
          <View style={{flexDirection: 'row', alignItems: 'center', justifyContent:'space-between', width: "100%"}}>
            <Text style={styles.privatechanneltext}>
              Admin-only post policy
            </Text>
            <Switch onPress={toggleswitchAdmin} value={isAdmin} />
          </View>
        </View>
        <Text style={styles.title_command}>Total people: </Text>
        <TextInput
          style={styles.textInput}
          value={String(joined)}
          editable={false}
        />
        <Text style={styles.title_command}>Bio: </Text>
        <TextInput
          style={styles.rule_input}
          value={networkBio}
          onChangeText={setNetworkBio}
          editable={!isUpdating}
          multiline={true}
          numberOfLines={4}
        />
        {networkDetails?.bots?.includes('PKGEuUczNm6Ebcp2fxVG') && (
          <>
            <Text style={styles.title_command}>Greeting Message: </Text>
            <TextInput
              style={styles.rule_input}
              value={greetingMessage}
              onChangeText={setGreetingMessage}
              editable={!isUpdating}
              multiline={true}
              numberOfLines={8}
            />
          </>
        )}
        {selectedImage && (
          <View style={styles.profilePicContainer}>
            <Image source={{uri: selectedImage}} style={styles.profilePic} />
          </View>
        )}
        <Pressable
          style={styles.updateButton}
          onPress={selectProfilePic}
          disabled={loading}>
          <Text style={styles.buttonText}>
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              'Change Network Picture'
            )}
          </Text>
        </Pressable>
      </View>
      {isAdmin !== isAdminOnly ||
      networkBio !== bio ||
      selectedImage ||
      (networkDetails?.bots?.includes('PKGEuUczNm6Ebcp2fxVG') &&
        greetingMessage !== networkDetails.greetMessage) ? (
        <Pressable
          style={styles.updateButton}
          onPress={updateNetworkDetails}
          disabled={isUpdating}>
          <Text style={styles.buttonText}>Update</Text>
        </Pressable>
      ) : (
        <Pressable style={styles.updateButtondis} disabled={true}>
          <Text style={styles.buttonText}>Update</Text>
        </Pressable>
      )}

      <Pressable
        style={styles.deleteButton}
        onPress={() => setShowDeleteModal(true)}>
        <Text style={styles.buttonText}>Delete Network</Text>
      </Pressable>
      <Modal
        animationType="slide"
        transparent={true}
        visible={showDeleteModal}
        onRequestClose={() => setShowDeleteModal(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirm Deletion</Text>
            <Text style={styles.modalText}>
              Are you sure you want to delete this network?
            </Text>
            <View style={styles.modalButtonsContainer}>
              <Pressable
                style={[styles.modalButton, {backgroundColor: 'gray'}]}
                onPress={() => setShowDeleteModal(false)}>
                <Text style={styles.modalButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, {backgroundColor: 'red'}]}
                onPress={() => deleteNetworkAndPosts(network_id)}>
                <Text style={styles.modalButtonText}>Delete</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
      <Modal
        transparent={true}
        visible={askPermission}
        animationType="slide"
        onRequestClose={() => setAskPermission(false)}>
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
            <Text
              style={{
                color: 'white',
                fontSize: 16,
                textAlign: 'center',
                marginTop: 10,
              }}>
              {permissionStatement} Permission
            </Text>
            <Text
              style={{
                color: 'white',
                fontSize: 16,
                textAlign: 'center',
                marginTop: 10,
              }}>
              The {permissionStatement} permission is required to access media
              files. Please enable it in the settings.
            </Text>
            <Pressable
              style={{
                backgroundColor: color,
                width: '90%',
                padding: 15,
                borderRadius: 5,
                alignItems: 'center',
                marginTop: 10,
              }}
              onPress={openSettings}>
              <Text style={{color: 'white'}}>Open Settings</Text>
            </Pressable>
            <Pressable
              style={{
                backgroundColor: '#1a1a1a',
                width: '90%',
                padding: 15,
                borderRadius: 5,
                alignItems: 'center',
                marginTop: 10,
              }}
              onPress={() => setAskPermission(false)}>
              <Text style={{color: 'white'}}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    width: width,
  },
  title: {
    fontSize: 24,
    color: 'white',
    textAlign: 'center',
  },
  title_command: {
    fontSize: 18,
    color: 'white',
    margin: 15,
  },
  textInput: {
    width: '90%',
    backgroundColor: '#1a1a1a',
    borderRadius: 5,
    fontSize: 17,
    color: color,
    letterSpacing: 1,
    paddingHorizontal: 10,
    marginBottom: 10,
    alignSelf: 'center',
  },
  updateButton: {
    width: '90%',
    backgroundColor: color,
    alignSelf: 'center',
    alignItems: 'center',
    margin: 10,
    padding: 10,
    borderRadius: 5,
  },
  updateButtondis: {
    width: '90%',
    backgroundColor: '#ccc',
    alignSelf: 'center',
    alignItems: 'center',
    margin: 10,
    padding: 10,
    borderRadius: 5,
  },
  deleteButton: {
    width: '90%',
    backgroundColor: 'red',
    alignSelf: 'center',
    alignItems: 'center',
    margin: 10,
    padding: 10,
    borderRadius: 5,
  },
  buttonText: {
    fontSize: 18,
    color: 'white',
  },
  rule_input: {
    width: '90%',
    backgroundColor: '#1a1a1a',
    borderRadius: 5,
    fontSize: 17,
    color: 'white',
    letterSpacing: 1,
    paddingHorizontal: 10,
    marginBottom: 10,
    alignSelf: 'center',
    textAlignVertical: 'top',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    padding: 10,
    borderRadius: 5,
    width: '45%',
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    color: 'white',
  },
  profilePicContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  profilePic: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  privatechannelcontainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    marginTop: 20,
    width: '90%',
    padding: 15,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 5,
    alignSelf: 'center',
  },
  privatechanneltext: {
    fontSize: 18,
    color: 'white',
    marginRight: 10,
    flexWrap: 'wrap',
  },
});
