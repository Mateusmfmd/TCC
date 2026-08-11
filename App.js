import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, Text, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Baloo2_600SemiBold, Baloo2_700Bold, Baloo2_800ExtraBold } from '@expo-google-fonts/baloo-2';
import { Lexend_400Regular, Lexend_500Medium, Lexend_600SemiBold, Lexend_700Bold } from '@expo-google-fonts/lexend';
import { PlusJakartaSans_400Regular, PlusJakartaSans_500Medium, PlusJakartaSans_600SemiBold, PlusJakartaSans_700Bold } from '@expo-google-fonts/plus-jakarta-sans';
import { AppProvider, useApp } from './src/AppContext';
import { TEMA_RESPONSAVEL } from './src/theme';
import { configurarNotificacoes } from './src/notifications';

import { TelaBoasVindas } from './src/screens/BoasVindas';
import { TelaLogin, TelaCadastro } from './src/screens/Auth';
import { TelaPareamentoEntrar } from './src/screens/Pareamento';
import { TelaCriancas, TelaCriancaForm } from './src/screens/Criancas';
import { TelaCriancaHome } from './src/screens/CriancaHome';
import { TelaEditorConteudo, TelaEditorPictogramas } from './src/screens/Editor';
import { TelaRotinasEditor } from './src/screens/Rotinas';
import { TelaLembretesEditor } from './src/screens/Lembretes';
import { TelaMonitoramento } from './src/screens/Monitoramento';
import { TelaAjustesCrianca } from './src/screens/Ajustes';
import { TelaBotaoHardware } from './src/screens/BotaoHardware';
import { TelaModoCrianca } from './src/screens/ModoCrianca';

export default function App() {
  const [fontsLoaded] = useFonts({
    Baloo2_600SemiBold, Baloo2_700Bold, Baloo2_800ExtraBold,
    Lexend_400Regular, Lexend_500Medium, Lexend_600SemiBold, Lexend_700Bold,
    PlusJakartaSans_400Regular, PlusJakartaSans_500Medium, PlusJakartaSans_600SemiBold, PlusJakartaSans_700Bold,
  });

  useEffect(() => { configurarNotificacoes(); }, []);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: TEMA_RESPONSAVEL.fundo }}>
        <ActivityIndicator size="large" color={TEMA_RESPONSAVEL.secundaria} />
      </View>
    );
  }

  return (
    <AppProvider>
      <StatusBar style="dark" />
      {Platform.OS === 'web' ? (
        // No navegador desktop a "window" pode ter 1200px+ de largura. Sem
        // isso, cada tela esticava para preencher o navegador inteiro —
        // texto, cards e botões ficavam enormes e desproporcionais (a app
        // foi desenhada para proporção de celular). Centralizamos numa
        // "moldura" de celular/tablet e deixamos o resto da janela neutro.
        <View style={{ flex: 1, alignItems: 'center', backgroundColor: '#0F3049' }}>
          <View style={{ flex: 1, width: '100%', maxWidth: 480, overflow: 'hidden' }}>
            <Roteador />
          </View>
        </View>
      ) : (
        <Roteador />
      )}
    </AppProvider>
  );
}

function Roteador() {
  const {
    carregandoSessao, usuario, logout,
    criancaAtiva, setCriancaAtiva,
    deviceSecret, criancaPareada, sairDoPareamento, atualizarCriancaPareadaLocal,
  } = useApp();

  // tela pública (antes de logar) ou tela do modo Responsável depois do login
  const [tela, setTela] = useState('boasvindas');
  const [categoriaAtiva, setCategoriaAtiva] = useState(null);
  const [modoCriancaDireto, setModoCriancaDireto] = useState(false);

  if (carregandoSessao) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: TEMA_RESPONSAVEL.fundo }}>
        <ActivityIndicator size="large" color={TEMA_RESPONSAVEL.secundaria} />
      </View>
    );
  }

  // Dispositivo já pareado como Modo Criança: entra direto, sem tela de login.
  if (deviceSecret && criancaPareada) {
    return (
      <TelaModoCrianca
        crianca={criancaPareada}
        auth={{ device_secret: deviceSecret }}
        onSair={async () => { await sairDoPareamento(); }}
      />
    );
  }

  // Responsável entrou no Modo Criança diretamente pelo próprio celular.
  if (modoCriancaDireto && criancaAtiva) {
    return (
      <TelaModoCrianca
        crianca={criancaAtiva}
        auth={{ usuario_id: usuario.id_usuario }}
        onSair={() => setModoCriancaDireto(false)}
      />
    );
  }

  // ── Não logado: telas públicas ──────────────────────────────
  if (!usuario) {
    if (tela === 'boasvindas') {
      return <TelaBoasVindas onComecar={() => setTela('cadastro')} onEntrar={() => setTela('login')} />;
    }
    if (tela === 'cadastro') return <TelaCadastro onVoltar={() => setTela('boasvindas')} />;
    if (tela === 'pareamento_entrar') return <TelaPareamentoEntrar onVoltar={() => setTela('login')} onPareado={() => {}} />;
    return (
      <TelaLogin
        onCadastro={() => setTela('cadastro')}
        onEntrarComoPareado={() => setTela('pareamento_entrar')}
      />
    );
  }

  // ── Logado como responsável ─────────────────────────────────
  const irParaCriancas = () => { setCriancaAtiva(null); setTela('criancas'); };

  switch (tela) {
    case 'crianca_form':
      return <TelaCriancaForm onVoltar={irParaCriancas} onCriada={irParaCriancas} />;

    case 'crianca_home':
      return (
        <TelaCriancaHome
          crianca={criancaAtiva}
          onVoltar={irParaCriancas}
          onNavegar={(t) => setTela(t)}
          onEntrarModoCrianca={() => setModoCriancaDireto(true)}
          onExcluida={irParaCriancas}
        />
      );

    case 'editor':
      return (
        <TelaEditorConteudo
          crianca={criancaAtiva}
          onVoltar={() => setTela('crianca_home')}
          onAbrirCategoria={(cat) => { setCategoriaAtiva(cat); setTela('editor_pictogramas'); }}
        />
      );

    case 'editor_pictogramas':
      return <TelaEditorPictogramas crianca={criancaAtiva} categoria={categoriaAtiva} onVoltar={() => setTela('editor')} />;

    case 'rotinas':
      return <TelaRotinasEditor crianca={criancaAtiva} onVoltar={() => setTela('crianca_home')} />;

    case 'lembretes':
      return <TelaLembretesEditor crianca={criancaAtiva} onVoltar={() => setTela('crianca_home')} />;

    case 'monitoramento':
      return <TelaMonitoramento crianca={criancaAtiva} onVoltar={() => setTela('crianca_home')} />;

    case 'ajustes':
      return <TelaAjustesCrianca crianca={criancaAtiva} onVoltar={() => setTela('crianca_home')} />;

    case 'botao_hardware':
      return <TelaBotaoHardware onVoltar={() => setTela('crianca_home')} />;

    case 'criancas':
    default:
      return (
        <TelaCriancas
          onNovaCrianca={() => setTela('crianca_form')}
          onAbrirCrianca={(c) => { setCriancaAtiva(c); setTela('crianca_home'); }}
          onLogout={async () => { await logout(); setTela('login'); }}
        />
      );
  }
}
