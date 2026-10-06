// Rascunho mantido pela tela pai do Modo Criança. Não há limite artificial
// de palavras: a criança pode continuar acrescentando itens de outras categorias.
let nextDraftKey = 1;

export function addPhraseItem(phrase, item) {
  return [...(Array.isArray(phrase) ? phrase : []), { ...item, draftKey: `phrase-${nextDraftKey++}` }];
}

export function removePhraseItem(phrase, index) {
  const current = Array.isArray(phrase) ? phrase : [];
  if (index < 0 || index >= current.length) return current;
  return current.filter((_, itemIndex) => itemIndex !== index);
}

export function removeLastPhraseItem(phrase) {
  const current = Array.isArray(phrase) ? phrase : [];
  return current.slice(0, -1);
}

export function clearPhraseDraft() {
  return [];
}

export function getPhraseText(phrase) {
  return (Array.isArray(phrase) ? phrase : []).map((item) => item.texto).filter(Boolean).join(' ');
}
