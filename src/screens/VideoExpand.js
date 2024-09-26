import React, { useRef, useState } from 'react';
import { View, Pressable, StyleSheet, Image, Text, Alert, PermissionsAndroid, Platform } from 'react-native';
import Video from 'react-native-video';
import Icon from 'react-native-vector-icons/Ionicons';
import Slider from '@react-native-community/slider';
import RNFetchBlob from 'rn-fetch-blob';

export default function VideoExpand({ navigation, route }) {
  const [paused, setPaused] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const videoRef = useRef(null);

  const togglePlayPause = () => {
    setPaused(!paused);
  };

  const handleVideoEnd = () => {
    setPaused(true);
  };

  const handleProgress = (progress) => {
    setCurrentTime(progress.currentTime);
  };

  const handleLoad = (meta) => {
    setDuration(meta.duration);
  };

  const { videoUri, network_pic, network_name, network_id } = route.params;

  const requestStoragePermission = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.MANAGE_EXTERNAL_STORAGE,
        {
          title: 'Storage Permission Required',
          message: 'App needs access to your storage to download the video',
        }
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        return true;
      } else if (granted === PermissionsAndroid.RESULTS.DENIED) {
        Alert.alert(
          'Permission Denied',
          'Storage permission is required to download the video. Please allow the permission to proceed.',
          [
            { text: 'Ask Again', onPress: () => requestStoragePermission() },
            { text: 'Cancel', style: 'cancel' }
          ]
        );
        return false;
      } else {
        Alert.alert('Permission Denied', 'Storage permission is required to download the video.');
        return false;
      }
    }
    return true;
  };

  const downloadVideo = async () => {
    try {
      setDownloading(true);
      const { config, fs } = RNFetchBlob;
      const date = new Date();
      const fileName = `video_${Math.floor(date.getTime() + date.getSeconds() / 2)}.mp4`;
      const downloadDest = `${fs.dirs.DownloadDir}/${fileName}`;

      config({
        fileCache: true,
        appendExt: 'mp4',
        path: downloadDest,
        notification: true,
        addAndroidDownloads: {
          useDownloadManager: true,
          notification: true,
          path: downloadDest,
          description: 'Downloading video',
        },
      })
        .fetch('GET', videoUri)
        .progress((received, total) => {
          const progressPercent = (received / total) * 100;
          setDownloadProgress(progressPercent.toFixed(0));
          console.log('Download progress:', progressPercent.toFixed(0));
        })
        .then((res) => {
          console.log('Download complete:', res);
          Alert.alert('Download Complete', 'Video has been saved to your device.');
          setDownloadProgress(0);
          setDownloading(false);
        })
        .catch((error) => {
          console.error('Download error:', error);
          Alert.alert('Download Error', 'An error occurred while downloading the video.');
          setDownloadProgress(0);
          setDownloading(false);
        });
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert('Download Error', 'An error occurred while downloading the video.');
      setDownloadProgress(0);
      setDownloading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
        <Icon name="chevron-down-outline" size={30} color="#FF3131" />
      </Pressable>
      <View style={styles.videoContainer}>
        <Video
          source={{ uri: videoUri }}
          style={styles.video}
          resizeMode="contain"
          controls={false}
          muted={false}
          paused={paused}
          ref={videoRef}
          repeat={true}
          onEnd={handleVideoEnd}
          onProgress={handleProgress}
          onLoad={handleLoad}
          selectedVideoTrack={{
            type: 'resolution',
            value: 720,
          }}
        />
        <View style={styles.controlOverlay}>
          {network_pic && (
            <Pressable
              style={styles.networkInfo}
              onPress={() => navigation.navigate("Network", { networkId: network_id })}
            >
              <Image source={{ uri: network_pic }} style={styles.networkImage} />
              <Text style={styles.networkText}>{network_name}</Text>
            </Pressable>
          )}
          <View style={styles.controls}>
            <Pressable onPress={togglePlayPause}>
              <Icon name={paused ? 'play' : 'pause'} size={30} color="#FF3131" />
            </Pressable>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={duration}
              value={currentTime}
              onValueChange={(value) => videoRef.current.seek(value)}
              minimumTrackTintColor="#FF3131"
              maximumTrackTintColor="#FFFFFF"
              thumbTintColor="#FF3131"
            />
            <Pressable onPress={downloadVideo} disabled={downloading}>
              <Icon name="download-outline" size={30} color={downloading ? 'grey' : '#FF3131'} />
            </Pressable>
            {downloading && (
              <Text style={styles.downloadProgress}>downloading...</Text>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  backButton: {
    margin: 10,
    position: 'absolute',
    zIndex: 100,
  },
  videoContainer: {
    position: 'relative',
    width: '100%',
    height: '100%',
    borderRadius: 10,
    alignSelf: 'center',
  },
  video: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  controlOverlay: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    flexDirection: 'column',
    alignItems: 'center',
  },
  networkInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  networkImage: {
    height: 45,
    width: 45,
    borderRadius: 100,
  },
  networkText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
    marginLeft: 15,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  slider: {
    flex: 1,
    marginLeft: 10,
  },
  downloadProgress: {
    color: 'white',
    marginLeft: 10,
  },
});
