import React, { useEffect, useState } from 'react';
import { Text, View, Image, StyleSheet, Pressable, Dimensions, TouchableOpacity, ImageBackground, Animated } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';
import Bluing from '../texting/Bluing';
import {SharedElement} from 'react-navigation-shared-element';

const { height, width } = Dimensions.get("window");

export default function NetworkDisplaySuggestion({ network_id, isPicture }) {
  const [networkData, setNetworkData] = useState(null);
  const [adminProfilePic, setAdminProfilePic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fadeAnim] = useState(new Animated.Value(0)); 
  const [slideAnim] = useState(new Animated.Value(-50)); 
  const [scaleAnim] = useState(new Animated.Value(1)); 
  const navigation = useNavigation();

  useEffect(() => {
    const fetchNetworkData = async () => {
      try {
        const networkDoc = await firestore()
          .collection('Network')
          .doc(network_id)
          .get();
        if (networkDoc.exists) {
          const networkData = networkDoc.data();
          setNetworkData(networkData);

          const adminDoc = await firestore()
            .collection('Users')
            .doc(networkData.admin)
            .get();
          if (adminDoc.exists) {
            setAdminProfilePic(adminDoc.data().profile_pic);
          } else {
            console.warn('Admin user document does not exist');
          }
        } else {
          console.warn('Network document does not exist');
        }
      } catch (error) {
        console.error('Error fetching network or admin data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNetworkData();
  }, [network_id]);

  useEffect(() => {
    if (!loading && networkData) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();

      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  }, [loading, networkData]);

  const handleProfilePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 1.1,
      useNativeDriver: true,
    }).start();
  };

  const handleProfilePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  if (loading) {
    return (
      null
    );
  }

  if (loading && isPicture) {
    return (
      <SkeletonPlaceholder backgroundColor="#3A3A3A" style={styles.pictureSkeleton}>
        <View style={styles.skeletonProfilePic} />
      </SkeletonPlaceholder>
    );
  }

  if (!networkData) {
    return null;
  }

  if (isPicture) {
    return (
      <Pressable
        style={styles.profilePicWrapper}
        onPress={() => {
          navigation.navigate('Network', { networkId: network_id });
        }}
        onPressIn={handleProfilePressIn}
        onPressOut={handleProfilePressOut}
      >
        <Animated.Image
          source={{ uri: networkData.profile_pic }}
          style={[styles.profilePic, { transform: [{ scale: scaleAnim }] }]}
        />
      </Pressable>
    );
  }

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => navigation.navigate('Network', { networkId: network_id })}
    >
        <Animated.View style={[styles.contentWrapper, { opacity: fadeAnim, transform: [{ translateX: slideAnim }] }]}>
          <Image source={{ uri: networkData.profile_pic }} style={styles.profilePic} />
          <View style={styles.textContainer}>
            <Text style={styles.networkName}>{networkData.network_name}</Text>
            <Bluing text={networkData.bio} style={styles.networkBio} />
          </View>
        </Animated.View>
      {!isPicture && <Text style={styles.networkType}>{networkData.network_type}</Text>}
      <Text style={{position: 'absolute', color:'white', right: 10, bottom: 10}}>{networkData.joined}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: width - 20,
    alignSelf: 'center'
  },
  skeletonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  skeletonProfilePic: {
    width: 40,
    height: 40,
    borderRadius: 50,
    marginLeft: 10,
  },
  skeletonTextContainer: {
    justifyContent: 'space-evenly',
    marginLeft: 10,
  },
  skeletonName: {
    width: 120,
    height: 20,
    borderRadius: 4,
  },
  skeletonBio: {
    width: 200,
    height: 15,
    borderRadius: 4,
    marginTop: 6,
  },
  pictureSkeleton: {
    margin: 10,
  },
  profilePicWrapper: {
    alignSelf: 'center',
    alignItems: 'center',
  },
  profilePic: {
    height: 38,
    width: 38,
    borderRadius: 50,
    marginLeft: 10,
    alignSelf: 'flex-start'
  },
  container: {
    width: width - 10,
    backgroundColor: 'black',
    borderRadius: 10,
    marginHorizontal: 5,
    marginBottom: 10,
    overflow: 'hidden',
    paddingVertical: 10,
    borderColor: "#1a1a1a",
    borderWidth: 1
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    justifyContent: 'space-between',
    paddingVertical: 15,
    minHeight: 100
  },
  contentWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    width: '90%',
  },
  textContainer: {
    justifyContent: 'center',
    marginLeft: 10,
  },
  networkName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  networkBio: {
    fontSize: 14,
    color: 'white',
    maxWidth: "90%"
  },
  networkType: {
    fontSize: 15,
    color: 'white',
    position: 'absolute',
    top: 15,
    right: 10,
  },
});

