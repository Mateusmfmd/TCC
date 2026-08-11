import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, SafeAreaView, StatusBar, Alert } from 'react-native';
import { normalize, TEMA_RESPONSAVEL, HUMORES, fontesFor } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { criarEstilos } from '../estilos';
import { TopBar, BotaoVoltar } from '../components/TopBar';
import { GraficoBarrasHorizontais, GraficoBarrasVerticais } from '../components/Graficos';
import ItemEscalonado from '../components/ItemEscalonado';
import BotaoAnimado from '../components/BotaoAnimado';
import { Monitoramento, Historico, mensagemErro } from '../api';
import { useApp } from '../AppContext';

const C = TEMA_RESPONSAVEL;
const V = 'adulto';
const F = fontesFor(V);
const INTERVALO_ATUALIZACAO_MS = 20000; // "tempo real" via consulta periódica (polling)

export function TelaMonitoramento({ crianca, onVoltar }) {
  const s = useMemo(() => criarEstilos(C, V), []);
  const { usuario } = useApp();
  const [resumo, setResumo] = useState(null);
  const [historico, setHistorico] = useState([]);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef(null);

  const carregar = useCallback(async (silencioso = false) => {
    if (!silencioso) setLoading(true);
    try {
      const [res, resHist] = await Promise.all([
        Monitoramento.resumo(crianca.id_crianca, usuario.id_usuario, 7),
        Historico.listar(crianca.id_crianca, usuario.id_usuario, 30),
      ]);
      if (res.data.success) setResumo(res.data);
      if (resHist.data.success) setHistorico(resHist.data.historico);
    } catch (err) {
      if (!silencioso) console.log(mensagemErro(err));
    } finally { if (!silencioso) setLoading(false); }
  }, [crianca.id_crianca]);

  const limparHistorico = () => {
    Alert.alert(
      'Limpar histórico de falas?',
      'Isso apaga o registro de falas usadas por ' + crianca.nome + '. As frases favoritas e o conteúdo dos pictogramas não são afetados.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpar', style: 'destructive', onPress: async () => {
            try {
              await Historico.limpar(crianca.id_crianca, usuario.id_usuario);
              setHistorico([]);
              carregar();
            } catch (err) { Alert.alert('Erro', mensagemErro(err)); }
          },
        },
      ]
    );
  };

  useEffect(() => {
    carregar();
    intervalRef.current = setInterval(() => carregar(true), INTERVALO_ATUALIZACAO_MS);
    return () => clearInterval(intervalRef.current);
  }, [carregar]);

  const falasPorDiaFormatado = (resumo?.falas_por_dia || []).map((d) => ({
    ...d, diaLabel: d.dia ? d.dia.slice(8, 10) + '/' + d.dia.slice(5, 7) : '',
  }));

  const rotinasPct = resumo?.total_rotinas
    ? Math.round(((resumo.rotinas_por_dia.reduce((acc, d) => acc + Number(d.total), 0)) / (resumo.total_rotinas * 7)) * 100)
    : 0;

  const contagemHumor = HUMORES.map((h) => ({
    ...h, total: (resumo?.humor || []).filter((r) => r.humor === h.chave).length,
  })).filter((h) => h.total > 0);

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.primaria} />
      <TopBar titulo="Monitoramento" onVoltar={onVoltar} C={C} variante={V} />
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={{ color: C.subtexto, marginBottom: normalize(14), fontSize: normalize(12) }}>
          Últimos 7 dias · atualiza automaticamente a cada {INTERVALO_ATUALIZACAO_MS / 1000}s
        </Text>

        {loading ? <ActivityIndicator color={C.secundaria} /> : (
          <>
            <ItemEscalonado indice={0}>
              <View style={[s.card, { flexDirection: 'row', justifyContent: 'space-around' }]}>
                <View style={{ alignItems: 'center' }}>
                  <Ionicons name="chatbubble-ellipses" size={normalize(16)} color={C.secundaria} style={{ marginBottom: 4 }} />
                  <Text style={{ fontSize: normalize(26), fontFamily: F.display, color: C.secundaria }}>{resumo?.total_falas ?? 0}</Text>
                  <Text style={s.cardSubtitulo}>falas</Text>
                </View>
                <View style={{ alignItems: 'center' }}>
                  <Ionicons name="checkmark-circle" size={normalize(16)} color={C.sucesso} style={{ marginBottom: 4 }} />
                  <Text style={{ fontSize: normalize(26), fontFamily: F.display, color: C.sucesso }}>{rotinasPct}%</Text>
                  <Text style={s.cardSubtitulo}>rotinas cumpridas</Text>
                </View>
                <View style={{ alignItems: 'center' }}>
                  <Ionicons name="notifications" size={normalize(16)} color={C.alerta} style={{ marginBottom: 4 }} />
                  <Text style={{ fontSize: normalize(26), fontFamily: F.display, color: C.alerta }}>
                    {resumo?.lembretes_resumo?.concluidos ?? 0}/{resumo?.lembretes_resumo?.total ?? 0}
                  </Text>
                  <Text style={s.cardSubtitulo}>lembretes ok</Text>
                </View>
              </View>
            </ItemEscalonado>

            <Text style={s.secaoTitulo}>Falas por dia</Text>
            <ItemEscalonado indice={1}>
              <View style={s.card}>
                <GraficoBarrasVerticais dados={falasPorDiaFormatado} chaveLabel="diaLabel" chaveValor="total" C={C} variante={V} />
              </View>
            </ItemEscalonado>

            <Text style={s.secaoTitulo}>Mais usados</Text>
            <ItemEscalonado indice={2}>
              <View style={s.card}>
                <GraficoBarrasHorizontais dados={resumo?.mais_usados || []} chaveLabel="texto" chaveValor="total" C={C} variante={V} />
              </View>
            </ItemEscalonado>

            <Text style={s.secaoTitulo}>Humor registrado</Text>
            <ItemEscalonado indice={3}>
              <View style={[s.card, { flexDirection: 'row', flexWrap: 'wrap', gap: normalize(16) }]}>
                {contagemHumor.map((h) => (
                  <View key={h.chave} style={{ alignItems: 'center' }}>
                    <Text style={{ fontSize: normalize(30) }}>{h.emoji}</Text>
                    <Text style={{ color: C.texto, fontFamily: F.bodyBold }}>{h.total}x</Text>
                  </View>
                ))}
                {contagemHumor.length === 0 && <Text style={s.vazio}>Nenhum humor registrado ainda</Text>}
              </View>
            </ItemEscalonado>

            <Text style={s.secaoTitulo}>Histórico de falas</Text>
            <ItemEscalonado indice={4}>
              <View style={s.card}>
                {historico.map((h) => (
                  <View key={h.id_historico} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: normalize(8), borderBottomWidth: 1, borderBottomColor: C.cinza }}>
                    <Text style={{ fontSize: normalize(20), marginRight: normalize(10) }}>{h.emoji}</Text>
                    <Text style={{ flex: 1, color: C.texto, fontFamily: F.bodyBold, fontSize: normalize(14) }} numberOfLines={2}>{h.texto}</Text>
                    <Text style={{ color: C.subtexto, fontSize: normalize(11), fontFamily: F.body, marginLeft: normalize(8) }}>{h.data_uso}</Text>
                  </View>
                ))}
                {historico.length === 0 && <Text style={s.vazio}>Nenhuma fala registrada ainda</Text>}
              </View>
            </ItemEscalonado>

            <BotaoAnimado onPress={() => carregar()} style={[s.botaoSecundario, { marginTop: normalize(10), flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: normalize(6) }]}>
              <Ionicons name="refresh" size={normalize(15)} color={C.texto} />
              <Text style={s.botaoSecundarioTxt}>Atualizar agora</Text>
            </BotaoAnimado>
            <BotaoAnimado onPress={limparHistorico} corCarregando={C.erro} style={[s.botaoPerigo, { marginTop: normalize(10), flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: normalize(6) }]}>
              <Ionicons name="trash-outline" size={normalize(15)} color={C.erro} />
              <Text style={s.botaoPerigoTxt}>Limpar histórico de falas</Text>
            </BotaoAnimado>
          </>
        )}
      </ScrollView>
      <BotaoVoltar onPress={onVoltar} C={C} variante={V} />
    </SafeAreaView>
  );
}
