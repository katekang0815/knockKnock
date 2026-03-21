import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Circle as SvgCircle } from 'react-native-svg';

interface EmotionCircleProps {
  label: string;
  gradientStart: string;
  gradientEnd: string;
  size: number;
  onPress: () => void;
}

export default function EmotionCircle({ label, gradientStart, gradientEnd, size, onPress }: EmotionCircleProps) {
  const radius = size / 2;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id={`grad-${label}`} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={gradientStart} />
            <Stop offset="1" stopColor={gradientEnd} />
          </LinearGradient>
        </Defs>
        <SvgCircle cx={radius} cy={radius} r={radius} fill={`url(#grad-${label})`} />
      </Svg>
      <View style={styles.labelContainer}>
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

const styles = StyleSheet.create({
  labelContainer: {
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: '#000000',
    fontFamily: 'Jost_400Regular',
    textAlign: 'center',
  },
});
