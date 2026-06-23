import React, { useState, useEffect, useRef } from 'react';
import {
 View, Text, StyleSheet, TouchableOpacity, TextInput,
 ScrollView, Alert, FlatList, SafeAreaView, StatusBar,
 Platform, KeyboardAvoidingView, ActivityIndicator,
 Animated, LayoutAnimation, UIManager, Dimensions, PixelRatio, Image
} from 'react-native';
import axios from 'axios';
import { NativeModules } from 'react-native';
import * as Speech from 'expo-speech';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const scale = SCREEN_WIDTH / 375;
const { SystemCommands } = NativeModules;

function normalize(size) {
 const newSize = size * scale;
 if (Platform.OS === 'ios') {
 return Math.round(PixelRatio.roundToNearestPixel(newSize));
 } else {
 return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 2;
 }
}

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
UIManager.setLayoutAnimationEnabledExperimental(true);
}

const API_URL = 'http://10.239.0.44/tcc_php/';

const THEMES = {
 light: {
 fundo: '#FDFCF0', primaria: '#BDE0FE', secundaria: '#A2D2FF', destaque: '#FFC8DD',
 sucesso: '#C1E1C1', erro: '#FFADAD', alerta: '#FDFFB6', roxoSuave: '#CDB4DB',
 texto: '#4A4A4A', subtexto: '#8D99AE', branco: '#FFFFFF', cinza: '#F8F9FA', cinzaMedio: '#E0E0E0',
 },
 dark: {
 fundo: '#1A1A1A', primaria: '#2C3E50', secundaria: '#34495E', destaque: '#E91E63',
 sucesso: '#27AE60', erro: '#C0392B', alerta: '#F1C40F', roxoSuave: '#8E44AD',
 texto: '#ECF0F1', subtexto: '#BDC3C7', branco: '#2C3E50', cinza: '#222222', cinzaMedio: '#333333',
 }
};

let C = THEMES.light;

const DIAS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

const CATEGORIAS_FIXAS = [
 { id_categoria: 1, nome_categoria: 'Comida', emoji: '🍎', cor: '#FFADAD' },
 { id_categoria: 2, nome_categoria: 'Perguntas', emoji: '❓', cor: '#BDE0FE' },
 { id_categoria: 3, nome_categoria: 'Ações', emoji: '🏃', cor: '#C1E1C1' },
 { id_categoria: 4, nome_categoria: 'Sentimento', emoji: '😊', cor: '#FDFFB6' },
 { id_categoria: 5, nome_categoria: 'Social', emoji: '👋', cor: '#FFC8DD' },
 { id_categoria: 6, nome_categoria: 'Algo errado', emoji: '❌', cor: '#FFB7B2' },
 { id_categoria: 7, nome_categoria: 'Afirmação', emoji: '✅', cor: '#B9FBC0' },
 { id_categoria: 8, nome_categoria: 'Localização', emoji: '🏠', cor: '#A2D2FF' },
 { id_categoria: 9, nome_categoria: 'Lazer', emoji: '🎮', cor: '#CDB4DB' },
];

const PICTOGRAMAS_FIXOS = {
 1: [
 { id: 101, texto: 'Melancia', emoji: '🍉' }, { id: 102, texto: 'Batata frita', emoji: '🍟' }, { id: 103, texto: 'Carne', emoji: '🥩' },
 { id: 104, texto: 'Cenoura', emoji: '🥕' }, { id: 105, texto: 'Milho', emoji: '🌽' }, { id: 106, texto: 'Pipoca', emoji: '🍿' },
 { id: 107, texto: 'Bento', emoji: '🍱' }, { id: 108, texto: 'Ovo', emoji: '🍳' }, { id: 109, texto: 'Donut', emoji: '🍩' },
 { id: 110, texto: 'Chocolate', emoji: '🍫' }, { id: 111, texto: 'Leite', emoji: '🥛' }, { id: 112, texto: 'Suco', emoji: '🧃' },
 ],
 2: [
 { id: 201, texto: 'O que é isso?', emoji: '❓' }, { id: 202, texto: 'Onde está?', emoji: '📍' }, { id: 203, texto: 'Quem escolhe?', emoji: '👤' },
 { id: 204, texto: 'Qual você quer?', emoji: '🤔' }, { id: 205, texto: 'Por que?', emoji: '❔' }, { id: 206, texto: 'Pronto?', emoji: '🏁' },
 { id: 207, texto: 'Está certo?', emoji: '✅' }, { id: 208, texto: 'Quanto falta?', emoji: '⏳' }, { id: 209, texto: 'Onde vamos?', emoji: '🚗' },
 { id: 210, texto: 'Pode pegar?', emoji: '🤲' }, { id: 211, texto: 'Você gosta?', emoji: '❤️' }, { id: 212, texto: 'Você me ajuda?', emoji: '🤝' },
 ],
 3: [
 { id: 301, texto: 'Andar', emoji: '🚶' }, { id: 302, texto: 'Correr', emoji: '🏃' }, { id: 303, texto: 'Ir', emoji: '🚶‍♂️' },
 { id: 304, texto: 'Pegar', emoji: '🤲' }, { id: 305, texto: 'Receber', emoji: '🙌' }, { id: 306, texto: 'Dar', emoji: '💁‍♂️' },
 { id: 307, texto: 'Parar', emoji: '🛑' }, { id: 308, texto: 'Comprar', emoji: '🛍️' }, { id: 309, texto: 'Passear', emoji: '🚗' },
 { id: 310, texto: 'Escolher', emoji: '⁉️' }, { id: 311, texto: 'Sentar', emoji: '🪑' }, { id: 312, texto: 'Sair', emoji: '↩️' },
 ],
 4: [
 { id: 401, texto: 'Estou feliz', emoji: '😊' }, { id: 402, texto: 'Estou triste', emoji: '😢' }, { id: 403, texto: 'Estou alegre', emoji: '😄' },
 { id: 404, texto: 'Estou com sede', emoji: '😫' }, { id: 405, texto: 'Estou cansado', emoji: '😫' }, { id: 406, texto: 'Estou bem', emoji: '🙂' },
 { id: 407, texto: 'Estou mal', emoji: '🙁' }, { id: 408, texto: 'Eu quero ajuda', emoji: '🙋‍♂️' }, { id: 409, texto: 'Estou animado', emoji: '🤩' },
 { id: 410, texto: 'Estou com fome', emoji: '😋' }, { id: 411, texto: 'Estou com frio', emoji: '🥶' }, { id: 412, texto: 'Estou com dor', emoji: '🤕' },
 ],
 5: [
 { id: 501, texto: 'Olá', emoji: '👋' }, { id: 502, texto: 'Tchau', emoji: '👋' }, { id: 503, texto: 'Obrigado', emoji: '🤝' },
 { id: 504, texto: 'Desculpe', emoji: '😔' }, { id: 505, texto: 'Por favor', emoji: '🙏' }, { id: 506, texto: 'Com licença', emoji: '👥' },
 { id: 507, texto: 'Muito prazer', emoji: '🤝' }, { id: 508, texto: 'Saúde', emoji: '🥂' }, { id: 509, texto: 'Como você está?', emoji: '🙋‍♀️' },
 { id: 510, texto: 'Bom dia', emoji: '☀️' }, { id: 511, texto: 'Boa tarde', emoji: '🌤️' }, { id: 512, texto: 'Boa noite', emoji: '🌙' },
 ],
 6: [
 { id: 601, texto: 'Está errado', emoji: '🚫' }, { id: 602, texto: 'Não quero', emoji: '🙅‍♂️' }, { id: 603, texto: 'Pare', emoji: '✋' },
 { id: 604, texto: 'Estou confuso', emoji: '😵' }, { id: 605, texto: 'Estou bravo', emoji: '😡' }, { id: 606, texto: 'Está ruim', emoji: '🤢' },
 { id: 607, texto: 'Está difícil', emoji: '⚒️' }, { id: 608, texto: 'Não gosto', emoji: '👎' }, { id: 609, texto: 'Não entendi', emoji: '❓' },
 { id: 610, texto: 'Onde está errado?', emoji: '⚒️' }, { id: 611, texto: 'Tem um problema', emoji: '⚠️' }, { id: 612, texto: 'Espere', emoji: '⏳' },
 ],
 7: [
 { id: 701, texto: 'Sim', emoji: '✅' }, { id: 702, texto: 'Não', emoji: '❌' }, { id: 703, texto: 'Talvez', emoji: '🤔' },
 { id: 704, texto: 'Está bom', emoji: '👍' }, { id: 705, texto: 'Eu aceito', emoji: '✔️' }, { id: 706, texto: 'Já fiz', emoji: '🔘' },
 { id: 707, texto: 'Eu entendi', emoji: '👈' }, { id: 708, texto: 'Eu quero', emoji: '🤩' }, { id: 709, texto: 'Eu concordo', emoji: '🤝' },
 { id: 710, texto: 'Obrigado(a)', emoji: '🙏' }, { id: 711, texto: 'Quero mais', emoji: '➕' }, { id: 712, texto: 'Eu gosto', emoji: '😋' },
 ],
 8: [
 { id: 801, texto: 'Quero banheiro', emoji: '🚻' }, { id: 802, texto: 'Quero casa', emoji: '🏠' }, { id: 803, texto: 'Quero escola', emoji: '🏫' },
 { id: 804, texto: 'Quero o quarto', emoji: '🛏️' }, { id: 805, texto: 'Quero a sala', emoji: '🛋️' }, { id: 806, texto: 'Quero a cozinha', emoji: '🚪' },
 { id: 807, texto: 'Vamos lá', emoji: '➡️' }, { id: 808, texto: 'Quero rua', emoji: '🪑' }, { id: 809, texto: 'Onde estamos?', emoji: '📍' },
 { id: 810, texto: 'Vamos almoçar', emoji: '🍽️' }, { id: 811, texto: 'Quero ir', emoji: '📌' }, { id: 812, texto: 'Minha casa', emoji: '🏠' },
 ],
 9: [
 { id: 901, texto: 'Quero brincar', emoji: '🧸' }, { id: 902, texto: 'Quero jogar', emoji: '🎮' }, { id: 903, texto: 'Quero música', emoji: '🎵' },
 { id: 904, texto: 'Quero ler', emoji: '📖' }, { id: 905, texto: 'Quero desenhar', emoji: '🎨' }, { id: 906, texto: 'Quero parque', emoji: '🌳' },
 { id: 907, texto: 'Quero TV', emoji: '📺' }, { id: 908, texto: 'Quero cinema', emoji: '🎬' }, { id: 909, texto: 'Quero videogame', emoji: '📺' },
 { id: 910, texto: 'Quero nadar', emoji: '🏊' }, { id: 911, texto: 'Quero pintar', emoji: '✏️' }, { id: 912, texto: 'Quero dormir', emoji: '😴' },
 ],
};

