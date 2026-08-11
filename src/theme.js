import { Dimensions, Platform, PixelRatio } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
// No app nativo, a "window" é a tela do celular (até ~430px). No navegador
// (Expo Web), a "window" é a largura da JANELA DO DESKTOP — que pode passar
// de 1200px. Usar esse valor direto pra escalar fazia todo texto, ícone e
// espaçamento ficar gigante e desproporcional (o app parecia "avançado"/
// zoomado demais para frente). Limitamos a largura de referência à faixa de
// um celular/tablet retrato, então a escala nunca passa da de um tablet
// grande, não importa quão larga seja a janela do navegador.
const LARGURA_BASE = 375;
const LARGURA_REFERENCIA = Math.min(Math.max(SCREEN_WIDTH, 320), 480);
const scale = LARGURA_REFERENCIA / LARGURA_BASE;

export function normalize(size) {
  const newSize = size * scale;
  if (Platform.OS === 'ios') {
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  }
  return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 2;
}

// ─────────────────────────────────────────────────────────────
// Paleta do Modo Criança — âncora coral (calor, energia, feito
// pra ser sentido antes de ser lido), com creme quente no fundo
// em vez do branco/azul-pastel genérico de app infantil de estoque.
// ─────────────────────────────────────────────────────────────
export const THEMES = {
  light: {
    fundo: '#FFF8F0', primaria: '#F97968', secundaria: '#2EC4B6', destaque: '#FFB627',
    sucesso: '#3DAA6D', erro: '#F25C54', alerta: '#FFC145', roxoSuave: '#8E7DBE',
    texto: '#3A3335', subtexto: '#8D8188', branco: '#FFFFFF', cinza: '#FBF1E7', cinzaMedio: '#F0E0D2',
  },
  dark: {
    fundo: '#211A18', primaria: '#F97968', secundaria: '#2EC4B6', destaque: '#FFB627',
    sucesso: '#3DAA6D', erro: '#F2776E', alerta: '#FFC145', roxoSuave: '#A996E0',
    texto: '#F5EDE8', subtexto: '#C9B8B2', branco: '#2E2523', cinza: '#2A211E', cinzaMedio: '#3B302C',
  },
  // Tema de alto contraste, usado no modo Criança quando a opção está ativa
  altoContraste: {
    fundo: '#000000', primaria: '#FFFF00', secundaria: '#00FFFF', destaque: '#FF00FF',
    sucesso: '#00FF00', erro: '#FF0000', alerta: '#FFFF00', roxoSuave: '#FF00FF',
    texto: '#FFFFFF', subtexto: '#FFFF00', branco: '#000000', cinza: '#111111', cinzaMedio: '#333333',
  },
};

export function corTema(crianca) {
  // Alto contraste sempre usa a referência exata de THEMES.altoContraste
  // (corContraste() abaixo compara por identidade de objeto) — nunca criar
  // uma cópia aqui, ou aquele modo de acessibilidade quebra.
  if (crianca?.alto_contraste) return THEMES.altoContraste;
  const base = crianca?.tema === 'escuro' ? THEMES.dark : THEMES.light;
  // O responsável pode escolher qualquer cor (hex) em Ajustes > Cores do
  // Modo Criança. Quando definidas, elas substituem só a cor principal e a
  // de destaque do tema escolhido — o resto da paleta (fundo, texto, etc.)
  // continua vindo do claro/escuro para manter contraste e legibilidade.
  if (!crianca?.cor_primaria && !crianca?.cor_destaque) return base;
  return {
    ...base,
    primaria: crianca.cor_primaria || base.primaria,
    destaque: crianca.cor_destaque || base.destaque,
  };
}

// Paleta sugerida para o seletor de cor do responsável (mesmo espírito da
// paleta lúdica padrão, mas fica livre pra escolher qualquer hex também).
export const CORES_TEMA_CRIANCA = ['#F97968', '#2EC4B6', '#FFB627', '#8E7DBE', '#3DAA6D', '#4A90D9', '#E85D75', '#F2994A'];

// ─────────────────────────────────────────────────────────────
// Paleta do modo Responsável — deliberadamente separada da paleta
// lúdica do modo Criança. Inspirada em dashboards de monitoramento
// (tons "ink teal" / ardósia, superfícies neutras, um único accent),
// não nas cores-doces usadas nas telas da criança.
// ─────────────────────────────────────────────────────────────
export const TEMA_RESPONSAVEL = {
  fundo: '#F5F7FA',        // superfície neutra fria, não o branco clínico puro
  primaria: '#0F3049',     // "ink teal" — cabeçalhos, marca
  secundaria: '#12897B',   // accent único (ações, links, estado ativo)
  destaque: '#12897B',
  sucesso: '#2F9E68',
  erro: '#D64545',
  alerta: '#C98A1B',
  roxoSuave: '#5B6B8C',
  texto: '#1C2733',        // tinta quase-preta, não #000
  subtexto: '#64748B',     // slate
  branco: '#FFFFFF',
  cinza: '#EEF1F6',
  cinzaMedio: '#DCE1EA',
  borda: '#E2E6EE',
};

export const RESPONSAVEL_RADIUS = { card: 14, botao: 12, chip: 10, input: 12 };

