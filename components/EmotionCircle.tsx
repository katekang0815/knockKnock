import { memo, useCallback } from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

interface EmotionCircleProps {
  label: string;
  category: string;
  gradientStart: string;
  gradientEnd: string;
  size: number;
}

function EmotionCircleComponent({ label, category, gradientStart, gradientEnd, size }: EmotionCircleProps) {
  const radius = size / 2;

  const handlePress = useCallback(() => {
    router.push({
      pathname: '/emotionlog',
      params: { emotion: label, category },
    });
  }, [label, category]);

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.7} style={{ width: size, height: size }}>
      <View
        style={{
          width: size,
          height: size,
          borderRadius: radius,
          backgroundColor: gradientStart,
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
