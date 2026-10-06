import React, { useMemo, useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, Alert,
  ActivityIndicator, SafeAreaView, StatusBar, Animated, Platform, Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { normalize, TEMA_RESPONSAVEL, fontesFor } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { criarEstilos } from '../estilos';
import { TopBar, BotaoVoltar } from '../components/TopBar';
import Campo from '../components/Campo';
import BannerErro from '../components/BannerErro';
import BotaoAnimado from '../components/BotaoAnimado';
import ItemEscalonado from '../components/ItemEscalonadoMoti';
import { Criancas, mensagemErro } from '../api';
import { useApp } from '../AppContext';

const C = TEMA_RESPONSAVEL;
const V = 'adulto';
const F = fontesFor(V);
const AVATARES = ['🧒', '👦', '👧', '🧑', '👶', '🦄', '🐻', '🐰', '🦁', '🐼'];

function sombraCard(cor, intensidade = 1) {
  return Platform.select({
    ios: { shadowColor: cor, shadowOffset: { width: 0, height: 4 * intensidade }, shadowOpacity: 0.15 * intensidade, shadowRadius: 8 * intensidade },
    default: { elevation: 2 * intensidade },
  });
}

// ── Lista de crianças (tela inicial do responsável após login) ──
export function TelaCriancas({ onVoltar, onAbrirCrianca, onNovaCrianca, onLogout, onEntrarConta, modoSemConta }) {
  const s = useMemo(() => criarEstilos(C, V), []);
  const { usuario, criancas, recarregarCriancas, tokenSessao, syncStatus, sincronizarAgora } = useApp();
  const [atualizando, setAtualizando] = useState(false);
  const [erroAtualizacao, setErroAtualizacao] = useState(null);

  const atualizar = async () => {
    setAtualizando(true);
    setErroAtualizacao(null);
    try {
      await recarregarCriancas();
      await sincronizarAgora();
    } catch (err) {
      setErroAtualizacao(mensagemErro(err, 'Não foi possível atualizar os perfis.'));
    } finally {
      setAtualizando(false);
    }
  };

  // Saída da saudação — fade + subida; separada da cascata dos cards pra
  // a tela não parecer "jogada" inteira na tela de uma vez.
  const entradaSaudacao = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(entradaSaudacao, {
      toValue: 1,
      duration: 420,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: Platform.OS !== 'web',
    }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.primaria} />
      <TopBar logoMode C={C} variante={V} />
      <ScrollView contentContainerStyle={s.scroll}>
        <Animated.View
          style={[
            { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: normalize(22) },
            {
              opacity: entradaSaudacao,
              transform: [{ translateY: entradaSaudacao.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
            },
          ]}
        >
          <View>
            <Text style={{ fontSize: normalize(11), fontFamily: F.bodyBold, color: C.subtexto, textTransform: 'uppercase', letterSpacing: 0.6 }}>Painel do responsável</Text>
            <Text style={{ fontSize: normalize(21), fontFamily: F.display, color: C.texto, marginTop: 2 }}>Olá, {usuario?.nome || 'Responsável'}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            {modoSemConta && onEntrarConta ? (
              <TouchableOpacity onPress={onEntrarConta} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Entrar ou criar uma conta para salvar os dados na nuvem" style={{ flexDirection: 'row', alignItems: 'center', gap: normalize(4), paddingVertical: normalize(6), paddingHorizontal: normalize(8) }}>
                <Ionicons name="cloud-upload-outline" size={normalize(16)} color={C.secundaria} />
                <Text style={{ color: C.secundaria, fontFamily: F.bodyBold }}>Salvar na conta</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={onLogout} activeOpacity={0.7} style={{ flexDirection: 'row', alignItems: 'center', gap: normalize(4), paddingVertical: normalize(6), paddingHorizontal: normalize(8) }}>
                <Ionicons name="log-out-outline" size={normalize(16)} color={C.subtexto} />
                <Text style={{ color: C.subtexto, fontFamily: F.bodyBold }}>Sair</Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <Text style={s.secaoTitulo}>Perfis de crianças</Text>
            <Text style={{ color: tokenSessao === 'offline' ? C.alerta : syncStatus === 'pending' ? C.alerta : C.subtexto, fontFamily: F.body, fontSize: normalize(10.5), marginTop: 2 }}>
              {tokenSessao === 'offline' ? '● Modo sem conta · salvo neste aparelho' : syncStatus === 'syncing' ? '● Sincronizando...' : syncStatus === 'pending' ? '● Aguardando sincronização' : '● Servidor conectado'}
            </Text>
          </View>
          <TouchableOpacity onPress={atualizar} disabled={atualizando} accessibilityRole="button" accessibilityLabel="Atualizar perfis e sincronizar" style={{ padding: normalize(8) }}>
            <Ionicons name="refresh" size={normalize(19)} color={C.secundaria} />
          </TouchableOpacity>
        </View>
        {atualizando && <ActivityIndicator color={C.secundaria} style={{ marginBottom: 10 }} />}
        {erroAtualizacao ? (
          <BannerErro mensagem={erroAtualizacao} C={C} variante={V} onFechar={() => setErroAtualizacao(null)} acaoTexto="Tentar novamente" onAcao={atualizar} />
        ) : null}
        {criancas.map((c, i) => (
          <ItemEscalonado key={c.id_crianca} indice={i}>
            <TouchableOpacity style={[s.cardRow, s.cardFaixa]} onPress={() => onAbrirCrianca(c)} activeOpacity={0.85}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <View style={[{ width: normalize(48), height: normalize(48), borderRadius: normalize(14), backgroundColor: C.cinza, alignItems: 'center', justifyContent: 'center', marginRight: normalize(14) }, sombraCard(C.primaria, 0.5)]}>
                  <Text style={{ fontSize: normalize(26) }}>{c.avatar_emoji}</Text>
                </View>
                <View>
                  <Text style={s.cardTitulo}>{c.nome}</Text>
                  <Text style={s.cardSubtitulo}>Toque para gerenciar</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={normalize(18)} color={C.subtexto} />
            </TouchableOpacity>
          </ItemEscalonado>
        ))}
        {criancas.length === 0 && (
          <Text style={s.vazio}>Nenhum perfil cadastrado ainda.{'\n'}Toque em "+ Nova criança" para começar.</Text>
        )}

        <BotaoAnimado
          onPress={onNovaCrianca}
          style={[s.botaoPrimario, { marginTop: normalize(20), flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: normalize(6) }]}
        >
          <Ionicons name="add" size={normalize(18)} color="#FFFFFF" />
          <Text style={s.botaoPrimarioTxt}>Nova criança</Text>
        </BotaoAnimado>
      </ScrollView>
    </SafeAreaView>
  );
}

// Avatar do formulário — mesmo "pop" de mola do resto do app ao escolher.
function AvatarOpcao({ emoji, selecionado, onPress }) {
  const escala = useRef(new Animated.Value(1)).current;
  return (
    <Animated.View style={{ transform: [{ scale: escala }] }}>
      <TouchableOpacity
        onPress={() => {
          Animated.sequence([
            Animated.spring(escala, { toValue: 0.85, useNativeDriver: true, speed: 50, bounciness: 4 }),
            Animated.spring(escala, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 12 }),
          ]).start();
          onPress();
        }}
        style={[
          {
            width: normalize(54), height: normalize(54), borderRadius: normalize(15), margin: normalize(5),
            alignItems: 'center', justifyContent: 'center', backgroundColor: selecionado ? C.primaria : C.branco,
            borderWidth: 1.5, borderColor: selecionado ? C.primaria : C.borda,
          },
          selecionado && sombraCard(C.primaria, 1),
        ]}
      >
        <Text style={{ fontSize: normalize(27) }}>{emoji}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── Formulário para criar um novo perfil de criança ──
export function TelaCriancaForm({ onVoltar, onCriada }) {
  const s = useMemo(() => criarEstilos(C, V), []);
  const { usuario, recarregarCriancas } = useApp();
  const [nome, setNome] = useState('');
  const [avatar, setAvatar] = useState(AVATARES[0]);
  const [erroNome, setErroNome] = useState(null);
  const [erroServidor, setErroServidor] = useState(null);
  const [loading, setLoading] = useState(false);

  // O formulário inteiro entra com fade + subida leve (mesma família visual
  // da saudação da tela anterior) — o banner de erro aparece acima dele,
  // sem animar junto, pra não brigar com mensagens do servidor.
  const entradaForm = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(entradaForm, {
      toValue: 1,
      duration: 420,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: Platform.OS !== 'web',
    }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const salvar = async () => {
    setErroServidor(null);
    if (!nome.trim()) { setErroNome('Digite o nome da criança'); return; }
    setLoading(true);
    try {
      const res = await Criancas.criar(usuario.id_usuario, nome.trim(), avatar);
      if (res.data.success) {
        await recarregarCriancas();
          Alert.alert('Perfil criado ✅', 'As 5 categorias e 5 palavras de cada categoria já foram configuradas.', [
          { text: 'OK', onPress: onCriada },
        ]);
      } else {
        setErroServidor(res.data.message);
      }
    } catch (err) {
      setErroServidor(mensagemErro(err));
    } finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.primaria} />
      <TopBar titulo="Nova criança" onVoltar={onVoltar} C={C} variante={V} />
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <BannerErro mensagem={erroServidor} C={C} variante={V} onFechar={() => setErroServidor(null)} />
        <Animated.View style={{ opacity: entradaForm, transform: [{ translateY: entradaForm.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }] }}>
        <Campo label="Nome da criança" C={C} variante={V} erro={erroNome} placeholder="Ex: Sofia" value={nome}
          onChangeText={(t) => { setNome(t); setErroNome(null); }} />
        <Text style={s.label}>Avatar</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: normalize(18) }}>
          {AVATARES.map((a) => (
            <AvatarOpcao key={a} emoji={a} selecionado={avatar === a} onPress={() => setAvatar(a)} />
          ))}
        </View>
        <Text style={{ color: C.subtexto, fontFamily: F.body, fontSize: normalize(12.5), lineHeight: normalize(18), marginBottom: normalize(16) }}>
          Ao criar o perfil, 5 categorias e 5 palavras com emojis em cada categoria serão adicionadas automaticamente. Você pode editar, remover ou criar novas categorias e palavras depois.
        </Text>
        <BotaoAnimado onPress={salvar} loading={loading} style={s.botaoPrimario}>
          <Text style={s.botaoPrimarioTxt}>Criar perfil</Text>
        </BotaoAnimado>
        </Animated.View>
      </ScrollView>
      <BotaoVoltar onPress={onVoltar} C={C} variante={V} />
    </SafeAreaView>
  );
}
