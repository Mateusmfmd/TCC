import React, { useEffect, useRef } from 'react';
import { Animated, Platform } from 'react-native';

// Envoltório de entrada reutilizável — tudo o que estiver dentro aparece
// com um fade suave combinado com uma subida leve, em vez de surgir seco.
// A web (expo-web) não tem o driver nativo de animação do React Native,
// então `useNativeDriver` fica `false` no navegador — as propriedades
// opacity e transform funcionam igual com o driver JS, só um pouco mais
// pesadas em telas muito longas (aqui são usadas em cards e seções, não
// em listas com centenas de itens, então o custo é irrelevante).
//
// `quando` permite reexecutar a animação quando algo muda (ex: mudar de
// aba, carregar dados novos) — quando o valor muda, o item "reentra".
// `subida` controla quantos pixels o conteúdo sobe durante a entrada
// (padrão 18px: perceptível sem parecer que foi "jogado" na tela).
export default function EntradaSuave({
  children,
  atraso = 0,
  duracao = 420,
  quando = null,
  subida = 18,
  style,
}) {
  const progresso = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.timing(progresso, {
      toValue: 1,
      duration: duracao,
      delay: atraso,
      easing: undefined,
      useNativeDriver: Platform.OS !== 'web',
    });
    loop.start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quando]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: progresso,
          transform: [
            { translateY: progresso.interpolate({ inputRange: [0, 1], outputRange: [subida, 0] }) },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
