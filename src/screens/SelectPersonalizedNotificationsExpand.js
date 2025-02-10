import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import color from './color';
import firestore from '@react-native-firebase/firestore';
import { Switch } from './Switch';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TouchableOpacity } from 'react-native-gesture-handler';
import auth from '@react-native-firebase/auth'
import {SharedElement} from 'react-navigation-shared-element';

const SelectPersonalizedNotificationsExpand = ({ navigation, route }) => {
  const { network_id, subtopic } = route.params;
  const [isSubscribed, setIsSubscribed] = useState(false);

  const currentUserId = auth().currentUser.uid
  useEffect(() => {
    const fetchSubscriptionStatus = async () => {
      if (!currentUserId) return;

      try {
        const userSubscriptionData = await firestore()
          .collection('Network')
          .doc(network_id)
          .collection('Subscriptions')
          .doc(currentUserId)
          .get();

        if (userSubscriptionData.exists) {
          const topics = userSubscriptionData.data()?.topics || [];
          setIsSubscribed(topics.includes(subtopic));
        }
      } catch (error) {
        console.warn('Error fetching subscription status:', error);
      }
    };

    fetchSubscriptionStatus();
  }, [currentUserId, network_id, subtopic]);

  const onSubscribe = async () => {
    if (!currentUserId) {
      console.warn('FCM Token not available.');
      return;
    }

    try {
      const update = isSubscribed
        ? firestore.FieldValue.arrayRemove(subtopic)
        : firestore.FieldValue.arrayUnion(subtopic);

      await firestore()
        .collection('Network')
        .doc(network_id)
        .collection('Subscriptions')
        .doc(currentUserId)
        .set(
          { topics: update },
          { merge: true }
        );

      setIsSubscribed(!isSubscribed);
    } catch (error) {
      console.warn('Error updating subscription:', error);
    }
  };

  return (
    <View style={{ backgroundColor: 'black', flex: 1 }}>
      <View
        style={{
          flexDirection: 'row',
          padding: 10,
          gap: 7,
          alignItems: 'center',
        }}
      >
        <Icon
          name="chevron-back"
          size={28}
          color={color}
          onPress={() => navigation.goBack()}
        />
        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 18 }}>
          {subtopic}
        </Text>
      </View>
      <View
        style={{
          padding: 10,
          flexDirection: 'row',
          justifyContent: 'space-between',
        }}
      >
        <View>
          <Text style={{ color: 'white', fontSize: 15 }}>
            Subscribe to {subtopic}
          </Text>
          <Text style={{ color: 'grey', fontSize: 12 }}>
            Notify Posts added on {subtopic}
          </Text>
        </View>
        <Switch value={isSubscribed} onPress={onSubscribe} />
      </View>
    </View>
  );
};

export default SelectPersonalizedNotificationsExpand;