let configGlobal = { volume: 0.8, voz: 'feminina' };

const falarTexto = (texto) => {
 // Ajuste de pitch baseado no tipo de voz
 const pitch = configGlobal.voz === 'feminina' ? 1.2 : 0.8;
 Speech.speak(texto, {
 language: 'pt-BR',
 pitch: pitch,
 rate: 0.85,
 volume: configGlobal.volume
 });
};

// ─────────────────────────────────────────
// COMPONENTES REUTILIZÁVEIS
// ─────────────────────────────────────────

function TopBar({ titulo, onVoltar, onAcao, iconeAcao, logoMode }) {
 return (
 <View style={s.topBar}>
 {logoMode ? (
 <View style={s.logoWrap}>
 <Image
 style={s.logoEmoji}
 source={require("./assets/image.png")}
 />
 <Text style={s.logoTexto}>M.O.T.I.O.N</Text>
 </View>
 ) : (
 <TouchableOpacity onPress={onVoltar} style={s.topBarBtn}>
 <Text style={s.topBarBtnTxt}>←</Text>
 </TouchableOpacity>
 )}
 {titulo ? <Text style={s.topBarTitulo} numberOfLines={1}>{titulo}</Text> : <View style={{ flex: 1 }} />}
 {onAcao ? (
 <TouchableOpacity onPress={onAcao} style={s.topBarBtn}>
 <Text style={s.topBarBtnTxt}>{iconeAcao || '+'}</Text>
 </TouchableOpacity>
 ) : (
 <View style={{ width: normalize(44) }} />
 )}
 </View>
 );
}

function BotaoVoltar({ onPress }) {
 return (
 <TouchableOpacity style={s.botaoVoltar} onPress={onPress}>
 <Text style={s.botaoVoltarTxt}>Voltar</Text>
 </TouchableOpacity>
 );
}

// ─────────────────────────────────────────
// TELA LOGIN
// ─────────────────────────────────────────
function TelaLogin({ onLogin, onCadastro }) {
 const [email, setEmail] = useState('');
 const [senha, setSenha] = useState('');
 const [loading, setLoading] = useState(false);

 const handleLogin = async () => {
 if (!email || !senha) { Alert.alert('Atenção', 'Preencha email e senha'); return; }
 setLoading(true);
 try {
 const res = await axios.post(API_URL + 'login.php', { email, senha });
 if (res.data.success) {
 onLogin(res.data.usuario);
 } else {
Alert.alert('Erro', res.data.message || 'Dados incorretos');
 }
 } catch (err) {
Alert.alert('Erro', 'Não foi possível conectar ao servidor');
 } finally { setLoading(false); }
 };

 return (
 <SafeAreaView style={{ flex: 1, backgroundColor: C.primaria }}>
 <StatusBar barStyle="dark-content" backgroundColor={C.primaria} />
 <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
 <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
 <View style={s.loginTopo}>
 <Text style={s.loginEmoji}>🧠</Text>
 <Text style={s.loginAppNome}>M.O.T.I.O.N</Text>
 </View>
 <View style={s.loginCard}>
 <Text style={s.loginCardTitulo}>Bem-vindo!</Text>
 <Text style={s.loginLabel}>EMAIL</Text>
 <TextInput style={s.loginInput} placeholder="seu@email.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
 <Text style={s.loginLabel}>SENHA</Text>
 <TextInput style={s.loginInput} placeholder="******" value={senha} onChangeText={setSenha} secureTextEntry />
 <TouchableOpacity style={s.loginBotao} onPress={handleLogin} disabled={loading}>
 {loading ? <ActivityIndicator color={C.branco} /> : <Text style={s.loginBotaoTxt}>Entrar</Text>}
 </TouchableOpacity>
 <TouchableOpacity onPress={onCadastro} style={{ marginTop: normalize(25), alignItems: 'center' }}>
 <Text style={s.loginLink}>Criar uma conta nova</Text>
 </TouchableOpacity>
 </View>
 </ScrollView>
 </KeyboardAvoidingView>
 </SafeAreaView>
 );
}

