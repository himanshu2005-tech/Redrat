import React, {useState, useEffect} from 'react';
import {
  Text,
  View,
  TextInput,
  Alert,
  TouchableOpacity,
  FlatList,
  Pressable,
  Modal,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import color from './color';
import {SharedElement} from 'react-navigation-shared-element';

export default function ReportAccount({route, navigation}) {
  const {reportedUserId} = route.params;
  const [selectedOption, setSelectedOption] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const reportOptions = [
    'Harassment or Bullying',
    'Hate Speech or Discrimination',
    'Impersonation or Identity Fraud',
    'Spam or Irrelevant Content',
    'Privacy Violation or Doxxing',
    'Explicit Nudity or Sexual Content',
    'Other',
  ];

  useEffect(() => {
    const checkIfReported = async () => {
      const reportsSnapshot = await firestore()
        .collection('ReportedUsers')
        .where('reported_user_id', '==', reportedUserId)
        .where('reporter_id', '==', auth().currentUser.uid)
        .get();

      if (!reportsSnapshot.empty) {
        Alert.alert('You have already reported this user.');
        setSubmitLoading(false);
      }
    };

    checkIfReported();
  }, [reportedUserId]);

  const handleReportUser = async () => {
    setSubmitLoading(true);
  
    if (!selectedOption) {
      Alert.alert('Error', 'Please select a reason for reporting.');
      setSubmitLoading(false);
      return;
    }
  
    const reportReason =
      selectedOption === 'Other' && customReason.trim()
        ? customReason
        : selectedOption;
  
    if (selectedOption === 'Other' && !customReason.trim()) {
      Alert.alert('Error', 'Please provide a reason for reporting.');
      setSubmitLoading(false);
      return;
    }
  
    try {
      const reportDoc = await firestore()
        .collection('ReportedUsers')
        .doc(reportedUserId)
        .get();
  
      const existingReport = reportDoc.exists
        ? reportDoc.data().reporter_id.includes(auth().currentUser.uid)
        : false;
  

      if (existingReport) {
        setSubmitLoading(false);
        setModalVisible(true);
        return;
      }
  
      const existingReasons = reportDoc.exists
        ? reportDoc.data().violation_reason || []
        : [];
  
      const reportData = {
        reported_user_id: reportedUserId,
        reporter_id: firestore.FieldValue.arrayUnion(auth().currentUser.uid),
        violation_reason: firestore.FieldValue.arrayUnion(reportReason),
        status: 'PENDING',
      };
  
      if (!reportDoc.exists) {
        reportData.first_report = firestore.FieldValue.serverTimestamp();
      }

      if (existingReasons.includes(reportReason)) {
        await firestore()
          .collection('ReportedUsers')
          .doc(reportedUserId)
          .update({
            reporter_id: firestore.FieldValue.arrayUnion(auth().currentUser.uid),
          });
      } else {
        await firestore()
          .collection('ReportedUsers')
          .doc(reportedUserId)
          .set(reportData, { merge: true });
      }
  
      const userRef = firestore().collection('Users').doc(reportedUserId);
      await userRef.update({
        report_count: firestore.FieldValue.increment(1),
      });
  
      setModalVisible(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to submit the report. Please try again.');
    } finally {
      setSubmitLoading(false);
    }
  };
  

  return (
    <View style={{flex: 1, backgroundColor: 'black'}}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          padding: 10,
        }}>
        <Icon
          name={'chevron-down'}
          size={25}
          color={color}
          onPress={() => navigation.goBack()}
        />
        <Text style={{color: 'white', fontSize: 20}}>Report User</Text>
      </View>
      <View style={{margin: 10, flex: 1}}>
        <Text
          style={{color: 'white', marginBottom: 5, fontSize: 18, padding: 5}}>
          Reason for Reporting
        </Text>
        <FlatList
          data={reportOptions}
          keyExtractor={(_, index) => index.toString()}
          numColumns={2}
          columnWrapperStyle={{justifyContent: 'space-between'}}
          renderItem={({item}) => (
            <TouchableOpacity
              onPress={() => setSelectedOption(item)}
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 10,
                marginHorizontal: 5,
                backgroundColor:
                  selectedOption === item ? color : '#1a1a1a',
                padding: 10,
                borderRadius: 5,
              }}>
              <Text style={{color: 'white', fontSize: 15}}>{item}</Text>
            </TouchableOpacity>
          )}
        />
        {selectedOption === 'Other' && (
          <TextInput
            style={{
              backgroundColor: '#1a1a1a',
              color: 'white',
              padding: 10,
              borderRadius: 5,
              marginTop: 10,
              textAlignVertical: 'top',
            }}
            multiline
            placeholder="Describe the issue..."
            placeholderTextColor="#666"
            value={customReason}
            numberOfLines={5}
            onChangeText={setCustomReason}
          />
        )}
      </View>
      <Pressable
        onPress={submitLoading ? null : handleReportUser}
        style={{
          margin: 10,
          padding: 15,
          backgroundColor: color,
          borderRadius: 5,
          alignItems: 'center',
          opacity: selectedOption ? 1 : 0.4,
        }}
        disabled={!selectedOption}>
        {submitLoading ? (
          <ActivityIndicator color="white" size="small" />
        ) : (
          <Text style={{color: 'white', fontSize: 16, fontWeight: 'bold'}}>
            Submit Report
          </Text>
        )}
      </Pressable>
      <Text style={{color: 'grey', textAlign: 'center', margin: 7}}>
        All reports are handled with complete confidentiality, ensuring the
        anonymity of the reporting party.
      </Text>

      <Modal
        transparent={true}
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}>
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
            <Icon name="checkmark-done" color={color} size={40} />
            <Text style={{fontSize: 18, fontWeight: 'bold', color: 'white'}}>
              Thanks for Reporting
            </Text>
            <TouchableOpacity
              onPress={() => {
                setModalVisible(false);
                navigation.goBack();
              }}
              style={{
                marginTop: 20,
                backgroundColor: color,
                padding: 10,
                borderRadius: 5,
                width: '90%',
                alignItems: 'center',
              }}>
              <Text style={{color: 'white'}}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}



