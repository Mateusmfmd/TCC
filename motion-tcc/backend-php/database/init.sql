-- Banco de dados completo do M.O.T.I.O.N.
-- Compatível com api.php unificado e MySQL 8.x.
-- Execute em um banco vazio chamado bd_comunicacao.

CREATE DATABASE IF NOT EXISTS bd_comunicacao CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE bd_comunicacao;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS avisos_responsavel;
DROP TABLE IF EXISTS posts;
DROP TABLE IF EXISTS configuracao_botoes;
DROP TABLE IF EXISTS dispositivos_crianca;
DROP TABLE IF EXISTS pareamento_codigos;
DROP TABLE IF EXISTS rotina_execucoes;
DROP TABLE IF EXISTS mood_log;
DROP TABLE IF EXISTS lembretes;
DROP TABLE IF EXISTS rotinas;
DROP TABLE IF EXISTS frases_atalho;
DROP TABLE IF EXISTS historico_comunicacao;
DROP TABLE IF EXISTS falas;
DROP TABLE IF EXISTS categorias;
DROP TABLE IF EXISTS criancas;
DROP TABLE IF EXISTS sessoes;
DROP TABLE IF EXISTS usuarios;

CREATE TABLE usuarios (
    id_usuario INT UNSIGNED NOT NULL AUTO_INCREMENT,
    nome VARCHAR(120) NOT NULL,
    email VARCHAR(190) NOT NULL,
    senha VARCHAR(255) NOT NULL,
    nome_dependente VARCHAR(120) NOT NULL DEFAULT '',
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id_usuario),
    UNIQUE KEY uq_usuarios_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE sessoes (
    id_sessao BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    usuario_id INT UNSIGNED NOT NULL,
    token CHAR(64) NOT NULL,
    expira_em DATETIME NOT NULL,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_sessao),
    UNIQUE KEY uq_sessoes_token (token),
    KEY idx_sessoes_usuario (usuario_id),
    KEY idx_sessoes_expira (expira_em),
    CONSTRAINT fk_sessoes_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id_usuario) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE criancas (
    id_crianca INT UNSIGNED NOT NULL AUTO_INCREMENT,
    usuario_id INT UNSIGNED NOT NULL,
    nome VARCHAR(120) NOT NULL,
    avatar_emoji VARCHAR(32) NOT NULL DEFAULT '🧒',
    pin_saida VARCHAR(32) NOT NULL DEFAULT '1234',
    tamanho_pictograma VARCHAR(20) NOT NULL DEFAULT 'medio',
    tema VARCHAR(30) NOT NULL DEFAULT 'claro',
    voz VARCHAR(60) NOT NULL DEFAULT 'default',
    cor_primaria VARCHAR(7) NULL,
    cor_destaque VARCHAR(7) NULL,
    velocidade_voz DECIMAL(4,2) NOT NULL DEFAULT 1.00,
    volume DECIMAL(4,2) NOT NULL DEFAULT 1.00,
    tempo_resposta INT NOT NULL DEFAULT 1000,
    varredura_velocidade INT NOT NULL DEFAULT 1000,
    alto_contraste TINYINT(1) NOT NULL DEFAULT 0,
    alvos_gigantes TINYINT(1) NOT NULL DEFAULT 0,
    varredura_ativa TINYINT(1) NOT NULL DEFAULT 0,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id_crianca),
    KEY idx_criancas_usuario (usuario_id),
    CONSTRAINT fk_criancas_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id_usuario) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE categorias (
    id_categoria INT UNSIGNED NOT NULL AUTO_INCREMENT,
    crianca_id INT UNSIGNED NULL,
    nome_categoria VARCHAR(100) NOT NULL,
    emoji VARCHAR(32) NOT NULL DEFAULT '📋',
    cor VARCHAR(7) NOT NULL DEFAULT '#BDE0FE',
    ordem INT NOT NULL DEFAULT 0,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_categoria),
    KEY idx_categorias_crianca (crianca_id),
    CONSTRAINT fk_categorias_crianca FOREIGN KEY (crianca_id) REFERENCES criancas (id_crianca) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE falas (
    id_fala INT UNSIGNED NOT NULL AUTO_INCREMENT,
    id_categoria INT UNSIGNED NOT NULL,
    texto VARCHAR(255) NOT NULL,
    emoji VARCHAR(32) NOT NULL DEFAULT '💬',
    imagem_url VARCHAR(1000) NULL,
    ordem INT NOT NULL DEFAULT 0,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_fala),
    KEY idx_falas_categoria (id_categoria),
    CONSTRAINT fk_falas_categoria FOREIGN KEY (id_categoria) REFERENCES categorias (id_categoria) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE historico_comunicacao (
    id_historico BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    crianca_id INT UNSIGNED NOT NULL,
    id_fala INT UNSIGNED NULL,
    texto VARCHAR(255) NOT NULL,
    emoji VARCHAR(32) NULL,
    tipo VARCHAR(40) NOT NULL DEFAULT 'fala',
    data_uso DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_historico),
    KEY idx_historico_crianca_data (crianca_id, data_uso),
    CONSTRAINT fk_historico_crianca FOREIGN KEY (crianca_id) REFERENCES criancas (id_crianca) ON DELETE CASCADE,
    CONSTRAINT fk_historico_fala FOREIGN KEY (id_fala) REFERENCES falas (id_fala) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE frases_atalho (
    id_frase INT UNSIGNED NOT NULL AUTO_INCREMENT,
    crianca_id INT UNSIGNED NOT NULL,
    texto VARCHAR(255) NOT NULL,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_frase),
    KEY idx_frases_crianca (crianca_id),
    CONSTRAINT fk_frases_crianca FOREIGN KEY (crianca_id) REFERENCES criancas (id_crianca) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE rotinas (
    id_rotina INT UNSIGNED NOT NULL AUTO_INCREMENT,
    crianca_id INT UNSIGNED NOT NULL,
    dia_semana VARCHAR(100) NOT NULL DEFAULT '',
    atividade VARCHAR(160) NOT NULL,
    horario TIME NOT NULL,
    icone VARCHAR(32) NOT NULL DEFAULT '⭐',
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id_rotina),
    KEY idx_rotinas_crianca_horario (crianca_id, horario),
    CONSTRAINT fk_rotinas_crianca FOREIGN KEY (crianca_id) REFERENCES criancas (id_crianca) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE rotina_execucoes (
    id_execucao BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    rotina_id INT UNSIGNED NOT NULL,
    data_execucao DATE NOT NULL,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_execucao),
    UNIQUE KEY uq_rotina_data (rotina_id, data_execucao),
    KEY idx_execucoes_data (data_execucao),
    CONSTRAINT fk_execucoes_rotina FOREIGN KEY (rotina_id) REFERENCES rotinas (id_rotina) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE lembretes (
    id_lembrete INT UNSIGNED NOT NULL AUTO_INCREMENT,
    crianca_id INT UNSIGNED NOT NULL,
    texto VARCHAR(255) NOT NULL,
    feito TINYINT(1) NOT NULL DEFAULT 0,
    hora TIME NULL,
    recorrencia VARCHAR(30) NOT NULL DEFAULT 'uma_vez',
    data_conclusao DATETIME NULL,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id_lembrete),
    KEY idx_lembretes_crianca_hora (crianca_id, hora),
    CONSTRAINT fk_lembretes_crianca FOREIGN KEY (crianca_id) REFERENCES criancas (id_crianca) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE mood_log (
    id_mood BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    crianca_id INT UNSIGNED NOT NULL,
    humor VARCHAR(80) NOT NULL,
    emoji VARCHAR(32) NOT NULL DEFAULT '',
    data_registro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_mood),
    KEY idx_mood_crianca_data (crianca_id, data_registro),
    CONSTRAINT fk_mood_crianca FOREIGN KEY (crianca_id) REFERENCES criancas (id_crianca) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE pareamento_codigos (
    id_codigo BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    crianca_id INT UNSIGNED NOT NULL,
    codigo VARCHAR(20) NOT NULL,
    expira_em DATETIME NOT NULL,
    usado TINYINT(1) NOT NULL DEFAULT 0,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_codigo),
    KEY idx_pareamento_codigo (codigo, usado, expira_em),
    KEY idx_pareamento_crianca (crianca_id, criado_em),
    CONSTRAINT fk_pareamento_crianca FOREIGN KEY (crianca_id) REFERENCES criancas (id_crianca) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE dispositivos_crianca (
    id_dispositivo BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    crianca_id INT UNSIGNED NOT NULL,
    device_secret CHAR(64) NOT NULL,
    ultimo_acesso DATETIME NULL,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_dispositivo),
    UNIQUE KEY uq_dispositivo_secret (device_secret),
    KEY idx_dispositivo_crianca (crianca_id),
    CONSTRAINT fk_dispositivo_crianca FOREIGN KEY (crianca_id) REFERENCES criancas (id_crianca) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE configuracao_botoes (
    id_botao TINYINT UNSIGNED NOT NULL,
    nome_audio VARCHAR(120) NOT NULL,
    descricao_audio VARCHAR(160) NOT NULL DEFAULT '',
    atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id_botao)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE posts (
    id_post BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    usuario_id INT UNSIGNED NOT NULL,
    texto TEXT NULL,
    imagem_url VARCHAR(1000) NULL,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id_post),
    KEY idx_posts_usuario_data (usuario_id, criado_em),
    CONSTRAINT fk_posts_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id_usuario) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE avisos_responsavel (
    id_aviso BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    crianca_id INT UNSIGNED NOT NULL,
    titulo VARCHAR(120) NOT NULL,
    mensagem VARCHAR(255) NOT NULL,
    emoji VARCHAR(32) NOT NULL DEFAULT '🔔',
    lido TINYINT(1) NOT NULL DEFAULT 0,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_aviso),
    KEY idx_avisos_crianca_lido_data (crianca_id, lido, criado_em),
    CONSTRAINT fk_avisos_crianca FOREIGN KEY (crianca_id) REFERENCES criancas (id_crianca) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Categorias globais: crianca_id NULL é o modelo copiado por semearConteudoPadrao().
