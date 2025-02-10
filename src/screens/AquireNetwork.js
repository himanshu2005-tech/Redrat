import React, {useState, useEffect} from 'react';
import {
  Text,
  TouchableOpacity,
  View,
  TextInput,
  StyleSheet,
  Pressable,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import color from './color';
import {SharedElement} from 'react-navigation-shared-element';

export default function AquireNetwork({route, navigation}) {
  const {network_id} = route.params;
  const [networkDetails, setNetworkDetails] = useState({});
  const [currentUserDetails, setCurrentUserDetails] = useState({});
  const [minAcquisitionValue, setMinAcquisitionValue] = useState(0);
  const [myEvaluation, setMyEvaluation] = useState('');
  const [currentBidder, setCurrentBidder] = useState(null);
  const [lastBidTime, setLastBidTime] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [showTakeAdmin, setShowTakeAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = firestore()
      .collection('Network')
      .doc(network_id)
      .onSnapshot(snapshot => {
        if (snapshot.exists) {
          const data = snapshot.data();
          setNetworkDetails(data);
          setMinAcquisitionValue(data.minAcquisitionValue || 0);
          setCurrentBidder(data.currentBidder);
          setLastBidTime(data.lastBidTime);
        }
      });
    return () => unsubscribe();
  }, [network_id]);

  useEffect(() => {
    const unsubscribe = firestore()
      .collection('Users')
      .doc(auth().currentUser.uid)
      .onSnapshot(snapshot => {
        if (snapshot.exists) setCurrentUserDetails(snapshot.data());
      });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (lastBidTime) {
      const timer = setInterval(() => {
        const currentTime = new Date().getTime();
        const lastBidTimestamp = lastBidTime.toDate().getTime();
        const timeDifference = currentTime - lastBidTimestamp;
        const oneMinuteInMilliseconds = 60 * 1000;
        const remainingTime = oneMinuteInMilliseconds - timeDifference;

        if (remainingTime <= 0) {
          if (currentBidder === auth().currentUser.uid) setShowTakeAdmin(true);
          clearInterval(timer);
          setTimeRemaining('Bid Closed');
        } else {
          const secondsRemaining = Math.floor(remainingTime / 1000);
          setTimeRemaining(`${secondsRemaining}s`);
        }
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [lastBidTime, currentBidder]);

  const totalEvaluation = Math.floor(
    parseFloat(minAcquisitionValue) + parseFloat(myEvaluation || 0),
  );
  const remainingPurse = Math.floor(
    (currentUserDetails.tribet || 0) - totalEvaluation,
  );

  const formatDigits = value => value.toString().split('');

  const isBidDisabled =
    totalEvaluation <= minAcquisitionValue || remainingPurse < 0;

    const handleBid = async () => {
      if (isBidDisabled) return;
    
      try {
        await firestore().runTransaction(async (transaction) => {
          const networkDocRef = firestore().collection('Network').doc(network_id);
          const networkDoc = await transaction.get(networkDocRef);
    
          if (!networkDoc.exists) {
            throw new Error('Network does not exist.');
          }
    
          const networkData = networkDoc.data();
    
          if (
            networkData?.currentBidder &&
            networkData.currentBidder !== auth().currentUser.uid
          ) {
            const previousBidderRef = firestore()
              .collection('Users')
              .doc(networkData.currentBidder);
    
            transaction.update(previousBidderRef, {
              tribet: firestore.FieldValue.increment(networkData.minAcquisitionValue),
              isBidding: false,
            });
          }
    
          transaction.update(networkDocRef, {
            currentBidder: auth().currentUser.uid,
            minAcquisitionValue: totalEvaluation,
            lastBidTime: firestore.FieldValue.serverTimestamp(),
          });
    
          const currentUserRef = firestore()
            .collection('Users')
            .doc(auth().currentUser.uid);
    
          transaction.update(currentUserRef, {
            tribet: currentUserDetails.tribet - totalEvaluation,
          });
        });
    
        navigation.goBack();
      } catch (error) {
        console.error('Failed to place bid:', error);
      }
    };
    

  const handleTakeAdmin = async () => {
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
      .update({
        isBidding: false,
      });
    await firestore().collection('Network').doc(network_id).update({
      admin: auth().currentUser.uid,
      isSetForAcquisition: false,
      minAcquisitionValue: null,
      currentBidder: null,
      lastBidTime: null,
      isHoldNetwork: false
    });
    setShowTakeAdmin(false);
    navigation.goBack();
  };

  if (
    timeRemaining === 'Bid Closed' &&
    networkDetails.currentBidder != auth().currentUser.uid
  ) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: 'black',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Text style={{color: 'grey', textAlign: 'center', fontSize: 18}}>
          The bidding process has concluded.
        </Text>
        <TouchableOpacity
          style={{
            backgroundColor: '#1a1a1a',
            width: '90%',
            alignItems: 'center',
            padding: 10,
            borderRadius: 5,
            marginTop: 10,
          }}
          onPress={() => navigation.goBack()}>
          <Text style={{color: 'white', fontSize: 15}}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Icon
          name="chevron-down"
          size={28}
          color={color}
          onPress={() => navigation.goBack()}
        />
        <Text style={styles.headerTitle}>Network Acquisition</Text>
      </View>
      <View>
        <Text style={styles.sectionTitle}>Current Bid</Text>
        <View style={styles.digitsContainer}>
          {formatDigits(minAcquisitionValue).map((digit, index) => (
            <View key={index} style={styles.digitBox}>
              <Text style={styles.digitText}>{digit}</Text>
            </View>
          ))}
        </View>
      </View>
      <Text style={styles.subTitle}>TRIBETS</Text>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Evaluation</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your valuation"
          placeholderTextColor="grey"
          keyboardType="numeric"
          value={myEvaluation}
          onChangeText={value => {
            if (!isNaN(value)) setMyEvaluation(value);
          }}
        />
      </View>
      <View style={{position: 'absolute', bottom: 0, width: '100%'}}>
        {showTakeAdmin ? (
          <TouchableOpacity
            style={{
              backgroundColor: color,
              width: '95%',
              alignSelf: 'center',
              padding: 10,
              margin: 10,
              alignItems: 'center',
            }}
            onPress={handleTakeAdmin}>
            <Text style={{color: 'white', fontSize: 15, fontWeight: 'bold'}}>
              Take Admin Role
            </Text>
          </TouchableOpacity>
        ) : currentBidder === auth().currentUser.uid ? (
          <View style={{width: '100%'}}>
            <TouchableOpacity
              style={{
                backgroundColor: '#777',
                width: '98%',
                alignSelf: 'center',
                padding: 10,
                margin: 10,
                alignItems: 'center',
              }}
              disabled={true}>
              <Text style={{color: 'white', fontSize: 15, textAlign: 'center'}}>
                You are the highest bidder.
              </Text>
            </TouchableOpacity>
            {timeRemaining && (
              <View>
                <Text
                  style={{color: 'white', textAlign: 'center', marginTop: 10}}>
                  {timeRemaining}
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View style={{bottom: 0}}>
            <View
              style={{
                width: '100%',
                flexDirection: 'row',
                justifyContent: 'space-between',
                padding: 10,
              }}>
              <Text style={{color: 'white', fontSize: 16}}>
                Purse after transaction:
              </Text>
              <Text style={{color: 'grey', fontSize: 16}}>
                {remainingPurse}
              </Text>
            </View>
            <Text style={{color: 'white', fontSize: 16, textAlign: 'center'}}>
              My Total Evaluation
            </Text>
            <View style={styles.digitsContainer}>
              {formatDigits(totalEvaluation).map((digit, index) => (
                <View key={index} style={styles.digitBox}>
                  <Text style={styles.digitText}>{digit}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity
              style={{
                backgroundColor:
                  isBidDisabled || timeRemaining === 'Bid Closed'
                    ? '#777'
                    : color,
                width: '90%',
                alignSelf: 'center',
                padding: 10,
                margin: 10,
                alignItems: 'center',
              }}
              disabled={isBidDisabled || timeRemaining === 'Bid Closed'}
              onPress={handleBid}>
              <Text style={{color: 'white', fontSize: 15, fontWeight: 'bold'}}>
                {timeRemaining === 'Bid Closed' ? 'Bidding Completed' : 'Bid'}
              </Text>
            </TouchableOpacity>
            {timeRemaining && (
              <View>
                <Text
                  style={{
                    color: 'white',
                    textAlign: 'center',
                    marginTop: 10,
                    fontSize: 20,
                    marginBottom: 20
                  }}>
                  {timeRemaining}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: 'black'},
  header: {flexDirection: 'row', padding: 10, alignItems: 'center'},
  headerTitle: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
    marginLeft: 10,
  },
  sectionTitle: {
    color: 'grey',
    fontSize: 25,
    textAlign: 'center',
    letterSpacing: 3,
  },
  digitsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 10,
    gap: 5,
  },
  digitBox: {
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 5,
    marginHorizontal: 2,
  },
  digitText: {color: 'white', fontSize: 30, textAlign: 'center'},
  subTitle: {
    color: 'white',
    textAlign: 'center',
    fontSize: 20,
    letterSpacing: 5,
    marginVertical: 10,
  },
  section: {marginVertical: 20},
  input: {
    color: 'white',
    fontSize: 18,
    backgroundColor: '#1a1a1a',
    padding: 10,
    borderRadius: 5,
    margin: 10,
  },
});
