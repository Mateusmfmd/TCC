import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CHAVE_MAPA = 'motion.lembrete.notificacoes.v1';

// Notificações locais de lembrete. Ficam agendadas no aparelho onde o
// responsável cadastrou o lembrete (normalmente o próprio celular do pai/mãe,
// já que a edição de lembretes só existe no modo Responsável) — não é um
// push de servidor, então só dispara nesse mesmo aparelho.
//
// Limitação assumida conscientemente: recorrência "toda semana" não tem um
// dia da semana associado no formulário de lembretes (só rotinas têm), então
// só agendamos notificação para "uma vez" e "todo dia"; "toda semana" continua
// aparecendo normalmente na lista, só não dispara notificação.

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function configurarNotificacoes() {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      await Notifications.requestPermissionsAsync();
    }
  } catch (e) {
    // Sem permissão — os lembretes continuam funcionando normalmente na lista,
    // só não vão disparar notificação no aparelho.
  }
}

async function lerMapa() {
  try {
    const raw = await AsyncStorage.getItem(CHAVE_MAPA);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

async function salvarMapa(mapa) {
  try { await AsyncStorage.setItem(CHAVE_MAPA, JSON.stringify(mapa)); } catch (e) { /* ignora */ }
}

// Cancela e remove qualquer notificação já agendada para este lembrete.
export async function cancelarNotificacaoLembrete(id_lembrete) {
  const mapa = await lerMapa();
  const chave = String(id_lembrete);
  if (mapa[chave]) {
    try { await Notifications.cancelScheduledNotificationAsync(mapa[chave]); } catch (e) { /* já não existe */ }
    delete mapa[chave];
    await salvarMapa(mapa);
  }
}

// Agenda (ou reagenda) a notificação de um lembrete a partir de hora ("HH:MM")
// e recorrência. Retorna true se conseguiu agendar algo.
export async function agendarNotificacaoLembrete({ id_lembrete, texto, hora, recorrencia }) {
  await cancelarNotificacaoLembrete(id_lembrete);

  if (!hora || recorrencia === 'semanal') return false;

  const [horaStr, minutoStr] = hora.split(':');
  const horaNum = parseInt(horaStr, 10);
  const minutoNum = parseInt(minutoStr, 10);
  if (Number.isNaN(horaNum) || Number.isNaN(minutoNum)) return false;

  const trigger = recorrencia === 'diaria'
    ? { hour: horaNum, minute: minutoNum, repeats: true }
    : (() => {
        const agora = new Date();
        const proxima = new Date();
        proxima.setHours(horaNum, minutoNum, 0, 0);
        if (proxima <= agora) proxima.setDate(proxima.getDate() + 1);
        return proxima;
      })();

  try {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: { title: 'M.O.T.I.O.N — Lembrete', body: texto },
      trigger,
    });
    const mapa = await lerMapa();
    mapa[String(id_lembrete)] = notificationId;
    await salvarMapa(mapa);
    return true;
  } catch (e) {
    return false;
  }
}
