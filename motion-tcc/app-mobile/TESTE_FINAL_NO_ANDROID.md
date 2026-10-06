# Checklist de validação final do M.O.T.I.O.N. no Android

**Versão de teste:** 1.0.6 (SDK 57, `versionCode` 16)

A verificação automatizada cobre apenas o código. O teste final precisa ser feito no Android real; use este roteiro **antes de distribuir**. Não apague os dados do app nem remova os itens de demonstração: faça os testes de cadastro em um perfil temporário.

## 1. Antes de gerar o APK

Na pasta do projeto, rode:

```bash
npm ci
npm run test:offline
npm run doctor
npx expo config --json
```

Confirme: o teste mostra `PASS`, o doctor mostra `21/21 checks passed`, o app informa a versão `1.0.6` e SDK `57.0.0`. Em seguida, gere o APK de teste no EAS:

```bash
npx eas-cli@latest build --platform android --profile preview --clear-cache
```

Este APK de preview é distribuído só para instalação de teste; gerar o APK de distribuição pública é outra etapa. O build exige login na sua conta Expo e internet. **Não altere o `versionCode` de novo para repetir o mesmo teste.**

## 2. Teste do primeiro acesso

No Android, instale o APK e confirme:

- [ ] O aplicativo abre e mostra a nova logo.
- [ ] **Começar sem conta** abre o app sem senha, cadastro ou tela de login.
- [ ] A lista de perfis aparece; selecione o perfil de demonstração.
- [ ] Em Modo Criança → Comunicação, toque uma vez em qualquer categoria: ela deve abrir sem manter o dedo pressionado. Repita para um pictograma.
- [ ] Monte uma frase com palavras de pelo menos duas categorias. Volte à lista, abra outra categoria e confirme que a barra mantém a frase; a palavra nova deve aparecer ao final automaticamente.
- [ ] Remova uma palavra pelo `x`, remova a última pela seta de apagar e acrescente outras. Confirme que pode continuar formando uma frase longa, depois use o botão de falar frase inteira.
- [ ] Volte à tela anterior e confirme que os botões de voltar/cancelar respondem.

## 3. Teste dos botões e abas do responsável

Use um **perfil temporário** para não alterar o conteúdo de demonstração. Teste cada item e abra-o novamente para confirmar o salvamento:

- [ ] Criar perfil, abrir e editar os ajustes do perfil.
- [ ] Abrir categorias; criar, renomear e abrir uma categoria.
- [ ] Criar e editar um pictograma; salvar e reabrir uma foto escolhida.
- [ ] Abrir a seleção de frases favoritas, adicionar e remover uma frase de teste.
- [ ] Criar/editar uma rotina em um dia específico; verificar outro dia e marcar a conclusão.
- [ ] Criar lembrete, marcar como feito e remover o lembrete de teste.
- [ ] Criar aviso de teste, marcar como lido, editar e remover.
- [ ] Abrir humor, histórico/monitoramento e usar **Atualizar agora**.
- [ ] Abrir ajustes e testar preferências visuais/acessibilidade.
- [ ] Abrir painel de botões: escolha um som e ouça o teste local por voz.

**Não espere mensagens offline em outro telefone.** Avisos e alterações offline são salvos apenas neste aparelho. Configurar um mapeamento e ouvir a voz não aciona um botão físico: isso exige o servidor e o equipamento de hardware.

## 4. Teste do Modo Criança

- [ ] Abra o Modo Criança pelo perfil temporário.
- [ ] Entre em uma categoria, toque em um pictograma e confirme que a fala acontece.
- [ ] Acrescente dois pictogramas à frase e use o botão de falar; confirme a frase completa.
- [ ] Abra favoritos, toque em um favorito e confirme fala e registro no histórico.
- [ ] Abra “Como estou?”, escolha uma emoção e confira a fala; volte ao painel.
- [ ] Conclua uma rotina e confirme que ela aparece como concluída hoje; teste uma rotina de outro dia.
- [ ] Envie um aviso e confira que ele aparece na tela de avisos do **mesmo aparelho**.
- [ ] Ative a varredura e veja o destaque avançar pelos itens; teste toque/acessibilidade.
- [ ] Teste o botão de voltar e a saída com o PIN configurado no perfil.

## 5. Teste offline real e persistência

Expo Go carrega o JavaScript do Metro; portanto, **não use apenas o Expo Go como prova de operação após desconectar a rede**. Faça esta parte com o APK instalado:

1. Ainda com a rede ativa, crie no perfil temporário um pictograma, uma rotina e um favorito.
2. Feche o app completamente, ative o **modo avião**, abra o APK novamente e toque **Começar sem conta**.
3. Confirme que o perfil, o pictograma, a foto, a rotina e o favorito continuam disponíveis.
4. Teste fala local, humor, rotina, lembrete e aviso.
5. Desative o modo avião. Reinicie o app e confirme que os dados continuam lá.
6. Apague o perfil temporário quando terminar. **Preserve o perfil de demonstração e os dados que queira manter.**

## Limites confirmados

- Perfis, categorias, pictogramas, favoritos, rotinas, lembretes, avisos, humor, histórico e ajustes são locais quando se usa sem conta.
- Uma foto escolhida é copiada para a pasta persistente do app.
- Avisos offline não são entregues a outro dispositivo.
- Login, sincronização, geração de código de pareamento e comandos para hardware real dependem de internet/servidor.
- O teste automatizado verifica as APIs e persistência simulada; não simula toque real, Text-to-Speech do fabricante, seletor nativo de fotos, instalação, tela específica do aparelho ou hardware externo.

Se qualquer passo falhar, pare antes de distribuir o APK. Anote a tela, o botão, o que esperava acontecer e o que aconteceu — isso permite corrigir exatamente o ponto com problema.
