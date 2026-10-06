import React, { useMemo, useRef, useState } from 'react';
import { View, Text, TextInput, Animated } from 'react-native';
import { criarEstilos } from '../estilos';

// Campo de texto padrão do app, com label e mensagem de erro inline —
// para que "isso não foi preenchido" apareça no próprio formulário,
// não só num Alert genérico.
//
// O label fica sempre visível acima do campo (não "flutuando" por dentro do
// input) de propósito: pra um público com maior carga cognitiva, um rótulo
// que soma/desaparece por cima do próprio texto digitado atrapalha mais do
// que ajuda. Em vez de floating label, o feedback de foco é a borda que
// anima suavemente para a cor primária — mesma ideia de "o campo está vivo",
// sem mexer na posição do texto.
export default function Campo({ label, erro, C, variante, style, onFocus, onBlur, ...props }) {
  const s = useMemo(() => criarEstilos(C, variante), [C, variante]);
  const [focado, setFocado] = useState(false);
  const progresso = useRef(new Animated.Value(0)).current;

  const focar = (e) => {
    setFocado(true);
    Animated.spring(progresso, { toValue: 1, useNativeDriver: false, speed: 20, bounciness: 4 }).start();
    onFocus?.(e);
  };
  const desfocar = (e) => {
    setFocado(false);
    Animated.spring(progresso, { toValue: 0, useNativeDriver: false, speed: 20, bounciness: 4 }).start();
    onBlur?.(e);
  };

  // Sem foco/erro, a borda respeita o que o input já tinha (0 no Modo
  // Criança — mistura com o vidro do card; 1.5 no modo Responsável). Só ao
  // focar ela cresce e vira a cor primária — o resto do tempo, a aparência
  // original de cada variante fica intacta.
  const bordaBase = s.input.borderWidth || 0;
  const corBorda = erro
    ? C.erro
    : progresso.interpolate({ inputRange: [0, 1], outputRange: [s.input.borderColor || 'transparent', C.primaria] });
  const larguraBorda = erro ? 1.5 : progresso.interpolate({ inputRange: [0, 1], outputRange: [bordaBase, Math.max(bordaBase, 2)] });

  return (
    <View>
      {label ? <Text style={s.label}>{label}</Text> : null}
      <Animated.View style={{ borderRadius: s.input.borderRadius, borderWidth: larguraBorda, borderColor: corBorda }}>
        <TextInput
          style={[s.input, { marginBottom: 0, borderWidth: 0 }, style]}
          placeholderTextColor={C.subtexto}
          onFocus={focar}
          onBlur={desfocar}
          {...props}
        />
      </Animated.View>
      {erro ? <Text style={s.erroTexto}>⚠ {erro}</Text> : <View style={{ marginBottom: 9 }} />}
    </View>
  );
}
