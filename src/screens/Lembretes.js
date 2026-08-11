import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, Alert,
  ActivityIndicator, SafeAreaView, StatusBar, Animated, Platform,
} from 'react-native';
import { normalize, TEMA_RESPONSAVEL } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { criarEstilos } from '../estilos';
import { TopBar, BotaoVoltar } from '../components/TopBar';
import Campo from '../components/Campo';
import BannerErro from '../components/BannerErro';
import BotaoAnimado from '../components/BotaoAnimado';
import ItemEscalonado from '../components/ItemEscalonado';
import { Lembretes, mensagemErro } from '../api';
import { useApp } from '../AppContext';
import { agendarNotificacaoLembrete, cancelarNotificacaoLembrete } from '../notifications';

const C = TEMA_RESPONSAVEL;
const V = 'adulto';
const HORA_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;
const RECORRENCIAS = [
  { chave: 'uma_vez', label: 'Uma vez' },
  { chave: 'diaria', label: 'Todo dia' },
  { chave: 'semanal', label: 'Toda semana' },
];

function sombra(cor, intensidade = 1) {
  return Platform.select({
    ios: { shadowColor: cor, shadowOffset: { width: 0, height: 4 * intensidade }, shadowOpacity: 0.15 * intensidade, shadowRadius: 8 * intensidade },
    default: { elevation: 2 * intensidade },
  });
}

// Checkbox redondo com "pop" ao marcar — o check não só aparece, ele salta
// (spring com bounciness alta), pra dar aquela sensação de "tarefa cumprida"
// em vez de só trocar um ícone estático.
function Checkbox({ marcado, onPress }) {
  const escala = useRef(new Animated.Value(marcado ? 1 : 0)).current;
  useEffect(() => {
    Animated.spring(escala, { toValue: marcado ? 1 : 0, useNativeDriver: true, speed: 20, bounciness: 14 }).start();
  }, [marcado]);
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={{ width: normalize(26), height: normalize(26), borderRadius: normalize(8), borderWidth: 2, borderColor: C.secundaria, backgroundColor: marcado ? C.secundaria : 'transparent', alignItems: 'center', justifyContent: 'center', marginRight: normalize(12) }}
    >
      <Animated.View style={{ transform: [{ scale: escala }] }}>
        <Ionicons name="checkmark" size={normalize(16)} color="#FFF" />
      </Animated.View>
    </TouchableOpacity>
  );
}

