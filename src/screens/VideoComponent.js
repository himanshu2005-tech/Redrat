import React, {useRef, useState} from 'react';
import {
  View,
  Pressable,
  ActivityIndicator,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import Video from 'react-native-video';
import {useNavigation} from '@react-navigation/native';
import {SharedElement} from 'react-navigation-shared-element';

const VideoComponent = ({
  videoUri,
  networkPic,
  networkName,
  networkId,
  information,
  currentUserDetails,
  isSensitive = false,
}) => {
  const videoRef = useRef(null);
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);

  const handleEnd = () => {
    if (videoRef.current) {
      videoRef.current.seek(0);
    }
  };

  const handleBuffer = ({isBuffering}) => {
    setLoading(isBuffering);
  };

  const handleProgress = ({currentTime}) => {
    if (currentTime >= 5 && videoRef.current) {
      videoRef.current.seek(0);
    }
    setCurrentTime(currentTime);
  };

  const handlePress = () => {
    navigation.navigate('VideoExpand', {
      videoUri,
      networkPic,
      networkName,
      networkId,
      information,
      currentUserDetails,
    });
  };

  return (
    <Pressable onPress={handlePress} style={styles.container}>
      {isSensitive && currentUserDetails.blurSensitiveContent ? (
        <View
          style={{
            flex: 1,
            width: '100%',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            height: 200,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 5,
          }}>
          <Text style={{color: 'white'}}>
            This content may contain sensitive information.
          </Text>
          <TouchableOpacity onPress={handlePress}>
            <Text style={{color: 'white', fontSize: 15, fontWeight: 'bold', margin: 10}}>
              View Video
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.videoContainer}>
          <Video
            ref={videoRef}
            source={{uri: videoUri}}
            style={styles.video}
            resizeMode="contain"
            controls={false}
            muted
            repeat={true}
            paused={false}
            onProgress={handleProgress}
            onEnd={handleEnd}
            onBuffer={handleBuffer}
            onLoad={() => setLoading(false)}
            selectedVideoTrack={{type: 'resolution', value: 1080}}
          />
          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#FFFFFF" />
            </View>
          )}
          <View style={styles.timeDisplay}>
            <Text style={styles.timeText}>{currentTime.toFixed(1)}s</Text>
          </View>
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 15,
  },
  videoContainer: {
    position: 'relative',
  },
  video: {
    width: '100%',
    height: 200,
    borderRadius: 10,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 10,
  },
  timeDisplay: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  timeText: {
    color: 'white',
    fontSize: 14,
  },
});

export default VideoComponent;





