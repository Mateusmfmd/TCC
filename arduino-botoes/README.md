# arduino-botoes

Controle físico com **5 botões coloridos** e **1 sensor ultrassônico** em Arduino (C++). Cada acionamento envia o nome da cor pela porta serial, para ser lido por um computador ou servidor.

Parte do projeto **M.O.T.I.O.N.** (TCC de tecnologia assistiva e comunicação alternativa), em que cada cor é associada a uma palavra/áudio no aplicativo.

## Funcionalidades

- Leitura de 5 botões (amarelo, preto, azul, vermelho, verde) com `INPUT_PULLUP`.
- Detecção de **borda de descida**: envia a cor apenas uma vez por aperto, mesmo com o botão mantido.
- Sensor ultrassônico que funciona como um sexto acionador (envia `vermelho`) sem tocar em nada.
- **Histerese** no sensor: dispara abaixo de 10 cm e só rearma depois de passar de 15 cm.
- `pulseIn` com timeout de 30 ms para não travar quando não há eco.

## Hardware

| Componente | Pino |
|---|---|
| Botão amarelo | 7 |
| Botão preto | 6 |
| Botão azul | 5 |
| Botão vermelho | 4 |
| Botão verde | 3 |
| Sensor ultrassônico TRIG | 9 |
| Sensor ultrassônico ECHO | 10 |

Cada botão liga entre o pino e o **GND** (o resistor pull-up interno do Arduino é usado). O sensor usa o padrão TRIG/ECHO (compatível com o HC-SR04).

## Protocolo serial

- 9600 baud, uma palavra por linha: `amarelo`, `preto`, `azul`, `vermelho` ou `verde`.
- No M.O.T.I.O.N., a ponte `sistema_motion_full.py` (repositório `motion-tcc`, pasta `backend-php`) lê essa serial e toca o áudio associado à cor.

## Como executar

1. Monte o circuito conforme a tabela.
2. Abra `arduino-botoes.ino` na Arduino IDE, selecione a placa e a porta e faça o upload.
3. Abra o **Monitor Serial** em 9600 baud.

## Como testar

- Aperte cada botão: a cor correspondente deve aparecer **uma vez** no Monitor Serial.
- Aproxime a mão do sensor a menos de 10 cm: deve aparecer `vermelho` uma vez. Para disparar de novo, afaste a mão além de 15 cm.

## Decisões técnicas

- `INPUT_PULLUP` elimina resistores externos.
- Comparar o estado anterior com o atual evita mensagens repetidas.
- A histerese (10 cm / 15 cm) evita que o sensor dispare várias vezes na mesma aproximação.

## Melhorias futuras

- Debounce explícito dos botões (hoje o `delay(20)` do loop ameniza o ruído).
- Filtro de mediana nas leituras do sensor, como no projeto `arduino-sensores`.
- Reduzir a repetição de código com um vetor de botões.

## Autor

Mateus Florido Pena — [GitHub](https://github.com/Mateusmfmd)
