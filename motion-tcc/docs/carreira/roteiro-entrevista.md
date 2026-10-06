> Rascunho baseado só no que está no código e nos READMEs. Revise os trechos marcados com **[confirme]** para refletir o que você realmente fez e viveu. Nenhum número ou resultado foi inventado.


# Roteiro de entrevista — M.O.T.I.O.N.

**Qual problema o projeto resolve?**
Ajuda crianças com dificuldade de fala e de movimento a se comunicar e seguir a rotina, e dá aos responsáveis uma forma de configurar e acompanhar.

**Por que você escolheu essas tecnologias?**
React Native com Expo para gerar um app Android rápido; PHP e MySQL porque eu já dominava e rodam em hospedagem simples; Docker para reproduzir o ambiente; Arduino para o botão físico, já que nem toda criança consegue tocar na tela.

**Como o projeto está organizado?**
Duas pastas: `app-mobile` (telas, componentes, armazenamento offline e cliente da API) e `backend-php` (API com roteador único, banco, áudios e ponte Python do Arduino).

**Como funciona o banco de dados?**
MySQL com 16 tabelas e chaves estrangeiras: usuários, sessões, crianças, categorias, falas, rotinas, lembretes, humor, histórico, pareamento e configuração dos botões.

**Como você tratou erros e validações?**
A API valida campos obrigatórios, exige token de sessão e confere o dono dos dados antes de alterar. No app, os erros de rede viram mensagens claras e há um tratador de erros global.

**Qual foi a maior dificuldade?** **[confirme]**
Integrar as quatro partes (app, API, banco e Arduino) e fazer o app continuar útil sem internet.

**O que você faria diferente?**
Usaria consultas preparadas em toda a API desde o início, restringiria o CORS e escreveria testes da API junto com o código.

**Como o projeto poderia crescer?**
Sincronização entre aparelhos, mais pictogramas e idiomas, testes automatizados do backend e suporte a outros tipos de botão.
