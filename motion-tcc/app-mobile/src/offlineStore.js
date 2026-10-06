import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';

const KEY = 'motion.offline.database.v1';
let cache = null;

const clone = (value) => JSON.parse(JSON.stringify(value));
const now = () => new Date().toISOString().slice(0, 19).replace('T', ' ');

function seedDatabase() {
  const children = [{
    id_crianca: 1,
    usuario_id: 1,
    offline_origin: true,
    comunicacao_inicializada: true,
    nome: 'Criança de demonstração',
    avatar_emoji: '🧒',
    pin_saida: '1234',
    tamanho_pictograma: 'medio', tema: 'claro', voz: 'default',
    alto_contraste: 0, alvos_gigantes: 0, varredura_ativa: 0,
    tempo_resposta: 1000, varredura_velocidade: 1000,
  }];
  const categorySeeds = [
    ['Necessidades', '🧩', '#BDE0FE', [['Quero água', '💧'], ['Estou com fome', '🍎'], ['Preciso ir ao banheiro', '🚻'], ['Estou com dor', '🤕'], ['Quero descansar', '😴']]],
    ['Sentimentos', '😊', '#CDEAC0', [['Estou feliz', '😄'], ['Estou triste', '😢'], ['Estou bravo', '😠'], ['Estou cansado', '😴'], ['Estou calmo', '🙂']]],
    ['Pessoas', '👥', '#FFD6A5', [['Mamãe', '👩'], ['Papai', '👨'], ['Professor(a)', '🧑‍🏫'], ['Amigo(a)', '🧑'], ['Quero ajuda', '🙋']]],
    ['Atividades', '🎨', '#FFC8DD', [['Quero brincar', '🧸'], ['Quero ouvir música', '🎵'], ['Quero desenhar', '🖍️'], ['Quero ler', '📚'], ['Quero assistir', '📺']]],
    ['Lugares', '📍', '#D8E2DC', [['Quero ir para casa', '🏠'], ['Quero ir para a escola', '🏫'], ['Quero ir ao parque', '🌳'], ['Quero ir ao médico', '🩺'], ['Quero ir ao mercado', '🛒']]],
  ];
  let nextCategory = 1;
  let nextFala = 1;
  const categorias = [];
  const falas = [];
  categorySeeds.forEach(([nome_categoria, emoji, cor, words], ci) => {
    const id_categoria = nextCategory++;
    categorias.push({ id_categoria, crianca_id: 1, nome_categoria, emoji, cor, ordem: ci + 1 });
    words.forEach(([texto, femoji], wi) => falas.push({ id_fala: nextFala++, id_categoria, texto, emoji: femoji, ordem: wi + 1, imagem_url: null }));
  });
  return {
    nextChild: 2, nextCategory, nextFala, nextRoutine: 3, nextReminder: 3, nextPhrase: 3, nextHistory: 2, nextMood: 2, nextAviso: 2, hardware: [], rotina_execucoes: [],
    user: { id_usuario: 1, nome: 'Administrador offline', email: 'offline@motion.local' },
    children, categorias, falas,
    rotinas: [
      { id_rotina: 1, crianca_id: 1, dia_semana: 'Todos os dias', dias_semana: ['Todos os dias'], atividade: 'Rotina da manhã', horario: '08:00:00', icone: '🌞' },
      { id_rotina: 2, crianca_id: 1, dia_semana: 'Todos os dias', dias_semana: ['Todos os dias'], atividade: 'Hora de brincar', horario: '16:00:00', icone: '🧸' },
    ],
    lembretes: [
      { id_lembrete: 1, crianca_id: 1, texto: 'Beber água', hora: '10:00:00', recorrencia: 'diaria', feito: false },
      { id_lembrete: 2, crianca_id: 1, texto: 'Guardar os brinquedos', hora: '18:00:00', recorrencia: 'diaria', feito: false },
    ],
    frases: [{ id_frase: 1, crianca_id: 1, texto: 'Obrigado' }, { id_frase: 2, crianca_id: 1, texto: 'Por favor' }],
    historico: [{ id_historico: 1, crianca_id: 1, texto: 'Quero água', emoji: '💧', tipo: 'exemplo', data_uso: now() }],
    mood: [{ id_mood: 1, crianca_id: 1, humor: 'feliz', emoji: '😄', data_registro: now() }],
    avisos: [{ id_aviso: 1, crianca_id: 1, titulo: 'Exemplo de aviso', mensagem: 'Este é um aviso de demonstração.', emoji: '💬', lido: false, criado_em: now() }],
  };
}

