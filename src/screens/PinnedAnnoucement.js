import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import Bluing from '../texting/Bluing';
import color from './color';
import {SharedElement} from 'react-navigation-shared-element';

const {width} = Dimensions.get('screen');
const formatTimestamp = timestamp => {
  if (!timestamp) return '';

  const date = new Date(timestamp.seconds * 1000);
  const options = {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  };

  return new Intl.DateTimeFormat('en-US', options).format(date);
};

const PinnedAnnouncement = ({network_id, announcement_id}) => {
  const [announcement, setAnnouncement] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const currentUserId = auth().currentUser.uid;

  useEffect(() => {
    const fetchAnnouncement = async () => {
      try {
        const announcementDoc = await firestore()
          .collection('Network')
          .doc(network_id)
          .collection('Panel')
          .doc(announcement_id)
          .get();

        if (announcementDoc.exists) {
          setAnnouncement({id: announcementDoc.id, ...announcementDoc.data()});
        }

        const networkDoc = await firestore()
          .collection('Network')
          .doc(network_id)
          .get();

        if (networkDoc.exists) {
          const networkData = networkDoc.data();
          setIsAdmin(networkData.admin === currentUserId);
          setIsPinned(
            networkData.pinnedAnnouncements?.includes(announcement_id),
          );
        }
      } catch (error) {
        console.error('Error fetching announcement or network details:', error);
      }
    };

    fetchAnnouncement();
  }, [network_id, announcement_id, currentUserId]);

  const togglePin = () => {
    const newPinStatus = !isPinned;
    setIsPinned(!isPinned)

    const networkRef = firestore().collection('Network').doc(network_id);
    if (newPinStatus) {
      networkRef.update({
        pinnedAnnouncements: firestore.FieldValue.arrayUnion(announcement_id),
      });
    } else {
      networkRef.update({
        pinnedAnnouncements: firestore.FieldValue.arrayRemove(announcement_id),
      });
    }
  };

  if (!announcement) {
    return null;
  }

  return (
    <View style={styles.announcementContainer}>
      <Bluing text={announcement.message} style={styles.announcementText} />
      <Text style={styles.timestamp}>
        {formatTimestamp(announcement.timestamp)}
      </Text>

      {isAdmin && (
        <TouchableOpacity style={styles.pinButton} onPress={togglePin}>
          <Text style={styles.pinButtonText}>{isPinned ? 'Unpin' : 'Pin'}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  announcementContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    padding: 20,
    marginBottom: 10,
    width: width - 10,
    marginTop: 10,
    alignSelf: 'center',
  },
  announcementText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  timestamp: {
    color: '#ccc',
    fontSize: 12,
    marginTop: 5,
    textAlign: 'right',
  },
  pinButton: {
    marginTop: 10,
    backgroundColor: color,
    borderRadius: 10,
    padding: 5,
    alignItems: 'center',
  },
  pinButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default PinnedAnnouncement;
