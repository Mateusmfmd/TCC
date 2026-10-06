> Rascunho baseado só no que está no código e nos READMEs. Revise os trechos marcados com **[confirme]** para refletir o que você realmente fez e viveu. Nenhum número ou resultado foi inventado.


Um botão parece simples, até você precisar que ele dispare só uma vez.

Para o meu TCC (M.O.T.I.O.N.), montei e programei um painel com 5 botões coloridos e um sensor ultrassônico em Arduino. Cada acionamento envia o nome da cor pela serial e o sistema toca o áudio configurado no app.

Na parte de código, usei INPUT_PULLUP, detecção de borda para enviar uma vez por aperto e histerese no sensor para a mesma aproximação não disparar várias vezes.

Tecnologias: Arduino, C++ e comunicação serial.

Um aprendizado: o hardware real tem ruído, e tratar isso no código faz mais diferença do que parece. **[confirme]**

Código: https://github.com/Mateusmfmd/arduino-botoes

#Arduino #CPlusPlus #TecnologiaAssistiva #Acessibilidade #IoT
