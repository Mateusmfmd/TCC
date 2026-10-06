const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');

const projectRoot = path.resolve(__dirname, '..');
const requireFromProject = createRequire(path.join(projectRoot, 'package.json'));
const babel = requireFromProject('@babel/core');
const storagePath = path.join(projectRoot, 'src/offlineStore.js');
const apiPath = path.join(projectRoot, 'src/api.js');
const pressBehaviorPath = path.join(projectRoot, 'src/pressBehavior.js');
const phraseDraftPath = path.join(projectRoot, 'src/phraseDraft.js');
const kidScreenPath = path.join(projectRoot, 'src/screens/ModoCrianca.js');
const values = new Map();
const files = new Set();
const copiedFiles = [];

const asyncStorage = {
  async getItem(key) { return values.has(key) ? values.get(key) : null; },
  async setItem(key, value) { values.set(key, value); },
  async removeItem(key) { values.delete(key); },
  async multiSet(entries) { for (const [key, value] of entries) values.set(key, value); },
  async multiRemove(keys) { for (const key of keys) values.delete(key); },
};
const fileSystem = {
  documentDirectory: 'file:///test-documents/',
  async makeDirectoryAsync() {},
  async copyAsync({ from, to }) { copiedFiles.push({ from, to }); files.add(to); },
  async getInfoAsync(uri) { return { exists: files.has(uri), isDirectory: false, uri }; },
};

function transform(filePath) {
  const source = fs.readFileSync(filePath, 'utf8');
  return babel.transformSync(source, {
    filename: filePath,
    presets: [requireFromProject.resolve('babel-preset-expo')],
  }).code;
}

function loadStore() {
  const module = { exports: {} };
  const code = transform(storagePath);
  const mockRequire = (id) => {
    if (id === '@react-native-async-storage/async-storage') return { __esModule: true, default: asyncStorage };
    if (id === 'expo-file-system/legacy') return fileSystem;
    return requireFromProject(id);
  };
  new Function('require', 'module', 'exports', code)(mockRequire, module, module.exports);
  return module.exports;
}

function loadApi(store) {
  const module = { exports: {} };
  const axiosInstance = {
    interceptors: { request: { use() {} }, response: { use() {} } },
    async get() { throw new Error('Online endpoint must not be used in offline-mode tests.'); },
    async post() { throw new Error('Online endpoint must not be used in offline-mode tests.'); },
    async put() { throw new Error('Online endpoint must not be used in offline-mode tests.'); },
    async delete() { throw new Error('Online endpoint must not be used in offline-mode tests.'); },
  };
  const axios = { create: () => axiosInstance };
  const code = transform(apiPath);
  const mockRequire = (id) => {
    if (id === 'axios') return { __esModule: true, default: axios };
    if (id === 'expo-constants') return { __esModule: true, default: { expoConfig: { extra: {} } } };
    if (id === 'react-native') return { Platform: { OS: 'android' } };
    if (id === './offlineStore') return { __esModule: true, ...store };
    return requireFromProject(id);
  };
  new Function('require', 'module', 'exports', code)(mockRequire, module, module.exports);
  return module.exports;
}

function loadPressBehavior() {
  const module = { exports: {} };
  const code = transform(pressBehaviorPath);
  new Function('require', 'module', 'exports', code)(requireFromProject, module, module.exports);
  return module.exports.createPressBehavior;
}

function loadPhraseDraft() {
  const module = { exports: {} };
  const code = transform(phraseDraftPath);
  new Function('require', 'module', 'exports', code)(requireFromProject, module, module.exports);
  return module.exports;
}

const hojeLocal = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

