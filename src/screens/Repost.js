import React, {useState, useEffect} from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Pressable,
  Image,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import moment from 'moment';
import Post from './Post';
import updateTribet from './updateTribet';
import { splitString } from '../texting/textSplit';
import color from './color';
import {SharedElement} from 'react-navigation-shared-element';

const NetworkDisplay = ({
  network_id,
  onSelect,
  selected,
  subtopics,
  onSelectSubtopic,
}) => {
  const [networkData, setNetworkData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const fetchNetworkData = async () => {
      try {
        const networkDoc = await firestore()
          .collection('Network')
          .doc(network_id)
          .get();

        if (networkDoc.exists) {
          const data = networkDoc.data();
          setNetworkData(data);

          if (data.isAdminOnly && data.admin === auth().currentUser.uid) {
            setIsAuthorized(true);
          } else if (!data.isAdminOnly) {
            setIsAuthorized(true);
          }
        }
      } catch (error) {
        console.error('Error fetching network data:', error);
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

  if (!isAuthorized || !networkData) {
    return null;
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
            <Text style={styles.networkName}>{networkData.network_name}</Text>
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
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log('post_id', post_id);
    console.log('network_id', network_id);
  
    const fetchNetworkIDs = async () => {
      try {
        const data = await firestore()
          .collection('Users')
          .doc(auth().currentUser.uid)
          .collection("JoinedNetworks")
          .get();
  
        const networkSnapshot = data.docs.map(doc => doc.id);
        setNetworkIDs(networkSnapshot || []);
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
        if (!selectedSubtopics[id] || selectedSubtopics[id].length === 0) {
          alert(`No subtopics selected in ${networkNames[id]}`);
          return;
        }
      }
      setLoading(true);
      for (const id of Object.keys(selectedNetworks)) {
        const postRef = await firestore()
          .collection('Posts')
          .add({
            title: splitString(reply),
            selectedSubtopics: selectedSubtopics[id] || [],
            posted_by: auth().currentUser.uid,
            createdAt: firestore.FieldValue.serverTimestamp(),
            network_name: networkNames[id],
            repost_post_id: post_id,
            network_id: id,
            isRepost: true,
            savePoint: 0,
            likePoint: 0,
            viewPoint: 0,
            likeCount: 0
          });
        const new_post_id = postRef.id;
        await firestore()
          .collection('Users')
          .doc(auth().currentUser.uid)
          .collection('Posts')
          .add({
            post_id: new_post_id,
            createdAt: firestore.FieldValue.serverTimestamp(),
          });
        const rawInput = `${reply}`;
        const extractedHashes = rawInput.match(/#\w+/g) || [];
        const today = moment().format('YYYY-MM-DD');
        await updateTribet(auth().currentUser.uid, 20, `Reposted`);
        if (extractedHashes.length === 0) {
          navigation.goBack();
          setLoading(true);
          return;
        }
        const batch = firestore().batch();

        for (const hash of extractedHashes) {
          const hashRef = firestore().collection('HashTags').doc(hash);

          const hashDoc = await hashRef.get();
          const data = hashDoc.data();

          if (data?.lastUpdated !== today) {
            batch.set(
              hashRef,
              {
                countForToday: 1,
                [today]: firestore.FieldValue.increment(1),
                lastUpdated: today,
                totalUsed: firestore.FieldValue.increment(1),
              },
              {merge: true},
            );
          } else {
            batch.set(
              hashRef,
              {
                countForToday: firestore.FieldValue.increment(1),
                [today]: firestore.FieldValue.increment(1),
                totalUsed: firestore.FieldValue.increment(1),
              },
              {merge: true},
            );
          }
        }

        try {
          await batch.commit();
          console.log(`Updated usage for hashtags on ${today}`);
        } catch (error) {
          console.error('Error updating hashtags:', error);
        }
      }
      setLoading(false);
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
            color={color}
            onPress={() => navigation.goBack()}
          />
          <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
            Your Autorized Networks
          </Text>
        </View>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Add a comment..."
        placeholderTextColor="gray"
        value={reply}
        onChangeText={setReply}
      />

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

      {loading ? (
        <TouchableOpacity
          style={[
            styles.repostButton,
            {backgroundColor: !reply ? '#1a1a1a' : color},
          ]}
          disabled={true}>
          <ActivityIndicator size="small" color="white" />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[
            styles.repostButton,
            {backgroundColor: !reply ? '#1a1a1a' : color},
          ]}
          onPress={handleRepost}
          disabled={reply ? false : true}>
          <Text style={styles.repostButtonText}>
            {reply ? 'Repost' : 'Add a Reply'}
          </Text>
        </TouchableOpacity>
      )}
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
    paddingVertical: 10,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    alignItems: 'center',
    flexDirection: 'row',
    width: '100%',
    gap: 10,
  },
  title: {
    color: "white",
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
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profilePic: {
    width: 35,
    height: 35,
    borderRadius: 40,
    marginRight: 10,
  },
  textContainer: {
    marginTop: 5,
  },
  networkName: {
    color: color,
    fontSize: 16,
    fontWeight: 'bold',
  },
  networkBio: {
    color: 'grey',
    fontSize: 14,
    maxWidth: '90%',
  },
  networkType: {
    color: color,
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    position: 'absolute',
    right: 5,
  },
  selected: {
    backgroundColor: 'black',
    borderColor: color,
  },
  subtopicsContainer: {
    marginLeft: 10,
  },
  subtopicsHeader: {
    color: color,
    marginBottom: 5,
    fontSize: 16,
  },
  subtopic: {
    padding: 10,
    backgroundColor: '#1a1a1a',
    marginVertical: 5,
    borderRadius: 5,
  },
  selectedSubtopic: {
    backgroundColor: color,
  },
  subtopicText: {
    color: 'white',
    textAlign: 'center',
  },
  repostButton: {
    backgroundColor: color,
    padding: 15,
    borderRadius: 5,
    margin: 10,
    alignItems: 'center',
  },
  repostDisableButton: {
    backgroundColor: '#1a1a1a',
    padding: 15,
    borderRadius: 5,
    margin: 10,
    alignItems: 'center',
  },
  repostButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  input: {
    color: 'white',
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 10,
    margin: 10,
    borderRadius: 3,
  },
});
