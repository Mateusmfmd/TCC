import * as Speech from 'expo-speech';

// Fala um texto respeitando as configurações da criança ativa (voz, velocidade, volume).
// Substitui o antigo padrão de variável global `configGlobal` do App.js original.
export function falarTexto(texto, config = {}) {
  const voz = config.voz || 'feminina';
  const pitch = voz === 'feminina' ? 1.2 : 0.8;
  Speech.speak(texto, {
    language: 'pt-BR',
    pitch,
    rate: Number(config.velocidade_voz) || 0.85,
    volume: Number(config.volume) ?? 0.8,
  });
}

export function pararFala() {
  Speech.stop();
}
