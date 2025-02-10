import React from 'react';
import { Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const AnimatedButton = ({ title, onPress, style, saving }) => {
  return (
    <Pressable
      onPress={onPress}
      disabled={saving}
    >
      <LinearGradient
        colors={['#FF3131', '#FF6347', '#FFD700']} 
        style={style}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {saving ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <Text style={styles.buttonText}>{title}</Text>
        )}
      </LinearGradient>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
});

export default AnimatedButton;
