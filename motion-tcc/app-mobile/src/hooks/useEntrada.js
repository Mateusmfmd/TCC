import { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import { DRIVER_NATIVO } from '../theme';

// Entrada padrão do app: fade + subida leve. Quase toda tela repetia o mesmo
// bloco — useRef -> useEffect -> Animated.timing -> interpolate — com pequenas
// variações de duração/atraso. Centralizar aqui deixa o padrão consistente e
// as telas só descrevem a intenção (atraso, duração, quanto sobe).
//
// `quando`: muda de valor faz a entrada tocar de novo (ex: trocar de aba). Com
// o valor padrão (null) a animação roda uma única vez, ao montar.
export function useEntrada({ atraso = 0, duracao = 420, subida = 14, quando = null } = {}) {
  const progresso = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Volta ao começo antes de animar: sem isso, um `quando` novo não
    // provocaria efeito nenhum (o valor já estaria em 1).
    progresso.setValue(0);
    Animated.timing(progresso, {
      toValue: 1,
      duration: duracao,
      delay: atraso,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: DRIVER_NATIVO,
    }).start();
  }, [quando, atraso, duracao, progresso]);

  return {
    opacity: progresso,
    transform: [
      { translateY: progresso.interpolate({ inputRange: [0, 1], outputRange: [subida, 0] }) },
    ],
  };
}

export default useEntrada;
