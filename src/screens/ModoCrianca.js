import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator,
  SafeAreaView, StatusBar, Platform, Image, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { normalize, corTema, HUMORES, fontesFor, corContraste } from '../theme';
import { criarEstilos } from '../estilos';
import PinModal from '../components/PinModal';
import BotaoAcessivel from '../components/BotaoAcessivel';
import EstadoConexao from '../components/EstadoConexao';
import ItemEscalonado from '../components/ItemEscalonado';
import { PainelVidro, FundoGradiente } from '../components/Vidro';
import { useVarredura } from '../hooks/useVarredura';
import { Categorias, Pictogramas, Historico, Frases, Rotinas, Mood, API_URL, mensagemErro } from '../api';
import { falarTexto } from '../speech';

const FK = fontesFor('crianca');

// falas.php guarda só o caminho relativo da foto do pictograma;
// aqui montamos a URL completa a partir do mesmo host do backend.
function urlImagem(caminhoRelativo) {
  if (!caminhoRelativo) return null;
  return API_URL.replace(/\/$/, '') + '/' + caminhoRelativo.replace(/^\//, '');
}

const NOMES_DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
function diaSemanaAtual() { return NOMES_DIAS[new Date().getDay()]; }

function tamanhoCard(crianca) {
  let base = 100;
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

// ─────────────────────────────────────────────────────────────
// Botão-ícone com "pop" ao toque (spring de escala). Usado nas ações da
// barra de frase e no botão de voltar do topo — nenhum dos dois é um alvo
// repetido dezenas de vezes na tela (ao contrário dos pictogramas, que usam
// BotaoAcessivel por causa da varredura/dwell), então uma Animated.View
// própria e simples resolve sem mexer no componente de acessibilidade.
// ─────────────────────────────────────────────────────────────
function BotaoIcone({ onPress, disabled, corFundo, tamanho = 48, style, children }) {
  const escala = useRef(new Animated.Value(1)).current;
  const pressIn = () => Animated.spring(escala, { toValue: 0.88, useNativeDriver: true, speed: 40, bounciness: 6 }).start();
  const pressOut = () => Animated.spring(escala, { toValue: 1, useNativeDriver: true, speed: 26, bounciness: 10 }).start();
  return (
    <Animated.View style={[{ transform: [{ scale: escala }] }, style]}>
      <TouchableOpacity
        activeOpacity={0.85}
        disabled={disabled}
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

// Chip da barra de frase — nasce com um "pop" (escala 0→1 com bounce) só a
// primeira vez que aparece na tela, então cada pictograma que a criança
// adiciona reage de verdade, em vez de simplesmente surgir estático.
function ChipFrase({ emoji, C }) {
  const escala = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(escala, { toValue: 1, useNativeDriver: true, speed: 22, bounciness: 16 }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <Animated.View
      style={{
        backgroundColor: C.cinza, borderRadius: normalize(16), width: normalize(46), height: normalize(46),
        alignItems: 'center', justifyContent: 'center', marginRight: normalize(8),
        transform: [{ scale: escala }],
      }}
    >
      <Text style={{ fontSize: normalize(24) }}>{emoji}</Text>
    </Animated.View>
  );
}

// Sombra colorida suave (glow discreto) a partir da própria cor do card —
// só no iOS o shadowColor tem efeito visível; no Android usamos elevation.
function sombra(cor) {
  return Platform.select({
    ios: { shadowColor: cor, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.28, shadowRadius: 10 },
    default: { elevation: 5 },
  });
}

// ─────────────────────────────────────────────────────────────
// Tela raiz do Modo Criança — controla a navegação interna
// (menu → categorias → pictogramas / favoritos / rotina / humor)
// ─────────────────────────────────────────────────────────────
export function TelaModoCrianca({ crianca, auth, onSair }) {
  const C = corTema(crianca);
  const semVidro = !!crianca.alto_contraste;
  const escuro = crianca.tema === 'escuro';
  const s = useMemo(() => criarEstilos(C, 'crianca', { semVidro, escuro }), [C, semVidro, escuro]);
  const [tela, setTela] = useState('menu');
  const [categoriaAtiva, setCategoriaAtiva] = useState(null);
  const [pinVisivel, setPinVisivel] = useState(false);

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle={crianca.tema === 'escuro' || crianca.alto_contraste ? 'light-content' : 'dark-content'} backgroundColor={C.primaria} />
      {!semVidro && <FundoGradiente variante="crianca" escuro={escuro} />}

      {tela === 'menu' && (
        <KidMenu C={C} s={s} crianca={crianca} onNavegar={setTela} onPedirSaida={() => setPinVisivel(true)} />
      )}
      {tela === 'categorias' && (
        <KidCategorias C={C} s={s} crianca={crianca} auth={auth} onVoltar={() => setTela('menu')}
          onAbrirCategoria={(cat) => { setCategoriaAtiva(cat); setTela('categoria'); }} />
      )}
      {tela === 'categoria' && (
        <KidCategoria C={C} s={s} crianca={crianca} auth={auth} categoria={categoriaAtiva} onVoltar={() => setTela('categorias')} />
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
    { tela: 'categorias', emoji: '💬', label: 'Comunicação', legenda: 'Fale o que quiser', cor: C.primaria },
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
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: normalize(24) }} bounces={false}>
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
              <TouchableOpacity onPress={() => onNavegar(c.tela)} activeOpacity={0.88} style={{ width: '100%', height: '100%' }}>
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

        <TouchableOpacity
          onPress={onPedirSaida}
          activeOpacity={0.8}
          style={{
            flexDirection: 'row', alignItems: 'center', gap: normalize(6), alignSelf: 'center',
            marginTop: normalize(28), paddingHorizontal: normalize(18), paddingVertical: normalize(12),
            borderRadius: normalize(20), backgroundColor: altoContraste ? C.cinza : 'rgba(255,255,255,0.4)',
          }}
        >
          <Ionicons name="lock-closed" size={normalize(14)} color={C.subtexto} />
          <Text style={{ color: C.subtexto, fontSize: normalize(13), fontFamily: FK.bodySemi }}>Sair (responsável)</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

// ── Lista de categorias ─────────────────────────────────────
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
  }, [crianca.id_crianca]);

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
              </ItemEscalonado>
            ))}
            {categorias.length === 0 && <Text style={s.vazio}>Peça pro responsável cadastrar categorias em Ajustes! 🧩</Text>}
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
function KidTopo({ C, titulo, onVoltar, semVidro = false, escuro = false }) {
  // No caminho normal (com vidro), C.texto já foi pensado pra combinar com o
  // fundo daquele tema. No alto contraste (sem vidro, fundo sólido amarelo),
  // C.texto é branco — o que fica ilegível em cima do amarelo — por isso usa
  // a cor de contraste calculada especificamente pra isso nesse caso.
  const corTexto = semVidro ? corContraste(C) : C.texto;
  const conteudo = (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: normalize(16), paddingTop: Platform.OS === 'android' ? normalize(16) : normalize(10), paddingBottom: normalize(16) }}>
      <BotaoIcone onPress={onVoltar} corFundo="rgba(255,255,255,0.4)" tamanho={50}>
        <Ionicons name="arrow-back" size={normalize(24)} color={corTexto} />
      </BotaoIcone>
      <Text style={{ flex: 1, textAlign: 'center', fontSize: normalize(16), fontFamily: FK.display, color: corTexto, letterSpacing: 0.3 }} numberOfLines={1}>{titulo}</Text>
      <View style={{ width: normalize(50) }} />
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
function KidCategoria({ C, s, crianca, auth, categoria, onVoltar }) {
  const [pictogramas, setPictogramas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(false);
  const [frase, setFrase] = useState([]);
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
    setFrase((p) => [...p, item]);
  };

  // Fala a frase inteira montada e só então registra no histórico —
  // o histórico passa a refletir o que a criança de fato falou, não cada
  // toque individual em um pictograma.
  const falarFrase = () => {
    if (frase.length === 0) return;
    const texto = frase.map((f) => f.texto).join(' ');
    falarTexto(texto, crianca);
    Historico.registrar({ crianca_id: crianca.id_crianca, texto, emoji: frase[frase.length - 1]?.emoji, tipo: 'fala', ...auth }).catch(() => {});
  };

  const salvarFrase = () => {
    if (frase.length === 0) return;
    const texto = frase.map((f) => f.texto).join(' ');
    Frases.salvar({ crianca_id: crianca.id_crianca, texto, ...auth })
      .then(() => Alert.alert('⭐', 'Frase salva nos favoritos!'))
      .catch(() => {});
  };

  const corBarra = altoContraste ? C.cinza : C.branco;

  return (
    <View style={{ flex: 1 }}>
      <KidTopo C={C} titulo={categoria.nome_categoria.toUpperCase()} onVoltar={onVoltar} semVidro={altoContraste} escuro={crianca.tema === 'escuro'} />

      {/* Cartão da frase: destacado do resto da tela (sombra própria) pra
          deixar claro que é uma área de trabalho separada da grade abaixo —
          onde a frase é montada, não onde ela é escolhida. */}
      <View
        style={[
          { flexDirection: 'row', alignItems: 'center', backgroundColor: corBarra, marginHorizontal: normalize(14), marginTop: normalize(12), borderRadius: normalize(22), paddingHorizontal: normalize(12), paddingVertical: normalize(10) },
          sombra(C.primaria),
        ]}
      >
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
          {frase.length > 0 ? frase.map((f, i) => <ChipFrase key={i} emoji={f.emoji} C={C} />) : (
            <Text style={{ color: C.subtexto, paddingVertical: normalize(10), fontFamily: FK.body }}>Toque nos pictogramas para montar sua frase...</Text>
          )}
        </ScrollView>
        <BotaoIcone onPress={salvarFrase} corFundo={C.destaque} tamanho={44} style={{ marginLeft: normalize(6) }}>
          <Ionicons name="star" size={normalize(20)} color={corContraste(C)} />
        </BotaoIcone>
        <BotaoIcone onPress={() => setFrase((p) => p.slice(0, -1))} disabled={frase.length === 0} corFundo={C.roxoSuave} tamanho={44} style={{ marginLeft: normalize(6) }}>
          <Ionicons name="backspace-outline" size={normalize(20)} color={corContraste(C)} />
        </BotaoIcone>
        <BotaoIcone onPress={() => setFrase([])} disabled={frase.length === 0} corFundo={C.erro} tamanho={44} style={{ marginLeft: normalize(6) }}>
          <Ionicons name="trash-outline" size={normalize(20)} color="#FFF" />
        </BotaoIcone>
        <BotaoIcone onPress={falarFrase} disabled={frase.length === 0} corFundo={C.sucesso} tamanho={44} style={{ marginLeft: normalize(6) }}>
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
              </ItemEscalonado>
            ))}
            {pictogramas.length === 0 && <Text style={s.vazio}>Nenhum pictograma nessa categoria ainda! 🧸</Text>}
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
  }, [crianca.id_crianca]);

  useEffect(() => { carregar(); }, [carregar]);

  const falar = (f) => falarTexto(f.texto, crianca);
  const remover = (f) => {
    Alert.alert('Remover dos favoritos?', `"${f.texto}"`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: () => Frases.remover(f.id_frase, auth).then(carregar).catch(() => {}) },
    ]);
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
                  {!varreduraAtiva && (
                    <BotaoIcone onPress={() => remover(f)} corFundo={C.erro} tamanho={56}>
                      <Ionicons name="trash-outline" size={normalize(20)} color="#FFF" />
                    </BotaoIcone>
                  )}
                </View>
              </ItemEscalonado>
            ))}
            {frases.length === 0 && <Text style={s.vazio}>Salve frases tocando na ⭐ na tela de comunicação!</Text>}
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
    Rotinas.listar(crianca.id_crianca, auth, diaSemanaAtual())
      .then((r) => { if (r.data.success) setRotinas(r.data.rotinas); else setErro(true); })
      .catch(() => setErro(true))
      .finally(() => setLoading(false));
  }, [crianca.id_crianca]);

  useEffect(() => { carregar(); }, [carregar]);

  const concluir = (r) => {
    Rotinas.concluir(r.id_rotina, auth).then(() => carregar()).catch(() => {});
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

// ── "Como eu estou" (registro de humor) ─────────────────────
function KidHumor({ C, s, crianca, auth, onVoltar }) {
  const altoContraste = !!crianca.alto_contraste;
  const registrar = (h) => {
    Mood.registrar({ crianca_id: crianca.id_crianca, humor: h.chave, emoji: h.emoji, ...auth })
      .then(() => { falarTexto(`Estou ${h.label.toLowerCase()}`, crianca); onVoltar(); })
      .catch(() => {});
  };
  return (
    <View style={{ flex: 1 }}>
      <KidTopo C={C} titulo="COMO EU ESTOU?" onVoltar={onVoltar} semVidro={altoContraste} escuro={crianca.tema === 'escuro'} />
      <ScrollView contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', padding: normalize(20), gap: normalize(16), justifyContent: 'center' }}>
        {HUMORES.map((h, i) => (
          <ItemEscalonado key={h.chave} indice={i} style={{ width: '28%', aspectRatio: 1 }}>
            <TouchableOpacity
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
          </ItemEscalonado>
        ))}
      </ScrollView>
    </View>
  );
}
