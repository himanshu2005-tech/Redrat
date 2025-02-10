import React, {useState} from 'react';
import {
  Pressable,
  Text,
  View,
  TextInput,
  ActivityIndicator,
  Modal,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import color from './color';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

const CreateCustomFeed = ({navigation}) => {
  const [feedName, setFeedName] = useState('');
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);

  const createFeed = async () => {
    try {
      setLoading(true);

      const userDocRef = firestore()
        .collection('Users')
        .doc(auth().currentUser.uid)
        .collection('Feeds')
        .doc(feedName);

      const existingFeed = await userDocRef.get();

      if (existingFeed.exists) {
        setModalVisible(true);
        setFeedName('');
      } else {
        await userDocRef.set({
          feedName: feedName,
          created_at: firestore.FieldValue.serverTimestamp(),
        });
        setFeedName('');
        setSuccessModalVisible(true); 
      }
    } catch (error) {
      console.warn(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Icon
          name="chevron-back"
          size={28}
          color={color}
          onPress={() => navigation.goBack()}
        />
        <Text style={styles.headerText}>Create Custom Feed</Text>
      </View>

      <TextInput
        value={feedName}
        onChangeText={setFeedName}
        style={styles.input}
        placeholder="Enter your Feed Name"
        placeholderTextColor="grey"
      />

      {feedName && (
        <Pressable
          style={[styles.createButton, loading && styles.disabledButton]}
          disabled={loading}
          onPress={createFeed}>
          {loading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text style={styles.buttonText}>Create Feed</Text>
          )}
        </Pressable>
      )}

      <Modal
        transparent={true}
        animationType="fade"
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Feed Already Exists</Text>
            <Pressable
              style={styles.modalButton}
              onPress={() => setModalVisible(false)}>
              <Text style={styles.modalButtonText}>OK</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal
        transparent={true}
        animationType="fade"
        visible={successModalVisible}
        onRequestClose={() => setSuccessModalVisible(false)}>
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Feed Created Successfully</Text>
            <Text style={styles.modalText}>
              Your custom feed has been created! Now go to your target networks
              and add them from the rules modal.
            </Text>
            <Pressable
              style={styles.modalButton}
              onPress={() => {
                setSuccessModalVisible(false);
                navigation.goBack();
              }}>
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
    backgroundColor: 'black',
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    padding: 10,
    alignItems: 'center',
  },
  headerText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
    marginLeft: 10,
  },
  input: {
    backgroundColor: '#1a1a1a',
    width: '90%',
    alignSelf: 'center',
    borderRadius: 5,
    padding: 10,
    color: 'white',
    marginTop: 20,
  },
  createButton: {
    alignSelf: 'center',
    alignItems: 'center',
    width: '90%',
    backgroundColor: color,
    borderRadius: 5,
    padding: 10,
    marginTop: 10,
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '80%',
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 10,
  },
  modalText: {
    color: 'white',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButton: {
    backgroundColor: color,
    borderRadius: 5,
    padding: 10,
    alignItems: 'center',
    width: '80%',
    marginTop:10
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
  },
});

export default CreateCustomFeed;
