import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, Alert,
  ActivityIndicator, Modal, SafeAreaView, StatusBar, Image, Animated, Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import EntradaModal from '../components/EntradaModal';
import { normalize, TEMA_RESPONSAVEL, EMOJIS_CATEGORIA, CORES_CATEGORIA, fontesFor } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { criarEstilos } from '../estilos';
import { TopBar, BotaoVoltar } from '../components/TopBar';
import Campo from '../components/Campo';
import SeletorCor from '../components/SeletorCor';
import BannerErro from '../components/BannerErro';
import BotaoAnimado from '../components/BotaoAnimado';
import ItemEscalonado from '../components/ItemEscalonado';
import { Categorias, Pictogramas, Uploads, API_URL, mensagemErro } from '../api';
import { useApp } from '../AppContext';

const C = TEMA_RESPONSAVEL;
const V = 'adulto';
const F = fontesFor(V);

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
  return API_URL.replace(/\/$/, '') + '/' + caminhoRelativo.replace(/^\//, '');
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

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const res = await Categorias.listar(crianca.id_crianca, { usuario_id: usuario.id_usuario });
      if (res.data.success) setCategorias(res.data.categorias);
    } catch (err) { Alert.alert('Erro', mensagemErro(err)); }
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
        await Categorias.atualizar({ id_categoria: editando.id_categoria, usuario_id: usuario.id_usuario, nome_categoria: nome.trim(), emoji, cor });
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
      { text: 'Remover', style: 'destructive', onPress: async () => { await Categorias.remover(cat.id_categoria, usuario.id_usuario); carregar(); } },
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
        Categorias.atualizar({ id_categoria: nova[index].id_categoria, usuario_id: usuario.id_usuario, ordem: index }),
        Categorias.atualizar({ id_categoria: nova[alvo].id_categoria, usuario_id: usuario.id_usuario, ordem: alvo }),
      ]);
    } catch (err) {
      Alert.alert('Erro', mensagemErro(err));
      carregar(); // desfaz a troca otimista se o servidor recusar
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.primaria} />
      <TopBar titulo="Editor de conteúdo" onVoltar={onVoltar} onAcao={abrirNovo} C={C} variante={V} />
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={{ color: C.subtexto, marginBottom: normalize(14), fontSize: normalize(12.5) }}>Toque numa categoria para editar os pictogramas. Segure para editar ou remover a categoria.</Text>
        {loading ? <ActivityIndicator color={C.secundaria} /> : categorias.map((cat, index) => (
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

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const res = await Pictogramas.listar(categoria.id_categoria, { usuario_id: usuario.id_usuario });
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
        await Pictogramas.atualizar({ id_fala: editando.id_fala, usuario_id: usuario.id_usuario, texto: texto.trim(), emoji, ...payloadImagem });
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
        Pictogramas.atualizar({ id_fala: nova[index].id_fala, usuario_id: usuario.id_usuario, ordem: index }),
        Pictogramas.atualizar({ id_fala: nova[alvo].id_fala, usuario_id: usuario.id_usuario, ordem: alvo }),
      ]);
    } catch (err) {
      Alert.alert('Erro', mensagemErro(err));
      carregar();
    }
  };

  const remover = (p) => {
    Alert.alert('Remover pictograma', `Remover "${p.texto}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: async () => { await Pictogramas.remover(p.id_fala, usuario.id_usuario); carregar(); } },
    ]);
  };

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.primaria} />
      <TopBar titulo={categoria.nome_categoria} onVoltar={onVoltar} onAcao={abrirNovo} C={C} variante={V} />
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={{ color: C.subtexto, marginBottom: normalize(14), fontSize: normalize(12.5) }}>Segure um pictograma para editar ou remover.</Text>
        {loading ? <ActivityIndicator color={C.secundaria} /> : (
          <View style={s.grid}>
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
          </View>
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
