import React, { useMemo, useRef } from 'react';
import { View, Text, TouchableOpacity, Image, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { normalize } from '../theme';
import { criarEstilos } from '../estilos';
import { PainelVidro } from './Vidro';

// Botão do topo com resposta de toque (spring de escala) — mesmo padrão
// usado no Modo Criança, aqui reaplicado nos botões de voltar/ação que
// aparecem em toda tela do modo Responsável.
function BotaoTopo({ onPress, style, children }) {
  const escala = useRef(new Animated.Value(1)).current;
  const pressIn = () => Animated.spring(escala, { toValue: 0.85, useNativeDriver: true, speed: 40, bounciness: 6 }).start();
  const pressOut = () => Animated.spring(escala, { toValue: 1, useNativeDriver: true, speed: 26, bounciness: 10 }).start();
  return (
    <Animated.View style={{ transform: [{ scale: escala }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={pressIn} onPressOut={pressOut} activeOpacity={0.85} style={style}>
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
}

export function TopBar({ titulo, onVoltar, onAcao, iconeAcao = 'add', logoMode, C, variante, semVidro = false }) {
  const s = useMemo(() => criarEstilos(C, variante), [C, variante]);
  const adulto = variante === 'adulto';
  const conteudo = (
    <View style={s.topBar}>
      {logoMode ? (
        <View style={s.logoWrap}>
          <Image style={{ width: 40, height: 40, resizeMode: 'contain' }} source={require('../../assets/image.png')} />
          <Text style={s.logoTexto}>M.O.T.I.O.N</Text>
        </View>
      ) : (
        <BotaoTopo onPress={onVoltar} style={s.topBarBtn}>
          {adulto ? <Ionicons name="arrow-back" size={normalize(20)} color="#FFFFFF" /> : <Text style={s.topBarBtnTxt}>←</Text>}
        </BotaoTopo>
      )}
      {titulo ? <Text style={s.topBarTitulo} numberOfLines={1}>{titulo}</Text> : <View style={{ flex: 1 }} />}
      {onAcao ? (
        <BotaoTopo onPress={onAcao} style={s.topBarBtn}>
          {adulto ? <Ionicons name={iconeAcao} size={normalize(20)} color="#FFFFFF" /> : <Text style={s.topBarBtnTxt}>{iconeAcao === 'add' ? '+' : iconeAcao}</Text>}
        </BotaoTopo>
      ) : (
        <View style={{ width: normalize(40) }} />
      )}
    </View>
  );

  if (semVidro) {
    // Alto contraste: fundo sólido simples, sem blur, pra máxima legibilidade.
    return <View style={{ backgroundColor: C.primaria, borderBottomLeftRadius: adulto ? 0 : normalize(25), borderBottomRightRadius: adulto ? 0 : normalize(25) }}>{conteudo}</View>;
  }

  return (
    <PainelVidro variante={variante} arredondado={adulto ? 0 : normalize(25)} style={{ borderTopWidth: 0 }}>
      {conteudo}
    </PainelVidro>
  );
}

export function BotaoVoltar({ onPress, C, variante, texto = 'Voltar', semVidro = false }) {
  const s = useMemo(() => criarEstilos(C, variante), [C, variante]);
  const adulto = variante === 'adulto';
  const conteudo = (
    <TouchableOpacity style={s.botaoVoltar} onPress={onPress} activeOpacity={0.8}>
      <Text style={s.botaoVoltarTxt}>{texto}</Text>
    </TouchableOpacity>
  );

  if (semVidro) {
    return <View style={{ backgroundColor: adulto ? C.branco : C.primaria }}>{conteudo}</View>;
  }

  return (
    <PainelVidro variante={variante} arredondado={adulto ? 0 : normalize(25)}>
      {conteudo}
    </PainelVidro>
  );
}
