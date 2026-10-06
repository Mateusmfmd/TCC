> Rascunho baseado só no que está no código e nos READMEs. Revise os trechos marcados com **[confirme]** para refletir o que você realmente fez e viveu. Nenhum número ou resultado foi inventado.


# Roteiro de entrevista — arduino-sensores

**Qual problema o projeto resolve?**
Permite acionar uma resposta sem tocar em nada, para quem não consegue apertar botões.

**Por que você escolheu essas tecnologias?**
Sensores ultrassônicos são baratos e fáceis de usar com Arduino, e a comunicação serial dispensa hardware extra.

**Como o projeto está organizado?**
Constantes de pinos no topo, uma função que mede uma vez, outra que calcula a mediana de 3 leituras e outra, `checarSensor`, que aplica a regra de disparo para qualquer sensor.

**Como funciona o banco de dados?**
Não usa banco. A cor sai pela serial e a ponte Python do M.O.T.I.O.N. consulta o MySQL para achar o áudio.

**Como você tratou erros e validações?**
Timeout de 30 ms no `pulseIn`, descarte de leitura zero, mediana para picos e histerese (8 cm / 13 cm) para evitar repetição.

**Qual foi a maior dificuldade?** **[confirme]**
Deixar a leitura estável: sem filtro, o sensor disparava com ruído.

**O que você faria diferente?**
Deixaria os limites configuráveis sem regravar o Arduino e testaria melhor a interferência entre os sensores.

**Como o projeto poderia crescer?**
Mais sensores, calibração por distância enviada pela serial e uma proteção física transparente na frente dos sensores.
