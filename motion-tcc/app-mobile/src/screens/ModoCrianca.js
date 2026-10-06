import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator,
  SafeAreaView, StatusBar, Platform, Image, Animated, BackHandler,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { normalize, corTema, HUMORES, fontesFor, corContraste } from '../theme';
import { criarEstilos } from '../estilos';
import PinModal from '../components/PinModal'; // PinModal mantido — o pareamento por PIN ainda acontece no modo Criança
import BotaoAcessivel from '../components/BotaoAcessivel';
import EstadoConexao from '../components/EstadoConexao';
import ItemEscalonado from '../components/ItemEscalonadoMoti';
import { PainelVidro, FundoGradiente } from '../components/Vidro';
import { useVarredura } from '../hooks/useVarredura';
import { Categorias, Pictogramas, Historico, Frases, Rotinas, Mood, API_URL, mensagemErro } from '../api';
import { TelaAvisarResponsavel } from './Avisos';
import { falarTexto } from '../speech';
import { addPhraseItem, removePhraseItem, removeLastPhraseItem, clearPhraseDraft, getPhraseText } from '../phraseDraft';

const FK = fontesFor('crianca');

// falas.php guarda só o caminho relativo da foto do pictograma;
// aqui montamos a URL completa a partir do mesmo host do backend.
function urlImagem(caminhoRelativo) {
  if (!caminhoRelativo) return null;
  if (/^https?:\/\//i.test(caminhoRelativo)) return caminhoRelativo;
  const origem = API_URL.replace(/\/api\.php\/?$/i, '').replace(/\/$/, '');
  return origem + '/' + caminhoRelativo.replace(/^\//, '');
}

const NOMES_DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
function diaSemanaAtual() { return NOMES_DIAS[new Date().getDay()]; }

function tamanhoCard(crianca) {
  let base = 92;
  if (crianca.tamanho_pictograma === 'grande') base = 108;
  if (crianca.tamanho_pictograma === 'gigante') base = 130;
  if (crianca.alvos_gigantes) base += 30;
  return normalize(base);
}

// Mistura um hex com branco/preto pra gerar um tom de apoio (mais claro no
// topo do card, mais escuro no rodapé) a partir de UMA única cor vinda do
// banco (categoria/tile) — dá profundidade tipo "botão físico" sem precisar
// de uma segunda cor cadastrada em lugar nenhum.
function misturarCor(hex, alvo, quantidade) {
  if (!hex || hex[0] !== '#') return hex;
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const bigint = parseInt(full, 16);
  if (Number.isNaN(bigint)) return hex;
  const r = (bigint >> 16) & 255, g = (bigint >> 8) & 255, b = bigint & 255;
  const [ar, ag, ab] = alvo === 'branco' ? [255, 255, 255] : [0, 0, 0];
  const mix = (c, a) => Math.max(0, Math.min(255, Math.round(c + (a - c) * quantidade)));
  const toHex = (v) => v.toString(16).padStart(2, '0');
  return `#${toHex(mix(r, ar))}${toHex(mix(g, ag))}${toHex(mix(b, ab))}`;
}

// Botão-ícone com "pop" ao toque. Usado só na barra de frase e no voltar do
// topo (alvos esporádicos, não repetidos como os pictogramas) — por isso usa
// uma Animated.View simples em vez de BotaoAcessivel, que é reservado aos
// pictogramas por causa da varredura/dwell.
function BotaoIcone({ onPress, disabled, corFundo, tamanho = 48, style, children, accessibilityLabel }) {
  const escala = useRef(new Animated.Value(1)).current;
  const pressIn = () => Animated.spring(escala, { toValue: 0.88, useNativeDriver: true, speed: 40, bounciness: 6 }).start();
  const pressOut = () => Animated.spring(escala, { toValue: 1, useNativeDriver: true, speed: 26, bounciness: 10 }).start();
  return (
    <Animated.View style={[{ transform: [{ scale: escala }] }, style]}>
      <TouchableOpacity
        activeOpacity={0.85}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        style={{
          width: normalize(tamanho), height: normalize(tamanho), borderRadius: normalize(tamanho / 2),
          backgroundColor: corFundo, alignItems: 'center', justifyContent: 'center',
          opacity: disabled ? 0.35 : 1,
        }}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
}

// Chip da barra de frase — nasce com um "pop" (escala 0→1 com bounce) quando
// entra e sai com um "encolher + sumir" quando é removido, então cada
// pictograma que a criança adiciona (ou retira) reage de verdade em vez de
// simplesmente surgir/sumir estático.
function ChipFrase({ emoji, C, aoRemover }) {
  const escala = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const removendo = useRef(false);

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(escala, { toValue: 1, useNativeDriver: true, speed: 22, bounciness: 16 }),
        Animated.timing(opacity, { toValue: 1, duration: 120, useNativeDriver: true }),
      ]),
    ]).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const remover = () => {
    if (removendo.current || !aoRemover) return;
    removendo.current = true;
    // encolhe e some antes de tirar do array — o feedback visual vem antes
    // da remoção de dados, então a criança vê a palavra "indo embora"
    Animated.parallel([
      Animated.spring(escala, { toValue: 0.3, useNativeDriver: true, speed: 40, bounciness: 0 }),
      Animated.timing(opacity, { toValue: 0, duration: 160, useNativeDriver: true }),
    ]).start(({ finished }) => {
      if (finished) aoRemover();
    });
  };

  return (
    <Animated.View
      style={{
        backgroundColor: C.cinza, borderRadius: normalize(16), width: normalize(52), height: normalize(46),
        alignItems: 'center', justifyContent: 'center', marginRight: normalize(8),
        transform: [{ scale: escala }], opacity,
        flexDirection: 'row', paddingHorizontal: normalize(4),
      }}
    >
      <Text style={{ fontSize: normalize(24) }}>{emoji}</Text>
      {aoRemover ? (
        <TouchableOpacity
          onPress={remover}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={{ marginLeft: normalize(4), padding: normalize(2) }}
          accessibilityLabel="Remover esta palavra"
        >
          <Ionicons name="close-circle" size={normalize(18)} color={C.erro} />
        </TouchableOpacity>
      ) : null}
    </Animated.View>
  );
}

