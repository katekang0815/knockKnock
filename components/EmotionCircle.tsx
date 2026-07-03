import { memo, useCallback } from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import Animated, {
  useAnimatedStyle,
  interpolate,
  SharedValue,
  Extrapolation,
} from 'react-native-reanimated';

interface EmotionCircleProps {
  label: string;
  category: string;
  gradientStart: string;
  gradientEnd: string;
  size: number;
  // Circle's center position in the grid's local frame
  baseX: number;
  baseY: number;
  // Shared pan values from the parent grid
  translateX: SharedValue<number>;
  translateY: SharedValue<number>;
  // Screen focus point (usually screen center) in the same frame as translate
  focusX: number;
  focusY: number;
}

function EmotionCircleComponent({
  label,
  category,
  gradientStart,
  size,
  baseX,
  baseY,
  translateX,
  translateY,
  focusX,
  focusY,
}: EmotionCircleProps) {
  const handlePress = useCallback(() => {
    router.push({
      pathname: '/emotionlog',
      params: { emotion: label, category },
    });
  }, [label, category]);

  const animatedStyle = useAnimatedStyle(() => {
    // Circle's current position in the viewport frame
    const cx = baseX + translateX.value;
    const cy = baseY + translateY.value;
    const dx = cx - focusX;
    const dy = cy - focusY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Bigger the closer to focus. Scale 1.5 at center → 0.65 far away.
    const scale = interpolate(
      dist,
      [0, size * 0.7, size * 1.6, size * 3],
      [1.55, 1.3, 0.9, 0.65],
      Extrapolation.CLAMP,
    );

    // Focused circle becomes a rounded square; everything else stays a circle
    const radiusFactor = interpolate(
      dist,
      [0, size * 0.25, size * 0.6],
      [0.12, 0.5, 0.5],
      Extrapolation.CLAMP,
    );

    return {
      transform: [{ scale }],
      borderRadius: size * radiusFactor,
    };
  });

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      style={{ width: size, height: size }}
    >
      <Animated.View
        style={[
          {
            width: size,
            height: size,
            backgroundColor: gradientStart,
            alignItems: 'center',
            justifyContent: 'center',
          },
          animatedStyle,
        ]}
      >
        <Text
          style={[styles.label, { fontSize: size * 0.14 }]}
          adjustsFontSizeToFit
          numberOfLines={1}
        >
          {label}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

export default memo(EmotionCircleComponent);

const styles = StyleSheet.create({
  label: {
    color: '#000000',
    fontFamily: 'Jost_400Regular',
    textAlign: 'center',
    paddingHorizontal: 4,
  },
});
