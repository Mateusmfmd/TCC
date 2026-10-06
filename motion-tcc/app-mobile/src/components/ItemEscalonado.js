import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

// Envolve um item de uma lista/grade pra ele entrar com uma "cascata" —
// cada item aparece um pouco depois do anterior (opacidade + leve subida),
// em vez de tudo aparecer de uma vez. Usa o `Animated` embutido do React
// Native (sem dependência nativa nova — funciona igual em web/iOS/Android).
//
// `indice` decide o atraso: quanto mais pra frente na lista, mais tarde entra.
// `maxIndice` evita que listas grandes demorem demais pro último item
// aparecer (depois desse ponto, todo mundo entra junto).
export default function ItemEscalonado({ indice = 0, atraso = 40, maxIndice = 12, style, children }) {
  const progresso = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const indiceEfetivo = Math.min(indice, maxIndice);
    Animated.timing(progresso, {
      toValue: 1,
      duration: 280,
      delay: indiceEfetivo * atraso,
      useNativeDriver: true,
    }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: progresso,
          transform: [
            { translateY: progresso.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) },
            { scale: progresso.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