export function TelaLembretesEditor({ crianca, onVoltar }) {
  const s = useMemo(() => criarEstilos(C, V), []);
  const { usuario } = useApp();
  const [lembretes, setLembretes] = useState([]);
  const [novoTexto, setNovoTexto] = useState('');
  const [novaHora, setNovaHora] = useState('');
  const [novaRecorrencia, setNovaRecorrencia] = useState('uma_vez');
  const [erroTexto, setErroTexto] = useState(null);
  const [erroHora, setErroHora] = useState(null);
  const [erroServidor, setErroServidor] = useState(null);
  const [loading, setLoading] = useState(true);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const res = await Lembretes.listar(crianca.id_crianca, { usuario_id: usuario.id_usuario });
      if (res.data.success) setLembretes(res.data.lembretes);
    } catch (err) { Alert.alert('Erro', mensagemErro(err)); }
    finally { setLoading(false); }
  }, [crianca.id_crianca]);

  useEffect(() => { carregar(); }, [carregar]);

  const adicionar = async () => {
    setErroServidor(null);
    let ok = true;
    if (!novoTexto.trim()) { setErroTexto('Digite o que deseja lembrar'); ok = false; }
    if (novaHora.trim() && !HORA_REGEX.test(novaHora.trim())) { setErroHora('Use o formato HH:MM'); ok = false; }
    if (!ok) return;
    try {
      const res = await Lembretes.criar({ crianca_id: crianca.id_crianca, usuario_id: usuario.id_usuario, texto: novoTexto.trim(), hora: novaHora.trim() || null, recorrencia: novaRecorrencia });
      if (res.data.success && novaHora.trim()) {
        agendarNotificacaoLembrete({ id_lembrete: res.data.id_lembrete, texto: novoTexto.trim(), hora: novaHora.trim(), recorrencia: novaRecorrencia });
      }
      setNovoTexto(''); setNovaHora(''); setNovaRecorrencia('uma_vez');
      carregar();
    } catch (err) { setErroServidor(mensagemErro(err)); }
  };

  const toggleFeito = async (item) => {
    try {
      await Lembretes.alternarFeito(item.id_lembrete, !item.feito, { usuario_id: usuario.id_usuario });
      // Lembrete de "uma vez" concluído não precisa mais notificar.
      if (!item.feito && item.recorrencia === 'uma_vez') {
        cancelarNotificacaoLembrete(item.id_lembrete);
      }
      carregar();
    } catch (err) { Alert.alert('Erro', mensagemErro(err)); }
  };

  const deletar = async (id) => {
    try {
      await Lembretes.remover(id, usuario.id_usuario);
      cancelarNotificacaoLembrete(id);
      carregar();
    } catch (err) { Alert.alert('Erro', mensagemErro(err)); }
  };

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.primaria} />
      <TopBar titulo="Lembretes" onVoltar={onVoltar} C={C} variante={V} />

      <View style={[{ padding: normalize(16), paddingTop: normalize(18), backgroundColor: C.branco, borderBottomLeftRadius: normalize(24), borderBottomRightRadius: normalize(24) }, sombra(C.primaria, 0.8)]}>
        <BannerErro mensagem={erroServidor} C={C} variante={V} onFechar={() => setErroServidor(null)} />
        <Campo C={C} variante={V} erro={erroTexto} placeholder="Lembrar de..." value={novoTexto}
          onChangeText={(t) => { setNovoTexto(t); setErroTexto(null); }} />
        <Campo C={C} variante={V} erro={erroHora} placeholder="Hora (HH:MM, opcional)" value={novaHora}
          onChangeText={(t) => { setNovaHora(t); setErroHora(null); }} />
        <View style={{ flexDirection: 'row', marginBottom: normalize(6) }}>
          {RECORRENCIAS.map((r) => (
            <TouchableOpacity key={r.chave} onPress={() => setNovaRecorrencia(r.chave)} style={[s.chip, novaRecorrencia === r.chave && s.chipAtivo]} activeOpacity={0.85}>
              <Text style={[s.chipTxt, novaRecorrencia === r.chave && s.chipTxtAtivo]}>{r.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {novaHora.trim() ? (
          <Text style={{ color: C.subtexto, fontSize: normalize(11.5), marginBottom: normalize(10) }}>
            {novaRecorrencia === 'semanal'
              ? 'Lembretes semanais aparecem na lista, mas ainda não disparam notificação.'
              : 'Vai notificar neste aparelho no horário marcado.'}
          </Text>
        ) : null}
        <BotaoAnimado onPress={adicionar} style={[s.botaoPrimario, { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: normalize(6) }]}>
          <Ionicons name="add" size={normalize(17)} color="#FFFFFF" />
          <Text style={s.botaoPrimarioTxt}>Adicionar lembrete</Text>
        </BotaoAnimado>
      </View>

      <ScrollView contentContainerStyle={s.scroll}>
        {loading ? <ActivityIndicator color={C.secundaria} /> : lembretes.map((item, i) => (
          <ItemEscalonado key={item.id_lembrete} indice={i}>
            <View style={[s.cardRow, item.feito && { opacity: 0.55 }]}>
              <Checkbox marcado={item.feito} onPress={() => toggleFeito(item)} />
              <View style={{ flex: 1 }}>
                <Text style={[s.cardTitulo, item.feito && { textDecorationLine: 'line-through' }]}>{item.texto}</Text>
                <Text style={s.cardSubtitulo}>{item.hora ? item.hora.slice(0, 5) + ' · ' : ''}{RECORRENCIAS.find((r) => r.chave === item.recorrencia)?.label}</Text>
              </View>
              <TouchableOpacity onPress={() => deletar(item.id_lembrete)}><Ionicons name="trash-outline" size={normalize(18)} color={C.erro} /></TouchableOpacity>
            </View>
          </ItemEscalonado>
        ))}
        {!loading && lembretes.length === 0 && <Text style={s.vazio}>Nenhum lembrete por enquanto.</Text>}
      </ScrollView>
      <BotaoVoltar onPress={onVoltar} C={C} variante={V} />
    </SafeAreaView>
  );
}
