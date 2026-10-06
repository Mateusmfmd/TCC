import {
  Criancas, Categorias, Pictogramas, Frases, Rotinas, Lembretes,
  Mood, Historico, Avisos,
} from './api';
import { offlinePendingSnapshot, markOfflineChildSynced } from './offlineStore';

const sameText = (a, b) => String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase();

export async function sincronizarOfflineComServidor() {
  const snapshot = await offlinePendingSnapshot();
  const onlineChildren = (await Criancas.listar()).data?.criancas || [];
  let sincronizados = 0;
  for (const localChild of snapshot.children) {
    try {
      const existing = onlineChildren.find((child) => Number(child.id_crianca) === Number(localChild.remote_id) || sameText(child.nome, localChild.nome));
      const created = existing ? { data: { id_crianca: existing.id_crianca } } : await Criancas.criar(localChild.usuario_id, localChild.nome, localChild.avatar_emoji);
      const remoteId = Number(created.data?.id_crianca);
      if (!remoteId) continue;
      await Criancas.atualizar({ id_crianca: remoteId, nome: localChild.nome, avatar_emoji: localChild.avatar_emoji, pin_saida: localChild.pin_saida, tamanho_pictograma: localChild.tamanho_pictograma, tema: localChild.tema, voz: localChild.voz, alto_contraste: localChild.alto_contraste, alvos_gigantes: localChild.alvos_gigantes, varredura_ativa: localChild.varredura_ativa, tempo_resposta: localChild.tempo_resposta, varredura_velocidade: localChild.varredura_velocidade });

      const remoteCategories = (await Categorias.listar(remoteId)).data?.categorias || [];
      const localCategories = snapshot.categorias.filter((c) => c.crianca_id === localChild.id_crianca).sort((a, b) => a.ordem - b.ordem);
      for (let i = 0; i < localCategories.length; i++) {
        const localCategory = localCategories[i];
        let remoteCategory = remoteCategories[i];
        if (remoteCategory) {
          await Categorias.atualizar({ id_categoria: remoteCategory.id_categoria, nome_categoria: localCategory.nome_categoria, emoji: localCategory.emoji, cor: localCategory.cor, ordem: i + 1 });
        } else {
          const made = await Categorias.criar({ crianca_id: remoteId, nome_categoria: localCategory.nome_categoria, emoji: localCategory.emoji, cor: localCategory.cor });
          remoteCategory = { id_categoria: made.data.id_categoria };
        }
        const localFalas = snapshot.falas.filter((f) => f.id_categoria === localCategory.id_categoria).sort((a, b) => a.ordem - b.ordem);
        const remoteFalas = (await Pictogramas.listar(remoteCategory.id_categoria)).data?.falas || [];
        for (let j = 0; j < localFalas.length; j++) {
          const localFala = localFalas[j];
          if (remoteFalas[j]) await Pictogramas.atualizar({ id_fala: remoteFalas[j].id_fala, texto: localFala.texto, emoji: localFala.emoji, ordem: j + 1 });
          else await Pictogramas.criar({ id_categoria: remoteCategory.id_categoria, texto: localFala.texto, emoji: localFala.emoji, ordem: j + 1 });
        }
      }

      const localPhrases = snapshot.frases.filter((f) => f.crianca_id === localChild.id_crianca);
      const remotePhrases = (await Frases.listar(remoteId)).data?.frases || [];
      for (const phrase of localPhrases) if (!remotePhrases.some((r) => sameText(r.texto, phrase.texto))) await Frases.salvar({ crianca_id: remoteId, texto: phrase.texto });

      const localRoutines = snapshot.rotinas.filter((r) => r.crianca_id === localChild.id_crianca);
      const remoteRoutines = (await Rotinas.listar(remoteId)).data?.rotinas || [];
      for (const routine of localRoutines) {
        if (!remoteRoutines.some((r) => sameText(r.atividade, routine.atividade) && String(r.horario).slice(0, 5) === String(routine.horario).slice(0, 5))) {
          await Rotinas.criar({ crianca_id: remoteId, atividade: routine.atividade, horario: String(routine.horario).slice(0, 5), icone: routine.icone, dias_semana: routine.dias_semana || ['Todos os dias'] });
        }
      }

      const localReminders = snapshot.lembretes.filter((r) => r.crianca_id === localChild.id_crianca);
      const remoteReminders = (await Lembretes.listar(remoteId)).data?.lembretes || [];
      for (const reminder of localReminders) {
        if (!remoteReminders.some((r) => sameText(r.texto, reminder.texto) && String(r.hora || '').slice(0, 5) === String(reminder.hora || '').slice(0, 5))) {
          await Lembretes.criar({ crianca_id: remoteId, texto: reminder.texto, hora: reminder.hora, recorrencia: reminder.recorrencia });
        }
      }

      const remoteMood = (await Mood.listar(remoteId, 365)).data?.humor || [];
      for (const mood of snapshot.mood.filter((m) => m.crianca_id === localChild.id_crianca)) {
        if (!remoteMood.some((r) => sameText(r.humor, mood.humor) && String(r.data_registro || '').slice(0, 16) === String(mood.data_registro || '').slice(0, 16))) await Mood.registrar({ crianca_id: remoteId, humor: mood.humor, emoji: mood.emoji });
      }
      const remoteHistory = (await Historico.listar(remoteId, 365)).data?.historico || [];
      for (const history of snapshot.historico.filter((h) => h.crianca_id === localChild.id_crianca)) {
        if (!remoteHistory.some((r) => sameText(r.texto, history.texto) && String(r.data_uso || '').slice(0, 16) === String(history.data_uso || '').slice(0, 16))) await Historico.registrar({ crianca_id: remoteId, texto: history.texto, emoji: history.emoji, tipo: history.tipo || 'fala' });
      }
      const remoteAvisos = (await Avisos.listar(remoteId)).data?.avisos || [];
      for (const aviso of snapshot.avisos.filter((a) => a.crianca_id === localChild.id_crianca)) {
        if (!remoteAvisos.some((r) => sameText(r.titulo, aviso.titulo) && sameText(r.mensagem, aviso.mensagem))) await Avisos.criar({ crianca_id: remoteId, titulo: aviso.titulo, mensagem: aviso.mensagem, emoji: aviso.emoji });
      }

      await markOfflineChildSynced(localChild.id_crianca, remoteId);
      sincronizados++;
    } catch (error) {
      console.warn('[MOTION] Sincronização pendente para criança offline:', localChild.nome, error?.message || error);
    }
  }
  return sincronizados;
}
