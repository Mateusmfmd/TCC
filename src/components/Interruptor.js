import React, { useMemo, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { normalize, fontesFor } from '../theme';
import { criarEstilos } from '../estilos';

// Switch animado: o thumb desliza (não só "pula") e a trilha faz cross-fade
// de cor. Some/Interpolate usam o mesmo `Animated.Value`, então o gesto de
// ligar/desligar sempre fica sincronizado, mesmo em toques repetidos rápidos.
export default function Interruptor({ label, valor, onToggle, C, variante, descricao }) {
  const s = useMemo(() => criarEstilos(C, variante), [C, variante]);
  const F = fontesFor(variante);
  const progresso = useRef(new Animated.Value(valor ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(progresso, { toValue: valor ? 1 : 0, useNativeDriver: false, speed: 22, bounciness: 6 }).start();
  }, [valor]);

  const largura = s.switchFake.width;
  const alturaThumb = s.switchHandle.width;
  const percurso = largura - alturaThumb - (s.switchFake.padding || 3) * 2;

  return (
    <TouchableOpacity style={s.cardRow} onPress={() => onToggle(!valor)} activeOpacity={0.8}>
      <View style={{ flex: 1, marginRight: normalize(10) }}>
        <Text style={{ fontSize: normalize(15), fontFamily: F.bodyBold, color: C.texto }}>{label}</Text>
        {descricao ? <Text style={s.cardSubtitulo}>{descricao}</Text> : null}
      </View>
      <Animated.View
        style={[
          s.switchFake,
          { backgroundColor: progresso.interpolate({ inputRange: [0, 1], outputRange: [C.cinzaMedio, C.sucesso] }) },
        ]}
      >
        <Animated.View style={[s.switchHandle, { transform: [{ translateX: progresso.interpolate({ inputRange: [0, 1], outputRange: [0, percurso] }) }] }]} />
      </Animated.View>
    </TouchableOpacity>
  );
}
