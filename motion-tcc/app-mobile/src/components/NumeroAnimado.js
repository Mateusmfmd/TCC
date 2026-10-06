import React, { useEffect, useMemo, useRef } from 'react';
import { Text, Animated } from 'react-native';
import { normalize } from '../theme';

// Número que "conta" de 0 até o valor final ao montar — dá vida aos
// indicadores do painel (falas do dia, humor, rotinas) sem distrair.
// Funciona com o `Animated` embutido, sem dependência nativa nova.
export default function NumeroAnimado({ valor, estiloTexto, arredondar = true }) {
  const anim = useRef(new Animated.Value(0)).current;
  const alvo = Number(valor) || 0;

  useEffect(() => {
    anim.setValue(0);
    Animated.spring(anim, {
      toValue: alvo,
      useNativeDriver: false,
      speed: 16,
      bounciness: 4,
    }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alvo]);

  const valorInterpolado = anim.interpolate({
    inputRange: [0, alvo || 1],
    outputRange: ['0', String(alvo)],
    extrapolate: 'clamp',
  });

  // Quando o alvo é 0 a interpolação ficaria presa; garantimos "0".
  const texto = alvo === 0 ? '0' : valorInterpolado;

  const estiloFinal = useMemo(
    () => ({ fontSize: normalize(30), fontFamily: estiloTexto?.fontFamily, color: estiloTexto?.color, lineHeight: normalize(38), textAlign: estiloTexto?.textAlign, overflow: 'hidden' }),
    [estiloTexto]
  );

  return <Animated.Text style={[estiloFinal, estiloTexto?.style]}>{texto}</Animated.Text>;
}
