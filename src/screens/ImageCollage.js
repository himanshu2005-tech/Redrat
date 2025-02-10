import React from 'react';
import {
  View,
  Image,
  StyleSheet,
  Pressable,
  Text,
  TouchableOpacity,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {SharedElement} from 'react-navigation-shared-element';

const ImageCollage = ({imageUrls, isSensitive = false, currentUserDetailszz}) => {
  const navigation = useNavigation();

  const handleImagePress = () => {
    if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
      return;
    }

    navigation.navigate('ImageExpand', {images: imageUrls});
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
          {(isSensitive && currentUserDetails.blurSensitiveContent) && (
            <TouchableOpacity
              style={styles.viewTextContainer}
              onPress={handleImagePress}>
              <Text style={{color: 'white'}}>
                This content may contain sensitive information.
              </Text>
              <Text style={styles.viewText}>View Media</Text>
            </TouchableOpacity>
          )}
          <Image
            source={{uri: mainImageUrl}}
            style={styles.mainImage}
            resizeMode="cover"
            blurRadius={(isSensitive && currentUserDetails.blurSensitiveContent) ? 30 : 0}
          />
          {remainingCount > 0 && (
            <View style={styles.moreImagesOverlay}>
              <Text style={styles.moreImagesText}>+{remainingCount}</Text>
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
    height: 200,
    borderRadius: 15,
  },
  mainImage: {
    width: '100%',
    height: '100%',
    borderRadius: 15,
  },
  viewTextContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0)',
    borderRadius: 15,
  },
  viewText: {
    color: 'white',
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: 10
  },
  moreImagesOverlay: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 5,
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
