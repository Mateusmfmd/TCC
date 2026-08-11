import axios from 'axios';

// ==============================================================
// CONFIGURAÇÃO BASE (substitua se mudar de servidor)
// ==============================================================
// Mude de http para https
const API_URL = "http://motion.infinityfree.io";
const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ==============================================================
// GERENCIAMENTO DO TOKEN (em memória)
// ==============================================================
let sessionToken = null;
export function setAuthToken(token) { sessionToken = token; }
export function getAuthToken() { return sessionToken; }

// ==============================================================
// INTERCEPTOR PARA INJETAR TOKEN EM TODAS AS REQUISIÇÕES
// ==============================================================
api.interceptors.request.use((config) => {
  if (!sessionToken) return config;

  // Se for GET, adiciona o token nos parâmetros da URL
  if (config.method === 'get') {
    config.params = { ...(config.params || {}), token: sessionToken };
  }
  // Se for FormData, adiciona como campo
  else if (config.data instanceof FormData) {
    config.data.append('token', sessionToken);
  }
  // Se for JSON, adiciona no corpo
  else {
    config.data = { ...(config.data || {}), token: sessionToken };
  }

  // Opcional: também pode enviar via cabeçalho Authorization
  // config.headers.Authorization = `Bearer ${sessionToken}`;

  return config;
});

// ==============================================================
// FUNÇÃO AUXILIAR PARA EXTRAIR MENSAGEM DE ERRO
// ==============================================================
export function mensagemErro(err, padrao = 'Não foi possível conectar ao servidor') {
  return err?.response?.data?.message || padrao;
}

// ==============================================================
// ROTAS DA API (CORRIGIDAS)
// ==============================================================

// ── Autenticação ────────────────────────────────────────────
export const Auth = {
  // Rota CORRETA: 'login' (estava 'gerargrafico')
  login: (email, senha) => api.post('api.php?rota=login', { email, senha }),

  // Rota CORRETA: 'cadastrar' (estava 'gerargrafico')
  cadastrar: (nome, email, senha, nome_dependente) =>
    api.post('api.php?rota=cadastrar', { nome, email, senha, nome_dependente }),

  logout: () => api.post('api.php?rota=logout', {}),
};

// ── Crianças ────────────────────────────────────────────────
export const Criancas = {
  listar: () => api.get('api.php?rota=criancas'),
  detalhar: (id_crianca) => api.get('api.php?rota=criancas', { params: { id_crianca } }),
  criar: (usuario_id, nome, avatar_emoji) =>
    api.post('api.php?rota=criancas', { usuario_id, nome, avatar_emoji }),
  atualizar: (payload) => api.put('api.php?rota=criancas', payload),
  remover: (id_crianca, usuario_id) =>
    api.delete('api.php?rota=criancas', { data: { id_crianca, usuario_id } }),
};

// ── Pareamento ──────────────────────────────────────────────
export const Pareamento = {
  codigoAtivo: (crianca_id, usuario_id) =>
    api.get('api.php?rota=pareamento', { params: { crianca_id, usuario_id } }),
  gerar: (crianca_id, usuario_id) =>
    api.post('api.php?rota=pareamento', { acao: 'gerar', crianca_id, usuario_id }),
  validar: (codigo) =>
    api.post('api.php?rota=pareamento', { acao: 'validar', codigo }),
  verificarDispositivo: (device_secret) =>
    api.post('api.php?rota=pareamento', { acao: 'verificar_dispositivo', device_secret }),
};

// ── Categorias ──────────────────────────────────────────────
export const Categorias = {
  listar: (crianca_id, auth) =>
    api.get('api.php?rota=categorias', { params: { crianca_id, ...auth } }),
  criar: (payload) => api.post('api.php?rota=categorias', payload),
  atualizar: (payload) => api.put('api.php?rota=categorias', payload),
  remover: (id_categoria, usuario_id) =>
    api.delete('api.php?rota=categorias', { data: { id_categoria, usuario_id } }),
};

