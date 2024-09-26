import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const parseTextWithHashtags = (text = '', navigation) => {
  const regex = /(#\w+|https?:\/\/[^\s]+|www\.[^\s]+)/g; // Added www. for URLs without http(s)
  const parts = text.split(regex);

  return parts.map((part, index) => {
    if (part.match(/#\w+/)) {
      // Handle hashtag
      return (
        <Text
          key={index}
          style={styles.hashtag}
          onPress={() =>
            navigation.navigate('SearchResults', {
              searchTarget: part,
              isHash: true,
            })
          }>
          {part}
        </Text>
      );
    } else if (part.match(/(https?:\/\/[^\s]+|www\.[^\s]+)/)) {
      // Handle URL
      const url = part.startsWith('http') ? part : `http://${part}`;
      return (
        <Text
          key={index}
          style={styles.link}
          onPress={() => navigation.navigate('Web', { url: url })}>
          {part}
        </Text>
      );
    } else {
      // Handle regular text
      return <Text key={index}>{part}</Text>;
    }
  });
};

const Bluing = ({ text = '', style }) => {
  const navigation = useNavigation(); // Get navigation instance

  return <Text style={style}>{parseTextWithHashtags(text, navigation)}</Text>;
};

const styles = StyleSheet.create({
  hashtag: {
    color: '#FF3131',
  },
  link: {
    color: '#FF3131',
    textDecorationLine: 'underline',
  },
});

export default Bluing;