// ─────────────────────────────────────────
// TELA CADASTRO
// ─────────────────────────────────────────
function TelaCadastro({ onVoltar }) {
 const [nome, setNome] = useState('');
 const [email, setEmail] = useState('');
 const [senha, setSenha] = useState('');
 const [confirmar, setConfirmar] = useState('');
 const [nomeDep, setNomeDep] = useState('');
 const [loading, setLoading] = useState(false);

 const handleCadastro = async () => {
 if (!nome || !email || !senha) { Alert.alert('Erro', 'Preencha os campos obrigatórios'); return; }
 if (senha !== confirmar) { Alert.alert('Erro', 'As senhas não coincidem'); return; }
 setLoading(true);
 try {
 const res = await axios.post(API_URL + 'cadastrar.php', { nome, email, senha, nome_dependente: nomeDep });
 if (res.data.success) {
Alert.alert('Sucesso! ✨', 'Cadastro realizado!', [{ text: 'OK', onPress: onVoltar }]);
 } else {
Alert.alert('Erro', res.data.message);
 }
 } catch (err) {
Alert.alert('Erro', 'Falha na conexão');
 } finally { setLoading(false); }
 };

 return (
 <SafeAreaView style={{ flex: 1, backgroundColor: C.fundo }}>
 <StatusBar barStyle="dark-content" backgroundColor={C.primaria} />
 <View style={s.cadastroHeader}><Text style={s.cadastroHeaderTitulo}>Novo Cadastro</Text></View>
 <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
 <ScrollView contentContainerStyle={s.cadastroScroll}>
 <Text style={s.cadastroLabel}>EMAIL *</Text>
 <TextInput style={s.cadastroInput} placeholder="seu@email.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
 <Text style={s.cadastroLabel}>NOME *</Text>
 <TextInput style={s.cadastroInput} placeholder="Seu nome completo" value={nome} onChangeText={setNome} />
 <Text style={s.cadastroLabel}>SENHA *</Text>
 <TextInput style={s.cadastroInput} placeholder="Mínimo 6 caracteres" value={senha} onChangeText={setSenha} secureTextEntry />
 <Text style={s.cadastroLabel}>CONFIRMAR SENHA *</Text>
 <TextInput style={s.cadastroInput} placeholder="Repita a senha" value={confirmar} onChangeText={setConfirmar} secureTextEntry />
 <Text style={s.cadastroLabel}>NOME DO DEPENDENTE</Text>
 <TextInput style={s.cadastroInput} placeholder="Nome da criança" value={nomeDep} onChangeText={setNomeDep} />
 <TouchableOpacity style={s.cadastroBotao} onPress={handleCadastro} disabled={loading}>
 {loading ? <ActivityIndicator color={C.branco} /> : <Text style={s.cadastroBotaoTxt}>Salvar</Text>}
 </TouchableOpacity>
 </ScrollView>
 </KeyboardAvoidingView>
 <BotaoVoltar onPress={onVoltar} />
 </SafeAreaView>
 );
}

// ─────────────────────────────────────────
// TELA MENU
// ─────────────────────────────────────────
function TelaMenu({ usuario, onNavegar, onLogout }) {
 const cards = [
 { tela: 'comunicacao', emoji: '💬', label: 'Comunicação', cor: C.primaria },
 { tela: 'frases', emoji: '⭐', label: 'Favoritos', cor: C.destaque },
 { tela: 'rotinas', emoji: '📅', label: 'Agenda', cor: C.sucesso },
 { tela: 'lembrete', emoji: '🔔', label: 'Lembrete', cor: C.alerta },
 { tela: 'historico', emoji: '🕐', label: 'Histórico', cor: C.roxoSuave },
 { tela: 'botao_hardware', emoji: '🔘', label: 'Botão Hardware', cor: C.sucesso }, // NOVA OPÇÃO
 { tela: 'configuracoes', emoji: '⚙️', label: 'Ajustes', cor: C.cinzaMedio },
 ];

 return (
 <SafeAreaView style={{ flex: 1, backgroundColor: C.fundo }}>
 <StatusBar barStyle="dark-content" backgroundColor={C.primaria} />
 <TopBar logoMode />
 <ScrollView contentContainerStyle={s.menuScroll}>
 <View style={s.menuHeader}>
 <Text style={s.menuOla}>Olá, {usuario?.nome || 'Usuário'}! 👋</Text>
 <TouchableOpacity onPress={onLogout}><Text style={s.menuSair}>Sair</Text></TouchableOpacity>
 </View>
 <View style={s.menuGrid}>
 {cards.map((c, i) => (
 <TouchableOpacity key={i} style={[s.menuCard, { backgroundColor: c.cor }]} onPress={() => onNavegar(c.tela)}>
 <Text style={s.menuCardEmoji}>{c.emoji}</Text>
 <Text style={s.menuCardLabel}>{c.label}</Text>
 </TouchableOpacity>
 ))}
 </View>
 </ScrollView>
 </SafeAreaView>
 );
}

// ─────────────────────────────────────────
// TELA COMUNICAÇÃO
// ─────────────────────────────────────────
function TelaComunicacao({ onVoltar, onCategoria, visibilidade, toggleVisibilidade }) {
 return (
 <SafeAreaView style={{ flex: 1, backgroundColor: C.fundo }}>
 <StatusBar barStyle="dark-content" backgroundColor={C.primaria} />
 <TopBar titulo="COMUNICAÇÃO" onVoltar={onVoltar} />
 <ScrollView contentContainerStyle={s.catScroll}>
 <View style={s.catGrid}>
 {CATEGORIAS_FIXAS.map(cat => (
 <TouchableOpacity
 key={cat.id_categoria}
 style={[s.catCard, { backgroundColor: cat.cor }, visibilidade[`cat_${cat.id_categoria}`] === false && s.cardInvisivel]}
 onPress={() => onCategoria(cat)}
 onLongPress={() => toggleVisibilidade('cat', cat.id_categoria)}
 >
 <Text style={s.catEmoji}>{cat.emoji}</Text>
 <Text style={s.catLabel}>{cat.nome_categoria}</Text>
 <View style={[s.eyeIconSmall, {backgroundColor: visibilidade[`cat_${cat.id_categoria}`] === false ? C.erro : C.sucesso}]}>
 <Text style={s.eyeTxtSmall}>{visibilidade[`cat_${cat.id_categoria}`] === false ? '✕' : '✓'}</Text>
 </View>
 </TouchableOpacity>
 ))}
 </View>
 </ScrollView>
 <BotaoVoltar onPress={onVoltar} />
 </SafeAreaView>
 );
}

