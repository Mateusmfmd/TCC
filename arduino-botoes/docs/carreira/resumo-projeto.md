> Rascunho baseado só no que está no código e nos READMEs. Revise os trechos marcados com **[confirme]** para refletir o que você realmente fez e viveu. Nenhum número ou resultado foi inventado.


# Resumo — arduino-botoes

## Problema
Quem não consegue tocar em uma tela precisa de um acionador físico simples para comunicar uma escolha.

## Solução
Painel com 5 botões coloridos e 1 sensor ultrassônico em Arduino. Cada acionamento envia o nome da cor pela serial; o M.O.T.I.O.N. associa cada cor a um áudio.

## Meu papel no desenvolvimento
**[confirme]** Montagem do circuito e programação do sketch.

## Tecnologias usadas
Arduino (C++), comunicação serial a 9600 baud, sensor ultrassônico TRIG/ECHO.

## Principais desafios
Enviar a cor uma única vez por aperto e evitar disparos repetidos do sensor quando a mão fica parada. **[confirme]**

## Decisões técnicas
- `INPUT_PULLUP` nos botões, sem resistores externos.
- Detecção de borda de descida para disparar uma vez por aperto.
- Histerese no sensor: dispara abaixo de 10 cm e só rearma acima de 15 cm.
- Timeout no `pulseIn` para não travar sem eco.

## Resultado demonstrável
Ao apertar um botão ou aproximar a mão do sensor, o Monitor Serial mostra a cor uma vez. Ligado ao M.O.T.I.O.N., a cor toca o áudio configurado.

## Melhorias futuras
Debounce explícito, filtro de mediana no sensor e código com vetor de botões para reduzir repetição.
