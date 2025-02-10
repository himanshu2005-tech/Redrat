import React, {useEffect, useRef, useState, useMemo} from 'react';
import {
  ActivityIndicator,
  Platform,
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions
} from 'react-native';
import NativeAdView, {
  AdvertiserView,
  CallToActionView,
  HeadlineView,
  IconView,
  StarRatingView,
  StoreView,
  TaglineView,
  PriceView,
  ImageView,
  NativeMediaView,
} from 'react-native-admob-native-ads';
import {MediaView} from './MediaView';
import {Logger} from './utils';

export const AdCommentView = React.memo(({index, media, type, loadOnMount = true}) => {
  const [aspectRatio, setAspectRatio] = useState(1.5);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [paused, setPaused] = useState(false);
  const nativeAdRef = useRef();

  const adUnitID = useMemo(() => {
    return type === 'image'
      ? 'ca-app-pub-3940256099942544/2247696110'
      : 'ca-app-pub-3940256099942544/1044960115';
  }, [type]);

  const onAdFailedToLoad = event => {
    setError(true);
    setLoading(false);
    Logger('AD', 'FAILED', event);
  };

  const onNativeAdLoaded = event => {
    Logger('AD', 'RECEIVED', 'Unified ad received', event);
    setLoading(false);
    setLoaded(true);
    setError(false);
    setAspectRatio(event.aspectRatio);
  };

  const onVideoPlay = () => {
    Logger("VIDEO", "PLAY", "Video is now playing");
  };

  const onVideoPause = () => {
    Logger("VIDEO", "PAUSED", "Video is now paused");
  };

  const onVideoProgress = (event) => {
    Logger("VIDEO", "PROGRESS UPDATE", event);
  };

  const onVideoEnd = () => {
    Logger("VIDEO", "ENDED", "Video end reached");
  };

  const onVideoMute = (muted) => {
    Logger("VIDEO", "MUTE", muted);
  };
  useEffect(() => {
    if (loadOnMount && !loaded) {
      nativeAdRef.current?.loadAd();
    } else {
      Logger('AD', 'ALREADY LOADED');
    }
  }, [loaded, loadOnMount]);

  return (
      <NativeAdView
        ref={nativeAdRef}
        onAdFailedToLoad={onAdFailedToLoad}
        onNativeAdLoaded={onNativeAdLoaded}
        style={styles.adContainer}
        videoOptions={{
          customControlsRequested: true,
        }}
        mediationOptions={{
          nativeBanner: true,
        }}
        adUnitID={adUnitID}>
        <View style={styles.adContent}>
          <View
            style={loading || error || !loaded ? styles.overlay : styles.hidden}>
            {loading && <ActivityIndicator size="large" color="#a9a9a9" />}
            {error && <Text style={styles.errorText}>Ad failed to load</Text>}
          </View>
  
          <View style={styles.adHeader}>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <IconView style={styles.adIcon} />
              <View>
                <HeadlineView style={styles.headline} />
              </View>
            </View>
            <CallToActionView
              style={[
                styles.callToAction,
                Platform.OS === 'ios' ? styles.iosButton : {},
              ]}
              buttonAndroidStyle={styles.androidButton}
              textStyle={styles.callToActionText}
              allCaps
            />
          </View>
  
          <View style={{width: '100%'}}>
            <TaglineView style={styles.tagline} />
          </View>
        </View>
      </NativeAdView>
  );
  
});

const styles = StyleSheet.create({
    adItem: {
      marginVertical: 10,
      backgroundColor: '#fff',
      borderRadius: 8,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 1},
      shadowOpacity: 0.2,
      shadowRadius: 1.41,
      elevation: 3,
    },
    adContainer: {
      width: '100%',
      alignSelf: 'center',
      backgroundColor: 'black',
      borderRadius: 10,
      overflow: 'hidden',
    },
    adContent: {
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'black',
    },
    overlay: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'black',
      zIndex: 10,
    },
    hidden: {
      zIndex: 0,
    },
    errorText: {
      color: '#a9a9a9',
      fontSize: 14,
    },
    adHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      width: '100%',
      justifyContent: 'space-between',
      marginTop: 10
    },
    adIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      marginRight: 10,
    },
    headline: {
      fontWeight: 'bold',
      color: '#FFF',
      marginBottom: 3,
    },
    tagline: {
      color: '#FFF',
      margin: 10,
    },
    callToAction: {
      minHeight: 30,
      paddingHorizontal: 15,
      justifyContent: 'center',
      alignItems: 'center',
      maxWidth: 100,
      width: 80,
      backgroundColor: '#FF3131',
      borderRadius: 10,
    },
    iosButton: {
      backgroundColor: '#FF3131',
      borderRadius: 10,
    },
    androidButton: {
      backgroundColor: '#FF3131',
      borderRadius: 10,
      padding: 10,
      paddingHorizontal: 15,
    },
    callToActionText: {
      fontSize: 13,
      textAlign: 'center',
      color: '#fff',
    },
  });
  