export async function openOfflineStore() {
  if (cache) return cache;
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) {
    cache = seedDatabase();
  } else {
    try {
      const parsed = JSON.parse(raw);
      cache = parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : seedDatabase();
    } catch (error) {
      // Uma gravação interrompida não deve impedir o acesso sem conta.
      cache = seedDatabase();
      await AsyncStorage.removeItem(KEY);
    }
  }
  // Migração compatível com bancos locais criados por versões anteriores.
  for (const key of ['children', 'categorias', 'falas', 'rotinas', 'lembretes', 'frases', 'historico', 'mood', 'avisos', 'hardware', 'rotina_execucoes']) {
    if (!Array.isArray(cache[key])) cache[key] = [];
  }
  cache.user ||= seedDatabase().user;
  cache.nextChild ||= Math.max(1, ...cache.children.map((x) => Number(x.id_crianca) || 0)) + 1;
  cache.nextCategory ||= Math.max(1, ...cache.categorias.map((x) => Number(x.id_categoria) || 0)) + 1;
  cache.nextFala ||= Math.max(1, ...cache.falas.map((x) => Number(x.id_fala) || 0)) + 1;
  cache.nextRoutine ||= Math.max(1, ...cache.rotinas.map((x) => Number(x.id_rotina) || 0)) + 1;
  cache.nextReminder ||= Math.max(1, ...cache.lembretes.map((x) => Number(x.id_lembrete) || 0)) + 1;
  cache.nextPhrase ||= Math.max(1, ...cache.frases.map((x) => Number(x.id_frase) || 0)) + 1;
  cache.nextHistory ||= Math.max(1, ...cache.historico.map((x) => Number(x.id_historico) || 0)) + 1;
  cache.nextMood ||= Math.max(1, ...cache.mood.map((x) => Number(x.id_mood) || 0)) + 1;
  cache.nextAviso ||= Math.max(1, ...cache.avisos.map((x) => Number(x.id_aviso) || 0)) + 1;
  await persist();
  return cache;
}

async function persist() {
  if (cache) await AsyncStorage.setItem(KEY, JSON.stringify(cache));
}

export async function resetOfflineStore() { cache = seedDatabase(); await persist(); return clone(cache); }
export async function getOfflineUser() { const db = await openOfflineStore(); return clone(db.user); }
export async function offlinePendingSnapshot() {
  const db = await openOfflineStore();
  const children = db.children.filter((child) => child.offline_origin !== false);
  return clone({ ...db, children });
}
export async function markOfflineChildSynced(id, remoteId) {
  const db = await openOfflineStore();
  const child = db.children.find((item) => item.id_crianca === Number(id));
  if (child) { child.offline_origin = false; child.remote_id = Number(remoteId); }
  await persist();
}

export async function offlineChildren() { const db = await openOfflineStore(); return clone(db.children); }

const COMMUNICATION_TEMPLATES = [
  ['Necessidades', '🧩', '#BDE0FE', [['Quero água', '💧'], ['Estou com fome', '🍎'], ['Preciso ir ao banheiro', '🚻'], ['Estou com dor', '🤕'], ['Quero descansar', '😴']]],
  ['Sentimentos', '😊', '#CDEAC0', [['Estou feliz', '😄'], ['Estou triste', '😢'], ['Estou bravo', '😠'], ['Estou cansado', '😴'], ['Estou calmo', '🙂']]],
  ['Pessoas', '👥', '#FFD6A5', [['Mamãe', '👩'], ['Papai', '👨'], ['Professor(a)', '🧑‍🏫'], ['Amigo(a)', '🧑'], ['Quero ajuda', '🙋']]],
  ['Atividades', '🎨', '#FFC8DD', [['Quero brincar', '🧸'], ['Quero ouvir música', '🎵'], ['Quero desenhar', '🖍️'], ['Quero ler', '📚'], ['Quero assistir', '📺']]],
  ['Lugares', '📍', '#D8E2DC', [['Quero ir para casa', '🏠'], ['Quero ir para a escola', '🏫'], ['Quero ir ao parque', '🌳'], ['Quero ir ao médico', '🩺'], ['Quero ir ao mercado', '🛒']]],
];

