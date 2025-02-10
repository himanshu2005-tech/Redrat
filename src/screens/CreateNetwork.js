import React, {useState} from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  Modal,
  Pressable,
  Alert,
  ScrollView,
  FlatList,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  Button,
  PermissionsAndroid
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import topics from './Topics';
import {Picker} from '@react-native-picker/picker';
import storage from '@react-native-firebase/storage';
import LottieView from 'lottie-react-native';
import {launchImageLibrary} from 'react-native-image-picker';
import {openSettings} from 'react-native-permissions';
import updateTribet from './updateTribet';
import color from './color';
import { Switch } from './Switch';
import {SharedElement} from 'react-navigation-shared-element';


export default function CreateNetwork({navigation}) {
  const [networkname, setnetworkname] = useState('');
  const [isprivate, setisprivate] = useState(false);
  const [panelName, setPanelName] = useState();
  const [modalvisible, setmodalvisible] = useState(false);
  const [code, setcode] = useState('');
  const [subTopics, setSubTopics] = useState([]);
  const [newSubTopic, setNewSubTopic] = useState('');
  const [bio, setBio] = useState('');
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [profilePic, setProfilePic] = useState(null);
  const [profilePicUri, setProfilePicUri] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [banner, setBanner] = useState();
  const [bannerUri, setBannerUri] = useState();
  const [rules, setRules] = useState([]);
  const [rule, setRule] = useState('');
  const [description, setDescription] = useState('');
  const [conditionsChecked, setConditionsChecked] = useState(false);
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

  const handleSubTopicChange = text => {
    setNewSubTopic(text);
  };

  const addRule = () => {
    if (rule.trim() && description.trim()) {
      setRules([...rules, {rule, description}]);
      setRule('');
      setDescription('');
    }
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

  const handleBioChange = text => {
    setBio(text);
  };

  const uploadProfilePic = async () => {
    if (profilePicUri) {
      const filename = profilePicUri.substring(
        profilePicUri.lastIndexOf('/') + 1,
      );
      const uploadUri = profilePicUri;
      const storageRef = storage().ref(`profile_pics/${filename}`);
      await storageRef.putFile(uploadUri);
      return await storageRef.getDownloadURL();
    }
    return null;
  };

  const uploadBannerPic = async () => {
    if (bannerUri) {
      const filename = bannerUri.substring(bannerUri.lastIndexOf('/') + 1);
      const uploadUri = bannerUri;
      const storageRef = storage().ref(`banner_pics/${filename}`);
      await storageRef.putFile(uploadUri);
      return await storageRef.getDownloadURL();
    }
    return null;
  };

  const selectProfilePic = async() => {
    const granted = await checkPermission(
      PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
    );
    if (!granted) {
      return;
    }
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

  const splitTopics = [
    topics.slice(0, Math.ceil(topics.length / 4)),
    topics.slice(Math.ceil(topics.length / 4), Math.ceil(topics.length / 2)),
    topics.slice(
      Math.ceil(topics.length / 2),
      Math.ceil((topics.length * 3) / 4),
    ),
    topics.slice(Math.ceil((topics.length * 3) / 4)),
  ];

  const renderTopic = item => (
    <View style={styles.topicRow}>
      <Pressable
        key={item}
        style={[
          styles.topicItem,
          selectedTopic?.includes(item) && styles.selectedTopicItem,
        ]}
        onPress={() => handleTopicSelect(item)}>
        <Text style={styles.topicText}>{item}</Text>
      </Pressable>
    </View>
  );

  const removeRule = index => {
    const updatedRules = [...rules];
    updatedRules.splice(index, 1);
    setRules(updatedRules);
  };

  const selectBanner = async() => {
    const granted = await checkPermission(
      PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
    );
    if (!granted) {
      return;
    }
    launchImageLibrary({mediaType: 'photo'}, response => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.error) {
        console.log('ImagePicker Error: ', response.error);
      } else {
        const {width, height, uri} = response.assets[0];
        if (width > height) {
          const source = {uri};
          setBanner(source);
          setBannerUri(uri);
        } else {
          console.log('Please select a horizontal (landscape) image.');
        }
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
      const bannerUrl = await uploadBannerPic();
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
          networkBackground: bannerUrl,
          panelName: panelName,
          createdBy: auth().currentUser.uid,
          createdEmail: auth().currentUser.email,
          isSetForAquisition: false
        });

      const newNetworkId = newNetworkRef.id;

      const rulesRef = newNetworkRef.collection('rules');

      for (let index = 0; index < rules.length; index++) {
        const rule = rules[index];

        await rulesRef.add({
          rule: rule.rule,
          description: rule.description,
          index: index + 1,
        });
      }
      await firestore()
        .collection('Users')
        .doc(userid)
        .update({
          createdNetworks: firestore.FieldValue.arrayUnion(newNetworkId),
        });
      await updateTribet(
        auth().currentUser.uid,
        -500,
        `Creation of ${networkname} network`,
      );
      setnetworkname('');
      setcode('');
      setRules('');
      setBio('');
      navigation.goBack();
      navigation.navigate('Network', {
        networkId: newNetworkId,
      });
    } catch (error) {
      console.error('Error creating network: ', error);
      Alert.alert('Error', 'Failed to create network. Please try again.');
    } finally {
      console.log('adding tribet');
      setSubmitLoading(false);
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
            color={color}
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
        <Text style={styles.name_title}>Name your Panel:</Text>
        <TextInput
          style={styles.name_input}
          placeholder="Enter your Panel Name"
          placeholderTextColor="grey"
          value={panelName}
          onChangeText={text => setPanelName(text)}
        />
        <View style={{backgroundColor: "#1a1a1a", padding: 15, borderRadius: 5, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
          <Text style={{color: 'white',fontSize: 17}}>{isprivate ? "Private" : "Public" } Network</Text>
          <Switch value={isprivate} onPress={() => setisprivate(!isprivate)} />
        </View>
        <Pressable onPress={selectProfilePic} style={styles.select_pic_button}>
          <Icon name="camera" size={28} color="white" />
        </Pressable>
        {profilePic && (
          <Image source={profilePic} style={styles.profile_pic_preview} />
        )}
        <Pressable onPress={selectBanner} style={styles.select_pic_button}>
          <Icon name="easel" size={28} color="white" />
        </Pressable>
        {banner && (
          <Image
            source={banner}
            style={styles.banner_preview}
            resizeMode="cover"
          />
        )}

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
          <View style={{flexDirection: 'row', alignItems: 'center', justifyContent:'space-between', width:"100%"}}>
            <Text style={styles.privatechanneltext}>
              Admin-only post policy
            </Text>
            <Switch value={isAdmin} onPress={toggleswitchAdmin} />
          </View>
        </View>

        {!isprivate ? (
          <>
            <Text style={{color: 'grey', margin: 10}}>
            Could you please clarify the underlying network or framework upon which this system is based?
            </Text>
            {splitTopics.map((topicArray, index) => (
              <ScrollView
                key={index}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollViewContent}>
                {topicArray.map(item => renderTopic(item))}
              </ScrollView>
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
                <Text style={{color: color, marginRight: 3}}>{topic}</Text>
                <Pressable onPress={() => removeSubTopic(index)}>
                  <Icon name="close-circle" size={20} color={color} />
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
              maxLength={20}
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
        {Array.isArray(rules) &&
          rules.map((item, index) => (
            <TouchableOpacity
              style={{backgroundColor: '#1a1a1a', borderRadius: 5, padding: 8}}
              key={index}
              onPress={() => removeRule(index)}>
              <View
                style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.2)',
                  padding: 5,
                  borderRadius: 5,
                  alignItems: 'center',
                }}>
                <Text style={{fontWeight: 'bold', color: 'white'}}>
                  {item.rule}
                </Text>
              </View>
              <View>
                <Text style={{color: 'white', padding: 10}}>{item.description}</Text>
              </View>
            </TouchableOpacity>
          ))}

        <TextInput
          placeholder="Rule"
          value={rule}
          style={styles.name_input}
          placeholderTextColor="grey"
          onChangeText={setRule}
        />
        <TextInput
          placeholder="Description"
          value={description}
          style={styles.rules_input}
          placeholderTextColor="grey"
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
        />
        <Pressable
          style={{
            backgroundColor: rule && description ? color : '#1a1a1a',
            alignItems: 'center',
            padding: 10,
            borderRadius: 10,
          }}
          onPress={addRule}
          disabled={!rule || !description}>
          <Icon name="add" size={20} color="white" />
        </Pressable>
      </View>
      <Pressable
        style={{
          flexDirection: 'row',
          justifyContent: 'space-around',
          alignItems: 'center',
          gap: 15,
          margin: 10,
        }}
        onPress={() => setConditionsChecked(!conditionsChecked)}>
        <Icon
          name={conditionsChecked ? 'checkbox' : 'square-outline'}
          size={24}
          color={color}
        />
        <Text style={{color: conditionsChecked ? 'white' : 'grey', flex: 1}}>
          I agree to keep the network safe and friendly by promptly reviewing
          reports and taking action, including removing posts or banning users
          who violate the rules.
        </Text>
      </Pressable>

      <Pressable
        style={{
          width: '90%',
          alignSelf: 'center',
          backgroundColor: color,
          padding: 10,
          borderRadius: 4,
          flexDirection: 'row',
          gap: 20,
          justifyContent: 'center',
          marginTop: 20,
          marginBottom: 50,
          opacity: conditionsChecked ? 1 : 0.5,
        }}
        onPress={onsubmit}
        disabled={!conditionsChecked}>
        {submitLoading ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <>
            <Text style={styles.submit_btn_text}>
              {conditionsChecked ? 'Create Network' : 'Accept above Conditions'}
            </Text>
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
                style={[styles.modalbutton, {backgroundColor: color}]}
                onPress={closemodal}>
                <Text style={styles.modalbuttontext}>Close</Text>
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
    position: 'sticky',
    top: 0,
    zIndex: 100,
    backgroundColor: 'black',
    padding: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  createNetworkAnimation: {
    height: 200,
    width: 200,
    alignSelf: 'center',
  },
  picker: {
    borderColor: color,
    borderWidth: 0.4,
  },
  title: {
    fontSize: 24,
    color: 'white',
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
    color: color,
    borderRadius: 5,
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
    borderRadius: 5,
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
    color: color,
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
    color: color,
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
    color: color,
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
    color: color,
    marginRight: 10,
  },
  add_subtopic_btn: {
    padding: 10,
    backgroundColor: color,
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
    color: color,
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
    backgroundColor: color,
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
    alignSelf: 'center',
  },
  banner_preview: {
    width: '100%',
    height: 50,
  },
  scrollViewContent: {
    flexDirection: 'row',
  },
  topicRow: {
    marginRight: 10,
  },
  topicItem: {
    backgroundColor: '#1a1a1a',
    borderRadius: 5,
    alignItems: 'center',
    paddingHorizontal: 15
  },
  selectedTopicItem: {
    backgroundColor: color,
  },
  topicText: {
    color: 'white',
    fontSize: 14,
    padding: 15,
  },
});
