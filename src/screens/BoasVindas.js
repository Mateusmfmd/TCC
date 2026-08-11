import React, { useRef, useEffect } from 'react';
import { View, Text, SafeAreaView, StatusBar, Platform, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { normalize, fontesFor } from '../theme';
import BotaoAnimado from '../components/BotaoAnimado';

const F = fontesFor('adulto');

// Fonte serifada só para o logo desta tela — usa a serif do sistema
// (Georgia no iOS, "serif" no Android/Web) em vez de baixar uma fonte nova
// via @expo-google-fonts. Zero dependência nova, zero risco de build
// quebrar por falta de `npm install`; se um dia quiserem uma serifada mais
// parecida com a referência (ex: Playfair Display), é só trocar esta
// constante depois de instalar o pacote — o resto do arquivo não muda.
const SERIF = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });

const FUNDO = '#FBF5EF';
const LETRAS = [
  { l: 'M', cor: '#8B7FD1' },
  { l: 'O', cor: '#7CA9E8' },
  { l: 'T', cor: '#5FBFA0' },
  { l: 'I', cor: '#F0C463' },
  { l: 'O', cor: '#F0A860' },
  { l: 'N', cor: '#E88BB0' },
];

// Blob orgânico: um quadrado bem arredondado e rotacionado com um gradiente
// próprio — empilhando 4 desses, sobrepostos e semitransparentes, dá o
// efeito de "campo de cor ondulado" da referência sem precisar de SVG
// (que não está entre as libs do projeto).
function Blob({ style, cores, rotacao = '0deg', opacidade = 0.55 }) {
  return (
    <View style={[{ position: 'absolute', transform: [{ rotate: rotacao }], opacity: opacidade, overflow: 'hidden' }, style]}>
      <LinearGradient colors={cores} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={{ flex: 1 }} />
    </View>
  );
}

// Ponto flutuante — os pontinhos coloridos "boiam" bem devagar, um toque de
// vida na primeira tela que a pessoa vê do app, sem chamar atenção demais.
function Ponto({ top, left, right, tamanho, cor, atraso = 0 }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 2200, delay: atraso, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);
  return (
    <Animated.View
      style={{
        position: 'absolute', top, left, right, width: normalize(tamanho), height: normalize(tamanho),
        borderRadius: normalize(tamanho / 2), backgroundColor: cor,
        transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [0, -normalize(10)] }) }],
      }}
    />
  );
}

export function TelaBoasVindas({ onComecar, onEntrar }) {
  const entrada = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(entrada, { toValue: 1, duration: 650, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: FUNDO }}>
      <StatusBar barStyle="dark-content" backgroundColor={FUNDO} />

      {/* Campo de blobs — fica atrás de tudo, ocupando a metade de baixo da tela */}
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '58%', overflow: 'hidden' }} pointerEvents="none">
        <Blob style={{ width: '85%', height: '85%', left: '-20%', bottom: '5%', borderRadius: normalize(90) }} cores={['#D9CDF5', '#C9E8D6']} rotacao="-8deg" opacidade={0.6} />
        <Blob style={{ width: '80%', height: '75%', right: '-25%', bottom: '18%', borderRadius: normalize(90) }} cores={['#BFE0F7', '#FBE3B8']} rotacao="10deg" opacidade={0.55} />
        <Blob style={{ width: '70%', height: '55%', left: '5%', bottom: '-5%', borderRadius: normalize(80) }} cores={['#C9E8D6', '#E8F3D6']} rotacao="4deg" opacidade={0.5} />
        <Blob style={{ width: '60%', height: '45%', right: '-10%', bottom: '-8%', borderRadius: normalize(70) }} cores={['#FBE3B8', '#F7CFC9']} rotacao="-6deg" opacidade={0.5} />
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, top: 0, backgroundColor: FUNDO, opacity: 0.08 }} />
      </View>

      <Ponto top="12%" left="10%" tamanho={13} cor="#9B8AE0" atraso={0} />
      <Ponto top="34%" right="8%" tamanho={16} cor="#7CA9E8" atraso={400} />
      <Ponto top="46%" left="46%" tamanho={10} cor="#5FBFA0" atraso={800} />
      <Ponto top="63%" left="34%" tamanho={12} cor="#F0C463" atraso={1200} />
      <Ponto top="82%" right="14%" tamanho={11} cor="#E88BB0" atraso={600} />

      <View style={{ flex: 1, justifyContent: 'space-between', paddingHorizontal: normalize(28), paddingTop: normalize(40), paddingBottom: normalize(28) }}>
        <View />

        <Animated.View style={{ alignItems: 'center', opacity: entrada, transform: [{ translateY: entrada.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }] }}>
          <View style={{ flexDirection: 'row' }}>
            {LETRAS.map((item, i) => (
              <Text key={i} style={{ fontFamily: SERIF, fontSize: normalize(52), color: item.cor, letterSpacing: -1 }}>{item.l}</Text>
            ))}
          </View>
          <Text style={{ fontFamily: F.body, fontSize: normalize(15.5), color: '#6B6560', textAlign: 'center', marginTop: normalize(18), lineHeight: normalize(22) }}>
            Comunicação que move.{'\n'}Independência que transforma.
          </Text>
        </Animated.View>

        <View>
          <BotaoAnimado
            onPress={onComecar}
            style={{
              backgroundColor: '#9B8AE0', borderRadius: normalize(18), paddingVertical: normalize(17), alignItems: 'center',
              ...Platform.select({ ios: { shadowColor: '#9B8AE0', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 14 }, default: { elevation: 4 } }),
            }}
          >
            <Text style={{ color: '#FFFFFF', fontFamily: F.bodyBold, fontSize: normalize(16.5) }}>Começar</Text>
          </BotaoAnimado>
          <Animated.View style={{ opacity: entrada }}>
            <Text onPress={onEntrar} style={{ textAlign: 'center', color: '#9B8AE0', fontFamily: F.bodyBold, fontSize: normalize(15), marginTop: normalize(18), padding: normalize(6) }}>
              Entrar
            </Text>
          </Animated.View>
        </View>
      </View>
    </SafeAreaView>
  );
}
