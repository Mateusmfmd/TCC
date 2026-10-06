> Rascunho baseado só no que está no código e nos READMEs. Revise os trechos marcados com **[confirme]** para refletir o que você realmente fez e viveu. Nenhum número ou resultado foi inventado.


# Roteiro de entrevista — arduino-botoes

**Qual problema o projeto resolve?**
Dá um acionador físico a quem não consegue usar a tela, para escolher uma resposta ou frase.

**Por que você escolheu essas tecnologias?**
Arduino é barato, tem entradas digitais prontas e fala serial com o computador sem driver complexo.

**Como o projeto está organizado?**
Um sketch com constantes de pinos no topo, leitura dos botões no `loop` e uma função para medir a distância do sensor.

**Como funciona o banco de dados?**
O Arduino não usa banco. Ele envia a cor pela serial; a ponte Python do M.O.T.I.O.N. consulta no MySQL qual áudio está associado.

**Como você tratou erros e validações?**
O `pulseIn` tem timeout de 30 ms para não travar sem eco, leituras zero são ignoradas e a histerese evita disparos repetidos.

**Qual foi a maior dificuldade?** **[confirme]**
Evitar que o sensor disparasse várias vezes enquanto a mão estava parada.

**O que você faria diferente?**
Usaria um vetor de botões para reduzir código repetido e adicionaria debounce explícito e filtro de mediana no sensor.

**Como o projeto poderia crescer?**
Limites ajustáveis sem regravar o Arduino, mais botões e envio da distância medida para calibração.
