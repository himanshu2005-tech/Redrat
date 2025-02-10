import React, { useState } from 'react';
import { Text, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import firestore from '@react-native-firebase/firestore';
import { 
  TextAnimationFadeIn, 
  TextAnimationZoom, 
  TextAnimationRain, 
  TextAnimationSlideDown, 
  TextAnimationSlideUp, 
  TextAnimationSlideLeft, 
  TextAnimationSlideRight, 
  TextAnimationShake, 
  TextAnimationReverse, 
  TextAnimationDeZoom 
} from 'react-native-text-effects';
import color from '../screens/color';

const parseTextWithHashtagsAndMentions = (text = '', navigation, isBack) => {
  const regex = /(@[\w.]+|#\w+|https?:\/\/[^\s]+|www\.[^\s]+)/g;
  const parts = text.split(regex);

  return parts.map((part, index) => {
    if (part.match(/@\w[\w.]+/)) {

      const mentionedName = part.substring(1); 
      return (
        <Text
          key={index}
          style={styles.mention}
          accessibilityRole="link"
          onPress={async () => {
            try {
              const querySnapshot = await firestore()
                .collection('Users')
                .where('name', '==', mentionedName)
                .get();
              if (!querySnapshot.empty) {
                const userDoc = querySnapshot.docs[0];
                navigation.navigate('UserProfile', {
                  id: userDoc.id,
                });
              } else {
                console.log('User not found.');
              }
            } catch (error) {
              console.error('Error fetching mentioned user:', error);
            }
          }}
        >
          {part}
        </Text>
      );
    } else if (part.match(/#\w+/)) {
      return (
        <Text
          key={index}
          style={styles.hashtag}
          accessibilityRole="link"
          onPress={() => {
            if (isBack) {
              navigation.goBack();
              navigation.navigate('SearchResults', {
                searchTarget: part,
                isHashTag: true,
              });
            } else {
              navigation.navigate('SearchResults', {
                searchTarget: part,
                isHashTag: true,
              });
            }
          }}
        >
          {part}
        </Text>
      );
    } else if (part.match(/(https?:\/\/[^\s]+|www\.[^\s]+)/)) {
      // URLs
      const url = part.startsWith('http') ? part : `http://${part}`;
      return (
        <Text
          key={index}
          style={styles.link}
          accessibilityRole="link"
          onPress={() => navigation.navigate('Web', { url })}
        >
          {part}
        </Text>
      );
    } else {
      // Regular text
      return <Text key={index}>{part}</Text>;
    }
  });
};

// Bluing component to handle text rendering with hashtags, mentions, URLs, and "see more"
const Bluing = ({ text = '', style, isBack, maxLength = 180 }) => {
  const navigation = useNavigation();
  const [expanded, setExpanded] = useState(false);

  const handleToggle = () => {
    setExpanded((prev) => !prev);
  };

  const safeText = typeof text === 'string' ? text : '';
  const displayText = expanded ? safeText : safeText.substring(0, maxLength);

  return (
    <View>
      <Text style={style}>
        {parseTextWithHashtagsAndMentions(displayText, navigation, isBack)}
      </Text>

      {safeText.length > maxLength && !expanded && (
        <TouchableOpacity onPress={handleToggle}>
          <Text style={styles.seeMoreText}>... See More</Text>
        </TouchableOpacity>
      )}

      {expanded && safeText.length > maxLength && (
        <TouchableOpacity onPress={handleToggle}>
          <Text style={styles.seeMoreText}>See Less</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  mention: {
    color: color, 
  },
  hashtag: {
    color: color,
  },
  link: {
    color: color, // Link color
    textDecorationLine: 'underline', // Underline the link for visibility
  },
  seeMoreText: {
    color: color, // "See More" text color
    fontWeight: 'bold', // Make the "See More" bold
    marginTop: 5,
  },
});

export default Bluing;
