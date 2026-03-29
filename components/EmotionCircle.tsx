import { memo } from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';

interface EmotionCircleProps {
  label: string;
  gradientStart: string;
  gradientEnd: string;
  size: number;
  onPress: () => void;
}

function EmotionCircleComponent({ label, gradientStart, gradientEnd, size, onPress }: EmotionCircleProps) {
  const radius = size / 2;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={{ width: size, height: size }}>
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