// Cria a comunicação padrão uma única vez por perfil novo. Não use apenas a
// ausência de categorias como sinal: isso faria a lista reaparecer após o
// responsável apagar intencionalmente a última categoria.
export async function offlineEnsureCommunicationData(criancaId) {
  const db = await openOfflineStore();
  const id = Number(criancaId);
  const child = db.children.find((x) => Number(x.id_crianca) === id);
  if (!id || !child || child.comunicacao_inicializada) return false;
  if (db.categorias.some((x) => Number(x.crianca_id) === id)) {
    child.comunicacao_inicializada = true;
    await persist();
    return false;
  }
  COMMUNICATION_TEMPLATES.forEach(([nome_categoria, emoji, cor, words], ci) => {
    const id_categoria = db.nextCategory++;
    db.categorias.push({ id_categoria, crianca_id: id, nome_categoria, emoji, cor, ordem: ci + 1 });
    words.forEach(([texto, femoji], wi) => db.falas.push({ id_fala: db.nextFala++, id_categoria, texto, emoji: femoji, ordem: wi + 1, imagem_url: null }));
  });
  child.comunicacao_inicializada = true;
  await persist();
  return true;
}

export async function offlineCreateChild(nome, avatar_emoji = '🧒') {
  const db = await openOfflineStore(); const id = db.nextChild++;
  const child = { id_crianca: id, usuario_id: db.user.id_usuario, offline_origin: true, comunicacao_inicializada: true, nome, avatar_emoji, pin_saida: '1234', tamanho_pictograma: 'medio', tema: 'claro', voz: 'default', alto_contraste: 0, alvos_gigantes: 0, varredura_ativa: 0, tempo_resposta: 1000, varredura_velocidade: 1000 };
  const templates = [
    ['Necessidades', '🧩', '#BDE0FE', [['Quero água', '💧'], ['Estou com fome', '🍎'], ['Preciso ir ao banheiro', '🚻'], ['Estou com dor', '🤕'], ['Quero descansar', '😴']]],
    ['Sentimentos', '😊', '#CDEAC0', [['Estou feliz', '😄'], ['Estou triste', '😢'], ['Estou bravo', '😠'], ['Estou cansado', '😴'], ['Estou calmo', '🙂']]],
    ['Pessoas', '👥', '#FFD6A5', [['Mamãe', '👩'], ['Papai', '👨'], ['Professor(a)', '🧑‍🏫'], ['Amigo(a)', '🧑'], ['Quero ajuda', '🙋']]],
    ['Atividades', '🎨', '#FFC8DD', [['Quero brincar', '🧸'], ['Quero ouvir música', '🎵'], ['Quero desenhar', '🖍️'], ['Quero ler', '📚'], ['Quero assistir', '📺']]],
    ['Lugares', '📍', '#D8E2DC', [['Quero ir para casa', '🏠'], ['Quero ir para a escola', '🏫'], ['Quero ir ao parque', '🌳'], ['Quero ir ao médico', '🩺'], ['Quero ir ao mercado', '🛒']]],
  ];
  db.children.push({ ...child });
  templates.forEach(([name, emoji, cor, words], ci) => {
    const cid = db.nextCategory++; db.categorias.push({ id_categoria: cid, crianca_id: id, nome_categoria: name, emoji, cor, ordem: ci + 1 });
    words.forEach(([texto, femoji], wi) => db.falas.push({ id_fala: db.nextFala++, id_categoria: cid, texto, emoji: femoji, ordem: wi + 1, imagem_url: null }));
  });
  db.rotinas.push({ id_rotina: db.nextRoutine++, crianca_id: id, dia_semana: 'Todos os dias', dias_semana: ['Todos os dias'], atividade: 'Rotina da manhã', horario: '08:00:00', icone: '🌞' });
  db.rotinas.push({ id_rotina: db.nextRoutine++, crianca_id: id, dia_semana: 'Todos os dias', dias_semana: ['Todos os dias'], atividade: 'Hora de brincar', horario: '16:00:00', icone: '🧸' });
  db.lembretes.push({ id_lembrete: db.nextReminder++, crianca_id: id, texto: 'Beber água', hora: '10:00:00', recorrencia: 'diaria', feito: false });
  db.lembretes.push({ id_lembrete: db.nextReminder++, crianca_id: id, texto: 'Guardar os brinquedos', hora: '18:00:00', recorrencia: 'diaria', feito: false });
  db.frases.push({ id_frase: db.nextPhrase++, crianca_id: id, texto: 'Obrigado' });
  db.frases.push({ id_frase: db.nextPhrase++, crianca_id: id, texto: 'Por favor' });
  db.historico.push({ id_historico: db.nextHistory++, crianca_id: id, texto: 'Quero água', emoji: '💧', tipo: 'exemplo', data_uso: now() });
  db.mood.push({ id_mood: db.nextMood++, crianca_id: id, humor: 'feliz', emoji: '😄', data_registro: now() });
  db.avisos.push({ id_aviso: db.nextAviso++, crianca_id: id, titulo: 'Exemplo de aviso', mensagem: 'Este é um aviso de demonstração.', emoji: '💬', lido: false, criado_em: now() });
  await persist(); return clone(child);
}
export async function offlineUpdateChild(patch) { const db = await openOfflineStore(); const i = db.children.findIndex((x) => x.id_crianca === Number(patch.id_crianca)); if (i >= 0) db.children[i] = { ...db.children[i], ...patch, offline_origin: true }; await persist(); return clone(db.children[i]); }
export async function offlineDeleteChild(id) { const db = await openOfflineStore(); const n = Number(id); const cats = new Set(db.categorias.filter((x) => x.crianca_id === n).map((x) => x.id_categoria)); db.children = db.children.filter((x) => x.id_crianca !== n); const keep = (x) => x.crianca_id !== n; ['categorias', 'rotinas', 'lembretes', 'frases', 'historico', 'mood', 'avisos', 'rotina_execucoes'].forEach((k) => { db[k] = db[k].filter(keep); }); db.falas = db.falas.filter((x) => !cats.has(x.id_categoria)); await persist(); }

