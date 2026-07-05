import { memo, useCallback } from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

interface EmotionCircleProps {
  label: string;
  category: string;
  gradientStart?: string;
  gradientEnd?: string;
  size: number;
}

// Muted brick-red glow — layered inward for a soft inset effect
const GLOW_COLOR = '#B85050';
const CONTAINER_BG = '#241514';

function EmotionCircleComponent({
  label,
  category,
  size,
}: EmotionCircleProps) {
  const handlePress = useCallback(() => {
    router.push({
      pathname: '/emotionlog',
      params: { emotion: label, category },
    });
  }, [label, category]);

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      style={{ width: size, height: size }}
    >
      <View
        style={{
          width: size,
          height: size,
          borderRadius: 14,
          backgroundColor: CONTAINER_BG,
          overflow: 'hidden',
        }}
      >
        {/* Outer glow band — softest, widest */}
        <View
          style={{
            ...StyleSheet.absoluteFillObject,
            borderRadius: 14,
            borderWidth: 8,
            borderColor: GLOW_COLOR,
            opacity: 0.18,
          }}
        />
        {/* Middle glow band */}
        <View
          style={{
            position: 'absolute',
            top: 1,
            left: 1,
            right: 1,
            bottom: 1,
            borderRadius: 13,
            borderWidth: 4,
            borderColor: GLOW_COLOR,
            opacity: 0.35,
          }}
        />
        {/* Sharpest inner rim — bright, thin */}
        <View
          style={{
            position: 'absolute',
            top: 2,
            left: 2,
            right: 2,
            bottom: 2,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: GLOW_COLOR,
            opacity: 0.55,
          }}
        />
        {/* Label */}
        <View style={styles.labelContainer}>
          <Text
            style={[styles.label, { fontSize: size * 0.14 }]}
            adjustsFontSizeToFit
            numberOfLines={1}
          >
            {label}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default memo(EmotionCircleComponent);

const styles = StyleSheet.create({
  labelContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  label: {
    fontFamily: 'Jost_400Regular',
    textAlign: 'center',
    color: '#FFFFFF',
  },
});
