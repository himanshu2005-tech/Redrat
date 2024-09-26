import React, {useState, useEffect, useRef, useMemo, useCallback} from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  Pressable,
  Image,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import firebase from '@react-native-firebase/app';
import Post from './Post';
import {createMaterialTopTabNavigator} from '@react-navigation/material-top-tabs';
import RenderScreen from './RenderScreen';
import ShareNetwork from './ShareNetwork';
import {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetModalProvider,
  BottomSheetBackdrop,
} from '@gorhom/bottom-sheet';
import {SharedElement} from 'react-navigation-shared-element';
import LinearGradient from 'react-native-linear-gradient';
import Bluing from '../texting/Bluing';
import Hash from './Hash';

export default function NetworkScreen({navigation, route}) {
  const {networkId, subtopic} = route.params;
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [networkDetails, setNetworkDetails] = useState({});
  const [accessCode, setAccessCode] = useState();
  const [adminDetails, setAdminDetails] = useState({});
  const [isMember, setIsMember] = useState(false);
  const [isBanned, setIsBanned] = useState(false);
  const [posts, setPosts] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [loading, setLoading] = useState(true);
  const Tab = createMaterialTopTabNavigator();
  const [tab, setTab] = useState(subtopic || 'All');
  const [activeTab, setActiveTab] = useState(tab);

  const bottomSheetModalRef = useRef(null);

  const snapPoints = useMemo(() => ['85%'], []);

  const tabs = ['Popular', 'New'];
  const handlePresentModalPress = useCallback(() => {
    bottomSheetModalRef.current?.present();
  }, []);

  const onTabChange = item => {
    setActiveTab(item);
    setTab('All');
  };

  const fetchNetworkDetails = async () => {
    try {
      const networkDoc = await firestore()
        .collection('Network')
        .doc(networkId)
        .get();
      if (networkDoc.exists) {
        const networkData = networkDoc.data();
        setNetworkDetails(networkData);
        setIsBanned(networkData.bannedUsers?.includes(auth().currentUser.uid));
        console.log(
          'User',
          networkData.bannedUsers?.includes(auth().currentUser.uid),
        );

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
          .get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          setIsMember(userData.joined_networks?.includes(networkId));
        }
      }
    } catch (error) {
      console.error('Error fetching network data:', error);
    } finally {
      setLoadingDetails(false);
    }
  };

  useEffect(() => {
    const unsubscribe = firestore()
      .collection('Network')
      .doc(networkId)
      .collection('Posts')
      .onSnapshot(
        querySnapshot => {
          const postsArray = [];
          querySnapshot.forEach(doc => {
            postsArray.push({id: doc.id, ...doc.data()});
          });
          setPosts(postsArray);
          setLoading(false);
        },
        error => {
          console.warn(error);
          setLoading(false);
        },
      );

    return () => unsubscribe();
  }, [networkId]);

  useEffect(() => {
    fetchNetworkDetails();
  }, [networkId]);

  const showModal = () => setModalVisible(true);
  const closeModal = () => setModalVisible(false);

  const joinNetwork = async () => {
    try {
      const userId = auth().currentUser.uid;
      await firestore()
        .collection('Network')
        .doc(networkId)
        .update({
          joined: firebase.firestore.FieldValue.increment(1),
          members: firestore.FieldValue.arrayUnion(userId),
        });

      await firestore()
        .collection('Users')
        .doc(userId)
        .update({
          joined_networks: firestore.FieldValue.arrayUnion(networkId),
        });

      setIsMember(true);
    } catch (error) {
      console.error('Error joining network:', error);
    }
  };

  const leaveNetwork = async () => {
    try {
      const userId = auth().currentUser.uid;
      await firestore()
        .collection('Network')
        .doc(networkId)
        .update({
          members: firestore.FieldValue.arrayRemove(userId),
          joined: firebase.firestore.FieldValue.increment(-1),
        });

      await firestore()
        .collection('Users')
        .doc(userId)
        .update({
          joined_networks: firestore.FieldValue.arrayRemove(networkId),
        });

      setIsMember(false);
      if (networkDetails.network_type == 'private') {
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error leaving network:', error);
    }
  };

  const navigateToAddPost = () => {
    navigation.navigate('Add', {
      network_id: networkId,
      network_name: networkDetails.network_name,
    });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNetworkDetails();
    setRefreshing(false);
  };

  const submitAccessCode = () => {
    if (accessCode == networkDetails.access_code) {
      joinNetwork();
      console.log('Accepted');
    } else {
      Alert.alert('Wrong Access Code');
      navigation.goBack();
    }
  };
  if (loadingDetails) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF3131" />
      </View>
    );
  }
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
        <Pressable
          onPress={() => navigation.goBack()}
          style={{
            backgroundColor: '#FF3131',
            padding: 10,
            borderRadius: 5,
            marginTop: 20,
          }}>
          <Text
            style={{color: 'white', fontWeight: 'bold', textAlign: 'center'}}>
            Go Back
          </Text>
        </Pressable>
      </View>
    );
  }
  if (!networkDetails || !networkDetails.network_name) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={{color: 'grey', fontWeight: 'bold'}}>Network Deleted</Text>
      </View>
    );
  }
  return networkDetails.network_type == 'private' && !isMember ? (
    <View style={styles.centeredContainer}>
      <Text style={styles.accessCodeText}>Type Access Code</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter Access Code"
        onChangeText={setAccessCode}
        value={accessCode}
        secureTextEntry
        placeholderTextColor={'#FF3131'}
      />
      <Pressable style={styles.submitButton} onPress={submitAccessCode}>
        <Text style={styles.submitButtonText}>Check and Join Network</Text>
      </Pressable>
    </View>
  ) : (
    <ScrollView
      style={{backgroundColor: 'black', height: '100%'}}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      stickyHeaderIndices={[0]}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Icon
            name="chevron-back"
            size={28}
            color="#FF3131"
            onPress={() => navigation.goBack()}
          />
          <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
            {networkDetails.network_name}
          </Text>
          <View style={{flexDirection: 'row', gap: 13}}>
            <Icon
              name="share-social-outline"
              size={30}
              color="#FF3131"
              onPress={handlePresentModalPress}
            />
            <Pressable onPress={showModal}>
              <Icon name="id-card" size={30} color="#FF3131" />
            </Pressable>
          </View>
        </View>
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Network Rules</Text>
            <Bluing text={networkDetails.rules} style={styles.modalRulesText} />
            <Pressable style={styles.modalButton} onPress={closeModal}>
              <Text style={styles.modalButtonText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <View style={styles.networkInfoContainer}>
        <View style={styles.adminContainer}>
          <Pressable
            onLongPress={() =>
              navigation.navigate('ImageExpand', {
                images: networkDetails.profile_pic,
              })
            }>
            <Image
              source={{uri: networkDetails.profile_pic}}
              style={styles.profileImage}
            />
          </Pressable>
          <View style={{flexDirection: 'row', gap: 10, alignItems: 'center'}}>
            <View style={{flexDirection: 'row', gap: 10}}>
              {loadingDetails ? (
                <ActivityIndicator size="large" color="#FF3131" />
              ) : isMember ? (
                <Pressable style={styles.leaveButton} onPress={leaveNetwork}>
                  <Text style={styles.buttonText}>Abandon</Text>
                </Pressable>
              ) : (
                <Pressable style={styles.joinButton} onPress={joinNetwork}>
                  <Text style={styles.buttonText}>Associate</Text>
                </Pressable>
              )}
            </View>
            {networkDetails.admin == auth().currentUser.uid && (
              <Pressable
                onPress={() =>
                  navigation.navigate('NetworkExpand', {
                    network_name: networkDetails.network_name,
                    network_id: networkId,
                    network_type: networkDetails.network_type,
                    joined: networkDetails.joined,
                    rules: networkDetails.rules,
                    bio: networkDetails.bio,
                    isAdminOnly: networkDetails.isAdminOnly,
                  })
                }>
                <Icon name="cog" size={28} color="#FF3131" />
              </Pressable>
            )}
          </View>
        </View>
        <View style={styles.detailsContainer}>
          <Bluing text={networkDetails.bio} style={styles.bioText} />
          <Text style={styles.joinedText}>
            {networkDetails.joined} joined in {networkDetails.network_name}'s
            network
          </Text>
        </View>
        {networkDetails.supportedHashes && (
          <Text style={{color: 'grey', alignSelf: 'flex-start', marginLeft: 10, fontSize: 16}}>Supporting Hashes</Text>
        )}
        {networkDetails.supportedHashes && (
          <ScrollView horizontal contentContainerStyle={{marginBottom: 10, alignItems: 'flex-start', width: "100%", alignItems: 'center', marginLeft: 10, flexDirection: 'row'}}>
          {networkDetails.supportedHashes.map(item => (
            <View key={item}>
              <Hash id={item} />
            </View>
          ))}
        </ScrollView>
        )}
      </View>
      <View style={{flexDirection: 'row'}}>
        {(!networkDetails.isAdminOnly ||
          networkDetails.admin === auth().currentUser.uid) &&
          (isMember ? (
            <View style={{flex: 1}}>
              <Pressable
                style={styles.addPostButton}
                onPress={navigateToAddPost}>
                <Text style={styles.addPostButtonText}>Add</Text>
              </Pressable>
            </View>
          ) : (
            <View style={{flex: 1}}>
              <Pressable style={styles.joinNetworkButton}>
                <Text style={styles.addPostButtonText}>Join Network</Text>
              </Pressable>
            </View>
          ))}
        <View style={{flex: 1}}>
          <Pressable
            style={styles.addPostButton}
            onPress={() =>
              navigation.navigate('Panel', {
                network_id: networkId,
                network_name: networkDetails.network_name,
              })
            }>
            <Text style={styles.addPostButtonText}>Panel</Text>
          </Pressable>
        </View>
      </View>
      <ScrollView horizontal>
        {tabs.map(item => (
          <Pressable
            style={{
              paddingVertical: 15,
              paddingHorizontal: 50,
              borderWidth: 1,
              borderColor: '#1a1a1a',
              borderRadius: 30,
              margin: 10,
              backgroundColor: activeTab === item ? '#FF3131' : 'transparent',
              shadowColor: '#000',
              shadowOffset: {width: 0, height: 4},
              shadowOpacity: 0.3,
              shadowRadius: 6,
              elevation: 4,
            }}
            onPress={() => onTabChange(item)}>
            <Text
              style={{
                color: activeTab === item ? 'white' : '#FF3131',
                fontWeight: activeTab === item ? 'bold' : null,
                fontSize: 16,
              }}>
              {item}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
      <Tab.Navigator
        initialRouteName={tab}
        screenOptions={{
          tabBarActiveTintColor: 'white',
          tabBarIndicatorStyle: {
            backgroundColor: '#FF3131',
            height: 3,
            borderRadius: 200,
          },
          tabBarScrollEnabled: true,
          tabBarLabelStyle: {fontSize: 16},
          tabBarStyle: {backgroundColor: 'black'},
        }}>
        {['All', ...networkDetails.sub_topics].map((topic, index) => (
          <Tab.Screen
            key={`${topic}-${index}`}
            name={topic}
            options={{title: topic === 'All' ? 'All' : topic}}>
            {() => (
              <RenderScreen
                network_id={networkId}
                topic={topic}
                filter={activeTab}
                index={index}
              />
            )}
          </Tab.Screen>
        ))}
      </Tab.Navigator>

      <BottomSheetModal
        ref={bottomSheetModalRef}
        index={0}
        snapPoints={snapPoints}
        handleStyle={{backgroundColor: 'black', zIndex: 100}}
        handleIndicatorStyle={{backgroundColor: 'white'}}
        backdropComponent={props => (
          <BottomSheetBackdrop
            {...props}
            disappearsOnIndex={-1}
            appearsOnIndex={0}
            style={{backgroundColor: 'black'}}
          />
        )}>
        <BottomSheetView style={{backgroundColor: '#404040', flex: 1}}>
          <ShareNetwork
            network_id={networkId}
            network_name={networkDetails.network_name}
          />
        </BottomSheetView>
      </BottomSheetModal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    position: 'sticky',
    top: 0,
    zIndex: 100,
    backgroundColor: 'black',
    width: '100%',
    paddingVertical: 15,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 0.2,
    borderColor: '#ccc',
  },
  headerContent: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  accessCodeText: {
    fontSize: 20,
    marginBottom: 10,
    color: 'white',
  },
  input: {
    width: '90%',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 2,
    fontSize: 17,
    borderWidth: 0.7,
    borderColor: 'grey',
    color: '#FF3131',
    letterSpacing: 1,
    paddingHorizontal: 10,
    marginBottom: 10,
    alignSelf: 'center',
  },
  submitButton: {
    backgroundColor: '#FF3131',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  title: {
    flex: 1,
    fontSize: 24,
    color: 'white',
    marginLeft: 10,
    textAlign: 'center',
    maxWidth: '80%',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'black',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#FF3131',
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
    textAlign: 'justify',
    marginBottom: 10,
    color: 'white',
  },
  modalButton: {
    padding: 10,
    borderRadius: 5,
    marginTop: 20,
    width: '50%',
    alignItems: 'center',
    backgroundColor: '#FF3131',
  },
  modalButtonText: {
    fontSize: 16,
    color: 'white',
  },
  adminContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '90%',
    padding: 4,
    alignItems: 'center',
  },
  profileImage: {
    height: 100,
    width: 100,
    borderRadius: 100,
  },
  joinButton: {
    backgroundColor: '#FF3131',
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 50,
  },
  leaveButton: {
    backgroundColor: 'gray',
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
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
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  bioText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
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
    backgroundColor: '#FF3131',
    alignSelf: 'center',
    alignItems: 'center',
    margin: 10,
    padding: 10,
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
    padding: 10,
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
    borderBottomWidth: 0.2,
    borderColor: 'grey',
    justifyContent: 'space-between',
  },
});