// ─────────────────────────────────────────
// TELA CATEGORIA (PICTOGRAMAS)
// ─────────────────────────────────────────
function TelaCategoria({ usuario, categoria, onVoltar, fraseAtual, setFraseAtual, visibilidade, toggleVisibilidade }) {
 const falarEGravar = async (item) => {
 falarTexto(item.texto);
 setFraseAtual([...fraseAtual, item]);
 try {
 await axios.post(API_URL + 'historico.php', { usuario_id: usuario?.id_usuario, texto: item.texto, emoji: item.emoji });
 } catch {}
 };

 const salvarFrase = async () => {
 if (fraseAtual.length === 0) return;
 const textoCompleto = fraseAtual.map(f => f.texto).join(' ');
 try {
 await axios.post(API_URL + 'frases.php', { usuario_id: usuario?.id_usuario, texto: textoCompleto });
Alert.alert('Sucesso', 'Frase salva nos favoritos! ⭐');
 } catch {}
 };

 return (
 <SafeAreaView style={{ flex: 1, backgroundColor: C.fundo }}>
 <StatusBar barStyle="dark-content" backgroundColor={C.primaria} />
 <TopBar titulo={categoria.nome_categoria} onVoltar={onVoltar} />

 <View style={s.falaBarMaster}>
 <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{flex: 1}}>
 {fraseAtual.length > 0 ?
 fraseAtual.map((f, i) => (
 <View key={i} style={s.fraseEmojiBox}><Text style={{fontSize: normalize(24)}}>{f.emoji}</Text></View>
 )) :
 <Text style={s.falaBarTxt}>Toque nos pictogramas...</Text>
 }
 </ScrollView>
 <TouchableOpacity style={[s.falaBarBtn, {backgroundColor: C.destaque}]} onPress={salvarFrase}><Text style={s.falaBarBtnTxt}>⭐</Text></TouchableOpacity>
 <TouchableOpacity style={[s.falaBarBtn, {backgroundColor: C.erro, marginLeft: 8}]} onPress={() => setFraseAtual([])}><Text style={s.falaBarBtnTxt}>🗑️</Text></TouchableOpacity>
 <TouchableOpacity style={[s.falaBarBtn, {backgroundColor: C.sucesso, marginLeft: 8}]} onPress={() => falarTexto(fraseAtual.map(f => f.texto).join(' '))}><Text style={s.falaBarBtnTxt}>🔊</Text></TouchableOpacity>
 </View>

 <ScrollView contentContainerStyle={s.pictoScroll}>
 <View style={s.pictoGrid}>
 {PICTOGRAMAS_FIXOS[categoria.id_categoria]?.map(item => (
 <TouchableOpacity
 key={item.id}
 style={[s.pictoCard, visibilidade[`picto_${item.id}`] === false && s.cardInvisivel]}
 onPress={() => falarEGravar(item)}
 onLongPress={() => toggleVisibilidade('picto', item.id)}
 >
 <Text style={s.pictoEmoji}>{item.emoji}</Text>
 <Text style={s.pictoLabel}>{item.texto}</Text>
 <View style={[s.eyeIconSmall, {backgroundColor: visibilidade[`picto_${item.id}`] === false ? C.erro : C.sucesso}]}>
 <Text style={s.eyeTxtSmall}>{visibilidade[`picto_${item.id}`] === false ? '✕' : '✓'}</Text>
 </View>
 </TouchableOpacity>
 ))}
 </View>
 </ScrollView>
 <BotaoVoltar onPress={onVoltar} />
 </SafeAreaView>
 );
}

// ─────────────────────────────────────────
// TELA ROTINAS
// ─────────────────────────────────────────
function TelaRotinas({ usuario, onVoltar }) {
 const [rotinas, setRotinas] = useState([]);
 const [loading, setLoading] = useState(false);

 const carregar = () => {
 setLoading(true);
 axios.get(API_URL + 'rotinas.php', { params: { usuario_id: usuario?.id_usuario } })
 .then(r => { if (r.data.success) setRotinas(r.data.rotinas); })
 .catch(() => {})
 .finally(() => setLoading(false));
 };

 useEffect(() => { carregar(); }, []);

 return (
 <SafeAreaView style={{ flex: 1, backgroundColor: C.fundo }}>
 <StatusBar barStyle="dark-content" backgroundColor={C.primaria} />
 <TopBar titulo="MINHA ROTINA" onVoltar={onVoltar} />
 <ScrollView contentContainerStyle={{ padding: normalize(16) }}>
 {loading ? <ActivityIndicator color={C.secundaria} /> :
 rotinas.map((r, i) => (
 <View key={i} style={s.rotinaItem}>
 <Text style={s.rotinaHora}>{r.hora}</Text>
 <Text style={s.rotinaTexto}>{r.atividade}</Text>
 </View>
 ))
 }
 {!loading && rotinas.length === 0 && <Text style={s.vazio}>Nenhuma rotina para hoje! ☀️</Text>}
 </ScrollView>
 <BotaoVoltar onPress={onVoltar} />
 </SafeAreaView>
 );
}

// ─────────────────────────────────────────
// TELA LEMBRETES
// ─────────────────────────────────────────
function TelaLembretes({ usuario, onVoltar }) {
 const [lembretes, setLembretes] = useState([]);
 const [novoLembrete, setNovoLembrete] = useState('');
 const [loading, setLoading] = useState(false);

 const carregar = () => {
 setLoading(true);
 axios.get(API_URL + 'lembretes.php', { params: { usuario_id: usuario?.id_usuario } })
 .then(r => { if (r.data.success) setLembretes(r.data.lembretes); })
 .catch(() => {})
 .finally(() => setLoading(false));
 };

 useEffect(() => { carregar(); }, []);

 const adicionar = async () => {
 if (!novoLembrete) return;
 try {
 await axios.post(API_URL + 'lembretes.php', { usuario_id: usuario?.id_usuario, texto: novoLembrete });
 setNovoLembrete(''); carregar();
 } catch {}
 };

 const toggleFeito = async (item) => {
 try {
 await axios.put(API_URL + 'lembretes.php', { id_lembrete: item.id_lembrete, feito: !item.feito });
 carregar();
 } catch {}
 };

 const deletar = async (id) => {
 try {
 await axios.delete(API_URL + 'lembretes.php', { data: { id_lembrete: id } });
 carregar();
 } catch {}
 };

 return (
 <SafeAreaView style={{ flex: 1, backgroundColor: C.fundo }}>
 <StatusBar barStyle="dark-content" backgroundColor={C.primaria} />
 <TopBar titulo="MEUS LEMBRETES" onVoltar={onVoltar} />

 <View style={s.agendaInputContainer}>
 <View style={s.inputRow}>
 <TextInput style={[s.inputField, { flex: 1 }]} placeholder="Lembrar de..." value={novoLembrete} onChangeText={setNovoLembrete} />
 <TouchableOpacity style={s.addBotao} onPress={adicionar}><Text style={s.addBotaoTxt}>+</Text></TouchableOpacity>
 </View>
 </View>

 <ScrollView contentContainerStyle={{ padding: normalize(16) }}>
 {loading ? <ActivityIndicator color={C.secundaria} /> :
 lembretes.map(item => (
 <View key={item.id_lembrete} style={[s.lembreteItem, item.feito && s.lembreteFeito]}>
 <TouchableOpacity style={s.checkbox} onPress={() => toggleFeito(item)}>
 {item.feito && <Text style={{color: C.branco, fontWeight: 'bold'}}>✓</Text>}
 </TouchableOpacity>
 <Text style={[s.lembreteTexto, item.feito && s.lembreteTextoFeito]}>{item.texto}</Text>
 <TouchableOpacity onPress={() => deletar(item.id_lembrete)}><Text style={s.rotinaDelete}>×</Text></TouchableOpacity>
 </View>
 ))
 }
 {!loading && lembretes.length === 0 && <Text style={s.vazio}>Nenhum lembrete por enquanto! 🔔</Text>}
 </ScrollView>
 <BotaoVoltar onPress={onVoltar} />
 </SafeAreaView>
 );
}

