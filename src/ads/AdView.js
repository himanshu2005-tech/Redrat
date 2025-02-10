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

export const AdView = React.memo(({index, media, type, loadOnMount = true}) => {
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
              <StoreView style={styles.store} />
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
          {type === 'video' ? (
            <View>
              <NativeMediaView
                style={{
                  width: Dimensions.get('window').width - 20,
                  height: Dimensions.get('window').width / aspectRatio,
                  backgroundColor: 'white',
                }}
                onVideoPause={onVideoPause}
                onVideoPlay={onVideoPlay}
                onVideoEnd={onVideoEnd}
                onVideoProgress={onVideoProgress}
                onVideoMute={onVideoMute}
                paused={paused}
              />

              <TouchableOpacity
                onPress={() => {
                  setPaused(!paused);
                }}
                style={{
                  width: 50,
                  height: 50,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                <Text>Pause/Play</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ImageView
              style={{
                height: 200,
                margin: 10,
                borderRadius: 10,
              }}
            />
          )}
          <TaglineView style={styles.tagline} />
          <PriceView
            style={{
              fontWeight: 'bold',
              fontSize: 15,
              color: '#FF3131',
              marginRight: 10,
              margin: 5,
              alignSelf: 'flex-end',
            }}
          />
          <View style={styles.storeAndRating}>
            <Text style={styles.adUsername}>Ad</Text>
            <StarRatingView
              style={styles.starRating}
              starSize={12}
              fullStarColor="orange"
              emptyStarColor="gray"
            />
          </View>
        </View>
      </View>
    </NativeAdView>
  );
});

const styles = StyleSheet.create({
  adContainer: {
    width: '100%',
    alignSelf: 'center',
    marginVertical: 10,
    backgroundColor: 'black',
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
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
    padding: 10,
    justifyContent: 'space-between',
  },
  adIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  adUsername: {
    fontWeight: 'bold',
    color: 'grey',
    fontSize: 14,
  },
  headline: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  tagline: {
    fontSize: 16,
    color: 'white',
    fontWeight: 'bold',
    margin: 10,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 10,
    marginTop: 10,
  },
  iconButton: {
    padding: 8,
  },
  iconText: {
    color: '#007aff',
    fontSize: 14,
  },
  storeAndRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    backgroundColor: '#1a1a1a',
    padding: 10,
    margin: 5,
    borderRadius: 5,
  },
  store: {
    fontSize: 14,
    color: 'grey',
  },
  starRating: {
    width: 80,
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
