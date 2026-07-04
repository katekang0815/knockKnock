import { memo, useCallback, useMemo } from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

interface EmotionCircleProps {
  label: string;
  category: string;
  gradientStart: string;
  gradientEnd: string;
  size: number;
}

// --- Color helpers ---

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const num = parseInt(hex.replace('#', ''), 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

function rgbToHex(r: number, g: number, b: number): string {
  return (
    '#' +
    [r, g, b]
      .map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0'))
      .join('')
  );
}

// Interpolate between two hex colors — t: 0 = colorA, 1 = colorB
function blend(colorA: string, colorB: string, t: number): string {
  const a = hexToRgb(colorA);
  const b = hexToRgb(colorB);
  return rgbToHex(
    a.r + (b.r - a.r) * t,
    a.g + (b.g - a.g) * t,
    a.b + (b.b - a.b) * t,
  );
}

// Deterministic 0–1 hash for a label — used to pick a shade
function hashLabel(label: string): number {
  let h = 0;
  for (let i = 0; i < label.length; i++) {
    h = (h << 5) - h + label.charCodeAt(i);
    h |= 0; // force 32-bit
  }
  return (Math.abs(h) % 1000) / 1000;
}

function EmotionCircleComponent({
  label,
  category,
  gradientStart,
  gradientEnd,
  size,
}: EmotionCircleProps) {
  const handlePress = useCallback(() => {
    router.push({
      pathname: '/emotionlog',
      params: { emotion: label, category },
    });
  }, [label, category]);

  // Each label gets a deterministic shade between gradientStart and gradientEnd,
  // so cells share the same palette family with subtle variation.
  const backgroundColor = useMemo(
    () => blend(gradientStart, gradientEnd, hashLabel(label)),
    [label, gradientStart, gradientEnd],
  );

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
          borderRadius: 14, // rounded rectangle instead of full circle
          backgroundColor,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text
          style={[styles.label, { fontSize: size * 0.14 }]}
          adjustsFontSizeToFit
          numberOfLines={1}
        >
          {label}
        </Text>
      </View>
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
