import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Circle, Line } from 'react-native-svg';

export default function WelcomeScreen() {
  useEffect(() => {
    const timer = setTimeout(() => {
      AsyncStorage.setItem('hasLaunched', 'true').then(() => {
        router.replace('/splash');
      });
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Svg width={120} height={120} viewBox="0 0 120 120">
        <Circle cx={60} cy={60} r={22} fill="#00E5CC" />
        {Array.from({ length: 8 }).map((_, i) => {
          const angle = (i * Math.PI * 2) / 8;
          const innerR = 28;
          const outerR = 48;
          return (
            <Line
              key={i}
              x1={60 + Math.cos(angle) * innerR}
              y1={60 + Math.sin(angle) * innerR}
              x2={60 + Math.cos(angle) * outerR}
              y2={60 + Math.sin(angle) * outerR}
              stroke="#00E5CC"
              strokeWidth={3}
              strokeLinecap="round"
            />
          );
        })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
