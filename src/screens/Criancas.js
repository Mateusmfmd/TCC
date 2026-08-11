import React, { useMemo, useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, Alert,
  ActivityIndicator, SafeAreaView, StatusBar, Animated, Platform,
} from 'react-native';
import { normalize, TEMA_RESPONSAVEL, fontesFor } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { criarEstilos } from '../estilos';
import { TopBar, BotaoVoltar } from '../components/TopBar';
import Campo from '../components/Campo';
import BannerErro from '../components/BannerErro';
import BotaoAnimado from '../components/BotaoAnimado';
import ItemEscalonado from '../components/ItemEscalonado';
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
export function TelaCriancas({ onVoltar, onAbrirCrianca, onNovaCrianca, onLogout }) {
  const s = useMemo(() => criarEstilos(C, V), []);
  const { usuario, criancas, recarregarCriancas } = useApp();
  const [atualizando, setAtualizando] = useState(false);

  const atualizar = async () => {
    setAtualizando(true);
    await recarregarCriancas();
    setAtualizando(false);
  };

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.primaria} />
      <TopBar logoMode C={C} variante={V} />
      <ScrollView contentContainerStyle={s.scroll} onScrollBeginDrag={atualizar}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: normalize(22) }}>
          <View>
            <Text style={{ fontSize: normalize(11), fontFamily: F.bodyBold, color: C.subtexto, textTransform: 'uppercase', letterSpacing: 0.6 }}>Painel do responsável</Text>
            <Text style={{ fontSize: normalize(21), fontFamily: F.display, color: C.texto, marginTop: 2 }}>Olá, {usuario?.nome || 'Responsável'}</Text>
          </View>
          <TouchableOpacity onPress={onLogout} activeOpacity={0.7} style={{ flexDirection: 'row', alignItems: 'center', gap: normalize(4), paddingVertical: normalize(6), paddingHorizontal: normalize(8) }}>
            <Ionicons name="log-out-outline" size={normalize(16)} color={C.subtexto} />
            <Text style={{ color: C.subtexto, fontFamily: F.bodyBold }}>Sair</Text>
          </TouchableOpacity>
        </View>

        <Text style={s.secaoTitulo}>Perfis de crianças</Text>
        {atualizando && <ActivityIndicator color={C.secundaria} style={{ marginBottom: 10 }} />}
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

  const salvar = async () => {
    setErroServidor(null);
    if (!nome.trim()) { setErroNome('Digite o nome da criança'); return; }
    setLoading(true);
    try {
      const res = await Criancas.criar(usuario.id_usuario, nome.trim(), avatar);
      if (res.data.success) {
        await recarregarCriancas();
        Alert.alert('Perfil criado ✅', 'Categorias e pictogramas padrão já foram configurados.', [
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
        <Campo label="Nome da criança" C={C} variante={V} erro={erroNome} placeholder="Ex: Sofia" value={nome}
          onChangeText={(t) => { setNome(t); setErroNome(null); }} />
        <Text style={s.label}>Avatar</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: normalize(18) }}>
          {AVATARES.map((a) => (
            <AvatarOpcao key={a} emoji={a} selecionado={avatar === a} onPress={() => setAvatar(a)} />
          ))}
        </View>
        <Text style={{ color: C.subtexto, fontFamily: F.body, fontSize: normalize(12.5), lineHeight: normalize(18), marginBottom: normalize(16) }}>
          Ao criar o perfil, categorias e pictogramas padrão (Comida, Perguntas, Ações, Sentimento, Social,
          Algo errado, Afirmação, Localização, Lazer) serão adicionados automaticamente. Você pode editá-los depois.
        </Text>
        <BotaoAnimado onPress={salvar} loading={loading} style={s.botaoPrimario}>
          <Text style={s.botaoPrimarioTxt}>Criar perfil</Text>
        </BotaoAnimado>
      </ScrollView>
      <BotaoVoltar onPress={onVoltar} C={C} variante={V} />
    </SafeAreaView>
  );
}
