import React, {useEffect, useState} from 'react';
import {Text, View, Image, StyleSheet, Pressable} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import {useNavigation} from '@react-navigation/native';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';
import {SharedElement} from 'react-navigation-shared-element';

export default function NetworkDisplay({network_id, isPicture}) {
  const [networkData, setNetworkData] = useState(null);
  const [adminProfilePic, setAdminProfilePic] = useState(null);
  const [loading, setLoading] = useState(true);
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

  
  if (loading) {
    return (
      <SkeletonPlaceholder backgroundColor="#3A3A3A">
        <View style={styles.container}>
          <View style={styles.leftContainer}>
            <View style={styles.profilePic} />
            <View style={styles.textContainer}>
              <View style={styles.skeletonName} />
              <View style={styles.skeletonBio} />
            </View>
          </View>
        </View>
      </SkeletonPlaceholder>
    );
  }

  if (loading && isPicture) {
    return (
      <SkeletonPlaceholder backgroundColor="#3A3A3A" style={{margin: 10}}>
        <View style={styles.profilePic} />
      </SkeletonPlaceholder>
    );
  }

  if (!networkData) {
    return null;
  }

  if (isPicture) {
    return (
      <Pressable
        style={{alignSelf: 'center', alignItems: 'center'}}
        onPress={() => {
          navigation.navigate('Network', {
            networkId: network_id,
          });
        }}>
        <Image
          source={{uri: networkData.profile_pic}}
          style={
            isPicture
              ? {height: 38, width: 38, borderRadius: 50}
              : styles.profilePic
          }
        />
      </Pressable>
    );
  }

  return (
    <Pressable
      style={styles.container}
      onPress={() =>
        navigation.navigate('Network', {
          networkId: network_id,
        })
      }>
      <View style={styles.leftContainer}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 5,
            width: '90%',
          }}>
          <Image
            source={{uri: networkData.profile_pic}}
            style={styles.profilePic}
          />
          <View style={styles.textContainer}>
            <Text style={styles.networkName}>{networkData.network_name}</Text>
            <Text
              style={styles.networkBio}
              numberOfLines={1}
              ellipsizeMode="tail">
              {networkData.bio}
            </Text>
          </View>
        </View>
      </View>
      {!isPicture && (
        <Text style={styles.networkType}>{networkData.network_type}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '100%',
    padding: 10,
    backgroundColor: 'black',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    justifyContent: 'space-between',
  },
  profilePic: {
    width: 40,
    height: 40,
    borderRadius: 50,
  },
  textContainer: {
    justifyContent: 'space-evenly',
    marginLeft: 10,
  },
  networkName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  networkBio: {
    fontSize: 13,
    color: 'grey',
    maxWidth: "95%"
  },
  networkType: {
    fontSize: 15,
    color: 'gray',
    right: 10,
    position: 'absolute',
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
  skeletonType: {
    width: 80,
    height: 15,
    borderRadius: 4,
  },
});
