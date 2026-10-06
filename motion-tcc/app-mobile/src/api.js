import axios from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import {
  offlineChildren, offlineCreateChild, offlineUpdateChild, offlineDeleteChild,
  offlineListCategories, offlineCreateCategory, offlineUpdateCategory, offlineDeleteCategory,
  offlineListFalas, offlineCreateFala, offlineUpdateFala, offlineDeleteFala,
  offlineList, offlineAdd, offlineUpdate, offlineDelete, offlineAddHistory, offlineAddMood,
  offlineSummary, offlineListAvisos, offlineMarkAviso, offlineUpdateAviso, openOfflineStore, offlineEnsurePairedChild, offlineConcluirRotina, offlineListRotinas, offlineListHardware, offlineSaveHardware, offlineUploadImagem,
} from './offlineStore';

// Configure a URL da API por EXPO_PUBLIC_API_URL / APP_API_BASE_URL.
// O backend agora é um único arquivo (api.php), roteado por ?rota=nome —
// não existem mais os arquivos separados (login.php, criancas.php...).
// Sem URL configurada, use o modo local protegido do aplicativo.
const API_BASE_URL_CONFIG = Constants.expoConfig?.extra?.API_BASE_URL;
export const API_URL = typeof API_BASE_URL_CONFIG === 'string' && API_BASE_URL_CONFIG.trim()
  ? API_BASE_URL_CONFIG.trim()
  : '';

const api = axios.create({ baseURL: API_URL, timeout: 15000 });

function formularioAuth(campos) {
  return Object.entries(campos)
    .map(([chave, valor]) => `${encodeURIComponent(chave)}=${encodeURIComponent(valor ?? '')}`)
    .join('&');
}

async function requisicaoAuthNativa(rota, campos) {
  const url = `${API_URL.replace(/\/$/, '')}?rota=${encodeURIComponent(rota)}`;
  let resposta;
  try {
    resposta = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formularioAuth(campos),
    });
  } catch (erro) {
    const detalhe = new Error(`Falha de rede ao acessar ${url}: ${erro?.message || 'Network request failed'}`);
    detalhe.code = 'AUTH_NETWORK_ERROR';
    detalhe.mensagemAmigavel = detalhe.message;
    throw detalhe;
  }

  const texto = await resposta.text();
  let dados;
  try {
    dados = JSON.parse(texto);
  } catch {
    const detalhe = new Error(`Servidor respondeu HTTP ${resposta.status}, mas não enviou JSON: ${texto.slice(0, 180) || '(resposta vazia)'}`);
    detalhe.code = 'AUTH_INVALID_RESPONSE';
    detalhe.response = { status: resposta.status, data: texto };
    detalhe.mensagemAmigavel = detalhe.message;
    throw detalhe;
  }

  if (!resposta.ok || dados?.success === false) {
    const detalhe = new Error(dados?.message || `Servidor respondeu HTTP ${resposta.status}`);
    detalhe.code = 'AUTH_API_ERROR';
    detalhe.response = { status: resposta.status, data: dados };
    detalhe.mensagemAmigavel = detalhe.message;
    throw detalhe;
  }

  return { data: dados, status: resposta.status };
}

// Token de sessão do responsável autenticado (setado pelo AppContext ao logar
// ou restaurar a sessão salva). Fica só em memória aqui — quem persiste entre
// aberturas do app é o AppContext, via AsyncStorage.
//
// IMPORTANTE: o backend (exigirSessao() no api.php) só lê o token do corpo
// JSON ($data['token']) ou da query string ($_GET['token']) — ele NÃO lê
// cabeçalho Authorization. Por isso o interceptor injeta o token nos
// params/body de cada chamada, e não num header.
let sessionToken = null;
let offlineMode = false;
export function setAuthToken(token) { sessionToken = token; }
export function getAuthToken() { return sessionToken; }
export function setOfflineMode(enabled) { offlineMode = !!enabled; }
export function isOfflineMode() { return offlineMode; }

api.interceptors.request.use((config) => {
  if (!sessionToken) return config;
  const metodo = (config.method || '').toLowerCase();
  if (metodo === 'get') {
    config.params = { ...(config.params || {}), token: sessionToken };
  } else if (config.data instanceof FormData) {
    config.data.append('token', sessionToken);
  } else {
    config.data = { ...(config.data || {}), token: sessionToken };
  }
  return config;
});