// ─────────────────────────────────────────
// TELA FRASES SALVAS
// ─────────────────────────────────────────
function TelaFrases({ usuario, onVoltar }) {
 const [frases, setFrases] = useState([]);
 const carregar = () => {
 axios.get(API_URL + 'frases.php', { params: { usuario_id: usuario?.id_usuario } })
 .then(r => { if (r.data.success) setFrases(r.data.frases); })
 .catch(() => {});
 };
 useEffect(() => { carregar(); }, []);
 const deletar = async (id) => {
 try {
 await axios.delete(API_URL + 'frases.php', { data: { id_frase: id } });
 carregar();
 } catch {}
 };
 return (
 <SafeAreaView style={{ flex: 1, backgroundColor: C.fundo }}>
 <StatusBar barStyle="dark-content" backgroundColor={C.primaria} />
 <TopBar titulo="MEUS FAVORITOS" onVoltar={onVoltar} />
 <ScrollView contentContainerStyle={{ padding: normalize(16) }}>
 {frases.map(f => (
 <View key={f.id_frase} style={s.histItem}>
 <TouchableOpacity style={{flex: 1}} onPress={() => falarTexto(f.texto)}>
 <Text style={s.histTxt}>{f.texto}</Text>
 </TouchableOpacity>
 <TouchableOpacity onPress={() => deletar(f.id_frase)}><Text style={{fontSize: normalize(24)}}>🗑️</Text></TouchableOpacity>
 </View>
 ))}
 {frases.length === 0 && <Text style={s.vazio}>Salve suas frases favoritas aqui! ⭐</Text>}
 </ScrollView>
 <BotaoVoltar onPress={onVoltar} />
 </SafeAreaView>
 );
}

// ─────────────────────────────────────────
// TELA HISTÓRICO
// ─────────────────────────────────────────
function TelaHistorico({ usuario, onVoltar }) {
 const [historico, setHistorico] = useState([]);
 const [loading, setLoading] = useState(false);

 const carregar = () => {
 setLoading(true);
 axios.get(API_URL + 'historico.php', { params: { usuario_id: usuario?.id_usuario } })
 .then(r => { if (r.data.success) setHistorico(r.data.historico); })
 .catch(() => {})
 .finally(() => setLoading(false));
 };

 useEffect(() => { carregar(); }, []);

 return (
 <SafeAreaView style={{ flex: 1, backgroundColor: C.fundo }}>
 <StatusBar barStyle="dark-content" backgroundColor={C.primaria} />
 <TopBar titulo="O QUE EU DISSE" onVoltar={onVoltar} />
 <ScrollView contentContainerStyle={{ padding: normalize(16) }}>
 {loading ? <ActivityIndicator color={C.secundaria} /> :
 historico.map((h, i) => (
 <TouchableOpacity key={i} style={s.histItem} onPress={() => falarTexto(h.texto)}>
 <Text style={s.histEmoji}>{h.emoji?.split(' ')[0] || '💬'}</Text>
 <View style={{flex: 1}}>
 <Text style={s.histTxt}>{h.texto}</Text>
 <Text style={s.histHora}>{h.data_uso}</Text>
 </View>
 </TouchableOpacity>
 ))
 }
 {!loading && historico.length === 0 && <Text style={s.vazio}>Nenhuma fala registrada ainda. 🗣️</Text>}
 </ScrollView>
 <BotaoVoltar onPress={onVoltar} />
 </SafeAreaView>
 );
}

// ─────────────────────────────────────────
// TELA BOTÃO HARDWARE (NOVA)
// ─────────────────────────────────────────
function TelaBotaoHardware({ onVoltar }) {
 const [botaoConfigSel, setBotaoConfigSel] = useState(null);
 const [loading, setLoading] = useState(false);

 const botoesHardware = [
 { id: 1, label: 'Vermelho', cor: '#FF0000' },
 { id: 2, label: 'Amarelo', cor: '#FFFF00' },
 { id: 3, label: 'Verde', cor: '#00FF00' },
 { id: 4, label: 'Azul', cor: '#0000FF' },
 { id: 5, label: 'Preto', cor: '#000000' },
 ];

 const opcoesAudio = Array.from({ length: 15 }, (_, i) => `som${i + 1}.mp3`);

const executarBat = async () => {
  setLoading(true);
  try {
    const res = await axios.get('http://10.239.0.44:5000/executar_bat');
    if (res.data.success) {
      Alert.alert("Sucesso", "Sistema de hardware iniciado!");
    } else {
      Alert.alert("Erro", res.data.message);
    }
  } catch (erro) {
    Alert.alert("Erro", "Não foi possível conectar ao Flask.");
    console.log(erro);
  } finally {
    setLoading(false);
  }
};

 const salvarConfigBotao = async (id, audio) => {
 try {
 const formData = new FormData();
 formData.append('id_botao', id);
 formData.append('nome_audio', audio);
 await axios.post(API_URL + 'configurar_botao.php', formData);
Alert.alert("Sucesso", `Botão ${id} configurado!`);
 setBotaoConfigSel(null);
 } catch (e) {
Alert.alert("Erro", "Falha ao salvar configuração.");
 }
 };

 return (
 <SafeAreaView style={{ flex: 1, backgroundColor: C.fundo }}>
 <StatusBar barStyle="dark-content" backgroundColor={C.primaria} />
 <TopBar titulo="HARDWARE" onVoltar={onVoltar} />
 <ScrollView contentContainerStyle={{ padding: normalize(20) }}>
 {!botaoConfigSel ? (
 <View>
 <TouchableOpacity style={s.btnDisparo} onPress={executarBat}>
 {loading ? <ActivityIndicator color={C.branco} /> : <><Text style={{ fontSize: 30 }}>🚀</Text><Text style={s.btnDisparoTxt}>ATIVAR SISTEMA</Text></>}
 </TouchableOpacity>
 <Text style={s.hardwareTitulo}>Configurar Botões Físicos</Text>
 {botoesHardware.map(b => (
 <TouchableOpacity key={b.id} style={s.cardConfig} onPress={() => setBotaoConfigSel(b)}>
 <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
 <View style={[s.circuloCor, { backgroundColor: b.cor }]}>
 <View style={s.brilhoArcade} />
 </View>
 <View>
 <Text style={[s.cardConfigTxt, { textTransform: 'uppercase', letterSpacing: 1 }]}>{b.label}</Text>
 <Text style={{ color: C.subtexto, fontSize: normalize(10) }}>ARCADE MODE</Text>
 </View>
 </View>
 <View style={{ backgroundColor: C.secundaria, padding: 8, borderRadius: 10 }}>
 <Text style={{ color: '#FFF', fontWeight: '900' }}>EDIT</Text>
 </View>
 </TouchableOpacity>
 ))}
 </View>
 ) : (
 <View>
 <TouchableOpacity onPress={() => setBotaoConfigSel(null)} style={{ marginBottom: 20 }}>
 <Text style={{ color: C.secundaria }}>← Voltar para lista</Text>
 </TouchableOpacity>
 <Text style={s.hardwareTitulo}>Botão {botaoConfigSel.label}</Text>
 <Text style={{ color: C.subtexto, marginBottom: 20 }}>Escolha o som:</Text>
 {opcoesAudio.map(audio => (
 <TouchableOpacity key={audio} style={s.opcaoAudio} onPress={() => salvarConfigBotao(botaoConfigSel.id, audio)}>
 <Text style={s.opcaoAudioTxt}>🎵 {audio}</Text>
 </TouchableOpacity>
 ))}
 </View>
 )}
 </ScrollView>
 <BotaoVoltar onPress={onVoltar} />
 </SafeAreaView>
 );
}

