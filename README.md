MOTION: Tecnologia Assistiva para Inclusão e Mobilidade

Este repositório contém o desenvolvimento do projeto MOTION (Mobility Oriented Technology Inclusive Orthopedic and Navigation), um Trabalho de Conclusão de Curso (TCC) realizado na ETEC de Registro, como parte dos requisitos para obtenção do diploma no curso de Desenvolvimento de Sistemas (DS).

O projeto tem como objetivo aplicar, de forma prática, os conhecimentos adquiridos ao longo do curso, desenvolvendo uma solução funcional, organizada e documentada para auxiliar crianças com paralisia cerebral, promovendo autonomia, comunicação e mobilidade.

Objetivo do Projeto

O principal objetivo deste trabalho é enfrentar os desafios da exclusão social e da limitação física por meio da tecnologia. O MOTION integra duas frentes principais de impacto:

Comunicação Alternativa: plataforma digital que permite à criança expressar necessidades e sentimentos de forma acessível.
Desenvolvimento da Mobilidade: um sistema de exoesqueleto motorizado acoplado a um andador, oferecendo suporte mecânico e incentivo à marcha.
O Problema: Desafios da Paralisia Cerebral

A paralisia cerebral afeta a função neuromuscular e, em grande parte dos casos de paralisia espástica, provoca rigidez muscular que compromete a fala (disartria) e a locomoção.

O projeto MOTION propõe uma alternativa às pranchas de comunicação tradicionais, integrando tecnologia assistiva, reabilitação física e interação social em tempo real.

Solução Integrada
Plataforma M.O.T.I.O.N (Software)

Interface acessível desenvolvida para comunicação rápida entre a criança e seus responsáveis.

Frases pré-definidas para facilitar a comunicação imediata
Histórico e favoritos para acesso rápido às mensagens mais utilizadas
Integração com botões físicos programáveis instalados no andador
Exoesqueleto e Andador (Hardware)
Suporte e estabilidade por meio de estrutura mecânica assistiva
Sistema motorizado para incentivo ao desenvolvimento da marcha
Botões integrados ao andador para comunicação durante a locomoção
Tecnologias Utilizadas
Mobile: React Native com Expo (JavaScript/TypeScript)
Hardware: Arduino (C/C++) para controle de botões e sensores
Backend/API: Python (Flask), Pygame e PySerial para integração e comunicação serial
Banco de Dados: MySQL (via XAMPP)
Síntese de Voz: ElevenLabs para geração de áudio natural
Alinhamento com os ODS (ONU)

O projeto está alinhado aos Objetivos de Desenvolvimento Sustentável:

ODS 3 – Saúde e Bem-Estar: aplicação de tecnologia assistiva para reabilitação motora
ODS 4 – Educação de Qualidade: incentivo à inclusão e ao desenvolvimento comunicativo
Estrutura do Projeto
/appTCC              Código-fonte do aplicativo mobile (Expo)
/tcc_arduino         Firmware do Arduino (.ino)
/tcc_php             Backend Python, integração e arquivos de áudio
/bd_comunicacao.sql  Script do banco de dados MySQL
/assets              Recursos visuais, ícones e mídias
Como Executar
Banco de Dados: importar o arquivo bd_comunicacao.sql no MySQL.
Hardware: carregar o arquivo tcc_arduino.ino na placa Arduino.

Backend: instalar dependências na pasta /tcc_php:

pip install Flask Flask-Cors mysql-connector-python pygame pyserial

e executar:

python sistema_motion_full.py

Aplicativo: na pasta /appTCC, executar:

npm install
npm start
Status do Projeto

Concluído / Em desenvolvimento

Autores
Julia Ribeiro Lemos
Julia Souza Hoffmann
Mateus Flórido Pena

Curso: Desenvolvimento de Sistemas (DS)
Instituição: ETEC de Registro
