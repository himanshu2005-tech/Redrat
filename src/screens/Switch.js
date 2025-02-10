import React, { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/Ionicons';
import color from './color';

export const Switch = ({
  value,
  onPress,
  style,
  duration = 200,
  trackColors = { off: 'white', on: color },
  thumbColors = { off: color, on: 'white' },
  icons = { off: 'close', on: 'checkmark' },
}) => {
  const [showIcons, setShowIcons] = useState(false);
  const height = useSharedValue(0);
  const width = useSharedValue(0);
  const animatedValue = typeof value === 'object' ? value : { value: value ? 1 : 0 };

  const trackAnimatedStyle = useAnimatedStyle(() => {
    const color = interpolateColor(
      animatedValue.value,
      [0, 1],
      [trackColors.off, trackColors.on]
    );
    return {
      backgroundColor: withTiming(color, { duration }),
      borderRadius: height.value / 2,
    };
  });

  const thumbAnimatedStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      animatedValue.value,
      [0, 1],
      [0, width.value - height.value]
    );
    const color = interpolateColor(
      animatedValue.value,
      [0, 1],
      [thumbColors.off, thumbColors.on]
    );
    return {
      transform: [{ translateX: withTiming(translateX, { duration }) }],
      backgroundColor: withTiming(color, { duration }),
      borderRadius: height.value / 2,
    };
  });

  return (
    <Pressable
      onPress={() => {
        setShowIcons(true);
        onPress();
      }}
      style={[styles.container, style]}
    >
      <Animated.View
        onLayout={(e) => {
          height.value = e.nativeEvent.layout.height;
          width.value = e.nativeEvent.layout.width;
        }}
        style={[styles.track, trackAnimatedStyle]}
      >
        <Animated.View style={[styles.thumb, thumbAnimatedStyle]}>
          {showIcons && (
            <Icon
              name={animatedValue.value != 0 ? icons.off : icons.on}
              size={18}
              color={animatedValue.value === 0 ? thumbColors.off : thumbColors.on}
            />
          )}
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  track: {
    alignItems: 'flex-start',
    width: 45,
    height: 25,
    padding: 1,
  },
  thumb: {
    height: '100%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
