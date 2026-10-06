import React, { useRef, useEffect } from 'react';
import { TouchableOpacity, View, Platform, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import { createPressBehavior } from '../pressBehavior';

// Botão usado nos grids do Modo Criança (pictogramas, categorias, menu).
// A animação usa o `Animated` que já vem embutido no React Native — sem
// dependência nativa nova, funciona igual em web/iOS/Android sem
// configuração extra. (Chegamos a usar Reanimated/Moti aqui, mas o Expo SDK
// 54 instala Reanimated 4, que exige o pacote separado `react-native-worklets`
// e ainda tem arestas em web — não vale o risco só por uma animação de toque.)
//
// Comportamentos, conforme a configuração de acessibilidade da criança:
//  - modoVarredura: o toque individual é ignorado; o item só reage visualmente
//    quando `destacado` (a seleção acontece por um toque em qualquer lugar da
//    tela, controlado pela tela pai via useVarredura).
//  - um toque simples seleciona imediatamente (não pode parecer um botão morto).
//  - tempoResposta > 0 (sem varredura): manter pressionado também seleciona
//    ao chegar ao tempo configurado; soltar não duplica a ação.
// Também dá um retorno tátil leve a cada seleção confirmada — ajuda quem tem
// dificuldade motora ou sensorial a perceber que o toque realmente registrou.
export default function BotaoAcessivel({
  children, style, onSelecionar, modoVarredura = false, destacado = false,
  tempoResposta = 0, corDestaque = '#FFD60A', disabled = false,
}) {
  // Number(...) blinda contra tempoResposta chegar como string (ex: "500")
  // vindo de uma resposta de API não normalizada — sem isso, comparações
  // estritas como `=== 0` falham silenciosamente e o botão para de responder
  // ao toque simples sem nenhum aviso.
  const tempoRespostaMs = Number(tempoResposta) || 0;

  const escala = useRef(new Animated.Value(1)).current;
  const progressoDwell = useRef(new Animated.Value(0)).current;

  const animarPop = () => {
    Animated.sequence([
      Animated.spring(escala, { toValue: 1.18, useNativeDriver: true, speed: 30, bounciness: 14 }),
      Animated.spring(escala, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 10 }),
    ]).start();
  };

  const confirmar = () => {
    if (disabled) return;
    animarPop();
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); // haptics falha silenciosa em aparelhos sem suporte — não pode travar o toque
    }
    onSelecionar?.();
  };

  const confirmarRef = useRef(confirmar);
  confirmarRef.current = confirmar;
  const comportamentoToque = useRef(null);
  if (!comportamentoToque.current) {
    comportamentoToque.current = createPressBehavior({ confirm: () => confirmarRef.current(), delayMs: tempoRespostaMs });
  }
  comportamentoToque.current.setDelayMs(tempoRespostaMs);

  const onPressIn = () => {
    if (modoVarredura || disabled) return;
    comportamentoToque.current.pressIn();
    if (tempoRespostaMs > 0) {
      progressoDwell.setValue(0);
      Animated.timing(progressoDwell, { toValue: 1, duration: tempoRespostaMs, useNativeDriver: false }).start();
    }
  };
  const onPressOut = () => {
    comportamentoToque.current.pressOut();
    Animated.timing(progressoDwell, { toValue: 0, duration: 120, useNativeDriver: false }).start();
  };
  const onPress = () => {
    if (modoVarredura || disabled) return;
    comportamentoToque.current.press();
  };

  useEffect(() => {
    if (modoVarredura) {
      Animated.spring(escala, { toValue: destacado ? 1.08 : 1, useNativeDriver: true, speed: 20, bounciness: 10 }).start();
    }
  }, [destacado, modoVarredura]);

  useEffect(() => () => comportamentoToque.current?.dispose(), []);

  return (
    <Animated.View style={{ transform: [{ scale: escala }] }}>
      <TouchableOpacity
        activeOpacity={modoVarredura ? 1 : 0.75}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        onPress={onPress}
        disabled={modoVarredura || disabled}
        style={[
          style,
          { overflow: 'hidden' },
          destacado && modoVarredura ? { borderWidth: 5, borderColor: corDestaque, elevation: 10 } : null,
        ]}
      >
        {children}
        {tempoRespostaMs > 0 && (
          <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 6, backgroundColor: 'rgba(0,0,0,0.12)' }}>
            <Animated.View
              style={{
                height: '100%', backgroundColor: corDestaque,
                width: progressoDwell.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
              }}
            />
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}
