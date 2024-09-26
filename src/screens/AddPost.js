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
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import storage from '@react-native-firebase/storage';
import ImagePicker from 'react-native-image-crop-picker';
import Video from 'react-native-video';
import LinearGradient from 'react-native-linear-gradient';
import moment from 'moment';

export default function AddPost({route, navigation}) {
  const {network_id, network_name, refreshPosts} = route.params;
  const [subtopics, setSubtopics] = useState([]);
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
  const [errors, setErrors] = useState({
    title: '',
    information: '',
    subtopics: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const query = await firestore()
          .collection('Network')
          .doc(network_id)
          .get();
        if (query.exists) {
          const networkData = query.data();
          if (networkData.sub_topics) {
            setSubtopics(networkData.sub_topics);
          }
        } else {
          console.warn('Network document not found');
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [network_id]);

  const toggleSubtopicSelection = subtopic => {
    if (selectedSubtopics.includes(subtopic)) {
      setSelectedSubtopics(selectedSubtopics.filter(item => item !== subtopic));
    } else {
      setSelectedSubtopics([...selectedSubtopics, subtopic]);
    }
  };

  const selectImages = async () => {
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

  const addMentions = async (selectedUsers, network_id, post_id) => {
    const promises = selectedUsers.map(async item => {
      await firestore()
        .collection('Users')
        .doc(item.id)
        .collection('Mentions')
        .add({
          network_id: network_id,
          post_id: post_id,
          createdAt: firestore.FieldValue.serverTimestamp(),
        });
    });

    await Promise.all(promises);
  };
  const addHashes = async (selectedHashes, network_id, post_id) => {
    const promises = selectedHashes.map(async item => {
      await firestore()
        .collection('Hash')
        .doc(item.id)
        .collection('Posts')
        .add({
          network_id: network_id,
          post_id: post_id,
          createdAt: firestore.FieldValue.serverTimestamp(),
        });
    });

    await Promise.all(promises);
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

      const validLinks = links.filter(link => isValidUrl(link));
      const users = [];
      selectedUsers.map(item => {
        users.push(item.id);
      });

      const hashes = [];
      selectedHashes.map(item => {
        hashes.push(item.id);
      });

      const postRef = await firestore()
        .collection('Network')
        .doc(network_id)
        .collection('Posts')
        .add({
          title: title,
          information: information,
          selectedSubtopics: selectedSubtopics,
          network_id: network_id,
          posted_by: auth().currentUser.uid,
          createdAt: firestore.FieldValue.serverTimestamp(),
          network_name: network_name,
          imageUrls: imageUrls,
          videoUrl: videoUrl,
          links: validLinks,
          users: users,
          hashes: hashes,
        });

      const post_id = postRef.id;

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

        // Check if the date is today, if not reset the count
        if (data?.lastUpdated !== today) {
          batch.set(
            hashRef,
            {
              countForToday: 1,
              [today]: firestore.FieldValue.increment(1), 
              lastUpdated: today, 
              totalUsed: firestore.FieldValue.increment(1)
            },
            {merge: true},
          );
        } else {
          batch.set(
            hashRef,
            {
              countForToday: firestore.FieldValue.increment(1), 
              [today]: firestore.FieldValue.increment(1),
              totalUsed: firestore.FieldValue.increment(1) 
            },
            {merge: true},
          );
        }
      }

      try {
        await batch.commit();
        console.log(`Updated usage for hashtags on ${today}`);
      } catch (error) {
        console.error('Error updating hashtags:', error);
      }

      await firestore()
        .collection('Users')
        .doc(auth().currentUser.uid)
        .collection('Posts')
        .add({
          network_id: network_id,
          post_id: post_id,
          createdAt: firestore.FieldValue.serverTimestamp(),
        });

      addMentions(selectedUsers, network_id, post_id)
        .then(() => {
          console.log('All mentions have been added successfully.');
        })
        .catch(error => {
          console.error('Error adding mentions: ', error);
        });

      addHashes(selectedHashes, network_id, post_id)
        .then(() => {
          console.log('Hash adder');
        })
        .catch(error => {
          console.error('Error adding mentions: ', error);
        });

      console.log('Post saved successfully!');

      navigation.goBack();
    } catch (error) {
      console.error('Error saving post:', error);
    } finally {
      setSaving(false);
    }
  };

  const isValidUrl = url => {
    const regex = /^(ftp|http|https):\/\/[^ "]+$/;
    return regex.test(url);
  };

  const addLinkInput = () => {
    setLinks([...links, '']);
  };

  const updateLink = (text, index) => {
    const newLinks = [...links];
    newLinks[index] = text;
    setLinks(newLinks);
  };

  const handleAddPeople = () => {
    navigation.navigate('AddingUsers', {
      updateSelectedUsers: users => setSelectedUsers(users),
    });
  };
  const handleAddHash = () => {
    navigation.navigate('AddingHashes', {
      updateSelectedHashes: hash => setSelectedHashes(hash),
    });
  };

  return (
    <ScrollView>
      <KeyboardAvoidingView
        style={{flex: 1, backgroundColor: 'black'}}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}>
        <View style={{flex: 1, backgroundColor: 'black', height: '100%'}}>
          <View style={styles.header}>
            <Icon
              name="chevron-back"
              size={28}
              color="#FF3131"
              onPress={() => navigation.goBack()}
            />
            <Text style={styles.title}>Add Post</Text>
          </View>
          <View
            style={{
              paddingHorizontal: 15,
              backgroundColor: 'black',
              flex: 1,
            }}>
            <Text style={{color: 'white', fontSize: 20, marginVertical: 15}}>
              Enter title:{' '}
            </Text>
            <TextInput
              style={styles.titleinput}
              placeholder="Title"
              placeholderTextColor="grey"
              value={title}
              onChangeText={text => setTitle(text)}
              maxLength={80}
            />
            {errors.title ? (
              <Text style={styles.errorText}>{errors.title}</Text>
            ) : null}
            <Text style={{color: 'white', fontSize: 20, marginVertical: 15}}>
              Enter main information:{' '}
            </Text>
            <TextInput
              style={styles.info}
              placeholder="Information"
              placeholderTextColor="grey"
              multiline={true}
              numberOfLines={4}
              value={information}
              onChangeText={text => setInformation(text)}
              maxLength={120}
            />
            {errors.information ? (
              <Text style={styles.errorText}>{errors.information}</Text>
            ) : null}
            <Text style={{color: 'white', fontSize: 20, marginVertical: 15}}>
              Select Subtopics:{' '}
            </Text>
            {loading ? (
              <ActivityIndicator size="large" color="#FF3131" />
            ) : (
              <FlatList
                data={subtopics}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({item}) => (
                  <Pressable
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
                )}
              />
            )}
            {errors.subtopics ? (
              <Text style={styles.errorText}>{errors.subtopics}</Text>
            ) : null}
            <Text style={{color: 'white', fontSize: 20, marginVertical: 15}}>
              Add People:{' '}
            </Text>
            <Pressable
              style={{
                backgroundColor: '#1a1a1a',
                padding: 10,
                borderRadius: 10,
              }}
              onPress={handleAddPeople}>
              <Text style={{color: 'white'}}>Add People</Text>
            </Pressable>
            <Text>
              <View style={{gap: 10, flexDirection: 'row', paddingTop: 10}}>
                {selectedUsers.length > 0 ? (
                  selectedUsers.map(item => (
                    <View style={{marginRight: 10}}>
                      <View>
                        <Image
                          source={{uri: item.profile_pic}}
                          style={{height: 50, width: 50, borderRadius: 50}}
                        />
                      </View>
                      <View>
                        <Text
                          style={{
                            color: 'white',
                            alignSelf: 'center',
                            maxWidth: '100%',
                          }}
                          numberOfLines={1}
                          ellipsizeMode="tail">
                          {item.name}
                        </Text>
                      </View>
                    </View>
                  ))
                ) : (
                  <Text style={{color: 'white'}}>No users selected</Text>
                )}
              </View>
            </Text>

            <Text style={{color: 'white', fontSize: 20, marginVertical: 15}}>
              Add Hash:{' '}
            </Text>
            <Pressable
              style={{
                backgroundColor: '#1a1a1a',
                padding: 10,
                borderRadius: 10,
              }}
              onPress={handleAddHash}>
              <Text style={{color: 'white'}}>Add Hashes</Text>
            </Pressable>
            <Text>
              <View style={{gap: 10, flexDirection: 'row', paddingTop: 10}}>
                {selectedHashes.length > 0 ? (
                  selectedHashes.map(item => (
                    <LinearGradient
                      colors={['#FF512F', '#DD2476']}
                      start={{x: 0, y: 0}}
                      end={{x: 1, y: 0}}
                      style={{
                        width: '100%',
                        flexDirection: 'row',
                        alignItems: 'center',
                        padding: 8,
                        gap: 10,
                        borderRadius: 10,
                      }}>
                      <View>
                        <Image
                          source={{uri: item.imageUri}}
                          style={{height: 50, width: 50, borderRadius: 50}}
                        />
                      </View>
                      <View>
                        <Text
                          style={{
                            color: 'white',
                            alignSelf: 'center',
                            maxWidth: '100%',
                          }}
                          numberOfLines={1}
                          ellipsizeMode="tail">
                          {item.hash}
                        </Text>
                      </View>
                    </LinearGradient>
                  ))
                ) : (
                  <Text style={{color: 'white'}}>No users selected</Text>
                )}
              </View>
            </Text>
            <Text style={{color: 'white', fontSize: 20, marginVertical: 15}}>
              Add Links:{' '}
            </Text>
            {links.map((link, index) => (
              <TextInput
                key={index}
                style={styles.linkInput}
                placeholder="Enter URL"
                placeholderTextColor="grey"
                value={link}
                onChangeText={text => updateLink(text, index)}
              />
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
            <Pressable
              style={[styles.submitButton, saving ? {opacity: 0.5} : null]}
              onPress={savePost}
              disabled={saving}>
              {saving ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.submitButtonText}>Submit</Text>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  title: {
    color: 'white',
    fontSize: 24,
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
  },
  selectedSubtopicItem: {
    backgroundColor: '#FF3131',
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
    backgroundColor: '#FF3131',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 20,
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
