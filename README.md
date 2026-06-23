MOTION: TECNOLOGIA ASSISTIVA PARA INCLUSÃO E MOBILIDADE
TRABALHO DE CONCLUSÃO DE CURSO (TCC) – DESENVOLVIMENTO DE SISTEMAS

Este repositório contém o desenvolvimento do projeto MOTION (Mobility Oriented Technology Inclusive Orthopedic and Navigation), realizado na ETEC de Registro como parte dos requisitos para obtenção do diploma no curso de Desenvolvimento de Sistemas (DS).

O projeto tem como objetivo aplicar, de forma prática, conhecimentos adquiridos ao longo do curso, desenvolvendo uma solução funcional, organizada e documentada voltada à tecnologia assistiva para crianças com paralisia cerebral, promovendo inclusão, autonomia, comunicação e mobilidade.

OBJETIVO DO PROJETO
SOLUÇÃO PARA ACESSIBILIDADE E AUTONOMIA

O principal objetivo do MOTION é reduzir barreiras físicas e comunicacionais por meio da tecnologia, integrando software e hardware em uma solução única.

O projeto é dividido em duas frentes principais:
Comunicação Alternativa Digital: plataforma que permite à criança expressar necessidades, sentimentos e comandos de forma acessível.
Assistência à Mobilidade Física: sistema de exoesqueleto motorizado acoplado a um andador, oferecendo suporte estrutural e incentivo à marcha.
PROBLEMA ABORDADO
PARALISIA CEREBRAL E LIMITAÇÕES FUNCIONAIS

A paralisia cerebral afeta o controle neuromuscular e motor, sendo comum a presença de rigidez muscular (paralisia espástica), o que pode comprometer:

A fala (disartria)
A locomoção
A interação social

O projeto propõe uma alternativa às soluções tradicionais, como pranchas de comunicação, por meio de uma abordagem tecnológica integrada, mais eficiente e interativa.

SOLUÇÃO PROPOSTA
SISTEMA M.O.T.I.O.N
Plataforma de Comunicação (Software)

Sistema digital desenvolvido para facilitar a comunicação entre a criança e seus responsáveis.

Frases pré-definidas para comunicação rápida
Histórico de mensagens e favoritos
Integração com botões físicos programáveis
Sistema de Mobilidade (Hardware)

Estrutura mecânica e eletrônica integrada ao andador.

Suporte físico para estabilidade e postura
Sistema motorizado para auxílio na marcha
Botões físicos integrados para comunicação durante o movimento
TECNOLOGIAS UTILIZADAS
DESENVOLVIMENTO DO SISTEMA
Mobile: React Native com Expo (JavaScript / TypeScript)
Hardware: Arduino (C / C++) para controle de botões e sensores
Backend: Python (Flask, PySerial, Pygame) para integração e comunicação
Banco de Dados: MySQL (via XAMPP)
Síntese de Voz: ElevenLabs para geração de áudio natural
OBJETIVOS DE DESENVOLVIMENTO SUSTENTÁVEL (ODS)
ALINHAMENTO COM A ONU
ODS 3 – Saúde e Bem-Estar: aplicação de tecnologia assistiva para reabilitação motora e qualidade de vida.
ODS 4 – Educação de Qualidade: incentivo à inclusão e ao desenvolvimento comunicativo.
ESTRUTURA DO PROJETO
ORGANIZAÇÃO DO REPOSITÓRIO
/appTCC              Código-fonte do aplicativo mobile (Expo)
/tcc_arduino         Firmware do Arduino (.ino)
/tcc_php             Backend Python, integração e arquivos de áudio
/bd_comunicacao.sql  Script do banco de dados MySQL
/assets              Recursos visuais, ícones e mídias
COMO EXECUTAR O PROJETO
PASSO A PASSO DE INSTALAÇÃO
Banco de Dados

Importar o arquivo bd_comunicacao.sql no MySQL.

Hardware

Carregar o arquivo tcc_arduino.ino na placa Arduino.

Backend

Na pasta /tcc_php, instalar dependências:

pip install Flask Flask-Cors mysql-connector-python pygame pyserial

Executar:

python sistema_motion_full.py
Aplicativo

Na pasta /appTCC:

npm install
npm start
STATUS DO PROJETO

Concluído / Em desenvolvimento

AUTORES
EQUIPE DE DESENVOLVIMENTO
Julia Ribeiro Lemos
Julia Souza Hoffmann
Mateus Flórido Pena

Curso: Desenvolvimento de Sistemas (DS)
Instituição: ETEC de Registro