// ─────────────────────────────────────────────────────────────
// Glassmorphism — tons e gradientes usados atrás/dentro dos painéis
// de vidro (BlurView real na estrutura fixa da tela — topo, rodapé,
// modal, menu principal; "vidro barato" simulado — fundo
// semi-transparente + borda clara — nas grades/listas com muitos
// itens repetidos, pra não empilhar blur de verdade em dezenas de
// cards ao mesmo tempo e pesar no Android).
// ─────────────────────────────────────────────────────────────
export const VIDRO = {
  crianca: {
    gradiente: ['#FFC9BC', '#FFE8D6', '#FFF8F0'],
    tintBlur: 'light',
    intensidadeChrome: 55,
    overlayChrome: 'rgba(255,255,255,0.28)',
    overlayCard: 'rgba(255,255,255,0.55)',
    bordaCard: 'rgba(255,255,255,0.6)',
  },
  // Usada quando a criança está no tema escuro — gradiente e vidro escuros,
  // pra não misturar "cartão claro flutuando" com fundo escuro (ficaria
  // com cara de erro visual, não de escolha de design).
  criancaEscuro: {
    gradiente: ['#2E1F1B', '#241A17', '#170F0D'],
    tintBlur: 'dark',
    intensidadeChrome: 55,
    overlayChrome: 'rgba(0,0,0,0.32)',
    overlayCard: 'rgba(0,0,0,0.34)',
    bordaCard: 'rgba(255,255,255,0.14)',
  },
  adulto: {
    gradiente: ['#0F3049', '#15425F', '#1B5470'],
    tintBlur: 'dark',
    intensidadeChrome: 40,
    overlayChrome: 'rgba(15,48,73,0.35)',
    overlayCard: 'rgba(255,255,255,0.06)',
    bordaCard: 'rgba(255,255,255,0.14)',
  },
};

export function vidroFor(variante, escuro = false) {
  if (variante === 'adulto') return VIDRO.adulto;
  return escuro ? VIDRO.criancaEscuro : VIDRO.crianca;
}

// Cor de texto segura para escrever EM CIMA de uma cor de destaque (não do
// fundo neutro). Nos temas normais, primaria/destaque/sucesso/alerta são
// escuros/saturados o bastante pra texto branco funcionar. No alto
// contraste, essas mesmas cores são quase no limite da luminância (amarelo,
// magenta, verde puro) — texto branco em cima delas fica ilegível, o oposto
// do que o modo promete. `corContraste` devolve preto nesse caso específico,
// branco nos demais.
export function corContraste(C) {
  return C === THEMES.altoContraste ? '#000000' : '#FFFFFF';
}

// ─────────────────────────────────────────────────────────────
// Sistema tipográfico — dois pares de fonte deliberadamente
// diferentes, com um fio condutor entre eles: "Lexend" é usada nas
// duas pontas porque foi desenhada a partir de pesquisa sobre
// proficiência de leitura (reduz esforço visual, ajuda leitores em
// desenvolvimento ou com dislexia). No Modo Criança ela cuida
// exatamente do trabalho que faz sentido pra ela — o texto sob cada
// pictograma, o que a criança precisa de fato ler. No modo
// Responsável ela sobe para os títulos, como um lembrete tipográfico
// discreto de que o app inteiro é construído em cima de acessibilidade.
//   Criança:     Baloo 2 (tituloos/headers)  + Lexend (labels/leitura)
//   Responsável: Lexend (headers)             + Plus Jakarta Sans (corpo/dados)
// ─────────────────────────────────────────────────────────────
export const FONTES = {
  adulto: {
    display: 'Lexend_700Bold',
    displaySemi: 'Lexend_600SemiBold',
    body: 'PlusJakartaSans_400Regular',
    bodyMedium: 'PlusJakartaSans_500Medium',
    bodySemi: 'PlusJakartaSans_600SemiBold',
    bodyBold: 'PlusJakartaSans_700Bold',
  },
  crianca: {
    display: 'Baloo2_800ExtraBold',
    displaySemi: 'Baloo2_700Bold',
    body: 'Lexend_500Medium',
    bodyMedium: 'Lexend_500Medium',
    bodySemi: 'Lexend_600SemiBold',
    bodyBold: 'Lexend_700Bold',
  },
};

export function fontesFor(variante) {
  return variante === 'adulto' ? FONTES.adulto : FONTES.crianca;
}

// Mapa de fontes a carregar no App.js via expo-font / @expo-google-fonts.
export const FONTES_PARA_CARREGAR = {
  baloo2: ['Baloo2_600SemiBold', 'Baloo2_700Bold', 'Baloo2_800ExtraBold'],
  lexend: ['Lexend_400Regular', 'Lexend_500Medium', 'Lexend_600SemiBold', 'Lexend_700Bold'],
  jakarta: ['PlusJakartaSans_400Regular', 'PlusJakartaSans_500Medium', 'PlusJakartaSans_600SemiBold', 'PlusJakartaSans_700Bold'],
};

export const DIAS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

export const DIAS_ABREV = { Segunda: 'SEG', Terça: 'TER', Quarta: 'QUA', Quinta: 'QUI', Sexta: 'SEX', Sábado: 'SÁB', Domingo: 'DOM' };

// Emojis de humor usados no registro de humor do modo Criança e nos gráficos
export const HUMORES = [
  { chave: 'feliz', emoji: '😊', label: 'Feliz' },
  { chave: 'triste', emoji: '😢', label: 'Triste' },
  { chave: 'bravo', emoji: '😡', label: 'Bravo' },
  { chave: 'cansado', emoji: '😫', label: 'Cansado' },
  { chave: 'animado', emoji: '🤩', label: 'Animado' },
  { chave: 'calmo', emoji: '🙂', label: 'Calmo' },
];

export const EMOJIS_CATEGORIA = ['🍎', '❓', '🏃', '😊', '👋', '❌', '✅', '🏠', '🎮', '📋', '🎨', '🎵', '📚', '🧩', '🐾'];
export const CORES_CATEGORIA = ['#FFADAD', '#BDE0FE', '#C1E1C1', '#FDFFB6', '#FFC8DD', '#FFB7B2', '#B9FBC0', '#A2D2FF', '#CDB4DB'];