// Sombra colorida a partir da cor do card — iOS usa shadow; Android usa elevation.
function sombra(cor) {
  return Platform.select({
    ios: { shadowColor: cor, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.28, shadowRadius: 10 },
    default: { elevation: 5 },
  });
}

// ── Modo Criança: navegação interna (menu → categorias → pictogramas) ──
export function TelaModoCrianca({ crianca, auth, onSair }) {
  const C = corTema(crianca);
  const semVidro = !!crianca.alto_contraste;
  const escuro = crianca.tema === 'escuro';
  const s = useMemo(() => criarEstilos(C, 'crianca', { semVidro, escuro }), [C, semVidro, escuro]);
  const [tela, setTela] = useState('menu');
  const [categoriaAtiva, setCategoriaAtiva] = useState(null);
  const [rascunhoFrase, setRascunhoFrase] = useState([]);
  const [pinVisivel, setPinVisivel] = useState(false);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (pinVisivel) return false;
      if (tela === 'categoria') { setTela('falas'); return true; }
      if (tela !== 'menu') { setTela('menu'); return true; }
      setPinVisivel(true);
      return true;
    });
    return () => subscription.remove();
  }, [tela, pinVisivel]);

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle={crianca.tema === 'escuro' || crianca.alto_contraste ? 'light-content' : 'dark-content'} backgroundColor={C.primaria} />
      {!semVidro && <FundoGradiente variante="crianca" escuro={escuro} />}

      {tela === 'menu' && (
        <KidMenu C={C} s={s} crianca={crianca} onNavegar={setTela} onPedirSaida={() => setPinVisivel(true)} />
      )}
      {tela === 'falas' && (
        <KidCategorias C={C} s={s} crianca={crianca} auth={auth} onVoltar={() => setTela('menu')}
          onAbrirCategoria={(cat) => { setCategoriaAtiva(cat); setTela('categoria'); }} />
      )}
      {tela === 'categoria' && (
        <KidCategoria C={C} s={s} crianca={crianca} auth={auth} categoria={categoriaAtiva} onVoltar={() => setTela('falas')} frase={rascunhoFrase} setFrase={setRascunhoFrase} />
      )}
      {tela === 'favoritos' && (
        <KidFavoritos C={C} s={s} crianca={crianca} auth={auth} onVoltar={() => setTela('menu')} />
      )}
      {tela === 'rotina' && (
        <KidRotina C={C} s={s} crianca={crianca} auth={auth} onVoltar={() => setTela('menu')} />
      )}
      {tela === 'humor' && (
        <KidHumor C={C} s={s} crianca={crianca} auth={auth} onVoltar={() => setTela('menu')} />
      )}
      {tela === 'avisar' && (
        <TelaAvisarResponsavel crianca={crianca} auth={auth} onVoltar={() => setTela('menu')} />
      )}

      <PinModal
        visivel={pinVisivel}
        pinCorreto={crianca.pin_saida || '1234'}
        onConfirmar={() => { setPinVisivel(false); onSair(); }}
        onCancelar={() => setPinVisivel(false)}
        C={C}
        semVidro={semVidro}
        escuro={escuro}
      />
    </SafeAreaView>
  );
}

