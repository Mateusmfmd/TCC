import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Criancas, Pareamento, Auth, setAuthToken } from './api';

const CHAVE_USUARIO = 'motion.usuario.v1';
const CHAVE_TOKEN = 'motion.sessao.token.v1';
const CHAVE_DEVICE_SECRET = 'motion.kid.device_secret.v1';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [carregandoSessao, setCarregandoSessao] = useState(true);

  // Sessão do responsável (modo Pai, autenticado)
  const [usuario, setUsuario] = useState(null);
  const [criancas, setCriancas] = useState([]);
  const [criancaAtiva, setCriancaAtiva] = useState(null); // criança selecionada para gerenciar

  // Sessão do dispositivo pareado (modo Criança, sem login)
  const [deviceSecret, setDeviceSecret] = useState(null);
  const [criancaPareada, setCriancaPareada] = useState(null);

  // Restaura sessões salvas ao abrir o app
  useEffect(() => {
    (async () => {
      try {
        const [usuarioSalvo, tokenSalvo, secretSalvo] = await Promise.all([
          AsyncStorage.getItem(CHAVE_USUARIO),
          AsyncStorage.getItem(CHAVE_TOKEN),
          AsyncStorage.getItem(CHAVE_DEVICE_SECRET),
        ]);
        if (usuarioSalvo && tokenSalvo) {
          const u = JSON.parse(usuarioSalvo);
          setAuthToken(tokenSalvo);
          try {
            const res = await Criancas.listar();
            if (res.data.success) {
              setUsuario(u);
              setCriancas(res.data.criancas);
            }
          } catch (e) {
            // Token expirado/inválido — limpa a sessão salva e volta pro login
            setAuthToken(null);
            await AsyncStorage.multiRemove([CHAVE_USUARIO, CHAVE_TOKEN]);
          }
        }
        if (secretSalvo) {
          const res = await Pareamento.verificarDispositivo(secretSalvo);
          if (res.data.success) {
            setDeviceSecret(secretSalvo);
            setCriancaPareada(res.data.crianca);
          } else {
            await AsyncStorage.removeItem(CHAVE_DEVICE_SECRET);
          }
        }
      } catch (e) {
        // Sem conexão ao abrir o app — segue para tela de login normalmente
      } finally {
        setCarregandoSessao(false);
      }
    })();
  }, []);

  const login = useCallback(async (u, token) => {
    setAuthToken(token);
    setUsuario(u);
    await AsyncStorage.setItem(CHAVE_USUARIO, JSON.stringify(u));
    await AsyncStorage.setItem(CHAVE_TOKEN, token);
    const res = await Criancas.listar();
    if (res.data.success) setCriancas(res.data.criancas);
  }, []);

  const logout = useCallback(async () => {
    try { await Auth.logout(); } catch (e) { /* best-effort — a sessão local é limpa de qualquer forma */ }
    setAuthToken(null);
    setUsuario(null);
    setCriancas([]);
    setCriancaAtiva(null);
    await AsyncStorage.multiRemove([CHAVE_USUARIO, CHAVE_TOKEN]);
  }, []);

  const recarregarCriancas = useCallback(async () => {
    if (!usuario) return;
    const res = await Criancas.listar();
    if (res.data.success) setCriancas(res.data.criancas);
  }, [usuario]);

  // Atualiza os dados da criança ativa localmente (após editar ajustes, por exemplo)
  const atualizarCriancaAtivaLocal = useCallback((patch) => {
    setCriancaAtiva((prev) => (prev ? { ...prev, ...patch } : prev));
    setCriancas((prev) => prev.map((c) => (c.id_crianca === patch.id_crianca ? { ...c, ...patch } : c)));
  }, []);

  const entrarComoPareado = useCallback(async (secret, crianca) => {
    setDeviceSecret(secret);
    setCriancaPareada(crianca);
    await AsyncStorage.setItem(CHAVE_DEVICE_SECRET, secret);
  }, []);

  const sairDoPareamento = useCallback(async () => {
    setDeviceSecret(null);
    setCriancaPareada(null);
    await AsyncStorage.removeItem(CHAVE_DEVICE_SECRET);
  }, []);

  const atualizarCriancaPareadaLocal = useCallback((patch) => {
    setCriancaPareada((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  const value = {
    carregandoSessao,
    usuario, login, logout,
    criancas, recarregarCriancas,
    criancaAtiva, setCriancaAtiva, atualizarCriancaAtivaLocal,
    deviceSecret, criancaPareada, entrarComoPareado, sairDoPareamento, atualizarCriancaPareadaLocal,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp precisa estar dentro de <AppProvider>');
  return ctx;
}