function testTouchBehavior() {
  const createPressBehavior = loadPressBehavior();
  let nextId = 1;
  const timers = new Map();
  const setTimer = (fn) => { const id = nextId++; timers.set(id, fn); return id; };
  const clearTimer = (id) => timers.delete(id);

  let quickTapCount = 0;
  const quickTap = createPressBehavior({ confirm: () => quickTapCount++, delayMs: 1000, setTimer, clearTimer });
  quickTap.pressIn();
  quickTap.pressOut();
  assert.equal(quickTap.press(), true, 'a quick tap selects immediately, without waiting for dwell');
  assert.equal(quickTapCount, 1, 'a quick tap selects once');
  quickTap.dispose();

  let longPressCount = 0;
  const longPress = createPressBehavior({ confirm: () => longPressCount++, delayMs: 1000, setTimer, clearTimer });
  longPress.pressIn();
  const [timerId, fireLongPress] = [...timers.entries()][0];
  timers.delete(timerId);
  fireLongPress();
  longPress.pressOut();
  assert.equal(longPress.press(), false, 'releasing after a confirmed hold does not select twice');
  assert.equal(longPressCount, 1, 'long press selects exactly once');
  longPress.dispose();

  let canceledHoldCount = 0;
  const canceledHold = createPressBehavior({ confirm: () => canceledHoldCount++, delayMs: 1000, setTimer, clearTimer });
  canceledHold.pressIn();
  canceledHold.pressOut();
  assert.equal(canceledHoldCount, 0, 'releasing before the dwell threshold cancels only the long-press timer');
  canceledHold.press();
  assert.equal(canceledHoldCount, 1, 'the same short interaction still selects on normal release');
  canceledHold.dispose();
}

function testPhraseDraftAcrossCategories() {
  const { addPhraseItem, removePhraseItem, removeLastPhraseItem, clearPhraseDraft, getPhraseText } = loadPhraseDraft();
  const source = fs.readFileSync(kidScreenPath, 'utf8');
  assert.match(source, /frase=\{rascunhoFrase\} setFrase=\{setRascunhoFrase\}/, 'phrase draft is owned by the parent that stays mounted across navigation');
  assert.doesNotMatch(source, /const \[frase, setFrase\] = useState\(\[\]\)/, 'switching pictogram categories must not reset the phrase draft');

  let phrase = [];
  for (let index = 1; index <= 45; index += 1) {
    phrase = addPhraseItem(phrase, { texto: `palavra-${index}`, categoryId: index % 5 });
  }
  phrase = addPhraseItem(phrase, { texto: 'de outra categoria', categoryId: 99 });
  assert.equal(phrase.length, 46, 'long phrase has no artificial item limit and can add from a different category');
  assert.equal(phrase.at(-1).categoryId, 99, 'switching categories preserves order and accepts the next word');
  assert.equal(new Set(phrase.map((item) => item.draftKey)).size, phrase.length, 'every occurrence has a unique chip identity, even repeated words');
  assert.ok(getPhraseText(phrase).startsWith('palavra-1 palavra-2'));
  assert.ok(getPhraseText(phrase).endsWith('de outra categoria'));

  phrase = removePhraseItem(phrase, 1);
  assert.equal(phrase.length, 45, 'remove button deletes the selected word only');
  assert.equal(phrase.some((item) => item.texto === 'palavra-2'), false, 'the selected chip, not a neighboring word, is removed');
  assert.equal(phrase[1].texto, 'palavra-3', 'removing a word keeps all later words in order');
  phrase = removeLastPhraseItem(phrase);
  assert.equal(phrase.length, 44, 'backspace deletes only the last word');
  assert.equal(phrase.at(-1).texto, 'palavra-45');
  assert.equal(clearPhraseDraft().length, 0, 'clear phrase empties the shared draft');
}

