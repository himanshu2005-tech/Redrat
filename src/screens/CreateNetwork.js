import React, {useState} from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  Switch,
  Modal,
  Pressable,
  Alert,
  ScrollView,
  FlatList,
  Image,
  ActivityIndicator,
  TouchableOpacity
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import topics from './Topics';
import {Picker} from '@react-native-picker/picker';
import storage from '@react-native-firebase/storage';
import LottieView from 'lottie-react-native';
import {launchImageLibrary} from 'react-native-image-picker';

export default function CreateNetwork({navigation}) {
  const [networkname, setnetworkname] = useState('');
  const [isprivate, setisprivate] = useState(false);
  const [modalvisible, setmodalvisible] = useState(false);
  const [code, setcode] = useState('');
  const [rules, setRules] = useState('');
  const [subTopics, setSubTopics] = useState([]);
  const [newSubTopic, setNewSubTopic] = useState('');
  const [bio, setBio] = useState('');
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [profilePic, setProfilePic] = useState(null);
  const [profilePicUri, setProfilePicUri] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  const handleSubTopicChange = text => {
    setNewSubTopic(text);
  };

  const addSubTopic = () => {
    if (newSubTopic.trim() !== '') {
      setSubTopics([...subTopics, newSubTopic.trim()]);
      setNewSubTopic('');
    }
  };

  const removeSubTopic = index => {
    const updatedSubTopics = [...subTopics];
    updatedSubTopics.splice(index, 1);
    setSubTopics(updatedSubTopics);
  };

  const toggleswitch = () => setisprivate(previousstate => !previousstate);
  const toggleswitchAdmin = () => setIsAdmin(previousstate => !previousstate);

  const showmodal = () => setmodalvisible(true);

  const closemodal = () => setmodalvisible(false);

  const handleNetworkNameChange = text => {
    const processedText = text.replace(/\s+/g, '').toLowerCase();
    setnetworkname(processedText);
  };

  const handleRulesChange = text => {
    setRules(text);
  };

  const handleBioChange = text => {
    setBio(text);
  };

  const uploadProfilePic = async () => {
    if (profilePicUri) {
      const filename = profilePicUri.substring(profilePicUri.lastIndexOf('/') + 1);
      const uploadUri = profilePicUri;
      const storageRef = storage().ref(`profile_pics/${filename}`);
      await storageRef.putFile(uploadUri);
      return await storageRef.getDownloadURL();
    }
    return null;
  };

  const selectProfilePic = () => {
    launchImageLibrary({mediaType: 'photo'}, response => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.error) {
        console.log('ImagePicker Error: ', response.error);
      } else {
        const source = {uri: response.assets[0].uri};
        setProfilePic(source);
        setProfilePicUri(response.assets[0].uri);
      }
    });
  };


  const onsubmit = async () => {
    try {
      const userid = auth().currentUser.uid;

      const existingnetwork = await firestore()
        .collection('Network')
        .where('network_name', '==', networkname)
        .get();

      if (!existingnetwork.empty) {
        Alert.alert(
          'Error',
          'A network with this name already exists. Please choose a different name.',
        );
        return;
      }

      setSubmitLoading(true);
      const profilePicUrl = await uploadProfilePic();
      // Create the new network and get its ID
      const newNetworkRef = await firestore()
        .collection('Network')
        .add({
          network_name: networkname,
          network_type: isprivate ? 'private' : 'public',
          access_code: isprivate ? code : null,
          admin: userid,
          rules: rules,
          sub_topics: subTopics,
          bio: bio,
          topic: selectedTopic,
          joined: 0,
          isAdminOnly: isAdmin,
          profile_pic: profilePicUrl,
        });

      const newNetworkId = newNetworkRef.id;

      await firestore()
        .collection('Users')
        .doc(userid)
        .update({
          createdNetworks: firestore.FieldValue.arrayUnion(newNetworkId),
        });

      Alert.alert('Success', 'Network created successfully!');
      setnetworkname('');
      setcode('');
      setRules('');
      setBio('');
      navigation.goBack();
    } catch (error) {
      console.error('Error creating network: ', error);
      Alert.alert('Error', 'Failed to create network. Please try again.');
    } finally{
      setSubmitLoading(false)
    }
  };

  const handleTopicSelect = topic => {
    setSelectedTopic(topic);
  };

  return (
    <ScrollView
      style={{backgroundColor: 'black', height: '100%'}}
      stickyHeaderIndices={[0]}>
      <View style={styles.header}>
        <View style={styles.header}>
          <Icon
            name="chevron-back"
            size={28}
            color="#FF3131"
            onPress={() => navigation.goBack()}
          />
          <Text style={styles.title}>Create Your Network</Text>
        </View>
      </View>
      <View style={styles.content}>
        <Text style={styles.name_title}>Name of Your Network:</Text>
        <TextInput
          style={styles.name_input}
          placeholder="Enter Network Name"
          placeholderTextColor="grey"
          value={networkname}
          onChangeText={handleNetworkNameChange}
        />
        <Pressable onPress={selectProfilePic} style={styles.select_pic_button}>
          <Icon name="camera" size={28} color="white" />
          </Pressable>
          {profilePic && (
            <Image source={profilePic} style={styles.profile_pic_preview} />
          )}
        <View style={styles.privatechannelcontainer}>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <Text style={styles.privatechanneltext}>Private Channel:</Text>
            <Switch
              trackColor={{false: '#767577', true: '#FF3131'}}
              thumbColor={isprivate ? '#DC143C' : '#f4f3f4'}
              ios_backgroundColor="#3e3e3e"
              onValueChange={toggleswitch}
              value={isprivate}
            />
          </View>
          <Pressable onPress={showmodal}>
            <Icon name="information-circle-sharp" size={28} color="#FF3131" />
          </Pressable>
        </View>

        {isprivate && (
          <View style={styles.privatecodecontainer}>
            <Text style={styles.privatecodetext}>Enter Access Code:</Text>
            <TextInput
              style={styles.privatecodeinput}
              placeholder="Enter Code"
              placeholderTextColor="grey"
              value={code}
              onChangeText={setcode}
              secureTextEntry
              maxLength={8}
            />
          </View>
        )}
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

        {!isprivate ? (
          <>
          <Text style={{color: 'white', fontSize: 18, marginTop: 10}}>Select the topic of your network</Text>
          {topics.map((topic) => (
            <TouchableOpacity
              key={topic}
              onPress={() => setSelectedTopic(topic)}
              style={{
                padding: 10,
                backgroundColor: selectedTopic === topic ? '#FF3131' : '#1a1a1a',
                borderRadius: 5,
                marginVertical: 5,
              }}
            >
              <Text style={{ color: selectedTopic === topic ? '#fff' : '#FF3131' }}>
                {topic}
              </Text>
            </TouchableOpacity>
          ))}
          </>
        ) : (
          <View />
        )}

        <View style={styles.subtopics_container}>
          <Text style={styles.subtopics_title}>Sub Topics:</Text>
          <View style={styles.subtopics_list}>
            {subTopics.map((topic, index) => (
              <View key={index} style={styles.subtopic_item}>
                <Text style={{color: '#FF3131', marginRight: 3}}>{topic}</Text>
                <Pressable onPress={() => removeSubTopic(index)}>
                  <Icon name="close-circle" size={20} color="#FF3131" />
                </Pressable>
              </View>
            ))}
          </View>
          <View style={styles.subtopic_input_container}>
            <TextInput
              style={styles.subtopic_input}
              placeholder="Enter Sub Topic"
              placeholderTextColor="grey"
              value={newSubTopic}
              onChangeText={handleSubTopicChange}
              maxLength={10}
            />
            <Pressable onPress={addSubTopic}>
              <Text style={styles.add_subtopic_btn}>Add</Text>
            </Pressable>
          </View>
        </View>

        <Text style={styles.bio_title}>Network Bio:</Text>
        <TextInput
          style={styles.bio_input}
          placeholder="Enter network bio here..."
          placeholderTextColor="grey"
          value={bio}
          onChangeText={handleBioChange}
          multiline={true}
          numberOfLines={4}
        />

        <Text style={styles.rules_title}>Network Rules:</Text>
        <TextInput
          style={styles.rules_input}
          placeholder="Enter network rules here..."
          placeholderTextColor="grey"
          value={rules}
          onChangeText={handleRulesChange}
          multiline={true}
          numberOfLines={4}
        />
      </View>
      <Pressable style={styles.submit_btn} onPress={onsubmit}>
      {submitLoading ? (
            <ActivityIndicator size="small" color="white" />      
      ) : (
       <>
          <Text style={styles.submit_btn_text}>Create Network</Text>
        <Icon name="radio" size={28} color="white" />
        </>
      )}
      </Pressable>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalvisible}
        onRequestClose={closemodal}>
        <View style={styles.modalcontainer}>
          <View style={styles.modalcontent}>
            <Text style={styles.modaltitle}>Private Network Information</Text>
            <Text style={styles.modaltext}>
              A private network restricts access to authorized users only,
              ensuring confidentiality and security for sensitive information.
            </Text>
            <Text style={styles.modalsubtext}>
              If the network is private, please enter the access code to ensure
              only authorized users can join.
            </Text>
            <Text style={styles.modalsubtext}>
              Once configured as private, this setting remains fixed and cannot
              be altered.
            </Text>
            <View
              style={{
                borderBottomWidth: 0.2,
                borderColor: 'grey',
                padding: 10,
              }}>
              <Pressable
                style={[styles.modalbutton, {backgroundColor: '#FF3131'}]}
                onPress={closemodal}>
                <Text style={styles.modalbuttontext}>Close</Text>
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
    padding: 10,
    borderBottomWidth: 0.2,
    borderColor: 'grey',
    flexDirection: 'row',
    alignItems: 'center',
  },
  createNetworkAnimation: {
    height: 200,
    width: 200,
    alignSelf: 'center',
  },
  picker: {
    borderColor: '#FF3131',
    borderWidth: 0.4,
  },
  title: {
    fontSize: 24,
    color: '#FF3131',
    marginLeft: 10,
  },
  content: {
    padding: 20,
    gap: 10,
  },
  name_title: {
    fontSize: 18,
    color: 'white',
    marginBottom: 10,
  },
  name_input: {
    width: '100%',
    padding: 15,
    backgroundColor: '#1a1a1a',
    borderRadius: 2,
    fontSize: 17,
    color: '#FF3131',
    borderRadius: 5
  },
  privatechannelcontainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    marginTop: 20,
    width: '100%',
    padding: 15,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 5
  },
  privatechanneltext: {
    fontSize: 18,
    color: 'white',
    marginRight: 10,
    flexWrap: 'wrap',
  },
  privatecodecontainer: {
    marginTop: 20,
  },
  privatecodetext: {
    fontSize: 18,
    color: 'white',
    marginBottom: 10,
  },
  privatecodeinput: {
    width: '100%',
    padding: 15,
    backgroundColor: '#1a1a1a',
    borderRadius: 5,
    fontSize: 17,
    color: '#FF3131',
  },
  rules_title: {
    fontSize: 18,
    color: 'white',
    marginTop: 20,
    marginBottom: 10,
  },
  rules_input: {
    width: '100%',
    padding: 15,
    backgroundColor: '#1a1a1a',
    borderRadius: 5,
    fontSize: 17,
    color: '#FF3131',
    textAlignVertical: 'top',
    minHeight: 100,
  },
  modalcontainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalcontent: {
    backgroundColor: 'black',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    alignItems: 'center',
  },
  modaltitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#FF3131',
  },
  modaltext: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
    color: 'white',
  },
  modalsubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 10,
    color: 'white',
  },
  modalbutton: {
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
    width: '50%',
    alignItems: 'center',
  },
  modalbuttontext: {
    fontSize: 16,
    color: 'white',
  },
  submit_btn: {
    width: '90%',
    alignSelf: 'center',
    backgroundColor: '#FF3131',
    padding: 20,
    borderRadius: 4,
    flexDirection: 'row',
    gap: 20,
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 50,
  },
  submit_btn_text: {
    color: 'white',
    fontSize: 18,
    alignSelf: 'center',
  },
  subtopics_container: {
    marginTop: 20,
  },
  subtopics_title: {
    fontSize: 18,
    color: 'white',
    marginBottom: 10,
  },
  subtopics_list: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  subtopic_item: {
    backgroundColor: '#FFEDED',
    borderRadius: 20,
    padding: 10,
    marginRight: 10,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  subtopic_input_container: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  subtopic_input: {
    flex: 1,
    padding: 10,
    backgroundColor: '#1a1a1a',
    borderRadius: 5,
    fontSize: 17,
    borderWidth: 0.7,
    color: '#FF3131',
    marginRight: 10,
  },
  add_subtopic_btn: {
    padding: 10,
    backgroundColor: '#FF3131',
    borderRadius: 4,
    color: 'white',
  },
  bio_title: {
    fontSize: 18,
    color: 'white',
    marginTop: 20,
    marginBottom: 10,
  },
  bio_input: {
    width: '100%',
    padding: 15,
    backgroundColor: '#1a1a1a',
    borderRadius: 5,
    fontSize: 17,
    color: '#FF3131',
    textAlignVertical: 'top',
    minHeight: 100,
  },
  topic_button: {
    padding: 10,
    borderRadius: 4,
    marginHorizontal: 5,
  },
  topic_text: {
    fontSize: 15,
    color: 'white',
  },
  profile_pic_container: {
    alignItems: 'center',
    marginBottom: 20,
  },
  select_pic_button: {
    backgroundColor: '#FF3131',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
    alignItems: 'center',
    
  },
  select_pic_text: {
    color: 'white',
    fontWeight: 'bold',
  },
  profile_pic_preview: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignSelf: 'center'
  },
});