// ── Menu principal do Modo Criança ──────────────────────────
function KidMenu({ C, s, crianca, onNavegar, onPedirSaida }) {
  const cards = [
    { tela: 'falas', emoji: '💬', label: 'Comunicação', legenda: 'Fale o que quiser', cor: C.primaria },
    { tela: 'favoritos', emoji: '⭐', label: 'Favoritos', legenda: 'Suas frases guardadas', cor: C.destaque },
    { tela: 'rotina', emoji: '📅', label: 'Minha Rotina', legenda: 'O que vem agora', cor: C.sucesso },
    { tela: 'humor', emoji: '💛', label: 'Como eu estou', legenda: 'Conte pra gente', cor: C.alerta },
  ];
  // Nos temas normais o texto do card usa C.texto (combina com o resto da
  // tela). No alto contraste, as cores de destaque são muito claras/saturadas
  // pra isso — usa a cor segura calculada especificamente pra ficar legível
  // em cima de uma cor de destaque, não do fundo.
  const corTextoTile = crianca.alto_contraste ? corContraste(C) : C.texto;
  const altoContraste = !!crianca.alto_contraste;

  return (
    <View style={{ flex: 1 }}>
      {/* ScrollView aqui é essencial: sem ela, em telas mais baixas (ou com a
          fonte/tamanho de alvo aumentados) os cards não cabem e acabam
          cortados ou sobrepondo o botão "Sair" abaixo, em vez de rolar. */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1, paddingBottom: normalize(24) }} bounces={false}>
        <View style={{ alignItems: 'center', paddingTop: normalize(28), paddingBottom: normalize(20) }}>
          <View
            style={{
              width: normalize(96), height: normalize(96), borderRadius: normalize(48),
              alignItems: 'center', justifyContent: 'center',
              backgroundColor: altoContraste ? C.cinza : 'rgba(255,255,255,0.55)',
              borderWidth: 2, borderColor: altoContraste ? C.primaria : 'rgba(255,255,255,0.7)',
              ...sombra(C.primaria),
            }}
          >
            <Text style={{ fontSize: normalize(52) }}>{crianca.avatar_emoji}</Text>
          </View>
          <Text style={{ fontSize: normalize(26), fontFamily: FK.display, color: C.texto, marginTop: normalize(12) }}>Oi, {crianca.nome}!</Text>
          <Text style={{ fontSize: normalize(14), fontFamily: FK.body, color: C.subtexto, marginTop: normalize(2) }}>O que você quer fazer agora?</Text>
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: normalize(20), gap: normalize(16), justifyContent: 'center' }}>
          {cards.map((c, i) => (
            <ItemEscalonado key={c.tela} indice={i} style={{ width: '44%', aspectRatio: 0.92 }}>
              <TouchableOpacity onPress={() => onNavegar(c.tela)} activeOpacity={0.88} accessibilityRole="button" accessibilityLabel={c.label} accessibilityHint={c.legenda} style={{ width: '100%', height: '100%' }}>
                <View
                  style={[
                    { width: '100%', height: '100%', borderRadius: normalize(30), overflow: 'hidden', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.45)' },
                    sombra(c.cor),
                  ]}
                >
                  {altoContraste ? (
                    <View style={{ flex: 1, backgroundColor: c.cor, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ fontSize: normalize(46) }}>{c.emoji}</Text>
                      <Text style={{ fontSize: normalize(16), fontFamily: FK.displaySemi, color: corTextoTile, marginTop: normalize(10), textAlign: 'center' }}>{c.label}</Text>
                    </View>
                  ) : (
                    <LinearGradient
                      colors={[misturarCor(c.cor, 'branco', 0.22), c.cor, misturarCor(c.cor, 'preto', 0.12)]}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                      style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: normalize(10) }}
                    >
                      <View style={{ width: normalize(64), height: normalize(64), borderRadius: normalize(20), backgroundColor: 'rgba(255,255,255,0.32)', alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontSize: normalize(38) }}>{c.emoji}</Text>
                      </View>
                      <Text style={{ fontSize: normalize(16), fontFamily: FK.displaySemi, color: corTextoTile, marginTop: normalize(12), textAlign: 'center' }}>{c.label}</Text>
                      <Text style={{ fontSize: normalize(11), fontFamily: FK.body, color: corTextoTile, opacity: 0.85, marginTop: normalize(2), textAlign: 'center' }}>{c.legenda}</Text>
                    </LinearGradient>
                  )}
                </View>
              </TouchableOpacity>
            </ItemEscalonado>
          ))}
        </View>
        <TouchableOpacity onPress={() => onNavegar('avisar')} activeOpacity={0.86} style={{ marginHorizontal: normalize(20), marginTop: normalize(18), padding: normalize(17), borderRadius: normalize(22), backgroundColor: altoContraste ? C.erro : 'rgba(255,255,255,0.78)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: C.erro }}>
          <Text style={{ fontSize: normalize(25), marginRight: normalize(9) }}>🆘</Text>
          <View><Text style={{ color: C.erro, fontFamily: FK.displaySemi, fontSize: normalize(17) }}>Avisar responsável</Text><Text style={{ color: C.subtexto, fontFamily: FK.body, fontSize: normalize(11) }}>Fome, dor, medo ou outro aviso</Text></View>
        </TouchableOpacity>

      </ScrollView>
      <TouchableOpacity
        onPress={onPedirSaida}
        activeOpacity={0.8}
        style={{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: normalize(8),
          marginHorizontal: normalize(20), marginTop: normalize(10), marginBottom: normalize(14),
          paddingHorizontal: normalize(18), paddingVertical: normalize(14),
          borderRadius: normalize(20), backgroundColor: altoContraste ? C.cinza : 'rgba(255,255,255,0.72)',
          borderWidth: 1, borderColor: altoContraste ? C.primaria : 'rgba(0,0,0,0.08)',
        }}
      >
        <Ionicons name="log-out-outline" size={normalize(18)} color={C.subtexto} />
        <Text style={{ color: C.subtexto, fontSize: normalize(14), fontFamily: FK.bodySemi }}>Sair do modo criança</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Aba Falas: categorias e pictogramas ─────────────────────
function KidCategorias({ C, s, crianca, auth, onVoltar, onAbrirCategoria }) {
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(false);
  const varreduraAtiva = !!crianca.varredura_ativa;
  const indiceDestacado = useVarredura(categorias.length, varreduraAtiva, crianca.varredura_velocidade);
  const altoContraste = !!crianca.alto_contraste;

  const carregar = useCallback(() => {
    setLoading(true);
    setErro(false);
    Categorias.listar(crianca.id_crianca, auth)
      .then((r) => { if (r.data.success) setCategorias(r.data.categorias); else setErro(true); })
      .catch(() => setErro(true))
      .finally(() => setLoading(false));
  }, [crianca.id_crianca, auth]);

  useEffect(() => { carregar(); }, [carregar]);

  const selecionar = (cat) => onAbrirCategoria(cat);
  const tam = tamanhoCard(crianca) + normalize(30);

  return (
    <View style={{ flex: 1 }}>
      <KidTopo C={C} titulo="O QUE VOCÊ QUER FALAR?" onVoltar={onVoltar} semVidro={altoContraste} escuro={crianca.tema === 'escuro'} />
      {loading ? <ActivityIndicator color={C.secundaria} style={{ marginTop: 30 }} /> : erro ? (
        <EstadoConexao C={C} onTentarNovamente={carregar} />
      ) : (
        <View style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={{ padding: normalize(16), flexDirection: 'row', flexWrap: 'wrap', gap: normalize(14), justifyContent: 'center' }} scrollEnabled={!varreduraAtiva}>
            {categorias.map((cat, i) => (
              <ItemEscalonado key={cat.id_categoria} indice={i}>
                <View style={{ width: tam, height: tam, position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
                  <BotaoAcessivel
                    modoVarredura={varreduraAtiva}
                    destacado={indiceDestacado === i}
                    tempoResposta={crianca.tempo_resposta}
                    onSelecionar={() => selecionar(cat)}
                    style={[
                      {
                        width: tam, height: tam,
                        backgroundColor: altoContraste ? C.cinza : C.branco,
                        borderWidth: altoContraste ? 2 : 0, borderColor: C.primaria,
                        borderRadius: normalize(26), alignItems: 'center', justifyContent: 'center',
                        paddingTop: normalize(10),
                      },
                      !altoContraste && sombra(cat.cor),
                    ]}
                  >
                    <View
                      style={{
                        width: normalize(52), height: normalize(52), borderRadius: normalize(18),
                        backgroundColor: altoContraste ? 'transparent' : cat.cor,
                        alignItems: 'center', justifyContent: 'center', marginBottom: normalize(8),
                      }}
                    >
                      <Text style={{ fontSize: normalize(30) }}>{cat.emoji}</Text>
                    </View>
                    <Text style={{ fontSize: normalize(13), fontFamily: FK.bodyBold, color: C.texto, textAlign: 'center', paddingHorizontal: normalize(6) }} numberOfLines={2}>{cat.nome_categoria}</Text>
                  </BotaoAcessivel>
                </View>
              </ItemEscalonado>
            ))}
            {categorias.length === 0 && <Text style={s.vazio}>Ainda não tem categorias. Peça pra alguém do seu painel adicionar! 🧩</Text>}
          </ScrollView>
          {varreduraAtiva && (
            <TouchableOpacity
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
              activeOpacity={1}
              onPress={() => categorias[indiceDestacado] && selecionar(categorias[indiceDestacado])}
            />
          )}
        </View>
      )}
    </View>
  );
}

// Barra de topo simplificada usada dentro do Modo Criança (sem "+")
function KidTopo({ C, titulo, onVoltar, semVidro = false, escuro = false, extra = null }) {
  // No caminho normal (com vidro), C.texto já foi pensado pra combinar com o
  // fundo daquele tema. No alto contraste (sem vidro, fundo sólido amarelo),
  // C.texto é branco — o que fica ilegível em cima do amarelo — por isso usa
  // a cor de contraste calculada especificamente pra isso nesse caso.
  const corTexto = semVidro ? corContraste(C) : C.texto;
  const conteudo = (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: normalize(16), paddingTop: Platform.OS === 'android' ? normalize(16) : normalize(10), paddingBottom: normalize(16) }}>
      <TouchableOpacity
        onPress={onVoltar}
        activeOpacity={0.78}
        accessibilityRole="button"
        accessibilityLabel="Voltar"
        style={{
          minWidth: normalize(92), height: normalize(50), borderRadius: normalize(18),
          paddingHorizontal: normalize(10), flexDirection: 'row', alignItems: 'center',
          justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.55)',
        }}
      >
        <Ionicons name="arrow-back" size={normalize(22)} color={corTexto} />
        <Text style={{ marginLeft: normalize(5), fontSize: normalize(13), fontFamily: FK.bodyBold, color: corTexto }}>Voltar</Text>
      </TouchableOpacity>
      <Text style={{ flex: 1, textAlign: 'center', fontSize: normalize(16), fontFamily: FK.display, color: corTexto, letterSpacing: 0.3, paddingHorizontal: normalize(8) }} numberOfLines={2}>{titulo}</Text>
      {extra ? extra : <View style={{ width: normalize(50) }} />}
    </View>
  );

  if (semVidro) {
    return <View style={{ backgroundColor: C.primaria, borderBottomLeftRadius: normalize(25), borderBottomRightRadius: normalize(25) }}>{conteudo}</View>;
  }

  return (
    <PainelVidro variante="crianca" escuro={escuro} arredondado={normalize(25)} style={{ borderTopWidth: 0 }}>
      {conteudo}
    </PainelVidro>
  );
}

// ── Pictogramas de uma categoria + barra de frase ───────────
function KidCategoria({ C, s, crianca, auth, categoria, onVoltar, frase, setFrase }) {
  const [pictogramas, setPictogramas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(false);
  const fraseScrollRef = useRef(null);
  const varreduraAtiva = !!crianca.varredura_ativa;
  const indiceDestacado = useVarredura(pictogramas.length, varreduraAtiva, crianca.varredura_velocidade);
  const altoContraste = !!crianca.alto_contraste;

  const carregar = useCallback(() => {
    setLoading(true);
    setErro(false);
    Pictogramas.listar(categoria.id_categoria, auth)
      .then((r) => { if (r.data.success) setPictogramas(r.data.falas); else setErro(true); })
      .catch(() => setErro(true))
      .finally(() => setLoading(false));
  }, [categoria.id_categoria]);

  useEffect(() => { carregar(); }, [carregar]);

  // Tocar um pictograma só o adiciona na barra de frase — não fala na hora.
  // A criança monta a frase toque a toque e decide quando falar (botão 🔊),
  // em vez de cada toque disparar a fala imediatamente.
  const adicionarAoFrase = (item) => {
    setFrase((p) => addPhraseItem(p, item));
    // Cada pictograma também pode falar sozinho; o botão de voz continua
    // disponível para repetir a frase inteira montada. O TTS é local.
    falarTexto(item.texto, crianca);
    // vibração curtinha confirma o toque sem precisar de som — útil em salas
    // de aula e ajuda a criança a sentir que o pictograma "reagiu"
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch (_) {}
  };


  // Fala a frase inteira montada e só então registra no histórico —
  // o histórico passa a refletir o que a criança de fato falou, não cada
  // toque individual em um pictograma.
  const falarFrase = () => {
    if (frase.length === 0) return;
    const texto = getPhraseText(frase);
    falarTexto(texto, crianca);
    // Registro do histórico é secundário: a fala acontece sempre, mesmo sem rede.
    Historico.registrar({ crianca_id: crianca.id_crianca, texto, emoji: frase[frase.length - 1]?.emoji, tipo: 'fala' }, auth).catch(() => {});
  };

  const limparFrase = () => {
    if (frase.length === 0) return;
    if (frase.length === 1) { setFrase(clearPhraseDraft()); return; }
    Alert.alert(
      'Limpar a frase?',
      'Isto apaga todas as palavras da barra.',
      [
        { text: 'Manter', style: 'cancel' },
        { text: 'Limpar tudo', style: 'destructive', onPress: () => setFrase(clearPhraseDraft()) },
      ],
    );
  };

  const salvarFrase = () => {
    if (frase.length === 0) return;
    const texto = getPhraseText(frase);
    Frases.salvar({ crianca_id: crianca.id_crianca, texto }, auth)
      .then(() => Alert.alert('⭐', 'Frase salva nos favoritos!'))
      .catch((err) => Alert.alert('Não foi possível salvar', mensagemErro(err, 'Tente novamente quando houver conexão.')));
  };
  const corBarra = altoContraste ? C.cinza : C.branco;
  return (
    <View style={{ flex: 1 }}>
      <KidTopo C={C} titulo={categoria?.nome_categoria || 'FALAR'} onVoltar={onVoltar} semVidro={altoContraste} escuro={crianca.tema === 'escuro'} />
      {/* Cartão da frase: destacado do resto da tela (sombra própria) pra
          deixar claro que é uma área de trabalho separada da grade abaixo —
          onde a frase é montada, não onde ela é escolhida. */}
      <View
        style={[
          { flexDirection: 'row', alignItems: 'center', backgroundColor: corBarra, marginHorizontal: normalize(14), marginTop: normalize(12), borderRadius: normalize(22), paddingHorizontal: normalize(12), paddingVertical: normalize(10) },
          sombra(C.primaria),
        ]}
      >
        <ScrollView
          ref={fraseScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ flex: 1 }}
          onContentSizeChange={() => fraseScrollRef.current?.scrollToEnd({ animated: true })}
        >
          {frase.length > 0 ? frase.map((f, i) => (
            <ChipFrase
              key={f.draftKey || `${f.id_fala ?? f.texto}-${i}`}
              emoji={f.emoji}
              C={C}
              aoRemover={() => setFrase((p) => removePhraseItem(p, i))}
            />
          )) : (
            <Text style={{ color: C.subtexto, paddingVertical: normalize(10), fontFamily: FK.body }}>Toque nos pictogramas para montar sua frase...</Text>
          )}
        </ScrollView>
        <BotaoIcone accessibilityLabel="Salvar frase nos favoritos" onPress={salvarFrase} corFundo={C.destaque} tamanho={44} style={{ marginLeft: normalize(6) }}>
          <Ionicons name="star" size={normalize(20)} color={corContraste(C)} />
        </BotaoIcone>
        <BotaoIcone accessibilityLabel="Apagar última palavra" onPress={() => setFrase((p) => removeLastPhraseItem(p))} disabled={frase.length === 0} corFundo={C.roxoSuave} tamanho={44} style={{ marginLeft: normalize(6) }}>
          <Ionicons name="backspace-outline" size={normalize(20)} color={corContraste(C)} />
        </BotaoIcone>
        <BotaoIcone accessibilityLabel="Limpar frase" onPress={limparFrase} disabled={frase.length === 0} corFundo={C.erro} tamanho={44} style={{ marginLeft: normalize(6) }}>
          <Ionicons name="trash-outline" size={normalize(20)} color="#FFF" />
        </BotaoIcone>
        <BotaoIcone accessibilityLabel="Falar frase inteira" onPress={falarFrase} disabled={frase.length === 0} corFundo={C.sucesso} tamanho={44} style={{ marginLeft: normalize(6) }}>
          <Ionicons name="volume-high" size={normalize(20)} color="#FFF" />
        </BotaoIcone>
      </View>

      {loading ? <ActivityIndicator color={C.secundaria} style={{ marginTop: 30 }} /> : erro ? (
        <EstadoConexao C={C} onTentarNovamente={carregar} />
      ) : (
        <View style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={{ padding: normalize(16), flexDirection: 'row', flexWrap: 'wrap', gap: normalize(14), justifyContent: 'center' }} scrollEnabled={!varreduraAtiva}>
            {pictogramas.map((item, i) => (
              <ItemEscalonado key={item.id_fala} indice={i}>
                <View style={{ width: tamanhoCard(crianca), height: tamanhoCard(crianca), position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
                <BotaoAcessivel
                  modoVarredura={varreduraAtiva}
                  destacado={indiceDestacado === i}
                  tempoResposta={crianca.tempo_resposta}
                  onSelecionar={() => adicionarAoFrase(item)}
                  style={[
                    { width: tamanhoCard(crianca), height: tamanhoCard(crianca), backgroundColor: altoContraste ? C.cinza : C.branco, borderRadius: normalize(24), alignItems: 'center', justifyContent: 'center', paddingHorizontal: normalize(6) },
                    !altoContraste && sombra(C.primaria),
                  ]}
                >
                  {item.imagem_url ? (
                    <Image source={{ uri: urlImagem(item.imagem_url) }} style={{ width: normalize(48), height: normalize(48), borderRadius: normalize(14) }} />
                  ) : (
                    <Text style={{ fontSize: normalize(34) }}>{item.emoji}</Text>
                  )}
                  <Text style={{ fontSize: normalize(12), fontFamily: FK.bodyBold, color: C.texto, textAlign: 'center', marginTop: 4 }} numberOfLines={2}>{item.texto}</Text>
                </BotaoAcessivel>
                </View>
              </ItemEscalonado>
            ))}
            {pictogramas.length === 0 && <Text style={s.vazio}>Esta categoria ainda está vazia. Peça pra adicionar palavras no painel! 🧸</Text>}
          </ScrollView>
          {varreduraAtiva && (
            <TouchableOpacity
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
              activeOpacity={1}
              onPress={() => pictogramas[indiceDestacado] && adicionarAoFrase(pictogramas[indiceDestacado])}
            />
          )}
        </View>
      )}
    </View>
  );
}

// ── Favoritos (frases salvas) ────────────────────────────────
function KidFavoritos({ C, s, crianca, auth, onVoltar }) {
  const [frases, setFrases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(false);
  const varreduraAtiva = !!crianca.varredura_ativa;
  const indiceDestacado = useVarredura(frases.length, varreduraAtiva, crianca.varredura_velocidade);
  const altoContraste = !!crianca.alto_contraste;

  const carregar = useCallback(() => {
    setLoading(true);
    setErro(false);
    Frases.listar(crianca.id_crianca, auth)
      .then((r) => { if (r.data.success) setFrases(r.data.frases); else setErro(true); })
      .catch(() => setErro(true))
      .finally(() => setLoading(false));
  }, [crianca.id_crianca, auth]);

  useEffect(() => { carregar(); }, [carregar]);

  const falar = (f) => {
    falarTexto(f.texto, crianca);
    Historico.registrar({ crianca_id: crianca.id_crianca, texto: f.texto, tipo: 'favorito' }, auth).catch(() => {});
  };

  return (
    <View style={{ flex: 1 }}>
      <KidTopo C={C} titulo="MEUS FAVORITOS" onVoltar={onVoltar} semVidro={altoContraste} escuro={crianca.tema === 'escuro'} />
      {loading ? <ActivityIndicator color={C.secundaria} style={{ marginTop: 30 }} /> : erro ? (
        <EstadoConexao C={C} onTentarNovamente={carregar} />
      ) : (
        <View style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={{ padding: normalize(16) }} scrollEnabled={!varreduraAtiva}>
            {frases.map((f, i) => (
              <ItemEscalonado key={f.id_frase} indice={i} style={{ marginBottom: normalize(12) }}>
                <View style={{ flexDirection: 'row', alignItems: 'stretch', gap: normalize(8) }}>
                  <View style={{ flex: 1 }}>
                    <BotaoAcessivel
                      modoVarredura={varreduraAtiva}
                      destacado={indiceDestacado === i}
                      tempoResposta={crianca.tempo_resposta}
                      onSelecionar={() => falar(f)}
                      style={[
                        { flexDirection: 'row', alignItems: 'center', backgroundColor: altoContraste ? C.cinza : C.branco, borderRadius: normalize(20), padding: normalize(18) },
                        !altoContraste && sombra(C.destaque),
                      ]}
                    >
                      <View style={{ width: normalize(38), height: normalize(38), borderRadius: normalize(12), backgroundColor: altoContraste ? 'transparent' : C.destaque, alignItems: 'center', justifyContent: 'center', marginRight: normalize(12) }}>
                        <Ionicons name="star" size={normalize(18)} color={altoContraste ? C.destaque : corContraste(C)} />
                      </View>
                      <Text style={{ flex: 1, fontSize: normalize(17), fontFamily: FK.bodyBold, color: C.texto }}>{f.texto}</Text>
                    </BotaoAcessivel>
                  </View>
                </View>
              </ItemEscalonado>
            ))}
            {frases.length === 0 && <Text style={s.vazio}>Ainda não tem frases salvas. Peça pra adicionar no painel! ⭐</Text>}
          </ScrollView>
          {varreduraAtiva && (
            <TouchableOpacity style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} activeOpacity={1} onPress={() => frases[indiceDestacado] && falar(frases[indiceDestacado])} />
          )}
        </View>
      )}
    </View>
  );
}

// ── Rotina de hoje ────────────────────────────────────────────
function KidRotina({ C, s, crianca, auth, onVoltar }) {
  const [rotinas, setRotinas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(false);
  const altoContraste = !!crianca.alto_contraste;

  const carregar = useCallback(() => {
    setLoading(true);
    setErro(false);
    Rotinas.listar(crianca.id_crianca, diaSemanaAtual(), auth)
      .then((r) => { if (r.data.success) setRotinas(r.data.rotinas); else setErro(true); })
      .catch(() => setErro(true))
      .finally(() => setLoading(false));
  }, [crianca.id_crianca, auth]);

  useEffect(() => { carregar(); }, [carregar]);

  const concluir = (r) => {
    // Falha em background: o tick de "concluída" fica na tela, o servidor reconclia depois.
    Rotinas.concluir(r.id_rotina, undefined, auth).then(() => carregar()).catch((err) => Alert.alert('Não foi possível salvar', mensagemErro(err, 'A rotina será atualizada quando a conexão voltar.')));
  };

  return (
    <View style={{ flex: 1 }}>
      <KidTopo C={C} titulo={`ROTINA DE HOJE (${diaSemanaAtual().toUpperCase()})`} onVoltar={onVoltar} semVidro={altoContraste} escuro={crianca.tema === 'escuro'} />
      {loading ? <ActivityIndicator color={C.secundaria} style={{ marginTop: 30 }} /> : erro ? (
        <EstadoConexao C={C} onTentarNovamente={carregar} />
      ) : (
        <ScrollView contentContainerStyle={{ padding: normalize(16) }}>
          {rotinas.map((r, i) => (
            <ItemEscalonado key={r.id_rotina} indice={i} style={{ marginBottom: normalize(12) }}>
              <TouchableOpacity
                onPress={() => concluir(r)}
                disabled={r.concluida_hoje}
                accessibilityRole="button"
                accessibilityLabel={`${r.atividade}, ${r.concluida_hoje ? 'concluída hoje' : 'marcar como concluída'}`}
                activeOpacity={0.85}
                style={[
                  { flexDirection: 'row', alignItems: 'center', backgroundColor: altoContraste ? C.cinza : C.branco, borderRadius: normalize(20), padding: normalize(16), opacity: r.concluida_hoje ? 0.55 : 1 },
                  !altoContraste && sombra(C.sucesso),
                ]}
              >
                <View style={{ width: normalize(50), height: normalize(50), borderRadius: normalize(16), backgroundColor: altoContraste ? 'transparent' : C.cinza, alignItems: 'center', justifyContent: 'center', marginRight: normalize(14) }}>
                  <Text style={{ fontSize: normalize(28) }}>{r.icone}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: normalize(17), fontFamily: FK.bodyBold, color: C.texto, textDecorationLine: r.concluida_hoje ? 'line-through' : 'none' }}>{r.atividade}</Text>
                  <Text style={{ color: C.subtexto, fontFamily: FK.body, marginTop: 2 }}>{r.horario?.slice(0, 5)}</Text>
                </View>
                <Ionicons
                  name={r.concluida_hoje ? 'checkmark-circle' : 'ellipse-outline'}
                  size={normalize(28)}
                  color={r.concluida_hoje ? C.sucesso : C.subtexto}
                />
              </TouchableOpacity>
            </ItemEscalonado>
          ))}
          {rotinas.length === 0 && <Text style={s.vazio}>Nenhuma rotina para hoje! ☀️</Text>}
        </ScrollView>
      )}
    </View>
  );
}

// ── "Como eu estou" (registro de humor) ─────
// As emoções mostradas aqui são definidas pelo responsável no painel
// (Editor de conteúdo — seção Emoções). Esta tela é só de consumo: a criança
// registra como está e nada mais. As preferências ficam neste dispositivo
// (AsyncStorage, por criança), sem depender de mudança no backend.
const CHAVE_EMOCOES_CUSTOM = '@motion:emocoes:';

function KidHumor({ C, s, crianca, auth, onVoltar }) {
  const altoContraste = !!crianca.alto_contraste;
  const [emocoes, setEmocoes] = useState(null); // null = ainda carregando
  const [registrando, setRegistrando] = useState(false);

  // Carrega a lista salva da criança; se não existir, usa a padrão do theme
  useEffect(() => {
    let montado = true;
    AsyncStorage.getItem(CHAVE_EMOCOES_CUSTOM + crianca.id_crianca)
      .then((salvo) => {
        if (!montado) return;
        try {
          const dados = salvo ? JSON.parse(salvo) : null;
          if (Array.isArray(dados) && dados.length > 0) {
            setEmocoes(dados);
            return;
          }
        } catch (_) { /* JSON guardado corrompido — recua para a lista padrão */ }
        setEmocoes(HUMORES);
      })
      .catch(() => setEmocoes(HUMORES));
    return () => { montado = false; };
  }, [crianca.id_crianca, auth]);

  const registrar = async (h) => {
    if (registrando) return;
    setRegistrando(true);
    // Registro do humor é fire-and-forget: a reação da criança na tela não espera o servidor.
    try {
      await Mood.registrar({ crianca_id: crianca.id_crianca, humor: h.chave, emoji: h.emoji }, auth);
      falarTexto(`Estou ${h.label.toLowerCase()}`, crianca);
      onVoltar();
    } catch (err) {
      Alert.alert('Não foi possível registrar', mensagemErro(err, 'Tente novamente quando houver conexão.'));
    } finally { setRegistrando(false); }
  };

  if (!emocoes) {
    return (
      <View style={{ flex: 1 }}>
        <KidTopo C={C} titulo="COMO EU ESTOU?" onVoltar={onVoltar} semVidro={altoContraste} escuro={crianca.tema === 'escuro'} />
        <ActivityIndicator color={C.secundaria} style={{ marginTop: 30 }} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <KidTopo C={C} titulo="COMO EU ESTOU?" onVoltar={onVoltar} semVidro={altoContraste} escuro={crianca.tema === 'escuro'} />
      <ScrollView contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', padding: normalize(20), gap: normalize(16), justifyContent: 'center' }}>
        {emocoes.map((h, i) => (
          <ItemEscalonado key={h.chave} indice={i} style={{ width: '28%', aspectRatio: 1 }}>
            <View style={{ width: '100%', height: '100%' }}>
              <TouchableOpacity
                disabled={registrando}
                onPress={() => registrar(h)}
                activeOpacity={0.85}
                style={[
                  { width: '100%', height: '100%', backgroundColor: altoContraste ? C.cinza : C.branco, borderRadius: normalize(28), alignItems: 'center', justifyContent: 'center' },
                  !altoContraste && sombra(C.alerta),
                ]}
              >
                <Text style={{ fontSize: normalize(44) }}>{h.emoji}</Text>
                <Text style={{ fontFamily: FK.bodyBold, color: C.texto, marginTop: 6, fontSize: normalize(14) }}>{h.label}</Text>
              </TouchableOpacity>
            </View>
          </ItemEscalonado>
        ))}
      </ScrollView>
      <Text style={{ textAlign: 'center', color: C.subtexto, fontSize: normalize(11), fontFamily: FK.body, paddingBottom: normalize(10) }}>Pra mudar as emoções, use o painel do responsável</Text>
    </View>
  );
}