(async () => {
  testTouchBehavior();
  testPhraseDraftAcrossCategories();
  const store = loadStore();
  await store.openOfflineStore();
  assert.equal((await store.offlineChildren()).length, 1, 'opening first time creates a demo profile');
  const categories = await store.offlineListCategories(1);
  assert.equal(categories.length, 5, 'seed creates five categories');
  let wordCount = 0;
  for (const category of categories) wordCount += (await store.offlineListFalas(category.id_categoria)).length;
  assert.equal(wordCount, 25, 'seed creates five words per category');

  const child = await store.offlineCreateChild('Teste local');
  assert.equal(child.nome, 'Teste local');
  assert.equal((await store.offlineChildren()).length, 2, 'new profile is saved locally');
  const childCategories = await store.offlineListCategories(child.id_crianca);
  assert.equal(childCategories.length, 5, 'new profile gets initial communication content');
  for (const category of childCategories) await store.offlineDeleteCategory(category.id_categoria);
  assert.equal((await store.offlineListCategories(child.id_crianca)).length, 0, 'intentionally deleting every category is not undone by a later list');

  const categoryId = categories[0].id_categoria;
  assert.ok(categories.some((item) => item.id_categoria === categoryId), 'test fixture category exists');
  await store.offlineUpdateCategory({ id_categoria: categoryId, nome_categoria: 'Necessidades editadas' });
  assert.equal((await store.offlineListCategories(1)).find((item) => item.id_categoria === categoryId).nome_categoria, 'Necessidades editadas', 'category edit persists');
  const customCategoryId = await store.offlineCreateCategory({ crianca_id: 1, nome_categoria: 'Teste', emoji: '🧪', cor: '#AABBCC' });
  assert.equal((await store.offlineListCategories(1)).some((item) => item.id_categoria === customCategoryId), true, 'category create persists');
  await store.offlineDeleteCategory(customCategoryId);
  assert.equal((await store.offlineListCategories(1)).some((item) => item.id_categoria === customCategoryId), false, 'category delete persists');

  const fala = (await store.offlineListFalas(categoryId))[0];
  await store.offlineUpdateFala({ id_fala: fala.id_fala, texto: 'Quero água editado' });
  assert.equal((await store.offlineListFalas(categoryId))[0].texto, 'Quero água editado', 'pictogram edit persists');
  const falaId = await store.offlineCreateFala({ id_categoria: categoryId, texto: 'Novo pictograma', emoji: '✨' });
  assert.equal((await store.offlineListFalas(categoryId)).some((item) => item.id_fala === falaId), true, 'pictogram create persists');
  await store.offlineDeleteFala(falaId);
  for (const item of await store.offlineListFalas(categoryId)) await store.offlineDeleteFala(item.id_fala);
  assert.equal((await store.offlineListFalas(categoryId)).length, 0, 'deleting the last pictogram does not recreate hidden defaults');

  const mondayRoutine = await store.offlineAdd('rotinas', { id_rotina: 0, crianca_id: 1, atividade: 'Somente segunda', horario: '09:00', dias_semana: ['Segunda'], icone: '⭐' }, 'nextRoutine');
  assert.ok((await store.offlineListRotinas(1, 'Segunda')).some((item) => item.id_rotina === mondayRoutine), 'routine appears on a selected weekday');
  assert.ok(!(await store.offlineListRotinas(1, 'Sábado')).some((item) => item.id_rotina === mondayRoutine), 'routine is hidden on an unselected weekday');
  await store.offlineConcluirRotina(mondayRoutine, hojeLocal());
  assert.equal((await store.offlineListRotinas(1, 'Segunda')).find((item) => item.id_rotina === mondayRoutine).concluida_hoje, true, 'routine completion persists for local today');
  await store.offlineUpdate('rotinas', 'id_rotina', { id_rotina: mondayRoutine, atividade: 'Segunda editada' });
  assert.equal((await store.offlineListRotinas(1, 'Segunda')).find((item) => item.id_rotina === mondayRoutine).atividade, 'Segunda editada', 'routine edit persists');
  await store.offlineDelete('rotinas', 'id_rotina', mondayRoutine);
  assert.ok(!(await store.offlineListRotinas(1)).some((item) => item.id_rotina === mondayRoutine), 'routine delete persists');

  const reminderId = await store.offlineAdd('lembretes', { id_lembrete: 0, crianca_id: 1, texto: 'Teste lembrete', feito: false }, 'nextReminder');
  await store.offlineUpdate('lembretes', 'id_lembrete', { id_lembrete: reminderId, feito: true });
  assert.equal((await store.offlineList('lembretes', 1)).find((item) => item.id_lembrete === reminderId).feito, true, 'reminder completion persists');
  await store.offlineDelete('lembretes', 'id_lembrete', reminderId);
  assert.ok(!(await store.offlineList('lembretes', 1)).some((item) => item.id_lembrete === reminderId), 'reminder delete persists');

  const avisoId = await store.offlineAdd('avisos', { id_aviso: 0, crianca_id: 1, titulo: 'Teste aviso', lido: false }, 'nextAviso');
  await store.offlineMarkAviso(avisoId, true);
  await store.offlineUpdateAviso({ id_aviso: avisoId, mensagem: 'Editado localmente' });
  const aviso = (await store.offlineListAvisos(1)).find((item) => item.id_aviso === avisoId);
  assert.equal(aviso.lido, true, 'marking a notice read persists');
  assert.equal(aviso.mensagem, 'Editado localmente', 'notice edit persists');
  await store.offlineDelete('avisos', 'id_aviso', avisoId);
  assert.ok(!(await store.offlineListAvisos(1)).some((item) => item.id_aviso === avisoId), 'notice delete persists');

  await store.offlineSaveHardware(3, 'brincar.mp3', 'Brincar');
  await store.offlineSaveHardware(3, 'andar.mp3', 'Andar');
  assert.equal((await store.offlineListHardware()).length, 1, 'hardware config updates instead of adding duplicate buttons');
  assert.equal((await store.offlineListHardware())[0].descricao_audio, 'Andar', 'hardware config edit persists');

  await store.offlineAddMood({ crianca_id: 1, humor: 'feliz', emoji: '😄' });
  await store.offlineAddHistory({ crianca_id: 1, texto: 'Teste falado', tipo: 'fala' });
  const summary = await store.offlineSummary(1);
  assert.ok(summary.total_falas >= 1, 'monitoring summary includes local history');
  assert.ok(summary.humor.some((item) => item.humor === 'feliz'), 'monitoring summary includes local moods');

  const imagePath = await store.offlineUploadImagem('content://picker/foto.jpg');
  assert.ok(imagePath.startsWith('file:///test-documents/motion/pictograms/'), 'picked image is copied to persistent app storage');
  assert.equal(copiedFiles.length, 1, 'image is copied once into persistent storage');
  assert.equal(await store.offlineUploadImagem('https://example.com/foto.jpg'), 'https://example.com/foto.jpg', 'remote images stay unchanged');

  values.set('motion.offline.database.v1', '{broken-json');
  const repaired = loadStore();
  await repaired.openOfflineStore();
  assert.equal((await repaired.offlineChildren()).length, 1, 'corrupt storage recovers to a usable local demo database');
  assert.equal((await repaired.offlineListCategories(1)).length, 5, 'recovered database has a working communication board');

  const paired = loadStore();
  await paired.resetOfflineStore();
  await paired.offlineEnsurePairedChild({ id_crianca: 700, nome: 'Pareada', pin_saida: '1234' });
  assert.equal((await paired.offlineListCategories(700)).length, 5, 'new paired device gets local starter content');
  await paired.offlineDeleteCategory((await paired.offlineListCategories(700))[0].id_categoria);
  await paired.offlineEnsurePairedChild({ id_crianca: 700, nome: 'Pareada', pin_saida: '1234' });
  assert.equal((await paired.offlineListCategories(700)).length, 4, 'paired startup does not resurrect an intentionally deleted category');

  await store.resetOfflineStore();
  const api = loadApi(store);
  api.setOfflineMode(true);
  assert.equal((await api.Criancas.listar()).data.criancas.length, 1, 'screen API loads profiles in offline mode');
  const created = await api.Criancas.criar(1, 'API offline', '🧒');
  const apiChildId = created.data.id_crianca;
  const apiCategories = (await api.Categorias.listar(apiChildId)).data.categorias;
  const apiWords = (await api.Pictogramas.listar(apiCategories[0].id_categoria)).data.falas;
  assert.equal(apiWords.length, 5, 'screen APIs load starter pictograms offline');
  const apiWord = await api.Pictogramas.criar({ id_categoria: apiCategories[0].id_categoria, texto: 'API nova fala', emoji: '✨' });
  await api.Pictogramas.atualizar({ id_fala: apiWord.data.id_fala, texto: 'API fala editada' });
  await api.Pictogramas.remover(apiWord.data.id_fala, 1);
  const favorite = await api.Frases.salvar({ crianca_id: apiChildId, texto: 'API favorito' });
  assert.equal((await api.Frases.listar(apiChildId)).data.frases.some((x) => x.id_frase === favorite.data.id_frase), true, 'favorites screen APIs save and list offline');
  await api.Frases.remover(favorite.data.id_frase, { usuario_id: 1 });

  const routine = await api.Rotinas.criar({ crianca_id: apiChildId, atividade: 'API rotina', horario: '10:00', dias_semana: ['Segunda'] });
  assert.equal((await api.Rotinas.listar(apiChildId, 'Segunda')).data.rotinas.some((x) => x.id_rotina === routine.data.id_rotina), true, 'routine screen APIs create/list offline');
  await api.Rotinas.concluir(routine.data.id_rotina);
  await api.Rotinas.atualizar({ id_rotina: routine.data.id_rotina, atividade: 'API rotina editada' });
  assert.equal((await api.Rotinas.listar(apiChildId, 'Segunda')).data.rotinas.find((x) => x.id_rotina === routine.data.id_rotina).concluida_hoje, true, 'screen API preserves completion state');
  await api.Rotinas.remover(routine.data.id_rotina, 1);

  const reminder = await api.Lembretes.criar({ crianca_id: apiChildId, texto: 'API lembrete', recorrencia: 'diaria' });
  await api.Lembretes.alternarFeito(reminder.data.id_lembrete, true);
  assert.equal((await api.Lembretes.listar(apiChildId)).data.lembretes.find((x) => x.id_lembrete === reminder.data.id_lembrete).feito, true, 'reminder screen APIs save state offline');
  await api.Lembretes.remover(reminder.data.id_lembrete, 1);

  const avis = await api.Avisos.criar({ crianca_id: apiChildId, titulo: 'API aviso', mensagem: 'Só neste aparelho' });
  assert.equal(avis.data.offline, true, 'offline notice response is clearly marked local-only');
  await api.Avisos.marcarLido(avis.data.id_aviso);
  await api.Avisos.atualizar({ id_aviso: avis.data.id_aviso, mensagem: 'API aviso editado' });
  await api.Avisos.remover(avis.data.id_aviso);
  await api.Mood.registrar({ crianca_id: apiChildId, humor: 'feliz', emoji: '😄' });
  await api.Historico.registrar({ crianca_id: apiChildId, texto: 'API fala', tipo: 'favorito' });
  assert.ok((await api.Monitoramento.resumo(apiChildId, 7)).data.total_falas > 0, 'monitoring API returns local usage');
  const hardware = await api.Hardware.configurarBotao(2, 'andar.mp3', 'Andar');
  assert.equal(hardware.data.offline, true, 'hardware setting is marked as local in offline mode');
  assert.equal((await api.Hardware.listarConfiguracoes()).data.botoes.length, 1, 'hardware panel APIs list local settings');
  assert.equal((await api.Hardware.ativarSistema()).data.offline, true, 'hardware panel does not imply a physical server was reached');
  assert.ok((await api.Uploads.enviarImagemPictograma('content://picker/api.jpg')).data.url.startsWith('file:///test-documents/'), 'image-picker API persists a local image');

  console.log('PASS: touch behavior; shared long phrase draft across categories; add/remove/clear and text output; offline APIs, storage and persistence.');
})().catch((error) => { console.error(error); process.exitCode = 1; });
