import React, {
  useMemo,
  useState,
  useRef,
  useEffect,
} from 'react';

import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
  Animated,
} from 'react-native';

import {
  normalize,
  TEMA_RESPONSAVEL,
  fontesFor,
} from '../theme';

import { Ionicons } from '@expo/vector-icons';

import { criarEstilos } from '../estilos';

import { BotaoVoltar } from '../components/TopBar';

import {
  FundoGradiente,
  PainelVidro,
} from '../components/Vidro';

import Campo from '../components/Campo';

import BannerErro from '../components/BannerErro';

import BotaoAnimado from '../components/BotaoAnimado';

import {
  Auth,
  mensagemErro,
} from '../api';

import { useApp } from '../AppContext';


const C = TEMA_RESPONSAVEL;

const V = 'adulto';

const F = fontesFor(V);

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


// Entrada suave (fade + leve subida) para o cartão de formulário.
function useEntrada() {
  const progresso = useRef(
    new Animated.Value(0)
  ).current;

  useEffect(() => {
    Animated.timing(progresso, {
      toValue: 1,
      duration: 480,

      // No navegador o react-native-web não possui
      // o módulo nativo de animação.
      // No Android/iOS continua usando o driver nativo.
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, []);

  return {
    opacity: progresso,

    transform: [
      {
        translateY: progresso.interpolate({
          inputRange: [0, 1],
          outputRange: [24, 0],
        }),
      },
    ],
  };
}


export function TelaLogin({
  onCadastro,
  onEntrarComoPareado,
}) {
  const s = useMemo(
    () => criarEstilos(C, V),
    []
  );

  const { login } = useApp();

  const [email, setEmail] = useState('');

  const [senha, setSenha] = useState('');

  const [erros, setErros] = useState({});

  const [erroServidor, setErroServidor] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

  const entrada = useEntrada();


  const validar = () => {
    const e = {};

    if (!email.trim()) {
      e.email = 'Digite seu e-mail';
    } else if (
      !EMAIL_REGEX.test(email.trim())
    ) {
      e.email = 'E-mail em formato inválido';
    }

    if (!senha) {
      e.senha = 'Digite sua senha';
    }

    setErros(e);

    return Object.keys(e).length === 0;
  };


  const handleLogin = async () => {
    setErroServidor(null);

    if (!validar()) {
      return;
    }

    setLoading(true);

    try {
      const res = await Auth.login(
        email.trim(),
        senha
      );

      if (res.data.success) {
        await login(
          res.data.usuario,
          res.data.token
        );
      } else {
        setErroServidor(
          res.data.message ||
            'Não foi possível entrar'
        );
      }
    } catch (err) {
      setErroServidor(
        mensagemErro(err)
      );
    } finally {
      setLoading(false);
    }
  };


  return (
    <SafeAreaView
      style={{
        flex: 1,
      }}
    >
      <KeyboardAvoidingView
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : undefined
        }
        style={{
          flex: 1,
        }}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
          }}
          keyboardShouldPersistTaps="handled"
          onScrollBeginDrag={Keyboard.dismiss}
        >
          <View
            style={{
              alignItems: 'center',
              paddingTop: normalize(64),
              paddingBottom: normalize(32),
            }}
          >
            <View
              style={{
                borderRadius: normalize(26),

                ...Platform.select({
                  ios: {
                    shadowColor: '#000',
                    shadowOffset: {
                      width: 0,
                      height: 10,
                    },
                    shadowOpacity: 0.25,
                    shadowRadius: 20,
                  },

                  default: {
                    elevation: 8,
                  },
                }),
              }}
            >
              <PainelVidro
                variante={V}
                arredondado={normalize(26)}
                style={{
                  width: normalize(72),
                  height: normalize(72),
                }}
              >
                <View
                  style={{
                    flex: 1,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                />
              </PainelVidro>
            </View>

            <Text
              style={{
                fontSize: normalize(28),
                fontFamily: F.display,
                color: '#FFFFFF',
                marginTop: normalize(16),
                letterSpacing: 1.5,
              }}
            >
              M.O.T.I.O.N
            </Text>

            <Text
              style={{
                fontSize: normalize(13.5),
                fontFamily: F.body,
                color: 'rgba(255,255,255,0.7)',
                marginTop: normalize(5),
              }}
            >
              Painel do responsável
            </Text>
          </View>

          <Animated.View
            style={[
              {
                flex: 1,
                backgroundColor: C.fundo,
                borderTopLeftRadius: normalize(28),
                borderTopRightRadius: normalize(28),
                padding: normalize(28),
              },
              entrada,
            ]}
          >
            <Text
              style={{
                fontSize: normalize(21),
                fontFamily: F.display,
                color: C.texto,
                marginBottom: normalize(20),
              }}
            >
              Entrar
            </Text>

            <BannerErro
              mensagem={erroServidor}
              C={C}
              variante={V}
              onFechar={() =>
                setErroServidor(null)
              }
            />

            <Campo
              label="E-mail"
              C={C}
              variante={V}
              erro={erros.email}
              placeholder="seu@email.com"
              value={email}
              onChangeText={(t) => {
                setEmail(t);

                setErros((p) => ({
                  ...p,
                  email: null,
                }));
              }}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Campo
              label="Senha"
              C={C}
              variante={V}
              erro={erros.senha}
              placeholder="******"
              value={senha}
              onChangeText={(t) => {
                setSenha(t);

                setErros((p) => ({
                  ...p,
                  senha: null,
                }));
              }}
              secureTextEntry
            />

            <BotaoAnimado
              onPress={handleLogin}
              loading={loading}
              style={[
                s.botaoPrimario,
                {
                  marginTop: normalize(16),
                },
              ]}
            >
              <Text
                style={s.botaoPrimarioTxt}
              >
                Entrar
              </Text>
            </BotaoAnimado>

            <TouchableOpacity
              onPress={onCadastro}
              style={{
                marginTop: normalize(22),
                alignItems: 'center',
              }}
              activeOpacity={0.7}
            >
              <Text
                style={{
                  color: C.secundaria,
                  fontFamily: F.bodyBold,
                }}
              >
                Criar uma conta nova
              </Text>
            </TouchableOpacity>

            <View
              style={{
                height: 1,
                backgroundColor: C.borda,
                marginVertical: normalize(20),
              }}
            />

            <TouchableOpacity
              onPress={onEntrarComoPareado}
              style={{
                alignItems: 'center',
              }}
              activeOpacity={0.7}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: normalize(6),
                }}
              >
                <Ionicons
                  name="phone-portrait-outline"
                  size={normalize(14)}
                  color={C.subtexto}
                />

                <Text
                  style={{
                    color: C.subtexto,
                    fontFamily: F.bodyBold,
                  }}
                >
                  Este é o dispositivo da criança?
                </Text>
              </View>

              <Text
                style={{
                  color: C.subtexto,
                  fontFamily: F.body,
                  fontSize: normalize(12),
                  marginTop: 2,
                }}
              >
                Parear com código
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}


export function TelaCadastro({
  onVoltar,
}) {
  const s = useMemo(
    () => criarEstilos(C, V),
    []
  );

  const { login } = useApp();

  const [nome, setNome] = useState('');

  const [email, setEmail] = useState('');

  const [senha, setSenha] = useState('');

  const [confirmar, setConfirmar] =
    useState('');

  const [erros, setErros] =
    useState({});

  const [erroServidor, setErroServidor] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

  const entrada = useEntrada();


  const validar = () => {
    const e = {};

    if (!nome.trim()) {
      e.nome = 'Digite seu nome';
    }

    if (!email.trim()) {
      e.email = 'Digite seu e-mail';
    } else if (
      !EMAIL_REGEX.test(email.trim())
    ) {
      e.email =
        'E-mail em formato inválido';
    }

    if (!senha) {
      e.senha = 'Crie uma senha';
    } else if (senha.length < 6) {
      e.senha =
        'Use pelo menos 6 caracteres';
    }

    if (confirmar !== senha) {
      e.confirmar =
        'As senhas não coincidem';
    }

    setErros(e);

    return Object.keys(e).length === 0;
  };


  const handleCadastro = async () => {
    setErroServidor(null);

    if (!validar()) {
      return;
    }

    setLoading(true);

    try {
      const res = await Auth.cadastrar(
        nome.trim(),
        email.trim(),
        senha,
        ''
      );

      if (res.data.success) {
        // Login automático.
        await login(
          res.data.usuario,
          res.data.token
        );
      } else {
        setErroServidor(
          res.data.message
        );
      }
    } catch (err) {
      setErroServidor(
        mensagemErro(
          err,
          'Falha na conexão'
        )
      );
    } finally {
      setLoading(false);
    }
  };


  const limparErro = (campo) => {
    setErros((p) => ({
      ...p,
      [campo]: null,
    }));
  };


  return (
    <SafeAreaView
      style={{
        flex: 1,
      }}
    >
      <PainelVidro
        variante={V}
        style={{
          paddingTop:
            Platform.OS === 'android'
              ? (StatusBar.currentHeight || 0) +
                normalize(20)
              : normalize(56),

          paddingBottom: normalize(20),

          paddingHorizontal: normalize(24),
        }}
      >
        <Text
          style={{
            fontSize: normalize(20),
            fontFamily: F.display,
            color: '#FFFFFF',
          }}
        >
          Nova conta de responsável
        </Text>
      </PainelVidro>

      <KeyboardAvoidingView
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : undefined
        }
        style={{
          flex: 1,
          backgroundColor: C.fundo,
        }}
      >
        <ScrollView
          contentContainerStyle={{
            padding: normalize(24),
          }}
          keyboardShouldPersistTaps="handled"
          onScrollBeginDrag={Keyboard.dismiss}
        >
          <Animated.View style={entrada}>
            <BannerErro
              mensagem={erroServidor}
              C={C}
              variante={V}
              onFechar={() =>
                setErroServidor(null)
              }
            />

            <Campo
              label="Nome completo"
              C={C}
              variante={V}
              erro={erros.nome}
              placeholder="Seu nome"
              value={nome}
              onChangeText={(t) => {
                setNome(t);
                limparErro('nome');
              }}
            />

            <Campo
              label="E-mail"
              C={C}
              variante={V}
              erro={erros.email}
              placeholder="seu@email.com"
              value={email}
              onChangeText={(t) => {
                setEmail(t);
                limparErro('email');
              }}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Campo
              label="Senha"
              C={C}
              variante={V}
              erro={erros.senha}
              placeholder="Mínimo 6 caracteres"
              value={senha}
              onChangeText={(t) => {
                setSenha(t);
                limparErro('senha');
              }}
              secureTextEntry
            />

            <Campo
              label="Confirmar senha"
              C={C}
              variante={V}
              erro={erros.confirmar}
              placeholder="Repita a senha"
              value={confirmar}
              onChangeText={(t) => {
                setConfirmar(t);
                limparErro('confirmar');
              }}
              secureTextEntry
            />

            <Text
              style={{
                color: C.subtexto,
                fontFamily: F.body,
                fontSize: normalize(12.5),
                marginBottom: normalize(16),
                lineHeight: normalize(18),
              }}
            >
              Depois de criar a conta, você
              poderá cadastrar o perfil de uma
              ou mais crianças.
            </Text>

            <BotaoAnimado
              onPress={handleCadastro}
              loading={loading}
              style={s.botaoPrimario}
            >
              <Text
                style={s.botaoPrimarioTxt}
              >
                Criar conta
              </Text>
            </BotaoAnimado>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      <BotaoVoltar
        onPress={onVoltar}
        C={C}
        variante={V}
      />
    </SafeAreaView>
  );
}