function childItems(db, key, id) { return db[key].filter((x) => x.crianca_id === Number(id)); }
function touchChild(db, id) { const child = db.children.find((x) => x.id_crianca === Number(id)); if (child) child.offline_origin = true; }
function touchCategoryChild(db, id_categoria) { const cat = db.categorias.find((x) => x.id_categoria === Number(id_categoria)); if (cat) touchChild(db, cat.crianca_id); }
export async function offlineListCategories(id) { await offlineEnsureCommunicationData(id); const db = await openOfflineStore(); return clone(childItems(db, 'categorias', id).sort((a, b) => a.ordem - b.ordem)); }
export async function offlineCreateCategory(p) { const db = await openOfflineStore(); const id = db.nextCategory++; db.categorias.push({ id_categoria: id, crianca_id: Number(p.crianca_id), nome_categoria: p.nome_categoria, emoji: p.emoji || '📋', cor: p.cor || '#BDE0FE', ordem: childItems(db, 'categorias', p.crianca_id).length + 1 }); touchChild(db, p.crianca_id); await persist(); return id; }
export async function offlineUpdateCategory(p) { const db = await openOfflineStore(); const i = db.categorias.findIndex((x) => x.id_categoria === Number(p.id_categoria)); if (i >= 0) { db.categorias[i] = { ...db.categorias[i], ...p }; touchChild(db, db.categorias[i].crianca_id); } await persist(); }
export async function offlineDeleteCategory(id) { const db = await openOfflineStore(); const n = Number(id); const cat = db.categorias.find((x) => x.id_categoria === n); db.categorias = db.categorias.filter((x) => x.id_categoria !== n); if (cat) { db.falas = db.falas.filter((x) => x.id_categoria !== n); const child = db.children.find((x) => Number(x.id_crianca) === Number(cat.crianca_id)); if (child) child.comunicacao_inicializada = true; touchChild(db, cat.crianca_id); } await persist(); }
export async function offlineListFalas(id) {
  const db = await openOfflineStore();
  return clone(db.falas.filter((x) => x.id_categoria === Number(id)).sort((a, b) => a.ordem - b.ordem));
}
export async function offlineCreateFala(p) { const db = await openOfflineStore(); const id = db.nextFala++; db.falas.push({ id_fala: id, id_categoria: Number(p.id_categoria), texto: p.texto, emoji: p.emoji || '💬', imagem_url: p.imagem_url || null, ordem: db.falas.filter((x) => x.id_categoria === Number(p.id_categoria)).length + 1 }); touchCategoryChild(db, p.id_categoria); await persist(); return id; }
export async function offlineUpdateFala(p) { const db = await openOfflineStore(); const i = db.falas.findIndex((x) => x.id_fala === Number(p.id_fala)); if (i >= 0) { db.falas[i] = { ...db.falas[i], ...p }; touchCategoryChild(db, db.falas[i].id_categoria); } await persist(); }
export async function offlineDeleteFala(id) { const db = await openOfflineStore(); const fala = db.falas.find((x) => x.id_fala === Number(id)); db.falas = db.falas.filter((x) => x.id_fala !== Number(id)); if (fala) touchCategoryChild(db, fala.id_categoria); await persist(); }

