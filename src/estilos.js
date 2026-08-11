import { StyleSheet, Platform, StatusBar } from 'react-native';
import { normalize, fontesFor, vidroFor } from './theme';

// Sombra suave e colorida (em vez do elevation cinza padrão do Android) —
// usada em botões e cards do modo Responsável pra dar profundidade real
// sem depender de vidro/blur (que aqui fica desligado por legibilidade).
function sombraSuave(cor, intensidade = 1) {
  return Platform.select({
    ios: { shadowColor: cor, shadowOffset: { width: 0, height: 4 * intensidade }, shadowOpacity: 0.16 * intensidade, shadowRadius: 8 * intensidade },
    default: { elevation: 3 * intensidade },
  });
}

// Gera o StyleSheet a partir da paleta de cor atual (C), de uma variante
// estrutural ('crianca' ou 'adulto') e de opções extras. `semVidro` desliga
// qualquer translucidez/vidro — usado quando o alto contraste está ativo no
// Modo Criança, já que aquele modo existe justamente pra maximizar
// legibilidade, e vidro/blur trabalha contra isso.
export function criarEstilos(C, variante = 'crianca', { semVidro = false, escuro = false } = {}) {
  const adulto = variante === 'adulto';
  const F = fontesFor(variante);
  const V = vidroFor(variante, escuro);
  const vidroCriancaAtivo = !adulto && !semVidro;
  const rCard = adulto ? normalize(18) : normalize(22);
  const rBotao = adulto ? normalize(16) : normalize(25);
  const rChip = adulto ? normalize(12) : normalize(16);
  const rInput = adulto ? normalize(14) : normalize(20);
  const rTopBar = adulto ? 0 : normalize(25);
  const borda = C.borda || C.cinzaMedio;

  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.fundo },
    scroll: { padding: normalize(16) },

    // Layout do topo — o fundo de verdade (blur + overlay) é responsabilidade
    // do <PainelVidro> em TopBar.js; aqui só ficam espaçamento e cantos.
    topBar: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: normalize(16),
      paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + normalize(10) : normalize(16),
      paddingBottom: normalize(16),
      borderBottomLeftRadius: rTopBar, borderBottomRightRadius: rTopBar,
    },
    topBarBtn: { width: normalize(40), height: normalize(40), backgroundColor: adulto ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.4)', borderRadius: adulto ? normalize(10) : normalize(20), alignItems: 'center', justifyContent: 'center' },
    topBarBtnTxt: { fontSize: normalize(20), color: '#FFFFFF', fontFamily: F.bodyBold },
    topBarTitulo: { fontSize: normalize(16), fontFamily: F.display, color: '#FFFFFF', flex: 1, textAlign: adulto ? 'left' : 'center', marginLeft: adulto ? normalize(12) : 0, letterSpacing: adulto ? 0.3 : 0.5 },
    logoWrap: { flexDirection: 'row', alignItems: 'center', gap: normalize(8) },
    logoTexto: { fontSize: normalize(20), fontFamily: F.display, color: '#FFFFFF', letterSpacing: adulto ? 1 : 0.5 },

    // Idem — o fundo vem do <PainelVidro> em TopBar.js's BotaoVoltar.
    botaoVoltar: { paddingVertical: normalize(16), alignItems: 'center', borderTopLeftRadius: rTopBar, borderTopRightRadius: rTopBar },
    botaoVoltarTxt: { color: adulto ? '#FFFFFF' : C.texto, fontFamily: F.bodyBold, fontSize: normalize(14), letterSpacing: adulto ? 0.5 : 0.3 },

    label: { fontSize: normalize(11), fontFamily: F.bodyBold, color: C.subtexto, marginBottom: normalize(8), marginTop: normalize(5), letterSpacing: adulto ? 0.6 : 0.2, textTransform: adulto ? 'uppercase' : 'none' },
    input: {
      borderRadius: rInput, paddingHorizontal: normalize(18), paddingVertical: normalize(14), fontSize: normalize(15),
      backgroundColor: adulto ? C.branco : C.cinza, marginBottom: normalize(6), color: C.texto, fontFamily: F.body,
      borderWidth: adulto ? 1.5 : 0, borderColor: borda,
    },
    inputErro: { borderColor: C.erro, borderWidth: 1.5 },
    erroTexto: { color: C.erro, fontSize: normalize(12), fontFamily: F.bodyBold, marginBottom: normalize(12), marginTop: -normalize(2) },

    botaoPrimario: {
      backgroundColor: C.secundaria, borderRadius: rBotao, paddingVertical: adulto ? normalize(16) : normalize(18),
      alignItems: 'center', marginTop: normalize(10),
      ...sombraSuave(C.secundaria, adulto ? 1 : 1.3),
    },
    botaoPrimarioTxt: { fontSize: normalize(16), fontFamily: adulto ? F.bodyBold : F.displaySemi, color: '#FFFFFF', letterSpacing: adulto ? 0.3 : 0.4 },
    botaoSecundario: { backgroundColor: adulto ? C.branco : C.cinza, borderRadius: rBotao, paddingVertical: normalize(13), alignItems: 'center', borderWidth: adulto ? 1.5 : 2, borderColor: adulto ? borda : C.cinzaMedio },
    botaoSecundarioTxt: { fontSize: normalize(14), fontFamily: F.bodyBold, color: C.texto },
    botaoPerigo: { backgroundColor: adulto ? C.branco : C.erro, borderRadius: rBotao, paddingVertical: normalize(13), alignItems: 'center', borderWidth: adulto ? 1.5 : 0, borderColor: C.erro },
    botaoPerigoTxt: { fontSize: normalize(14), fontFamily: F.bodyBold, color: adulto ? C.erro : '#FFF' },

    // No Modo Criança (sem alto contraste), os cards viram vidro de verdade —
    // translúcidos com borda clara — pra deixar o gradiente de fundo aparecer
    // por trás. No modo Responsável e no alto contraste, continuam opacos
    // (legibilidade de dado/formulário vem antes de efeito visual).
    card: {
      backgroundColor: vidroCriancaAtivo ? V.overlayCard : C.branco,
      borderRadius: rCard, padding: normalize(17), marginBottom: normalize(12),
      borderWidth: adulto ? 0 : (vidroCriancaAtivo ? 1 : 0),
      borderColor: vidroCriancaAtivo ? V.bordaCard : borda,
      ...(adulto ? sombraSuave(C.primaria, 0.7) : { elevation: vidroCriancaAtivo ? 0 : 2 }),
    },
    cardRow: {
      backgroundColor: vidroCriancaAtivo ? V.overlayCard : C.branco,
      borderRadius: rCard, padding: normalize(17), marginBottom: normalize(12),
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      borderWidth: adulto ? 0 : (vidroCriancaAtivo ? 1 : 0),
      borderColor: vidroCriancaAtivo ? V.bordaCard : borda,
      ...(adulto ? sombraSuave(C.primaria, 0.7) : { elevation: vidroCriancaAtivo ? 0 : 2 }),
    },
    // Cartão com faixa de cor à esquerda — o elemento de assinatura visual do modo Responsável
    cardFaixa: { borderLeftWidth: adulto ? normalize(4) : 0, borderLeftColor: C.secundaria },
    cardTitulo: { fontSize: normalize(15), fontFamily: adulto ? F.bodyBold : F.displaySemi, color: C.texto },
    cardSubtitulo: { fontSize: normalize(12.5), fontFamily: F.body, color: C.subtexto, marginTop: 2 },

    // "Eyebrow": rótulo pequeno, maiúsculo, com a cor de destaque — usado
    // acima de títulos de seção para marcar hierarquia (mesmo padrão nos
    // dois modos, para dar consistência estrutural ao app inteiro).
    secaoTitulo: { fontSize: normalize(12), fontFamily: F.bodyBold, color: adulto ? C.secundaria : C.subtexto, textTransform: 'uppercase', letterSpacing: adulto ? 0.8 : 0.4, marginBottom: normalize(10), marginTop: normalize(18), marginLeft: normalize(2) },

    chip: { paddingVertical: normalize(8), paddingHorizontal: normalize(14), borderRadius: rChip, backgroundColor: vidroCriancaAtivo ? V.overlayCard : (adulto ? C.branco : C.cinza), borderWidth: adulto ? 1.5 : 2, borderColor: vidroCriancaAtivo ? V.bordaCard : (adulto ? borda : 'transparent'), marginRight: normalize(8), marginBottom: normalize(8) },
    chipAtivo: { backgroundColor: C.primaria, borderColor: C.secundaria, ...(adulto ? sombraSuave(C.primaria, 0.5) : null) },
    chipTxt: { fontFamily: F.bodyBold, color: C.subtexto, fontSize: normalize(12.5) },
    chipTxtAtivo: { color: adulto ? '#FFFFFF' : C.texto },

    switchFake: { width: normalize(50), height: normalize(28), borderRadius: normalize(14), backgroundColor: C.cinzaMedio, padding: 3, justifyContent: 'center' },
    switchOn: { backgroundColor: C.sucesso },
    switchHandle: { width: normalize(22), height: normalize(22), borderRadius: normalize(11), backgroundColor: '#FFF', ...sombraSuave('#000', 0.4) },
    switchHandleOn: { alignSelf: 'flex-end' },

    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: normalize(14), justifyContent: 'space-between' },
    gridCard: {
      width: '30%', borderRadius: rCard, paddingVertical: normalize(18), alignItems: 'center', gap: normalize(8),
      borderWidth: adulto ? 0 : (vidroCriancaAtivo ? 1 : 0),
      borderColor: vidroCriancaAtivo ? V.bordaCard : borda,
      ...(adulto ? sombraSuave(C.primaria, 0.7) : { elevation: vidroCriancaAtivo ? 0 : 3 }),
    },
    gridCardTxt: { fontSize: normalize(11.5), fontFamily: adulto ? F.bodyBold : F.displaySemi, color: C.texto, textAlign: 'center' },
    cardInvisivel: { opacity: 0.4, backgroundColor: '#CCC' },

    vazio: { textAlign: 'center', marginTop: normalize(50), color: C.subtexto, fontSize: normalize(15), fontFamily: F.body, lineHeight: normalize(22) },

    fab: {
      position: 'absolute', right: normalize(20), bottom: normalize(20), width: normalize(56), height: normalize(56),
      borderRadius: adulto ? normalize(18) : normalize(28), backgroundColor: C.secundaria, alignItems: 'center', justifyContent: 'center',
      ...sombraSuave(C.secundaria, adulto ? 1.4 : 1.8),
    },
    fabTxt: { fontSize: normalize(26), color: '#FFF', fontFamily: F.displaySemi, marginTop: -2 },

    modalFundo: { flex: 1, backgroundColor: 'rgba(15,23,32,0.55)', justifyContent: 'center', alignItems: 'center', padding: normalize(24) },
    // O card do modal também vira vidro no Modo Criança (sem alto contraste);
    // formulários do modo Responsável continuam com fundo sólido — texto de
    // input translúcido demais prejudica a leitura durante o preenchimento.
    modalCard: {
      backgroundColor: vidroCriancaAtivo ? V.overlayCard : C.branco,
      borderRadius: adulto ? normalize(16) : normalize(24), padding: normalize(24), width: '100%',
      borderWidth: vidroCriancaAtivo ? 1 : 0, borderColor: vidroCriancaAtivo ? V.bordaCard : 'transparent',
    },
    modalTitulo: { fontSize: normalize(17), fontFamily: F.display, color: C.texto, marginBottom: normalize(14) },

    barraLinha: { flexDirection: 'row', alignItems: 'center', marginBottom: normalize(10) },
    barraFundo: { flex: 1, height: normalize(14), backgroundColor: C.cinza, borderRadius: normalize(7), overflow: 'hidden', marginHorizontal: normalize(8) },
    barraPreenchida: { height: '100%', borderRadius: normalize(7), backgroundColor: C.secundaria },
    barraTexto: { fontFamily: F.bodyBold, color: C.texto, fontSize: normalize(13) },

    bannerErro: { backgroundColor: '#FDECEC', borderWidth: 1, borderColor: C.erro, borderRadius: normalize(12), padding: normalize(14), marginBottom: normalize(16), flexDirection: 'row', alignItems: 'flex-start' },
    bannerErroTxt: { color: '#9B2C2C', fontFamily: F.bodyBold, fontSize: normalize(13), flex: 1 },

    // Título grande de tela (saudação, cabeçalho de painel, headers do
    // Modo Criança) — usa sempre a face de display da variante ativa.
    tituloGrande: { fontFamily: F.display, color: C.texto, fontSize: normalize(adulto ? 19 : 24) },
    numeroDestaque: { fontFamily: F.display, color: C.texto },
    eyebrow: { fontFamily: F.bodyBold, color: C.subtexto, fontSize: normalize(11), textTransform: 'uppercase', letterSpacing: 0.6 },
  });
}
