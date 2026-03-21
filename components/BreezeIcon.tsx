import { useRef, useEffect } from 'react';
import { View } from 'react-native';
import LottieView from 'lottie-react-native';

export default function BreezeIcon({ size = 174 }: { size?: number }) {
  const lottieRef = useRef<LottieView>(null);

  useEffect(() => {
    lottieRef.current?.play();
  }, []);

  return (
    <View style={{ width: size, height: size }}>
      <LottieView
        ref={lottieRef}
        source={require('../assets/breeze.json')}
        autoPlay
        loop
        style={{ width: size, height: size }}
      />
    </View>
  );
}
