import React, {useState} from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';

export default function LoginScreen(props) {
  const [loading, setLoading] = useState(false);

  const onGoogleButtonPress = async () => {
    setLoading(true);
    try {
      await props.onGoogleButtonPress();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>redrat</Text>
      <TouchableOpacity onPress={onGoogleButtonPress} style={styles.button}>
        {loading ? (
          <ActivityIndicator color="white" size="large" />
        ) : (
          <Text style={styles.text}>Sign in with Google</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontFamily: 'title3',
    fontSize: 90,
    color: '#FF3131',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#FF3131',
    paddingVertical: 10,
    paddingHorizontal: 50,
    borderRadius: 5,
  },
  text: {
    color: 'white',
    fontSize: 25,
    fontFamily:'title2'
  },
});
