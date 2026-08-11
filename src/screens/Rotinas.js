import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, Alert,
  ActivityIndicator, Modal, SafeAreaView, StatusBar, Animated, Platform,
} from 'react-native';
import { normalize, TEMA_RESPONSAVEL, DIAS, DIAS_ABREV, fontesFor } from '../theme';
import EntradaModal from '../components/EntradaModal';
import { criarEstilos } from '../estilos';
import { TopBar, BotaoVoltar } from '../components/TopBar';
import Campo from '../components/Campo';
import BannerErro from '../components/BannerErro';
import BotaoAnimado from '../components/BotaoAnimado';
import ItemEscalonado from '../components/ItemEscalonado';
import { Rotinas, mensagemErro } from '../api';
import { useApp } from '../AppContext';

const C = TEMA_RESPONSAVEL;
const V = 'adulto';
const F = fontesFor(V);
const ICONES = ['⭐', '🦷', '🛁', '🍽️', '📚', '🛌', '👕', '🎒', '🚗', '⏰'];
const HORA_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

function sombra(cor, intensidade = 1) {
  return Platform.select({
    ios: { shadowColor: cor, shadowOffset: { width: 0, height: 4 * intensidade }, shadowOpacity: 0.16 * intensidade, shadowRadius: 8 * intensidade },
    default: { elevation: 2 * intensidade },
  });
}

