import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

export default function MotiCard({ children, style, atraso = 0, quando }) {
  const opacidade = useRef(new Animated.Value(0)).current;
  const deslocamento = useRef(new Animated.Value(14)).current;

  useEffect(() => {
    const animacao = Animated.parallel([
      Animated.timing(opacidade, { toValue: 1, duration: 320, delay: atraso, useNativeDriver: false }),
      Animated.timing(deslocamento, { toValue: 0, duration: 380, delay: atraso, useNativeDriver: false }),
    ]);
    animacao.start();
    return () => animacao.stop();
  }, [atraso, quando]);

  return (
    <Animated.View style={[{ opacity: opacidade, transform: [{ translateY: deslocamento }] }, style]}>
      {children}
    </Animated.View>
  );
}