// ── Tratamento amigável de erros ──────────────────────────────
// O backend responde com { message, error, detail } em 4xx/5xx. Este
// interceptor de resposta garante que o motivo do erro chegue às telas
// de forma legível — por exemplo, rede offline ou CORS bloqueando gera
// "Request failed..." genérico sem isso, que não ajuda o utilizador.
const MSG_REDE = 'Sem conexão com o servidor. Verifique a rede da faculdade e tente novamente.';
const MSG_TEMPO = 'O servidor demorou demais para responder. Tente novamente.';

api.interceptors.response.use(
  (res) => {
    // O backend pode responder HTTP 200 com { success: false }. Transformar
    // isso em rejeição garante que cada tela passe pelo mesmo catch e mostre
    // uma mensagem ao usuário, sem ações que parecem ter funcionado.
    if (res?.data && res.data.success === false) {
      const err = new Error(res.data.message || res.data.error || 'Não foi possível concluir a operação.');
      err.response = res;
      err.code = 'API_ERROR';
      err.mensagemAmigavel = mensagemErro(err);
      return Promise.reject(err);
    }
    return res;
  },
  (err) => {
    if (!err.response) {
      // Se a chamada veio de um dispositivo pareado, a próxima tentativa
      // pode usar o banco local completo em vez de repetir a falha de rede.
      const cfg = err.config || {};
      const campos = { ...(cfg.params || {}), ...(cfg.data && typeof cfg.data === 'object' && !(cfg.data instanceof FormData) ? cfg.data : {}) };
      if (campos.device_secret) offlineMode = true;
      // Rede offline, CORS bloqueando ou servidor fora do ar
      const detalhe = err.code === 'ECONNABORTED'
        ? MSG_TEMPO
        : `${MSG_REDE} (${err.message || 'erro de rede'} — ${API_URL})`;
      err.mensagemAmigavel = detalhe;
    } else if (err.code === 'ECONNABORTED' || err.response?.status === 504) {
      err.mensagemAmigavel = MSG_TEMPO;
    } else {
      err.mensagemAmigavel = mensagemErro(err);
    }
    return Promise.reject(err);
  },
);

// Toda rota do backend vive em api.php, escolhida via ?rota=nome na query
// string — mesmo em POST/PUT/DELETE, onde o resto dos dados vai no body.
function comRota(rota, params = {}) {
  return { ...params, rota };
}

// O backend aceita sessão do responsável ou device_secret do dispositivo
// pareado. O auth é sempre colocado no mesmo local dos dados da requisição:
// query string para GET e corpo para POST/PUT/DELETE.
function camposAuth(auth = {}) {
  const campos = {};
  if (auth?.token) campos.token = auth.token;
  if (auth?.device_secret) campos.device_secret = auth.device_secret;
  return campos;
}

// Extrai mensagem de erro de forma confiável
export function mensagemErro(err, padrao = 'Não foi possível conectar ao servidor') {
  const data = err?.response?.data;
  if (data) {
    return data.message || data.error || data.detail || padrao;
  }
  return err?.message || padrao;
}

// Retorna a mensagem amigável (definida pelo interceptor) ou, na falta
// dela, a mensagem extraída do corpo da resposta. Uso nas telas:
//   catch (e) => Alert.alert('Erro', mensagemAmigavel(e))
export function mensagemAmigavel(err, padrao) {
  return err?.mensagemAmigavel || mensagemErro(err, padrao);
}

// ── Autenticação ──────────────────────────────────────────────
export const Auth = {
  // URL-encoded é lido diretamente por $_POST no PHP e evita problemas de
  // multipart boundary ou POST JSON em hospedagens compartilhadas.
  login: (email, senha) => requisicaoAuthNativa('login', { email, senha }),
  cadastrar: (nome, email, senha, nome_dependente) =>
    requisicaoAuthNativa('cadastrar', { nome, email, senha, nome_dependente }),
  logout: () => offlineMode ? Promise.resolve({ data: { success: true } }) : api.post('', {}, { params: comRota('logout') }),
};

