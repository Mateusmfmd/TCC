import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, SafeAreaView, StatusBar, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { normalize, TEMA_RESPONSAVEL, corTema, fontesFor } from '../theme';
import { criarEstilos } from '../estilos';
import { TopBar, BotaoVoltar } from '../components/TopBar';
import Campo from '../components/Campo';
import BotaoAnimado from '../components/BotaoAnimado';
import ItemEscalonado from '../components/ItemEscalonadoMoti';
import { Avisos, mensagemErro } from '../api';
import { useApp } from '../AppContext';
import { notificarAvisoNovo } from '../notifications';

const F = fontesFor('adulto');
const PRESETS = [
  { titulo: 'Estou com fome', mensagem: 'Preciso comer alguma coisa.', emoji: '🍎' },
  { titulo: 'Estou passando mal', mensagem: 'Não estou me sentindo bem.', emoji: '🤢' },
  { titulo: 'Preciso de água', mensagem: 'Quero beber água.', emoji: '💧' },
  { titulo: 'Preciso ir ao banheiro', mensagem: 'Preciso ir ao banheiro.', emoji: '🚻' },
  { titulo: 'Estou com medo', mensagem: 'Estou assustado e preciso de ajuda.', emoji: '😟' },
  { titulo: 'Preciso de ajuda', mensagem: 'Por favor, venha me ajudar.', emoji: '🆘' },
];

