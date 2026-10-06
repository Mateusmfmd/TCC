import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, Alert,
  ActivityIndicator, SafeAreaView, StatusBar, Animated, Platform, Easing,
} from 'react-native';
import { normalize, TEMA_RESPONSAVEL } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { criarEstilos } from '../estilos';
import { TopBar, BotaoVoltar } from '../components/TopBar';
import Campo from '../components/Campo';
import BannerErro from '../components/BannerErro';
import BotaoAnimado from '../components/BotaoAnimado';
import ItemEscalonado from '../components/ItemEscalonadoMoti';
import { Lembretes, mensagemErro } from '../api';
import { useApp } from '../AppContext';
import { agendarNotificacaoLembrete, cancelarNotificacaoLembrete, configurarNotificacoes, sincronizarNotificacoesLembretes } from '../notifications';

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
  const [salvando, setSalvando] = useState(false);

  // O card de "novo lembrete" e a lista entram separados (fade + subida),
  // com atrasos escalonados — a tela abre em dois tempos em vez de tudo
  // ao mesmo tempo.
  const entradaCard = useRef(new Animated.Value(0)).current;
  const entradaLista = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(entradaCard, {
      toValue: 1,
      duration: 420,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: Platform.OS !== 'web',
    }).start();
    Animated.timing(entradaLista, {
      toValue: 1,
      duration: 420,
      delay: 100,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: Platform.OS !== 'web',
    }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const res = await Lembretes.listar(crianca.id_crianca);
      if (res.data.success) { setLembretes(res.data.lembretes); sincronizarNotificacoesLembretes(res.data.lembretes).catch(() => {}); }
    } catch (err) { Alert.alert('Erro', mensagemErro(err)); }
    finally { setLoading(false); }
  }, [crianca.id_crianca]);

  useEffect(() => { carregar(); }, [carregar]);

  const adicionar = async () => {
    if (salvando) return;
    setErroServidor(null);
    let ok = true;
    if (!novoTexto.trim()) { setErroTexto('Digite o que deseja lembrar'); ok = false; }
    if (novaHora.trim() && !HORA_REGEX.test(novaHora.trim())) { setErroHora('Use o formato HH:MM'); ok = false; }
    if (!ok) return;
    setSalvando(true);
    try {
      const res = await Lembretes.criar({ crianca_id: crianca.id_crianca, texto: novoTexto.trim(), hora: novaHora.trim() || null, recorrencia: novaRecorrencia });
      let mensagemSucesso = 'Lembrete salvo com sucesso.';
      if (novaHora.trim()) {
        const permissao = await configurarNotificacoes();
        const resultadoNotificacao = permissao.enabled
          ? await agendarNotificacaoLembrete({ id_lembrete: res.data.id_lembrete, texto: novoTexto.trim(), hora: novaHora.trim(), recorrencia: novaRecorrencia })
          : { ok: false, message: permissao.message };
        if (!resultadoNotificacao.ok) {
          setErroServidor(`Lembrete salvo, mas a notificação não foi programada: ${resultadoNotificacao.message}`);
        } else {
          mensagemSucesso = resultadoNotificacao.message;
        }
      }
      setNovoTexto(''); setNovaHora(''); setNovaRecorrencia('uma_vez');
      await carregar();
      Alert.alert('Tudo certo', mensagemSucesso);
    } catch (err) { setErroServidor(mensagemErro(err)); }
    finally { setSalvando(false); }
  };

  const toggleFeito = async (item) => {
    try {
      await Lembretes.alternarFeito(item.id_lembrete, !item.feito);
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

      <Animated.View style={[{ padding: normalize(16), paddingTop: normalize(18), backgroundColor: C.branco, borderBottomLeftRadius: normalize(24), borderBottomRightRadius: normalize(24) }, sombra(C.primaria, 0.8), { opacity: entradaCard, transform: [{ translateY: entradaCard.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }] }]}>
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
              ? 'Vai notificar toda semana no mesmo dia em que foi criado.'
              : 'Vai notificar neste aparelho no horário marcado.'}
          </Text>
        ) : null}
        <BotaoAnimado onPress={adicionar} loading={salvando} style={[s.botaoPrimario, { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: normalize(6) }]}>
          <Ionicons name="add" size={normalize(17)} color="#FFFFFF" />
          <Text style={s.botaoPrimarioTxt}>Adicionar lembrete</Text>
        </BotaoAnimado>
      </Animated.View>

      <ScrollView contentContainerStyle={s.scroll}>
        {loading ? <ActivityIndicator color={C.secundaria} /> : (
          <Animated.View style={{ opacity: entradaLista, transform: [{ translateY: entradaLista.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }] }}>
          {lembretes.map((item, i) => (
          <ItemEscalonado key={item.id_lembrete} indice={i}>
            <View style={[s.cardRow, s.cardFaixa, item.feito && { opacity: 0.55 }]}>
              <Checkbox marcado={item.feito} onPress={() => toggleFeito(item)} />
              <View style={{ flex: 1 }}>
                <Text style={[s.cardTitulo, item.feito && { textDecorationLine: 'line-through' }]}>{item.texto}</Text>
                <Text style={s.cardSubtitulo}>{item.hora ? item.hora.slice(0, 5) + ' · ' : ''}{RECORRENCIAS.find((r) => r.chave === item.recorrencia)?.label}</Text>
              </View>
              <TouchableOpacity onPress={() => deletar(item.id_lembrete)}><Ionicons name="trash-outline" size={normalize(18)} color={C.erro} /></TouchableOpacity>
            </View>
          </ItemEscalonado>
        ))}
          </Animated.View>
        )}
        {!loading && lembretes.length === 0 && <Text style={s.vazio}>Nenhum lembrete por enquanto.</Text>}
      </ScrollView>
      <BotaoVoltar onPress={onVoltar} C={C} variante={V} />
    </SafeAreaView>
  );
}
