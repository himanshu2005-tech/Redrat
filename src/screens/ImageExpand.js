import React, { useState } from 'react';
import { View, StyleSheet, Image, Alert, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ImageViewer from 'react-native-image-zoom-viewer';
import Icon from 'react-native-vector-icons/Ionicons';
import RNFetchBlob from 'rn-fetch-blob';
import { PermissionsAndroid } from 'react-native';
import color from './color';
import {SharedElement} from 'react-navigation-shared-element';

const ImageExpand = ({ route, navigation }) => {
  const { images } = route.params;
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const requestStoragePermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          {
            title: "Storage Permission",
            message: "App needs access to your storage to download images.",
            buttonNeutral: "Ask Me Later",
            buttonNegative: "Cancel",
            buttonPositive: "OK",
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  const downloadImage = async (url) => {
    const hasPermission = await requestStoragePermission();
    if (!hasPermission) {
      Alert.alert("Permission denied", "Storage permission is required to download images.");
      return;
    }

    const fileName = url.split('/').pop();
    const path = `${RNFetchBlob.fs.dirs.PictureDir}/${fileName}`;

    RNFetchBlob.config({
      fileCache: true,
      appendExt: 'jpg',
      path,
    })
      .fetch('GET', url)
      .then((res) => {
        Alert.alert("Download complete", "Image has been saved to your gallery.");
      })
      .catch(err => {
        console.error(err);
        Alert.alert("Download failed", "There was an error downloading the image.");
      });
  };

  const imagesData = Array.isArray(images) && images.length > 0
    ? images.map(image => ({ url: image }))
    : [{ url: images }];

  const renderHeader = () => (
    <View style={styles.header}>
      <Icon
        name="chevron-down-outline"
        size={28}
        color={color}
        onPress={() => navigation.goBack()}
      />
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      <ImageViewer
        imageUrls={imagesData}
        enableSwipeDown
        saveToLocalByLongPress={false}
        renderIndicator={() => null}
        renderImage={props => <Image {...props} style={styles.image} />}
        style={styles.imageContainer}
        index={0}
        onChange={(index) => setCurrentImageIndex(index)}
        renderHeader={() => renderHeader()}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: 'rgba(0, 0, 0, 1)',
    width: '100%',
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  imageContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
});

export default ImageExpand;