// ── Pictogramas ─────────────────────────────────────────────
export const Pictogramas = {
  listar: (id_categoria, auth) =>
    api.get('api.php?rota=falas', { params: { id_categoria, ...auth } }),
  criar: (payload) => api.post('api.php?rota=falas', payload),
  atualizar: (payload) => api.put('api.php?rota=falas', payload),
  remover: (id_fala, usuario_id) =>
    api.delete('api.php?rota=falas', { data: { id_fala, usuario_id } }),
};

// ── Histórico ───────────────────────────────────────────────
export const Historico = {
  listar: (crianca_id, usuario_id, limite) =>
    api.get('api.php?rota=historico', { params: { crianca_id, usuario_id, limite } }),
  registrar: (payload) => api.post('api.php?rota=historico', payload),
  limpar: (crianca_id, usuario_id) =>
    api.delete('api.php?rota=historico', { data: { crianca_id, usuario_id } }),
};

// ── Frases salvas ───────────────────────────────────────────
export const Frases = {
  listar: (crianca_id, auth) =>
    api.get('api.php?rota=frases', { params: { crianca_id, ...auth } }),
  salvar: (payload) => api.post('api.php?rota=frases', payload),
  remover: (id_frase, auth) =>
    api.delete('api.php?rota=frases', { data: { id_frase, ...auth } }),
};

// ── Rotinas ─────────────────────────────────────────────────
export const Rotinas = {
  listar: (crianca_id, auth, dia_semana) =>
    api.get('api.php?rota=rotinas', { params: { crianca_id, ...auth, dia_semana } }),
  criar: (payload) => api.post('api.php?rota=rotinas', payload),
  concluir: (id_rotina, auth, data) =>
    api.post('api.php?rota=rotinas', { acao: 'concluir', id_rotina, ...auth, data }),
  atualizar: (payload) => api.put('api.php?rota=rotinas', payload),
  remover: (id_rotina, usuario_id) =>
    api.delete('api.php?rota=rotinas', { data: { id_rotina, usuario_id } }),
};

// ── Lembretes ───────────────────────────────────────────────
export const Lembretes = {
  listar: (crianca_id, auth) =>
    api.get('api.php?rota=lembretes', { params: { crianca_id, ...auth } }),
  criar: (payload) => api.post('api.php?rota=lembretes', payload),
  alternarFeito: (id_lembrete, feito, auth) =>
    api.put('api.php?rota=lembretes', { id_lembrete, feito, ...auth }),
  remover: (id_lembrete, usuario_id) =>
    api.delete('api.php?rota=lembretes', { data: { id_lembrete, usuario_id } }),
};

// ── Humor ────────────────────────────────────────────────────
export const Mood = {
  listar: (crianca_id, usuario_id, dias) =>
    api.get('api.php?rota=mood', { params: { crianca_id, usuario_id, dias } }),
  registrar: (payload) => api.post('api.php?rota=mood', payload),
};

// ── Monitoramento ───────────────────────────────────────────
export const Monitoramento = {
  resumo: (crianca_id, usuario_id, dias) =>
    api.get('api.php?rota=monitoramento', { params: { crianca_id, usuario_id, dias } }),
};

// ── Hardware (botão físico) ────────────────────────────────
export const Hardware = {
  configurarBotao: (id_botao, nome_audio) => {
    const formData = new FormData();
    formData.append('id_botao', id_botao);
    formData.append('nome_audio', nome_audio);
    return api.post('api.php?rota=configurar_botao', formData);
  },
  ativarSistema: () => axios.get('http://10.239.0.44:5000/executar_bat'),
};

// ── Upload de imagem ────────────────────────────────────────
export const Uploads = {
  enviarImagemPictograma: (localUri) => {
    const formData = new FormData();
    const nomeArquivo = localUri.split('/').pop() || 'pictograma.jpg';
    const extensao = (nomeArquivo.split('.').pop() || 'jpg').toLowerCase();
    const tipoMime = extensao === 'jpg' ? 'image/jpeg' : `image/${extensao}`;
    formData.append('imagem', {
      uri: localUri,
      name: nomeArquivo,
      type: tipoMime,
    });
    return api.post('api.php?rota=upload_imagem', formData, { timeout: 30000 });
  },
};

export default api;