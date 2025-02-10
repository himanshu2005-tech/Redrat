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
  Dimensions,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import Icon from 'react-native-vector-icons/Ionicons';
import {useNavigation} from '@react-navigation/native';
import {createMaterialTopTabNavigator} from '@react-navigation/material-top-tabs';
import Bluing from '../texting/Bluing';
import ProfileTabs from './ProfileTabs';
import {FlatList} from 'react-native-gesture-handler';
import words from '../PredefinedWords';
import TribetCard from './TribetCard';
import color from './color';
import {SharedElement} from 'react-navigation-shared-element';

export default function ProfileScreen() {
  const user = auth().currentUser;
  const [userDetails, setUserDetails] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const navigation = useNavigation();

  const fetchUserDetails = () => {
    if (user) {
      const unsubscribe = firestore()
        .collection('Users')
        .doc(user.uid)
        .onSnapshot(
          userDoc => {
            if (userDoc.exists) {
              const data = userDoc.data();
              setUserDetails(data);
              setFollowingCount(
                Array.isArray(data?.following) ? data.following.length : 0,
              );
              setFollowersCount(
                Array.isArray(data?.followers) ? data.followers.length : 0,
              );
            } else {
              console.log('No user data found in Firestore');
            }
          },
          error => {
            console.error('Error fetching user data: ', error);
          },
        );
      return unsubscribe;
    }
  };

  useEffect(() => {
    const unsubscribe = fetchUserDetails();
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user, navigation]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchUserDetails();
  }, []);

  const onPush = async () => {
    try {
      await firestore().collection('Bots').doc('kgSpt39Ip2vB2u6v3vIs').update({
        predefinedData: words,
      });
    } catch (error) {
      console.warn(error);
    }
  };
  if (!userDetails) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={color} />
      </View>
    );
  }

  const Component = () => {
    return (
      <View style={{backgroundColor: 'black', width: '100%'}}>
        <View style={styles.info_container}>
          <Pressable
            style={styles.email_container}
            onPress={() =>
              navigation.navigate('UserDetails', {
                userDetails: userDetails,
              })
            }>
            <Text style={styles.email}>{userDetails.email}</Text>
          </Pressable>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
            <Image
              source={{uri: userDetails.profile_pic}}
              style={styles.profile_pic}
            />
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
              <Pressable
                style={{
                  alignItems: 'center',
                  backgroundColor: '#1a1a1a',
                  padding: 10,
                  borderRadius: 3,
                }}
                onPress={() =>
                  navigation.push('UserStatus', {
                    id: auth().currentUser.uid,
                    status: 'followers',
                  })
                }>
                <Text style={{color: 'white', fontSize: 18}}>Followers</Text>
                <Text style={{color: 'white', fontSize: 16}}>
                  {followersCount}
                </Text>
              </Pressable>
              <Pressable
                style={{
                  alignItems: 'center',
                  backgroundColor: '#1a1a1a',
                  padding: 10,
                  borderRadius: 3,
                }}
                onPress={() =>
                  navigation.push('UserStatus', {
                    id: auth().currentUser.uid,
                    status: 'following',
                  })
                }>
                <Text style={{color: 'white', fontSize: 18}}>Following</Text>
                <Text style={{color: 'white', fontSize: 16}}>
                  {followingCount}
                </Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.name_container}>
            <Text style={styles.name}>{userDetails.name}</Text>
          </View>
          <View
            style={{
              backgroundColor: 'black',
              width: '100%',
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
            {userDetails.tribet >= 500 ? (
              <View style={{gap: 10, width: '100%'}}>
                <Pressable
                  style={styles.create_community_btn}
                  onPress={() => navigation.navigate('Create')}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 10,
                    }}>
                    <Text style={styles.create_community_text}>
                      Create Your Network
                    </Text>
                    <Icon name="git-branch" size={25} color="white" />
                  </View>
                  <Icon name="chevron-forward" size={25} color="white" />
                </Pressable>
              </View>
            ) : null}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={{backgroundColor: 'black', flex: 1}}>
      <FlatList
        data={[1]}
        ListHeaderComponent={Component}
        ListFooterComponent={<ProfileTabs id={auth().currentUser.uid} />}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </View>
  );
}
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
    justifyContent: 'space-between',
    flexDirection: 'row',
    gap: 10,
    borderRadius: 5,
  },
  textStyleCancel: {
    color: color,
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 16,
  },
  create_community_text: {
    color: 'white',
    fontSize: 20,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
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
    fontWeight: 'bold',
  },
  name_container: {
    width: '100%',
    borderRadius: 2,
    backgroundColor: 'black',
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
    color: color,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
  signout_btn: {
    padding: 10,
    backgroundColor: color,
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
    color: color,
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
    backgroundColor: color,
  },
  textStyle: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 16,
  },
});
