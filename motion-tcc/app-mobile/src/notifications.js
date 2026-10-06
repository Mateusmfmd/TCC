import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const CHAVE_MAPA = 'motion.lembrete.notificacoes.v1';
const CANAL_LEMBRETES = 'motion-lembretes';
const TITULO = 'M.O.T.I.O.N — Lembrete';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function mensagemErroNotificacao(err, fallback = 'Não foi possível configurar as notificações.') {
  return err?.message || fallback;
}

/**
 * Inicializa o canal Android e solicita a permissão necessária para mostrar
 * notificações locais. O resultado é retornado para a UI, em vez de ser
 * descartado silenciosamente.
 */
export async function configurarNotificacoes() {
  try {
    if (Platform.OS === 'web') {
      return { enabled: false, message: 'Notificações locais funcionam somente no aplicativo instalado.' };
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(CANAL_LEMBRETES, {
        name: 'Lembretes',
        description: 'Avisos de lembretes do M.O.T.I.O.N',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 150, 250],
        sound: 'default',
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      });
    }

    let { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      const resposta = await Notifications.requestPermissionsAsync();
      status = resposta.status;
    }

    if (status !== 'granted') {
      return {
        enabled: false,
        message: 'Permissão de notificações negada. Ative-a nas configurações do aparelho para receber lembretes.',
      };
    }

    return { enabled: true, message: 'Notificações ativadas neste aparelho.' };
  } catch (err) {
    return { enabled: false, message: mensagemErroNotificacao(err) };
  }
}

async function lerMapa() {
  try {
    const raw = await AsyncStorage.getItem(CHAVE_MAPA);
    return raw ? JSON.parse(raw) : {};
  } catch (_) {
    return {};
  }
}

async function salvarMapa(mapa) {
  await AsyncStorage.setItem(CHAVE_MAPA, JSON.stringify(mapa));
}

export async function cancelarNotificacaoLembrete(id_lembrete) {
  const mapa = await lerMapa();
  const chave = String(id_lembrete);
  if (!mapa[chave]) return { ok: true };

  try {
    await Notifications.cancelScheduledNotificationAsync(mapa[chave]);
  } catch (_) {
    // A notificação pode já ter sido removida pelo sistema; a referência local
    // ainda deve ser limpa para não bloquear um novo agendamento.
  }
  delete mapa[chave];
  await salvarMapa(mapa);
  return { ok: true };
}

/**
 * Agenda ou reagenda um lembrete. A recorrência semanal usa o mesmo dia da
 * semana em que o lembrete foi criado, já que o formulário não possui um
 * seletor de dia específico.
 */
export async function agendarNotificacaoLembrete({ id_lembrete, texto, hora, recorrencia }) {
  try {
    await cancelarNotificacaoLembrete(id_lembrete);

    if (!hora) return { ok: true, scheduled: false, message: 'Lembrete salvo sem notificação porque nenhum horário foi informado.' };

    const partes = hora.split(':');
    const horaNum = Number(partes[0]);
    const minutoNum = Number(partes[1]);
    if (!Number.isInteger(horaNum) || !Number.isInteger(minutoNum) || horaNum < 0 || horaNum > 23 || minutoNum < 0 || minutoNum > 59) {
      return { ok: false, scheduled: false, message: 'Horário inválido. Use o formato HH:MM.' };
    }

    const agora = new Date();
    let trigger;
    if (recorrencia === 'diaria') {
      trigger = { hour: horaNum, minute: minutoNum, repeats: true };
    } else if (recorrencia === 'semanal') {
      // Expo usa domingo=1, segunda=2, ..., sábado=7.
      trigger = { weekday: agora.getDay() + 1, hour: horaNum, minute: minutoNum, repeats: true };
    } else {
      const proxima = new Date();
      proxima.setHours(horaNum, minutoNum, 0, 0);
      if (proxima <= agora) proxima.setDate(proxima.getDate() + 1);
      trigger = proxima;
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: TITULO,
        body: texto,
        sound: 'default',
        ...(Platform.OS === 'android' ? { channelId: CANAL_LEMBRETES } : {}),
        data: { tipo: 'lembrete', id_lembrete: String(id_lembrete) },
      },
      trigger,
    });

    const mapa = await lerMapa();
    mapa[String(id_lembrete)] = notificationId;
    await salvarMapa(mapa);
    return { ok: true, scheduled: true, message: 'Lembrete salvo e notificação programada.' };
  } catch (err) {
    return { ok: false, scheduled: false, message: mensagemErroNotificacao(err, 'Não foi possível programar a notificação. Verifique as permissões do aparelho.') };
  }
}


/** Reagenda os lembretes persistidos localmente após reinício do aplicativo. */
export async function sincronizarNotificacoesLembretes(lembretes = []) {
  const configuracao = await configurarNotificacoes();
  if (!configuracao.enabled) return configuracao;
  const resultados = [];
  for (const lembrete of lembretes) {
    if (lembrete.feito || !lembrete.hora) continue;
    resultados.push(await agendarNotificacaoLembrete({
      id_lembrete: lembrete.id_lembrete,
      texto: lembrete.texto,
      hora: lembrete.hora,
      recorrencia: lembrete.recorrencia,
    }));
  }
  return { enabled: true, scheduled: resultados.filter((x) => x.scheduled).length, results: resultados };
}


const CHAVE_AVISOS_NOTIFICADOS = 'motion.avisos.notificados.v1';
export async function notificarAvisoNovo(aviso) {
  try {
    if (!aviso?.id_aviso || aviso.lido || Platform.OS === 'web') return { scheduled: false };
    const config = await configurarNotificacoes();
    if (!config.enabled) return config;
    const raw = await AsyncStorage.getItem(CHAVE_AVISOS_NOTIFICADOS);
    const ids = raw ? JSON.parse(raw) : {};
    const chave = String(aviso.id_aviso);
    if (ids[chave]) return { scheduled: false, duplicate: true };
    await Notifications.scheduleNotificationAsync({
      content: { title: aviso.titulo || 'Novo aviso', body: aviso.mensagem || 'Você recebeu um aviso.', sound: 'default', ...(Platform.OS === 'android' ? { channelId: CANAL_LEMBRETES } : {}), data: { tipo: 'aviso', id_aviso: chave } },
      trigger: null,
    });
    ids[chave] = Date.now();
    await AsyncStorage.setItem(CHAVE_AVISOS_NOTIFICADOS, JSON.stringify(ids));
    return { scheduled: true };
  } catch (error) {
    return { scheduled: false, error };
  }
}
