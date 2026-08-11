import { useState, useEffect, useRef } from 'react';

// Destaca sequencialmente cada item da lista, avançando a cada `velocidadeMs`.
// Usado no Modo Criança para acessibilidade por acionador único: a criança
// espera o item desejado ficar destacado e toca em qualquer lugar da tela.
export function useVarredura(quantidade, ativa, velocidadeMs = 2000) {
  const [indice, setIndice] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    setIndice(0);
    if (!ativa || quantidade === 0) return undefined;
    timerRef.current = setInterval(() => {
      setIndice((i) => (i + 1) % quantidade);
    }, velocidadeMs);
    return () => clearInterval(timerRef.current);
  }, [ativa, quantidade, velocidadeMs]);

  return indice;
}
