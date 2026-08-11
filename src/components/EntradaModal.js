import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

// Entrada com efeito de mola pro conteúdo de um modal — troque o
// `animationType` do <Modal> do React Native pra "none" e envolva o card
// com isto, passando o mesmo `visivel` que controla o Modal.
// Usa o `Animated` embutido do React Native (sem dependência nativa nova).
export default function EntradaModal({ visivel, style, children }) {
  const progresso = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visivel) {
      progresso.setValue(0);
      Animated.spring(progresso, { toValue: 1, useNativeDriver: true, speed: 16, bounciness: 8 }).start();
    }
  }, [visivel]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: progresso,
          transform: [
            { scale: progresso.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) },
            { translateY: progresso.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
