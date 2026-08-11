import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, SafeAreaView, StatusBar, Platform } from 'react-native';
import { normalize, TEMA_RESPONSAVEL, fontesFor } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { criarEstilos } from '../estilos';
import { TopBar, BotaoVoltar } from '../components/TopBar';
import BotaoAnimado from '../components/BotaoAnimado';
import ItemEscalonado from '../components/ItemEscalonado';
import { Hardware, mensagemErro } from '../api';

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
const OPCOES_AUDIO = Array.from({ length: 15 }, (_, i) => `som${i + 1}.mp3`);

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

  const ativarSistema = async () => {
    setLoading(true);
    try {
      const res = await Hardware.ativarSistema();
      if (res.data.success) {
        Alert.alert('Sucesso', 'Sistema de hardware iniciado!');
      } else {
        Alert.alert('Erro', res.data.message);
      }
    } catch (err) {
      Alert.alert('Erro', 'Não foi possível conectar ao servidor de hardware (Flask/Python).');
    } finally { setLoading(false); }
  };

  const salvarConfigBotao = async (id, audio) => {
    try {
      await Hardware.configurarBotao(id, audio);
      Alert.alert('Sucesso', `Botão ${id} configurado!`);
      setBotaoSel(null);
    } catch (err) {
      Alert.alert('Erro', mensagemErro(err, 'Falha ao salvar configuração.'));
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.primaria} />
      <TopBar titulo="Hardware" onVoltar={onVoltar} C={C} variante={V} />
      <ScrollView contentContainerStyle={s.scroll}>
        {!botaoSel ? (
          <View>
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
                      <Text style={s.cardSubtitulo}>ARCADE MODE</Text>
                    </View>
                  </View>
                  <View style={{ backgroundColor: C.secundaria, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 10 }}>
                    <Text style={{ color: '#FFF', fontFamily: F.bodyBold, fontSize: normalize(11), letterSpacing: 0.4 }}>EDITAR</Text>
                  </View>
                </TouchableOpacity>
              </ItemEscalonado>
            ))}
          </View>
        ) : (
          <View>
            <TouchableOpacity onPress={() => setBotaoSel(null)} style={{ marginBottom: normalize(20), flexDirection: 'row', alignItems: 'center', gap: normalize(4) }} activeOpacity={0.7}>
              <Ionicons name="chevron-back" size={normalize(15)} color={C.secundaria} />
              <Text style={{ color: C.secundaria, fontFamily: F.bodyBold }}>Voltar para lista</Text>
            </TouchableOpacity>
            <Text style={s.secaoTitulo}>Botão {botaoSel.label}</Text>
            <Text style={{ color: C.subtexto, marginBottom: normalize(20) }}>Escolha o som:</Text>
            {OPCOES_AUDIO.map((audio, i) => (
              <ItemEscalonado key={audio} indice={i}>
                <TouchableOpacity style={s.cardRow} onPress={() => salvarConfigBotao(botaoSel.id, audio)} activeOpacity={0.85}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: normalize(8) }}>
                    <Ionicons name="musical-notes-outline" size={normalize(16)} color={C.subtexto} />
                    <Text style={{ fontFamily: F.bodyBold, color: C.texto }}>{audio}</Text>
                  </View>
                </TouchableOpacity>
              </ItemEscalonado>
            ))}
          </View>
        )}
      </ScrollView>
      <BotaoVoltar onPress={onVoltar} C={C} variante={V} />
    </SafeAreaView>
  );
}
