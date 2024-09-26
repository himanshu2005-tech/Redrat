import React, { useEffect, useState } from 'react';
import { Text, View, Image, StyleSheet, Pressable } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';

export default function NetworkDisplay({ network_id }) {
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
          <View style={styles.skeletonType} />
        </View>
      </SkeletonPlaceholder>
    );
  }

  if (!networkData) {
    return null;
  }

  return (
    <Pressable
      style={styles.container}
      onPress={() =>
        navigation.navigate('Network', {
          networkId: network_id,
        })
      }
    >
      <View style={styles.leftContainer}>
        <Image source={{ uri: networkData.profile_pic }} style={styles.profilePic} />
        <View style={styles.textContainer}>
          <Text style={styles.networkName}>{networkData.network_name}</Text>
          <Text style={styles.networkBio}>{networkData.bio}</Text>
        </View>
      </View>
      <Text style={styles.networkType}>{networkData.network_type}</Text>
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
    padding: 16,
    backgroundColor: 'black',
    alignItems: 'center',
    borderRadius: 3,
    borderBottomWidth: 0.4,
    borderColor: '#ccc',
    shadowColor: '#000',
    flexDirection: 'row',
    justifyContent: 'space-between',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 2,
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  profilePic: {
    width: 50,
    height: 50,
    borderRadius: 50,
  },
  textContainer: {
    justifyContent: 'center',
  },
  networkName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  networkBio: {
    fontSize: 16,
    color: 'white',
  },
  networkType: {
    fontSize: 15,
    color: 'gray',
    marginRight: 10,
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
