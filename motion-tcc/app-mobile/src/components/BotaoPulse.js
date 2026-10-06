import React, { useEffect, useRef } from 'react';
import { TouchableOpacity, Animated, Easing, Platform } from 'react-native';

// Botão que "pulsa" devagar e de forma contínua — usado para chamar
// atenção discreta a uma ação principal (FAB, começar rotina, falar).
// A pulsação é sutil (scale 1 → 1.06) e em loop infinito; para quando o
// botão é tocado, ele faz o pop normal de confirmação antes da ação.
// `Animated` embutido, sem dependência nativa nova.
export default function BotaoPulse({
  onPress,
  children,
  style,
  estiloPulse,
  ativo = true,
  corPulse = 'rgba(255,255,255,0.4)',
  tempo = 1400,
}) {
  const pulso = useRef(new Animated.Value(0)).current;
  const pop = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!ativo) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulso, { toValue: 1, duration: tempo, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(pulso, { toValue: 0, duration: tempo, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ativo, tempo]);

  const tocar = () => {
    Animated.sequence([
      Animated.spring(pop, { toValue: 0.94, useNativeDriver: true, speed: 40, bounciness: 5 }),
      Animated.spring(pop, { toValue: 1, useNativeDriver: true, speed: 22, bounciness: 9 }),
    ]).start();
    onPress?.();
  };

  const escalaPulse = pulso.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] });
  const opacidadeOnda = pulso.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0] });

  return (
    <Animated.View style={{ transform: [{ scale: pop }] }}>
      {ativo && (
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            borderRadius: 999,
            backgroundColor: corPulse,
            opacity: opacidadeOnda,
            transform: [{ scale: escalaPulse }],
            ...(estiloPulse || {}),
          }}
        />
      )}
      <TouchableOpacity onPress={tocar} activeOpacity={0.85} style={style}>
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
}
