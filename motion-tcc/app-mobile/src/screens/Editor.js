// Editor.js — dois editores separados por assunto, para o responsável:
//   TelaEditorConteudo  → categorias e seus pictogramas (via TelaEditorPictogramas)
//   TelaEditorEmocoes   → emoções da tela "Como eu estou?" e frases favoritas
// O modo Criança continua 100% só de consumo — nada aqui entra nele.
import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, Alert,
  ActivityIndicator, Modal, SafeAreaView, StatusBar, Image, Animated, Platform, Easing,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import EntradaModal from '../components/EntradaModal';
import { normalize, TEMA_RESPONSAVEL, EMOJIS_CATEGORIA, CORES_CATEGORIA, fontesFor, HUMORES } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { criarEstilos } from '../estilos';
import { TopBar, BotaoVoltar } from '../components/TopBar';
import Campo from '../components/Campo';
import SeletorCor from '../components/SeletorCor';
import BannerErro from '../components/BannerErro';
import BotaoAnimado from '../components/BotaoAnimado';
import ItemEscalonado from '../components/ItemEscalonadoMoti';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { Categorias, Pictogramas, Frases, Uploads, API_URL, mensagemErro, mensagemAmigavel } from '../api';
import { useApp } from '../AppContext';

const C = TEMA_RESPONSAVEL;
const V = 'adulto';
const F = fontesFor(V);

// Mesma chave e lista de emojis do KidHumor (ModoCrianca) — o Editor e o modo
// Criança leem e escrevem a mesma lista de emoções do dispositivo.
const CHAVE_EMOCOES = '@motion:emocoes:';
const EMOJIS_EMOCIONAL = [
  '😊', '🥰', '😄', '🙂', '😌', '🤗', '🥺', '😢', '😭', '😠', '😡', '🤬',
  '😰', '😫', '😴', '🤩', '🥳', '😎', '😳', '😨', '🤔', '🤢', '🤒', '💪',
  '🌟', '💖', '🦸', '🐶', '🐱', '🌈', '🙏', '🤝',
];

function sombra(cor, intensidade = 1) {
  return Platform.select({
    ios: { shadowColor: cor, shadowOffset: { width: 0, height: 4 * intensidade }, shadowOpacity: 0.16 * intensidade, shadowRadius: 8 * intensidade },
    default: { elevation: 2 * intensidade },
  });
}

