import React, { useMemo, useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, SafeAreaView, StatusBar, Platform, Animated, Easing } from 'react-native';
import { normalize, TEMA_RESPONSAVEL, fontesFor } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { criarEstilos } from '../estilos';
import { TopBar, BotaoVoltar } from '../components/TopBar';
import BotaoAnimado from '../components/BotaoAnimado';
import ItemEscalonado from '../components/ItemEscalonadoMoti';
import { Hardware, mensagemErro } from '../api';
import { falarTexto } from '../speech';

const C = TEMA_RESPONSAVEL;
const V = 'adulto';
const F = fontesFor(V);

const BOTOES_HARDWARE = [
  { id: 1, label: 'Vermelho', cor: '#FF3B30' },
  { id: 2, label: 'Amarelo', cor: '#E8C61D' },
  { id: 3, label: 'Verde', cor: '#34C759' },
  { id: 4, label: 'Azul', cor: '#3D8BFF' },
  { id: 5, label: 'Preto', cor: '#2B2B33' },
];
const OPCOES_AUDIO = [
  { arquivo: 'andar.mp3', fala: 'Andar' },
  { arquivo: 'brincar.mp3', fala: 'Brincar' },
  { arquivo: 'banheiro.mp3', fala: 'Banheiro' },
  { arquivo: 'nao_quero.mp3', fala: 'Não quero' },
  { arquivo: 'onde_vamos.mp3', fala: 'Onde vamos?' },
  { arquivo: 'esta_muito_barulho.mp3', fala: 'Está muito barulho' },
  { arquivo: 'estou_assustado.mp3', fala: 'Estou assustado' },
  { arquivo: 'estou_com_sono.mp3', fala: 'Estou com sono' },
  { arquivo: 'preciso_lavar_as_maos.mp3', fala: 'Preciso lavar as mãos' },
  { arquivo: 'kettle.mp3', fala: 'Kettle' },
  { arquivo: 'posso_brincar.mp3', fala: 'Posso brincar?' },
  { arquivo: 'que_horas_sao.mp3', fala: 'Que horas são?' },
  { arquivo: 'gosto_de_fruta.mp3', fala: 'Gosto de fruta.' },
  { arquivo: 'esta_quente.mp3', fala: 'Está quente' },
];

function sombra(cor) {
  return Platform.select({
    ios: { shadowColor: cor, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6 },
    default: { elevation: 2 },
  });
}

