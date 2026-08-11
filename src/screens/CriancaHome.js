import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, SafeAreaView, StatusBar, Share, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { normalize, TEMA_RESPONSAVEL, fontesFor } from '../theme';
import { criarEstilos } from '../estilos';
import { TopBar, BotaoVoltar } from '../components/TopBar';
import ItemEscalonado from '../components/ItemEscalonado';
import BotaoAnimado from '../components/BotaoAnimado';
import { Criancas, Pareamento, mensagemErro } from '../api';
import { useApp } from '../AppContext';

const C = TEMA_RESPONSAVEL;
const V = 'adulto';
const F = fontesFor(V);

// Cada atalho de "Gerenciar" ganha uma cor própria — não é decoração
// gratuita: numa grade de 6 ícones parecidos (todos outline, todos cinza),
// a cor é o que deixa a diferença entre eles escaneável num relance.
function sombraCard(cor) {
  return Platform.select({
    ios: { shadowColor: cor, shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.14, shadowRadius: 9 },
    default: { elevation: 2 },
  });
}

export function TelaCriancaHome({ crianca, onVoltar, onNavegar, onEntrarModoCrianca, onExcluida }) {
  const s = useMemo(() => criarEstilos(C, V), []);
  const { usuario, recarregarCriancas } = useApp();
  const [codigo, setCodigo] = useState(null);
  const [gerando, setGerando] = useState(false);

  const itens = [
    { tela: 'editor', icone: 'color-palette-outline', label: 'Editor de conteúdo', desc: 'Categorias e pictogramas', cor: C.primaria },
    { tela: 'rotinas', icone: 'calendar-outline', label: 'Rotinas', desc: 'Atividades da semana', cor: '#4CAF8A' },
    { tela: 'lembretes', icone: 'notifications-outline', label: 'Lembretes', desc: 'Avisos com horário', cor: '#E8A33D' },
    { tela: 'monitoramento', icone: 'stats-chart-outline', label: 'Monitoramento', desc: 'Uso, rotina e humor', cor: '#8B6FD6' },
    { tela: 'botao_hardware', icone: 'hardware-chip-outline', label: 'Botão hardware', desc: 'Botões físicos arcade', cor: '#3D9AD1' },
    { tela: 'ajustes', icone: 'settings-outline', label: 'Ajustes e acessibilidade', desc: 'Voz, PIN, contraste', cor: C.subtexto },
  ];

  const gerarCodigo = async () => {
    setGerando(true);
    try {
      const res = await Pareamento.gerar(crianca.id_crianca, usuario.id_usuario);
      if (res.data.success) {
        setCodigo(res.data.codigo);
      } else {
        Alert.alert('Erro', res.data.message);
      }
    } catch (err) {
      Alert.alert('Erro', mensagemErro(err));
    } finally { setGerando(false); }
  };

  const compartilharCodigo = () => {
    if (!codigo) return;
    Share.share({ message: `Código de pareamento do M.O.T.I.O.N para ${crianca.nome}: ${codigo}\n\nAbra o app no dispositivo da criança, toque em "Parear com código" e digite este número. Válido por 30 dias.` });
  };

  const excluirPerfil = () => {
    Alert.alert('Excluir perfil', `Tem certeza que deseja excluir o perfil de ${crianca.nome}? Todo o conteúdo, histórico e configurações serão perdidos.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir', style: 'destructive', onPress: async () => {
          try {
            await Criancas.remover(crianca.id_crianca, usuario.id_usuario);
            await recarregarCriancas();
            onExcluida();
          } catch (err) {
            Alert.alert('Erro', mensagemErro(err));
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.primaria} />
      <TopBar titulo={crianca.nome} C={C} variante={V} onVoltar={onVoltar} />
      <ScrollView contentContainerStyle={s.scroll}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: normalize(20) }}>
          <View style={[{ width: normalize(56), height: normalize(56), borderRadius: normalize(16), backgroundColor: C.cinza, alignItems: 'center', justifyContent: 'center', marginRight: normalize(14) }, sombraCard(C.primaria)]}>
            <Text style={{ fontSize: normalize(28) }}>{crianca.avatar_emoji}</Text>
          </View>
          <View>
            <Text style={{ fontSize: normalize(11), color: C.subtexto, fontFamily: F.bodyBold, textTransform: 'uppercase', letterSpacing: 0.6 }}>Perfil</Text>
            <Text style={{ fontSize: normalize(19), fontFamily: F.display, color: C.texto }}>{crianca.nome}</Text>
          </View>
        </View>

        <BotaoAnimado
          onPress={() => onEntrarModoCrianca(crianca)}
          style={[s.botaoPrimario, { marginBottom: normalize(24), flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: normalize(8) }]}
        >
          <Ionicons name="play" size={normalize(16)} color="#FFFFFF" />
          <Text style={s.botaoPrimarioTxt}>Entrar no Modo Criança agora</Text>
        </BotaoAnimado>

        <Text style={s.secaoTitulo}>Pareamento com outro dispositivo</Text>
        <View style={[s.card, s.cardFaixa]}>
          <Text style={{ color: C.subtexto, marginBottom: normalize(10), fontSize: normalize(13), lineHeight: normalize(19) }}>
            Gere um código de 6 dígitos para abrir o Modo Criança direto no celular ou tablet da criança, sem precisar fazer login.
          </Text>
          {codigo ? (
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: normalize(36), fontFamily: F.display, letterSpacing: normalize(7), color: C.primaria, marginVertical: normalize(10) }}>{codigo}</Text>
              <Text style={{ color: C.subtexto, marginBottom: normalize(10), fontSize: normalize(12) }}>Válido por 30 dias</Text>
              <BotaoAnimado onPress={compartilharCodigo} style={[s.botaoSecundario, { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: normalize(6) }]}>
                <Ionicons name="share-social-outline" size={normalize(15)} color={C.texto} />
                <Text style={s.botaoSecundarioTxt}>Compartilhar código</Text>
              </BotaoAnimado>
            </View>
          ) : (
            <BotaoAnimado onPress={gerarCodigo} loading={gerando} corCarregando={C.texto} style={s.botaoSecundario}>
              <Text style={s.botaoSecundarioTxt}>Gerar código de pareamento</Text>
            </BotaoAnimado>
          )}
        </View>

        <Text style={s.secaoTitulo}>Gerenciar</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: normalize(12) }}>
          {itens.map((item, i) => (
            <ItemEscalonado key={item.tela} indice={i} style={{ width: '47.5%' }}>
              <TouchableOpacity
                style={[{ backgroundColor: C.branco, borderRadius: normalize(18), padding: normalize(16), minHeight: normalize(130) }, sombraCard(item.cor)]}
                onPress={() => onNavegar(item.tela)}
                activeOpacity={0.85}
              >
                <View style={{ width: normalize(42), height: normalize(42), borderRadius: normalize(13), backgroundColor: `${item.cor}1F`, alignItems: 'center', justifyContent: 'center', marginBottom: normalize(12) }}>
                  <Ionicons name={item.icone} size={normalize(21)} color={item.cor} />
                </View>
                <Text style={s.cardTitulo}>{item.label}</Text>
                <Text style={[s.cardSubtitulo, { marginTop: 3 }]}>{item.desc}</Text>
              </TouchableOpacity>
            </ItemEscalonado>
          ))}
        </View>

        <BotaoAnimado
          onPress={excluirPerfil}
          style={[s.botaoPerigo, { marginTop: normalize(26), flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: normalize(6) }]}
          corCarregando={C.erro}
        >
          <Ionicons name="trash-outline" size={normalize(15)} color={C.erro} />
          <Text style={s.botaoPerigoTxt}>Excluir perfil de {crianca.nome}</Text>
        </BotaoAnimado>
      </ScrollView>
      <BotaoVoltar onPress={onVoltar} C={C} variante={V} />
    </SafeAreaView>
  );
}