// ─────────────────────────────────────────
// TELA AJUSTES
// ─────────────────────────────────────────
function TelaAjustes({ onVoltar, config, setConfig }) {
 const toggleTema = () => {
 setConfig(prev => ({ ...prev, temaEscuro: !prev.temaEscuro }));
 };

 return (
 <SafeAreaView style={{ flex: 1, backgroundColor: C.fundo }}>
 <StatusBar barStyle={config.temaEscuro ? "light-content" : "dark-content"} backgroundColor={C.primaria} />
 <TopBar titulo="AJUSTES" onVoltar={onVoltar} />
 <ScrollView contentContainerStyle={{ padding: normalize(20) }}>

 <View style={s.secaoAjuste}>
 <Text style={s.secaoTitulo}>Voz e Áudio</Text>
 <View style={s.ajusteCard}>
 <Text style={s.ajusteLabel}>Volume da Voz: {Math.round(config.volume * 100)}%</Text>
 <View style={s.sliderFake}>
 <View style={[s.sliderProgresso, { width: `${config.volume * 100}%` }]} />
 <TouchableOpacity style={[s.sliderHandle, { left: `${(config.volume * 100) - 5}%` }]} />
 </View>
 <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
 <TouchableOpacity onPress={() => setConfig(p => ({...p, volume: Math.max(0, p.volume - 0.1)}))} style={s.btnAjusteSmall}><Text style={{color: C.texto}}>-</Text></TouchableOpacity>
 <TouchableOpacity onPress={() => setConfig(p => ({...p, volume: Math.min(1, p.volume + 0.1)}))} style={s.btnAjusteSmall}><Text style={{color: C.texto}}>+</Text></TouchableOpacity>
 </View>
 </View>

 <View style={s.ajusteCard}>
 <Text style={s.ajusteLabel}>Tipo de Voz</Text>
 <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
 <TouchableOpacity
 style={[s.btnOpcao, config.voz === 'feminina' && s.btnOpcaoAtivo]}
 onPress={() => setConfig(p => ({...p, voz: 'feminina'}))}
 >
 <Text style={[s.btnOpcaoTxt, config.voz === 'feminina' && s.btnOpcaoTxtAtivo]}>👩 Feminina</Text>
 </TouchableOpacity>
 <TouchableOpacity
 style={[s.btnOpcao, config.voz === 'masculina' && s.btnOpcaoAtivo]}
 onPress={() => setConfig(p => ({...p, voz: 'masculina'}))}
 >
 <Text style={[s.btnOpcaoTxt, config.voz === 'masculina' && s.btnOpcaoTxtAtivo]}>👨 Masculina</Text>
 </TouchableOpacity>
 </View>
 </View>
 </View>

 <View style={s.secaoAjuste}>
 <Text style={s.secaoTitulo}>Aparência</Text>
 <TouchableOpacity style={s.ajusteCardRow} onPress={toggleTema}>
 <Text style={s.ajusteLabel}>Tema Escuro</Text>
 <View style={[s.switchFake, config.temaEscuro && { backgroundColor: C.sucesso }]}>
 <View style={[s.switchHandle, config.temaEscuro && { alignSelf: 'flex-end' }]} />
 </View>
 </TouchableOpacity>
 </View>

 <View style={s.secaoAjuste}>
 <Text style={s.secaoTitulo}>Sobre</Text>
 <View style={s.ajusteCard}>
 <Text style={{ color: C.texto, fontWeight: '700' }}>M.O.T.I.O.N App</Text>
 <Text style={{ color: C.subtexto }}>Versão 2.4.0 - Arcade Edition</Text>
 </View>
 </View>

 </ScrollView>
 <BotaoVoltar onPress={onVoltar} />
 </SafeAreaView>
 );
}

// ─────────────────────────────────────────
// APP PRINCIPAL
// ─────────────────────────────────────────
export default function App() {
 const [tela, setTela] = useState('login');
 const [usuario, setUsuario] = useState(null);
 const [categoriaAtual, setCategoriaAtual] = useState(null);
 const [fraseAtual, setFraseAtual] = useState([]);
 const [visibilidade, setVisibilidade] = useState({});
 const [config, setConfig] = useState({ volume: 0.8, voz: 'feminina', temaEscuro: false });

 // Atualiza referências globais para funções fora do componente
 configGlobal = { volume: config.volume, voz: config.voz };
 C = config.temaEscuro ? THEMES.dark : THEMES.light;

 const login = (u) => { setUsuario(u); setTela('menu'); };
 const logout = () => { setUsuario(null); setTela('login'); };
 const ir = (t) => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setTela(t); };

 const toggleVisibilidade = (tipo, id) => {
 const chave = `${tipo}_${id}`;
 setVisibilidade(prev => ({ ...prev, [chave]: prev[chave] === false }));
 };

 if (tela === 'login') return <TelaLogin onLogin={login} onCadastro={() => ir('cadastro')} />;
 if (tela === 'cadastro') return <TelaCadastro onVoltar={() => ir('login')} />;
 if (tela === 'menu') return <TelaMenu usuario={usuario} onNavegar={ir} onLogout={logout} />;
 if (tela === 'comunicacao') return <TelaComunicacao onVoltar={() => ir('menu')} onCategoria={(cat) => { setCategoriaAtual(cat); ir('categoria'); }} visibilidade={visibilidade} toggleVisibilidade={toggleVisibilidade} />;
 if (tela === 'categoria' && categoriaAtual) return <TelaCategoria usuario={usuario} categoria={categoriaAtual} onVoltar={() => ir('comunicacao')} fraseAtual={fraseAtual} setFraseAtual={setFraseAtual} visibilidade={visibilidade} toggleVisibilidade={toggleVisibilidade} />;
 if (tela === 'rotinas') return <TelaRotinas usuario={usuario} onVoltar={() => ir('menu')} />;
 if (tela === 'lembrete') return <TelaLembretes usuario={usuario} onVoltar={() => ir('menu')} />;
 if (tela === 'frases') return <TelaFrases usuario={usuario} onVoltar={() => ir('menu')} />;
 if (tela === 'historico') return <TelaHistorico usuario={usuario} onVoltar={() => ir('menu')} />;
 if (tela === 'botao_hardware') return <TelaBotaoHardware onVoltar={() => ir('menu')} />;
 if (tela === 'configuracoes') return <TelaAjustes onVoltar={() => ir('menu')} config={config} setConfig={setConfig} />;
 return null;
}

