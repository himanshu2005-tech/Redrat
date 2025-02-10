import React, {useState, useEffect} from 'react';
import {
  Text,
  View,
  StyleSheet,
  Animated,
  Dimensions,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import Carousel from 'react-native-reanimated-carousel';
import {
  useSharedValue,
  withSpring,
  useAnimatedStyle,
} from 'react-native-reanimated';
import NetworkBadge from './NetworkBadge';
import color from './color';
import {SharedElement} from 'react-navigation-shared-element';

export default function NetworkSuggestions({ navigation}) {
  const [networkIds, setNetworkIds] = useState([]);

  const windowWidth = Dimensions.get('window').width;
  const windowHeight = Dimensions.get('window').height;

  useEffect(() => {
    const fetchTrendingNetworks = async () => {
      try {
        const snapshot = await firestore()
          .collection('Network')
          .orderBy('joined', 'desc')
          .limit(10)
          .get();

        const networks = snapshot.docs.map(doc => doc.id);
        setNetworkIds(networks);
      } catch (error) {
        console.warn(error);
      }
    };

    fetchTrendingNetworks();
  }, []);

  const scrollY = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: withSpring(scrollY.value > 100 ? 1 : 0.5),
    };
  });

  return (
    <View style={styles.container}>
      <Carousel
        loop
        width={windowWidth - 20}
        height={windowHeight / 2}
        autoPlay={true}
        data={networkIds}
        scrollAnimationDuration={2000}
        renderItem={({item}) => (
          <Pressable
            onPress={() =>
              navigation.navigate('Network', {
                networkId: item,
              })
            }>
            <Animated.View style={animatedStyle}>
              <NetworkBadge id={item} navigation={navigation} />
            </Animated.View>
          </Pressable>
        )}
      />

      {networkIds.length === 0 && (
        <ActivityIndicator size="small" color={color} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 20,
    paddingHorizontal: 10,
    width: '98%',
    margin: 10,
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  carouselItem: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: color,
    borderRadius: 10,
    padding: 10,
  },
  emptyText: {
    textAlign: 'center',
    color: color,
    fontSize: 16,
  },
});