export function TelaBotaoHardware({ onVoltar }) {
  const s = useMemo(() => criarEstilos(C, V), []);
  const [botaoSel, setBotaoSel] = useState(null);
  const [loading, setLoading] = useState(false);
  const [salvandoAudio, setSalvandoAudio] = useState(false);
  const [configuracoes, setConfiguracoes] = useState({});

  useEffect(() => {
    Hardware.listarConfiguracoes().then((res) => {
      if (res?.data?.success) {
        const mapa = {};
        (res.data.botoes || []).forEach((item) => { mapa[String(item.id_botao)] = item; });
        setConfiguracoes(mapa);
      }
    }).catch((err) => Alert.alert('Não foi possível carregar', mensagemErro(err, 'Verifique a conexão e tente novamente.')));
  }, []);

  // O conteúdo entra com fade + subida — os cards mantêm a cascata própria
  // do ItemEscalonado, que fica mais visível com essa entrada separada.
  const entradaConteudo = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(entradaConteudo, {
      toValue: 1,
      duration: 420,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: Platform.OS !== 'web',
    }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [botaoSel]);

  const ativarSistema = async () => {
    setLoading(true);
    try {
      const res = await Hardware.ativarSistema();
      if (res.data.success && res.data.offline) {
        Alert.alert('Modo offline', res.data.message);
      } else if (res.data.success) {
        Alert.alert('Sucesso', 'Sistema de hardware iniciado!');
      } else {
        Alert.alert('Erro', res.data.message);
      }
    } catch (err) {
      Alert.alert('Erro', 'Não foi possível conectar ao servidor de hardware (Flask/Python).');
    } finally { setLoading(false); }
  };

  const salvarConfigBotao = async (id, audio) => {
    if (salvandoAudio) return;
    setSalvandoAudio(true);
    try {
      const res = await Hardware.configurarBotao(id, audio.arquivo, audio.fala);
      if (!res?.data?.success) throw new Error(res?.data?.message || 'A API não confirmou o salvamento.');
      Alert.alert(res.data.offline ? 'Salvo neste aparelho' : 'Sucesso', res.data.offline
        ? `A associação local foi salva e será reproduzida por voz como teste. Para acionar o botão físico, conecte o servidor de hardware.`
        : `Botão ${id} configurado com: ${audio.fala}`);
      setConfiguracoes((prev) => ({ ...prev, [String(id)]: { ...(prev[String(id)] || {}), nome_audio: audio.arquivo, descricao_audio: audio.fala } }));
      if (res.data.offline) falarTexto(audio.fala);
      setBotaoSel(null);
    } catch (err) {
      Alert.alert('Erro', mensagemErro(err, 'Falha ao salvar configuração.'));
    } finally {
      setSalvandoAudio(false);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.primaria} />
      <TopBar titulo="Hardware" onVoltar={onVoltar} C={C} variante={V} />
      <ScrollView contentContainerStyle={s.scroll}>
        {!botaoSel ? (
          <Animated.View style={{ opacity: entradaConteudo, transform: [{ translateY: entradaConteudo.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }] }}>
            <BotaoAnimado onPress={ativarSistema} loading={loading} style={[s.botaoPrimario, { backgroundColor: C.roxoSuave, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: normalize(8) }]}>
              <Ionicons name="power-outline" size={normalize(17)} color="#FFFFFF" />
              <Text style={s.botaoPrimarioTxt}>Ativar sistema</Text>
            </BotaoAnimado>
            <Text style={s.secaoTitulo}>Configurar botões físicos</Text>
            {BOTOES_HARDWARE.map((b, i) => (
              <ItemEscalonado key={b.id} indice={i}>
                <TouchableOpacity style={s.cardRow} onPress={() => setBotaoSel(b)} activeOpacity={0.85}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <View style={[{ width: normalize(32), height: normalize(32), borderRadius: normalize(16), backgroundColor: b.cor, marginRight: normalize(14), borderWidth: 2, borderColor: '#FFFFFF' }, sombra(b.cor)]} />
                    <View>
                      <Text style={[s.cardTitulo, { textTransform: 'uppercase' }]}>{b.label}</Text>
                      <Text style={s.cardSubtitulo} numberOfLines={1}>{configuracoes[String(b.id)]?.descricao_audio || 'Áudio não configurado'}</Text>
                      {configuracoes[String(b.id)]?.nome_audio ? <Text style={[s.cardSubtitulo, { fontSize: normalize(10), opacity: 0.7 }]} numberOfLines={1}>{configuracoes[String(b.id)].nome_audio}</Text> : null}
                    </View>
                  </View>
                  <View style={{ backgroundColor: C.secundaria, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 10 }}>
                    <Text style={{ color: '#FFF', fontFamily: F.bodyBold, fontSize: normalize(11), letterSpacing: 0.4 }}>EDITAR</Text>
                  </View>
                </TouchableOpacity>
              </ItemEscalonado>
            ))}
          </Animated.View>
        ) : (
          <Animated.View style={{ opacity: entradaConteudo, transform: [{ translateY: entradaConteudo.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }] }}>
            <TouchableOpacity onPress={() => setBotaoSel(null)} style={{ marginBottom: normalize(20), flexDirection: 'row', alignItems: 'center', gap: normalize(4) }} activeOpacity={0.7}>
              <Ionicons name="chevron-back" size={normalize(15)} color={C.secundaria} />
              <Text style={{ color: C.secundaria, fontFamily: F.bodyBold }}>Voltar para lista</Text>
            </TouchableOpacity>
            <Text style={s.secaoTitulo}>Botão {botaoSel.label}</Text>
            <Text style={{ color: C.subtexto, marginBottom: normalize(20) }}>{salvandoAudio ? 'Salvando no banco...' : 'Escolha o som:'}</Text>
            {OPCOES_AUDIO.map((audio, i) => (
              <ItemEscalonado key={audio.arquivo} indice={i}>
                <TouchableOpacity style={s.cardRow} onPress={() => salvarConfigBotao(botaoSel.id, audio)} disabled={salvandoAudio} activeOpacity={0.85}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: normalize(8), flex: 1 }}>
                    <Ionicons name="musical-notes-outline" size={normalize(16)} color={C.subtexto} />
                    <View><Text style={{ fontFamily: F.bodyBold, color: C.texto }}>{audio.fala}</Text><Text style={s.cardSubtitulo}>{audio.arquivo}</Text></View>
                  </View>
                  <Ionicons name="chevron-forward" size={normalize(18)} color={C.subtexto} />
                </TouchableOpacity>
              </ItemEscalonado>
            ))}
          </Animated.View>
        )}
      </ScrollView>
      <BotaoVoltar onPress={onVoltar} C={C} variante={V} />
    </SafeAreaView>
  );
}
