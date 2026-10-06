> Rascunho baseado só no que está no código e nos READMEs. Revise os trechos marcados com **[confirme]** para refletir o que você realmente fez e viveu. Nenhum número ou resultado foi inventado.


E se apertar um botão não for uma opção?

No meu TCC (M.O.T.I.O.N.), programei um acionador sem contato: três sensores ultrassônicos em Arduino. Aproximar a mão de um sensor envia o nome da cor pela serial, e o sistema toca o áudio configurado no app.

Para dar estabilidade, o código usa a mediana de 3 leituras por sensor e histerese, de modo que cada aproximação dispare uma única vez.

Tecnologias: Arduino, C++ e comunicação serial.

Um aprendizado: sensor barato dá leitura ruidosa, e filtrar o sinal é parte do projeto, não um detalhe. **[confirme]**

Código: https://github.com/Mateusmfmd/arduino-sensores

#Arduino #CPlusPlus #TecnologiaAssistiva #Acessibilidade #Embarcados
