import React from 'react';
import {View, Text, Pressable, ScrollView, Alert, Linking} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import color from './color';
import {SharedElement} from 'react-navigation-shared-element';

export default function LinkExpand({route, navigation}) {
  const {links, userData} = route.params;

  const handleLinkPress = url => {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }

    if (userData?.openInDefaultBrowser) {
      Linking.openURL(url).catch(err => {
        console.error('Failed to open URL:', err);
        Alert.alert('Error', 'Could not open the URL. Please try again.');
      });
    } else {
      navigation.navigate('Web', {url});
    }
  };

  return (
    <ScrollView style={{flex: 1, backgroundColor: '#000'}}>
      <View
        style={{
          padding: 10,
          alignItems: 'center',
          flexDirection: 'row',
          height: 60,
        }}>
        <Icon
          name={'chevron-back'}
          size={25}
          color={color}
          onPress={() => navigation.goBack()}
        />
        <Text
          style={{
            color: 'white',
            fontSize: 20,
            fontWeight: 'bold',
            marginLeft: 10,
          }}>
          Links
        </Text>
      </View>
      {links.map((link, index) => (
        <Pressable
          key={index}
          onPress={() => handleLinkPress(link)}
          style={{
            marginBottom: 5,
            backgroundColor: '#1a1a1a',
            padding: 8,
            borderRadius: 6,
            flexDirection: 'row',
            justifyContent: 'space-between',
          }}>
          <Text
            style={{
              color: color,
              textDecorationLine: 'underline',
              maxWidth: '90%',
            }}>
            {link}
          </Text>
          <Icon name={'open-outline'} size={27} color={color} />
        </Pressable>
      ))}
    </ScrollView>
  );
}
