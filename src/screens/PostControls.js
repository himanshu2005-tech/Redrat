import React, {useState, useEffect} from 'react';
import {
  Text,
  View,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import {useSharedValue} from 'react-native-reanimated';
import {Switch} from './Switch';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import color from './color';
import {SharedElement} from 'react-navigation-shared-element';

export default function PostControls() {
  const [userDetails, setUserDetails] = useState({});
  const [loading, setLoading] = useState();

  const [muteVideosState, setMuteVideosState] = useState();
  const [openInDefaultBrowserState, setOpenInDefaultBrowserState] = useState();
  const [isLeftHandState, setIsLeftHandState] = useState();
  const [postSortPreference, setPostSortPreference] = useState('Featured');
  const [commentSortPreference, setCommentSortPreference] =
    useState('Featured');
  const [autoplayPostVideoState, setAutoplayPostVideoState] = useState();
  const [repeatPostVideoState, setRepeatPostVideoState] = useState();
  const muteVideos = useSharedValue(0);
  const openInDefaultBrowser = useSharedValue(0);
  const isLeftHand = useSharedValue(0);
  const autoplayPostVideo = useSharedValue(0);
  const repeatPostVideo = useSharedValue(0);
  const [blurSensitiveContentState, setBlurSensitiveContentState] = useState();
  const blurSensitiveContent = useSharedValue(0);

  useEffect(() => {
    let isMounted = true; // To check if the component is mounted
    const fetchUserDetails = async () => {
      try {
        setLoading(true);
        const data = await firestore()
          .collection('Users')
          .doc(auth().currentUser.uid)
          .get();
        const userData = data.data();

        if (isMounted) {
          setUserDetails(userData);

          // Set individual preferences
          setIsLeftHandState(userData.isLeftHand);
          setOpenInDefaultBrowserState(userData.openInDefaultBrowser);
          setPostSortPreference(userData.postSortPreference);
          setCommentSortPreference(userData.commentSortPreference);
          setRepeatPostVideoState(userData.repeatPostVideo);
          setAutoplayPostVideoState(userData.autoplayPostVideo);
          setMuteVideosState(userData.mutedPostVideo);
          setBlurSensitiveContentState(userData.blurSensitiveContent);

          muteVideos.value = userData.mutedPostVideo ? 1 : 0;
          openInDefaultBrowser.value = userData.openInDefaultBrowser ? 1 : 0;
          isLeftHand.value = userData.isLeftHand ? 1 : 0;
          autoplayPostVideo.value = userData.autoplayPostVideo ? 1 : 0;
          repeatPostVideo.value = userData.repeatPostVideo ? 1 : 0;
          blurSensitiveContent.value = userData.blurSensitiveContent ? 1 : 0;

          // Save user data to AsyncStorage
          await AsyncStorage.setItem('userDetails', JSON.stringify(userData));
        }
      } catch (error) {
        console.warn(error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchUserDetails();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    muteVideos.value = muteVideosState ? 1 : 0;
    openInDefaultBrowser.value = openInDefaultBrowserState ? 1 : 0;
    isLeftHand.value = isLeftHandState ? 1 : 0;
    autoplayPostVideo.value = autoplayPostVideoState ? 1 : 0;
    repeatPostVideo.value = repeatPostVideoState ? 1 : 0;
  }, [
    muteVideosState,
    openInDefaultBrowserState,
    isLeftHandState,
    autoplayPostVideoState,
    repeatPostVideoState,
  ]);

  const updateUserSetting = async (settingName, newValue) => {
    try {
      await firestore()
        .collection('Users')
        .doc(auth().currentUser.uid)
        .update({
          [settingName]: newValue,
        });

      // Save the updated user settings to AsyncStorage
      const updatedUserDetails = {...userDetails, [settingName]: newValue};
      await AsyncStorage.setItem(
        'userDetails',
        JSON.stringify(updatedUserDetails),
      );

      setUserDetails(updatedUserDetails); // Update state with new details
    } catch (error) {
      console.warn('Error updating user settings:', error);
    }
  };

  const toggleSwitch = async (settingName, sharedValue, setState) => {
    const newState = sharedValue.value === 1 ? 0 : 1;
    sharedValue.value = newState;
    setState(newState === 1);
    updateUserSetting(settingName, newState === 1);
  };

  const handlePostSortPreferenceChange = async newPreference => {
    setPostSortPreference(newPreference);
    await updateUserSetting('postSortPreference', newPreference);
  };

  const handleCommentSortPreferenceChange = async newPreference => {
    setCommentSortPreference(newPreference);
    await updateUserSetting('commentSortPreference', newPreference);
  };

  return (
    <View>
      <Text style={styles.title}>Post Controls</Text>
      <View style={styles.controlsContainer}>
        <Pressable style={styles.container}>
          <View>
            <Text style={styles.label}>Mute Video </Text>
            <Text style={styles.leftHandText}>
              Automatically mute all videos unless the user manually unmutes
            </Text>
          </View>
          <Switch
            value={muteVideos}
            onPress={() =>
              toggleSwitch('mutedPostVideo', muteVideos, setMuteVideosState)
            }
            icons={{off: 'volume-off-outline', on: 'volume-high'}}
            style={{width: 50, height: 25, position: 'absolute', right: 5}}
          />
        </Pressable>

        <Pressable style={styles.container}>
          <View>
            <Text style={styles.label}>Autoplay Videos </Text>
            <Text style={styles.leftHandText}>
              Automatically plays videos as the user scrolls or navigates to a
              video
            </Text>
          </View>
          <Switch
            value={autoplayPostVideo}
            onPress={() =>
              toggleSwitch(
                'autoplayPostVideo',
                autoplayPostVideo,
                setAutoplayPostVideoState,
              )
            }
            icons={{off: 'pause', on: 'play'}}
            style={{width: 50, height: 25, position: 'absolute', right: 5}}
          />
        </Pressable>

        <Pressable style={styles.container}>
          <View>
            <Text style={styles.label}>Loop Videos</Text>
            <Text style={styles.leftHandText}>
              Repeats a video continuously after it ends
            </Text>
          </View>
          <Switch
            value={repeatPostVideo}
            onPress={() =>
              toggleSwitch(
                'repeatPostVideo',
                repeatPostVideo,
                setRepeatPostVideoState,
              )
            }
            icons={{off: 'hourglass', on: 'hourglass-outline'}}
            style={{width: 50, height: 25, position: 'absolute', right: 5}}
          />
        </Pressable>

        <Pressable style={styles.container}>
          <View>
            <Text style={styles.label}>Opens links in the default browser</Text>
            <Text style={styles.leftHandText}>
              Opens clicked links in the user's default browser instead of the
              in-app browser
            </Text>
          </View>
          <Switch
            value={openInDefaultBrowser}
            onPress={() =>
              toggleSwitch(
                'openInDefaultBrowser',
                openInDefaultBrowser,
                setOpenInDefaultBrowserState,
              )
            }
            icons={{off: 'link', on: 'link-outline'}}
            style={{width: 50, height: 25, position: 'absolute', right: 5}}
          />
        </Pressable>

        <Pressable style={styles.container}>
          <View style={{maxWidth: '80%'}}>
            <Text style={styles.label}>Are you left handed?</Text>
            <Text style={styles.leftHandText}>
              Adjusts UI layout to optimize for left-handed users
            </Text>
          </View>
          <Switch
            value={isLeftHand}
            onPress={() =>
              toggleSwitch('isLeftHand', isLeftHand, setIsLeftHandState)
            }
            icons={{off: 'lock-closed', on: 'lock-open'}}
            style={{width: 50, height: 25, position: 'absolute', right: 5}}
          />
        </Pressable>

        <Pressable style={styles.container}>
          <View>
            <Text style={styles.label}>Blur Sensitive Content</Text>
            <Text style={styles.leftHandText}>
              Automatically blurs sensitive or explicit media content until
              explicitly viewed
            </Text>
          </View>
          <Switch
            value={blurSensitiveContent}
            onPress={() =>
              toggleSwitch(
                'blurSensitiveContent',
                blurSensitiveContent,
                setBlurSensitiveContentState,
              )
            }
            icons={{off: 'shield-outline', on: 'shield'}}
            style={{width: 50, height: 25, position: 'absolute', right: 5}}
          />
        </Pressable>

        <View style={{paddingLeft: 15}}>
          <View
            style={{
              width: '100%',
              alignSelf: 'flex-start',
              flexDirection: 'row',
              justifyContent: 'space-between',
            }}>
            <View>
              <Text style={styles.label}>Post Sorting Preference</Text>
              <Text style={styles.leftHandText}>
                Choose how you want posts to be sorted
              </Text>
            </View>
            <Text style={{color: color, right: 10}}>
              {postSortPreference}
            </Text>
          </View>
        
          <ScrollView
            contentContainerStyle={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              margin: 10,
            }}>
            <Pressable
              style={{
                backgroundColor:
                  postSortPreference === 'Featured' ? color : '#1a1a1a',
                paddingHorizontal: 20,
                paddingVertical: 10,
                borderRadius: 5,
              }}
              onPress={() => handlePostSortPreferenceChange('Featured')}>
              <Text style={{color: 'white'}}>Featured</Text>
            </Pressable>
            <Pressable
              style={{
                backgroundColor:
                  postSortPreference === 'Just In' ? color : '#1a1a1a',
                paddingHorizontal: 20,
                paddingVertical: 10,
                borderRadius: 5,
              }}
              onPress={() => handlePostSortPreferenceChange('Just In')}>
              <Text style={{color: 'white'}}>Just In</Text>
            </Pressable>
            <Pressable
              style={{
                backgroundColor:
                  postSortPreference === 'Crowd Favorites'
                    ? color
                    : '#1a1a1a',
                paddingHorizontal: 20,
                paddingVertical: 10,
                borderRadius: 5,
              }}
              onPress={() => handlePostSortPreferenceChange('Crowd Favorites')}>
              <Text style={{color: 'white'}}>Crowd Favorites</Text>
            </Pressable>
          </ScrollView>
        </View>

        <View style={{paddingLeft: 15}}>
          <View
            style={{
              width: '100%',
              alignSelf: 'flex-start',
              flexDirection: 'row',
              justifyContent: 'space-between',
            }}>
            <View>
              <Text style={styles.label}>Comment Sorting Preference</Text>
              <Text style={styles.leftHandText}>
                Choose how you want comments to be sorted
              </Text>
            </View>
            <Text style={{color: color, right: 10}}>
              {commentSortPreference}
            </Text>
          </View>
          <ScrollView
            contentContainerStyle={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              margin: 10,
            }}>
            <Pressable
              style={{
                backgroundColor:
                  commentSortPreference === 'Featured' ? color : '#1a1a1a',
                paddingHorizontal: 20,
                paddingVertical: 10,
                borderRadius: 5,
              }}
              onPress={() => handleCommentSortPreferenceChange('Featured')}>
              <Text style={{color: 'white'}}>Featured</Text>
            </Pressable>
            <Pressable
              style={{
                backgroundColor:
                  commentSortPreference === 'Just In' ? color : '#1a1a1a',
                paddingHorizontal: 20,
                paddingVertical: 10,
                borderRadius: 5,
              }}
              onPress={() => handleCommentSortPreferenceChange('Just In')}>
              <Text style={{color: 'white'}}>Just In</Text>
            </Pressable>
            <Pressable
              style={{
                backgroundColor:
                  commentSortPreference === 'Crowd Favorites'
                    ? color
                    : '#1a1a1a',
                paddingHorizontal: 20,
                paddingVertical: 10,
                borderRadius: 5,
              }}
              onPress={() => handleCommentSortPreferenceChange('Crowd Favorites')}>
              <Text style={{color: 'white'}}>Crowd Favorites</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    marginLeft: 14,
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  controlsContainer: {
    margin: 10,
    backgroundColor: 'black',
    borderRadius: 5,
  },
  container: {
    width: '100%',
    borderColor: 'grey',
    padding: 15,
    justifyContent: 'space-between',
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    color: 'white',
    fontSize: 15,
  },
  leftHandText: {
    fontSize: 12,
    color: 'grey',
    marginTop: 5,
    maxWidth: '93%',
  },
  sortButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginTop: 10,
    width: '100%',
  },
  sortButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 15,
    paddingHorizontal: 15,
    margin: 10,
  },
  sortButtonText: {
    color: 'white',
    padding: 9,
  },
  activeSortButton: {
    backgroundColor: color,
  },
});
