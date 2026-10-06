import React, { useEffect, useRef } from 'react';
import { View, TouchableOpacity, Animated, Easing } from 'react-native';

export default function MotiPulse({ cor = '#9B8AE0', tamanho = 56, children }) {
  const progresso = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(progresso, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
      Animated.timing(progresso, { toValue: 0, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
    ]));
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <Animated.View style={{
      position: 'absolute', width: tamanho + 24, height: tamanho + 24,
      borderRadius: (tamanho + 24) / 2, backgroundColor: cor, left: -12, top: -12,
      opacity: progresso.interpolate({ inputRange: [0, 1], outputRange: [0.18, 0.42] }),
      transform: [{ scale: progresso.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.12] }) }],
    }}>
      {children}
    </Animated.View>
  );
}

export function FabPulse({ onPress, cor = '#9B8AE0', tamanho = 56, children, style }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.82} style={[{ alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-end', margin: 18 }, style]}>
      <MotiPulse cor={cor} tamanho={tamanho} />
      <View style={{ width: tamanho, height: tamanho, borderRadius: tamanho / 2, backgroundColor: cor, alignItems: 'center', justifyContent: 'center' }}>
        {children}
      </View>
    </TouchableOpacity>
  );
}
