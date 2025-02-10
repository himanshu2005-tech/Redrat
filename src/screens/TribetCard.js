import React, {useState, useEffect} from 'react';
import {Text, View, Image, Pressable, ActivityIndicator} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import Bluing from '../texting/Bluing';
import {SharedElement} from 'react-navigation-shared-element';

export default function TribetCard({id}) {
  const [userDetails, setUserDetails] = useState({});
  const [loading, setLoading] = useState();
  const isFlipped = useSharedValue(0);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        const data = await firestore().collection('Users').doc(id).get();
        setUserDetails(data.data());
        setLoading(false);
      } catch (error) {
        console.warn(error);
        setLoading(false);
      }
    };

    fetchDetails();
  }, [id]);
  
  const RegularContent = () => (
    <LinearGradient
      colors={getGradientColors(userDetails.tribet || 0)}
      style={{
        padding: 10,
        borderRadius: 5,
        width: '100%',
        height: '100%',
      }}>
      <View style={{justifyContent: 'flex-start'}}>
        <Text
          style={{
            fontSize: 23,
            color: '#fff',
            letterSpacing: 3,
            fontWeight: 'bold',
          }}>
          TRIBET CARD
        </Text>
        <Text style={{fontSize: 18, color: 'white'}}>redrat</Text>
      </View>

      <View
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.15)',
          padding: 10,
          borderRadius: 5,
          marginTop: 6,
          flexDirection: 'row',
          alignItems: 'center',
        }}>
        <Image
          source={{uri: userDetails.profile_pic}}
          style={{height: 50, width: 50, borderRadius: 10}}
        />
        <View
          style={{
            marginLeft: 10,
            alignItems: 'flex-start',
            justifyContent: 'space-evenly',
          }}>
          <Text style={{color: 'white', fontSize: 15, fontWeight: 'bold'}}>
            {userDetails.name}
          </Text>
        </View>
      </View>

      <View
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.15)',
          padding: 10,
          borderRadius: 5,
          marginTop: 6,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
        <Text style={{color: 'white', fontSize: 15, fontWeight: 'bold'}}>
          Tribet Score
        </Text>
        <Text style={{color: 'white', fontSize: 15}}>{userDetails.tribet}</Text>
      </View>

      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginTop: 6,
        }}>
        <Text style={{color: 'white', fontSize: 13}}>
          {formatTimestamp(userDetails.joined_on)}
        </Text>
        <Text style={{color: 'white', fontSize: 13}}>
          {formatDate(userDetails.joined_on)}
        </Text>
      </View>
    </LinearGradient>
  );

  const FlippedContent = () => (
    <LinearGradient
      colors={getGradientColors(userDetails.tribet || 0)}
      style={{
        padding: 10,
        borderRadius: 5,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
      }}>
      <Text
        style={{
          letterSpacing: 5,
          color: 'white',
          fontSize: 30,
          textAlign: 'center',
          fontWeight: 'bold',
        }}>
        TRIBET
      </Text>
    </LinearGradient>
  );

  const formatTimestamp = timestamp => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    const formattedTime = date.toLocaleTimeString();
    return `${formattedTime}`;
  };

  const formatDate = timestamp => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    const formattedDate = date.toLocaleDateString();
    return `${formattedDate}`;
  };

  const getGradientColors = score => {
    if (score < 500) {
      return ['#FF6347', '#FFA500'];
    } else if (score < 1500) {
      return ['#FFD700', '#32CD32'];
    } else {
      return ['#8A2BE2', '#FFD700'];
    }
  };

  const regularCardStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(isFlipped.value, [0, 1], [0, 180]);
    return {
      transform: [{rotateY: `${rotateY}deg`}],
      backfaceVisibility: 'hidden',
    };
  });

  const flippedCardStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(isFlipped.value, [0, 1], [180, 360]);
    return {
      transform: [{rotateY: `${rotateY}deg`}],
      backfaceVisibility: 'hidden',
      position: 'absolute',
    };
  });

  const handlePress = () => {
    isFlipped.value = withTiming(isFlipped.value === 0 ? 1 : 0, {
      duration: 500,
    });
  };

  return (
    <Pressable style={{width: '100%', height: 250}} onPress={handlePress}>
      <Animated.View
        style={[
          {
            width: '100%',
            height: '100%',
            position: 'absolute',
          },
          regularCardStyle,
        ]}>
        {RegularContent()}
      </Animated.View>
      <Animated.View
        style={[
          {
            width: '100%',
            height: '100%',
            position: 'absolute',
          },
          flippedCardStyle,
        ]}>
        {FlippedContent()}
      </Animated.View>
    </Pressable>
  );
}
