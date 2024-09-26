import React, {useEffect, useState, useCallback} from 'react';
import {
  Image,
  StyleSheet,
  Text,
  View,
  Pressable,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  Modal,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import Icon from 'react-native-vector-icons/Ionicons';
import {useNavigation} from '@react-navigation/native';
import Post from './Post';
import PostUsers from './PostUsers';
import CommentUsers from './Mentions';
import {createMaterialTopTabNavigator} from '@react-navigation/material-top-tabs';
import Mentions from './Mentions';
import Bluing from '../texting/Bluing';
const Tab = createMaterialTopTabNavigator();

export default function ProfileScreen() {
  const user = auth().currentUser;
  const [userDetails, setUserDetails] = useState(null);
  const [posts, setPosts] = useState([]);
  const [lastDoc, setLastDoc] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const navigation = useNavigation();

  const fetchUserDetails = async () => {
    if (user) {
      try {
        const userDoc = await firestore()
          .collection('Users')
          .doc(user.uid)
          .get();
        if (userDoc.exists) {
          setUserDetails(userDoc.data());
        } else {
          console.log('No user data found in Firestore');
        }
      } catch (error) {
        console.error('Error fetching user data: ', error);
      }
    }
  };

  const fetchPosts = async (initial = false) => {
    setLoading(true);
    let query = firestore()
      .collection('Users')
      .doc(user.uid)
      .collection('Posts')
      .orderBy('createdAt', 'desc')
      .limit(20);

    if (lastDoc && !initial) {
      query = query.startAfter(lastDoc);
    }

    try {
      const snapshot = await query.get();
      const postsArray = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      if (initial) {
        setPosts(postsArray);
      } else {
        setPosts(prevPosts => [...prevPosts, ...postsArray]);
      }

      if (snapshot.docs.length > 0) {
        setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      } else {
        setLastDoc(null);
      }
    } catch (error) {
      console.error('Error fetching posts: ', error);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchUserDetails();
    fetchPosts(true);
  }, [user]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchUserDetails();
    fetchPosts(true).then(() => setRefreshing(false));
  }, []);

  const handleLoadMore = () => {
    if (!loading && lastDoc) {
      fetchPosts();
    }
  };

  const handleSignOut = () => {
    setModalVisible(false);
    auth().signOut();
  };

  if (!userDetails) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF3131" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={{backgroundColor: 'black', width: '100%'}}>
        <View style={styles.info_container}>
          <Pressable
            style={styles.email_container}
            onPress={() => navigation.navigate('UserDetails')}>
            <Text style={styles.email}>{userDetails.email}</Text>
            <Icon name="chevron-forward-outline" size={25} color="#FF3131" />
          </Pressable>
          <Image
            source={{uri: userDetails.profile_pic}}
            style={styles.profile_pic}
          />
          <View style={styles.name_container}>
            <Text style={styles.name}>{userDetails.name}</Text>
          </View>
          <View
            style={{
              backgroundColor: '#1a1a1a',
              width: '100%',
              padding: 10,
              borderRadius: 2,
            }}>
            <Bluing
              text={userDetails.bio}
              style={{color: 'white', fontSize: 17}}
            />
          </View>
          <View
            style={{
              justifyContent: 'space-evenly',
              flexDirection: 'row',
              gap: 10,
            }}>
            <View style={{gap: 10, width: '100%'}}>
              <Pressable
                style={styles.create_community_btn}
                onPress={() => navigation.navigate('Create')}>
                <Text style={styles.create_community_text}>
                  Create Your Network
                </Text>
                <Icon name="git-branch" size={25} color="white" />
              </Pressable>
              <Pressable
                style={styles.create_community_btn}
                onPress={() => navigation.navigate('CreateHash')}>
                <Text style={styles.create_community_text}>Create Hash</Text>
                <Icon name="diamond" size={25} color="white" />
              </Pressable>
            </View>
          </View>
        </View>
      </View>

      <Tab.Navigator
        initialRouteName="Posts"
        screenOptions={({route}) => ({
          tabBarIcon: ({focused, color, size}) => {
            let iconName;

            if (route.name === 'Posts') {
              iconName = focused ? 'archive' : 'archive-outline';
            } else if (route.name === 'Mentions') {
              iconName = focused ? 'chatbox' : 'chatbox-outline';
            }
            const calculatedSize = focused ? 25 : 20;

            return <Icon name={iconName} size={calculatedSize} color={color} />;
          },
          tabBarActiveTintColor: '#FF3131',
          tabBarInactiveTintColor: '#FF3131',
          tabBarStyle: styles.tabBarStyle,
          tabBarShowLabel: false,
          headerShown: false,
          tabBarIndicatorStyle: {
            backgroundColor: '#FF3131',
            height: 2,
          },
        })}>
        <Tab.Screen name="Posts" component={PostUsers} />
        <Tab.Screen name="Mentions" component={Mentions} />
      </Tab.Navigator>
    </ScrollView>
  );
}

const isCloseToBottom = ({layoutMeasurement, contentOffset, contentSize}) => {
  const paddingToBottom = 20;
  return (
    layoutMeasurement.height + contentOffset.y >=
    contentSize.height - paddingToBottom
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  tabBarStyle: {
    elevation: 0,
    backgroundColor: '#1a1a1a',
    height: 70,
    justifyContent: 'center',
    borderRadius: 10,
    margin: 10,
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: 'black',
    marginBottom: 100,
  },
  create_community_btn: {
    width: '100%',
    backgroundColor: '#1a1a1a',
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
    borderRadius: 5,
  },
  textStyleCancel: {
    color: '#FF3131',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 16,
  },
  create_community_text: {
    color: 'white',
    fontSize: 20,
    borderRadius: 10,
  },
  profile_pic: {
    width: 90,
    height: 90,
    borderRadius: 75,
    alignSelf: 'center',
  },
  info_container: {
    padding: 20,
    justifyContent: 'space-evenly',
    gap: 10,
    width: '100%',
  },
  name: {
    fontSize: 17,
    color: 'white',
  },
  name_container: {
    padding: 10,
    width: '100%',
    borderRadius: 2,
    backgroundColor: '#1a1a1a',
    borderRadius: 5,
  },
  email_container: {
    width: '100%',
    padding: 10,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#1a1a1a',
    borderRadius: 5,
  },
  email: {
    fontSize: 17,
    color: '#FF3131',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
  signout_btn: {
    padding: 10,
    backgroundColor: '#FF3131',
    width: '50%',
    alignItems: 'center',
    borderColor: 'white',
    borderWidth: 0.3,
  },
  signouttxt: {
    color: 'white',
    fontSize: 17,
    borderRadius: 10,
  },
  edit_btn: {
    padding: 10,
    backgroundColor: '#1a1a1a',
    width: '50%',
    alignItems: 'center',
  },
  edit: {
    color: '#FF3131',
    fontSize: 17,
    borderRadius: 10,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderWidth: 0.7,
    borderColor: 'grey',
  },
  modalContent: {
    backgroundColor: 'black',
    borderRadius: 5,
    padding: 20,
  },
  modalText: {
    color: 'white',
    fontSize: 18,
    marginBottom: 15,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  button: {
    padding: 10,
    borderRadius: 5,
  },
  buttonClose: {
    backgroundColor: '#1a1a1a',
  },
  buttonSignOut: {
    backgroundColor: '#FF3131',
  },
  textStyle: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 16,
  },
});
