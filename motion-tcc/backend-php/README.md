# M.O.T.I.O.N. — backend (PHP + MySQL + Docker)

API do M.O.T.I.O.N., o aplicativo de comunicação alternativa do TCC. Guarda contas de responsáveis, perfis de crianças, categorias e pictogramas, rotinas, lembretes, avisos, humor e histórico, além da configuração dos botões físicos.

## Tecnologias

- **PHP 8.2** (Apache) com `mysqli`
- **MySQL 8.4**
- **Docker Compose** (serviços `php` e `mysql`)
- **Python (Flask + pyserial + pygame)**: ponte entre o Arduino e os áudios (`backend/sistema_motion_full.py`)

## Como executar

```bash
cp .env.example .env        # troque as senhas
docker compose up -d --build
```

- API: `http://localhost:8080/api.php?rota=...`
- O schema e os dados iniciais (`database/init.sql`) são carregados na **primeira** subida. Para recriar o banco do zero: `docker compose down -v` e suba de novo (apaga os dados).
- O app móvel (pasta `../app-mobile`) aponta para essa API pela variável `EXPO_PUBLIC_API_URL`.

## Variáveis de ambiente

Veja `.env.example`: `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_ROOT_PASSWORD`. A ponte Python também aceita `DB_HOST`, `DB_PORT` e `SERIAL_PORT`.

## Estrutura

```
backend-php/
├── docker-compose.yml
├── .env.example
├── database/init.sql        # schema completo (16 tabelas) + dados iniciais
└── backend/
    ├── api.php              # roteador único (?rota=...)
    ├── config.php, helpers.php
    ├── *.php                # endpoints separados (login, criancas, rotinas...)
    ├── sons/                # áudios .mp3 dos botões
    ├── uploads/pictogramas/ # imagens enviadas
    └── sistema_motion_full.py   # ponte Arduino -> áudio (Flask)
```

## Rotas principais (`api.php?rota=`)

`login`, `cadastrar`, `logout`, `criancas`, `categorias`, `falas`, `historico`, `frases`, `rotinas`, `lembretes`, `avisos`, `mood`, `monitoramento`, `pareamento`, `upload_imagem`, `configurar_botao`, `listar_botoes`.

As rotas protegidas exigem o token de sessão (válido por 180 dias) devolvido no login; o modo Criança usa um `device_secret` gerado no pareamento.

## Banco de dados

Tabelas: `usuarios`, `sessoes`, `criancas`, `categorias`, `falas`, `historico_comunicacao`, `frases_atalho`, `rotinas`, `rotina_execucoes`, `lembretes`, `mood_log`, `pareamento_codigos`, `dispositivos_crianca`, `configuracao_botoes`, `posts`, `avisos_responsavel`. Usa chaves estrangeiras, índices e `utf8mb4`.

## Integração com o Arduino

Os projetos `arduino-botoes` e `arduino-sensores` enviam o nome da cor (`vermelho`, `amarelo`...) pela serial a 9600 baud. O `sistema_motion_full.py` lê a porta (`SERIAL_PORT`, padrão `COM8`), consulta em `configuracao_botoes` qual áudio está associado àquela cor e o toca com `pygame`. No Windows, `backend/INICIAR_SISTEMA.bat` inicia o script.

Requisitos da ponte: `pip install flask flask-cors mysql-connector-python pygame pyserial`.

## Melhorias futuras

- Usar *prepared statements* em todo o `api.php` (hoje as consultas montam SQL com `real_escape_string`).
- Restringir o CORS (hoje `Access-Control-Allow-Origin: *`) e desligar `APP_DEBUG` em produção.
- Mover o script Python para fora da pasta servida pelo Apache.
- Remover o uso de senha em texto puro no `sistema_motion_full.py` (o `api.php` já usa hash e migra contas antigas no login).
- Testes automatizados da API.

## Autor

Mateus Florido Pena — [GitHub](https://github.com/Mateusmfmd)
