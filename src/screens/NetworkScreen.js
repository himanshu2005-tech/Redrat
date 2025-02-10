import React, {useState, useEffect, useRef, useMemo, useCallback} from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  Image,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Alert,
  ImageBackground,
  FlatList,
  Dimensions,
  Animated,
  Pressable,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import firebase from '@react-native-firebase/app';
import Post from './Post';
import {createMaterialTopTabNavigator} from '@react-navigation/material-top-tabs';
import RenderScreen from './RenderScreen';
import ShareNetwork from './ShareNetwork';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetModalProvider,
  BottomSheetBackdrop,
} from '@gorhom/bottom-sheet';
import LinearGradient from 'react-native-linear-gradient';
import Bluing from '../texting/Bluing';
import Hash from './Hash';
import PinnedAnnouncement from './PinnedAnnoucement';
import UserDetails from './UserDetails';
import NetworkPosts from './NetworkPosts';
import updateTribet from './updateTribet';
import color from './color';
import {SharedElement} from 'react-navigation-shared-element';

const screenWidth = Dimensions.get('window').width;

export default function NetworkScreen({navigation, route}) {
  const {networkId, subtopic} = route.params;
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [networkDetails, setNetworkDetails] = useState({});
  const [accessCode, setAccessCode] = useState();
  const [adminDetails, setAdminDetails] = useState({});
  const [isMember, setIsMember] = useState(false);
  const [pinnedPosts, setPinnedPosts] = useState([]);
  const [isBanned, setIsBanned] = useState(false);
  const [posts, setPosts] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [loading, setLoading] = useState(true);
  const Tab = createMaterialTopTabNavigator();
  const [tab, setTab] = useState(subtopic || 'All');
  const [activeTab, setActiveTab] = useState(tab);
  const [requestLoading, setRequestLoading] = useState(false);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [finalSearch, setFinalSearch] = useState('');
  const [userDetails, setUserDetails] = useState([]);
  const [error, setError] = useState();
  const widthAnim = useRef(new Animated.Value(0)).current;

  const [expandedRuleIndex, setExpandedRuleIndex] = useState(null);
  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const userDetailsJson = await AsyncStorage.getItem('userDetails');
        const userDetails = userDetailsJson
          ? JSON.parse(userDetailsJson)
          : null;
        setUserDetails(userDetails);
      } catch (error) {
        console.warn(error);
      }
    };

    fetchUserDetails();
  }, []);

  useEffect(() => {
    const unsubscribe = firestore()
      .collection('Network')
      .doc(networkId)
      .onSnapshot(
        networkDoc => {
          if (networkDoc.exists) {
            const networkData = networkDoc.data();
            setNetworkDetails(networkData);
            setPinnedPosts(networkData.pinned_posts);
            setIsBanned(
              networkData.bannedUsers?.includes(auth().currentUser.uid),
            );

            const fetchAdditionalDetails = async () => {
              try {
                const adminDoc = await firestore()
                  .collection('Users')
                  .doc(networkData.admin)
                  .get();
                if (adminDoc.exists) {
                  setAdminDetails(adminDoc.data());
                }

                const userDoc = await firestore()
                  .collection('Users')
                  .doc(auth().currentUser.uid)
                  .collection('JoinedNetworks')
                  .doc(networkId)
                  .get();

                setIsMember(userDoc.exists);
              } catch (error) {
                console.error('Error fetching additional details:', error);
              } finally {
                setLoadingDetails(false);
              }
            };

            fetchAdditionalDetails();
          } else {
            console.warn('Network document does not exist');
          }
        },
        error => {
          console.error('Error fetching network details in real-time:', error);
        },
      );

    return () => unsubscribe();
  }, [networkId]);

  useEffect(() => {
    let unsubscribe;

    const fetchVisited = async () => {
      try {
        const userId = auth().currentUser.uid;
        const topic = networkDetails?.topic;
        const preferenceRef = firestore()
          .collection('Users')
          .doc(userId)
          .collection('Preferences')
          .doc(topic);

        const viewsDocRef = firestore()
          .collection('Network')
          .doc(networkId)
          .collection('Views')
          .doc(userId);

        unsubscribe = viewsDocRef.onSnapshot(async snapshot => {
          if (!snapshot.exists) {
            // User has not visited before, set the visit timestamp and increment the score
            const batch = firestore().batch();

            // Increment score in Preferences collection
            batch.set(
              preferenceRef,
              {
                score: firestore.FieldValue.increment(8),
              },
              {merge: true}, // Ensures the document is created or updated
            );

            // Set the visited timestamp in Views collection
            batch.set(viewsDocRef, {
              visitedAt: firestore.FieldValue.serverTimestamp(),
            });

            // Commit the batch
            await batch.commit();
            console.log('Visited and score updated!');
          } else {
            console.log('Already Visited !!');
          }
        });
      } catch (error) {
        console.warn('Error fetching visited data:', error);
      }
    };

    fetchVisited();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [networkId, networkDetails?.topic]);

  const toggleDescription = index => {
    setExpandedRuleIndex(expandedRuleIndex === index ? null : index);
  };

  const handlePresentModalPress = () => {
    navigation.navigate('ShareNetwork', {
      network_id: networkId,
      network_name: networkDetails.network_name,
    });
  };

  const handlePersonalizedNotifications = () => {
    navigation.navigate('SelectPersonalizedNotifications', {
      network_id: networkId,
      networkDetails: networkDetails,
    });
  };

  const onTabChange = item => {
    setActiveTab(item);
    setTab('All');
  };
  const toggleSearchBar = () => {
    if (isSearchVisible) {
      Animated.timing(widthAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start(() => {
        setFinalSearch('');
        setIsSearchVisible(false);
      });
    } else {
      setIsSearchVisible(true);
      Animated.timing(widthAnim, {
        toValue: screenWidth * 0.98,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  };

  const showModal = () => setModalVisible(true);
  const closeModal = () => setModalVisible(false);

  const joinNetwork = async () => {
    try {
      setRequestLoading(true);

      // Update Firestore
      await firestore()
        .collection('Network')
        .doc(networkId)
        .update({
          joined: firestore.FieldValue.increment(1),
        });
      await firestore()
        .collection('Network')
        .doc(networkId)
        .collection('Members')
        .doc(auth().currentUser.uid)
        .set(
          {
            joined_at: firestore.FieldValue.serverTimestamp(),
          },
          {merge: true},
        );

      await firestore()
        .collection('Users')
        .doc(auth().currentUser.uid)
        .collection('JoinedNetworks')
        .doc(networkId)
        .set(
          {
            joined_at: firestore.FieldValue.serverTimestamp(),
          },
          {merge: true},
        );

      // Update the joinedNetworks in AsyncStorage
      const currentJoinedNetworks =
        JSON.parse(await AsyncStorage.getItem('joinedNetworks')) || [];
      if (!currentJoinedNetworks.includes(networkId)) {
        currentJoinedNetworks.push(networkId);
        await AsyncStorage.setItem(
          'joinedNetworks',
          JSON.stringify(currentJoinedNetworks),
        );
      }

      // Update Tribet
      await updateTribet(
        auth().currentUser.uid,
        30,
        `Joined ${networkDetails.network_name} network`,
      );

      // Send greet message if needed
      if (
        networkDetails?.bots?.includes('PKGEuUczNm6Ebcp2fxVG') &&
        networkDetails.greetMessage
      ) {
        await firestore()
          .collection('Users')
          .doc(auth().currentUser.uid)
          .collection('Inbox')
          .add({
            message: networkDetails.greetMessage,
            createdAt: firestore.FieldValue.serverTimestamp(),
            sentBy: 'PKGEuUczNm6Ebcp2fxVG',
            network_id: networkId,
            type: 'greet_message',
          });
        console.log('Greet Message sent!!');
      }

      setModalVisible(true);
      setRequestLoading(false);
      setIsMember(true);
    } catch (error) {
      console.error('Error joining network:', error);
      setRequestLoading(false);
    }
  };

  const leaveNetwork = async () => {
    try {
      setRequestLoading(true);
      const userId = auth().currentUser.uid;

      // Update Firestore
      await firestore()
        .collection('Network')
        .doc(networkId)
        .update({
          joined: firestore.FieldValue.increment(-1),
        });

      await firestore()
        .collection('Network')
        .doc(networkId)
        .collection('Members')
        .doc(userId)
        .delete();

      await firestore()
        .collection('Users')
        .doc(userId)
        .collection('JoinedNetworks')
        .doc(networkId)
        .delete();

      // Update the joinedNetworks in AsyncStorage
      const currentJoinedNetworks =
        JSON.parse(await AsyncStorage.getItem('joinedNetworks')) || [];
      const updatedJoinedNetworks = currentJoinedNetworks.filter(
        id => id !== networkId,
      );
      await AsyncStorage.setItem(
        'joinedNetworks',
        JSON.stringify(updatedJoinedNetworks),
      );

      // Update Tribet
      await updateTribet(
        auth().currentUser.uid,
        -30,
        `Abandoned ${networkDetails.network_name} network`,
      );

      setIsMember(false);
      setRequestLoading(false);
      console.log('Left the network successfully.');

      if (networkDetails.network_type === 'private') {
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error leaving network:', error);
      setRequestLoading(false);
    }
  };

  const verifyCode = () => {
    try {
      if (networkDetails.access_code === accessCode) {
        joinNetwork();
      } else {
        setError('Access Code is Wrong');
      }
    } catch (error) {
      console.warn(error);
    }
  };
  const navigateToAddPost = () => {
    navigation.navigate('Add', {
      network_id: networkId,
      network_name: networkDetails.network_name,
      networkDetails: networkDetails,
    });
  };

  if (networkDetails.network_type === 'private' && !isMember) {
    return (
      <View
        style={{
          backgroundColor: 'black',
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
        }}>
        <Text
          style={{
            fontSize: 20,
            fontWeight: 'bold',
            color: 'white',
            marginBottom: 20,
            textAlign: 'center',
          }}>
          This is a Private Network
        </Text>
        <Text
          style={{
            fontSize: 16,
            color: 'grey',
            marginBottom: 20,
            textAlign: 'center',
            lineHeight: 24,
          }}>
          To access this network, please enter the access code provided by the
          network administrator.
        </Text>
        <TextInput
          value={accessCode}
          onChangeText={setAccessCode}
          style={{
            width: '80%',
            backgroundColor: '#1a1a1a',
            borderRadius: 5,
            paddingLeft: 10,
            paddingVertical: 12,
            color: 'white',
            marginBottom: 20,
          }}
          placeholder="Enter Access Code"
          placeholderTextColor={'grey'}
          secureTextEntry
        />
        {error && <Text style={{color: 'red', fontSize: 17}}>{error}</Text>}
        <TouchableOpacity
          style={{
            backgroundColor: '#FF3131',
            width: '80%',
            borderRadius: 5,
            marginTop: 10,
            paddingVertical: 12,
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: {width: 0, height: 4},
            shadowOpacity: 0.1,
            shadowRadius: 4,
          }}
          onPress={verifyCode}>
          <Text style={{color: 'white', fontSize: 16, fontWeight: 'bold'}}>
            Verify Code
          </Text>
        </TouchableOpacity>
        <Text
          style={{
            fontSize: 14,
            color: 'grey',
            marginTop: 20,
            textAlign: 'center',
          }}>
          If you don't have the code, contact the network administrator for
          assistance.
        </Text>
      </View>
    );
  }
  if (loadingDetails) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={color} />
      </View>
    );
  }

  const NetworkMain = () => {
    if (isBanned) {
      return (
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'black',
          }}>
          <Text style={{color: 'white', fontSize: 18}}>
            You cannot access this network.
          </Text>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{
              backgroundColor: color,
              padding: 10,
              borderRadius: 5,
              marginTop: 20,
            }}>
            <Text
              style={{color: 'white', fontWeight: 'bold', textAlign: 'center'}}>
              Go Back
            </Text>
          </TouchableOpacity>
        </View>
      );
    }
    if (!networkDetails || !networkDetails.network_name) {
      return (
        <View style={styles.centeredContainer}>
          <Text style={{color: 'grey', fontWeight: 'bold'}}>
            Network Deleted
          </Text>
        </View>
      );
    }
    return (
      <View style={{backgroundColor: 'black', gap: 0, flex: 1}}>
        <ScrollView style={{backgroundColor: 'black', margin: 0}}>
          <ImageBackground
            source={{uri: networkDetails?.networkBackground}}
            style={{width: '100%', borderRadius: 10, margin: 5}}
            resizeMode="cover">
            <View style={styles.headerContent}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={{
                  padding: 5,
                  backgroundColor: 'rgba(0, 0, 0, 0.4)',
                  borderRadius: 200,
                  marginLeft: 5,
                }}>
                <Icon name="chevron-back" size={28} color="white" />
              </TouchableOpacity>
              <View style={{flexDirection: 'row', gap: 13}}>
                <TouchableOpacity
                  onPress={toggleSearchBar}
                  style={{
                    padding: 5,
                    backgroundColor: 'rgba(0, 0, 0, 0.4)',
                    borderRadius: 200,
                  }}>
                  <Icon
                    name={isSearchVisible ? 'close' : 'search'}
                    size={30}
                    color="white"
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handlePersonalizedNotifications}
                  style={{
                    padding: 5,
                    backgroundColor: 'rgba(0, 0, 0, 0.4)',
                    borderRadius: 200,
                  }}>
                  <Icon name="chatbox" size={30} color="white" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handlePresentModalPress}
                  style={{
                    padding: 5,
                    backgroundColor: 'rgba(0, 0, 0, 0.4)',
                    borderRadius: 200,
                  }}>
                  <Icon name="bookmark" size={30} color="white" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={showModal}
                  style={{
                    padding: 5,
                    backgroundColor: 'rgba(0, 0, 0, 0.4)',
                    borderRadius: 200,
                    marginRight: 10,
                  }}>
                  <Icon name="journal" size={30} color="white" />
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.adminContainer}>
              <TouchableOpacity
                onLongPress={() =>
                  navigation.navigate('ImageExpand', {
                    images: networkDetails.profile_pic,
                  })
                }>
                <Image
                  source={{uri: networkDetails.profile_pic}}
                  style={styles.profileImage}
                />
              </TouchableOpacity>
              {networkDetails.admin == auth().currentUser.uid && (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    padding: 7,
                    borderRadius: 100,
                    position: 'absolute',
                    right: 15,
                  }}>
                  <TouchableOpacity
                    onPress={() =>
                      navigation.navigate('NetworkExpand', {
                        network_name: networkDetails.network_name,
                        network_id: networkId,
                        network_type: networkDetails.network_type,
                        joined: networkDetails.joined,
                        rules: networkDetails.rules,
                        bio: networkDetails.bio,
                        isAdminOnly: networkDetails.isAdminOnly,
                        networkDetails: networkDetails,
                      })
                    }>
                    <Icon name="options" size={28} color="white" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </ImageBackground>
          <View
            style={{
              backgroundColor: '#1a1a1a',
              alignItems: 'center',
              padding: 10,
              borderRadius: 10,
              margin: 10,
              flexDirection: 'row',
              justifyContent: 'space-around',
            }}>
            <View style={{alignItems: 'center'}}>
              <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
                {networkDetails.network_name}
              </Text>
            </View>
            <Text style={styles.joinedText}>{networkDetails.joined}</Text>
            <View>
              {requestLoading ? (
                <Icon name="pulse" color="white" size={25} />
              ) : loadingDetails ? (
                <ActivityIndicator size="large" color={color} />
              ) : isMember ? (
                <TouchableOpacity
                  style={styles.leaveButton}
                  onPress={leaveNetwork}
                  accessibilityLabel="Leave the network">
                  <Icon name="unlink" color="white" size={25} />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.joinButton}
                  onPress={joinNetwork}
                  accessibilityLabel="Join the network">
                  <Icon name="link" color="white" size={25} />
                </TouchableOpacity>
              )}
            </View>
          </View>
          {networkDetails.admin !== auth().currentUser.uid &&
            networkDetails.isSetForAcquisition &&
            networkDetails.minAcquisitionValue &&
            networkDetails.minAcquisitionValue < userDetails.tribet && (
              <TouchableOpacity
                style={{
                  backgroundColor: color,
                  margin: 10,
                  alignSelf: 'flex-end',
                  alignItems: 'center',
                  borderRadius: 25,
                  padding: 10,
                  paddingHorizontal: 25,
                }}
                onPress={() =>
                  navigation.navigate('AquireNetwork', {
                    network_id: networkId,
                  })
                }>
                <Text style={{color: 'white', fontWeight: 'bold'}}>
                  Aquire {networkDetails.network_name}
                </Text>
              </TouchableOpacity>
            )}
          <Modal
            animationType="slide"
            transparent={true}
            visible={modalVisible}
            onRequestClose={closeModal}>
            <View
              style={[
                styles.modalContainer,
                {marginVertical: 10, width: '90%'},
              ]}>
              <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', margin: 10}}>
                <Text style={styles.modalTitle}>Network Rules</Text>
                <Pressable style={{backgroundColor: "#1a1a1a", padding: 5, borderRadius: 100}} onPress={()=>{
                  setModalVisible(false)
                  navigation.navigate("AddFeed", {
                  id: networkId
                })}}>
                  <Icon name="add" size={20} color="white" />
                </Pressable>
              </View>
              <ScrollView
                contentContainerStyle={{
                  alignItems: 'flex-start',
                  width: '100%',
                }}>
                {Array.isArray(networkDetails.rules) &&
                networkDetails.rules.length > 0 ? (
                  networkDetails.rules.map((rule, index) => (
                    <View
                      key={index}
                      style={{
                        backgroundColor: '#1a1a1a',
                        borderRadius: 5,
                        padding: 5,
                        width: '100%',
                        marginTop: 10,
                        opacity: rule.isDeactivate ? 0.6 : 1,
                      }}>
                      <View
                        style={{
                          backgroundColor: 'rgba(0, 0, 0, 0.2)',
                          borderRadius: 5,
                          alignItems: 'center',
                          width: '100%',
                        }}>
                        <Text
                          style={[
                            styles.modalRulesText,
                            {
                              backgroundColor: 'rgba(0, 0, 0, 0.2)',
                              borderRadius: 5,
                              alignItems: 'center',
                              width: '100%',
                              fontSize: 17,
                              padding: 5,
                            },
                          ]}>
                          {rule.rule}
                        </Text>
                        {rule.isDeactivate && (
                          <Text
                            style={{
                              fontSize: 14,
                              color: 'grey',
                              fontWeight: 'bold',
                              textAlign: 'right',
                              position: 'absolute',
                              right: 5,
                              bottom: 2,
                            }}>
                            Disabled
                          </Text>
                        )}
                      </View>
                      <Text
                        style={{color: 'white', marginTop: 5, fontSize: 15}}>
                        {rule.description}
                      </Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.modalRulesText}>No rules available.</Text>
                )}
              </ScrollView>
              <Text
                style={{
                  color: 'grey',
                  marginHorizontal: 10,
                  textAlign: 'center',
                  fontSize: 15,
                }}>
                The network is built around{' '}
              </Text>
              <Text
                style={{
                  color: color,
                  marginHorizontal: 10,
                  textAlign: 'center',
                  fontSize: 15,
                  fontWeight: 'bold',
                }}>
                {networkDetails.topic}
              </Text>
              <TouchableOpacity style={styles.modalButton} onPress={closeModal}>
                <Text style={styles.modalButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </Modal>

          <View style={styles.networkInfoContainer}>
            <View style={styles.detailsContainer}>
              <Bluing text={networkDetails.bio} style={styles.bioText} />
            </View>
          </View>
          <View>
            {networkDetails.pinnedAnnouncements?.length > 0 && (
              <View>
                <Text
                  style={{
                    color: 'white',
                    alignSelf: 'flex-start',
                    marginLeft: 10,
                    fontSize: 20,
                    fontWeight: '800',
                    marginTop: 10,
                    fontWeight: 900,
                  }}>
                  Pinned Announcements
                </Text>

                <FlatList
                  horizontal={true}
                  data={networkDetails.pinnedAnnouncements}
                  pagingEnabled
                  keyExtractor={(item, index) =>
                    `announcement-${item}-${index}`
                  }
                  renderItem={({item}) => (
                    <View
                      key={`announcement-${item}`}
                      style={{width: screenWidth}}>
                      <PinnedAnnouncement
                        network_id={networkId}
                        announcement_id={item}
                      />
                    </View>
                  )}
                />
              </View>
            )}
          </View>
          <View style={{flexDirection: 'row'}}>
            {(!networkDetails.isAdminOnly ||
              networkDetails.admin === auth().currentUser.uid) &&
              (isMember ? (
                <View style={{flex: 1}}>
                  <TouchableOpacity
                    style={styles.addPostButton}
                    onPress={navigateToAddPost}>
                    <Icon name="add" size={30} color="white" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={{flex: 1}}>
                  <TouchableOpacity style={styles.joinNetworkButton}>
                    <Icon name="add" size={30} color="white" />
                  </TouchableOpacity>
                </View>
              ))}
            <View style={{flex: 1}}>
              <TouchableOpacity
                style={styles.panelButton}
                onPress={() =>
                  navigation.navigate('Panel', {
                    network_id: networkId,
                    panel_name: networkDetails.panelName,
                    admin: networkDetails.admin,
                  })
                }>
                <Icon name="file-tray-stacked" size={30} color="white" />
              </TouchableOpacity>
            </View>
          </View>
          {pinnedPosts && (
            <ScrollView contentContainerStyle={{backgroundColor: 'black'}}>
              <View>
                <Text
                  style={{
                    color: 'white',
                    fontSize: 20,
                    margin: 10,
                    fontWeight: '900',
                    letterSpacing: 1,
                  }}>
                  Pinned Posts
                </Text>
                <FlatList
                  data={pinnedPosts}
                  horizontal
                  pagingEnabled
                  keyExtractor={item => item}
                  renderItem={({item}) => (
                    <View
                      style={{
                        width: Dimensions.get('window').width,
                        padding: 10,
                      }}>
                      <Post post_id={item} isSub />
                    </View>
                  )}
                  showsHorizontalScrollIndicator={true}
                />
              </View>
            </ScrollView>
          )}
        </ScrollView>
      </View>
    );
  };

  return (
    <View style={{flex: 1, backgroundColor: 'black'}}>
      <FlatList
        data={[1]}
        ListHeaderComponent={() => <NetworkMain />}
        renderItem={() => (
          <NetworkPosts
            networkDetails={networkDetails}
            subtopic={subtopic}
            networkId={networkId}
            searchInput={finalSearch}
            isSearchInput={isSearchVisible}
            userDetails={userDetails}
          />
        )}
        keyExtractor={() => '1'}
        nestedScrollEnabled={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    top: 0,
    zIndex: 100,
    backgroundColor: 'black',
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 0.2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerContent: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    padding: 5,
    zIndex: 1,
  },
  searchIcon: {
    right: 10,
    position: 'absolute',
  },
  searchBar: {
    backgroundColor: '#1a1a1a',
    borderRadius: 5,
    justifyContent: 'center',
    overflow: 'hidden',
    alignSelf: 'center',
    marginTop: 10,
    paddingLeft: 5,
  },
  accessCodeText: {
    fontSize: 20,
    marginBottom: 10,
    color: 'white',
  },
  inputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  input: {
    width: '90%',
    backgroundColor: '#1a1a1a',
    borderRadius: 2,
    fontSize: 17,
    color: color,
    paddingHorizontal: 10,
    marginBottom: 10,
    alignSelf: 'center',
  },
  submitButton: {
    backgroundColor: color,
    padding: 15,
    borderRadius: 3,
    width: '70%',
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
  },
  title: {
    fontSize: 24,
    color: color,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'black',
    maxWidth: '90%',
    alignSelf: 'center',
    padding: 10,
    borderRadius: 10,
  },
  modalContent: {
    backgroundColor: 'black',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    alignItems: 'center',
    backgroundColor: 'black',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: color,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 14,
    textAlign: 'right',
    top: 10,
    color: 'white',
  },
  modalRulesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    color: 'white',
  },
  modalRulesText: {
    fontSize: 16,
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'left',
  },
  modalButton: {
    padding: 10,
    borderRadius: 5,
    marginTop: 20,
    width: '90%',
    alignItems: 'center',
    backgroundColor: color,
    marginBottom: 10,
    alignSelf: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    color: 'white',
  },
  adminContainer: {
    flexDirection: 'row',
    width: '100%',
    padding: 4,
    alignItems: 'center',
  },
  profileImage: {
    height: 100,
    width: 100,
    borderRadius: 100,
    margin: 10,
    elevation: 15,
    shadowColor: 'grey',
    shadowOffset: {width: 0, height: 15},
    shadowOpacity: 0.7,
    shadowRadius: 5,
  },
  joinButton: {
    backgroundColor: color,
    paddingVertical: 5,
    paddingHorizontal: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  leaveButton: {
    backgroundColor: 'gray',
    paddingVertical: 5,
    paddingHorizontal: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 15,
  },
  detailsContainer: {
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    width: '90%',
    marginBottom: 10,
  },
  bioText: {
    color: 'white',
    fontSize: 16,
  },
  joinedText: {
    color: 'grey',
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
  addPostButton: {
    width: '90%',
    backgroundColor: color,
    alignSelf: 'center',
    alignItems: 'center',
    margin: 10,
    padding: 5,
    borderRadius: 5,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  panelButton: {
    width: '90%',
    backgroundColor: '#1a1a1a',
    alignSelf: 'center',
    alignItems: 'center',
    margin: 10,
    padding: 5,
    borderRadius: 5,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  joinNetworkButton: {
    width: '90%',
    backgroundColor: '#ccc',
    alignSelf: 'center',
    alignItems: 'center',
    margin: 10,
    padding: 5,
    borderRadius: 5,
  },
  addPostButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: 'bold',
  },
  networkInfoContainer: {
    alignItems: 'center',
    gap: 10,
    justifyContent: 'space-between',
  },
});