export async function offlineList(key, id) { const db = await openOfflineStore(); return clone(childItems(db, key, id)); }
export async function offlineAdd(key, item, counter) { const db = await openOfflineStore(); const id = db[counter]++; db[key].push({ ...item, [Object.keys(item).find((k) => k.startsWith('id_')) || 'id']: id }); if (item.crianca_id) touchChild(db, item.crianca_id); await persist(); return id; }
export async function offlineUpdate(key, idKey, p) { const db = await openOfflineStore(); const i = db[key].findIndex((x) => x[idKey] === Number(p[idKey])); if (i >= 0) { db[key][i] = { ...db[key][i], ...p }; if (db[key][i].crianca_id) touchChild(db, db[key][i].crianca_id); } await persist(); }
export async function offlineDelete(key, idKey, id) { const db = await openOfflineStore(); const old = db[key].find((x) => x[idKey] === Number(id)); db[key] = db[key].filter((x) => x[idKey] !== Number(id)); if (old?.crianca_id) touchChild(db, old.crianca_id); await persist(); }
export async function offlineAddHistory(p) { const db = await openOfflineStore(); db.historico.push({ ...p, id_historico: db.nextHistory++, data_uso: now() }); touchChild(db, p.crianca_id); await persist(); }
export async function offlineAddMood(p) { const db = await openOfflineStore(); db.mood.push({ ...p, id_mood: db.nextMood++, data_registro: now() }); touchChild(db, p.crianca_id); await persist(); }
export async function offlineSummary(id) {
  const db = await openOfflineStore();
  const historico = childItems(db, 'historico', id);
  const rotinas = childItems(db, 'rotinas', id);
  const execucoes = (db.rotina_execucoes || []).filter((x) => rotinas.some((r) => Number(r.id_rotina) === Number(x.rotina_id)));
  const porDia = {};
  const usados = {};
  historico.forEach((item) => {
    const dia = String(item.data_uso || '').slice(0, 10) || 'sem data';
    porDia[dia] = (porDia[dia] || 0) + 1;
    const texto = item.texto || 'Sem texto';
    usados[texto] = (usados[texto] || 0) + 1;
  });
  return {
    success: true,
    total_falas: historico.length,
    total_rotinas: rotinas.length,
    falas_por_dia: Object.entries(porDia).sort(([a], [b]) => a.localeCompare(b)).map(([dia, total]) => ({ dia, total })),
    mais_usados: Object.entries(usados).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([texto, total]) => ({ texto, total })),
    humor: childItems(db, 'mood', id),
    rotinas_por_dia: execucoes.map((x) => ({ dia: x.data_execucao, total: 1 })),
    lembretes_resumo: { concluidos: childItems(db, 'lembretes', id).filter((x) => x.feito).length },
  };
}
export async function offlineListAvisos(id) { const db = await openOfflineStore(); return clone(childItems(db, 'avisos', id)); }
export async function offlineMarkAviso(id, lido) { const db = await openOfflineStore(); const x = db.avisos.find((a) => a.id_aviso === Number(id)); if (x) { x.lido = !!lido; touchChild(db, x.crianca_id); } await persist(); }
export async function offlineUpdateAviso(patch) { const db = await openOfflineStore(); const i = db.avisos.findIndex((x) => Number(x.id_aviso) === Number(patch.id_aviso)); if (i >= 0) { db.avisos[i] = { ...db.avisos[i], ...patch }; touchChild(db, db.avisos[i].crianca_id); } await persist(); }




