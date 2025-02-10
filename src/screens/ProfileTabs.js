import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import PostUsers from './PostUsers';
import Mentions from './Mentions';
import color from './color';

export default function ProfileTabs({id}) {
  const [userDetails, setUserDetails] = useState(null);
  const [activeTab, setActiveTab] = useState('UserPosts');

  useEffect(() => {
    fetchUserDetails();
  }, [id]);

  const fetchUserDetails = async () => {
    try {
      const userDoc = await firestore().collection('Users').doc(id).get();
      if (userDoc.exists) {
        const data = userDoc.data();
        setUserDetails(data);
      } else {
        console.log('No user data found in Firestore');
      }
    } catch (error) {
      console.error('Error fetching user data: ', error);
    }
  };

  if (!userDetails) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={color} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Navigation Bar */}
      <View style={styles.navBar}>
        <Pressable
          style={[
            styles.navButton,
            activeTab === 'UserPosts' && styles.activeButton,
          ]}
          onPress={() => setActiveTab('UserPosts')}>
          <Text
            style={[
              styles.navText,
              activeTab === 'UserPosts' && styles.activeText,
            ]}>
            Posts
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.navButton,
            activeTab === 'Mentions' && styles.activeButton,
          ]}
          onPress={() => setActiveTab('Mentions')}>
          <Text
            style={[
              styles.navText,
              activeTab === 'Mentions' && styles.activeText,
            ]}>
            Mentions
          </Text>
        </Pressable>
      </View>

      {/* Content Section */}
      <View style={styles.content}>
        {activeTab === 'UserPosts' ? (
          <PostUsers id={id} />
        ) : (
          <Mentions id={id} />
        )}
      </View>

      {/* Placeholder Footer */}
      <View style={{height: 140, backgroundColor: 'black'}}></View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    paddingVertical: 5,
    marginHorizontal: 10,
    borderRadius: 5,
  },
  navButton: {
    paddingVertical: 10,
    width: '47%',
    borderRadius: 50, // Matches tab styles from your previous implementation
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  navText: {
    color: 'white',
    fontSize: 15,
    letterSpacing: 1,
  },
  activeButton: {
    backgroundColor: color,
  },
  activeText: {
    color: 'white',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
  content: {
    flex: 1,
    backgroundColor: 'black',
  },
});
