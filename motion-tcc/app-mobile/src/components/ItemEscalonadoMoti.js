import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

export default function ItemEscalonadoMoti({ indice = 0, atraso = 30, maxIndice = 12, children, style }) {
  const opacidade = useRef(new Animated.Value(0)).current;
  const deslocamento = useRef(new Animated.Value(10)).current;
  const delay = Math.min(indice, maxIndice) * atraso;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacidade, { toValue: 1, duration: 260, delay, useNativeDriver: false }),
      Animated.timing(deslocamento, { toValue: 0, duration: 300, delay, useNativeDriver: false }),
    ]).start();
  }, [delay]);

  return (
    <Animated.View style={[{ opacity: opacidade, transform: [{ translateY: deslocamento }] }, style]}>
      {children}
    </Animated.View>
  );
}