// ─────────────────────────────────────────
// ESTILOS RESPONSIVOS
// ─────────────────────────────────────────
const s = StyleSheet.create({
 topBar: { backgroundColor: C.primaria, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: normalize(16), paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + normalize(10) : normalize(16), paddingBottom: normalize(16), borderBottomLeftRadius: normalize(25), borderBottomRightRadius: normalize(25) },
 topBarBtn: { width: normalize(44), height: normalize(44), backgroundColor: 'rgba(255,255,255,0.4)', borderRadius: normalize(22), alignItems: 'center', justifyContent: 'center' },
 topBarBtnTxt: { fontSize: normalize(22), color: C.texto, fontWeight: 'bold' },
 topBarTitulo: { fontSize: normalize(18), fontWeight: '900', color: C.texto, flex: 1, textAlign: 'center', letterSpacing: 1 },
 logoWrap: { flexDirection: 'row', alignItems: 'center', gap: normalize(8) },
 logoEmoji: { width: 60, height: 60, resizeMode: 'contain' },
 logoTexto: { fontSize: normalize(20), fontWeight: '900', color: C.texto },
 botaoVoltar: { backgroundColor: C.primaria, paddingVertical: normalize(18), alignItems: 'center', borderTopLeftRadius: normalize(25), borderTopRightRadius: normalize(25) },
 botaoVoltarTxt: { color: C.texto, fontWeight: '900', fontSize: normalize(16), letterSpacing: 1 },
 loginTopo: { alignItems: 'center', paddingTop: normalize(50), paddingBottom: normalize(30) },
 loginEmoji: { fontSize: normalize(80) },
 loginAppNome: { fontSize: normalize(36), fontWeight: '900', color: C.texto, marginTop: normalize(10), letterSpacing: 2 },
 loginCard: { flex: 1, backgroundColor: C.branco, borderTopLeftRadius: normalize(40), borderTopRightRadius: normalize(40), padding: normalize(30), shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 5 },
 loginCardTitulo: { fontSize: normalize(26), fontWeight: '900', color: C.texto, marginBottom: normalize(30), textAlign: 'center' },
 loginLabel: { fontSize: normalize(12), fontWeight: '900', color: C.subtexto, marginBottom: normalize(8), marginLeft: normalize(5) },
 loginInput: { borderRadius: normalize(20), paddingHorizontal: normalize(20), paddingVertical: normalize(15), fontSize: normalize(16), backgroundColor: C.cinza, marginBottom: normalize(20), color: C.texto },
 loginBotao: { backgroundColor: C.secundaria, borderRadius: normalize(25), paddingVertical: normalize(18), alignItems: 'center', marginTop: normalize(10), elevation: 4 },
 loginBotaoTxt: { fontSize: normalize(18), fontWeight: '900', color: C.branco, letterSpacing: 1 },
 loginLink: { color: C.subtexto, fontSize: normalize(14), fontWeight: '700', textDecorationLine: 'underline' },
 cadastroHeader: { backgroundColor: C.primaria, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + normalize(20) : normalize(60), paddingBottom: normalize(20), paddingHorizontal: normalize(25), borderBottomLeftRadius: normalize(30), borderBottomRightRadius: normalize(30) },
 cadastroHeaderTitulo: { fontSize: normalize(24), fontWeight: '900', color: C.texto },
 cadastroScroll: { padding: normalize(25) },
 cadastroLabel: { fontSize: normalize(12), fontWeight: '900', color: C.subtexto, marginBottom: normalize(8), marginTop: normalize(5) },
 cadastroInput: { borderRadius: normalize(20), paddingHorizontal: normalize(20), paddingVertical: normalize(15), fontSize: normalize(16), backgroundColor: C.cinza, marginBottom: normalize(15), color: C.texto },
 cadastroBotao: { backgroundColor: C.sucesso, borderRadius: normalize(25), paddingVertical: normalize(18), alignItems: 'center', marginTop: normalize(15), marginBottom: normalize(10), elevation: 3 },
 cadastroBotaoTxt: { fontSize: normalize(18), fontWeight: '900', color: C.branco },
 menuScroll: { padding: normalize(20) },
 menuHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: normalize(20) },
 menuOla: { fontSize: normalize(18), fontWeight: '900', color: C.texto },
 menuSair: { color: C.erro, fontWeight: '700' },
 menuGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: normalize(16), justifyContent: 'space-between' },
 menuCard: { width: '47%', borderRadius: normalize(30), paddingVertical: normalize(30), alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowOffset: { width: 0, height: 4 }, shadowRadius: 8 },
 menuCardEmoji: { fontSize: normalize(45), marginBottom: normalize(12) },
 menuCardLabel: { fontSize: normalize(16), fontWeight: '900', color: C.texto, textAlign: 'center' },
 catScroll: { padding: normalize(16) },
 catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: normalize(14), justifyContent: 'space-between' },
 catCard: { width: '30%', borderRadius: normalize(25), paddingVertical: normalize(20), alignItems: 'center', gap: normalize(10), elevation: 3 },
 catEmoji: { fontSize: normalize(35) },
 catLabel: { fontSize: normalize(12), fontWeight: '900', color: C.texto, textAlign: 'center' },
 falaBarMaster: { backgroundColor: C.branco, margin: normalize(15), borderRadius: normalize(30), padding: normalize(15), minHeight: normalize(100), flexDirection: 'row', alignItems: 'center', elevation: 5, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
 falaBarTxt: { color: C.subtexto, fontSize: normalize(16), fontStyle: 'italic', flex: 1, textAlign: 'center', fontWeight: '600' },
 falaBarBtn: { width: normalize(48), height: normalize(48), borderRadius: normalize(24), alignItems: 'center', justifyContent: 'center', elevation: 4 },
 falaBarBtnTxt: { fontSize: normalize(20) },
 fraseEmojiBox: { backgroundColor: C.fundo, padding: normalize(8), borderRadius: normalize(15), elevation: 2 },
 pictoScroll: { padding: normalize(14) },
 pictoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: normalize(12), justifyContent: 'space-between' },
 pictoCard: { width: '30%', backgroundColor: C.branco, borderRadius: normalize(25), paddingVertical: normalize(20), paddingHorizontal: normalize(5), alignItems: 'center', gap: normalize(8), elevation: 3 },
 pictoEmoji: { fontSize: normalize(40) },
 pictoLabel: { fontSize: normalize(11), fontWeight: '900', color: C.texto, textAlign: 'center' },
 eyeIconSmall: { position: 'absolute', top: normalize(5), right: normalize(5), width: normalize(22), height: normalize(22), borderRadius: normalize(11), alignItems: 'center', justifyContent: 'center', elevation: 2 },
 eyeTxtSmall: { color: '#FFF', fontSize: normalize(12) },
 cardInvisivel: { opacity: 0.4, backgroundColor: '#E0E0E0' },
 rotinaItem: { backgroundColor: C.branco, padding: normalize(20), borderRadius: normalize(20), marginBottom: normalize(12), flexDirection: 'row', alignItems: 'center', elevation: 2 },
 rotinaHora: { fontSize: normalize(18), fontWeight: '900', color: C.secundaria, marginRight: normalize(15) },
 rotinaTexto: { fontSize: normalize(16), color: C.texto, fontWeight: '700' },
 agendaInputContainer: { padding: normalize(16), backgroundColor: C.primaria, borderBottomLeftRadius: normalize(25), borderBottomRightRadius: normalize(25) },
 inputRow: { flexDirection: 'row', gap: normalize(10) },
 inputField: { backgroundColor: C.branco, borderRadius: normalize(15), paddingHorizontal: normalize(15), paddingVertical: normalize(10) },
 addBotao: { backgroundColor: C.secundaria, width: normalize(44), borderRadius: normalize(15), alignItems: 'center', justifyContent: 'center' },
 addBotaoTxt: { color: C.branco, fontSize: normalize(24), fontWeight: 'bold' },
 lembreteItem: { backgroundColor: C.branco, padding: normalize(15), borderRadius: normalize(20), marginBottom: normalize(10), flexDirection: 'row', alignItems: 'center', elevation: 2 },
 lembreteFeito: { opacity: 0.6 },
 checkbox: { width: normalize(24), height: normalize(24), borderRadius: normalize(6), borderWidth: 2, borderColor: C.secundaria, marginRight: normalize(12), alignItems: 'center', justifyContent: 'center' },
 lembreteTexto: { flex: 1, fontSize: normalize(16), color: C.texto, fontWeight: '600' },
 lembreteTextoFeito: { textDecorationLine: 'line-through' },
 rotinaDelete: { fontSize: normalize(24), color: C.erro, fontWeight: 'bold' },
 histItem: { backgroundColor: C.branco, padding: normalize(15), borderRadius: normalize(20), marginBottom: normalize(12), flexDirection: 'row', alignItems: 'center', elevation: 2 },
 histEmoji: { fontSize: normalize(24), marginRight: normalize(15) },
 histTxt: { fontSize: normalize(16), color: C.texto, fontWeight: '700' },
 histHora: { fontSize: normalize(12), color: C.subtexto },
 vazio: { textAlign: 'center', marginTop: normalize(50), color: C.subtexto, fontSize: normalize(16) },
 btnDisparo: { backgroundColor: C.sucesso, padding: normalize(25), borderRadius: normalize(25), alignItems: 'center', flexDirection: 'row', justifyContent: 'center', marginBottom: normalize(30), elevation: 4 },
 btnDisparoTxt: { color: C.branco, fontWeight: '900', fontSize: normalize(18), marginLeft: normalize(10) },
 hardwareTitulo: { fontSize: normalize(22), fontWeight: '900', color: C.texto, marginBottom: normalize(15) },
 circuloCor: {
 width: normalize(45),
 height: normalize(45),
 borderRadius: normalize(22.5),
 marginRight: normalize(15),
 borderWidth: 4,
 borderColor: 'rgba(0,0,0,0.3)',
 shadowColor: '#000',
 shadowOffset: { width: 0, height: 4 },
 shadowOpacity: 0.5,
 shadowRadius: 0,
 elevation: 5,
 justifyContent: 'center',
 alignItems: 'center'
 },
 brilhoArcade: {
 width: '60%',
 height: '30%',
 backgroundColor: 'rgba(255,255,255,0.4)',
 borderRadius: 20,
 position: 'absolute',
 top: '15%',
 },
 cardConfig: {
 backgroundColor: C.branco,
 padding: normalize(15),
 borderRadius: normalize(15),
 marginBottom: normalize(15),
 borderBottomWidth: 6,
 borderRightWidth: 2,
 borderColor: '#CCC',
 flexDirection: 'row',
 justifyContent: 'space-between',
 alignItems: 'center'
 },
 cardConfigTxt: { fontSize: normalize(18), fontWeight: '900', color: C.texto },
 opcaoAudio: { backgroundColor: C.branco, padding: normalize(20), borderRadius: normalize(20), marginBottom: normalize(10), borderWidth: 1, borderColor: C.cinzaMedio },
 opcaoAudioTxt: { fontSize: normalize(16), fontWeight: '700', color: C.texto },

 // Estilos Ajustes
 secaoAjuste: { marginBottom: normalize(25) },
 secaoTitulo: { fontSize: normalize(14), fontWeight: '900', color: C.subtexto, textTransform: 'uppercase', marginBottom: normalize(10), marginLeft: normalize(5) },
 ajusteCard: { backgroundColor: C.branco, borderRadius: normalize(20), padding: normalize(15), elevation: 2 },
 ajusteCardRow: { backgroundColor: C.branco, borderRadius: normalize(20), padding: normalize(20), flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 2 },
 ajusteLabel: { fontSize: normalize(16), fontWeight: '700', color: C.texto },
 sliderFake: { height: normalize(10), backgroundColor: C.cinza, borderRadius: 5, marginTop: 15, position: 'relative' },
 sliderProgresso: { height: '100%', backgroundColor: C.secundaria, borderRadius: 5 },
 sliderHandle: { width: 20, height: 20, borderRadius: 10, backgroundColor: C.secundaria, position: 'absolute', top: -5, borderWidth: 3, borderColor: '#FFF' },
 btnAjusteSmall: { width: 40, height: 40, borderRadius: 10, backgroundColor: C.cinza, alignItems: 'center', justifyContent: 'center' },
 btnOpcao: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: C.cinza, alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
 btnOpcaoAtivo: { backgroundColor: C.primaria, borderColor: C.secundaria },
 btnOpcaoTxt: { fontWeight: '700', color: C.subtexto },
 btnOpcaoTxtAtivo: { color: C.texto },
 switchFake: { width: 50, height: 26, borderRadius: 13, backgroundColor: C.cinzaMedio, padding: 3 },
 switchHandle: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#FFF' },
});