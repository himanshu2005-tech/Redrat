import React, {useState, useEffect} from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Pressable,
  Image,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

const NetworkDisplay = ({
  network_id,
  onSelect,
  selected,
  subtopics,
  onSelectSubtopic,
}) => {
  const [networkData, setNetworkData] = useState(null);
  const [adminProfilePic, setAdminProfilePic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdminOnly, setIsAdminOnly] = useState(false);

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

          if (networkData.isAdminOnly && networkData.admin == auth().currentUser.uid) {
            setIsAdminOnly(true);
          }

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
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if(!isAdminOnly){
    return null;
  }
  if (!networkData) {
    return (
      <View style={styles.container}>
        <Text style={{color: 'white', fontWeight: 'bold'}}>
          Network deleted
        </Text>
      </View>
    );
  }

  return (
    <View>
      <Pressable
        style={[styles.container, selected ? styles.selected : null]}
        onPress={() => onSelect(network_id, networkData.network_name)}>
        <View style={styles.leftContainer}>
          <Image
            source={{uri: networkData.profile_pic}}
            style={styles.profilePic}
          />
          <View style={styles.textContainer}>
            <Text style={styles.networkName}>{networkData.network_name}</Text>
          </View>
        </View>
        <Text style={styles.networkType}>{networkData.network_type}</Text>
      </Pressable>
      {selected && (
        <View style={styles.subtopicsContainer}>
          <Text style={styles.subtopicsHeader}>Select Subtopics:</Text>
          {networkData.sub_topics.map(subtopic => (
            <Pressable
              key={subtopic}
              style={[
                styles.subtopic,
                subtopics.includes(subtopic) ? styles.selectedSubtopic : null,
              ]}
              onPress={() => onSelectSubtopic(network_id, subtopic)}>
              <Text style={styles.subtopicText}>{subtopic}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
};

export default function Repost({route, navigation}) {
  const {network_id, post, post_id} = route.params;
  const [networkIDs, setNetworkIDs] = useState([]);
  const [selectedNetworks, setSelectedNetworks] = useState({});
  const [selectedSubtopics, setSelectedSubtopics] = useState({});
  const [networkNames, setNetworkNames] = useState({});

  useEffect(() => {
    const fetchNetworkIDs = async () => {
      try {
        const data = await firestore()
          .collection('Users')
          .doc(auth().currentUser.uid)
          .get();
        setNetworkIDs(data.data().joined_networks || []);
      } catch (error) {
        console.warn(error);
      }
    };

    fetchNetworkIDs();
  }, []);

  const handleSelect = (id, name) => {
    setSelectedNetworks(prevSelected =>
      prevSelected[id]
        ? (() => {
            const newState = {...prevSelected};
            delete newState[id];
            return newState;
          })()
        : {...prevSelected, [id]: true},
    );

    setNetworkNames(prevNames => ({
      ...prevNames,
      [id]: name,
    }));
  };

  const handleSelectSubtopic = (network_id, subtopic) => {
    setSelectedSubtopics(prevSubtopics => {
      const networkSubtopics = prevSubtopics[network_id] || [];
      return {
        ...prevSubtopics,
        [network_id]: networkSubtopics.includes(subtopic)
          ? networkSubtopics.filter(st => st !== subtopic)
          : [...networkSubtopics, subtopic],
      };
    });
  };

  const handleRepost = async () => {
    try {
      for (const id of Object.keys(selectedNetworks)) {
        await firestore()
          .collection('Network')
          .doc(id)
          .collection('Posts')
          .add({
            title: post.title,
            information: post.information,
            selectedSubtopics: selectedSubtopics[id] || [],
            network_id: id,
            posted_by: auth().currentUser.uid,
            createdAt: firestore.FieldValue.serverTimestamp(),
            network_name: networkNames[id],
            imageUrls: post.imageUrls,
            reposted_from_network: post.network_name,
            reposted_network_id: network_id,
          });
      }
      alert('Reposted successfully!');
    } catch (error) {
      console.error('Error reposting:', error);
    }
    navigation.goBack();
  };

  return (
    <View style={{backgroundColor: 'black', flex: 1}}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Icon
            name="chevron-back"
            size={28}
            color="#FF3131"
            onPress={() => navigation.goBack()}
          />
          <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
            Reposting from {post.network_name}'s Network
          </Text>
        </View>
      </View>
      <FlatList
        data={networkIDs}
        keyExtractor={item => item}
        renderItem={({item}) =>
          item !== network_id ? (
            <NetworkDisplay
              network_id={item}
              onSelect={handleSelect}
              selected={!!selectedNetworks[item]}
              subtopics={selectedSubtopics[item] || []}
              onSelectSubtopic={handleSelectSubtopic}
            />
          ) : null
        }
      />

      <TouchableOpacity style={styles.repostButton} onPress={handleRepost}>
        <Text style={styles.repostButtonText}>Repost</Text>
      </TouchableOpacity>
    </View>
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
    width: '100%',
    gap: 10,
  },
  title: {
    color: '#FF3131',
    fontSize: 16,
    fontWeight: 'bold',
    maxWidth: '90%',
  },
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
    borderRadius: 3,
    borderWidth: 0.7,
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
    color: '#FF3131',
  },
  networkBio: {
    fontSize: 16,
    color: 'gray',
  },
  networkType: {
    fontSize: 15,
    color: 'gray',
    marginRight: 10,
  },
  selected: {
    backgroundColor: '#1a1a1a',
  },
  subtopicsContainer: {
    padding: 16,
    backgroundColor: 'black',
    borderRadius: 3,
  },
  subtopicsHeader: {
    fontSize: 16,
    color: '#FF3131',
    marginBottom: 10,
  },
  subtopic: {
    padding: 10,
    borderRadius: 5,
    marginVertical: 5,
    backgroundColor: '#1a1a1a',
  },
  selectedSubtopic: {
    backgroundColor: '#FF3131',
    borderColor: '#FF3131',
  },
  subtopicText: {
    color: 'white',
    fontWeight: 'bold',
  },
  repostButton: {
    backgroundColor: '#FFEDED',
    padding: 10,
    alignItems: 'center',
    marginBottom: 15,
    width: '80%',
    alignSelf: 'center',
    borderRadius: 15,
    marginTop: 10,
  },
  repostButtonText: {
    color: '#FF3131',
    fontWeight: 'bold',
    fontSize: 15,
  },
});
