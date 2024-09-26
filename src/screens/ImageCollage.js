import React from 'react';
import {View, Image, StyleSheet, Pressable, Text} from 'react-native';
import {useNavigation} from '@react-navigation/native';

const ImageCollage = ({imageUrls}) => {
  const navigation = useNavigation();

  const handleImagePress = () => {
    if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
      return; 
    }

    if (imageUrls.length === 1) {
      navigation.navigate('ImageExpand', {images: imageUrls});
    } else {
      navigation.navigate('ImageExpand', {images: imageUrls});
    }
  };

  const renderImages = () => {
    if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
      return null;
    }

    const mainImageUrl = imageUrls[0];
    const remainingCount = imageUrls.length - 1;

    return (
      <Pressable onPress={handleImagePress}>
        <View style={styles.imageContainer}>
          <Image
            source={{uri: mainImageUrl}}
            style={styles.mainImage}
            resizeMode="cover"
          />
          {remainingCount > 0 && (
            <View style={styles.moreImagesOverlay}>
              <Text style={styles.moreImagesText}>
                +{remainingCount} more images
              </Text>
            </View>
          )}
        </View>
      </Pressable>
    );
  };

  return <View>{renderImages()}</View>;
};

const styles = StyleSheet.create({
  imageContainer: {
    position: 'relative',
    height: 200
  },
  mainImage: {
    width: '100%',
    height: '100%',
    borderRadius: 15,
  },
  moreImagesOverlay: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
    padding: 5,
    paddingHorizontal: 10,
  },
  moreImagesText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ImageCollage;
