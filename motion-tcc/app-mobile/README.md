# M.O.T.I.O.N. — Expo SDK 57

## Testar pelo Windows e Expo Go

1. Instale Node.js LTS no Windows e instale o Expo Go compatível com SDK 57 no Android.
2. Na pasta deste app, abra o Prompt de Comando e execute:

```bat
npm ci
npx expo config --json
npx expo start --lan -c
```

3. Deixe o computador e o telefone na mesma rede Wi-Fi e leia o QR Code do terminal com o Expo Go. Na tela inicial do app, toque **Começar sem conta**: ele deve abrir o painel de perfis sem pedir senha ou cadastro.

Se `npx expo config --json` mostrar erro, corrija esse erro antes de tentar o build EAS.

Antes de enviar um APK, valide as operações locais e a configuração do SDK:

```bat
npm run test:offline
npx expo-doctor
```

Para o teste final no APK instalado, siga `TESTE_FINAL_NO_ANDROID.md`; ele confere persistência offline, fala, fotos e as telas principais no aparelho real.

## Gerar APK para Android

```bat
npx eas-cli@latest login
npx eas-cli@latest build:configure
npx eas-cli@latest build --platform android --profile preview --clear-cache
```

O APK é gerado nos servidores da Expo e o EAS apresenta um link ao terminar. O Expo Go serve para teste; o APK é instalado como aplicativo independente.

## Modo sem conta

O botão **Começar sem conta** acessa diretamente os dados locais de demonstração, sem senha e sem servidor. As alterações ficam salvas neste telefone; sincronização entre aparelhos exige uma conta e uma API online configurada.

No modo offline, perfis, categorias, pictogramas, favoritos, rotinas, lembretes, avisos, humor, histórico e preferências são gravados neste aparelho. Fotos de pictogramas são copiadas para o armazenamento permanente do app. Cartões de categorias e pictogramas abrem com um toque normal; o tempo de resposta não é obrigatório. A frase montada permanece ao trocar de categoria ou aba durante o Modo Criança, aceita palavras sem limite artificial, rola até o item mais novo, permite remover qualquer palavra ou só a última, limpar e falar a frase completa. Avisos feitos offline ficam visíveis no próprio aparelho, mas não são enviados a outro dispositivo; para isso é preciso API/conexão. A associação dos botões físicos e o teste por voz são locais; controlar equipamento físico exige o servidor de hardware. Pareamento e sincronização também exigem internet.

## Identidade visual

A logo original em alta resolução está em `assets/logo-motion.png`. A versão `assets/icon.png` está configurada como ícone do aplicativo; `assets/adaptive-icon.png`, splash, favicon e ícone de notificações usam variações preparadas para cada formato.

## Teste automatizado offline

`npm run test:offline` executa a suíte `scripts/test-offline.cjs` com armazenamento simulado. Ela cobre a persistência e o CRUD principal, inclusive exclusão da última categoria/palavra, filtro de dias e conclusão de rotina, registro de humor/falas, avisos, hardware, persistência de imagem e recuperação de banco corrompido. É um teste de código; um teste final de toque/voz e permissões ainda deve ser feito no Android real antes de distribuir o APK.