// falas.php guarda só o caminho relativo (ex: "uploads/pictogramas/xxx.jpg");
// aqui montamos a URL completa a partir do mesmo host do backend.
function urlImagem(caminhoRelativo) {
  if (!caminhoRelativo) return null;
  if (/^https?:\/\//i.test(caminhoRelativo)) return caminhoRelativo;
  const origem = API_URL.replace(/\/api\.php\/?$/i, '').replace(/\/$/, '');
  return origem + '/' + caminhoRelativo.replace(/^\//, '');
}

// Botão de toque com "pop" — reaplicado aqui pros cards da grade de
// pictogramas e pros emojis do seletor, que não passam por BotaoAnimado
// porque precisam de long-press (editar/remover) junto com o toque simples.
function Toque({ onPress, onLongPress, style, children, disabled }) {
  const escala = useRef(new Animated.Value(1)).current;
  const pressIn = () => Animated.spring(escala, { toValue: 0.93, useNativeDriver: true, speed: 40, bounciness: 6 }).start();
  const pressOut = () => Animated.spring(escala, { toValue: 1, useNativeDriver: true, speed: 24, bounciness: 10 }).start();
  return (
    <Animated.View style={[{ transform: [{ scale: escala }] }, style]}>
      <TouchableOpacity
        onPress={onPress}
        onLongPress={onLongPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        disabled={disabled}
        activeOpacity={0.9}
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
}

function SeletorEmoji({ opcoes, valor, onSelecionar }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: normalize(15) }}>
      {opcoes.map((e) => (
        <Toque
          key={e}
          onPress={() => onSelecionar(e)}
          style={[
            {
              width: normalize(44), height: normalize(44), borderRadius: normalize(13), margin: normalize(4),
              backgroundColor: valor === e ? C.primaria : C.cinza,
            },
            valor === e && sombra(C.primaria, 0.8),
          ]}
        >
          <Text style={{ fontSize: normalize(19) }}>{e}</Text>
        </Toque>
      ))}
    </View>
  );
}

// ── Editor de categorias ──────────────────────────────────────
export function TelaEditorConteudo({ crianca, onVoltar, onAbrirCategoria }) {
  const s = useMemo(() => criarEstilos(C, V), []);
  const { usuario } = useApp();
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [nome, setNome] = useState('');
  const [emoji, setEmoji] = useState(EMOJIS_CATEGORIA[0]);
  const [cor, setCor] = useState(CORES_CATEGORIA[0]);
  const [erroNome, setErroNome] = useState(null);
  const [erroServidor, setErroServidor] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [erroCarregamento, setErroCarregamento] = useState(null);

  // A lista de categorias entra com fade + subida — separada da cascata dos
  // cards pra tela não parecer "jogada" inteira de uma vez.
  const entradaLista = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(entradaLista, {
      toValue: 1,
      duration: 420,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: Platform.OS !== 'web',
    }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const carregar = useCallback(async () => {
    setLoading(true);
    setErroCarregamento(null);
    try {
      const res = await Categorias.listar(crianca.id_crianca);
      if (res.data.success) setCategorias(res.data.categorias);
      else setErroCarregamento('O servidor retornou uma resposta inesperada.');
    } catch (err) {
      const msg = mensagemAmigavel(err);
      setErroCarregamento(msg);
      Alert.alert('Não foi possível carregar', msg);
    }
    finally { setLoading(false); }
  }, [crianca.id_crianca]);

  useEffect(() => { carregar(); }, [carregar]);

  const abrirNovo = () => { setEditando(null); setNome(''); setEmoji(EMOJIS_CATEGORIA[0]); setCor(CORES_CATEGORIA[0]); setErroNome(null); setErroServidor(null); setModalAberto(true); };
  const abrirEdicao = (cat) => { setEditando(cat); setNome(cat.nome_categoria); setEmoji(cat.emoji); setCor(cat.cor); setErroNome(null); setErroServidor(null); setModalAberto(true); };

  const salvar = async () => {
    setErroServidor(null);
    if (!nome.trim()) { setErroNome('Digite o nome da categoria'); return; }
    if (!/^#([0-9A-Fa-f]{6})$/.test(cor)) { setErroServidor('Escolha uma cor válida (ex: #RRGGBB)'); return; }
    setSalvando(true);
    try {
      if (editando) {
        await Categorias.atualizar({ id_categoria: editando.id_categoria, nome_categoria: nome.trim(), emoji, cor });
      } else {
        await Categorias.criar({ crianca_id: crianca.id_crianca, usuario_id: usuario.id_usuario, nome_categoria: nome.trim(), emoji, cor });
      }
      setModalAberto(false);
      carregar();
    } catch (err) { setErroServidor(mensagemErro(err)); }
    finally { setSalvando(false); }
  };

  const remover = (cat) => {
    Alert.alert('Remover categoria', `Remover "${cat.nome_categoria}" e todos os pictogramas dela?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: async () => {
          try {
            await Categorias.remover(cat.id_categoria, usuario.id_usuario);
            setCategorias((lista) => lista.filter((item) => item.id_categoria !== cat.id_categoria));
          }
          catch (err) { Alert.alert('Não foi possível remover', mensagemAmigavel(err)); }
        }
      },
    ]);
  };

  // Troca a ordem entre uma categoria e a vizinha (cima/baixo), persistindo os
  // dois lados da troca. Atualiza a lista local na hora, sem esperar o servidor,
  // pra parecer instantâneo.
  const moverCategoria = async (index, direcao) => {
    const alvo = index + direcao;
    if (alvo < 0 || alvo >= categorias.length) return;
    const nova = [...categorias];
    [nova[index], nova[alvo]] = [nova[alvo], nova[index]];
    setCategorias(nova);
    try {
      await Promise.all([
        Categorias.atualizar({ id_categoria: nova[index].id_categoria, ordem: index }),
        Categorias.atualizar({ id_categoria: nova[alvo].id_categoria, ordem: alvo }),
      ]);
    } catch (err) {
      Alert.alert('Erro', mensagemErro(err));
      carregar(); // desfaz a troca otimista se o servidor recusar
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.primaria} />
      <TopBar titulo="Categorias e pictogramas" onVoltar={onVoltar} onAcao={abrirNovo} C={C} variante={V} />
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={{ color: C.subtexto, marginBottom: normalize(14), fontSize: normalize(12.5) }}>Toque numa categoria para editar os pictogramas. Segure para editar ou remover a categoria.</Text>
        {erroCarregamento ? (
          <BannerErro
            mensagem={erroCarregamento}
            C={C} variante={V}
            onFechar={() => setErroCarregamento(null)}
            acaoTexto="Tentar de novo"
            onAcao={() => carregar()}
          />
        ) : null}
        {loading ? <ActivityIndicator color={C.secundaria} /> : (
          <Animated.View style={{ opacity: entradaLista, transform: [{ translateY: entradaLista.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }] }}>
          {categorias.map((cat, index) => (
          <ItemEscalonado key={cat.id_categoria} indice={index}>
            <TouchableOpacity
              style={s.cardRow}
              onPress={() => onAbrirCategoria(cat)}
              activeOpacity={0.85}
              onLongPress={() =>
                Alert.alert(cat.nome_categoria, 'O que deseja fazer?', [
                  { text: 'Editar', onPress: () => abrirEdicao(cat) },
                  { text: 'Remover', style: 'destructive', onPress: () => remover(cat) },
                  { text: 'Cancelar', style: 'cancel' },
                ])
              }
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <View style={[{ width: normalize(44), height: normalize(44), borderRadius: normalize(13), backgroundColor: cat.cor, alignItems: 'center', justifyContent: 'center', marginRight: normalize(12) }, sombra(cat.cor, 0.8)]}>
                  <Text style={{ fontSize: normalize(21) }}>{cat.emoji}</Text>
                </View>
                <Text style={s.cardTitulo}>{cat.nome_categoria}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: normalize(2) }}>
                <TouchableOpacity onPress={() => moverCategoria(index, -1)} disabled={index === 0} style={{ padding: normalize(6), opacity: index === 0 ? 0.25 : 1 }}>
                  <Ionicons name="chevron-up" size={normalize(18)} color={C.subtexto} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => moverCategoria(index, 1)} disabled={index === categorias.length - 1} style={{ padding: normalize(6), opacity: index === categorias.length - 1 ? 0.25 : 1 }}>
                  <Ionicons name="chevron-down" size={normalize(18)} color={C.subtexto} />
                </TouchableOpacity>
                <Ionicons name="create-outline" size={normalize(18)} color={C.subtexto} style={{ marginLeft: normalize(6) }} />
              </View>
            </TouchableOpacity>
          </ItemEscalonado>
        ))}
          </Animated.View>
        )}
        {!loading && categorias.length === 0 && <Text style={s.vazio}>Nenhuma categoria ainda. Toque no + para criar.</Text>}
      </ScrollView>
      <BotaoVoltar onPress={onVoltar} C={C} variante={V} />

      <Modal visible={modalAberto} transparent animationType="none" onRequestClose={() => setModalAberto(false)}>
        <View style={s.modalFundo}>
          <EntradaModal
            visivel={modalAberto}
            style={s.modalCard}
          >
            <Text style={s.modalTitulo}>
              {editando ? 'Editar categoria' : 'Nova categoria'}
            </Text>
            <BannerErro mensagem={erroServidor} C={C} variante={V} onFechar={() => setErroServidor(null)} />
            <Campo label="Nome" C={C} variante={V} erro={erroNome} value={nome} onChangeText={(t) => { setNome(t); setErroNome(null); }} placeholder="Ex: Escola" />
            <Text style={s.label}>Emoji</Text>
            <SeletorEmoji opcoes={EMOJIS_CATEGORIA} valor={emoji} onSelecionar={setEmoji} />
            <Text style={s.label}>Cor</Text>
            <SeletorCor valor={cor} onMudar={setCor} paleta={CORES_CATEGORIA} C={C} variante={V} />
            <BotaoAnimado onPress={salvar} loading={salvando} style={s.botaoPrimario}>
              <Text style={s.botaoPrimarioTxt}>Salvar</Text>
            </BotaoAnimado>
            <TouchableOpacity onPress={() => setModalAberto(false)} style={{ marginTop: normalize(14), alignItems: 'center' }}>
              <Text style={{ color: C.subtexto, fontFamily: F.bodyBold }}>Cancelar</Text>
            </TouchableOpacity>
          </EntradaModal>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ── Editor de emoções e frases favoritas ──────────────────────
export function TelaEditorEmocoes({ crianca, onVoltar }) {
  const s = useMemo(() => criarEstilos(C, V), []);
  const { usuario } = useApp();
  const [emocoes, setEmocoes] = useState(null);
  const [modalEmocao, setModalEmocao] = useState(false);
  const [emojiEmocao, setEmojiEmocao] = useState(EMOJIS_EMOCIONAL[0]);
  const [labelEmocao, setLabelEmocao] = useState('');
  const [frases, setFrases] = useState(null);
  const [novaFrase, setNovaFrase] = useState('');
  const [fraseParaRemover, setFraseParaRemover] = useState(null);

  const entradaLista = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(entradaLista, {
      toValue: 1,
      duration: 420,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: Platform.OS !== 'web',
    }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Carrega a lista de emoções da criança (mesma fonte do modo Criança).
  useEffect(() => {
    AsyncStorage.getItem(CHAVE_EMOCOES + crianca.id_crianca)
      .then((salvo) => {
        try {
          const dados = salvo ? JSON.parse(salvo) : null;
          setEmocoes(Array.isArray(dados) && dados.length > 0 ? dados : HUMORES);
        } catch (_) { setEmocoes(HUMORES); } // JSON corrompido → lista padrão
      })
      .catch(() => setEmocoes(HUMORES));
  }, [crianca.id_crianca]);

  useEffect(() => {
    Frases.listar(crianca.id_crianca)
      .then((fr) => {
        if (fr.data?.success) setFrases(fr.data.frases);
      })
      .catch(() => setFrases([])); // falha aqui não bloqueia a tela
  }, [crianca.id_crianca]);

  const salvarEmocoes = (proxima) => {
    setEmocoes(proxima);
    AsyncStorage.setItem(CHAVE_EMOCOES + crianca.id_crianca, JSON.stringify(proxima)).catch(() => {});
  };

  const adicionarEmocao = () => {
    const label = (labelEmocao || '').trim();
    if (!label) {
      Alert.alert('Nome da emoção', 'Escreva o nome da emoção antes de adicionar.');
      return;
    }
    if (emocoes.some((e) => e.chave === 'custom:' + label.toLowerCase())) {
      Alert.alert('Já existe', 'Essa emoção já está na lista.');
      return;
    }
    salvarEmocoes([...emocoes, { chave: 'custom:' + label.toLowerCase(), emoji: emojiEmocao, label }]);
    setLabelEmocao('');
    setModalEmocao(false);
    try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch (_) { /* Haptics não disponível na web */ }
  };

  const removerEmocao = (h) => {
    if (emocoes.length <= 2) {
      Alert.alert('Não dá pra apagar', 'Deixe pelo menos 2 emoções na lista pra a tela do modo Criança não ficar vazia.');
      return;
    }
    Alert.alert(
      'Remover a emoção?',
      `"${h.label}" vai sair da lista do modo Criança. Dá pra adicionar de novo depois com o botão +.`,
      [
        { text: 'Manter', style: 'cancel' },
        { text: 'Remover', style: 'destructive', onPress: () => salvarEmocoes(emocoes.filter((e) => e.chave !== h.chave)) },
      ],
    );
  };

  const abrirNovaEmocao = () => { setEmojiEmocao(EMOJIS_EMOCIONAL[0]); setLabelEmocao(''); setModalEmocao(true); };

  const adicionarFrase = async () => {
    const texto = (novaFrase || '').trim();
    if (!texto) {
      Alert.alert('Frase favorita', 'Escreva a frase antes de adicionar.');
      return;
    }
    try {
      const res = await Frases.salvar({ crianca_id: crianca.id_crianca, texto });
      if (res.data?.success) {
        const nova = res.data.frase || { id_frase: res.data.id_frase, texto };
        setFrases((p) => [nova, ...(p || [])]);
        setNovaFrase('');
        try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch (_) { /* Haptics não disponível na web */ }
      } else {
        Alert.alert('Não deu certo', mensagemErro(res));
      }
    } catch (err) { Alert.alert('Não foi possível adicionar', mensagemAmigavel(err)); }
  };

  const removerFrase = (f) => setFraseParaRemover(f);
  const confirmarRemocaoFrase = async () => {
    if (!fraseParaRemover) return;
    try {
      await Frases.remover(fraseParaRemover.id_frase, { usuario_id: usuario.id_usuario });
      setFrases((p) => (p || []).filter((x) => x.id_frase !== fraseParaRemover.id_frase));
    } catch (err) { Alert.alert('Não foi possível remover', mensagemAmigavel(err)); }
    setFraseParaRemover(null);
  };

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.primaria} />
      <TopBar titulo="Emoções e favoritos" onVoltar={onVoltar} C={C} variante={V} />
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={{ color: C.subtexto, marginBottom: normalize(14), fontSize: normalize(12.5) }}>As emoções aparecem na tela "Como eu estou?" do modo Criança. As frases favoritas aparecem na tela "Favoritos".</Text>

        <Animated.View style={{ opacity: entradaLista, transform: [{ translateY: entradaLista.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }] }}>
          <Text style={{ color: C.subtexto, marginBottom: normalize(10), fontSize: normalize(12.5) }}>Emoções</Text>
          {emocoes === null ? <ActivityIndicator color={C.secundaria} /> : (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: normalize(12) }}>
              {emocoes.map((h) => (
                <View key={h.chave} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: C.branco, borderRadius: normalize(16), paddingRight: normalize(6), ...sombra(C.primaria, 0.6) }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: normalize(8), paddingLeft: normalize(12), paddingRight: normalize(6), paddingVertical: normalize(8) }}>
                    <Text style={{ fontSize: normalize(18) }}>{h.emoji}</Text>
                    <Text style={{ fontFamily: F.body, color: C.texto, fontSize: normalize(13) }}>{h.label}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => removerEmocao(h)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    style={{ width: normalize(26), height: normalize(26), borderRadius: normalize(13), backgroundColor: C.erro, alignItems: 'center', justifyContent: 'center' }}
                    accessibilityLabel={`Remover emoção ${h.label}`}
                  >
                    <Ionicons name="close" size={normalize(14)} color="#FFF" />
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity
                onPress={abrirNovaEmocao}
                style={{ flexDirection: 'row', alignItems: 'center', gap: normalize(6), backgroundColor: C.cinza, borderRadius: normalize(16), paddingHorizontal: normalize(14), paddingVertical: normalize(8) }}
                accessibilityLabel="Adicionar emoção"
              >
                <Ionicons name="add" size={normalize(17)} color={C.texto} />
                <Text style={{ fontFamily: F.bodyBold, color: C.texto, fontSize: normalize(13) }}>Adicionar emoção</Text>
              </TouchableOpacity>
            </View>
          )}
          {emocoes && <Text style={{ color: C.subtexto, fontSize: normalize(11), marginTop: normalize(8), fontFamily: F.body }}>Toque no ✕ para remover uma emoção da lista do modo Criança.</Text>}

          <Text style={{ color: C.subtexto, marginTop: normalize(28), marginBottom: normalize(10), fontSize: normalize(12.5) }}>Frases favoritas</Text>
          {frases === null ? <ActivityIndicator color={C.secundaria} /> : (
            <View>
              <View style={{ flexDirection: 'row', gap: normalize(8) }}>
                <Campo
                  C={C} variante={V}
                  value={novaFrase}
                  onChangeText={setNovaFrase}
                  placeholder="Ex: Quero brincar"
                  maxLength={120}
                  style={{ flex: 1 }}
                />
                <BotaoAnimado onPress={adicionarFrase} style={s.botaoPrimario}>
                  <Text style={s.botaoPrimarioTxt}>Adicionar</Text>
                </BotaoAnimado>
              </View>
              {frases.map((f, i) => (
                <ItemEscalonado key={f.id_frase} indice={i}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: C.branco, borderRadius: normalize(16), padding: normalize(14), marginTop: normalize(10), ...sombra(C.destaque, 0.5) }}>
                    <Text style={{ flex: 1, fontFamily: F.body, color: C.texto, fontSize: normalize(14) }}>{f.texto}</Text>
                    <TouchableOpacity
                      onPress={() => removerFrase(f)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      style={{ width: normalize(26), height: normalize(26), borderRadius: normalize(13), backgroundColor: C.erro, alignItems: 'center', justifyContent: 'center' }}
                      accessibilityLabel={`Remover frase ${f.texto}`}
                    >
                      <Ionicons name="close" size={normalize(14)} color="#FFF" />
                    </TouchableOpacity>
                  </View>
                </ItemEscalonado>
              ))}
              {frases.length === 0 && <Text style={s.vazio}>Nenhuma frase nos favoritos ainda.</Text>}
              <Text style={{ color: C.subtexto, fontSize: normalize(11), marginTop: normalize(8), fontFamily: F.body }}>Toque no ✕ para tirar uma frase dos favoritos da criança.</Text>
            </View>
          )}
        </Animated.View>
      </ScrollView>
      <BotaoVoltar onPress={onVoltar} C={C} variante={V} />

      <Modal visible={!!fraseParaRemover} transparent animationType="fade" onRequestClose={() => setFraseParaRemover(null)}>
        <View style={s.modalFundo}>
          <EntradaModal visivel={!!fraseParaRemover} style={s.modalCard}>
            <Text style={s.modalTitulo}>Remover dos favoritos?</Text>
            <Text style={{ fontFamily: F.body, color: C.subtexto, fontSize: normalize(13), marginBottom: normalize(18) }}>
              “{fraseParaRemover?.texto}” vai sair da tela Favoritos da criança.
            </Text>
            <BotaoAnimado onPress={confirmarRemocaoFrase} style={[s.botaoPrimario, { backgroundColor: C.erro }]}>
              <Text style={s.botaoPrimarioTxt}>Remover</Text>
            </BotaoAnimado>
            <TouchableOpacity onPress={() => setFraseParaRemover(null)} style={{ marginTop: normalize(14), alignItems: 'center' }}>
              <Text style={{ color: C.subtexto, fontFamily: F.bodyBold }}>Manter</Text>
            </TouchableOpacity>
          </EntradaModal>
        </View>
      </Modal>

      <Modal visible={modalEmocao} transparent animationType="fade" onRequestClose={() => setModalEmocao(false)}>
        <View style={s.modalFundo}>
          <EntradaModal visivel={modalEmocao} style={s.modalCard}>
            <Text style={s.modalTitulo}>Nova emoção</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: normalize(10), marginBottom: normalize(14), width: '100%' }}>
              <Text style={{ fontSize: normalize(36), lineHeight: normalize(46) }}>{emojiEmocao}</Text>
              <Campo
                C={C} variante={V}
                value={labelEmocao}
                onChangeText={setLabelEmocao}
                placeholder="Nome (ex: Envergonhado)"
                maxLength={20}
                style={{ flex: 1 }}
              />
            </View>
            <Text style={s.label}>Emoji</Text>
            <SeletorEmoji opcoes={EMOJIS_EMOCIONAL} valor={emojiEmocao} onSelecionar={setEmojiEmocao} />
            <BotaoAnimado onPress={adicionarEmocao} style={s.botaoPrimario}>
              <Text style={s.botaoPrimarioTxt}>Adicionar</Text>
            </BotaoAnimado>
            <TouchableOpacity onPress={() => setModalEmocao(false)} style={{ marginTop: normalize(14), alignItems: 'center' }}>
              <Text style={{ color: C.subtexto, fontFamily: F.bodyBold }}>Cancelar</Text>
            </TouchableOpacity>
          </EntradaModal>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ── Editor de pictogramas de uma categoria ────────────────────
export function TelaEditorPictogramas({ crianca, categoria, onVoltar }) {
  const s = useMemo(() => criarEstilos(C, V), []);
  const { usuario } = useApp();
  const [pictogramas, setPictogramas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [texto, setTexto] = useState('');
  const [emoji, setEmoji] = useState('💬');
  const [imagemUrl, setImagemUrl] = useState(null);
  const [enviandoImagem, setEnviandoImagem] = useState(false);
  const [erroTexto, setErroTexto] = useState(null);
  const [erroServidor, setErroServidor] = useState(null);
  const [salvando, setSalvando] = useState(false);

  // A grade de pictogramas entra com fade + subida — separada da cascata
  // dos cards, pra tela não parecer "jogada" inteira de uma vez.
  const entradaGrade = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(entradaGrade, {
      toValue: 1,
      duration: 420,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: Platform.OS !== 'web',
    }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const res = await Pictogramas.listar(categoria.id_categoria);
      if (res.data.success) setPictogramas(res.data.falas);
    } catch (err) { Alert.alert('Erro', mensagemErro(err)); }
    finally { setLoading(false); }
  }, [categoria.id_categoria]);

  useEffect(() => { carregar(); }, [carregar]);

  const abrirNovo = () => { setEditando(null); setTexto(''); setEmoji('💬'); setImagemUrl(null); setErroTexto(null); setErroServidor(null); setModalAberto(true); };
  const abrirEdicao = (p) => { setEditando(p); setTexto(p.texto); setEmoji(p.emoji); setImagemUrl(p.imagem_url || null); setErroTexto(null); setErroServidor(null); setModalAberto(true); };

  const escolherFoto = async () => {
    const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissao.granted) {
      Alert.alert('Permissão necessária', 'Autorize o acesso às fotos para escolher uma imagem.');
      return;
    }
    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (resultado.canceled || !resultado.assets?.[0]) return;

    setEnviandoImagem(true);
    try {
      const res = await Uploads.enviarImagemPictograma(resultado.assets[0].uri);
      if (res.data.success) {
        setImagemUrl(res.data.url);
      } else {
        Alert.alert('Erro', res.data.message || 'Não foi possível enviar a imagem');
      }
    } catch (err) {
      Alert.alert('Erro', mensagemErro(err, 'Falha ao enviar a imagem'));
    } finally { setEnviandoImagem(false); }
  };

  const salvar = async () => {
    setErroServidor(null);
    if (!texto.trim()) { setErroTexto('Digite o texto do pictograma'); return; }
    setSalvando(true);
    try {
      const payloadImagem = imagemUrl !== null ? { imagem_url: imagemUrl } : {};
      if (editando) {
        await Pictogramas.atualizar({ id_fala: editando.id_fala, texto: texto.trim(), emoji, ...payloadImagem });
      } else {
        await Pictogramas.criar({ id_categoria: categoria.id_categoria, usuario_id: usuario.id_usuario, texto: texto.trim(), emoji, ...payloadImagem });
      }
      setModalAberto(false);
      carregar();
    } catch (err) { setErroServidor(mensagemErro(err)); }
    finally { setSalvando(false); }
  };

  // Mesmo princípio do reordenar de categorias: troca a posição de dois
  // pictogramas vizinhos e persiste os dois lados da troca.
  const moverPictograma = async (index, direcao) => {
    const alvo = index + direcao;
    if (alvo < 0 || alvo >= pictogramas.length) return;
    const nova = [...pictogramas];
    [nova[index], nova[alvo]] = [nova[alvo], nova[index]];
    setPictogramas(nova);
    try {
      await Promise.all([
        Pictogramas.atualizar({ id_fala: nova[index].id_fala, ordem: index }),
        Pictogramas.atualizar({ id_fala: nova[alvo].id_fala, ordem: alvo }),
      ]);
    } catch (err) {
      Alert.alert('Erro', mensagemErro(err));
      carregar();
    }
  };

  const remover = (p) => {
    Alert.alert('Remover pictograma', `Remover "${p.texto}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: async () => {
          try {
            await Pictogramas.remover(p.id_fala, usuario.id_usuario);
            setPictogramas((lista) => lista.filter((item) => item.id_fala !== p.id_fala));
          }
          catch (err) { Alert.alert('Não foi possível remover', mensagemAmigavel(err)); }
        }
      },
    ]);
  };

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.primaria} />
      <TopBar titulo={categoria.nome_categoria} onVoltar={onVoltar} onAcao={abrirNovo} C={C} variante={V} />
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={{ color: C.subtexto, marginBottom: normalize(14), fontSize: normalize(12.5) }}>Segure um pictograma para editar ou remover.</Text>
        {loading ? <ActivityIndicator color={C.secundaria} /> : (
          <Animated.View style={{ ...s.grid, opacity: entradaGrade, transform: [{ translateY: entradaGrade.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }] }}>
            {pictogramas.map((p, index) => (
              <ItemEscalonado key={p.id_fala} indice={index} style={{ width: '30%' }}>
                <Toque
                  style={[s.gridCard, { backgroundColor: C.branco, width: '100%' }]}
                  onLongPress={() =>
                    Alert.alert(p.texto, 'O que deseja fazer?', [
                      { text: 'Editar', onPress: () => abrirEdicao(p) },
                      ...(index > 0 ? [{ text: '⬅ Mover para trás', onPress: () => moverPictograma(index, -1) }] : []),
                      ...(index < pictogramas.length - 1 ? [{ text: 'Mover para frente ➡', onPress: () => moverPictograma(index, 1) }] : []),
                      { text: 'Remover', style: 'destructive', onPress: () => remover(p) },
                      { text: 'Cancelar', style: 'cancel' },
                    ])
                  }
                >
                  {p.imagem_url ? (
                    <Image source={{ uri: urlImagem(p.imagem_url) }} style={{ width: normalize(40), height: normalize(40), borderRadius: normalize(10) }} />
                  ) : (
                    <Text style={{ fontSize: normalize(26) }}>{p.emoji}</Text>
                  )}
                  <Text style={s.gridCardTxt}>{p.texto}</Text>
                </Toque>
              </ItemEscalonado>
            ))}
          </Animated.View>
        )}
        {!loading && pictogramas.length === 0 && <Text style={s.vazio}>Nenhum pictograma ainda. Toque no + para criar.</Text>}
      </ScrollView>
      <BotaoVoltar onPress={onVoltar} C={C} variante={V} />

      <Modal visible={modalAberto} transparent animationType="none" onRequestClose={() => setModalAberto(false)}>
        <View style={s.modalFundo}>
          <EntradaModal
            visivel={modalAberto}
            style={s.modalCard}
          >
            <Text style={s.modalTitulo}>
              {editando ? 'Editar pictograma' : 'Novo pictograma'}
            </Text>
            <BannerErro mensagem={erroServidor} C={C} variante={V} onFechar={() => setErroServidor(null)} />
            <Campo label="Texto" C={C} variante={V} erro={erroTexto} value={texto} onChangeText={(t) => { setTexto(t); setErroTexto(null); }} placeholder="Ex: Quero água" />

            <Text style={s.label}>Foto (opcional — algumas falas ficam mais claras com uma foto real)</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: normalize(12), marginBottom: normalize(16) }}>
              <View style={[{ width: normalize(58), height: normalize(58), borderRadius: normalize(15), backgroundColor: C.cinza, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }, sombra(C.primaria, 0.6)]}>
                {enviandoImagem ? (
                  <ActivityIndicator color={C.secundaria} />
                ) : imagemUrl ? (
                  <Image source={{ uri: urlImagem(imagemUrl) }} style={{ width: '100%', height: '100%' }} />
                ) : (
                  <Text style={{ fontSize: normalize(24) }}>{emoji}</Text>
                )}
              </View>
              <BotaoAnimado onPress={escolherFoto} disabled={enviandoImagem} style={[s.botaoSecundario, { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: normalize(6) }]}>
                <Ionicons name="image-outline" size={normalize(16)} color={C.texto} />
                <Text style={s.botaoSecundarioTxt}>{imagemUrl ? 'Trocar foto' : 'Escolher foto'}</Text>
              </BotaoAnimado>
              {imagemUrl ? (
                <TouchableOpacity onPress={() => setImagemUrl('')}>
                  <Ionicons name="close-circle" size={normalize(22)} color={C.subtexto} />
                </TouchableOpacity>
              ) : null}
            </View>

            <Text style={s.label}>Emoji (usado se não houver foto)</Text>
            <Campo C={C} variante={V} style={{ fontSize: normalize(24), textAlign: 'center' }} value={emoji} onChangeText={setEmoji} maxLength={4} />
            <BotaoAnimado onPress={salvar} loading={salvando} style={s.botaoPrimario}>
              <Text style={s.botaoPrimarioTxt}>Salvar</Text>
            </BotaoAnimado>
            <TouchableOpacity onPress={() => setModalAberto(false)} style={{ marginTop: normalize(14), alignItems: 'center' }}>
              <Text style={{ color: C.subtexto, fontFamily: F.bodyBold }}>Cancelar</Text>
            </TouchableOpacity>
          </EntradaModal>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
