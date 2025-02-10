import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  Pressable,
  StyleSheet,
  Image,
  Text,
  Animated,
  BackHandler,
  ActivityIndicator,
  Modal,
} from 'react-native';
import Video from 'react-native-video';
import Icon from 'react-native-vector-icons/Ionicons';
import Slider from '@react-native-community/slider';
import Orientation from 'react-native-orientation-locker';
import color from './color';
import {SharedElement} from 'react-navigation-shared-element';

export default function VideoExpand({navigation, route}) {
  const {
    videoUri,
    network_pic,
    network_name,
    network_id,
    information,
    currentUserDetails,
  } = route.params;

  const [paused, setPaused] = useState(!currentUserDetails.autoplayPostVideo);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(
    currentUserDetails.mutedPostVideo ? 0 : 1,
  );
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [loadingPercentage, setLoadingPercentage] = useState(0);
  const [replayControls, setReplayControls] = useState(false);
  const [repeat, setRepeat] = useState(currentUserDetails.repeatPostVideo)
  const [onBuffer, setOnBuffer] = useState(false);
  const translateY = useRef(new Animated.Value(100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const videoRef = useRef(null);

  useEffect(() => {
    if (information) {
      Animated.sequence([ 
        Animated.timing(translateY, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    }

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        handleBackPress();
        return true;
      },
    );

    return () => {
      backHandler.remove();
    };
  }, [information]);

  const handleBackPress = () => {
    Orientation.unlockAllOrientations();
    navigation.goBack();
  };

  const togglePlayPause = () => setPaused(!paused);

  const handleVideoEnd = () => {
    if (!currentUserDetails.repeatPostVideo) {
      setReplayControls(true);
      setPaused(true);
    }
  };

  const onReplay = () => {
    setReplayControls(false); 
    setPaused(false);
    setCurrentTime(0); 
    videoRef.current.seek(0); 
    setRepeat(true); 
  };
  
  const handleBuffer = ({isBuffering, buffered}) => {
    if (isBuffering) {
      const totalDuration = duration || 1; 
      const bufferedDuration = buffered || 0;
      setLoadingPercentage((bufferedDuration / totalDuration) * 100);
      setOnBuffer(true);
    } else {
      setOnBuffer(false);
    }
  };

  const handleProgress = progress => {
    setCurrentTime(progress.currentTime);
  };

  const handleLoad = meta => {
    setDuration(meta.duration);
  };

  const toggleFullscreen = () => {
    if (isFullscreen) {
      Orientation.unlockAllOrientations();
    } else {
      Orientation.lockToLandscape();
    }
    setIsFullscreen(!isFullscreen);
  };

  const toggleControls = () => setShowControls(!showControls);

  const toggleMute = () => setVolume(volume === 0 ? 1 : 0);

  return (
    <View style={styles.container}>
      <Pressable style={styles.container} onPress={toggleControls}>
        {showControls && (
          <Pressable style={styles.backButton} onPress={handleBackPress}>
            <Icon name="chevron-down-outline" size={30} color={color} />
          </Pressable>
        )}
        <View style={styles.videoContainer}>
          <Video
            source={{uri: videoUri}}
            style={styles.video}
            resizeMode="contain"
            controls={false}
            muted={volume === 0}
            paused={paused}
            ref={videoRef}
            repeat={repeat}
            onEnd={handleVideoEnd}
            onProgress={handleProgress}
            onLoad={handleLoad}
            onBuffer={handleBuffer} 
            selectedVideoTrack={{type: 'resolution', value: 720}}
            rate={1}
          />
          <Pressable style={styles.controlOverlay}>
            {showControls && (
              <View>
                {network_pic && (
                  <Pressable
                    style={styles.networkInfo}
                    onPress={() =>
                      navigation.navigate('Network', {networkId: network_id})
                    }>
                    <Image
                      source={{uri: network_pic}}
                      style={styles.networkImage}
                    />
                    <Text style={styles.networkText}>{network_name}</Text>
                  </Pressable>
                )}
                {information && (
                  <Animated.View
                    style={[
                      styles.infoContainer,
                      {transform: [{translateY: translateY}], opacity: opacity},
                    ]}>
                    <Text style={{color: 'white', textAlign: 'left'}}>
                      {information}
                    </Text>
                  </Animated.View>
                )}
                <View style={styles.controls}>
                  <Pressable onPress={togglePlayPause}>
                    <Icon
                      name={paused ? 'play' : 'pause'}
                      size={30}
                      color={color}
                    />
                  </Pressable>
                  <Pressable onPress={toggleMute} style={styles.muteButton}>
                    <Icon
                      name={volume === 0 ? 'volume-mute' : 'volume-high'}
                      size={30}
                      color={color}
                    />
                  </Pressable>
                  <Slider
                    style={styles.slider}
                    minimumValue={0}
                    maximumValue={duration}
                    value={currentTime}
                    onValueChange={value => videoRef.current.seek(value)}
                    minimumTrackTintColor={color}
                    maximumTrackTintColor="#FFFFFF"
                    thumbTintColor={color}
                  />
                  <Pressable onPress={toggleFullscreen}>
                    <Icon
                      name={isFullscreen ? 'contract' : 'expand'}
                      size={30}
                      color={color}
                    />
                  </Pressable>
                </View>
              </View>
            )}
          </Pressable>
        </View>
      </Pressable>
      <Modal
        transparent={true}
        visible={replayControls}
        animationType="slide"
        onRequestClose={() => setReplayControls(false)}>
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          }}>
          <View
            style={{
              backgroundColor: 'black',
              padding: 20,
              borderRadius: 10,
              width: '90%',
              alignItems: 'center',
            }}>
            <Icon
              name="reload-outline"
              color="white"
              size={40}
              onPress={onReplay}
            />
          </View>
        </View>
      </Modal>
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
    flex: 1,
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
  infoContainer: {
    alignSelf: 'flex-start',
    marginBottom: 5,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  muteButton: {
    marginLeft: 10,
  },
  slider: {
    width: '70%',
    marginHorizontal: 10,
  },
  loadingText: {
    color: 'white',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
  },
});