// ── Crianças (perfis) ──────────────────────────────────────
export const Criancas = {
  listar: () => offlineMode ? offlineChildren().then((criancas) => ({ data: { success: true, criancas } })) : api.get('', { params: comRota('criancas') }),
  detalhar: (id_crianca) => offlineMode ? offlineChildren().then((cs) => ({ data: { success: true, crianca: cs.find((c) => c.id_crianca === Number(id_crianca)) } })) : api.get('', { params: comRota('criancas', { id_crianca }) }),
  criar: (usuario_id, nome, avatar_emoji) =>
    offlineMode ? offlineCreateChild(nome, avatar_emoji).then((child) => ({ data: { success: true, id_crianca: child.id_crianca } })) : api.post('', { usuario_id, nome, avatar_emoji }, { params: comRota('criancas') }),
  atualizar: (payload) => offlineMode ? offlineUpdateChild(payload).then(() => ({ data: { success: true } })) : api.put('', payload, { params: comRota('criancas') }),
  remover: (id_crianca, usuario_id) =>
    offlineMode ? offlineDeleteChild(id_crianca).then(() => ({ data: { success: true } })) : api.delete('', { data: { id_crianca, usuario_id }, params: comRota('criancas') }),
};

// ── Pareamento (modo Criança) ────────────────────────────────
export const Pareamento = {
  codigoAtivo: (crianca_id, usuario_id) =>
    api.get('', { params: comRota('pareamento', { crianca_id, usuario_id }) }),
  gerar: (crianca_id, usuario_id) =>
    api.post('', { acao: 'gerar', crianca_id, usuario_id }, { params: comRota('pareamento') }),
  validar: (codigo) => api.post('', { acao: 'validar', codigo }, { params: comRota('pareamento') }),
  verificarDispositivo: (device_secret) =>
    api.post('', { acao: 'verificar_dispositivo', device_secret }, { params: comRota('pareamento') }),
};

// ── Categorias ──────────────────────────────────────────────
export const Categorias = {
  listar: (crianca_id, auth = {}) => offlineMode ? offlineListCategories(crianca_id).then((categorias) => ({ data: { success: true, categorias } })) : api.get('', { params: comRota('categorias', { crianca_id, ...camposAuth(auth) }) }),
  criar: (payload) => offlineMode ? offlineCreateCategory(payload).then((id_categoria) => ({ data: { success: true, id_categoria } })) : api.post('', payload, { params: comRota('categorias') }),
  atualizar: (payload) => offlineMode ? offlineUpdateCategory(payload).then(() => ({ data: { success: true } })) : api.put('', payload, { params: comRota('categorias') }),
  remover: (id_categoria, usuario_id) =>
    offlineMode ? offlineDeleteCategory(id_categoria).then(() => ({ data: { success: true } })) : api.delete('', { data: { id_categoria, usuario_id }, params: comRota('categorias') }),
};

// ── Pictogramas (falas) ─────────────────────────────────────
export const Pictogramas = {
  listar: (id_categoria, auth = {}) => offlineMode ? offlineListFalas(id_categoria).then((falas) => ({ data: { success: true, falas } })) : api.get('', { params: comRota('falas', { id_categoria, ...camposAuth(auth) }) }),
  criar: (payload) => offlineMode ? offlineCreateFala(payload).then((id_fala) => ({ data: { success: true, id_fala } })) : api.post('', payload, { params: comRota('falas') }),
  atualizar: (payload) => offlineMode ? offlineUpdateFala(payload).then(() => ({ data: { success: true } })) : api.put('', payload, { params: comRota('falas') }),
  remover: (id_fala, usuario_id) =>
    offlineMode ? offlineDeleteFala(id_fala).then(() => ({ data: { success: true } })) : api.delete('', { data: { id_fala, usuario_id }, params: comRota('falas') }),
};

// ── Histórico de fala ──────────────────────────────────────
export const Historico = {
  listar: (crianca_id, limite, auth = {}) =>
    offlineMode ? offlineList('historico', crianca_id).then((historico) => ({ data: { success: true, historico: historico.slice(-(limite || 30)).reverse() } })) : api.get('', { params: comRota('historico', { crianca_id, limite, ...camposAuth(auth) }) }),
  registrar: (payload, auth = {}) => offlineMode ? offlineAddHistory(payload).then(() => ({ data: { success: true } })) : api.post('', { ...payload, ...camposAuth(auth) }, { params: comRota('historico') }),
  limpar: (crianca_id, usuario_id) =>
    offlineMode ? offlineList('historico', crianca_id).then(async (items) => { for (const item of items) await offlineDelete('historico', 'id_historico', item.id_historico); return { data: { success: true } }; }) : api.delete('', { data: { crianca_id, usuario_id }, params: comRota('historico') }),
};

