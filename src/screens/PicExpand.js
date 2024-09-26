import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Image,
  Text,
  Pressable,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { SharedElement } from 'react-navigation-shared-element';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import Bluing from '../texting/Bluing';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function PicExpand({ route, navigation }) {
  const { item, id, hash } = route.params;
  const [onlyPic, setOnlyPic] = useState(false);
  const [liked, setLiked] = useState(false);
  const [flagged, setFlagged] = useState(false);
  const imageHeight = useRef(new Animated.Value(300)).current;
  const currentUser = auth().currentUser.uid;

  const backgroundColor = useRef(new Animated.Value(0)).current; 

  const getFormattedDate = timestamp => {
    const date = timestamp.toDate();
    return date.toLocaleDateString();
  };

  useEffect(() => {
    const fetchLikeStatus = async () => {
      const hashDoc = await firestore()
        .collection('Hash')
        .doc(hash)
        .collection('Pictures')
        .doc(id)
        .get();
      if (hashDoc.exists) {
        const data = hashDoc.data();
        setLiked(data.liked?.includes(auth().currentUser?.uid));
      }
    };
    fetchLikeStatus();
  }, [id, currentUser]);

  useEffect(() => {
    const fetchFlagStatus = async () => {
      const hashDoc = await firestore()
        .collection('Hash')
        .doc(hash)
        .collection('Pictures')
        .doc(id)
        .get();
      if (hashDoc.exists) {
        const data = hashDoc.data();
        setFlagged(data.flagged?.includes(auth().currentUser?.uid));
      }
    };
    fetchFlagStatus();
  }, [id, currentUser]);

  const toggleLike = async () => {
    try {
      const hashRef = firestore()
        .collection('Hash')
        .doc(hash)
        .collection('Pictures')
        .doc(id);
      if (liked) {
        await hashRef.update({
          liked: firestore.FieldValue.arrayRemove(currentUser),
          likeCount: firestore.FieldValue.increment(-1),
        });
      } else {
        await hashRef.update({
          liked: firestore.FieldValue.arrayUnion(currentUser),
          likeCount: firestore.FieldValue.increment(1),
        });
      }
      setLiked(!liked);
    } catch (error) {
      console.log('Error toggling like: ', error);
    }
  };

  const toggleFlag = async () => {
    try {
      const hashRef = firestore()
        .collection('Hash')
        .doc(hash)
        .collection('Pictures')
        .doc(id);
      if (flagged) {
        await hashRef.update({
          flagged: firestore.FieldValue.arrayRemove(currentUser),
          flagCount: firestore.FieldValue.increment(-1),
        });
      } else {
        await hashRef.update({
          flagged: firestore.FieldValue.arrayUnion(currentUser),
          flagCount: firestore.FieldValue.increment(1),
        });
      }
      setFlagged(!flagged);
    } catch (error) {
      console.log('Error toggling flag: ', error);
    }
  };

  const onPicPressed = () => {
    Animated.timing(imageHeight, {
      toValue: onlyPic ? 300 : SCREEN_HEIGHT,
      duration: 800,
      easing: Easing.ease,
      useNativeDriver: false,
    }).start();
    setOnlyPic(!onlyPic);
  };

  const startBackgroundAnimation = () => {
    Animated.timing(backgroundColor, {
      toValue: 1,
      duration: 1000, 
      easing: Easing.linear,
      useNativeDriver: false,
    }).start(() => {
      toggleFlag(); 
      backgroundColor.setValue(1); 
    });
  };

  const cancelBackgroundAnimation = () => {
    backgroundColor.stopAnimation(); 
    backgroundColor.setValue(0); 
  };

  const animatedBackgroundColor = backgroundColor.interpolate({
    inputRange: [0, 1],
    outputRange: ['#1a1a1a', "#DD2476"], 
  });

  return (
    <View style={{ flex: 1, backgroundColor: 'black' }}>
      {!onlyPic && (
        <LinearGradient
          colors={['#FF512F', '#DD2476']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            padding: 10,
            position: 'absolute',
            top: 10,
            left: 10,
            zIndex: 1,
            borderRadius: 100,
          }}>
          <Icon name={'close'} size={30} color="white" onPress={() => navigation.goBack()} />
        </LinearGradient>
      )}

      <View>
        <SharedElement id={`pic.${id}.photo`}>
          <Pressable onPress={onPicPressed}>
            <Animated.Image
              source={{ uri: item.imageUri }}
              style={{ width: '100%', height: imageHeight }}
              resizeMode={onlyPic ? 'contain' : 'cover'}
            />
          </Pressable>
        </SharedElement>
      </View>

      <View
        style={{
          width: '95%',
          alignSelf: 'center',
          backgroundColor: '#1a1a1a',
          margin: 10,
          borderRadius: 10,
          alignItems: 'center',
        }}>
        <Bluing
          text={item.title}
          style={{
            color: 'white',
            textAlign: 'center',
            padding: 20,
            maxWidth: '60%',
          }}
        />
        <Text
          style={{
            color: 'grey',
            textAlign: 'center',
            padding: 10,
            bottom: 5,
            right: 5,
            position: 'absolute',
          }}>
          {item.createdAt ? getFormattedDate(item.createdAt) : 'No date available'}
        </Text>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-evenly' }}>
        <Pressable style={{ padding: 20, backgroundColor: '#1a1a1a', borderRadius: 5, marginTop: 10 }} onPress={toggleLike}>
          <Icon name={liked ? 'heart' : 'heart-outline'} size={30} color={liked ? '#FF3131' : 'white'} />
        </Pressable>
        <Pressable style={{ padding: 20, backgroundColor: '#1a1a1a', borderRadius: 5, marginTop: 10 }} onPress={() => navigation.navigate("CommentExpand", {
          key: id,
          commentPath: `Hash/${hash}/Pictures/${id}`
        })}>
          <Icon name={'chatbox-outline'} size={30} color="white" onPress={() => navigation.goBack()} />
        </Pressable>
        <Animated.View style={{ padding: 20, backgroundColor: animatedBackgroundColor, borderRadius: 5, marginTop: 10 }}>
          <Pressable
            onLongPress={startBackgroundAnimation}
            onPressOut={cancelBackgroundAnimation}
          >
            <Icon name={flagged ? 'flag' : 'flag-outline'} size={30} color="white" />
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}