INSERT INTO categorias (crianca_id, nome_categoria, emoji, cor, ordem) VALUES
(NULL, 'Necessidades', '🧩', '#BDE0FE', 1),
(NULL, 'Sentimentos', '😊', '#CDEAC0', 2),
(NULL, 'Pessoas', '👥', '#FFD6A5', 3),
(NULL, 'Atividades', '🎨', '#FFC8DD', 4),
(NULL, 'Lugares', '📍', '#D8E2DC', 5);

INSERT INTO falas (id_categoria, texto, emoji, ordem) VALUES
(1, 'Quero água', '💧', 1),
(1, 'Estou com fome', '🍎', 2),
(1, 'Preciso ir ao banheiro', '🚻', 3),
(1, 'Estou com dor', '🤕', 4),
(2, 'Estou feliz', '😄', 1),
(2, 'Estou triste', '😢', 2),
(2, 'Estou bravo', '😠', 3),
(2, 'Estou cansado', '😴', 4),
(3, 'Mamãe', '👩', 1),
(3, 'Papai', '👨', 2),
(3, 'Professor(a)', '🧑‍🏫', 3),
(4, 'Quero brincar', '🧸', 1),
(4, 'Quero ouvir música', '🎵', 2),
(4, 'Quero desenhar', '🖍️', 3),
(5, 'Quero ir para casa', '🏠', 1),
(5, 'Quero ir para a escola', '🏫', 2);

INSERT INTO configuracao_botoes (id_botao, nome_audio, descricao_audio) VALUES
(1, 'andar.mp3', 'Andar'),
(2, 'brincar.mp3', 'Brincar'),
(3, 'banheiro.mp3', 'Banheiro'),
(4, 'nao_quero.mp3', 'Não quero'),
(5, 'onde_vamos.mp3', 'Onde vamos');

SET FOREIGN_KEY_CHECKS = 1;

-- Observação: usuários, sessões e perfis de crianças são criados pelo aplicativo.
-- Nunca grave senhas reais neste arquivo; a API usa password_hash().
