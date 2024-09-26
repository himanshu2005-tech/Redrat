import React, { useState, useEffect, useRef } from 'react';
import {
  Text,
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Pressable,
  ActivityIndicator,
  PanResponder
} from 'react-native';
import HomeScreen from './HomeScreen';
import Chats from './Chats';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

const TABS = ['Posts', 'Chats'];

export default function Home() {
  const [activeTab, setActiveTab] = useState(0);
  const [hasRequests, setHasRequests] = useState(false);
  const [loading, setLoading] = useState(true);
  const scrollViewRef = useRef(null);
  const navigation = useNavigation();

  useEffect(() => {
    const unsubscribe = firestore()
      .collection('Users')
      .doc(auth().currentUser.uid)
      .collection('Requests')
      .onSnapshot(snapshot => {
        setHasRequests(!snapshot.empty);
        setLoading(false);
      }, error => {
        console.error("Error fetching requests: ", error);
        setLoading(false);
      });

    return () => unsubscribe();
  }, []);

  const handleTabPress = index => {
    setActiveTab(index);
    scrollViewRef.current.scrollTo({
      x: index * Dimensions.get('window').width,
      animated: true,
    });
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (event, gestureState) => {
      const { dx } = gestureState;
      if (Math.abs(dx) > 50) {
        const newIndex = dx > 0 ? activeTab - 1 : activeTab + 1;
        if (newIndex >= 0 && newIndex < TABS.length) {
          handleTabPress(newIndex);
        }
      }
    },
  });

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#FF3131" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.header}>
        <Text style={styles.title}>redrat</Text>
        {hasRequests && (
          <Pressable
            style={{ position: 'absolute', right: 10 }}
            onPress={() => navigation.navigate("Request")}
          >
            <Icon name="albums" size={28} color="#FF3131" />
          </Pressable>
        )}
      </View>
      <View style={styles.tabBar}>
        {TABS.map((tab, index) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tabItem,
              activeTab === index ? styles.activeTabItem : null,
            ]}
            onPress={() => handleTabPress(index)}
          >
            <Text
              style={[
                styles.tabLabel,
                activeTab === index ? styles.activeTabLabel : null,
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        {...panResponder.panHandlers}
      >
        {TABS.map((tab, index) => (
          <View key={tab} style={{ width: Dimensions.get('window').width }}>
            {index === 0 && <HomeScreen />}
            {index === 1 && <Chats />}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: 'black',
    width: '100%',
    padding: 8,
    borderColor: '#ccc',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 30,
    color: '#FF3131',
    textAlign: 'center',
    letterSpacing: 1,
    fontFamily: 'title3',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'black',
    borderColor: '#ccc',
    justifyContent: 'space-around',
    paddingVertical: 10,
  },
  tabItem: {
    paddingHorizontal: 30,
    paddingVertical: 5,
  },
  activeTabItem: {
    borderBottomColor: '#FF3131',
    borderBottomWidth: 1.5,
  },
  tabLabel: {
    fontSize: 14,
    color: 'white',
    fontWeight: '400',
  },
  activeTabLabel: {
    color: '#FF3131',
    fontWeight: 'bold',
    fontSize: 18,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
