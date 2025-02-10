import React from 'react';
import {SectionList, Text, View} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import color from './color';
import {SharedElement} from 'react-navigation-shared-element';

export default function TribetDictionary({navigation}) {
  const DATA = [
    {
      title: 'Network Engagement',
      data: [
        {action: 'Network Creation', points: -500},
        {action: 'Join a Network', points: 30},
        {action: 'Leave a Network', points: -30},
      ],
    },
    {
      title: 'Post Interactions',
      data: [
        {action: 'Adding a Post', points: 15},
        {action: 'Report Accurate Post', points: 15},
        {action: 'Identified toxic language in posts (is SafeSpeak active)', points: -50},
        {action: 'Reposted', points: 20},
      ],
    },
    {
      title: 'Comment Behavior',
      data: [
        {action: 'Post a Comment', points: 3},
        {action: 'Use Explicit Language (if CommentCensor active)', points: -50},
        {action: 'Avoid Spamming or Overposting (if SpamShield active)', points: -5},
      ],
    },
    {
      title: 'Account ',
      data: [
        {action: 'Gained a follower', points: 5},
      ],
    },
  ];

  return (
    <View style={{flex: 1, backgroundColor: 'black'}}>
      <View
        style={{
          padding: 10,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
        }}>
        <Icon
          size={30}
          color={color}
          name="chevron-back"
          onPress={() => navigation.goBack()}
        />
        <Text style={{color: 'white', fontSize: 22, fontWeight: 'bold'}}>
          Tribet Dictionary
        </Text>
      </View>
      <SectionList
        sections={DATA}
        keyExtractor={(item, index) => item.action + index}
        renderItem={({item}) => (
          <View
            style={{
              padding: 15,
              margin: 10,
              flexDirection: 'row',
              justifyContent: 'space-between',
              backgroundColor: '#1a1a1a',
              borderRadius: 5,
            }}>
            <Text style={{color: 'white', fontSize: 16, maxWidth: "90%"}}>{item.action}</Text>
            <Text
              style={{
                color: item.points < 0 ? 'red' : '#32CD32',
                fontSize: 16,
                fontWeight: 'bold',
              }}>
              {item.points >= 0 ? `+${item.points}` : item.points}
            </Text>
          </View>
        )}
        renderSectionHeader={({section: {title}}) => (
          <View
            style={{
              backgroundColor: 'black',
              paddingVertical: 8,
              marginVertical: 10,
              marginHorizontal: 10,
              borderRadius: 5,
            }}>
            <Text style={{color: color, fontSize: 20, fontWeight: 'bold'}}>
              {title}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

