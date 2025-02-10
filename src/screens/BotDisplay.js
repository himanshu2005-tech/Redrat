import React, {useState, useEffect} from 'react';
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';
import {useNavigation} from '@react-navigation/native';
import color from './color';
import {SharedElement} from 'react-navigation-shared-element';

export default function BotDisplay({botId, isActive, onToggle, isActivate}) {
  const navigation = useNavigation();
  const [botDetails, setBotDetails] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBotDetails = async () => {
      try {
        const data = await firestore().collection('Bots').doc(botId).get();
        setBotDetails(data.data());
      } catch (error) {
        console.warn(error);
      } finally {
        setLoading(false);
      }
    };
    fetchBotDetails();
  }, [botId]);

  if (loading) {
    return (
      <SkeletonPlaceholder>
        <View style={styles.container}>
          <View style={styles.profilePic} />
          <View style={styles.botNamePlaceholder} />
        </View>
      </SkeletonPlaceholder>
    );
  }

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() =>
        navigation.navigate('BotScreen', {
          botId: botId,
        })
      }>
      <View style={styles.profilePic}>
        <Text style={styles.initial}>
          {botDetails.Name ? botDetails.Name[0].toUpperCase() : '?'}
        </Text>
      </View>
      <Text style={styles.botName} ellipsizeMode="tail" numberOfLines={1}>
        {botDetails.Name}
      </Text>
      {isActivate && (
        <Pressable
          style={{
            backgroundColor: isActive ? 'grey' : color,
            padding: 10,
            marginTop: 10,
            borderRadius: 4,
            width: '90%',
            alignItems: 'center',
          }}
          onPress={onToggle}>
          <Text
            style={[
              styles.statusText,
              isActive ? styles.activeText : styles.inactiveText,
            ]}>
            {isActive ? 'Deactivate' : 'Activate'}
          </Text>
        </Pressable>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    margin: 5,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    alignItems: 'center',
    padding: 10,
  },
  profilePic: {
    padding: 10,
    borderRadius: 100,
    backgroundColor: color,
    justifyContent: 'center',
    alignItems: 'center',
    width: 60,
    height: 60,
  },
  initial: {
    color: 'white',
    textAlign: 'center',
    fontSize: 20,
  },
  botName: {
    textAlign: 'center',
    color: 'white',
    fontSize: 15,
    marginTop: 5,
  },
  statusText: {
    fontSize: 14,
  },
  activeText: {
    color: 'white',
  },
  inactiveText: {
    color: 'white',
  },
  botNamePlaceholder: {
    width: 80,
    height: 10,
    borderRadius: 4,
    marginTop: 5,
  },
});
