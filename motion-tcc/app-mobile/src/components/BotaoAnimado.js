import React, { useRef } from 'react';
import { TouchableOpacity, Animated, ActivityIndicator, Text } from 'react-native';

export default function BotaoAnimado({ onPress, disabled, loading, style, children, corCarregando = '#FFF', accessibilityLabel, accessibilityHint }) {
  const escala = useRef(new Animated.Value(1)).current;
  const pressionar = () => Animated.spring(escala, { toValue: 0.97, useNativeDriver: false, speed: 30, bounciness: 4 }).start();
  const soltar = () => Animated.spring(escala, { toValue: 1, useNativeDriver: false, speed: 24, bounciness: 6 }).start();
  const bloqueado = disabled || loading;

  return (
    <Animated.View style={{ transform: [{ scale: escala }] }}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={pressionar}
        onPressOut={soltar}
        disabled={bloqueado}
        activeOpacity={0.82}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        style={[{ minHeight: 52, minWidth: 52, alignItems: 'center', justifyContent: 'center' }, style, bloqueado && { opacity: 0.6 }]}
      >
        {loading ? <ActivityIndicator color={corCarregando} /> : children}
      </TouchableOpacity>
    </Animated.View>
  );
}

export function TextoBotao({ style, children }) {
  return <Text style={style}>{children}</Text>;
}
