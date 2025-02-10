
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import color from './color';
import {SharedElement} from 'react-navigation-shared-element';

const EmailVerificationScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Please Verify Your Email</Text>
      <Text style={styles.message}>
        A verification email has been sent to your inbox. Please check your email and verify your account.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#1a1a1a',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: color,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    color: 'grey',
  },
});

export default EmailVerificationScreen;
