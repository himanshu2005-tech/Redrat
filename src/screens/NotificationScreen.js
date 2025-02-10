import React, { useEffect, useState, useCallback } from 'react';
import {
  Text,
  View,
  StyleSheet,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  Modal,
  TouchableOpacity,
  ScrollView
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import {
  formatDistanceToNowStrict,
  isToday,
  isYesterday,
  isThisWeek,
  isThisMonth,
  isThisYear,
} from 'date-fns';
import color from './color';
import {SharedElement} from 'react-navigation-shared-element';

export default function NotificationScreen({ navigation }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [blockedBy, setBlockedBy] = useState([])

  useEffect(() => {
    const userId = auth().currentUser?.uid;
    if (!userId) return;
  
    const unsubscribe = firestore()
      .collection('Users')
      .doc(userId)
      .onSnapshot(doc => {
        const data = doc.data();
        setBlockedUsers(data?.blockedUsers || []);
        setBlockedBy(data?.blockedBy || [])
      });
  
    return () => unsubscribe();
  }, []);
  
  useEffect(() => {
    const updateLastVisited = async () => {
      try {
        const userId = auth().currentUser?.uid;
        if (!userId) {
          console.warn('User not authenticated.');
          return;
        }

        await firestore()
          .collection('Users')
          .doc(userId)
          .update({
            lastNotificationsVisited: firestore.FieldValue.serverTimestamp(),
          });
      } catch (error) {
        console.warn('Error updating lastVisited:', error);
      }
    };

    updateLastVisited();
  }, [navigation]);

  const fetchNotifications = async () => {
    const userId = auth().currentUser?.uid;
    if (!userId) return;

    try {
      const notificationsSnapshot = await firestore()
        .collection('Users')
        .doc(userId)
        .collection('Notifications')
        .orderBy('lastUpdated', 'desc')
        .limit(50)
        .get();

      const notificationsData = [];
      for (const doc of notificationsSnapshot.docs) {
        const notification = doc.data();

        if (notification.type === 'like' && Array.isArray(notification.likedBy)) {
          const filteredUsers = notification.likedBy.filter(
            userId => !blockedUsers.includes(userId) && !blockedBy.includes(userId)
          );

          if (filteredUsers.length > 0) {
            const userPromises = filteredUsers.map(async userId => {
              const userSnapshot = await firestore()
                .collection('Users')
                .doc(userId)
                .get();
              return { id: userId, ...userSnapshot.data() };
            });

            const usersData = await Promise.all(userPromises);
            notificationsData.push({
              id: doc.id,
              ...notification,
              users: usersData,
            });
          }
        } else if (
          notification.type === 'follow' &&
          notification.followedBy &&
          !blockedUsers.includes(notification.followedBy)
        ) {
          const userSnapshot = await firestore()
            .collection('Users')
            .doc(notification.followedBy)
            .get();
          const requesterData = userSnapshot.data();
          notificationsData.push({
            id: doc.id,
            ...notification,
            user: { id: notification.followedBy, ...requesterData },
          });
        }
      }
      setNotifications(notificationsData);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [blockedUsers]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchNotifications();
  }, [blockedUsers]);

  const deleteNotification = async notificationId => {
    const userId = auth().currentUser?.uid;
    if (!userId || !notificationId) return;

    try {
      await firestore()
        .collection('Users')
        .doc(userId)
        .collection('Notifications')
        .doc(notificationId)
        .delete();
      setNotifications(prev =>
        prev.filter(notif => notif.id !== notificationId)
      );
    } catch (error) {
      console.error('Error deleting notification:', error);
    } finally {
      setModalVisible(false);
    }
  };

  const groupedNotifications = notifications.reduce((grouped, item) => {
    const lastUpdated = new Date(item.lastUpdated.seconds * 1000);

    if (isToday(lastUpdated)) {
      grouped.today.push(item);
    } else if (isYesterday(lastUpdated)) {
      grouped.yesterday.push(item);
    } else if (isThisWeek(lastUpdated)) {
      grouped.thisWeek.push(item);
    } else if (isThisMonth(lastUpdated)) {
      grouped.lastMonth.push(item);
    } else if (isThisYear(lastUpdated)) {
      grouped.thisYear.push(item);
    } else {
      grouped.earlier.push(item);
    }

    return grouped;
  }, {
    today: [],
    yesterday: [],
    thisWeek: [],
    lastMonth: [],
    thisYear: [],
    earlier: [],
  });

  if(notifications.length == 0){
    return (
      <View style={{backgroundColor: 'black', flex: 1, alignItems: 'center', justifyContent: 'center'}}>
        <Text style={{color: 'grey', fontSize: 15}}>No Notifications </Text>
      </View>
    )
  }
  const renderItem = ({ item }) => {
    const lastUpdated = item.lastUpdated
      ? new Date(item.lastUpdated.seconds * 1000).toLocaleString()
      : '';

    let notificationMessage = '';
    let profilePicUri = '';

    if (item.type === 'like') {
      const users = item.users || [];
      profilePicUri = users[0]?.profile_pic || '';
      if (users.length === 1) {
        notificationMessage = `${users[0].name} liked your post.`;
      } else if (users.length > 1) {
        notificationMessage = `${users[0].name} and ${
          users.length - 1
        } others liked your post.`;
      }
    } else if (item.type === 'follow') {
      profilePicUri = item.user?.profile_pic || '';
      notificationMessage = `${item.user.name} has sent you a follow request.`;
    }

    return (
      <Pressable
        onLongPress={() => {
          setSelectedNotification(item);
          setModalVisible(true);
        }}
        onPress={() => {
          if (item.type === 'like') {
            navigation.navigate('PostExpand', {
              post_id: item.post_id,
              network_id: item.network_id,
            });
          } else if (item.type === 'follow') {
            navigation.navigate('UserProfile', {
              id: item.user?.id,
            });
          }
        }}
      >
        <View style={styles.notificationItem}>
          <Image source={{ uri: profilePicUri }} style={styles.profilePic} />
          <View style={{ flex: 1 }}>
            <Text style={styles.notificationText}>{notificationMessage}</Text>
            <Text style={styles.timestamp}>
              {formatDistanceToNowStrict(
                new Date(item.lastUpdated.seconds * 1000)
              )}{' '}
              ago
            </Text>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: 'black' }}>
      <View style={styles.header}>
        <Text style={styles.title}>Notifications</Text>
      </View>
      {loading ? (
        <ActivityIndicator size="small" color={color} />
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          ListFooterComponent={() => (
              <View style={{height: 300}} />
            )
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[color]}
              tintColor={color}
            />
          }
        />
      )}
      {selectedNotification && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalView}>
              <Text style={styles.modalText}>
                Are you sure you want to delete this notification?
              </Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.button, { backgroundColor: "#1a1a1a" }]}

                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.button}
                  onPress={() =>
                    deleteNotification(selectedNotification.id)
                  }
                >
                  <Text style={styles.buttonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: 'black',
    width: '100%',
    padding: 5,
    margin: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  title: {
    fontSize: 24,
    color: color,
    marginLeft: 10,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  profilePic: {
    width: 40,
    height: 40,
    borderRadius: 25,
    marginRight: 10,
  },
  notificationText: {
    color: 'white',
    fontSize: 16,
  },
  timestamp: {
    color: 'gray',
    fontSize: 12,
    marginTop: 4,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    width: '80%',
    backgroundColor: 'black',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  modalText: {
    color: 'white',
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  button: {
    flex: 1,
    marginHorizontal: 10,
    padding: 10,
    backgroundColor: color,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
  },
});
