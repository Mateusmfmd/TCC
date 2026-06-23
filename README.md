
# MOTION: Tecnologia Assistiva para Inclusão e Mobilidade

Este repositório contém o código-fonte e a documentação do projeto **MOTION** (*Mobility Oriented Technology Inclusive Orthopedic and Navigation*), um Trabalho de Conclusão de Curso (TCC) desenvolvido na ETEC de Registro como requisito essencial para a obtenção do diploma no curso técnico de Desenvolvimento de Sistemas (DS).

O projeto aplica de forma prática os conceitos de engenharia de software, desenvolvimento móvel, sistemas embarcados e banco de dados adquiridos ao longo do curso. A solução visa auxiliar crianças diagnosticadas com paralisia cerebral, promovendo maior autonomia, comunicação efetiva e mobilidade.

---

## Objetivo do Projeto

O MOTION busca mitigar as barreiras impostas pela limitação física e pela exclusão social por meio de uma abordagem tecnológica integrada, dividida em duas frentes principais:

1. **Comunicação Alternativa:** Uma plataforma digital acessível que permite à criança expressar suas necessidades, sentimentos e escolhas do dia a dia.
2. **Desenvolvimento da Mobilidade:** Um sistema mecânico e motorizado (exoesqueleto acoplado a um andador) que oferece suporte vertical e estímulo ativo para o treinamento da marcha.

---

## Contexto e Problemática

A paralisia cerebral engloba um grupo de distúrbios crônicos que afetam o desenvolvimento motor e a postura. Em cerca de 77% dos casos, manifesta-se na forma espástica, caracterizada pela rigidez muscular que compromete severamente a fala (disartria) e a locomoção independente.

O MOTION substitui os métodos tradicionais e estáticos de comunicação — como as pranchas físicas de papel — por um ecossistema dinâmico que une a reabilitação física à interação social e digital em tempo real.

---

## Arquitetura da Solução

O sistema é composto pela integração sinérgica entre software e hardware:

### Plataforma M.O.T.I.O.N. (Software Mobile)

Interface projetada com foco em acessibilidade para permitir a comunicação rápida entre o usuário e seus responsáveis.

* **Frases Pré-definidas:** Módulos de comunicação rápida para necessidades imediatas.
* **Histórico e Favoritos:** Mecanismo de busca e acesso ágil às expressões mais utilizadas.
* **Integração Física:** Suporte para acionamento de voz por meio de comandos enviados pelo hardware.

### Exoesqueleto e Andador (Hardware)

* **Suporte Estrutural:** O exoesqueleto fornece a estabilização postural necessária para a verticalização da criança.
* **Propulsão Motorizada:** Auxilia no movimento das pernas, incentivando a plasticidade neural e o aprendizado motor da marcha.
* **Interatividade em Movimento:** Botões físicos estrategicamente posicionados no andador permitem que a criança se comunique sem interromper a atividade de reabilitação.

---

## Tecnologias Utilizadas

| Camada / Componente | Tecnologia | Descrição e Função |
| --- | --- | --- |
| **Mobile** | React Native / Expo | Desenvolvimento do aplicativo multiplataforma (JavaScript/TypeScript). |
| **Hardware** | Arduino (C/C++) | Controle dos atuadores motorizados e leitura dos botões físicos. |
| **Backend / API** | Python (Flask) | Processamento central, gerenciamento de requisições e integração de serviços. |
| **Comunicação Serial** | PySerial | Interface de comunicação direta entre o script Python e a placa Arduino. |
| **Multimídia** | Pygame | Gerenciamento e reprodução local dos arquivos de áudio. |
| **Banco de Dados** | MySQL (via XAMPP) | Armazenamento estruturado de usuários, logs e mensagens. |
| **Síntese de Voz** | API ElevenLabs | Geração de vozes sintetizadas de alta fidelidade e sonoridade natural. |

---

## Alinhamento com os Objetivos de Desenvolvimento Sustentável (ODS - ONU)

O desenvolvimento do MOTION está diretamente conectado à Agenda 2030 da Organização das Nações Unidas, atendendo aos seguintes objetivos:

* **ODS 3: Saúde e Bem-Estar:** Através do desenvolvimento de tecnologia assistiva focada na reabilitação motora e qualidade de vida.
* **ODS 4: Educação de Qualidade:** Fornecendo ferramentas de comunicação que eliminam barreiras de aprendizado e favorecem a inclusão escolar.

---

## Estrutura do Repositório

```text
.
├── /appTCC                 # Código-fonte do aplicativo mobile em React Native (Expo)
├── /tcc_arduino            # Firmware e código de controle da placa Arduino (.ino)
├── /tcc_php                # Ambiente do backend em Python, scripts e acervo de áudio
├── /bd_comunicacao.sql     # Script estrutural do banco de dados MySQL
└── /assets                 # Identidade visual, logotipos, ícones e mídias gerais

```

---

## Instruções de Execução e Implantação

Para reproduzir ou homologar o ambiente do projeto, siga as etapas descritas abaixo:

### 1. Banco de Dados

Importe o arquivo `bd_comunicacao.sql` no seu gerenciador de banco de dados MySQL (recomenda-se a utilização do painel de controle XAMPP).

### 2. Firmware (Hardware)

Abra a IDE do Arduino, localize o arquivo contido em `/tcc_arduino/tcc_arduino.ino` e faça o upload para a placa microcontroladora conectada ao andador.

### 3. Backend e Integração

Navegue até o diretório do backend e instale as dependências necessárias utilizando o gerenciador de pacotes do Python:

```bash
cd tcc_php
pip install Flask Flask-Cors mysql-connector-python pygame pyserial
python sistema_motion_full.py

```

### 4. Aplicativo Mobile

Em um novo terminal, acesse a pasta do aplicativo, instale os pacotes do Node e inicialize o servidor do Expo:

```bash
cd appTCC
npm install
npm start

```

---

## Informações do Projeto

* **Status:** Concluído / Em fase de aprimoramento
* **Instituição:** ETEC de Registro
* **Curso:** Técnico em Desenvolvimento de Sistemas (DS)

### Corpo Discente (Autores)

* Julia Ribeiro Lemos
* Julia Souza Hoffmann
* Mateus Flórido Pena
