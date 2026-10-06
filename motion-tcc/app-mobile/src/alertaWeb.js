import { Alert, Platform } from 'react-native';

// No react-native-web, `Alert.alert()` é um método VAZIO:
//
//   class Alert { static alert() {} }
//
// Ou seja: no navegador, toda confirmação do app (excluir perfil, remover
// categoria/pictograma/rotina/lembrete, limpar histórico, sair do modo
// criança) e todo aviso de erro simplesmente não apareciam — a ação parecia
// não fazer nada, e o erro ficava invisível. Como o projeto também roda na
// web (expo start --web / build web), isso é um problema real, não um detalhe.
//
// Este módulo instala uma implementação equivalente usando os diálogos do
// navegador, mantendo a mesma assinatura do React Native
// (titulo, mensagem, [{ text, style, onPress }]) para que nenhuma tela precise
// ser alterada. No Android/iOS nada é trocado: continua sendo o diálogo nativo.
//
// Particularidades do navegador:
//  - 1 botão  → window.alert (o `onPress` é chamado depois, como no nativo —
//    há telas que navegam nesse callback, ex: "Perfil criado ✅").
//  - 2 botões → window.confirm (OK dispara a ação; Cancelar não faz nada).
//  - 3+ botões (menus do tipo segurar-para-escolher) → window.prompt numerado,
//    porque o navegador não tem diálogo de lista.
export function instalarAlertaWeb() {
  if (Platform.OS !== 'web') return false;
  if (typeof window === 'undefined' || Alert.__motionWebInstalado) return false;

  Alert.alert = (titulo, mensagem, botoes) => {
    const corpo = [titulo, mensagem].filter((t) => typeof t === 'string' && t.trim()).join('\n\n');
    const lista = Array.isArray(botoes) ? botoes.filter((b) => b && b.text) : [];

    if (lista.length === 0) {
      window.alert(corpo);
      return;
    }

    if (lista.length === 1) {
      window.alert(corpo);
      lista[0].onPress?.();
      return;
    }

    const cancelar = lista.find((b) => b.style === 'cancel');
    const acoes = lista.filter((b) => b.style !== 'cancel');

    if (acoes.length === 1) {
      const pergunta = `${corpo}\n\nOK = ${acoes[0].text}${cancelar ? `\nCancelar = ${cancelar.text}` : ''}`;
      if (window.confirm(pergunta)) acoes[0].onPress?.();
      return;
    }

    const opcoes = lista.map((b, i) => `${i + 1}. ${b.text}`).join('\n');
    const resposta = window.prompt(`${corpo}\n\n${opcoes}\n\nDigite o número da opção desejada:`, '');
    const escolhido = lista[Number(resposta) - 1];
    if (escolhido && escolhido.style !== 'cancel') escolhido.onPress?.();
  };

  Alert.__motionWebInstalado = true;
  return true;
}