// Garante uma base local completa para um dispositivo pareado que foi aberto
// sem servidor. Os ids remotos são preservados para a criança continuar usando
// o mesmo perfil; os conteúdos padrão só são criados se ainda não houver cache.
export async function offlineEnsurePairedChild(child) {
  const db = await openOfflineStore();
  const id = Number(child?.id_crianca);
  if (!id) return null;
  let local = db.children.find((x) => Number(x.id_crianca) === id);
  if (!local) {
    local = { ...child, id_crianca: id, offline_origin: false, comunicacao_inicializada: false };
    db.children.push(local);
  } else {
    Object.assign(local, child);
  }
  if (!local.comunicacao_inicializada && !db.categorias.some((x) => Number(x.crianca_id) === id)) {
    const templates = [
      ['Necessidades', '🧩', '#BDE0FE', [['Quero água', '💧'], ['Estou com fome', '🍎'], ['Preciso ir ao banheiro', '🚻'], ['Estou com dor', '🤕'], ['Quero descansar', '😴']]],
      ['Sentimentos', '😊', '#CDEAC0', [['Estou feliz', '😄'], ['Estou triste', '😢'], ['Estou bravo', '😠'], ['Estou cansado', '😴'], ['Estou calmo', '🙂']]],
      ['Pessoas', '👥', '#FFD6A5', [['Mamãe', '👩'], ['Papai', '👨'], ['Professor(a)', '🧑‍🏫'], ['Amigo(a)', '🧑'], ['Quero ajuda', '🙋']]],
      ['Atividades', '🎨', '#FFC8DD', [['Quero brincar', '🧸'], ['Quero ouvir música', '🎵'], ['Quero desenhar', '🖍️'], ['Quero ler', '📚'], ['Quero assistir', '📺']]],
      ['Lugares', '📍', '#D8E2DC', [['Quero ir para casa', '🏠'], ['Quero ir para a escola', '🏫'], ['Quero ir ao parque', '🌳'], ['Quero ir ao médico', '🩺'], ['Quero ir ao mercado', '🛒']]],
    ];
    for (const [nome_categoria, emoji, cor, words] of templates) {
      const id_categoria = db.nextCategory++;
      db.categorias.push({ id_categoria, crianca_id: id, nome_categoria, emoji, cor, ordem: db.categorias.filter((x) => x.crianca_id === id).length + 1 });
      for (const [texto, femoji] of words) db.falas.push({ id_fala: db.nextFala++, id_categoria, texto, emoji: femoji, ordem: db.falas.filter((x) => x.id_categoria === id_categoria).length + 1, imagem_url: null });
    }
    db.rotinas.push({ id_rotina: db.nextRoutine++, crianca_id: id, dia_semana: 'Todos os dias', dias_semana: ['Todos os dias'], atividade: 'Rotina da manhã', horario: '08:00:00', icone: '🌞' });
    db.rotinas.push({ id_rotina: db.nextRoutine++, crianca_id: id, dia_semana: 'Todos os dias', dias_semana: ['Todos os dias'], atividade: 'Hora de brincar', horario: '16:00:00', icone: '🧸' });
    db.lembretes.push({ id_lembrete: db.nextReminder++, crianca_id: id, texto: 'Beber água', hora: '10:00:00', recorrencia: 'diaria', feito: false });
    db.lembretes.push({ id_lembrete: db.nextReminder++, crianca_id: id, texto: 'Guardar os brinquedos', hora: '18:00:00', recorrencia: 'diaria', feito: false });
    db.frases.push({ id_frase: db.nextPhrase++, crianca_id: id, texto: 'Obrigado' });
    db.frases.push({ id_frase: db.nextPhrase++, crianca_id: id, texto: 'Por favor' });
  }
  local.comunicacao_inicializada = true;
  await persist();
  return clone(local);
}

