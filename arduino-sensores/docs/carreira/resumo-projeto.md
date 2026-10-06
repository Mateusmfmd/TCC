> Rascunho baseado só no que está no código e nos READMEs. Revise os trechos marcados com **[confirme]** para refletir o que você realmente fez e viveu. Nenhum número ou resultado foi inventado.


# Resumo — arduino-sensores

## Problema
Alguns usuários não conseguem apertar um botão. Um acionador sem contato permite escolher apenas aproximando a mão.

## Solução
Três sensores ultrassônicos (vermelho, amarelo e preto) em Arduino. Aproximar a mão de um sensor envia o nome da cor pela serial, e o M.O.T.I.O.N. toca o áudio associado.

## Meu papel no desenvolvimento
**[confirme]** Montagem do circuito e programação do sketch.

## Tecnologias usadas
Arduino (C++), serial a 9600 baud, sensores ultrassônicos TRIG/ECHO.

## Principais desafios
Leituras instáveis de sensores ultrassônicos e disparos repetidos. **[confirme]**

## Decisões técnicas
- Mediana de 3 leituras por sensor para descartar picos de interferência.
- Histerese: dispara abaixo de 8 cm e só rearma acima de 13 cm.
- Função única `checarSensor` reutilizada pelos três sensores.
- Timeout de 30 ms no `pulseIn`.

## Resultado demonstrável
Aproximar a mão de cada sensor imprime a cor correspondente uma vez no Monitor Serial; mantendo a mão parada, nada se repete.

## Melhorias futuras
Limites ajustáveis, verificação de interferência entre sensores e envio da distância para calibração.
