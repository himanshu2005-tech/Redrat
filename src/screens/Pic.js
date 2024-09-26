import React from 'react';
import { View, Image, Pressable, Dimensions } from 'react-native';
import { SharedElement } from 'react-navigation-shared-element';

export default function Pic({ item, navigation, id, hash_id }) {
  const screenWidth = Dimensions.get('window').width;
  const imageSize = screenWidth / 3 - 10;

  return (
    <Pressable
      style={{ margin: 5 }}
      onPress={() =>
        navigation.navigate('PicExpand', {
          item: item,
          id: id,  
          hash: hash_id
        })
      }
    >
      <SharedElement id={`pic.${id}.photo`}>
        <Image
          source={{ uri: item.imageUri }}
          style={{
            width: imageSize,
            height: imageSize,
          }}
          resizeMode="cover"
        />
      </SharedElement>
    </Pressable>
  );
}