export function TelaAvisosResponsavel({ crianca, onVoltar }) {
  const s = useMemo(() => criarEstilos(TEMA_RESPONSAVEL, 'adulto'), []);
  const { usuario } = useApp();
  const [avisos, setAvisos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState(null);
  const [titulo, setTitulo] = useState('');
  const [mensagem, setMensagem] = useState('');

  const carregar = useCallback(async (silencioso = false) => {
    if (!silencioso) setLoading(true);
    try { const res = await Avisos.listar(crianca.id_crianca); if (res.data.success) { const lista = res.data.avisos || []; setAvisos(lista); lista.filter((item) => !item.lido).forEach((item) => notificarAvisoNovo(item)); } }
    catch (err) { if (!silencioso) Alert.alert('Erro', mensagemErro(err)); }
    finally { if (!silencioso) setLoading(false); }
  }, [crianca.id_crianca]);
  useEffect(() => {
    carregar();
    const timer = setInterval(() => carregar(true), 5000);
    return () => clearInterval(timer);
  }, [carregar]);

  const salvarEdicao = async () => {
    if (!titulo.trim() || !mensagem.trim()) return Alert.alert('Atenção', 'Preencha título e mensagem.');
    try { await Avisos.atualizar({ id_aviso: editando.id_aviso, titulo: titulo.trim(), mensagem: mensagem.trim() }); setEditando(null); carregar(); }
    catch (err) { Alert.alert('Erro', mensagemErro(err)); }
  };
  const remover = (id) => Alert.alert('Remover aviso', 'Deseja excluir este aviso?', [{ text: 'Cancelar', style: 'cancel' }, { text: 'Remover', style: 'destructive', onPress: async () => { try { await Avisos.remover(id); carregar(); } catch (err) { Alert.alert('Erro', mensagemErro(err)); } } }]);

  return <SafeAreaView style={s.safe}>
    <StatusBar barStyle="light-content" backgroundColor={TEMA_RESPONSAVEL.primaria} />
    <TopBar titulo={`Avisos de ${crianca.nome}`} onVoltar={onVoltar} C={TEMA_RESPONSAVEL} variante="adulto" />
    <ScrollView contentContainerStyle={s.scroll}>
      <Text style={s.secaoTitulo}>Mensagens recebidas</Text>
      {loading ? <ActivityIndicator color={TEMA_RESPONSAVEL.secundaria} /> : avisos.map((item, i) => <ItemEscalonado key={item.id_aviso} indice={i}>
        <View style={[s.cardRow, s.cardFaixa, !item.lido && { borderLeftWidth: 4, borderLeftColor: TEMA_RESPONSAVEL.alerta }]}>
          <Text style={{ fontSize: normalize(28), marginRight: normalize(10) }}>{item.emoji}</Text>
          <View style={{ flex: 1 }}><Text style={s.cardTitulo}>{item.titulo}</Text><Text style={s.cardSubtitulo}>{item.mensagem}</Text><Text style={s.cardSubtitulo}>{item.lido ? 'Lido' : 'Novo'} · {item.criado_em}</Text></View>
          <View style={{ gap: normalize(12), alignItems: 'center' }}>
            {!item.lido && <TouchableOpacity onPress={() => Avisos.marcarLido(item.id_aviso).then(carregar).catch((err) => Alert.alert('Não foi possível atualizar', mensagemErro(err)))}><Ionicons name="checkmark-circle-outline" size={normalize(21)} color={TEMA_RESPONSAVEL.sucesso} /></TouchableOpacity>}
            <TouchableOpacity onPress={() => { setEditando(item); setTitulo(item.titulo); setMensagem(item.mensagem); }}><Ionicons name="create-outline" size={normalize(20)} color={TEMA_RESPONSAVEL.secundaria} /></TouchableOpacity>
            <TouchableOpacity onPress={() => remover(item.id_aviso)}><Ionicons name="trash-outline" size={normalize(20)} color={TEMA_RESPONSAVEL.erro} /></TouchableOpacity>
          </View>
        </View>
      </ItemEscalonado>)}
      {!loading && avisos.length === 0 && <Text style={s.vazio}>Nenhum aviso recebido ainda.</Text>}
    </ScrollView>
    {editando && <View style={{ position: 'absolute', left: 12, right: 12, top: 90, backgroundColor: TEMA_RESPONSAVEL.branco, borderRadius: 18, padding: 16, elevation: 8 }}>
      <Text style={s.secaoTitulo}>Editar aviso</Text><Campo C={TEMA_RESPONSAVEL} variante="adulto" placeholder="Título" value={titulo} onChangeText={setTitulo} /><Campo C={TEMA_RESPONSAVEL} variante="adulto" placeholder="Mensagem" value={mensagem} onChangeText={setMensagem} />
      <BotaoAnimado onPress={salvarEdicao} style={s.botaoPrimario}><Text style={s.botaoPrimarioTxt}>Salvar alteração</Text></BotaoAnimado>
      <TouchableOpacity onPress={() => setEditando(null)} style={{ alignItems: 'center', padding: 12 }}><Text style={{ color: TEMA_RESPONSAVEL.subtexto, fontFamily: F.bodyBold }}>Cancelar</Text></TouchableOpacity>
    </View>}
    <BotaoVoltar onPress={onVoltar} C={TEMA_RESPONSAVEL} variante="adulto" />
  </SafeAreaView>;
}

export function TelaAvisarResponsavel({ crianca, auth = {}, onVoltar }) {
  const C = corTema(crianca); const s = useMemo(() => criarEstilos(C, 'crianca', { semVidro: !!crianca.alto_contraste }), [C, crianca.alto_contraste]);
  const [custom, setCustom] = useState(''); const [enviando, setEnviando] = useState(false);
  const enviar = async (item) => { setEnviando(true); try { const resposta = await Avisos.criar({ crianca_id: crianca.id_crianca, titulo: item.titulo, mensagem: item.mensagem, emoji: item.emoji, ...(auth.device_secret ? { device_secret: auth.device_secret } : {}), ...(auth.token ? { token: auth.token } : {}) }); if (!resposta.data?.offline) await notificarAvisoNovo({ id_aviso: resposta.data?.id_aviso, titulo: item.titulo, mensagem: item.mensagem, lido: false }); Alert.alert(resposta.data?.offline ? 'Salvo neste aparelho' : 'Enviado', resposta.data?.offline ? 'O aviso ficou salvo no aplicativo. Como ele está sem conexão, não foi enviado a outro dispositivo.' : 'Seu responsável recebeu este aviso.'); setCustom(''); } catch (err) { Alert.alert('Erro', mensagemErro(err)); } finally { setEnviando(false); } };
  return <SafeAreaView style={s.safe}>
    <StatusBar barStyle="light-content" backgroundColor={C.primaria} /><TopBar titulo="Avisar responsável" onVoltar={onVoltar} C={C} variante="crianca" />
    <ScrollView contentContainerStyle={s.scroll}><Text style={s.secaoTitulo}>Como você está?</Text><Text style={{ color: C.subtexto, marginBottom: 14 }}>Toque em uma mensagem para avisar seu responsável.</Text>
      {PRESETS.map((item, i) => <ItemEscalonado key={item.titulo} indice={i}><TouchableOpacity disabled={enviando} onPress={() => enviar(item)} style={[s.cardRow, s.cardFaixa, { alignItems: 'center' }]}><Text style={{ fontSize: 28, marginRight: 12 }}>{item.emoji}</Text><View style={{ flex: 1 }}><Text style={s.cardTitulo}>{item.titulo}</Text><Text style={s.cardSubtitulo}>{item.mensagem}</Text></View><Ionicons name="send-outline" size={20} color={C.primaria} /></TouchableOpacity></ItemEscalonado>)}
      <Text style={s.secaoTitulo}>Outro aviso</Text><Campo C={C} variante="crianca" placeholder="Digite uma mensagem" value={custom} onChangeText={setCustom} /><BotaoAnimado disabled={enviando || !custom.trim()} onPress={() => enviar({ titulo: 'Mensagem da criança', mensagem: custom.trim(), emoji: '🔔' })} style={s.botaoPrimario}><Text style={s.botaoPrimarioTxt}>Enviar mensagem</Text></BotaoAnimado>
    </ScrollView><BotaoVoltar onPress={onVoltar} C={C} variante="crianca" />
  </SafeAreaView>;
}
