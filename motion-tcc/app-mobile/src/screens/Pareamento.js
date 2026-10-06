import React, { useMemo, useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, SafeAreaView, StatusBar, KeyboardAvoidingView, Platform, Animated, Easing } from 'react-native';
import { normalize, TEMA_RESPONSAVEL, fontesFor } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { criarEstilos } from '../estilos';
import { BotaoVoltar } from '../components/TopBar';
import { FundoGradiente, PainelVidro } from '../components/Vidro';
import BannerErro from '../components/BannerErro';
import BotaoAnimado from '../components/BotaoAnimado';
import { Pareamento, mensagemErro } from '../api';
import { useApp } from '../AppContext';

const C = TEMA_RESPONSAVEL;
const V = 'adulto';
const F = fontesFor(V);

export function TelaPareamentoEntrar({ onVoltar, onPareado }) {
  const s = useMemo(() => criarEstilos(C, V), []);
  const { entrarComoPareado } = useApp();
  const [codigo, setCodigo] = useState('');
  const [erro, setErro] = useState(null);
  const [loading, setLoading] = useState(false);

  // O bloco inteiro (ícone + título + campo + botão) entra junto com
  // fade + subida — a tela é enxuta, então uma entrada só já basta.
  const entrada = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(entrada, {
      toValue: 1,
      duration: 480,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: Platform.OS !== 'web',
    }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const confirmar = async () => {
    setErro(null);
    if (codigo.length !== 6) { setErro('Digite os 6 dígitos do código gerado pelo responsável'); return; }
    setLoading(true);
    try {
      const res = await Pareamento.validar(codigo);
      if (res.data.success) {
        await entrarComoPareado(res.data.device_secret, res.data.crianca);
        onPareado();
      } else {
        setErro(res.data.message);
      }
    } catch (err) {
      setErro(mensagemErro(err, 'Código inválido ou expirado'));
    } finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <FundoGradiente variante={V} />
      <StatusBar barStyle="light-content" backgroundColor={C.primaria} />
      <Animated.View style={{ flex: 1, opacity: entrada, transform: [{ translateY: entrada.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }] }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, justifyContent: 'center', padding: normalize(28) }}>
        <PainelVidro variante={V} arredondado={normalize(24)} style={{ width: normalize(84), height: normalize(84), alignSelf: 'center', marginBottom: normalize(18) }}>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="phone-portrait-outline" size={normalize(38)} color="#FFFFFF" />
          </View>
        </PainelVidro>
        <Text style={{ fontSize: normalize(23), fontFamily: F.display, color: '#FFFFFF', textAlign: 'center', marginBottom: normalize(8) }}>
          Parear este dispositivo
        </Text>
        <Text style={{ color: 'rgba(255,255,255,0.75)', fontFamily: F.body, textAlign: 'center', marginBottom: normalize(28), fontSize: normalize(13) }}>
          Peça ao responsável o código de 6 dígitos gerado no perfil da criança.
        </Text>

        <BannerErro mensagem={erro} C={{ ...C, fundo: 'transparent' }} variante={V} onFechar={() => setErro(null)} />

        <TextInput
          style={{
            backgroundColor: '#FFF', borderRadius: normalize(18), paddingVertical: normalize(18), fontSize: normalize(32),
            fontFamily: F.display, textAlign: 'center', letterSpacing: normalize(9), marginBottom: normalize(20), color: C.texto,
          }}
          value={codigo}
          onChangeText={(t) => { setCodigo(t.replace(/[^0-9]/g, '').slice(0, 6)); setErro(null); }}
          keyboardType="number-pad"
          placeholder="000000"
          placeholderTextColor={C.subtexto}
          maxLength={6}
        />
        <BotaoAnimado onPress={confirmar} loading={loading} style={s.botaoPrimario}>
          <Text style={s.botaoPrimarioTxt}>Entrar</Text>
        </BotaoAnimado>
      </KeyboardAvoidingView>
      </Animated.View>
      <BotaoVoltar onPress={onVoltar} C={C} variante={V} texto="Voltar ao login" />
    </SafeAreaView>
  );
}