// ── Frases salvas (favoritos) ───────────────────────────────
export const Frases = {
  listar: (crianca_id, auth = {}) => offlineMode ? offlineList('frases', crianca_id).then((frases) => ({ data: { success: true, frases } })) : api.get('', { params: comRota('frases', { crianca_id, ...camposAuth(auth) }) }),
  salvar: (payload, auth = {}) => offlineMode ? offlineAdd('frases', { ...payload, id_frase: 0 }, 'nextPhrase').then((id_frase) => ({ data: { success: true, id_frase } })) : api.post('', { ...payload, ...camposAuth(auth) }, { params: comRota('frases') }),
  remover: (id_frase, auth) =>
    offlineMode ? offlineDelete('frases', 'id_frase', id_frase).then(() => ({ data: { success: true } })) : api.delete('', { data: { id_frase, ...auth }, params: comRota('frases') }),
};

// ── Rotinas ──────────────────────────────────────────────────
export const Rotinas = {
  listar: (crianca_id, dia_semana, auth = {}) =>
    offlineMode ? offlineListRotinas(crianca_id, dia_semana).then((rotinas) => ({ data: { success: true, rotinas } })) : api.get('', { params: comRota('rotinas', { crianca_id, dia_semana, ...camposAuth(auth) }) }),
  criar: (payload) => offlineMode ? offlineAdd('rotinas', { ...payload, id_rotina: 0 }, 'nextRoutine').then((id_rotina) => ({ data: { success: true, id_rotina } })) : api.post('', payload, { params: comRota('rotinas') }),
  concluir: (id_rotina, data, auth = {}) =>
    offlineMode ? offlineConcluirRotina(id_rotina, data).then(() => ({ data: { success: true } })) : api.post('', { acao: 'concluir', id_rotina, data, ...camposAuth(auth) }, { params: comRota('rotinas') }),
  atualizar: (payload) => offlineMode ? offlineUpdate('rotinas', 'id_rotina', payload).then(() => ({ data: { success: true } })) : api.put('', payload, { params: comRota('rotinas') }),
  remover: (id_rotina, usuario_id) =>
    offlineMode ? offlineDelete('rotinas', 'id_rotina', id_rotina).then(() => ({ data: { success: true } })) : api.delete('', { data: { id_rotina, usuario_id }, params: comRota('rotinas') }),
};

// ── Lembretes ────────────────────────────────────────────────
export const Avisos = {
  listar: (crianca_id, auth = {}) => offlineMode ? offlineListAvisos(crianca_id).then((avisos) => ({ data: { success: true, avisos } })) : api.get('', { params: comRota('avisos', { crianca_id, ...camposAuth(auth) }) }),
  criar: (payload, auth = {}) => offlineMode ? offlineAdd('avisos', { ...payload, id_aviso: 0, lido: false, criado_em: new Date().toISOString() }, 'nextAviso').then((id_aviso) => ({ data: { success: true, id_aviso, offline: true } })) : api.post('', { ...payload, ...camposAuth(auth) }, { params: comRota('avisos') }),
  marcarLido: (id_aviso, lido = true, auth = {}) => offlineMode ? offlineMarkAviso(id_aviso, lido).then(() => ({ data: { success: true } })) : api.put('', { id_aviso, lido, ...camposAuth(auth) }, { params: comRota('avisos') }),
  atualizar: (payload, auth = {}) => offlineMode ? offlineUpdateAviso(payload).then(() => ({ data: { success: true } })) : api.put('', { ...payload, ...camposAuth(auth) }, { params: comRota('avisos') }),
  remover: (id_aviso, auth = {}) => offlineMode ? offlineDelete('avisos', 'id_aviso', id_aviso).then(() => ({ data: { success: true } })) : api.delete('', { data: { id_aviso, ...camposAuth(auth) }, params: comRota('avisos') }),
};

