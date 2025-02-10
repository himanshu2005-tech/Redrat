import React, { useRef } from 'react';
import { View, StyleSheet, Pressable, Linking, ToastAndroid } from 'react-native';
import { WebView } from 'react-native-webview';
import Icon from 'react-native-vector-icons/Ionicons';
import color from './color';
import {SharedElement} from 'react-navigation-shared-element';

const WebViewScreen = ({ route, navigation }) => {
  const { url } = route.params;
  const webviewRef = useRef(null);

  const reloadPage = () => {
    if (webviewRef.current) {
      webviewRef.current.reload();
    }
  };

  const closeWebView = () => {
    navigation.goBack();
  };

  const openInExternalBrowser = () => {
    Linking.openURL(url);
  };

  const handleError = (syntheticEvent) => {
    const { nativeEvent } = syntheticEvent;
    console.warn('WebView error: ', nativeEvent);
    ToastAndroid.show('Error loading page. Please check your internet connection.', ToastAndroid.SHORT);
  };

  const handleHttpError = (syntheticEvent) => {
    const { nativeEvent } = syntheticEvent;
    console.warn('HTTP error: ', nativeEvent);
    ToastAndroid.show('HTTP error occurred while loading the page.', ToastAndroid.SHORT);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={closeWebView}>
          <Icon name={'close-outline'} size={27} color={color} />
        </Pressable>
        <Pressable onPress={reloadPage}>
          <Icon name={'reload'} size={27} color={color} />
        </Pressable>
        <Pressable onPress={openInExternalBrowser}>
          <Icon name={'open-outline'} size={27} color={color} />
        </Pressable>
      </View>
      <WebView
        ref={webviewRef}
        source={{ uri: url }}
        style={styles.webview}
        onError={handleError}
        onHttpError={handleHttpError}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
        mixedContentMode="always"  
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    backgroundColor: '#1a1a1a',
    padding: 10,
    justifyContent: 'space-between',
    flexDirection: 'row',
    alignItems: 'center',
  },
  webview: {
    flex: 1,
  },
});

export default WebViewScreen;
