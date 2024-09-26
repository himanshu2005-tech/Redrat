import React, { useState } from 'react';
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
  Switch
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import { launchImageLibrary } from 'react-native-image-picker'; 

export default function NetworkExpand({ navigation, route }) {
  const { network_name, network_id, network_type, joined, rules, bio, isAdminOnly } = route.params;
  const [newRules, setNewRules] = useState(rules);
  const [isUpdating, setIsUpdating] = useState(false);
  const [networkBio, setNetworkBio] = useState(bio);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null); 
  const [loading, setLoading] = useState(false); 
  const [isAdmin, setIsAdmin] = useState(isAdminOnly);

  const toggleswitchAdmin = () => setIsAdmin(previousstate => !previousstate);

  const selectProfilePic = async () => {
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
    setIsUpdating(true);
    try {
      let profilePicUrl = null;

      if (selectedImage) {
        const filename = selectedImage.substring(selectedImage.lastIndexOf('/') + 1);
        const uploadUri = Platform.OS === 'ios' ? selectedImage.replace('file://', '') : selectedImage;

        setLoading(true);
        await storage().ref(`networkProfilePics/${filename}`).putFile(uploadUri);
        profilePicUrl = await storage().ref(`networkProfilePics/${filename}`).getDownloadURL();
        setLoading(false);
      }

      const updateData = {
        rules: newRules,
        bio: networkBio,
        isAdminOnly: isAdmin,
      };

      if (profilePicUrl) {
        updateData.profile_pic = profilePicUrl;
      }

      await firestore().collection('Network').doc(network_id).update(updateData);
      Alert.alert('Success', 'Network details updated successfully');
    } catch (error) {
      console.error('Error updating network details:', error);
      Alert.alert('Error', 'Failed to update network details');
    } finally {
      setIsUpdating(false);
    }
  };

  const deleteNetworkAndPosts = async (networkId) => {
    try {
      const postsRef = firestore().collection('Network').doc(networkId).collection('Posts');
      const batch = firestore().batch();

      const snapshot = await postsRef.get();
      snapshot.forEach((doc) => {
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
    <ScrollView style={{ backgroundColor: 'black', flex: 1 }}>
      <View style={styles.header}>
        <Icon
          name="chevron-back"
          size={28}
          color="#FF3131"
          onPress={() => navigation.goBack()}
        />
        <Text style={styles.title}>{network_name}'s Network</Text>
        <Icon
        name="cog"
        size={28}
        color="#FF3131"
        onPress={() => navigation.navigate("NetworkAdvanced", {
          network_id: network_id
        })}
      />
        <Icon
        name="person"
        size={28}
        color="#FF3131"
        onPress={() => navigation.navigate("NetworkUsers", {
          network_name: network_name,
          network_id: network_id
        })}
      />
      </View>
      <View style={{ backgroundColor: 'black' }}>
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
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <Text style={styles.privatechanneltext}>
              Admin-only post policy
            </Text>
            <Switch
              trackColor={{false: '#767577', true: '#FF3131'}}
              thumbColor={isAdmin ? '#DC143C' : '#f4f3f4'}
              ios_backgroundColor="#3e3e3e"
              onValueChange={toggleswitchAdmin}
              value={isAdmin}
            />
          </View>
        </View>
        <Text style={styles.title_command}>Total people: </Text>
        <TextInput
          style={styles.textInput}
          value={String(joined)}
          editable={false}
        />
        <Text style={styles.title_command}>Rules: </Text>
        <TextInput
          style={styles.rule_input}
          value={newRules}
          onChangeText={setNewRules}
          editable={!isUpdating}
          multiline={true}
          numberOfLines={4}
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
        {selectedImage && (
          <View style={styles.profilePicContainer}>
            <Image source={{ uri: selectedImage }} style={styles.profilePic} />
          </View>
        )}
        <Pressable style={styles.updateButton} onPress={selectProfilePic} disabled={loading}>
          <Text style={styles.buttonText}>
            {loading ? <ActivityIndicator color="white" /> : 'Select Profile Picture'}
          </Text>
        </Pressable>
      </View>
      {isAdmin === isAdminOnly && rules === newRules && networkBio === bio && !selectedImage ? (
        <Pressable style={styles.updateButtondis} disabled={true}>
          <Text style={styles.buttonText}>Update</Text>
        </Pressable>
      ) : (
        <Pressable style={styles.updateButton} onPress={updateNetworkDetails} disabled={isUpdating}>
          <Text style={styles.buttonText}>Update</Text>
        </Pressable>
      )}

      <Pressable style={styles.deleteButton} onPress={() => setShowDeleteModal(true)}>
        <Text style={styles.buttonText}>Delete Network</Text>
      </Pressable>
      <Modal
        animationType="slide"
        transparent={true}
        visible={showDeleteModal}
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirm Deletion</Text>
            <Text style={styles.modalText}>
              Are you sure you want to delete this network?
            </Text>
            <View style={styles.modalButtonsContainer}>
              <Pressable
                style={[styles.modalButton, { backgroundColor: 'gray' }]}
                onPress={() => setShowDeleteModal(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, { backgroundColor: 'red' }]}
                onPress={() => deleteNetworkAndPosts(network_id)}
              >
                <Text style={styles.modalButtonText}>Delete</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    position: 'sticky',
    top: 0,
    zIndex: 100,
    backgroundColor: 'black',
    width: '100%',
    paddingVertical: 15,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 0.2,
    borderColor: '#ccc',
    gap: 20,
  },
  title: {
    flex: 1,
    fontSize: 24,
    color: 'white',
    marginLeft: 10,
    textAlign: 'center',
    letterSpacing: 1,
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
    color: '#FF3131',
    letterSpacing: 1,
    paddingHorizontal: 10,
    marginBottom: 10,
    alignSelf: 'center',
  },
  updateButton: {
    width: '90%',
    backgroundColor: '#FF3131',
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
    alignSelf: 'center'
  },
  privatechanneltext: {
    fontSize: 18,
    color: 'white',
    marginRight: 10,
    flexWrap: 'wrap',
  },
});
