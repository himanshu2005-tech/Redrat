import React, { useEffect, useMemo } from 'react';
import {
  Canvas,
  Path,
  Skia,
  SweepGradient,
  vec,
  BlurMask,
} from '@shopify/react-native-skia';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { View } from 'react-native';
import color from '../screens/color';

const LoadingActivator = ({ size=40 }) => {
  const strokeWidth = 7;
  const radius = (size - strokeWidth) / 2;
  const canvasSize = size + 30;

  const circle = useMemo(() => {
    const skPath = Skia.Path.Make();
    skPath.addCircle(canvasSize / 2, canvasSize / 2, radius);
    return skPath;
  }, [canvasSize, radius]);

  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 1000, easing: Easing.linear }),
      -1,
      false
    );
  }, [progress]);

  const rContainerStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${2 * Math.PI * progress.value}rad` }],
    };
  });

  const startPath = useDerivedValue(() =>
    interpolate(progress.value, [0, 0.5, 1], [0.6, 0.3, 0.6])
  );

  return (
    <Animated.View
      entering={FadeIn.duration(1000)}
      exiting={FadeOut.duration(1000)}
      style={[rContainerStyle, { justifyContent: 'center', alignItems: 'center' }]}
    >
      <Canvas
        style={{
          width: canvasSize,
          height: canvasSize,
        }}
      >
        <Path
          path={circle}
          style="stroke"
          strokeWidth={strokeWidth}
          start={startPath.value}
          end={1}
          strokeCap="round"
        >
          <SweepGradient
            c={vec(canvasSize / 2, canvasSize / 2)}
            colors={['black', "#1a1a1a", color]}
          />
          <BlurMask blur={5} style="solid" />
        </Path>
      </Canvas>
    </Animated.View>
  );
};

export default LoadingActivator;
