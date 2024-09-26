import React, { useEffect, useState, useCallback } from 'react';
import { Text, View, StyleSheet, FlatList, Image, Pressable, RefreshControl, ActivityIndicator } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

export default function NotificationScreen({ navigation }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = async () => {
    const userId = auth().currentUser?.uid;
    if (!userId) {
      return;
    }

    try {
      const notificationsSnapshot = await firestore()
        .collection('Users')
        .doc(userId)
        .collection('Notifications')
        .get();

      const notificationsData = [];
      for (const doc of notificationsSnapshot.docs) {
        const notification = doc.data();
        const userSnapshot = await firestore()
          .collection('Users')
          .doc(notification.likedBy)
          .get();

        const userData = userSnapshot.data();
        notificationsData.push({
          id: doc.id,
          ...notification,
          user: userData,
        });
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
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchNotifications();
  }, []);

  const renderItem = ({ item }) => {
    const currentUser = auth().currentUser?.uid;
    const isCurrentUser = item.likedBy === currentUser;
    return (
      <Pressable
        onPress={() =>
          navigation.navigate('PostExpand', {
            post_id: item.post_id,
            network_id: item.network_id,
          })
        }>
        <View style={styles.notificationItem}>
          <Image
            source={{ uri: item.user.profile_pic }}
            style={styles.profilePic}
          />
          <Text style={styles.notificationText}>
            {isCurrentUser ? (
              <Text
                onPress={() =>
                  navigation.navigate('UserProfile', { id: item.likedBy })
                }>
                You liked the post.
              </Text>
            ) : (
              <>
                <Text
                  style={styles.userName}
                  onPress={() =>
                    navigation.navigate('UserProfile', { id: item.likedBy })
                  }>
                  {item.user.name}
                </Text>
                <Text style={{ color: 'white' }}> liked your post.</Text>
              </>
            )}
          </Text>
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
        <ActivityIndicator size="large" color="#FF3131" />
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#FF3131']}
              tintColor="#FF3131"
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: 'black',
    width: '100%',
    padding: 8,
    borderBottomWidth: 1,
    borderColor: '#1a1a1a',
    margin: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    color: '#FF3131',
    marginLeft: 10,
    textAlign: 'center',
    letterSpacing: 1,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 0.5,
    borderColor: '#ccc',
  },
  profilePic: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  notificationText: {
    fontSize: 16,
    color: 'white',
  },
  userName: {
    fontWeight: 'bold',
    color: 'white',
  },
});