function dataLocalISO(date = new Date()) {
  const ano = date.getFullYear();
  const mes = String(date.getMonth() + 1).padStart(2, '0');
  const dia = String(date.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

export async function offlineConcluirRotina(id_rotina, data = dataLocalISO()) {
  const db = await openOfflineStore();
  if (!db.rotina_execucoes) db.rotina_execucoes = [];
  const rotina = db.rotinas.find((x) => Number(x.id_rotina) === Number(id_rotina));
  if (rotina && !db.rotina_execucoes.some((x) => Number(x.rotina_id) === Number(id_rotina) && x.data_execucao === data)) {
    db.rotina_execucoes.push({ rotina_id: Number(id_rotina), data_execucao: data });
    touchChild(db, rotina.crianca_id);
  }
  await persist();
}

export async function offlineListRotinas(id, dia) {
  const db = await openOfflineStore();
  const hoje = dataLocalISO();
  return clone(childItems(db, 'rotinas', id).filter((r) => {
    if (!dia) return true;
    const dias = Array.isArray(r.dias_semana) && r.dias_semana.length
      ? r.dias_semana
      : String(r.dia_semana || '').split(',').map((item) => item.trim()).filter(Boolean);
    const chaveDia = String(dia).trim().toLocaleLowerCase('pt-BR');
    return dias.some((item) => ['todos', 'todos os dias'].includes(String(item).trim().toLocaleLowerCase('pt-BR')) || String(item).trim().toLocaleLowerCase('pt-BR') === chaveDia);
  }).map((r) => ({ ...r, dias_semana: r.dias_semana || (r.dia_semana ? r.dia_semana.split(',').map((item) => item.trim()) : []), concluida_hoje: !!(db.rotina_execucoes || []).some((e) => Number(e.rotina_id) === Number(r.id_rotina) && e.data_execucao === hoje) })).sort((a, b) => String(a.horario).localeCompare(String(b.horario))));
}

export async function offlineListHardware() {
  const db = await openOfflineStore();
  return clone(db.hardware || []);
}
export async function offlineSaveHardware(id_botao, nome_audio, descricao_audio) {
  const db = await openOfflineStore();
  if (!db.hardware) db.hardware = [];
  const old = db.hardware.find((x) => Number(x.id_botao) === Number(id_botao));
  const item = { ...(old || {}), id_botao: Number(id_botao), nome_audio, descricao_audio, atualizado_em: now() };
  db.hardware = [...db.hardware.filter((x) => Number(x.id_botao) !== Number(id_botao)), item];
  await persist();
  return clone(item);
}

export async function offlineUploadImagem(localUri) {
  if (typeof localUri !== 'string' || !localUri.trim()) throw new Error('A imagem escolhida não tem um endereço válido.');
  if (/^https?:\/\//i.test(localUri) || localUri.startsWith('data:')) return localUri;
  const documentos = FileSystem.documentDirectory;
  if (!documentos) throw new Error('O armazenamento persistente de imagens não está disponível neste aparelho.');
  const pasta = `${documentos}motion/pictograms/`;
  await FileSystem.makeDirectoryAsync(pasta, { intermediates: true });
  const nomeOriginal = localUri.split(/[?#]/)[0].split('/').pop() || 'pictograma.jpg';
  const extensao = (nomeOriginal.match(/\.([a-z0-9]{2,5})$/i)?.[1] || 'jpg').toLowerCase();
  const extensaoSegura = ['jpg', 'jpeg', 'png', 'webp', 'heic'].includes(extensao) ? extensao : 'jpg';
  const destino = `${pasta}${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extensaoSegura}`;
  await FileSystem.copyAsync({ from: localUri, to: destino });
  const info = await FileSystem.getInfoAsync(destino);
  if (!info.exists) throw new Error('Não foi possível guardar a imagem neste aparelho. Tente escolher outra foto.');
  return destino;
}
