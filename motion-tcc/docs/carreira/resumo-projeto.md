> Rascunho baseado só no que está no código e nos READMEs. Revise os trechos marcados com **[confirme]** para refletir o que você realmente fez e viveu. Nenhum número ou resultado foi inventado.


# Resumo — M.O.T.I.O.N. (TCC)

## Problema
Crianças com dificuldade de fala e de movimento (foco em paralisia cerebral) precisam de uma forma simples de se comunicar e de seguir a rotina, e os responsáveis precisam acompanhar e configurar isso.

## Solução
Sistema de comunicação alternativa e aumentativa com três partes: aplicativo móvel (modo responsável e modo criança), API em PHP com banco MySQL em Docker e botões/sensores em Arduino que acionam áudios por uma ponte em Python.

## Meu papel no desenvolvimento
**[confirme]** O TCC foi feito em equipe. Liste aqui as partes que você desenvolveu (ex.: app, API, banco, Arduino).

## Tecnologias usadas
React Native (Expo), JavaScript, PHP 8.2, MySQL 8.4, Docker Compose, Python (Flask, pyserial, pygame), Arduino (C++).

## Pontos técnicos de destaque
- Modo offline: perfis, categorias, pictogramas, rotinas, lembretes, avisos e histórico ficam salvos no aparelho.
- Pareamento do aparelho da criança com a conta do responsável por código, usando um `device_secret`.
- Integração hardware-software: Arduino envia a cor pela serial, a ponte consulta no banco o áudio associado e o toca.
- Recursos de acessibilidade: varredura, alto contraste e fala por voz sintetizada.

## Decisões técnicas
- Expo para gerar o APK e testar no celular com rapidez.
- Autenticação por token de sessão (180 dias) e senha com hash, migrando contas antigas no login.
- Verificação de dono dos dados antes de ler ou alterar registros.
- Docker Compose para reproduzir o ambiente (PHP + MySQL) em qualquer máquina.
- Suíte de teste offline (`npm run test:offline`) cobrindo persistência e CRUD principais.

## Resultado demonstrável
O app abre sem conta e permite montar e falar frases com pictogramas, criar rotinas e lembretes, e registrar humor. Com o backend e o Arduino ligados, apertar um botão físico toca o áudio configurado no app.

## Melhorias futuras
Consultas preparadas em toda a API, CORS restrito, limite de tentativas de login, testes automatizados da API e teste em mais aparelhos Android.
