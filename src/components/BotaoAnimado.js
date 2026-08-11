import React, { useRef } from 'react';
import { TouchableOpacity, Animated, ActivityIndicator, Text } from 'react-native';

// Wrapper de toque com spring de escala — usado em cima de qualquer estilo
// de botão já existente (`s.botaoPrimario`, `s.botaoSecundario`, etc.) pra
// dar resposta física ao toque sem precisar reescrever cada botão do zero.
export default function BotaoAnimado({ onPress, disabled, loading, style, children, corCarregando = '#FFF' }) {
  const escala = useRef(new Animated.Value(1)).current;
  const pressIn = () => Animated.spring(escala, { toValue: 0.96, useNativeDriver: true, speed: 40, bounciness: 5 }).start();
  const pressOut = () => Animated.spring(escala, { toValue: 1, useNativeDriver: true, speed: 22, bounciness: 9 }).start();
  return (
    <Animated.View style={{ transform: [{ scale: escala }] }}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        disabled={disabled || loading}
        activeOpacity={0.9}
        style={[style, (disabled || loading) && { opacity: 0.6 }]}
      >
        {loading ? <ActivityIndicator color={corCarregando} /> : children}
      </TouchableOpacity>
    </Animated.View>
  );
}

// Atalho pra texto simples dentro do botão, já que é o caso mais comum.
export function TextoBotao({ style, children }) {
  return <Text style={style}>{children}</Text>;
}
