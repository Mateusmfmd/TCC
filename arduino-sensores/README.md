# arduino-sensores

Painel de acionamento **sem contato** com **3 sensores ultrassônicos** em Arduino (C++). Aproximar a mão de um sensor envia o nome da cor correspondente pela porta serial.

Parte do projeto **M.O.T.I.O.N.** (TCC de tecnologia assistiva e comunicação alternativa): uma alternativa ao botão físico para quem tem dificuldade de apertar.

## Funcionalidades

- 3 sensores independentes: vermelho, amarelo e preto.
- **Mediana de 3 leituras** por sensor para filtrar picos causados por interferência.
- **Histerese**: dispara a menos de 8 cm e só rearma depois de passar de 13 cm, evitando disparos repetidos.
- Timeout de 30 ms no `pulseIn` para não travar sem eco.
- Função genérica `checarSensor`, reutilizada para os três sensores.

## Hardware

| Sensor | TRIG | ECHO |
|---|---|---|
| Vermelho | 9 | 10 |
| Amarelo | 2 | 3 |
| Preto | 4 | 5 |

Sensores com padrão TRIG/ECHO (compatíveis com o HC-SR04).

## Protocolo serial

- 9600 baud, uma palavra por linha: `vermelho`, `amarelo` ou `preto`.
- No M.O.T.I.O.N., a ponte `sistema_motion_full.py` (repositório `motion-tcc`, pasta `backend-php`) lê essa serial e toca o áudio associado à cor.

## Como executar

1. Monte o circuito conforme a tabela.
2. Abra `arduino-sensores.ino` na Arduino IDE, selecione a placa e a porta e faça o upload.
3. Abra o **Monitor Serial** em 9600 baud.

## Como testar

- Aproxime a mão de cada sensor a menos de 8 cm: deve aparecer a cor correspondente **uma vez**.
- Mantenha a mão parada: nada novo deve aparecer. Afaste além de 13 cm e aproxime de novo: dispara outra vez.

## Decisões técnicas

- A mediana de 3 leituras descarta valores isolados errados sem atrasar demais a resposta.
- A histerese (8 cm / 13 cm) separa "mão chegou" de "mão ainda está lá".
- Uma função recebe pinos, estado e nome da cor, evitando código duplicado.

## Melhorias futuras

- Limites ajustáveis sem regravar o Arduino.
- Verificar se a leitura sequencial de 3 sensores gera interferência entre eles e ajustar os intervalos.
- Enviar também a distância medida, para calibração.

## Autor

Mateus Florido Pena — [GitHub](https://github.com/Mateusmfmd)