function Toque({ onPress, onLongPress, style, children }) {
  const escala = useRef(new Animated.Value(1)).current;
  const pressIn = () => Animated.spring(escala, { toValue: 0.93, useNativeDriver: true, speed: 40, bounciness: 6 }).start();
  const pressOut = () => Animated.spring(escala, { toValue: 1, useNativeDriver: true, speed: 24, bounciness: 10 }).start();
  return (
    <Animated.View style={{ transform: [{ scale: escala }] }}>
      <TouchableOpacity onPress={onPress} onLongPress={onLongPress} onPressIn={pressIn} onPressOut={pressOut} activeOpacity={0.9} style={style}>
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
}

export function TelaRotinasEditor({ crianca, onVoltar }) {
  const s = useMemo(() => criarEstilos(C, V), []);
  const { usuario } = useApp();
  const [rotinas, setRotinas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [atividade, setAtividade] = useState('');
  const [horario, setHorario] = useState('08:00');
  const [icone, setIcone] = useState(ICONES[0]);
  const [diasSel, setDiasSel] = useState([]);
  const [erros, setErros] = useState({});
  const [erroServidor, setErroServidor] = useState(null);
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const res = await Rotinas.listar(crianca.id_crianca, { usuario_id: usuario.id_usuario });
      if (res.data.success) setRotinas(res.data.rotinas);
    } catch (err) { Alert.alert('Erro', mensagemErro(err)); }
    finally { setLoading(false); }
  }, [crianca.id_crianca]);

  useEffect(() => { carregar(); }, [carregar]);

  const abrirNovo = () => { setEditando(null); setAtividade(''); setHorario('08:00'); setIcone(ICONES[0]); setDiasSel([]); setErros({}); setErroServidor(null); setModalAberto(true); };
  const abrirEdicao = (r) => { setEditando(r); setAtividade(r.atividade); setHorario(r.horario?.slice(0, 5) || '08:00'); setIcone(r.icone || ICONES[0]); setDiasSel(r.dias_semana || []); setErros({}); setErroServidor(null); setModalAberto(true); };
  const alternarDia = (d) => { setDiasSel((p) => (p.includes(d) ? p.filter((x) => x !== d) : [...p, d])); setErros((p) => ({ ...p, dias: null })); };

  const validar = () => {
    const e = {};
    if (!atividade.trim()) e.atividade = 'Digite a atividade';
    if (!HORA_REGEX.test(horario.trim())) e.horario = 'Use o formato HH:MM, ex: 08:00';
    if (diasSel.length === 0) e.dias = 'Selecione ao menos um dia da semana';
    setErros(e);
    return Object.keys(e).length === 0;
  };

  const salvar = async () => {
    setErroServidor(null);
    if (!validar()) return;
    setSalvando(true);
    try {
      if (editando) {
        await Rotinas.atualizar({ id_rotina: editando.id_rotina, usuario_id: usuario.id_usuario, atividade: atividade.trim(), horario, icone, dias_semana: diasSel });
      } else {
        await Rotinas.criar({ crianca_id: crianca.id_crianca, usuario_id: usuario.id_usuario, atividade: atividade.trim(), horario, icone, dias_semana: diasSel });
      }
      setModalAberto(false);
      carregar();
    } catch (err) { setErroServidor(mensagemErro(err)); }
    finally { setSalvando(false); }
  };

  const remover = (r) => {
    Alert.alert('Remover rotina', `Remover "${r.atividade}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: async () => { await Rotinas.remover(r.id_rotina, usuario.id_usuario); carregar(); } },
    ]);
  };

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.primaria} />
      <TopBar titulo="Rotinas" onVoltar={onVoltar} onAcao={abrirNovo} C={C} variante={V} />
      <ScrollView contentContainerStyle={s.scroll}>
        {loading ? <ActivityIndicator color={C.secundaria} /> : rotinas.map((r, i) => (
          <ItemEscalonado key={r.id_rotina} indice={i}>
            <TouchableOpacity style={[s.cardRow, s.cardFaixa]} onPress={() => abrirEdicao(r)} onLongPress={() => remover(r)} activeOpacity={0.85}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <View style={[{ width: normalize(42), height: normalize(42), borderRadius: normalize(13), backgroundColor: C.cinza, alignItems: 'center', justifyContent: 'center', marginRight: normalize(12) }, sombra(C.primaria, 0.5)]}>
                  <Text style={{ fontSize: normalize(22) }}>{r.icone}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.cardTitulo}>{r.atividade}</Text>
                  <Text style={s.cardSubtitulo}>{r.horario?.slice(0, 5)} · {(r.dias_semana || []).map((d) => DIAS_ABREV[d]).join(', ')}</Text>
                </View>
              </View>
            </TouchableOpacity>
          </ItemEscalonado>
        ))}
        {!loading && rotinas.length === 0 && <Text style={s.vazio}>Nenhuma rotina cadastrada. Toque no + para criar.</Text>}
      </ScrollView>
      <BotaoVoltar onPress={onVoltar} C={C} variante={V} />

      <Modal visible={modalAberto} transparent animationType="none" onRequestClose={() => setModalAberto(false)}>
        <View style={s.modalFundo}>
          <EntradaModal
            visivel={modalAberto}
            style={{ width: '100%', maxHeight: '85%' }}
          >
            <ScrollView style={s.modalCard} keyboardShouldPersistTaps="handled">
            <Text style={s.modalTitulo}>
              {editando ? 'Editar rotina' : 'Nova rotina'}
            </Text>
            <BannerErro mensagem={erroServidor} C={C} variante={V} onFechar={() => setErroServidor(null)} />
            <Campo label="Atividade" C={C} variante={V} erro={erros.atividade} value={atividade}
              onChangeText={(t) => { setAtividade(t); setErros((p) => ({ ...p, atividade: null })); }} placeholder="Ex: Escovar os dentes" />
            <Campo label="Horário (HH:MM)" C={C} variante={V} erro={erros.horario} value={horario}
              onChangeText={(t) => { setHorario(t); setErros((p) => ({ ...p, horario: null })); }} placeholder="08:00" keyboardType="numbers-and-punctuation" />
            <Text style={s.label}>Ícone</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: normalize(10) }}>
              {ICONES.map((ic) => (
                <Toque key={ic} onPress={() => setIcone(ic)} style={[{ width: normalize(44), height: normalize(44), borderRadius: normalize(13), margin: normalize(4), alignItems: 'center', justifyContent: 'center', backgroundColor: icone === ic ? C.primaria : C.cinza }, icone === ic && sombra(C.primaria, 0.7)]}>
                  <Text style={{ fontSize: normalize(19) }}>{ic}</Text>
                </Toque>
              ))}
            </View>
            <Text style={s.label}>Dias da semana</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: normalize(4) }}>
              {DIAS.map((d) => (
                <Toque key={d} onPress={() => alternarDia(d)} style={[s.chip, diasSel.includes(d) && s.chipAtivo]}>
                  <Text style={[s.chipTxt, diasSel.includes(d) && s.chipTxtAtivo]}>{DIAS_ABREV[d]}</Text>
                </Toque>
              ))}
            </View>
            {erros.dias ? <Text style={s.erroTexto}>⚠ {erros.dias}</Text> : null}
            <BotaoAnimado onPress={salvar} loading={salvando} style={[s.botaoPrimario, { marginTop: normalize(10) }]}>
              <Text style={s.botaoPrimarioTxt}>Salvar</Text>
            </BotaoAnimado>
            <TouchableOpacity onPress={() => setModalAberto(false)} style={{ marginTop: normalize(14), alignItems: 'center', marginBottom: normalize(10) }}>
              <Text style={{ color: C.subtexto, fontFamily: F.bodyBold }}>Cancelar</Text>
            </TouchableOpacity>
          </ScrollView>
          </EntradaModal>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