export const Lembretes = {
  listar: (crianca_id, auth = {}) => offlineMode ? offlineList('lembretes', crianca_id).then((lembretes) => ({ data: { success: true, lembretes } })) : api.get('', { params: comRota('lembretes', { crianca_id, ...camposAuth(auth) }) }),
  criar: (payload, auth = {}) => offlineMode ? offlineAdd('lembretes', { ...payload, id_lembrete: 0, feito: false }, 'nextReminder').then((id_lembrete) => ({ data: { success: true, id_lembrete } })) : api.post('', { ...payload, ...camposAuth(auth) }, { params: comRota('lembretes') }),
  alternarFeito: (id_lembrete, feito, auth = {}) =>
    offlineMode ? offlineUpdate('lembretes', 'id_lembrete', { id_lembrete, feito }).then(() => ({ data: { success: true } })) : api.put('', { id_lembrete, feito, ...camposAuth(auth) }, { params: comRota('lembretes') }),
  remover: (id_lembrete, usuario_id, auth = {}) =>
    offlineMode ? offlineDelete('lembretes', 'id_lembrete', id_lembrete).then(() => ({ data: { success: true } })) : api.delete('', { data: { id_lembrete, usuario_id, ...camposAuth(auth) }, params: comRota('lembretes') }),
};

// ── Humor ──────────────────────────────────────────────────────
export const Mood = {
  listar: (crianca_id, dias, auth = {}) =>
    offlineMode ? offlineList('mood', crianca_id).then((humor) => ({ data: { success: true, humor } })) : api.get('', { params: comRota('mood', { crianca_id, dias, ...camposAuth(auth) }) }),
  registrar: (payload, auth = {}) => offlineMode ? offlineAddMood(payload).then(() => ({ data: { success: true } })) : api.post('', { ...payload, ...camposAuth(auth) }, { params: comRota('mood') }),
};

// ── Monitoramento (dashboard) ──────────────────────────────
export const Monitoramento = {
  resumo: (crianca_id, dias, auth = {}) =>
    offlineMode ? offlineSummary(crianca_id).then((data) => ({ data })) : api.get('', { params: comRota('monitoramento', { crianca_id, dias, ...camposAuth(auth) }) }),
};

// ── Botão físico (hardware arcade) ──────────────────────────
export const Hardware = {
  listarConfiguracoes: (auth = {}) => offlineMode ? offlineListHardware().then((botoes) => ({ data: { success: true, botoes } })) : api.get('', { params: comRota('listar_botoes', camposAuth(auth)) }),
  configurarBotao: (id_botao, nome_audio, descricao_audio = '', auth = {}) => {
    const formData = new FormData();
    formData.append('id_botao', id_botao);
    formData.append('nome_audio', nome_audio);
    formData.append('descricao_audio', descricao_audio);
    Object.entries(camposAuth(auth)).forEach(([chave, valor]) => formData.append(chave, valor));
    return offlineMode ? offlineSaveHardware(id_botao, nome_audio, descricao_audio).then(() => ({ data: { success: true, id_botao, offline: true } })) : api.post('', formData, { params: comRota('configurar_botao') });
  },
  // Requisição externa – não usa o token
  ativarSistema: () => {
    if (offlineMode) return Promise.resolve({ data: { success: true, offline: true, message: 'O modo de configuração local está disponível, mas não controla equipamento físico sem o servidor de hardware.' } });
    const configurado = Constants.expoConfig?.extra?.HARDWARE_BASE_URL;
    const base = typeof configurado === 'string' && configurado.trim() ? configurado.trim().replace(/\/$/, '') : '';
    if (!base) return Promise.reject(new Error('Configure APP_HARDWARE_BASE_URL para usar o botão físico.'));
    return axios.get(`${base}/executar_bat`);
  },
};

// ── Upload de imagem ──────────────────────────────────────────
export const Uploads = {
  enviarImagemPictograma: (localUri) => {
    if (offlineMode) return offlineUploadImagem(localUri).then((url) => ({ data: { success: true, url } }));
    const formData = new FormData();
    const nomeArquivo = localUri.split('/').pop() || 'pictograma.jpg';
    const extensao = (nomeArquivo.split('.').pop() || 'jpg').toLowerCase();
    formData.append('imagem', {
      uri: localUri,
      name: nomeArquivo,
      type: `image/${extensao === 'jpg' ? 'jpeg' : extensao}`,
    });
    return api.post('', formData, { params: comRota('upload_imagem') });
  },
};

export default api;
