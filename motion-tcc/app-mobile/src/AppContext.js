import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Criancas, Pareamento, Auth, setAuthToken, getAuthToken, setOfflineMode } from './api';
import { getOfflineUser, offlineChildren, offlineEnsureCommunicationData, offlineEnsurePairedChild } from './offlineStore';
import { sincronizarOfflineComServidor } from './syncOffline';

const CHAVE_USUARIO = 'motion.usuario.v1';
const CHAVE_TOKEN = 'motion.sessao.token.v1';
const CHAVE_DEVICE_SECRET = 'motion.kid.device_secret.v1';
const CHAVE_DEVICE_CHILD = 'motion.kid.child.v1';
const CHAVE_OFFLINE = 'motion.sessao.offline.v1';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [carregandoSessao, setCarregandoSessao] = useState(true);
  const [usuario, setUsuario] = useState(null);
  const [tokenSessao, setTokenSessao] = useState(null);
  const [criancas, setCriancas] = useState([]);
  const [criancaAtiva, setCriancaAtiva] = useState(null);
  const [deviceSecret, setDeviceSecret] = useState(null);
  const [criancaPareada, setCriancaPareada] = useState(null);
  const [syncStatus, setSyncStatus] = useState('idle');

  const sincronizarAgora = useCallback(async () => {
    const tokenAtivo = getAuthToken() || tokenSessao;
    if (!tokenAtivo || tokenAtivo === 'offline') return 0;
    setSyncStatus('syncing');
    try {
      const total = await sincronizarOfflineComServidor();
      setSyncStatus(total > 0 ? 'synced' : 'online');
      if (total > 0) {
        const atualizado = await Criancas.listar();
        if (atualizado.data?.success) setCriancas(atualizado.data.criancas || []);
      }
      return total;
    } catch (error) {
      setSyncStatus('pending');
      return 0;
    }
  }, [tokenSessao]);

  useEffect(() => {
    if (!tokenSessao || tokenSessao === 'offline') return undefined;
    const onState = (next) => { if (next === 'active') sincronizarAgora(); };
    const sub = AppState.addEventListener('change', onState);
    const timer = setInterval(() => { if (AppState.currentState === 'active') sincronizarAgora(); }, 60000);
    return () => { sub?.remove?.(); clearInterval(timer); };
  }, [tokenSessao, sincronizarAgora]);

  useEffect(() => {
    (async () => {
      try {
        const [usuarioSalvo, tokenSalvo, secretSalvo, childSalvo, offlineSalvo] = await Promise.all([
          AsyncStorage.getItem(CHAVE_USUARIO), AsyncStorage.getItem(CHAVE_TOKEN),
          AsyncStorage.getItem(CHAVE_DEVICE_SECRET), AsyncStorage.getItem(CHAVE_DEVICE_CHILD), AsyncStorage.getItem(CHAVE_OFFLINE),
        ]);
        if (offlineSalvo === '1') {
          const u = await getOfflineUser(); const antes = await offlineChildren();
          for (const child of antes) await offlineEnsureCommunicationData(child.id_crianca);
          const cs = await offlineChildren();
          setOfflineMode(true); setUsuario(u); setCriancas(cs); setTokenSessao('offline');
        } else if (usuarioSalvo && tokenSalvo) {
          const u = JSON.parse(usuarioSalvo); setAuthToken(tokenSalvo); setTokenSessao(tokenSalvo);
          try {
            const res = await Criancas.listar();
            if (res.data.success) { setUsuario(u); setCriancas(res.data.criancas || []); }
          } catch (e) {
            setAuthToken(null); await AsyncStorage.multiRemove([CHAVE_USUARIO, CHAVE_TOKEN]);
          }
        }
        if (secretSalvo) {
          if (childSalvo) { try { const cachedChild = JSON.parse(childSalvo); await offlineEnsurePairedChild(cachedChild); setOfflineMode(true); setDeviceSecret(secretSalvo); setCriancaPareada(cachedChild); } catch (_) {} }
          try {
            const res = await Pareamento.verificarDispositivo(secretSalvo);
            if (res.data.success) { setOfflineMode(false); setDeviceSecret(secretSalvo); setCriancaPareada(res.data.crianca); await AsyncStorage.setItem(CHAVE_DEVICE_CHILD, JSON.stringify(res.data.crianca)); }
            else await AsyncStorage.multiRemove([CHAVE_DEVICE_SECRET, CHAVE_DEVICE_CHILD]);
          } catch (e) { setOfflineMode(true); /* usa o cache local completo do dispositivo pareado */ }
        }
      } catch (e) { /* primeira abertura sem conexão */ }
      finally { setCarregandoSessao(false); }
    })();
  }, []);

  const login = useCallback(async (u, token) => {
    // Se o usuário estava no Modo sem conta, o banco local continua intacto.
    // O login troca apenas a autenticação e, logo depois, migra o snapshot local.
    const veioDoModoSemConta = tokenSessao === 'offline';
    setOfflineMode(false); setAuthToken(token);
    try {
      await AsyncStorage.multiSet([[CHAVE_USUARIO, JSON.stringify(u)], [CHAVE_TOKEN, token], [CHAVE_OFFLINE, '0']]);
      setTokenSessao(token); setUsuario(u); setCriancas([]);
      try { const res = await Criancas.listar(); if (res.data?.success) setCriancas(res.data.criancas || []); } catch (_) { }
      await sincronizarAgora();
    } catch (err) {
      setAuthToken(null);
      setOfflineMode(veioDoModoSemConta);
      if (veioDoModoSemConta) {
        const localUser = await getOfflineUser();
        const localChildren = await offlineChildren();
        setTokenSessao('offline'); setUsuario(localUser); setCriancas(localChildren);
        await AsyncStorage.multiSet([[CHAVE_OFFLINE, '1'], [CHAVE_USUARIO, JSON.stringify(localUser)], [CHAVE_TOKEN, 'offline']]);
      } else {
        await AsyncStorage.multiRemove([CHAVE_USUARIO, CHAVE_TOKEN]);
      }
      throw err;
    }
  }, [sincronizarAgora, tokenSessao]);

  const entrarOffline = useCallback(async () => {
    const u = await getOfflineUser(); const antes = await offlineChildren();
    for (const child of antes) await offlineEnsureCommunicationData(child.id_crianca);
    const cs = await offlineChildren();
    await AsyncStorage.multiSet([[CHAVE_OFFLINE, '1'], [CHAVE_USUARIO, JSON.stringify(u)], [CHAVE_TOKEN, 'offline']]);
    setOfflineMode(true); setAuthToken(null); setTokenSessao('offline'); setUsuario(u); setCriancas(cs); setCriancaAtiva(null);
  }, []);

  const logout = useCallback(async () => {
    try { if (tokenSessao !== 'offline') await Auth.logout(); } catch (_) { }
    setAuthToken(null); setOfflineMode(false); setTokenSessao(null); setUsuario(null); setCriancas([]); setCriancaAtiva(null);
    await AsyncStorage.multiRemove([CHAVE_USUARIO, CHAVE_TOKEN, CHAVE_OFFLINE, CHAVE_DEVICE_SECRET, CHAVE_DEVICE_CHILD]);
  }, [tokenSessao]);

  const recarregarCriancas = useCallback(async () => {
    if (!usuario) return;
    const res = await Criancas.listar();
    if (res.data.success) setCriancas(res.data.criancas || []);
  }, [usuario]);

  const atualizarCriancaAtivaLocal = useCallback((patch) => {
    setCriancaAtiva((prev) => (prev ? { ...prev, ...patch } : prev));
    setCriancas((prev) => prev.map((c) => (c.id_crianca === patch.id_crianca ? { ...c, ...patch } : c)));
  }, []);
  const entrarComoPareado = useCallback(async (secret, crianca) => { setDeviceSecret(secret); setCriancaPareada(crianca); await AsyncStorage.multiSet([[CHAVE_DEVICE_SECRET, secret], [CHAVE_DEVICE_CHILD, JSON.stringify(crianca)]]); }, []);
  const sairDoPareamento = useCallback(async () => { setDeviceSecret(null); setCriancaPareada(null); await AsyncStorage.multiRemove([CHAVE_DEVICE_SECRET, CHAVE_DEVICE_CHILD]); }, []);
  const atualizarCriancaPareadaLocal = useCallback((patch) => setCriancaPareada((prev) => (prev ? { ...prev, ...patch } : prev)), []);

  const value = { carregandoSessao, usuario, tokenSessao, login, entrarOffline, logout, criancas, recarregarCriancas, criancaAtiva, setCriancaAtiva, atualizarCriancaAtivaLocal, deviceSecret, criancaPareada, entrarComoPareado, sairDoPareamento, atualizarCriancaPareadaLocal, syncStatus, sincronizarAgora };
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
export function useApp() { const ctx = useContext(AppContext); if (!ctx) throw new Error('useApp precisa estar dentro de <AppProvider>'); return ctx; }
