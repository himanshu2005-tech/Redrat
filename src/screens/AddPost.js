import React, {useState, useEffect} from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  TextInput,
  FlatList,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  PermissionsAndroid,
  Modal,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import storage from '@react-native-firebase/storage';
import ImagePicker from 'react-native-image-crop-picker';
import Video from 'react-native-video';
import LinearGradient from 'react-native-linear-gradient';
import moment from 'moment';
import {checkMaliciousLinks} from './checkMaliciousLinks';
import updateTribet from './updateTribet';
import {splitString} from '../texting/textSplit';
import {openSettings} from 'react-native-permissions';
import {Switch} from './Switch';
import {useSharedValue} from 'react-native-reanimated';
import color from './color';
import sendNotificationViaId from '../../sendNotificationViaId';
import {SharedElement} from 'react-navigation-shared-element';

export default function AddPost({route, navigation}) {
  const {network_id, network_name, networkDetails} = route.params;
  const [subtopics, setSubtopics] = useState(networkDetails.sub_topics);
  const [selectedSubtopics, setSelectedSubtopics] = useState([]);
  const [title, setTitle] = useState('');
  const [information, setInformation] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [images, setImages] = useState([]);
  const [video, setVideo] = useState(null);
  const [links, setLinks] = useState(['']);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedHashes, setSelectedHashes] = useState([]);
  const [targetWord, setTargetWord] = useState('');
  const [targetReply, setTargetReply] = useState('');
  const [takeResponse, setTakeResponse] = useState(false);
  const [isPoll, setIsPoll] = useState(false);
  const [pollName, setPollName] = useState('');
  const [showSensitive, setShowSensitive] = useState(false);
  const isSensitive = useSharedValue(0);
  const isPollTake = useSharedValue(0);
  const isResponse = useSharedValue(0);
  const [sensitivePost, setSensitivePost] = useState(false);
  const [polls, setPolls] = useState([]);
  const [errors, setErrors] = useState({
    title: '',
    information: '',
    subtopics: '',
  });
  const [askPermission, setAskPermission] = useState(false);
  const [permissionStatement, setPermissionStatement] = useState('');
  const [typingAt, setTypingAt] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const validateUrl = url => {
    const regex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/;
    return regex.test(url);
  };
  const [validLinks, setValidLinks] = useState(
    links.map(link => validateUrl(link)),
  );

  const handleEndEditing = (val, index) => {
    const isValid = validateUrl(val);
    const newValidLinks = [...validLinks];
    newValidLinks[index] = isValid;
    setValidLinks(newValidLinks);
    updateLink(val, index);
  };

  useEffect(() => {
    isSensitive.value = sensitivePost ? 1 : 0;
    isPollTake.value = isPoll ? 1 : 0;
    isResponse.value = takeResponse ? 1 : 0;

    console.log(isSensitive);
    console.log(sensitivePost);
  }, [sensitivePost, isPoll, takeResponse]);

  const toggleSwitch = (sharedValue, setter, state) => {
    const newState = sharedValue.value === 1 ? 0 : 1;
    sharedValue.value = newState;
    setter(newState === 1);
    console.log(state, newState);
  };

  const toggleswitch = () => setIsPoll(previousstate => !previousstate);
  const toggleswitch1 = () => setTakeResponse(previousstate => !previousstate);

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

  const handleSubmitPoll = () => {
    setPolls([...polls, pollName]);
    setPollName('');
  };

  const handleRemovePoll = index => {
    const newPolls = polls.filter((_, pollIndex) => pollIndex !== index);
    setPolls(newPolls);
  };

  const toggleSubtopicSelection = subtopic => {
    if (selectedSubtopics.includes(subtopic)) {
      setSelectedSubtopics(selectedSubtopics.filter(item => item !== subtopic));
    } else {
      setSelectedSubtopics([...selectedSubtopics, subtopic]);
    }
  };

  const selectImages = async () => {
    const granted = await checkPermission(
      PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
    );
    if (!granted) {
      return;
    }
    if (!video) {
      try {
        const media = await ImagePicker.openPicker({
          multiple: true,
          mediaType: 'photo',
        });

        setImages([...images, ...media]);
      } catch (error) {
        console.error('Error picking images:', error);
      }
    }
  };

  const selectVideo = async () => {
    const granted = await checkPermission(
      PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO,
    );
    if (!granted) {
      return;
    }
    if (images.length === 0) {
      try {
        const media = await ImagePicker.openPicker({
          mediaType: 'video',
        });

        setVideo(media);
      } catch (error) {
        console.error('Error picking video:', error);
      }
    }
  };

  const notificationPackageSender = async subtopics => {
    try {
      const notificationTargetTokens = await firestore()
        .collection('Network')
        .doc(network_id)
        .collection('Subscriptions')
        .where('topics', 'array-contains-any', subtopics)
        .get();

      const tokens = notificationTargetTokens.docs.map(doc => doc.id);

      tokens.forEach(token => {
        sendNotificationViaId(
          networkDetails.network_name,
          token,
          title,
          auth().currentUser.uid,
          'SUBSCRIPTION',
        );
      });
    } catch (error) {
      console.warn('Error fetching tokens:', error);
    }
  };

  const addMentions = async (selectedUsers, network_id, post_id) => {
    const promises = selectedUsers.map(async item => {
      await firestore()
        .collection('Users')
        .doc(item.id)
        .collection('Mentions')
        .add({
          post_id: post_id,
          createdAt: firestore.FieldValue.serverTimestamp(),
        });
    });

    await Promise.all(promises);
  };

  const isValidUrl = url => {
    const pattern = new RegExp(
      '^(https?:\\/\\/)?' +
        '((([a-z0-9](?!-)[a-z0-9-]{0,61}[a-z0-9])\\.)+[a-z]{2,6}|localhost|' +
        '((\\d{1,3}\\.){3}\\d{1,3})|\\[([0-9a-f]{1,4}:){7}[0-9a-f]{1,4}\\])' +
        '(\\:\\d+)?(\\/[-a-z0-9%_.~+]*)*' +
        '(\\?[;&a-z0-9%_.~+=-]*)?' +
        '(\\#[-a-z0-9_]*)?$',
      'i',
    );
    return pattern.test(url);
  };

  const extractLinks = text => {
    const urlPattern = /https?:\/\/[^\s]+/g;
    return text.match(urlPattern) || [];
  };

  const savePost = async () => {
    if (!title.trim()) {
      setErrors({...errors, title: 'Title is required'});
      return;
    }

    if (!information.trim()) {
      setErrors({...errors, information: 'Information is required'});
      return;
    }

    setShowSensitive(false);
    if (selectedSubtopics.length === 0) {
      setErrors({
        ...errors,
        subtopics: 'At least one subtopic must be selected',
      });
      return;
    }

    setSaving(true);
    try {
      const imageUrls = [];
      let videoUrl = '';

      for (const image of images) {
        const imageRef = storage().ref(
          `posts/${auth().currentUser.uid}/${Date.now()}`,
        );
        await imageRef.putFile(image.path);
        const imageUrl = await imageRef.getDownloadURL();
        imageUrls.push(imageUrl);
      }

      if (video) {
        const videoRef = storage().ref(
          `posts/${auth().currentUser.uid}/${Date.now()}`,
        );
        await videoRef.putFile(video.path);
        videoUrl = await videoRef.getDownloadURL();
      }

      const linksFromTitle = extractLinks(title);
      const linksFromInformation = extractLinks(information);
      const validLinks = [
        ...new Set([...linksFromTitle, ...linksFromInformation, ...links]),
      ].filter(link => isValidUrl(link));

      const networkDoc = await firestore()
        .collection('Network')
        .doc(network_id)
        .get();
      const networkData = networkDoc.data();

      if (
        networkData &&
        networkData.bots &&
        networkData.bots.includes('Zry26BdUtmPYjyuHGuId')
      ) {
        const maliciousLinks = await checkMaliciousLinks(validLinks);
        if (maliciousLinks.length > 0) {
          const maliciousUrls = maliciousLinks
            .map(match => match.threat.url)
            .join(', ');
          setErrors({
            ...errors,
            links: 'One or more links are malicious: ' + maliciousUrls,
          });
          Alert.alert('Malicious links found', 'Banning User...');
          return;
        }
      }

      if (
        networkData &&
        networkData.bots &&
        networkData.bots.includes('0Z80gwQBSHvKfphFevbc')
      ) {
        console.log('entering');
        const botData = await firestore()
          .collection('Bots')
          .doc('0Z80gwQBSHvKfphFevbc')
          .get();
        const data = botData.data();
        const predefinedData = data.predefinedData;

        let toxicWordsFound = [];

        const findToxicWords = text => {
          return predefinedData.filter(word => {
            const regex = new RegExp(`\\b${word}\\b`, 'i');
            return regex.test(text);
          });
        };

        if (title) {
          toxicWordsFound = toxicWordsFound.concat(findToxicWords(title));
        }
        if (information) {
          toxicWordsFound = toxicWordsFound.concat(findToxicWords(information));
        }

        if (toxicWordsFound.length > 0) {
          const uniqueToxicWords = [...new Set(toxicWordsFound)];
          const message = `Your submission contains inappropriate language: ${uniqueToxicWords.join(
            ', ',
          )}. Please keep the conversation respectful.`;

          Alert.alert('Contains Toxicity', message);
          await updateTribet(
            auth().currentUser.uid,
            -50,
            `Tried adding toxic post (Identified by SafeSpeak)`,
          );
          return;
        }
      }

      const users = selectedUsers.map(item => item.id);

      notificationPackageSender(selectedSubtopics);

      const postData = {
        title: splitString(title),
        information: splitString(information),
        selectedSubtopics,
        network_id,
        posted_by: auth().currentUser.uid,
        createdAt: firestore.FieldValue.serverTimestamp(),
        network_name,
        imageUrls,
        videoUrl,
        links: validLinks,
        users,
        ...(typeof targetReply !== 'function' && {targetReply}),
        ...(typeof targetWord !== 'function' && {targetWord}),
        isPollPost: isPoll,
        takeResponses: takeResponse,
        hasImages: imageUrls.length > 0,
        hasVideo: videoUrl ? true : false,
        savePoint: 0,
        likePoint: 0,
        viewPoint: 0,
        likeCount: 0,
        isSensitive: sensitivePost,
        topic: [networkDetails.topic],
        network_type: networkDetails.network_type,
      };

      const postRef = await firestore().collection('Posts').add(postData);

      const post_id = postRef.id;

      addMentions(selectedUsers, network_id, post_id)
        .then(() => {
          console.log('All mentions have been added successfully.');
        })
        .catch(error => {
          console.error('Error adding mentions: ', error);
        });
      for (const poll of polls) {
        await firestore()
          .collection('Posts')
          .doc(post_id)
          .collection('Polls')
          .add({
            poll_name: poll,
          });
      }

      await firestore()
        .collection('Users')
        .doc(auth().currentUser.uid)
        .collection('Posts')
        .add({
          post_id,
          createdAt: firestore.FieldValue.serverTimestamp(),
        });
      const rawInput = `${title} ${information}`;
      const extractedHashes = rawInput.match(/#\w+/g) || [];
      const today = moment().format('YYYY-MM-DD');

      if (extractedHashes.length === 0) {
        console.log('No hashtags found.');
        return;
      }

      const batch = firestore().batch();

      for (const hash of extractedHashes) {
        const hashRef = firestore().collection('HashTags').doc(hash);
        const hashDoc = await hashRef.get();
        const data = hashDoc.data();

        if (data?.lastUpdated !== today) {
          batch.set(
            hashRef,
            {
              countForToday: 1,
              [today]: firestore.FieldValue.increment(1),
              lastUpdated: today,
              totalUsed: firestore.FieldValue.increment(1),
            },
            {merge: true},
          );
        } else {
          batch.set(
            hashRef,
            {
              countForToday: firestore.FieldValue.increment(1),
              [today]: firestore.FieldValue.increment(1),
              totalUsed: firestore.FieldValue.increment(1),
            },
            {merge: true},
          );
        }
      }

      await batch.commit();
      console.log(`Updated usage for hashtags on ${today}`);
      await updateTribet(
        auth().currentUser.uid,
        15,
        `Post added in ${network_name}`,
      );
      console.log('Post saved successfully!');
    } catch (error) {
      console.error('Error saving post:', error);
    } finally {
      setSaving(false);
      navigation.goBack();
    }
  };

  const addLinkInput = () => {
    setLinks([...links, '']);
  };

  const updateLink = (text, index) => {
    const newLinks = [...links];
    newLinks[index] = text;
    setLinks(newLinks);
  };

  useEffect(() => {
    if (typingAt && searchQuery.length > 0) {
      const fetchUsers = async () => {
        try {
          const querySnapshot = await firestore()
            .collection('Users')
            .where('name', '>=', searchQuery)
            .where('name', '<=', searchQuery + '\uf8ff')
            .limit(5)
            .get();

          const users = querySnapshot.docs.map(doc => ({
            id: doc.id,
            name: doc.data().name,
            profile_pic: doc.data().profile_pic,
          }));
          setSuggestions(users);
        } catch (error) {
          console.error('Error fetching users:', error);
        }
      };

      fetchUsers();
    } else {
      setSuggestions([]);
    }
  }, [searchQuery, typingAt]);

  const handleTextChange = text => {
    n = text;
    const atIndex = text.lastIndexOf('@');
    if (atIndex !== -1 && text[atIndex + 1] !== ' ') {
      setTypingAt(true);
      setSearchQuery(text.substring(atIndex + 1).trim());
    } else {
      setTypingAt(false);
    }
  };

  const handleSuggestionClick = userName => {
    const atIndex = information.lastIndexOf('@');
    const newText = information.substring(0, atIndex) + `@${userName} `;
    setInformation(newText);
    setTypingAt(false);
  };

  const handleAddPeople = () => {
    navigation.navigate('AddingUsers', {
      updateSelectedUsers: users => setSelectedUsers(users),
    });
  };

  return (
    <ScrollView
      style={{backgroundColor: 'black', height: '100%'}}
      keyboardShouldPersistTaps="handled"
      stickyHeaderIndices={[0]}>
      <View style={styles.header}>
        <View style={styles.header}>
          <Icon
            name="chevron-back"
            size={28}
            color={color}
            onPress={() => navigation.goBack()}
          />
          <Text style={styles.title}>Add Post</Text>
        </View>
      </View>
      <View
        style={{
          paddingHorizontal: 15,
          backgroundColor: 'black',
          flex: 1,
        }}>
        <View style={{height: 20}} />
        <TextInput
          style={styles.titleinput}
          placeholder="Enter Title"
          placeholderTextColor="grey"
          onChangeText={val => (n = val)}
          onEndEditing={() => setTitle(n)}
          defaultValue={title}
          maxLength={150}
        />
        {errors.title ? (
          <Text style={styles.errorText}>{errors.title}</Text>
        ) : null}
        <TextInput
          style={styles.info}
          placeholder="Enter your Information ..."
          placeholderTextColor="grey"
          multiline={true}
          numberOfLines={6}
          onChangeText={handleTextChange}
          onEndEditing={() => setInformation(n)}
          defaultValue={information}
          maxLength={700}
        />
        {typingAt && (
          <ScrollView
            style={{
              backgroundColor: 'black',
              borderRadius: 5,
              marginVertical: 10,
              maxHeight: 150,
            }}>
            {suggestions.map(item => (
              <TouchableOpacity
                key={item.id}
                style={{
                  padding: 15,
                  backgroundColor: '#1a1a1a',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  marginTop: 5,
                  borderRadius: 5,
                }}
                onPress={() => handleSuggestionClick(item.name)}>
                <Image
                  source={{uri: item.profile_pic}}
                  style={{height: 35, width: 35, borderRadius: 10}}
                />
                <Text style={{color: 'white'}}>{item.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
        {errors.information ? (
          <Text style={styles.errorText}>{errors.information}</Text>
        ) : null}
        <Text style={{color: 'white', fontSize: 20, marginVertical: 15}}>
          Select Subtopics:{' '}
        </Text>
        {loading ? (
          <ActivityIndicator size="small" color={color} />
        ) : (
          <ScrollView horizontal>
            {subtopics.map((item, index) => (
              <Pressable
                key={index.toString()}
                style={[
                  styles.subtopicItem,
                  selectedSubtopics.includes(item) &&
                    styles.selectedSubtopicItem,
                ]}
                onPress={() => toggleSubtopicSelection(item)}>
                <Text
                  style={[
                    styles.subtopicText,
                    selectedSubtopics.includes(item) &&
                      styles.selectedSubtopicText,
                  ]}>
                  {item}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        )}
        {errors.subtopics ? (
          <Text style={styles.errorText}>{errors.subtopics}</Text>
        ) : null}
        <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
          <Text style={{color: 'white', fontSize: 20, marginVertical: 15}}>
            Poll Post:{' '}
          </Text>
          <Switch
            value={isPoll}
            onPress={() => toggleSwitch(isPollTake, setIsPoll, 'Poll')}
          />
        </View>
        {!isPoll ? (
          <View>
            {networkDetails.network_type === 'public' && (
              <View>
                <Pressable
                  style={{
                    backgroundColor: '#1a1a1a',
                    padding: 15,
                    borderRadius: 5,
                    marginTop: 10,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                  onPress={handleAddPeople}>
                  <Text style={{color: 'white'}}>Mention Users</Text>
                  <View
                    style={{
                      backgroundColor: 'rgba(0, 0, 0, 0.3)',
                      padding: 5,
                      borderRadius: 5,
                    }}>
                    <Icon name="add" color="grey" size={20} />
                  </View>
                </Pressable>

                <ScrollView
                  style={{gap: 10, flexDirection: 'row', paddingTop: 10}}
                  horizontal
                  showsHorizontalScrollIndicator={false}>
                  {selectedUsers.length > 0 ? (
                    selectedUsers.map((item, index) => (
                      <TouchableOpacity
                        key={index}
                        style={{
                          marginRight: 10,
                          alignItems: 'center',
                          backgroundColor: '#1a1a1a',
                          padding: 10,
                          borderRadius: 5,
                        }}
                        onPress={() =>
                          navigation.navigate('UserProfile', {
                            id: item.id,
                          })
                        }>
                        <Image
                          source={{uri: item.profile_pic}}
                          style={{height: 50, width: 50, borderRadius: 50}}
                        />
                        <Text
                          style={{
                            color: 'white',
                            alignSelf: 'center',
                            maxWidth: '100%',
                            marginTop: 5,
                          }}
                          numberOfLines={1}
                          ellipsizeMode="tail">
                          {item.name}
                        </Text>
                      </TouchableOpacity>
                    ))
                  ) : (
                    <Text style={{color: 'white'}}>No users selected</Text>
                  )}
                </ScrollView>
              </View>
            )}
            <Text style={{color: 'white', fontSize: 20, marginVertical: 15}}>
              Add Links:{' '}
            </Text>

            {links.map((link, index) => (
              <View
                key={index}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                <TextInput
                  style={styles.linkInput}
                  placeholder="Enter URL"
                  placeholderTextColor="grey"
                  defaultValue={link}
                  value={link}
                  onChangeText={val => updateLink(val, index)}
                  onEndEditing={({nativeEvent}) =>
                    handleEndEditing(nativeEvent.text, index)
                  }
                  autoCapitalize="none"
                />
                {validLinks[index] ? (
                  <Icon name="checkmark-circle" size={20} color="green" />
                ) : (
                  <Icon name="close" size={20} color="red" />
                )}
              </View>
            ))}

            <Pressable style={styles.addLinkButton} onPress={addLinkInput}>
              <Icon name="add" size={25} color="white" />
              <Text style={styles.buttonText}>Add Link</Text>
            </Pressable>

            <View style={{flexDirection: 'row', flexWrap: 'wrap'}}>
              {images.map(image => (
                <View key={image.path} style={styles.previewContainer}>
                  <Image
                    source={{uri: image.path}}
                    style={styles.previewImage}
                    resizeMode="contain"
                  />
                </View>
              ))}
              {video && (
                <View style={styles.previewContainer}>
                  <Video
                    source={{uri: video.path}}
                    style={styles.previewVideo}
                    resizeMode="cover"
                    controls={true}
                  />
                </View>
              )}
            </View>

            <Pressable
              style={[styles.selectMediaButton, video ? {opacity: 0.5} : null]}
              onPress={selectImages}
              disabled={video ? true : false}>
              <Icon name="image" size={25} color="white" />
              <Text style={styles.buttonText}>Add Images</Text>
            </Pressable>
            <Pressable
              style={[
                styles.selectMediaButton,
                images.length > 0 ? {opacity: 0.5} : null,
              ]}
              onPress={selectVideo}
              disabled={images.length > 0 ? true : false}>
              <Icon name="videocam" size={25} color="white" />
              <Text style={styles.buttonText}>Add Video</Text>
            </Pressable>

            {networkDetails?.bots?.includes('wnIEjnIWk0eYlhYUV1Go') && (
              <View>
                <Text
                  style={{
                    color: 'white',
                    fontSize: 20,
                    marginVertical: 15,
                  }}>
                  Enter Target Word:{' '}
                </Text>
                <TextInput
                  style={styles.titleinput}
                  placeholder="Enter Target Word"
                  onChangeText={val => (n = val)}
                  onEndEditing={() => setTargetWord(n)}
                  defaultValue={targetWord}
                  placeholderTextColor={'grey'}
                />

                <Text
                  style={{
                    color: 'white',
                    fontSize: 20,
                    marginVertical: 15,
                  }}>
                  Enter message to trigger:{' '}
                </Text>
                <TextInput
                  style={styles.titleinput}
                  onChangeText={val => (n = val)}
                  onEndEditing={() => setTargetReply(n)}
                  defaultValue={targetReply}
                  placeholder="Enter Target Reply"
                  placeholderTextColor={'grey'}
                />
              </View>
            )}
          </View>
        ) : (
          <View>
            {Array.isArray(polls) && polls.length > 0 ? (
              polls.map((item, index) => (
                <View
                  key={index}
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    backgroundColor: '#333',
                    padding: 10,
                    borderRadius: 10,
                    marginBottom: 10,
                    alignItems: 'center',
                  }}>
                  <Text style={{color: 'white'}}>{item}</Text>
                  <Pressable
                    onPress={() => handleRemovePoll(index)}
                    style={{
                      backgroundColor: {color},
                      borderRadius: 5,
                      padding: 3,
                    }}>
                    <Icon name={'close-outline'} color={'white'} size={20} />
                  </Pressable>
                </View>
              ))
            ) : (
              <Text
                style={{
                  color: 'white',
                  textAlign: 'center',
                  fontSize: 18,
                  marginTop: 10,
                  marginBottom: 10,
                }}>
                No polls available.
              </Text>
            )}
            <TextInput
              style={{
                backgroundColor: '#1a1a1a',
                borderRadius: 5,
                color: {color},
                marginBottom: 10,
                padding: 10,
              }}
              placeholder="Enter Poll Name"
              placeholderTextColor="grey"
              onChangeText={val => setPollName(val)}
              value={pollName}
            />
            <Pressable
              style={{
                backgroundColor: {color},
                borderRadius: 5,
                padding: 10,
                alignItems: 'center',
              }}
              onPress={handleSubmitPoll}>
              <Text style={{fontSize: 15, color: 'white'}}>
                Create Poll Name
              </Text>
            </Pressable>
          </View>
        )}

        <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
          <Text style={{color: 'white', fontSize: 20, marginVertical: 15}}>
            Take Responses:{' '}
          </Text>
          <Switch
            value={takeResponse}
            onPress={() =>
              toggleSwitch(isResponse, setTakeResponse, 'Take Response')
            }
          />
        </View>

        <Pressable
          style={[styles.submitButton, saving ? {opacity: 0.5} : null]}
          onPress={
            images.length > 0 || video ? () => setShowSensitive(true) : savePost
          }
          disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.submitButtonText}>Submit</Text>
          )}
        </Pressable>
      </View>
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
                backgroundColor: {color},
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
      <Modal
        transparent={true}
        visible={showSensitive}
        animationType="slide"
        onRequestClose={() => setShowSensitive(false)}>
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
                color: 'grey',
                fontSize: 16,
                textAlign: 'center',
                marginTop: 10,
              }}>
              Does this Post contains any Sensitive Information
            </Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                width: '100%',
                justifyContent: 'space-between',
                margin: 10,
              }}>
              <Text style={{color: 'white', fontSize: 15}}>
                {sensitivePost
                  ? 'Content is sensitive'
                  : 'Content is not sensitive'}
              </Text>
              <Switch
                value={sensitivePost}
                onPress={() =>
                  toggleSwitch(isSensitive, setSensitivePost, 'Sensitive Post')
                }
              />
            </View>
            <Pressable
              style={{
                backgroundColor: {color},
                width: '90%',
                padding: 15,
                borderRadius: 5,
                alignItems: 'center',
                marginTop: 10,
              }}
              onPress={savePost}>
              <Text style={{color: 'white'}}>Save Post</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    padding: 5,
  },
  title: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  titleinput: {
    color: 'white',
    backgroundColor: '#1E1E1E',
    padding: 10,
    borderRadius: 5,
    marginBottom: 20,
  },
  info: {
    color: 'white',
    backgroundColor: '#1E1E1E',
    padding: 10,
    borderRadius: 5,
    marginBottom: 20,
    textAlignVertical: 'top',
  },
  subtopicItem: {
    backgroundColor: '#333',
    padding: 10,
    borderRadius: 8,
    marginVertical: 5,
    paddingHorizontal: 15,
    marginRight: 10,
  },
  selectedSubtopicItem: {
    backgroundColor: color,
  },
  subtopicText: {
    color: 'white',
  },
  selectedSubtopicText: {
    color: 'white',
    fontWeight: 'bold',
  },
  linkInput: {
    color: 'white',
    backgroundColor: '#1E1E1E',
    padding: 10,
    borderRadius: 8,
    marginVertical: 10,
    width: '90%',
  },
  addLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#444',
    padding: 10,
    borderRadius: 8,
    marginVertical: 10,
  },
  previewContainer: {
    width: '48%',
    marginVertical: 5,
  },
  previewImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
  },
  previewVideo: {
    width: '100%',
    height: 150,
    borderRadius: 8,
  },
  selectMediaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#333',
    padding: 10,
    borderRadius: 8,
    marginVertical: 10,
  },
  buttonText: {
    color: 'white',
    marginLeft: 10,
  },
  submitButton: {
    backgroundColor: color,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 20,
    bottom: 0,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
  },
  cancelButton: {
    alignItems: 'center',
  },
  cancelButtonText: {
    color: 'grey',
    fontSize: 16,
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
    fontSize: 18,
  },
});
