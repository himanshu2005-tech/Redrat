import React, {useEffect, useState} from 'react';
import {
  Text,
  View,
  TextInput,
  Animated,
  Easing,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {Switch} from './Switch';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import color from './color';
import {SharedElement} from 'react-navigation-shared-element';

export default function NetworkAcquisition({route, navigation}) {
  const {network_id} = route.params;

  const [networkDetails, setNetworkDetails] = useState({});
  const [isSetForAcquisition, setIsSetForAcquisition] = useState(false);
  const [minAcquisitionValue, setMinAcquisitionValue] = useState('0');
  const [inputActive, setInputActive] = useState(false);
  const [animationHeight] = useState(new Animated.Value(0));
  const [acquisitionLoading, setAcquisitionLoading] = useState(false);
  const [initialMinAcquisitionValue, setInitialMinAcquisitionValue] =
    useState('');
  const [transferLoading, setTransferLoading] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState('');
  const [showTakeAdmin, setShowTakeAdmin] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const unsubscribe = firestore()
      .collection('Network')
      .doc(network_id)
      .onSnapshot(
        snapshot => {
          if (snapshot.exists) {
            const data = snapshot.data();
            setNetworkDetails(data);
            setIsSetForAcquisition(data.isSetForAcquisition || false);

            const acquisitionValue = data.minAcquisitionValue || '0';
            setMinAcquisitionValue(acquisitionValue);
            setInitialMinAcquisitionValue(acquisitionValue);

            if (data.lastBidTime) {
              const timer = setInterval(() => {
                const currentTime = Date.now();
                const lastBidTimestamp = data.lastBidTime.toDate().getTime();
                const timeDifference = currentTime - lastBidTimestamp;
                const oneMinuteInMilliseconds = 60 * 1000;
                const remainingTime = oneMinuteInMilliseconds - timeDifference;

                if (remainingTime <= 0) {
                  if (data.admin === auth().currentUser.uid) {
                    setShowTakeAdmin(true);
                  }
                  clearInterval(timer);
                  setTimeRemaining('Bid closed.');
                } else {
                  const secondsRemaining = Math.floor(remainingTime / 1000);
                  setTimeRemaining(`${secondsRemaining}s`);
                }
              }, 1000);

              return () => clearInterval(timer);
            }
          }
        },
        error => console.warn('Error fetching network details:', error),
      );

    return unsubscribe;
  }, [network_id]);

  const toggleAcquisition = () => {
    if (
      networkDetails.currentBidder != null ||
      networkDetails.isSetForAcquisition
    ) {
      return;
    }
    setModalVisible(true);
  };

  const confirmAcquisition = async () => {
    try {
      setIsSetForAcquisition(true);
      await firestore()
        .collection('Network')
        .doc(network_id)
        .update({isSetForAcquisition: true});
      setModalVisible(false);
    } catch (error) {
      console.warn('Error updating acquisition state:', error);
    }
  };

  const updateMinAcquisitionValue = async () => {
    try {
      setAcquisitionLoading(true);
      await firestore()
        .collection('Network')
        .doc(network_id)
        .update({minAcquisitionValue});
    } catch (error) {
      console.warn('Error updating minimum acquisition value:', error);
    } finally {
      setAcquisitionLoading(false);
      navigation.goBack()
      navigation.goBack()
    }
  };

  const handleInputFocus = () => {
    setInputActive(true);
    Animated.timing(animationHeight, {
      toValue: 50,
      duration: 300,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  };

  const handleInputBlur = () => {
    setInputActive(false);
    Animated.timing(animationHeight, {
      toValue: 0,
      duration: 300,
      easing: Easing.in(Easing.quad),
      useNativeDriver: false,
    }).start();
  };

  const transferAdmin = async () => {
    try {
      setTransferLoading(true);
      await firestore()
        .collection('Users')
        .doc(networkDetails.admin)
        .update({
          tribet: firestore.FieldValue.increment(
            networkDetails.minAcquisitionValue,
          ),
        });
      await firestore()
        .collection('Users')
        .doc(networkDetails.currentBidder)
        .update({isBidding: false});
      await firestore().collection('Network').doc(network_id).update({
        admin: networkDetails.currentBidder,
        isSetForAcquisition: false,
        minAcquisitionValue: null,
        currentBidder: null,
        lastBidTime: null,
        isHoldNetwork: false,
      });
      navigation.popToTop();
    } catch (error) {
      console.warn('Error transferring admin:', error);
    } finally {
      setTransferLoading(false);
    }
  };

  const isDisabled =
    !(minAcquisitionValue && parseFloat(minAcquisitionValue) > 0) ||
    minAcquisitionValue === initialMinAcquisitionValue;

  const isInputDisabled = initialMinAcquisitionValue !== '0';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Icon
          name="chevron-back"
          size={28}
          color={color}
          onPress={() => navigation.goBack()}
        />
        <Text style={styles.headerText}>Network Acquisition</Text>
      </View>

      <View style={styles.switchContainer}>
        <View>
          <Text style={styles.switchLabel}>Set for Acquisition</Text>
          <Text style={styles.switchStatus}>
            {isSetForAcquisition
              ? 'Open for Acquisition'
              : 'Close for Acquisition'}
          </Text>
        </View>
        <Switch value={isSetForAcquisition} onPress={toggleAcquisition} />
      </View>

      {isSetForAcquisition && (
        <View style={styles.inputContainer}>
          {!networkDetails.minAcquisitionValue && (
            <Text style={styles.instruction}>
              Please set a minimum value for purchasing this network.
            </Text>
          )}
          {networkDetails.minAcquisitionValue != null ? (
            <View
              style={{
                backgroundColor: '#1a1a1a',
                width: '80%',
                alignSelf: 'center',
                alignItems: 'center',
                padding: 10,
                borderRadius: 5,
                marginTop: 10,
                gap: 15,
              }}>
              <View
                style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  width: '100%',
                  alignItems: 'center',
                  padding: 5,
                  borderRadius: 5,
                }}>
                <Text style={{color: 'grey'}}>
                  Present value of {networkDetails.network_name}
                </Text>
              </View>
              <Text style={{color: 'white'}}>
                {networkDetails.minAcquisitionValue}
              </Text>
            </View>
          ) : (
            <TextInput
              style={[
                styles.input,
                {borderColor: inputActive ? 'grey' : '#1a1a1a'},
              ]}
              keyboardType="numeric"
              value={networkDetails.minAcquisitionValue}
              onChangeText={setMinAcquisitionValue}
              placeholder="Enter minimum value"
              placeholderTextColor="grey"
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              editable={!isInputDisabled}
            />
          )}
          <Animated.View
            style={[styles.expandingArea, {height: animationHeight}]}>
            <Text style={styles.expandingText}>TRIBETS</Text>
          </Animated.View>
        </View>
      )}

      <Pressable
        style={[styles.actionButton, {opacity: isDisabled ? 0.5 : 1}]}
        onPress={updateMinAcquisitionValue}
        disabled={isDisabled}>
        {acquisitionLoading ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <Text style={styles.actionButtonText}>Set Acquisition Rate</Text>
        )}
      </Pressable>

      {timeRemaining && (
        <View
          style={{
            backgroundColor: '#1a1a1a',
            alignItems: 'center',
            padding: 10,
          }}>
          {timeRemaining === 'Bid closed.' ? (
            <Text style={styles.timerText}>Bid has been concluded</Text>
          ) : (
            <Text style={styles.timerText}>{timeRemaining}</Text>
          )}
        </View>
      )}

      {showTakeAdmin && (
        <Pressable style={styles.actionButton} onPress={transferAdmin}>
          {transferLoading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.actionButtonText}>
              Acquire a minimum of {minAcquisitionValue} tribets and initiate
              the transfer of administrative rights.
            </Text>
          )}
        </Pressable>
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalText}>
              Upon confirmation, you will retain administrative rights until the
              acquisition process is completed.
            </Text>
            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalButton, {backgroundColor: color}]}
                onPress={confirmAcquisition}>
                <Text style={styles.modalButtonText}>Confirm</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, {backgroundColor: '#1a1a1a'}]}
                onPress={() => setModalVisible(false)}>
                <Text style={styles.modalButtonText}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  header: {
    flexDirection: 'row',
    padding: 10,
    gap: 7,
    alignItems: 'center',
  },
  headerText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    margin: 10,
  },
  switchLabel: {
    color: 'white',
    fontWeight: 'bold',
  },
  switchStatus: {
    color: 'grey',
    fontSize: 12,
  },
  inputContainer: {
    margin: 10,
  },
  instruction: {
    color: 'white',
    marginBottom: 5,
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderRadius: 5,
    color: 'white',
    paddingHorizontal: 10,
    backgroundColor: '#1a1a1a',
  },
  expandingArea: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandingText: {
    color: 'white',
    fontSize: 20,
    letterSpacing: 2,
  },
  actionButton: {
    backgroundColor: color,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 0,
    width: '100%',
  },
  actionButtonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 15,
  },
  timerText: {
    textAlign: 'center',
    color: 'white',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'black',
    borderRadius: 5,
    padding: 20,
    width: '80%',
    alignItems: 'center',
  },
  modalText: {
    color: 'white',
    textAlign: 'center',
    marginBottom: 10,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  modalButton: {
    padding: 10,
    borderRadius: 5,
    marginHorizontal: 10,
    width: '48%',
    alignItems: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
