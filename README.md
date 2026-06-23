 # MOTION: Tecnologia Assistiva para Inclusão e Mobilidade

Este repositório contém o desenvolvimento do projeto MOTION (Mobility Oriented Technology Inclusive Orthopedic and Navigation), um Trabalho de Conclusão de Curso (TCC) realizado na ETEC de Registro como parte dos requisitos para obtenção do diploma no curso de Desenvolvimento de Sistemas (DS).

O projeto tem como objetivo aplicar na prática os conhecimentos adquiridos ao longo do curso, desenvolvendo uma solução funcional, organizada e documentada para auxiliar crianças com paralisia cerebral, promovendo autonomia, comunicação e mobilidade.

 Objetivo do Projeto

O principal objetivo deste trabalho é resolver o desafio da exclusão e da limitação física por meio da tecnologia. O MOTION integra duas frentes de alto impacto:
1. Comunicação Alternativa: Uma plataforma digital para que a criança expresse necessidades e sentimentos.
2. Desenvolvimento da Mobilidade: Um exoesqueleto motorizado acoplado a um andador para suporte mecânico e incentivo à marcha.

 O Problema: Desafios da Paralisia Cerebral

A paralisia cerebral afeta a função neuromuscular e, em 77% dos casos (paralisia espástica), causa rigidez muscular que compromete a fala (disartria) e a locomoção. O MOTION substitui as tradicionais pranchas de papel por uma solução tecnológica que une reabilitação física e interação social em tempo real.

 A Solução Integrada

Plataforma M.O.T.I.O.N (Software)
Interface acessível desenvolvida para comunicação rápida entre a criança e seus responsáveis.
* Frases Pré-definidas: Facilita a interação imediata.
* Histórico e Favoritos: Acesso rápido às mensagens mais utilizadas.
* Botão Físico Programável: Permite que a criança acione frases de voz através de botões instalados no andador.

Exoesqueleto e Andador (Hardware)
* Suporte e Estabilidade: O exoesqueleto fornece a sustentação necessária para que a criança permaneça em pé.
* Movimento Motorizado: Incentiva o desenvolvimento locomotor e a aprendizagem da marcha.
* Comunicação em Movimento: Botões integrados ao andador permitem que a criança se comunique sem interromper suas atividades de reabilitação.

 Tecnologias Utilizadas

* Mobile: React Native com Expo (JavaScript/TypeScript).
* Hardware: Arduino (C/C++) para controle de botões físicos e sensores.
* Backend/API: Python (Flask) para integração, Pygame para reprodução de áudio e PySerial para comunicação serial.
* Banco de Dados: MySQL (via XAMPP).
* Síntese de Voz: ElevenLabs (para geração de áudios naturais).

 Alinhamento com os ODS (ONU)

O projeto está alinhado aos Objetivos de Desenvolvimento Sustentável:
* ODS 3 (Saúde e Bem-Estar): Tecnologias assistivas para reabilitação motora.
* ODS 4 (Educação de Qualidade): Ferramentas que favorecem a inclusão e o aprendizado.

 Estrutura do Projeto

/appTCC            -> Código-fonte do aplicativo mobile (Expo)
/tcc_arduino       -> Firmware do Arduino (.ino)
/tcc_php           -> Backend Python, scripts de integração e arquivos de som
/bd_comunicacao.sql -> Script SQL para criação do banco de dados
/assets            -> Recursos visuais, ícones e mídias

Como Executar

1. Banco de Dados: Importe o arquivo bd_comunicacao.sql no MySQL.
2. Hardware: Carregue o código /tcc_arduino/tcc_arduino.ino na sua placa Arduino.
3. Backend: Na pasta /tcc_php, instale as dependências (pip install Flask Flask-Cors mysql-connector-python pygame pyserial) e execute python sistema_motion_full.py.
4. App: Na pasta /appTCC, execute npm install e depois npm start.

Status do Projeto
 Em desenvolvimento

 Autores
* Julia Ribeiro Lemos
* Julia Souza Hoffmann
* Mateus Flórido Pena

Curso: Desenvolvimento de Sistemas (DS)
Instituição: ETEC de Registro

---
Projeto desenvolvido com foco em acessibilidade, seguindo as melhores práticas de engenharia de software.
