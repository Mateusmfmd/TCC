import * as Speech from 'expo-speech';

let vozesCache = null;
let promessaVozes = null;

const nomesFemininos = ['female', 'femin', 'mulher', 'woman', 'girl', 'maria', 'luciana', 'helena', 'joana', 'samantha', 'victoria', 'monica'];
const nomesMasculinos = ['male', 'masc', 'homem', 'man', 'boy', 'carlos', 'daniel', 'joao', 'joão', 'ricardo', 'lucas', 'bruno'];

function ePortugues(voz) {
  return /^(pt|pt[-_]br|pt[-_]pt)/i.test(String(voz?.language || ''));
}
function temNome(lista, voz) {
  const nome = `${voz?.name || ''} ${voz?.identifier || ''}`.toLowerCase();
  return lista.some((parte) => nome.includes(parte));
}

export async function listarVozesDisponiveis() {
  if (vozesCache) return vozesCache;
  if (!promessaVozes) {
    promessaVozes = Speech.getAvailableVoicesAsync()
      .then((vozes) => {
        vozesCache = Array.isArray(vozes) ? vozes : [];
        return vozesCache;
      })
      .catch(() => { vozesCache = []; return vozesCache; });
  }
  return promessaVozes;
}

export async function statusVozes() {
  const vozes = (await listarVozesDisponiveis()).filter(ePortugues);
  return {
    total: vozes.length,
    feminina: vozes.some((v) => temNome(nomesFemininos, v)),
    masculina: vozes.some((v) => temNome(nomesMasculinos, v)),
  };
}

function escolherVoz(vozes, genero) {
  const portuguesas = vozes.filter(ePortugues);
  if (genero && portuguesas.length) {
    const lista = genero === 'masculina' ? nomesMasculinos : nomesFemininos;
    return portuguesas.find((voz) => temNome(lista, voz)) || null;
  }
  return null;
}

// Fala no próprio aparelho. A seleção feminina/masculina usa uma voz pt-BR
// instalada quando o sistema expõe essa informação; se não expuser, o app
// mantém a fala funcional e usa pitch como fallback, sem depender da internet.
export async function falarTexto(texto, config = {}) {
  const textoSeguro = String(texto || '').trim();
  if (!textoSeguro) return false;
  const voz = config.voz || 'feminina';
  const pitch = voz === 'feminina' ? 1.2 : 0.8;
  const rate = Math.max(0.5, Math.min(1.5, Number(config.velocidade_voz) || 0.85));
  const volume = Math.max(0, Math.min(1, Number(config.volume) || 0.8));
  try {
    Speech.stop();
    const vozes = await listarVozesDisponiveis();
    const selecionada = config.voiceIdentifier
      ? vozes.find((item) => item.identifier === config.voiceIdentifier)
      : escolherVoz(vozes, voz);
    Speech.speak(textoSeguro, {
      language: 'pt-BR',
      ...(selecionada?.identifier ? { voice: selecionada.identifier } : {}),
      pitch,
      rate,
      volume,
      onError: (error) => console.warn('[MOTION] Falha no sintetizador de voz local:', error?.message || error),
    });
    return true;
  } catch (error) {
    console.warn('[MOTION] Não foi possível iniciar a fala local:', error?.message || error);
    return false;
  }
}

export function pararFala() {
  try { Speech.stop(); } catch (_) { /* módulo nativo indisponível neste ambiente */ }
}
