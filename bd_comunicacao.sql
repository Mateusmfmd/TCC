CREATE DATABASE IF NOT EXISTS bd_comunicacao CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE bd_comunicacao;

-- Tabela de Usuários
CREATE TABLE IF NOT EXISTS usuarios (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    nome_dependente VARCHAR(255) NULL,
    data_cadastro DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Categorias
CREATE TABLE IF NOT EXISTS categorias (
    id_categoria INT AUTO_INCREMENT PRIMARY KEY,
    nome_categoria VARCHAR(255) NOT NULL UNIQUE,
    emoji VARCHAR(10) NULL,
    cor VARCHAR(7) NULL,
    ordem INT DEFAULT 0
);

-- Tabela de Falas (Pictogramas individuais por categoria)
CREATE TABLE IF NOT EXISTS falas (
    id_fala INT AUTO_INCREMENT PRIMARY KEY,
    id_categoria INT NOT NULL,
    texto VARCHAR(255) NOT NULL,
    emoji VARCHAR(10) NULL,
    ordem INT DEFAULT 0,
    FOREIGN KEY (id_categoria) REFERENCES categorias(id_categoria) ON DELETE CASCADE
);

-- Tabela de Frases de Atalho
CREATE TABLE IF NOT EXISTS frases_atalho (
    id_frase INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    texto TEXT NOT NULL,
    data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
);

-- Tabela de Lembretes
CREATE TABLE IF NOT EXISTS lembretes (
    id_lembrete INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    texto TEXT NOT NULL,
    feito TINYINT(1) DEFAULT 0,
    data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
);

-- Tabela de Rotinas
CREATE TABLE IF NOT EXISTS rotinas (
    id_rotina INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    dia_semana VARCHAR(20) NOT NULL,
    atividade VARCHAR(255) NOT NULL,
    horario TIME NOT NULL,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
);

-- Tabela de Histórico de Comunicação
CREATE TABLE IF NOT EXISTS historico_comunicacao (
    id_historico INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    id_fala INT NULL,
    texto TEXT NOT NULL,
    emoji VARCHAR(10) NULL,
    tipo VARCHAR(50) NOT NULL, -- Ex: 'frase', 'fala'
    data_uso DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
);

-- Tabela de Configuração de Botões (Hardware)
CREATE TABLE IF NOT EXISTS configuracao_botoes (
    id_botao INT PRIMARY KEY,
    nome_audio VARCHAR(255) NOT NULL,
    descricao VARCHAR(255) NULL
);

-- INSERÇÃO DE DADOS INICIAIS

-- Categorias
INSERT INTO categorias (id_categoria, nome_categoria, emoji, cor, ordem) VALUES
(1, 'Comida', '🍎', '#FFADAD', 1),
(2, 'Perguntas', '❓', '#BDE0FE', 2),
(3, 'Ações', '🏃', '#C1E1C1', 3),
(4, 'Sentimento', '😊', '#FDFFB6', 4),
(5, 'Social', '👋', '#FFC8DD', 5),
(6, 'Algo errado', '❌', '#FFB7B2', 6),
(7, 'Afirmação', '✅', '#B9FBC0', 7),
(8, 'Localização', '🏠', '#A2D2FF', 8),
(9, 'Lazer', '🎮', '#CDB4DB', 9);

-- Falas (Pictogramas)
INSERT INTO falas (id_fala, id_categoria, texto, emoji, ordem) VALUES
-- Categoria 1: Comida
(101, 1, 'Melancia', '🍉', 1), (102, 1, 'Batata frita', '🍟', 2), (103, 1, 'Carne', '🥩', 3),
(104, 1, 'Cenoura', '🥕', 4), (105, 1, 'Milho', '🌽', 5), (106, 1, 'Pipoca', '🍿', 6),
(107, 1, 'Bento', '🍱', 7), (108, 1, 'Ovo', '🍳', 8), (109, 1, 'Donut', '🍩', 9),
(110, 1, 'Chocolate', '🍫', 10), (111, 1, 'Leite', '🥛', 11), (112, 1, 'Suco', '🧃', 12),
-- Categoria 2: Perguntas
(201, 2, 'O que é isso?', '❓', 1), (202, 2, 'Onde está?', '📍', 2), (203, 2, 'Quem escolhe?', '👤', 3),
(204, 2, 'Qual você quer?', '🤔', 4), (205, 2, 'Por que?', '❔', 5), (206, 2, 'Pronto?', '🏁', 6),
(207, 2, 'Está certo?', '✅', 7), (208, 2, 'Quanto falta?', '⏳', 8), (209, 2, 'Onde vamos?', '🚗', 9),
(210, 2, 'Pode pegar?', '🤲', 10), (211, 2, 'Você gosta?', '❤️', 11), (212, 2, 'Você me ajuda?', '🤝', 12),
-- Categoria 3: Ações
(301, 3, 'Andar', '🚶', 1), (302, 3, 'Correr', '🏃', 2), (303, 3, 'Ir', '🚶‍♂️', 3),
(304, 3, 'Pegar', '🤲', 4), (305, 3, 'Receber', '🙌', 5), (306, 3, 'Dar', '💁‍♂️', 6),
(307, 3, 'Parar', '🛑', 7), (308, 3, 'Comprar', '🛍️', 8), (309, 3, 'Passear', '🚗', 9),
(310, 3, 'Escolher', '⁉️', 10), (311, 3, 'Sentar', '🪑', 11), (312, 3, 'Sair', '↩️', 12),
-- Categoria 4: Sentimento
(401, 4, 'Estou feliz', '😊', 1), (402, 4, 'Estou triste', '😢', 2), (403, 4, 'Estou alegre', '😄', 3),
(404, 4, 'Estou com sede', '😫', 4), (405, 4, 'Estou cansado', '😫', 5), (406, 4, 'Estou bem', '🙂', 6),
(407, 4, 'Estou mal', '🙁', 7), (408, 4, 'Eu quero ajuda', '🙋‍♂️', 8), (409, 4, 'Estou animado', '🤩', 9),
(410, 4, 'Estou com fome', '😋', 10), (411, 4, 'Estou com frio', '🥶', 11), (412, 4, 'Estou com dor', '🤕', 12),
-- Categoria 5: Social
(501, 5, 'Olá', '👋', 1), (502, 5, 'Tchau', '👋', 2), (503, 5, 'Obrigado', '🤝', 3),
(504, 5, 'Desculpe', '😔', 4), (505, 5, 'Por favor', '🙏', 5), (506, 5, 'Com licença', '👥', 6),
(507, 5, 'Muito prazer', '🤝', 7), (508, 5, 'Saúde', '🥂', 8), (509, 5, 'Como você está?', '🙋‍♀️', 9),
(510, 5, 'Bom dia', '☀️', 10), (511, 5, 'Boa tarde', '🌤️', 11), (512, 5, 'Boa noite', '🌙', 12),
-- Categoria 6: Algo errado
(601, 6, 'Está errado', '🚫', 1), (602, 6, 'Não quero', '🙅‍♂️', 2), (603, 6, 'Pare', '✋', 3),
(604, 6, 'Estou confuso', '😵', 4), (605, 6, 'Estou bravo', '😡', 5), (606, 6, 'Está ruim', '🤢', 6),
(607, 6, 'Está difícil', '⚒️', 7), (608, 6, 'Não gosto', '👎', 8), (609, 6, 'Não entendi', '❓', 9),
(610, 6, 'Onde está errado?', '⚒️', 10), (611, 6, 'Tem um problema', '⚠️', 11), (612, 6, 'Espere', '⏳', 12),
-- Categoria 7: Afirmação
(701, 7, 'Sim', '✅', 1), (702, 7, 'Não', '❌', 2), (703, 7, 'Talvez', '🤔', 3),
(704, 7, 'Está bom', '👍', 4), (705, 7, 'Eu aceito', '✔️', 5), (706, 7, 'Já fiz', '🔘', 6),
(707, 7, 'Eu entendi', '👈', 7), (708, 7, 'Eu quero', '🤩', 8), (709, 7, 'Eu concordo', '🤝', 9),
(710, 7, 'Obrigado(a)', '🙏', 10), (711, 7, 'Quero mais', '➕', 11), (712, 7, 'Eu gosto', '😋', 12),
-- Categoria 8: Localização
(801, 8, 'Quero banheiro', '🚻', 1), (802, 8, 'Quero casa', '🏠', 2), (803, 8, 'Quero escola', '🏫', 3),
(804, 8, 'Quero o quarto', '🛏️', 4), (805, 8, 'Quero a sala', '🛋️', 5), (806, 8, 'Quero a cozinha', '🚪', 6),
(807, 8, 'Vamos lá', '➡️', 7), (808, 8, 'Quero rua', '🪑', 8), (809, 8, 'Onde estamos?', '📍', 9),
(810, 8, 'Vamos almoçar', '🍽️', 10), (811, 8, 'Quero ir', '📌', 11), (812, 8, 'Minha casa', '🏠', 12),
-- Categoria 9: Lazer
(901, 9, 'Quero brincar', '🧸', 1), (902, 9, 'Quero jogar', '🎮', 2), (903, 9, 'Quero música', '🎵', 3),
(904, 9, 'Quero ler', '📖', 4), (905, 9, 'Quero desenhar', '🎨', 5), (906, 9, 'Quero parque', '🌳', 6),
(907, 9, 'Quero TV', '📺', 7), (908, 9, 'Quero cinema', '🎬', 8), (909, 9, 'Quero videogame', '📺', 9),
(910, 9, 'Quero nadar', '🏊', 10), (911, 9, 'Quero pintar', '✏️', 11), (912, 9, 'Quero dormir', '😴', 12);

-- Botões Hardware
INSERT INTO configuracao_botoes (id_botao, nome_audio, descricao) VALUES
(1, 'audio_amarelo.mp3', 'Botão Amarelo'),
(2, 'audio_verde.mp3', 'Botão Verde'),
(3, 'audio_azul.mp3', 'Botão Azul'),
(4, 'audio_vermelho.mp3', 'Botão Vermelho'),
(5, 'audio_branco.mp3', 'Botão Branco');
