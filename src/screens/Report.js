import React, {useState, useEffect} from 'react';
import {
  Text,
  View,
  TextInput,
  Alert,
  TouchableOpacity,
  FlatList,
  Pressable,
  Image,
  Modal,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import updateTribet from './updateTribet';
import color from './color';
import {SharedElement} from 'react-navigation-shared-element';

export default function Report({route, navigation}) {
  const {post_id, network_id, networkDetails, postData} = route.params;
  const [selectedOption, setSelectedOption] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [JoinedNetworks, setJoinedNetworks] = useState();

  const reportOptions = [
    'Violated Network Rules',
    'Self-Harm or Suicide Risk',
    'Harassment or Bullying',
    'Explicit Nudity or Sexual Content',
    'Graphic Violence or Gore',
    'Sale of Prohibited or Restricted Items',
    'Fraudulent Activity or Scams',
    'Misinformation or False Information',
    'Hate Speech or Discrimination',
    'Child Exploitation or Abuse',
    'Terrorism or Criminal Activity',
    'Intellectual Property Violation',
    'Impersonation or Identity Fraud',
    'Malicious Content or Malware',
    'Spam or Irrelevant Content',
    'Privacy Violation or Doxxing',
    'Unauthorized Advertising or Promotions',
    'Animal Cruelty or Abuse',
    'Other',
  ];

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const data = await firestore()
          .collection('Users')
          .doc(auth().currentUser.uid)
          .collection('JoinedNetworks')
          .get();

        const networks = data.docs.map(doc => doc.id);
        setJoinedNetworks(networks);
      } catch (error) {
        console.warn(error);
      }
    };
    fetchUserDetails();
  }, []);
  const handleReport = async () => {
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
      const isCommunityViolation = selectedOption === 'Violated Network Rules';
  
      const networkReportRef = firestore()
        .collection('Network')
        .doc(network_id)
        .collection('ReportedPosts')
        .doc(post_id);
  
      const globalReportRef = firestore().collection('Reports').doc(post_id);
  
      const reportData = {
        post_id,
        network_id,
        violation_reason: reportReason,
        reported_at: firestore.FieldValue.serverTimestamp(),
        posted_by: postData.posted_by,
        status: 'PENDING',
      };
  
      const userId = auth().currentUser.uid;
  
      const reportRef = isCommunityViolation ? networkReportRef : globalReportRef;
  
      const reportDoc = await reportRef.get();
  
      if (reportDoc.exists) {
        const data = reportDoc.data();
        const reportedUsers = data.reported_users || [];
  
        if (!reportedUsers.includes(userId)) {
          await reportRef.update({
            report_count: firestore.FieldValue.increment(1),
            reported_users: firestore.FieldValue.arrayUnion(userId),
          });
        }
      } else {
        await reportRef.set({
          ...reportData,
          report_count: 1,
          reported_users: [userId],
        });
      }
  
      setModalVisible(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to submit the report. Please try again.');
    } finally {
      setSubmitLoading(false);
    }
  };
  

  const leaveNetwork = async () => {
    try {
      setLoading(true);
      await firestore()
        .collection('Users')
        .doc(auth().currentUser.uid)
        .collection('JoinedNetworks')
        .doc(network_id)
        .delete();

      await firestore()
        .collection('Network')
        .doc(network_id)
        .collection('Members')
        .doc(auth().currentUser.uid)
        .delete();

      await updateTribet(
        auth().currentUser.uid,
        -15,
        `Abandoned ${networkDetails.network_name} network`,
      );
    } catch (error) {
      console.warn(error);
    } finally {
      setLoading(false);
      setModalVisible(false);
      navigation.goBack();
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
        <Text style={{color: 'white', fontSize: 20}}>Report Post</Text>
      </View>
      <View style={{margin: 10, flex: 1}}>
        <FlatList
          data={[
            {
              label: `Violated ${networkDetails.network_name} Rules`,
              isNetwork: true,
            },
            ...reportOptions
              .filter(option => option !== 'Violated Network Rules')
              .map(option => ({label: option, isNetwork: false})),
          ]}
          keyExtractor={(_, index) => index.toString()}
          numColumns={2}
          columnWrapperStyle={{justifyContent: 'space-between'}}
          ListHeaderComponent={() => (
            <TouchableOpacity
              onPress={() => setSelectedOption('Violated Network Rules')}
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 10,
                marginHorizontal: 5,
                backgroundColor:
                  selectedOption === 'Violated Network Rules'
                    ? color
                    : '#1a1a1a',
                padding: 10,
                borderRadius: 5,
              }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 15,
                  width: '90%',
                }}>
                <Image
                  source={{uri: networkDetails.profile_pic}}
                  style={{height: 40, width: 40, borderRadius: 50}}
                />
                <Text
                  style={{color: 'white', fontSize: 15, fontWeight: 'bold'}}>
                  Violated {networkDetails.network_name} rules
                </Text>
              </View>
            </TouchableOpacity>
          )}
          renderItem={({item, index}) =>
            index === 0 ? null : (
              <TouchableOpacity
                onPress={() => setSelectedOption(item.label)}
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: 10,
                  marginHorizontal: 5,
                  backgroundColor:
                    selectedOption === item.label ? color : '#1a1a1a',
                  padding: 10,
                  borderRadius: 5,
                }}>
                <Text style={{color: 'white', fontSize: 15}}>{item.label}</Text>
              </TouchableOpacity>
            )
          }
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
        onPress={submitLoading ? null : handleReport}
        style={{
          margin: 10,
          padding: 15,
          backgroundColor: color,
          borderRadius: 5,
          alignItems: 'center',
          opacity: selectedOption ? 1 : 0.4,
        }}
        disabled={selectedOption ? null : true}>
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
            {JoinedNetworks && JoinedNetworks.includes(network_id) && (
              <View
                style={{marginTop: 10, alignItems: 'center', width: '100%'}}>
                <Text
                  style={{color: 'white', fontSize: 16, textAlign: 'center'}}>
                  You are a member of this network. The report will be handled
                  accordingly.
                </Text>
                <Pressable
                  style={{
                    backgroundColor: '#1a1a1a',
                    width: '90%',
                    padding: 10,
                    borderRadius: 5,
                    alignItems: 'center',
                    marginTop: 10,
                  }}
                  onPress={loading ? null : leaveNetwork}>
                  {loading ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text style={{color: 'white'}}>Leave Network</Text>
                  )}
                </Pressable>
              </View>
            )}
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

