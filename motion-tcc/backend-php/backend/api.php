<?php
/* =============================================================================
   M.O.T.I.O.N — API única do backend (tcc_php/api.php)
   =============================================================================
   Antes esta API era 15 arquivos soltos (login.php, criancas.php,
   categorias.php, falas.php...), cada um repetindo os mesmos
   `require_once 'config.php'` / `require_once 'helpers.php'` e cada um
   sendo uma URL própria. Agora é só ESTE arquivo.

   Como o app chama cada rota (ver src/api.js no app React Native):
       api.php?rota=login            (POST)
       api.php?rota=cadastrar        (POST)
       api.php?rota=logout           (POST)
       api.php?rota=criancas         (GET / POST / PUT / DELETE)
       api.php?rota=categorias       (GET / POST / PUT / DELETE)
       api.php?rota=falas            (GET / POST / PUT / DELETE)
       api.php?rota=historico        (GET / POST / DELETE)
       api.php?rota=frases           (GET / POST / DELETE)
       api.php?rota=rotinas          (GET / POST / PUT / DELETE)
       api.php?rota=lembretes        (GET / POST / PUT / DELETE)
       api.php?rota=mood             (GET / POST)
       api.php?rota=monitoramento    (GET)
       api.php?rota=pareamento       (GET / POST)
       api.php?rota=upload_imagem    (POST, multipart/form-data)
       api.php?rota=configurar_botao (POST, multipart/form-data)

   `?rota=` vem sempre pela query string, mesmo em POST/PUT/DELETE — por
   isso funciona igual não importa se o restante dos dados está no body
   (JSON) ou em multipart/form-data.

   Estrutura do arquivo (procure pelos títulos ⓵–⓹):
       ⓵ CONFIGURAÇÃO      — credenciais do banco e CORS
       ⓶ CONEXÃO           — abre a conexão mysqli usada por tudo abaixo
       ⓷ FUNÇÕES AUXILIARES — sessão, autorização, respostas padronizadas
       ⓸ ROTAS             — uma função rota_xxx() por endpoint
       ⓹ ROTEADOR          — lê ?rota= e chama a função certa

   O que continua FORA deste arquivo, de propósito:
   Os scripts de ponte com o hardware físico (arduino_bridge.php,
   disparar_python.php, gatilho_rapido.php, ler_sensor.php, tocar_som.php,
   verificar_hardware.php, diagnostico.php) NÃO foram trazidos pra cá.
   Eles rodam num XAMPP LOCAL, na máquina da demonstração — usam caminhos
   Windows (C:\xampp2\...), COM do Windows e `tasklist`, coisas que não
   existem (e não podem existir) em um servidor Linux compartilhado. São dois sistemas diferentes por
   natureza; juntar tudo num arquivo só quebraria os dois.
   ============================================================================= */


/* ─────────────────────────────────────────────────────────────────────────
   ⓵ CONFIGURAÇÃO — credenciais do banco. Se precisar trocar host/usuário/
   senha do MySQL, é só aqui.
   ───────────────────────────────────────────────────────────────────────── */
// A configuração fica em config.php para funcionar no Docker ou no XAMPP local.
$configPath = __DIR__ . '/config.php';
if (!is_file($configPath)) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['success' => false, 'message' => 'config.php não encontrado na pasta da API'], JSON_UNESCAPED_UNICODE);
    exit;
}
require_once $configPath;

// Compatibilidade: config.php deve fornecer $conn já conectado.
if (!isset($conn) || !($conn instanceof mysqli)) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['success' => false, 'message' => 'config.php não criou uma conexão mysqli válida'], JSON_UNESCAPED_UNICODE);
    exit;
}

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }


/* ─────────────────────────────────────────────────────────────────────────
   ⓶ CONEXÃO
   ───────────────────────────────────────────────────────────────────────── */
// A conexão já foi criada pelo config.php.
$conn->set_charset('utf8mb4');


/* ─────────────────────────────────────────────────────────────────────────
   ⓷ FUNÇÕES AUXILIARES
   ───────────────────────────────────────────────────────────────────────── */

// Envia a resposta JSON e encerra a requisição — nenhuma rota deve
// escrever nada na tela por fora disto, pra garantir que a resposta é
// sempre um JSON único e válido.
function responder($payload) {
    echo json_encode($payload);
    exit();
}

function erro($mensagem, $codigoHttp = 400) {
    http_response_code($codigoHttp);
    responder(['success' => false, 'message' => $mensagem]);
}

// Lê JSON e também application/x-www-form-urlencoded. Hospedagens
// compartilhadas podem bloquear ou encerrar POSTs JSON, então as rotas de
// autenticação aceitam os dois formatos.
function corpoJson() {
    if (!empty($_POST) && is_array($_POST)) {
        return $_POST;
    }
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function gerarCodigoPareamento() {
    return str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
}

function gerarDeviceSecret() {
    return bin2hex(random_bytes(32));
}

function gerarTokenSessao() {
    return bin2hex(random_bytes(32));
}

// Normaliza os tipos de uma linha de "criancas" vinda do mysqli — por padrão
// o mysqli devolve TUDO como string (mesmo colunas INT/DECIMAL), o que
// quebra comparações estritas (===) no app, por exemplo nos "chips" de
// configuração que comparam o valor salvo com um número literal. Toda
// resposta que inclui uma criança deve passar por aqui antes de responder().
function formatarCrianca($row) {
    if (!$row) return $row;
    $row['tempo_resposta'] = (int) $row['tempo_resposta'];
    $row['varredura_velocidade'] = (int) $row['varredura_velocidade'];
    $row['velocidade_voz'] = (float) $row['velocidade_voz'];
    $row['volume'] = (float) $row['volume'];
    $row['alto_contraste'] = (bool) $row['alto_contraste'];
    $row['alvos_gigantes'] = (bool) $row['alvos_gigantes'];
    $row['varredura_ativa'] = (bool) $row['varredura_ativa'];
    return $row;
}

// Cria uma sessão de login (válida por 180 dias) e devolve o token gerado.
function criarSessao($conn, $usuario_id) {
    $usuario_id = (int) $usuario_id;
    $token = gerarTokenSessao();
    $conn->query("INSERT INTO sessoes (usuario_id, token, expira_em)
                  VALUES ($usuario_id, '$token', DATE_ADD(NOW(), INTERVAL 180 DAY))");
    return $token;
}

// Valida um token de sessão e retorna o usuário dono dele. Todo endpoint
// que age em nome de um responsável deve chamar isto — o usuario_id nunca
// deve ser aceito cru do cliente para fins de autorização, pois qualquer
// pessoa poderia adivinhar ou reaproveitar o id de outra família.
function exigirSessao($conn, $token) {
    if (empty($token)) {
        erro('Sessão inválida, faça login novamente', 401);
    }
    $token = $conn->real_escape_string($token);
    $sql = "SELECT u.id_usuario, u.nome, u.email FROM sessoes s
            JOIN usuarios u ON u.id_usuario = s.usuario_id
            WHERE s.token = '$token' AND s.expira_em > NOW() LIMIT 1";
    $result = $conn->query($sql);
    if (!$result || $result->num_rows === 0) {
        erro('Sessão expirada, faça login novamente', 401);
    }
    return $result->fetch_assoc();
}

// Confirma que a criança pertence ao usuário informado (modo Responsável).
function exigirCriancaDoUsuario($conn, $crianca_id, $usuario_id) {
    $crianca_id = (int) $crianca_id;
    $usuario_id = (int) $usuario_id;
    $sql = "SELECT * FROM criancas WHERE id_crianca = $crianca_id AND usuario_id = $usuario_id LIMIT 1";
    $result = $conn->query($sql);
    if (!$result || $result->num_rows === 0) {
        erro('Criança não encontrada ou não pertence a este usuário', 403);
    }
    return $result->fetch_assoc();
}

// Confirma um device_secret de modo Criança e retorna a linha da criança pareada.
function exigirDispositivoPareado($conn, $device_secret) {
    $device_secret = $conn->real_escape_string($device_secret);
    $sql = "SELECT c.* FROM dispositivos_crianca d
            JOIN criancas c ON c.id_crianca = d.crianca_id
            WHERE d.device_secret = '$device_secret' LIMIT 1";
    $result = $conn->query($sql);
    if (!$result || $result->num_rows === 0) {
        erro('Dispositivo não pareado ou pareamento inválido', 401);
    }
    $conn->query("UPDATE dispositivos_crianca SET ultimo_acesso = NOW() WHERE device_secret = '$device_secret'");
    return $result->fetch_assoc();
}

// Confirma que a categoria pertence a uma criança do usuário informado.
function exigirCategoriaDoUsuario($conn, $id_categoria, $usuario_id) {
    $id_categoria = (int) $id_categoria;
    $usuario_id = (int) $usuario_id;
    $sql = "SELECT cat.* FROM categorias cat
            JOIN criancas c ON c.id_crianca = cat.crianca_id
            WHERE cat.id_categoria = $id_categoria AND c.usuario_id = $usuario_id LIMIT 1";
    $result = $conn->query($sql);
    if (!$result || $result->num_rows === 0) {
        erro('Categoria não encontrada', 403);
    }
    return $result->fetch_assoc();
}

// Confirma que o pictograma pertence (via categoria → criança) ao usuário.
function exigirFalaDoUsuario($conn, $id_fala, $usuario_id) {
    $id_fala = (int) $id_fala;
    $usuario_id = (int) $usuario_id;
    $sql = "SELECT f.* FROM falas f
            JOIN categorias cat ON cat.id_categoria = f.id_categoria
            JOIN criancas c ON c.id_crianca = cat.crianca_id
            WHERE f.id_fala = $id_fala AND c.usuario_id = $usuario_id LIMIT 1";
    $result = $conn->query($sql);
    if (!$result || $result->num_rows === 0) {
        erro('Pictograma não encontrado', 403);
    }
    return $result->fetch_assoc();
}

// Confirma que a rotina pertence a uma criança do usuário informado.
function exigirRotinaDoUsuario($conn, $id_rotina, $usuario_id) {
    $id_rotina = (int) $id_rotina;
    $usuario_id = (int) $usuario_id;
    $sql = "SELECT r.* FROM rotinas r
            JOIN criancas c ON c.id_crianca = r.crianca_id
            WHERE r.id_rotina = $id_rotina AND c.usuario_id = $usuario_id LIMIT 1";
    $result = $conn->query($sql);
    if (!$result || $result->num_rows === 0) {
        erro('Rotina não encontrada', 403);
    }
    return $result->fetch_assoc();
}

// Confirma que o lembrete pertence a uma criança do usuário informado.
function exigirLembreteDoUsuario($conn, $id_lembrete, $usuario_id) {
    $id_lembrete = (int) $id_lembrete;
    $usuario_id = (int) $usuario_id;
    $sql = "SELECT l.* FROM lembretes l
            JOIN criancas c ON c.id_crianca = l.crianca_id
            WHERE l.id_lembrete = $id_lembrete AND c.usuario_id = $usuario_id LIMIT 1";
    $result = $conn->query($sql);
    if (!$result || $result->num_rows === 0) {
        erro('Lembrete não encontrado', 403);
    }
    return $result->fetch_assoc();
}

// Semeia categorias e pictogramas padrão para uma criança recém-criada,
// copiando o modelo global (linhas com crianca_id IS NULL).
function semearConteudoPadrao($conn, $crianca_id) {
    $crianca_id = (int) $crianca_id;
    $categoriasResult = $conn->query("SELECT * FROM categorias WHERE crianca_id IS NULL ORDER BY ordem");
    while ($cat = $categoriasResult->fetch_assoc()) {
        $nome = $conn->real_escape_string($cat['nome_categoria']);
        $emoji = $conn->real_escape_string($cat['emoji']);
        $cor = $conn->real_escape_string($cat['cor']);
        $ordem = (int) $cat['ordem'];
        $conn->query("INSERT INTO categorias (crianca_id, nome_categoria, emoji, cor, ordem)
                       VALUES ($crianca_id, '$nome', '$emoji', '$cor', $ordem)");
        $novaCategoriaId = $conn->insert_id;

        $falasResult = $conn->query("SELECT * FROM falas WHERE id_categoria = " . (int) $cat['id_categoria'] . " ORDER BY ordem");
        while ($fala = $falasResult->fetch_assoc()) {
            $texto = $conn->real_escape_string($fala['texto']);
            $femoji = $conn->real_escape_string($fala['emoji']);
            $fordem = (int) $fala['ordem'];
            $conn->query("INSERT INTO falas (id_categoria, texto, emoji, ordem)
                           VALUES ($novaCategoriaId, '$texto', '$femoji', $fordem)");
        }
    }

    // Fallback de segurança: a criança nunca deve ser criada com a área de
    // comunicação vazia, mesmo se o modelo global não existir no banco.
    $totalCategorias = (int) $conn->query("SELECT COUNT(*) AS total FROM categorias WHERE crianca_id = $crianca_id")->fetch_assoc()['total'];
    if ($totalCategorias === 0) {
        $fallback = [
            ['Necessidades', '🧩', '#BDE0FE', 'Quero água', '💧'],
            ['Sentimentos', '😊', '#CDEAC0', 'Estou feliz', '😄'],
            ['Atividades', '🎨', '#FFC8DD', 'Quero brincar', '🧸'],
        ];
        foreach ($fallback as $i => $item) {
            [$nome, $emoji, $cor, $texto, $femoji] = $item;
            $nome = $conn->real_escape_string($nome);
            $emoji = $conn->real_escape_string($emoji);
            $cor = $conn->real_escape_string($cor);
            $texto = $conn->real_escape_string($texto);
            $femoji = $conn->real_escape_string($femoji);
            $ordem = $i + 1;
            $conn->query("INSERT INTO categorias (crianca_id, nome_categoria, emoji, cor, ordem) VALUES ($crianca_id, '$nome', '$emoji', '$cor', $ordem)");
            $categoriaId = (int) $conn->insert_id;
            $conn->query("INSERT INTO falas (id_categoria, texto, emoji, ordem) VALUES ($categoriaId, '$texto', '$femoji', 1)");
        }
    }

    garantirDadosIniciais($conn, $crianca_id);
}

function garantirDadosIniciais($conn, $crianca_id) {
    $crianca_id = (int) $crianca_id;
    $categorias = $conn->query("SELECT id_categoria, nome_categoria, emoji FROM categorias WHERE crianca_id = $crianca_id ORDER BY ordem");
    if ($categorias && $categorias->num_rows === 0) {
        $modelos = [
            ['Necessidades', '🧩', 'Quero água', '💧'],
            ['Sentimentos', '😊', 'Estou feliz', '😄'],
            ['Atividades', '🎨', 'Quero brincar', '🧸'],
        ];
        foreach ($modelos as $i => [$nome, $emoji, $texto, $femoji]) {
            $nome = $conn->real_escape_string($nome); $emoji = $conn->real_escape_string($emoji);
            $texto = $conn->real_escape_string($texto); $femoji = $conn->real_escape_string($femoji);
            $ordem = $i + 1;
            $conn->query("INSERT INTO categorias (crianca_id, nome_categoria, emoji, cor, ordem) VALUES ($crianca_id, '$nome', '$emoji', '#BDE0FE', $ordem)");
            $id = (int) $conn->insert_id;
            $conn->query("INSERT INTO falas (id_categoria, texto, emoji, ordem) VALUES ($id, '$texto', '$femoji', 1)");
        }
    }
    $categorias = $conn->query("SELECT id_categoria, nome_categoria, emoji FROM categorias WHERE crianca_id = $crianca_id ORDER BY ordem");
    while ($cat = $categorias->fetch_assoc()) {
        $idCategoria = (int) $cat['id_categoria'];
        $totalFalas = (int) $conn->query("SELECT COUNT(*) AS total FROM falas WHERE id_categoria = $idCategoria")->fetch_assoc()['total'];
        $opcoes = [
            ['Quero água', '💧'], ['Estou com fome', '🍎'], ['Quero brincar', '🧸'],
            ['Estou feliz', '😄'], ['Quero ajuda', '🙋'], ['Obrigado', '🙏'],
        ];
        $ordem = $totalFalas + 1;
        while ($totalFalas < 5) {
            $opcao = $opcoes[$totalFalas % count($opcoes)];
            $texto = $conn->real_escape_string($opcao[0]);
            $emoji = $conn->real_escape_string($opcao[1]);
            $conn->query("INSERT INTO falas (id_categoria, texto, emoji, ordem) VALUES ($idCategoria, '$texto', '$emoji', $ordem)");
            $totalFalas++; $ordem++;
        }
    }
    $rotinas = $conn->query("SELECT COUNT(*) AS total FROM rotinas WHERE crianca_id = $crianca_id")->fetch_assoc();
    if ((int) $rotinas['total'] === 0) {
        // Dados iniciais úteis para que o perfil não comece vazio.
        $conn->query("INSERT INTO rotinas (crianca_id, dia_semana, atividade, horario, icone)
                      VALUES ($crianca_id, 'Todos os dias', 'Rotina da manhã', '08:00:00', '🌞')");
        $conn->query("INSERT INTO rotinas (crianca_id, dia_semana, atividade, horario, icone)
                      VALUES ($crianca_id, 'Todos os dias', 'Hora de brincar', '16:00:00', '🧸')");
    }
    $lembretes = $conn->query("SELECT COUNT(*) AS total FROM lembretes WHERE crianca_id = $crianca_id")->fetch_assoc();
    if ((int) $lembretes['total'] === 0) {
        // Lembretes iniciais editáveis pelo responsável.
        $conn->query("INSERT INTO lembretes (crianca_id, texto, hora, recorrencia)
                      VALUES ($crianca_id, 'Beber água', '10:00:00', 'diaria')");
        $conn->query("INSERT INTO lembretes (crianca_id, texto, hora, recorrencia)
                      VALUES ($crianca_id, 'Guardar os brinquedos', '18:00:00', 'diaria')");
    }

    // Pelo menos um exemplo em cada área exibida no app.
    $frases = $conn->query("SELECT COUNT(*) AS total FROM frases_atalho WHERE crianca_id = $crianca_id")->fetch_assoc();
    if ((int) $frases['total'] === 0) {
        $conn->query("INSERT INTO frases_atalho (crianca_id, texto) VALUES ($crianca_id, 'Obrigado'), ($crianca_id, 'Por favor')");
    }

    $humor = $conn->query("SELECT COUNT(*) AS total FROM mood_log WHERE crianca_id = $crianca_id")->fetch_assoc();
    if ((int) $humor['total'] === 0) {
        $conn->query("INSERT INTO mood_log (crianca_id, humor, emoji) VALUES ($crianca_id, 'feliz', '😄')");
    }

    $fala = $conn->query("SELECT f.id_fala, f.texto, f.emoji FROM falas f JOIN categorias c ON c.id_categoria = f.id_categoria WHERE c.crianca_id = $crianca_id ORDER BY f.id_fala LIMIT 1");
    if ($fala && ($amostra = $fala->fetch_assoc())) {
        $idFala = (int) $amostra['id_fala'];
        $textoFala = $conn->real_escape_string($amostra['texto']);
        $emojiFala = $conn->real_escape_string($amostra['emoji']);
        $historico = $conn->query("SELECT COUNT(*) AS total FROM historico_comunicacao WHERE crianca_id = $crianca_id")->fetch_assoc();
        if ((int) $historico['total'] === 0) {
            $conn->query("INSERT INTO historico_comunicacao (crianca_id, id_fala, texto, emoji, tipo) VALUES ($crianca_id, $idFala, '$textoFala', '$emojiFala', 'exemplo')");
        }
    }

    $avisos = $conn->query("SELECT COUNT(*) AS total FROM avisos_responsavel WHERE crianca_id = $crianca_id")->fetch_assoc();
    if ((int) $avisos['total'] === 0) {
        $conn->query("INSERT INTO avisos_responsavel (crianca_id, titulo, mensagem, emoji) VALUES ($crianca_id, 'Exemplo de aviso', 'Este é um aviso de demonstração do M.O.T.I.O.N.', '💬')");
    }
}


/* ─────────────────────────────────────────────────────────────────────────
   ⓸ ROTAS — uma função por endpoint. Cada uma reproduz exatamente o
   comportamento do arquivo original que a substitui (indicado no
   comentário de cada função).
   ───────────────────────────────────────────────────────────────────────── */

// Substitui login.php
function rota_login($conn) {
    $data = corpoJson();
    if (empty($data['email']) || empty($data['senha'])) {
        erro('email e senha são obrigatórios');
    }

    $email = $conn->real_escape_string($data['email']);
    $senha = $data['senha'];

    $sql = "SELECT id_usuario, nome, email, senha FROM usuarios WHERE email = '$email'";
    $result = $conn->query($sql);
    if ($result->num_rows === 0) {
        erro('Usuário não encontrado', 404);
    }
    $user = $result->fetch_assoc();

    $senhaConfere = password_verify($senha, $user['senha'])
        // Compatibilidade com contas antigas que ainda tinham senha em texto puro
        || $senha === $user['senha'];

    if (!$senhaConfere) {
        erro('Senha incorreta', 401);
    }

    // Se a senha ainda estava em texto puro, atualiza para hash na primeira vez que logar
    if ($senha === $user['senha'] && !password_get_info($user['senha'])['algo']) {
        $novoHash = password_hash($senha, PASSWORD_DEFAULT);
        $idEsc = (int) $user['id_usuario'];
        $conn->query("UPDATE usuarios SET senha = '$novoHash' WHERE id_usuario = $idEsc");
    }

    $token = criarSessao($conn, $user['id_usuario']);
    unset($user['senha']);
    responder(['success' => true, 'usuario' => $user, 'token' => $token]);
}

// Substitui cadastrar.php
function rota_cadastrar($conn) {
    $data = corpoJson();
    if (empty($data['nome']) || empty($data['email']) || empty($data['senha'])) {
        erro('nome, email e senha são obrigatórios');
    }

    $nome = $conn->real_escape_string($data['nome']);
    $email = $conn->real_escape_string($data['email']);
    $senhaHash = password_hash($data['senha'], PASSWORD_DEFAULT);
    $nomeDependente = $conn->real_escape_string($data['nome_dependente'] ?? '');

    $existe = $conn->query("SELECT id_usuario FROM usuarios WHERE email = '$email'");
    if ($existe && $existe->num_rows > 0) {
        erro('Já existe uma conta com este e-mail');
    }

    $sql = "INSERT INTO usuarios (nome, email, senha, nome_dependente) VALUES ('$nome', '$email', '$senhaHash', '$nomeDependente')";
    if ($conn->query($sql) === TRUE) {
        $novoId = $conn->insert_id;
        $token = criarSessao($conn, $novoId);
        responder([
            'success' => true,
            'message' => 'Usuário cadastrado',
            'usuario' => ['id_usuario' => $novoId, 'nome' => $data['nome'], 'email' => $data['email']],
            'token' => $token,
        ]);
    } else {
        erro('Erro ao cadastrar: ' . $conn->error);
    }
}

// Substitui logout.php
function rota_logout($conn) {
    $data = corpoJson();
    if (!empty($data['token'])) {
        $token = $conn->real_escape_string($data['token']);
        $conn->query("DELETE FROM sessoes WHERE token = '$token'");
    }
    // Best-effort: mesmo que o token já não exista, o resultado prático é o mesmo (sem sessão)
    responder(['success' => true]);
}

// Substitui criancas.php
function rota_criancas($conn) {
    $method = $_SERVER['REQUEST_METHOD'];

    switch ($method) {

        // Lista as crianças do responsável autenticado, ou detalhe de uma única criança
        case 'GET':
            $usuario = exigirSessao($conn, $_GET['token'] ?? '');
            $usuario_id = (int) $usuario['id_usuario'];

            if (isset($_GET['id_crianca'])) {
                $crianca = exigirCriancaDoUsuario($conn, $_GET['id_crianca'], $usuario_id);
                responder(['success' => true, 'crianca' => formatarCrianca($crianca)]);
            } else {
                $sql = "SELECT * FROM criancas WHERE usuario_id = $usuario_id ORDER BY nome";
                $result = $conn->query($sql);
                $criancas = [];
                while ($row = $result->fetch_assoc()) {
                    garantirDadosIniciais($conn, $row['id_crianca']);
                    $criancas[] = formatarCrianca($row);
                }
                responder(['success' => true, 'criancas' => $criancas]);
            }
            break;

        // Cria uma nova criança e semeia categorias/pictogramas padrão
        case 'POST':
            $data = corpoJson();
            $usuario = exigirSessao($conn, $data['token'] ?? '');
            $usuario_id = (int) $usuario['id_usuario'];

            if (empty($data['nome'])) {
                erro('nome é obrigatório');
            }
            $nome = $conn->real_escape_string($data['nome']);
            $avatar = $conn->real_escape_string($data['avatar_emoji'] ?? '🧒');
            $pin = $conn->real_escape_string($data['pin_saida'] ?? '1234');

            $sql = "INSERT INTO criancas (usuario_id, nome, avatar_emoji, pin_saida)
                    VALUES ($usuario_id, '$nome', '$avatar', '$pin')";
            if (!$conn->query($sql)) {
                erro('Erro ao criar criança: ' . $conn->error);
            }
            $novaId = $conn->insert_id;
            semearConteudoPadrao($conn, $novaId);

            responder(['success' => true, 'id_crianca' => $novaId, 'message' => 'Perfil criado e conteúdo padrão adicionado']);
            break;

        // Atualiza dados/configurações da criança (usado pela tela de Ajustes)
        case 'PUT':
            $data = corpoJson();
            $usuario = exigirSessao($conn, $data['token'] ?? '');
            $usuario_id = (int) $usuario['id_usuario'];

            if (empty($data['id_crianca'])) {
                erro('id_crianca é obrigatório');
            }
            exigirCriancaDoUsuario($conn, $data['id_crianca'], $usuario_id);
            $id_crianca = (int) $data['id_crianca'];

            $campos = [];
            $mapaTexto = ['nome', 'avatar_emoji', 'pin_saida', 'tamanho_pictograma', 'tema', 'voz'];
            foreach ($mapaTexto as $campo) {
                if (isset($data[$campo])) {
                    $valor = $conn->real_escape_string($data[$campo]);
                    $campos[] = "$campo = '$valor'";
                }
            }

            // Cores personalizadas do Modo Criança escolhidas pelo responsável.
            // Uma string vazia significa "voltar para a cor padrão do tema"
            // (grava NULL); qualquer outro valor precisa bater com #RRGGBB.
            $mapaCor = ['cor_primaria', 'cor_destaque'];
            foreach ($mapaCor as $campo) {
                if (isset($data[$campo])) {
                    $valor = trim($data[$campo]);
                    if ($valor === '') {
                        $campos[] = "$campo = NULL";
                    } elseif (preg_match('/^#[0-9A-Fa-f]{6}$/', $valor)) {
                        $valor = $conn->real_escape_string($valor);
                        $campos[] = "$campo = '$valor'";
                    } else {
                        erro("$campo inválida — use o formato #RRGGBB");
                    }
                }
            }
            $mapaNumerico = ['velocidade_voz', 'volume', 'tempo_resposta', 'varredura_velocidade'];
            foreach ($mapaNumerico as $campo) {
                if (isset($data[$campo])) {
                    $campos[] = "$campo = " . (float) $data[$campo];
                }
            }
            $mapaBool = ['alto_contraste', 'alvos_gigantes', 'varredura_ativa'];
            foreach ($mapaBool as $campo) {
                if (isset($data[$campo])) {
                    $campos[] = "$campo = " . ($data[$campo] ? 1 : 0);
                }
            }

            if (empty($campos)) {
                erro('Nenhum campo para atualizar');
            }
            $sql = "UPDATE criancas SET " . implode(', ', $campos) . " WHERE id_crianca = $id_crianca";
            if ($conn->query($sql)) {
                responder(['success' => true, 'message' => 'Configurações atualizadas']);
            } else {
                erro('Erro ao atualizar: ' . $conn->error);
            }
            break;

        case 'DELETE':
            $data = corpoJson();
            $usuario = exigirSessao($conn, $data['token'] ?? '');
            $usuario_id = (int) $usuario['id_usuario'];

            if (empty($data['id_crianca'])) {
                erro('id_crianca é obrigatório');
            }
            exigirCriancaDoUsuario($conn, $data['id_crianca'], $usuario_id);
            $id_crianca = (int) $data['id_crianca'];
            if ($conn->query("DELETE FROM criancas WHERE id_crianca = $id_crianca")) {
                responder(['success' => true, 'message' => 'Perfil removido']);
            } else {
                erro('Erro ao remover: ' . $conn->error);
            }
            break;

        default:
            erro('Método não permitido', 405);
    }
}

// Substitui categorias.php
function rota_categorias($conn) {
    $method = $_SERVER['REQUEST_METHOD'];

    switch ($method) {

        // Lista categorias de uma criança — acesso do responsável (token) ou
        // do dispositivo pareado (device_secret), conforme quem estiver chamando.
        case 'GET':
            if (empty($_GET['crianca_id'])) {
                erro('crianca_id é obrigatório');
            }
            if (!empty($_GET['device_secret'])) {
                $crianca = exigirDispositivoPareado($conn, $_GET['device_secret']);
                $crianca_id = (int) $crianca['id_crianca'];
            } else {
                $usuario = exigirSessao($conn, $_GET['token'] ?? '');
                $crianca = exigirCriancaDoUsuario($conn, $_GET['crianca_id'], $usuario['id_usuario']);
                $crianca_id = (int) $crianca['id_crianca'];
            }

            $sql = "SELECT id_categoria, nome_categoria, emoji, cor, ordem
                    FROM categorias WHERE crianca_id = $crianca_id ORDER BY ordem, id_categoria";
            $result = $conn->query($sql);
            $categorias = [];
            while ($row = $result->fetch_assoc()) { $categorias[] = $row; }
            responder(['success' => true, 'categorias' => $categorias]);
            break;

        // Cria uma categoria nova para uma criança (editor de conteúdo, modo Responsável)
        case 'POST':
            $data = corpoJson();
            $usuario = exigirSessao($conn, $data['token'] ?? '');
            $usuario_id = (int) $usuario['id_usuario'];

            if (empty($data['crianca_id']) || empty($data['nome_categoria'])) {
                erro('crianca_id e nome_categoria são obrigatórios');
            }
            exigirCriancaDoUsuario($conn, $data['crianca_id'], $usuario_id);
            $crianca_id = (int) $data['crianca_id'];
            $nome = $conn->real_escape_string($data['nome_categoria']);
            $emoji = $conn->real_escape_string($data['emoji'] ?? '📋');
            $cor = $conn->real_escape_string($data['cor'] ?? '#BDE0FE');

            $ordemResult = $conn->query("SELECT COALESCE(MAX(ordem), 0) + 1 AS proxima FROM categorias WHERE crianca_id = $crianca_id");
            $ordem = (int) $ordemResult->fetch_assoc()['proxima'];

            $sql = "INSERT INTO categorias (crianca_id, nome_categoria, emoji, cor, ordem)
                    VALUES ($crianca_id, '$nome', '$emoji', '$cor', $ordem)";
            if ($conn->query($sql)) {
                responder(['success' => true, 'id_categoria' => $conn->insert_id]);
            } else {
                erro('Erro ao criar categoria: ' . $conn->error);
            }
            break;

        case 'PUT':
            $data = corpoJson();
            $usuario = exigirSessao($conn, $data['token'] ?? '');
            $usuario_id = (int) $usuario['id_usuario'];

            if (empty($data['id_categoria'])) {
                erro('id_categoria é obrigatório');
            }
            exigirCategoriaDoUsuario($conn, $data['id_categoria'], $usuario_id);
            $id_categoria = (int) $data['id_categoria'];

            $campos = [];
            foreach (['nome_categoria', 'emoji', 'cor'] as $campo) {
                if (isset($data[$campo])) {
                    $valor = $conn->real_escape_string($data[$campo]);
                    $campos[] = "$campo = '$valor'";
                }
            }
            if (isset($data['ordem'])) { $campos[] = "ordem = " . (int) $data['ordem']; }
            if (empty($campos)) { erro('Nenhum campo para atualizar'); }

            $sql = "UPDATE categorias SET " . implode(', ', $campos) . " WHERE id_categoria = $id_categoria";
            if ($conn->query($sql)) {
                responder(['success' => true, 'message' => 'Categoria atualizada']);
            } else {
                erro('Erro ao atualizar: ' . $conn->error);
            }
            break;

        case 'DELETE':
            $data = corpoJson();
            $usuario = exigirSessao($conn, $data['token'] ?? '');
            $usuario_id = (int) $usuario['id_usuario'];

            if (empty($data['id_categoria'])) {
                erro('id_categoria é obrigatório');
            }
            exigirCategoriaDoUsuario($conn, $data['id_categoria'], $usuario_id);
            $id_categoria = (int) $data['id_categoria'];
            if ($conn->query("DELETE FROM categorias WHERE id_categoria = $id_categoria")) {
                responder(['success' => true, 'message' => 'Categoria removida']);
            } else {
                erro('Erro ao remover: ' . $conn->error);
            }
            break;

        default:
            erro('Método não permitido', 405);
    }
}

// Substitui falas.php
function rota_falas($conn) {
    $method = $_SERVER['REQUEST_METHOD'];

    switch ($method) {

        // Lista os pictogramas de uma categoria (modo Responsável ou dispositivo pareado)
        case 'GET':
            if (empty($_GET['id_categoria'])) {
                erro('id_categoria é obrigatório');
            }
            $id_categoria = (int) $_GET['id_categoria'];

            if (!empty($_GET['device_secret'])) {
                exigirDispositivoPareado($conn, $_GET['device_secret']);
            } else {
                $usuario = exigirSessao($conn, $_GET['token'] ?? '');
                $usuario_id = (int) $usuario['id_usuario'];
                $check = $conn->query("SELECT cat.id_categoria FROM categorias cat
                                        JOIN criancas c ON c.id_crianca = cat.crianca_id
                                        WHERE cat.id_categoria = $id_categoria AND c.usuario_id = $usuario_id");
                if (!$check || $check->num_rows === 0) { erro('Categoria não encontrada', 403); }
            }

            $sql = "SELECT id_fala, texto, emoji, imagem_url, ordem FROM falas
                    WHERE id_categoria = $id_categoria ORDER BY ordem, id_fala";
            $result = $conn->query($sql);
            $falas = [];
            while ($row = $result->fetch_assoc()) { $falas[] = $row; }
            responder(['success' => true, 'falas' => $falas]);
            break;

        // Cria um novo pictograma numa categoria (editor de conteúdo)
        case 'POST':
            $data = corpoJson();
            $usuario = exigirSessao($conn, $data['token'] ?? '');
            $usuario_id = (int) $usuario['id_usuario'];

            if (empty($data['id_categoria']) || empty($data['texto'])) {
                erro('id_categoria e texto são obrigatórios');
            }
            $id_categoria = (int) $data['id_categoria'];
            $check = $conn->query("SELECT cat.id_categoria FROM categorias cat
                                    JOIN criancas c ON c.id_crianca = cat.crianca_id
                                    WHERE cat.id_categoria = $id_categoria AND c.usuario_id = $usuario_id");
            if (!$check || $check->num_rows === 0) { erro('Categoria não encontrada', 403); }

            $texto = $conn->real_escape_string($data['texto']);
            $emoji = $conn->real_escape_string($data['emoji'] ?? '💬');
            $imagemUrl = isset($data['imagem_url']) ? "'" . $conn->real_escape_string($data['imagem_url']) . "'" : 'NULL';

            $ordemResult = $conn->query("SELECT COALESCE(MAX(ordem), 0) + 1 AS proxima FROM falas WHERE id_categoria = $id_categoria");
            $ordem = (int) $ordemResult->fetch_assoc()['proxima'];

            $sql = "INSERT INTO falas (id_categoria, texto, emoji, imagem_url, ordem)
                    VALUES ($id_categoria, '$texto', '$emoji', $imagemUrl, $ordem)";
            if ($conn->query($sql)) {
                responder(['success' => true, 'id_fala' => $conn->insert_id]);
            } else {
                erro('Erro ao criar pictograma: ' . $conn->error);
            }
            break;

        case 'PUT':
            $data = corpoJson();
            $usuario = exigirSessao($conn, $data['token'] ?? '');
            $usuario_id = (int) $usuario['id_usuario'];

            if (empty($data['id_fala'])) {
                erro('id_fala é obrigatório');
            }
            exigirFalaDoUsuario($conn, $data['id_fala'], $usuario_id);
            $id_fala = (int) $data['id_fala'];

            $campos = [];
            foreach (['texto', 'emoji', 'imagem_url'] as $campo) {
                if (isset($data[$campo])) {
                    $valor = $conn->real_escape_string($data[$campo]);
                    $campos[] = "$campo = '$valor'";
                }
            }
            if (isset($data['ordem'])) { $campos[] = "ordem = " . (int) $data['ordem']; }
            if (empty($campos)) { erro('Nenhum campo para atualizar'); }

            $sql = "UPDATE falas SET " . implode(', ', $campos) . " WHERE id_fala = $id_fala";
            if ($conn->query($sql)) {
                responder(['success' => true, 'message' => 'Pictograma atualizado']);
            } else {
                erro('Erro ao atualizar: ' . $conn->error);
            }
            break;

        case 'DELETE':
            $data = corpoJson();
            $usuario = exigirSessao($conn, $data['token'] ?? '');
            $usuario_id = (int) $usuario['id_usuario'];

            if (empty($data['id_fala'])) {
                erro('id_fala é obrigatório');
            }
            exigirFalaDoUsuario($conn, $data['id_fala'], $usuario_id);
            $id_fala = (int) $data['id_fala'];
            if ($conn->query("DELETE FROM falas WHERE id_fala = $id_fala")) {
                responder(['success' => true, 'message' => 'Pictograma removido']);
            } else {
                erro('Erro ao remover: ' . $conn->error);
            }
            break;

        default:
            erro('Método não permitido', 405);
    }
}

// Substitui historico.php
function rota_historico($conn) {
    $method = $_SERVER['REQUEST_METHOD'];

    switch ($method) {

        // Lista o histórico de falas de uma criança (tela do responsável / monitoramento)
        case 'GET':
            $usuario = exigirSessao($conn, $_GET['token'] ?? '');
            $usuario_id = (int) $usuario['id_usuario'];

            if (empty($_GET['crianca_id'])) {
                erro('crianca_id é obrigatório');
            }
            exigirCriancaDoUsuario($conn, $_GET['crianca_id'], $usuario_id);
            $crianca_id = (int) $_GET['crianca_id'];
            $limite = isset($_GET['limite']) ? (int) $_GET['limite'] : 50;

            $sql = "SELECT id_historico, texto, emoji, tipo, data_uso
                    FROM historico_comunicacao
                    WHERE crianca_id = $crianca_id
                    ORDER BY data_uso DESC LIMIT $limite";
            $result = $conn->query($sql);
            $historico = [];
            while ($row = $result->fetch_assoc()) {
                $historico[] = [
                    'id_historico' => $row['id_historico'],
                    'data_uso' => date('d/m H:i', strtotime($row['data_uso'])),
                    'texto' => $row['texto'],
                    'emoji' => $row['emoji'] ?? '💬',
                    'tipo' => $row['tipo'],
                ];
            }
            responder(['success' => true, 'historico' => $historico]);
            break;

        // Registra uma fala (modo Criança, via device_secret, ou teste no modo Responsável)
        case 'POST':
            $data = corpoJson();
            if (empty($data['crianca_id']) || empty($data['texto'])) {
                erro('crianca_id e texto são obrigatórios');
            }
            if (!empty($data['device_secret'])) {
                exigirDispositivoPareado($conn, $data['device_secret']);
            } else {
                $usuario = exigirSessao($conn, $data['token'] ?? '');
                exigirCriancaDoUsuario($conn, $data['crianca_id'], $usuario['id_usuario']);
            }

            $crianca_id = (int) $data['crianca_id'];
            $texto = $conn->real_escape_string($data['texto']);
            $emoji = $conn->real_escape_string($data['emoji'] ?? '💬');
            $tipo = $conn->real_escape_string($data['tipo'] ?? 'fala');
            $id_fala = isset($data['id_fala']) ? (int) $data['id_fala'] : 'NULL';

            $sql = "INSERT INTO historico_comunicacao (crianca_id, id_fala, texto, emoji, tipo)
                    VALUES ($crianca_id, $id_fala, '$texto', '$emoji', '$tipo')";
            if ($conn->query($sql)) {
                responder(['success' => true, 'message' => 'Registro salvo no histórico']);
            } else {
                erro('Erro ao salvar: ' . $conn->error);
            }
            break;

        case 'DELETE':
            $data = corpoJson();
            $usuario = exigirSessao($conn, $data['token'] ?? '');
            $usuario_id = (int) $usuario['id_usuario'];

            if (empty($data['crianca_id'])) {
                erro('crianca_id é obrigatório');
            }
            exigirCriancaDoUsuario($conn, $data['crianca_id'], $usuario_id);
            $crianca_id = (int) $data['crianca_id'];
            if ($conn->query("DELETE FROM historico_comunicacao WHERE crianca_id = $crianca_id")) {
                responder(['success' => true, 'message' => 'Histórico limpo']);
            } else {
                erro('Erro ao limpar: ' . $conn->error);
            }
            break;

        default:
            erro('Método não permitido', 405);
    }
}

// Substitui frases.php
function rota_frases($conn) {
    $method = $_SERVER['REQUEST_METHOD'];

    switch ($method) {
        case 'GET':
            if (empty($_GET['crianca_id'])) {
                erro('crianca_id é obrigatório');
            }
            if (!empty($_GET['device_secret'])) {
                exigirDispositivoPareado($conn, $_GET['device_secret']);
            } else {
                $usuario = exigirSessao($conn, $_GET['token'] ?? '');
                exigirCriancaDoUsuario($conn, $_GET['crianca_id'], $usuario['id_usuario']);
            }
            $crianca_id = (int) $_GET['crianca_id'];
            $sql = "SELECT id_frase, texto FROM frases_atalho WHERE crianca_id = $crianca_id ORDER BY id_frase DESC";
            $result = $conn->query($sql);
            $frases = [];
            while ($row = $result->fetch_assoc()) { $frases[] = $row; }
            responder(['success' => true, 'frases' => $frases]);
            break;

        case 'POST':
            $data = corpoJson();
            if (empty($data['crianca_id']) || empty($data['texto'])) {
                erro('crianca_id e texto são obrigatórios');
            }
            if (!empty($data['device_secret'])) {
                exigirDispositivoPareado($conn, $data['device_secret']);
            } else {
                $usuario = exigirSessao($conn, $data['token'] ?? '');
                exigirCriancaDoUsuario($conn, $data['crianca_id'], $usuario['id_usuario']);
            }
            $crianca_id = (int) $data['crianca_id'];
            $texto = $conn->real_escape_string($data['texto']);
            $sql = "INSERT INTO frases_atalho (crianca_id, texto) VALUES ($crianca_id, '$texto')";
            if ($conn->query($sql)) {
                responder(['success' => true, 'message' => 'Frase adicionada']);
            } else {
                erro('Erro ao adicionar: ' . $conn->error);
            }
            break;

        case 'DELETE':
            $data = corpoJson();
            if (empty($data['id_frase'])) {
                erro('id_frase é obrigatório');
            }
            // Exige uma sessão válida (responsável) ou dispositivo pareado (criança)
            // antes de remover — sem isso, qualquer um poderia apagar frases de outros.
            if (!empty($data['device_secret'])) {
                exigirDispositivoPareado($conn, $data['device_secret']);
            } else {
                exigirSessao($conn, $data['token'] ?? '');
            }
            $id_frase = (int) $data['id_frase'];
            if ($conn->query("DELETE FROM frases_atalho WHERE id_frase = $id_frase")) {
                responder(['success' => true]);
            } else {
                erro('Erro ao remover: ' . $conn->error);
            }
            break;

        default:
            erro('Método não permitido', 405);
    }
}

// Substitui rotinas.php
function rota_rotinas($conn) {
    $method = $_SERVER['REQUEST_METHOD'];

    switch ($method) {

        // Lista rotinas de uma criança. Se "dia_semana" for informado, filtra pelo
        // dia (usado no modo Criança) e inclui se já foi concluída hoje.
        case 'GET':
            if (empty($_GET['crianca_id'])) {
                erro('crianca_id é obrigatório');
            }
            if (!empty($_GET['device_secret'])) {
                exigirDispositivoPareado($conn, $_GET['device_secret']);
            } else {
                $usuario = exigirSessao($conn, $_GET['token'] ?? '');
                exigirCriancaDoUsuario($conn, $_GET['crianca_id'], $usuario['id_usuario']);
            }
            $crianca_id = (int) $_GET['crianca_id'];

            $sql = "SELECT id_rotina, atividade, horario, dia_semana, icone FROM rotinas
                    WHERE crianca_id = $crianca_id";
            if (!empty($_GET['dia_semana'])) {
                $dia = $conn->real_escape_string($_GET['dia_semana']);
                $sql .= " AND FIND_IN_SET('$dia', dia_semana) > 0";
            }
            $sql .= " ORDER BY horario";
            $result = $conn->query($sql);

            $hoje = date('Y-m-d');
            $rotinas = [];
            while ($row = $result->fetch_assoc()) {
                $row['dias_semana'] = $row['dia_semana'] ? explode(',', $row['dia_semana']) : [];
                $execResult = $conn->query("SELECT 1 FROM rotina_execucoes
                                             WHERE rotina_id = {$row['id_rotina']} AND data_execucao = '$hoje'");
                $row['concluida_hoje'] = $execResult && $execResult->num_rows > 0;
                $rotinas[] = $row;
            }
            responder(['success' => true, 'rotinas' => $rotinas]);
            break;

        case 'POST':
            $data = corpoJson();
            $acao = $data['acao'] ?? 'criar';

            // ── Marcar rotina como concluída hoje (modo Criança ou Responsável) ──
            if ($acao === 'concluir') {
                if (empty($data['id_rotina'])) { erro('id_rotina é obrigatório'); }
                if (!empty($data['device_secret'])) {
                    exigirDispositivoPareado($conn, $data['device_secret']);
                } else {
                    $usuario = exigirSessao($conn, $data['token'] ?? '');
                    exigirRotinaDoUsuario($conn, $data['id_rotina'], $usuario['id_usuario']);
                }
                $id_rotina = (int) $data['id_rotina'];
                $data_execucao = $data['data'] ?? date('Y-m-d');
                $data_execucao = $conn->real_escape_string($data_execucao);
                $sql = "INSERT IGNORE INTO rotina_execucoes (rotina_id, data_execucao) VALUES ($id_rotina, '$data_execucao')";
                $conn->query($sql);
                responder(['success' => true, 'message' => 'Rotina concluída']);
            }

            // ── Criar rotina nova (editor, modo Responsável) ──
            $usuario = exigirSessao($conn, $data['token'] ?? '');
            $usuario_id = (int) $usuario['id_usuario'];

            if (empty($data['crianca_id']) || empty($data['atividade']) || empty($data['horario'])) {
                erro('crianca_id, atividade e horario são obrigatórios');
            }
            exigirCriancaDoUsuario($conn, $data['crianca_id'], $usuario_id);
            $crianca_id = (int) $data['crianca_id'];
            $atividade = $conn->real_escape_string($data['atividade']);
            $horario = $conn->real_escape_string($data['horario']);
            $icone = $conn->real_escape_string($data['icone'] ?? '⭐');
            $dias = isset($data['dias_semana']) && is_array($data['dias_semana']) ? $data['dias_semana'] : [];
            $diasStr = $conn->real_escape_string(implode(',', $dias));

            $sql = "INSERT INTO rotinas (crianca_id, dia_semana, atividade, horario, icone)
                    VALUES ($crianca_id, '$diasStr', '$atividade', '$horario', '$icone')";
            if ($conn->query($sql)) {
                responder(['success' => true, 'id_rotina' => $conn->insert_id]);
            } else {
                erro('Erro ao criar rotina: ' . $conn->error);
            }
            break;

        case 'PUT':
            $data = corpoJson();
            $usuario = exigirSessao($conn, $data['token'] ?? '');
            $usuario_id = (int) $usuario['id_usuario'];

            if (empty($data['id_rotina'])) {
                erro('id_rotina é obrigatório');
            }
            exigirRotinaDoUsuario($conn, $data['id_rotina'], $usuario_id);
            $id_rotina = (int) $data['id_rotina'];

            $campos = [];
            foreach (['atividade', 'horario', 'icone'] as $campo) {
                if (isset($data[$campo])) {
                    $valor = $conn->real_escape_string($data[$campo]);
                    $campos[] = "$campo = '$valor'";
                }
            }
            if (isset($data['dias_semana']) && is_array($data['dias_semana'])) {
                $diasStr = $conn->real_escape_string(implode(',', $data['dias_semana']));
                $campos[] = "dia_semana = '$diasStr'";
            }
            if (empty($campos)) { erro('Nenhum campo para atualizar'); }

            $sql = "UPDATE rotinas SET " . implode(', ', $campos) . " WHERE id_rotina = $id_rotina";
            if ($conn->query($sql)) {
                responder(['success' => true, 'message' => 'Rotina atualizada']);
            } else {
                erro('Erro ao atualizar: ' . $conn->error);
            }
            break;

        case 'DELETE':
            $data = corpoJson();
            $usuario = exigirSessao($conn, $data['token'] ?? '');
            $usuario_id = (int) $usuario['id_usuario'];

            if (empty($data['id_rotina'])) {
                erro('id_rotina é obrigatório');
            }
            exigirRotinaDoUsuario($conn, $data['id_rotina'], $usuario_id);
            $id_rotina = (int) $data['id_rotina'];
            if ($conn->query("DELETE FROM rotinas WHERE id_rotina = $id_rotina")) {
                responder(['success' => true, 'message' => 'Rotina removida']);
            } else {
                erro('Erro ao remover: ' . $conn->error);
            }
            break;

        default:
            erro('Método não permitido', 405);
    }
}

// Substitui lembretes.php
function rota_lembretes($conn) {
    $method = $_SERVER['REQUEST_METHOD'];

    switch ($method) {

        case 'GET':
            if (empty($_GET['crianca_id'])) {
                erro('crianca_id é obrigatório');
            }
            if (!empty($_GET['device_secret'])) {
                exigirDispositivoPareado($conn, $_GET['device_secret']);
            } else {
                $usuario = exigirSessao($conn, $_GET['token'] ?? '');
                exigirCriancaDoUsuario($conn, $_GET['crianca_id'], $usuario['id_usuario']);
            }
            $crianca_id = (int) $_GET['crianca_id'];

            $sql = "SELECT id_lembrete, texto, feito, hora, recorrencia FROM lembretes
                    WHERE crianca_id = $crianca_id ORDER BY hora IS NULL, hora, id_lembrete DESC";
            $result = $conn->query($sql);
            $lembretes = [];
            while ($row = $result->fetch_assoc()) {
                $row['feito'] = (bool) $row['feito'];
                $lembretes[] = $row;
            }
            responder(['success' => true, 'lembretes' => $lembretes]);
            break;

        case 'POST':
            $data = corpoJson();
            $usuario = exigirSessao($conn, $data['token'] ?? '');
            $usuario_id = (int) $usuario['id_usuario'];

            if (empty($data['crianca_id']) || empty($data['texto'])) {
                erro('crianca_id e texto são obrigatórios');
            }
            exigirCriancaDoUsuario($conn, $data['crianca_id'], $usuario_id);
            $crianca_id = (int) $data['crianca_id'];
            $texto = $conn->real_escape_string($data['texto']);
            $hora = !empty($data['hora']) ? "'" . $conn->real_escape_string($data['hora']) . "'" : 'NULL';
            $recorrencia = $conn->real_escape_string($data['recorrencia'] ?? 'uma_vez');

            $sql = "INSERT INTO lembretes (crianca_id, texto, hora, recorrencia)
                    VALUES ($crianca_id, '$texto', $hora, '$recorrencia')";
            if ($conn->query($sql)) {
                responder(['success' => true, 'id_lembrete' => $conn->insert_id]);
            } else {
                erro('Erro ao adicionar: ' . $conn->error);
            }
            break;

        // Alterna feito/não-feito (usado tanto pelo responsável quanto pelo modo Criança)
        case 'PUT':
            $data = corpoJson();
            if (empty($data['id_lembrete'])) {
                erro('id_lembrete é obrigatório');
            }
            if (!empty($data['device_secret'])) {
                exigirDispositivoPareado($conn, $data['device_secret']);
            } else {
                $usuario = exigirSessao($conn, $data['token'] ?? '');
                exigirLembreteDoUsuario($conn, $data['id_lembrete'], $usuario['id_usuario']);
            }
            $id_lembrete = (int) $data['id_lembrete'];
            $feito = !empty($data['feito']) ? 1 : 0;
            $dataConclusao = $feito ? 'NOW()' : 'NULL';
            $sql = "UPDATE lembretes SET feito = $feito, data_conclusao = $dataConclusao WHERE id_lembrete = $id_lembrete";
            if ($conn->query($sql)) {
                responder(['success' => true]);
            } else {
                erro('Erro ao atualizar: ' . $conn->error);
            }
            break;

        case 'DELETE':
            $data = corpoJson();
            $usuario = exigirSessao($conn, $data['token'] ?? '');
            $usuario_id = (int) $usuario['id_usuario'];

            if (empty($data['id_lembrete'])) {
                erro('id_lembrete é obrigatório');
            }
            exigirLembreteDoUsuario($conn, $data['id_lembrete'], $usuario_id);
            $id_lembrete = (int) $data['id_lembrete'];
            if ($conn->query("DELETE FROM lembretes WHERE id_lembrete = $id_lembrete")) {
                responder(['success' => true]);
            } else {
                erro('Erro ao remover: ' . $conn->error);
            }
            break;

        default:
            erro('Método não permitido', 405);
    }
}

// Substitui mood.php
function rota_mood($conn) {
    $method = $_SERVER['REQUEST_METHOD'];

    switch ($method) {

        case 'GET':
            $usuario = exigirSessao($conn, $_GET['token'] ?? '');
            $usuario_id = (int) $usuario['id_usuario'];

            if (empty($_GET['crianca_id'])) {
                erro('crianca_id é obrigatório');
            }
            exigirCriancaDoUsuario($conn, $_GET['crianca_id'], $usuario_id);
            $crianca_id = (int) $_GET['crianca_id'];
            $dias = isset($_GET['dias']) ? (int) $_GET['dias'] : 14;

            $sql = "SELECT humor, emoji, data_registro FROM mood_log
                    WHERE crianca_id = $crianca_id AND data_registro >= DATE_SUB(NOW(), INTERVAL $dias DAY)
                    ORDER BY data_registro ASC";
            $result = $conn->query($sql);
            $registros = [];
            while ($row = $result->fetch_assoc()) { $registros[] = $row; }
            responder(['success' => true, 'registros' => $registros]);
            break;

        case 'POST':
            $data = corpoJson();
            if (empty($data['crianca_id']) || empty($data['humor'])) {
                erro('crianca_id e humor são obrigatórios');
            }
            if (!empty($data['device_secret'])) {
                exigirDispositivoPareado($conn, $data['device_secret']);
            } else {
                $usuario = exigirSessao($conn, $data['token'] ?? '');
                exigirCriancaDoUsuario($conn, $data['crianca_id'], $usuario['id_usuario']);
            }
            $crianca_id = (int) $data['crianca_id'];
            $humor = $conn->real_escape_string($data['humor']);
            $emoji = $conn->real_escape_string($data['emoji'] ?? '');

            $sql = "INSERT INTO mood_log (crianca_id, humor, emoji) VALUES ($crianca_id, '$humor', '$emoji')";
            if ($conn->query($sql)) {
                responder(['success' => true, 'message' => 'Humor registrado']);
            } else {
                erro('Erro ao registrar: ' . $conn->error);
            }
            break;

        default:
            erro('Método não permitido', 405);
    }
}

// Substitui monitoramento.php
function rota_monitoramento($conn) {
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') { erro('Método não permitido', 405); }

    $usuario = exigirSessao($conn, $_GET['token'] ?? '');
    $usuario_id = (int) $usuario['id_usuario'];

    if (empty($_GET['crianca_id'])) {
        erro('crianca_id é obrigatório');
    }
    exigirCriancaDoUsuario($conn, $_GET['crianca_id'], $usuario_id);
    $crianca_id = (int) $_GET['crianca_id'];
    $dias = isset($_GET['dias']) ? (int) $_GET['dias'] : 7;

    // Pictogramas/frases mais usados
    $maisUsados = [];
    $sql = "SELECT texto, emoji, COUNT(*) AS total FROM historico_comunicacao
            WHERE crianca_id = $crianca_id AND data_uso >= DATE_SUB(NOW(), INTERVAL $dias DAY)
            GROUP BY texto, emoji ORDER BY total DESC LIMIT 8";
    $result = $conn->query($sql);
    while ($row = $result->fetch_assoc()) { $maisUsados[] = $row; }

    // Falas por dia (para gráfico de barras)
    $falasPorDia = [];
    $sql = "SELECT DATE(data_uso) AS dia, COUNT(*) AS total FROM historico_comunicacao
            WHERE crianca_id = $crianca_id AND data_uso >= DATE_SUB(NOW(), INTERVAL $dias DAY)
            GROUP BY DATE(data_uso) ORDER BY dia ASC";
    $result = $conn->query($sql);
    while ($row = $result->fetch_assoc()) { $falasPorDia[] = $row; }

    // Cumprimento de rotinas (últimos N dias): total de rotinas ativas x concluídas por dia
    $sqlTotalRotinas = "SELECT COUNT(*) AS total FROM rotinas WHERE crianca_id = $crianca_id";
    $totalRotinas = (int) $conn->query($sqlTotalRotinas)->fetch_assoc()['total'];

    $rotinasPorDia = [];
    $sql = "SELECT data_execucao AS dia, COUNT(*) AS total FROM rotina_execucoes re
            JOIN rotinas r ON r.id_rotina = re.rotina_id
            WHERE r.crianca_id = $crianca_id AND data_execucao >= DATE_SUB(CURDATE(), INTERVAL $dias DAY)
            GROUP BY data_execucao ORDER BY dia ASC";
    $result = $conn->query($sql);
    while ($row = $result->fetch_assoc()) {
        $row['total_rotinas'] = $totalRotinas;
        $rotinasPorDia[] = $row;
    }

    // Lembretes: total x concluídos (janela geral, não só o dia)
    $sqlLembretes = "SELECT COUNT(*) AS total, SUM(feito) AS concluidos FROM lembretes WHERE crianca_id = $crianca_id";
    $lembretesRow = $conn->query($sqlLembretes)->fetch_assoc();
    $lembretesResumo = [
        'total' => (int) $lembretesRow['total'],
        'concluidos' => (int) ($lembretesRow['concluidos'] ?? 0),
    ];

    // Humor ao longo do tempo
    $humor = [];
    $sql = "SELECT humor, emoji, data_registro FROM mood_log
            WHERE crianca_id = $crianca_id AND data_registro >= DATE_SUB(NOW(), INTERVAL $dias DAY)
            ORDER BY data_registro ASC";
    $result = $conn->query($sql);
    while ($row = $result->fetch_assoc()) { $humor[] = $row; }

    // Total de falas no período (resumo rápido para topo da tela)
    $totalFalas = 0;
    foreach ($falasPorDia as $d) { $totalFalas += (int) $d['total']; }

    responder([
        'success' => true,
        'periodo_dias' => $dias,
        'total_falas' => $totalFalas,
        'mais_usados' => $maisUsados,
        'falas_por_dia' => $falasPorDia,
        'rotinas_por_dia' => $rotinasPorDia,
        'total_rotinas' => $totalRotinas,
        'lembretes_resumo' => $lembretesResumo,
        'humor' => $humor,
    ]);
}

// Substitui pareamento.php
function rota_pareamento($conn) {
    $method = $_SERVER['REQUEST_METHOD'];

    switch ($method) {

        // Consulta o código de pareamento ativo de uma criança (tela do responsável)
        case 'GET':
            $usuario = exigirSessao($conn, $_GET['token'] ?? '');
            if (empty($_GET['crianca_id'])) {
                erro('crianca_id é obrigatório');
            }
            exigirCriancaDoUsuario($conn, $_GET['crianca_id'], $usuario['id_usuario']);
            $crianca_id = (int) $_GET['crianca_id'];
            $sql = "SELECT codigo, expira_em FROM pareamento_codigos
                    WHERE crianca_id = $crianca_id AND expira_em > NOW()
                    ORDER BY criado_em DESC LIMIT 1";
            $result = $conn->query($sql);
            $codigo = $result && $result->num_rows > 0 ? $result->fetch_assoc() : null;
            responder(['success' => true, 'codigo_ativo' => $codigo]);
            break;

        case 'POST':
            $data = corpoJson();
            $acao = $data['acao'] ?? '';

            // ── Gerar/renovar código (modo Responsável, autenticado) ──
            if ($acao === 'gerar') {
                $usuario = exigirSessao($conn, $data['token'] ?? '');
                if (empty($data['crianca_id'])) {
                    erro('crianca_id é obrigatório');
                }
                exigirCriancaDoUsuario($conn, $data['crianca_id'], $usuario['id_usuario']);
                $crianca_id = (int) $data['crianca_id'];

                $codigo = gerarCodigoPareamento();
                $sql = "INSERT INTO pareamento_codigos (crianca_id, codigo, expira_em)
                        VALUES ($crianca_id, '$codigo', DATE_ADD(NOW(), INTERVAL 30 DAY))";
                if ($conn->query($sql)) {
                    responder(['success' => true, 'codigo' => $codigo, 'validade_dias' => 30]);
                } else {
                    erro('Erro ao gerar código: ' . $conn->error);
                }

            // ── Validar código e parear o dispositivo (modo Criança, sem login) ──
            } elseif ($acao === 'validar') {
                if (empty($data['codigo'])) {
                    erro('Código é obrigatório');
                }
                $codigo = $conn->real_escape_string(trim($data['codigo']));
                $sql = "SELECT crianca_id FROM pareamento_codigos
                        WHERE codigo = '$codigo' AND expira_em > NOW() AND usado = 0
                        ORDER BY criado_em DESC LIMIT 1";
                $result = $conn->query($sql);
                if (!$result || $result->num_rows === 0) {
                    erro('Código inválido ou expirado', 404);
                }
                $row = $result->fetch_assoc();
                $crianca_id = (int) $row['crianca_id'];

                $conn->query("UPDATE pareamento_codigos SET usado = 1 WHERE codigo = '$codigo'");

                $deviceSecret = gerarDeviceSecret();
                $conn->query("INSERT INTO dispositivos_crianca (crianca_id, device_secret)
                               VALUES ($crianca_id, '$deviceSecret')");

                $criancaResult = $conn->query("SELECT * FROM criancas WHERE id_crianca = $crianca_id");
                $crianca = $criancaResult->fetch_assoc();

                responder(['success' => true, 'device_secret' => $deviceSecret, 'crianca' => formatarCrianca($crianca)]);

            // ── Verificar se um device_secret salvo localmente ainda é válido ──
            } elseif ($acao === 'verificar_dispositivo') {
                if (empty($data['device_secret'])) {
                    erro('device_secret é obrigatório');
                }
                $crianca = exigirDispositivoPareado($conn, $data['device_secret']);
                responder(['success' => true, 'crianca' => formatarCrianca($crianca)]);

            } else {
                erro('Ação inválida');
            }
            break;

        default:
            erro('Método não permitido', 405);
    }
}

// Substitui upload_imagem.php
function rota_upload_imagem($conn) {
    // Só responsáveis autenticados podem enviar fotos (é usado no editor de
    // conteúdo). O modo Criança nunca precisa chamar isto.
    $usuario = exigirSessao($conn, $_POST['token'] ?? '');

    if (empty($_FILES['imagem'])) {
        erro('Nenhuma imagem enviada');
    }

    $arquivo = $_FILES['imagem'];
    if ($arquivo['error'] !== UPLOAD_ERR_OK) {
        erro('Falha no envio da imagem (código ' . $arquivo['error'] . ')');
    }

    // Limite de 5 MB, só imagens comuns.
    $TAMANHO_MAXIMO = 5 * 1024 * 1024;
    if ($arquivo['size'] > $TAMANHO_MAXIMO) {
        erro('Imagem muito grande (máximo 5 MB)');
    }

    $extensoesPermitidas = ['jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg', 'png' => 'image/png', 'webp' => 'image/webp'];
    $extensaoOriginal = strtolower(pathinfo($arquivo['name'], PATHINFO_EXTENSION));
    if (!isset($extensoesPermitidas[$extensaoOriginal])) {
        erro('Formato de imagem não suportado. Use JPG, PNG ou WEBP.');
    }

    $pastaUploads = __DIR__ . '/uploads/pictogramas';
    if (!is_dir($pastaUploads)) {
        mkdir($pastaUploads, 0755, true);
    }

    $nomeArquivo = bin2hex(random_bytes(16)) . '.' . $extensaoOriginal;
    $caminhoDestino = $pastaUploads . '/' . $nomeArquivo;

    if (!move_uploaded_file($arquivo['tmp_name'], $caminhoDestino)) {
        erro('Não foi possível salvar a imagem no servidor');
    }

    // URL relativa — o app monta a URL completa prefixando com API_URL.
    $urlRelativa = 'uploads/pictogramas/' . $nomeArquivo;
    responder(['success' => true, 'url' => $urlRelativa]);
}

// Substitui configurar_botao.php
//
// Duas correções em relação ao arquivo original, sem mudar o uso do app:
// 1) id_botao/nome_audio agora são escapados/tipados antes de entrar na
//    query (o original concatenava $_POST direto na SQL: injeção aberta).
// 2) agora exige sessão de responsável, igual todo o resto da API — o app
//    já manda o token automaticamente em toda chamada autenticada (ver o
//    interceptor em src/api.js), então isso não muda nada do lado do app,
//    só fecha uma rota que antes não pedia login nenhum.
function rota_configurar_botao($conn) {
    exigirSessao($conn, $_POST['token'] ?? ($_GET['token'] ?? ''));

    $id_botao = filter_var($_POST['id_botao'] ?? null, FILTER_VALIDATE_INT);
    $nome_audio = $_POST['nome_audio'] ?? '';
    $descricao_audio = $_POST['descricao_audio'] ?? '';
    $audios_permitidos = ['andar.mp3','brincar.mp3','banheiro.mp3','nao_quero.mp3','onde_vamos.mp3','esta_muito_barulho.mp3','estou_assustado.mp3','estou_com_sono.mp3','preciso_lavar_as_maos.mp3','kettle.mp3','posso_brincar.mp3','que_horas_sao.mp3','gosto_de_fruta.mp3','esta_quente.mp3'];

    if (!$id_botao || $id_botao < 1 || $id_botao > 5 || !in_array($nome_audio, $audios_permitidos, true)) {
        erro('Botão ou som inválido');
    }

    $descricao_audio = $conn->real_escape_string(mb_substr(trim($descricao_audio ?: pathinfo($nome_audio, PATHINFO_FILENAME)), 0, 160));
    $stmt = $conn->prepare(
        'INSERT INTO configuracao_botoes (id_botao, nome_audio, descricao_audio) VALUES (?, ?, ?) ' .
        'ON DUPLICATE KEY UPDATE nome_audio = VALUES(nome_audio), descricao_audio = VALUES(descricao_audio)'
    );
    if (!$stmt) erro('Erro ao preparar configuração: ' . $conn->error, 500);
    $stmt->bind_param('iss', $id_botao, $nome_audio, $descricao_audio);
    if (!$stmt->execute()) erro('Erro ao salvar configuração: ' . $stmt->error, 500);
    $stmt->close();
    responder(['success' => true, 'id_botao' => $id_botao, 'nome_audio' => $nome_audio, 'descricao_audio' => $descricao_audio]);
}


function rota_listar_botoes($conn) {
    $usuario = exigirSessao($conn, $_GET['token'] ?? '');
    $result = $conn->query("SELECT id_botao, nome_audio, descricao_audio, atualizado_em FROM configuracao_botoes ORDER BY id_botao");
    $botoes = [];
    while ($row = $result->fetch_assoc()) $botoes[] = $row;
    responder(['success' => true, 'botoes' => $botoes]);
}

// Publicações do responsável. Requer sessão válida e só permite que o autor
// consulte ou exclua as próprias publicações.
function rota_posts($conn) {
    $method = $_SERVER['REQUEST_METHOD'];
    if ($method === 'GET') {
        $usuario = exigirSessao($conn, $_GET['token'] ?? '');
        $usuario_id = (int) $usuario['id_usuario'];
        $stmt = $conn->prepare('SELECT id_post, usuario_id, texto, imagem_url, criado_em, atualizado_em FROM posts WHERE usuario_id = ? ORDER BY criado_em DESC');
        if (!$stmt) erro('Não foi possível preparar a consulta de posts.', 500);
        $stmt->bind_param('i', $usuario_id);
        if (!$stmt->execute()) erro('Não foi possível carregar os posts.', 500);
        $result = $stmt->get_result();
        $posts = [];
        while ($row = $result->fetch_assoc()) $posts[] = $row;
        $stmt->close();
        responder(['success' => true, 'posts' => $posts]);
    }
    if ($method === 'POST') {
        $data = corpoJson();
        $usuario = exigirSessao($conn, $data['token'] ?? '');
        $texto = trim((string) ($data['texto'] ?? ''));
        $imagem_url = trim((string) ($data['imagem_url'] ?? ''));
        if ($texto === '' && $imagem_url === '') erro('Informe um texto ou uma imagem para publicar.');
        if (mb_strlen($texto) > 5000) erro('O texto pode ter no máximo 5000 caracteres.');
        if (mb_strlen($imagem_url) > 1000) erro('O endereço da imagem é muito longo.');
        $usuario_id = (int) $usuario['id_usuario'];
        $stmt = $conn->prepare("INSERT INTO posts (usuario_id, texto, imagem_url) VALUES (?, ?, NULLIF(?, ''))");
        if (!$stmt) erro('Não foi possível preparar a publicação.', 500);
        $stmt->bind_param('iss', $usuario_id, $texto, $imagem_url);
        if (!$stmt->execute()) erro('Não foi possível publicar agora.', 500);
        $id_post = $conn->insert_id;
        $stmt->close();
        responder(['success' => true, 'message' => 'Post publicado com sucesso.', 'id_post' => $id_post]);
    }
    if ($method === 'DELETE') {
        $data = corpoJson();
        $usuario = exigirSessao($conn, $data['token'] ?? '');
        $id_post = filter_var($data['id_post'] ?? 0, FILTER_VALIDATE_INT);
        if (!$id_post || $id_post < 1) erro('id_post é obrigatório.');
        $usuario_id = (int) $usuario['id_usuario'];
        $stmt = $conn->prepare('DELETE FROM posts WHERE id_post = ? AND usuario_id = ?');
        if (!$stmt) erro('Não foi possível preparar a exclusão.', 500);
        $stmt->bind_param('ii', $id_post, $usuario_id);
        if (!$stmt->execute()) erro('Não foi possível excluir o post.', 500);
        if ($stmt->affected_rows === 0) erro('Post não encontrado.', 404);
        $stmt->close();
        responder(['success' => true, 'message' => 'Post excluído.']);
    }
    erro('Método não permitido', 405);
}

// Avisos enviados pela criança ao responsável.
function rota_avisos($conn) {
    $method = $_SERVER['REQUEST_METHOD'];
    if ($method === 'GET') {
        if (empty($_GET['crianca_id'])) erro('crianca_id é obrigatório');
        $crianca_id = (int) $_GET['crianca_id'];
        if (!empty($_GET['device_secret'])) {
            exigirDispositivoPareado($conn, $_GET['device_secret']);
        } else {
            $usuario = exigirSessao($conn, $_GET['token'] ?? '');
            exigirCriancaDoUsuario($conn, $crianca_id, $usuario['id_usuario']);
        }
        $result = $conn->query("SELECT id_aviso, crianca_id, titulo, mensagem, emoji, lido, criado_em FROM avisos_responsavel WHERE crianca_id = $crianca_id ORDER BY lido ASC, criado_em DESC");
        $avisos = [];
        while ($row = $result->fetch_assoc()) { $row['lido'] = (bool) $row['lido']; $avisos[] = $row; }
        responder(['success' => true, 'avisos' => $avisos]);
    }

    $data = corpoJson();
    if ($method === 'POST') {
        $crianca_id = (int) ($data['crianca_id'] ?? 0);
        if (!$crianca_id || empty($data['titulo']) || empty($data['mensagem'])) erro('crianca_id, titulo e mensagem são obrigatórios');
        if (!empty($data['device_secret'])) exigirDispositivoPareado($conn, $data['device_secret']);
        else { $usuario = exigirSessao($conn, $data['token'] ?? ''); exigirCriancaDoUsuario($conn, $crianca_id, $usuario['id_usuario']); }
        $titulo = $conn->real_escape_string(mb_substr(trim($data['titulo']), 0, 120));
        $mensagem = $conn->real_escape_string(mb_substr(trim($data['mensagem']), 0, 255));
        $emoji = $conn->real_escape_string(mb_substr($data['emoji'] ?? '🔔', 0, 16));
        if (!$conn->query("INSERT INTO avisos_responsavel (crianca_id, titulo, mensagem, emoji) VALUES ($crianca_id, '$titulo', '$mensagem', '$emoji')")) erro('Erro ao criar aviso: ' . $conn->error, 500);
        responder(['success' => true, 'id_aviso' => $conn->insert_id]);
    }
    if ($method === 'PUT') {
        if (empty($data['id_aviso'])) erro('id_aviso é obrigatório');
        $usuario = exigirSessao($conn, $data['token'] ?? '');
        $id = (int) $data['id_aviso'];
        $check = $conn->query("SELECT a.* FROM avisos_responsavel a JOIN criancas c ON c.id_crianca = a.crianca_id WHERE a.id_aviso = $id AND c.usuario_id = " . (int)$usuario['id_usuario'] . " LIMIT 1");
        if (!$check || !$check->num_rows) erro('Aviso não encontrado', 404);
        if (array_key_exists('lido', $data)) {
            $lido = !empty($data['lido']) ? 1 : 0;
            $conn->query("UPDATE avisos_responsavel SET lido = $lido WHERE id_aviso = $id");
        } else {
            $titulo = $conn->real_escape_string(mb_substr(trim($data['titulo'] ?? ''), 0, 120));
            $mensagem = $conn->real_escape_string(mb_substr(trim($data['mensagem'] ?? ''), 0, 255));
            if (!$titulo || !$mensagem) erro('Título e mensagem são obrigatórios');
            $conn->query("UPDATE avisos_responsavel SET titulo = '$titulo', mensagem = '$mensagem' WHERE id_aviso = $id");
        }
        responder(['success' => true]);
    }
    if ($method === 'DELETE') {
        $usuario = exigirSessao($conn, $data['token'] ?? '');
        $id = (int) ($data['id_aviso'] ?? 0);
        $check = $conn->query("SELECT a.id_aviso FROM avisos_responsavel a JOIN criancas c ON c.id_crianca = a.crianca_id WHERE a.id_aviso = $id AND c.usuario_id = " . (int)$usuario['id_usuario'] . " LIMIT 1");
        if (!$check || !$check->num_rows) erro('Aviso não encontrado', 404);
        $conn->query("DELETE FROM avisos_responsavel WHERE id_aviso = $id");
        responder(['success' => true]);
    }
    erro('Método não permitido', 405);
}

/* ─────────────────────────────────────────────────────────────────────────
   ⓹ ROTEADOR — ponto de entrada único. Lê ?rota= (sempre via query string,
   mesmo em POST/PUT/DELETE) e chama a função correspondente.
   ───────────────────────────────────────────────────────────────────────── */
$rota = $_GET['rota'] ?? '';

switch ($rota) {
    case 'login':             rota_login($conn); break;
    case 'cadastrar':         rota_cadastrar($conn); break;
    case 'logout':            rota_logout($conn); break;
    case 'criancas':          rota_criancas($conn); break;
    case 'categorias':        rota_categorias($conn); break;
    case 'falas':             rota_falas($conn); break;
    case 'historico':         rota_historico($conn); break;
    case 'frases':            rota_frases($conn); break;
    case 'rotinas':           rota_rotinas($conn); break;
    case 'lembretes':         rota_lembretes($conn); break;
    case 'avisos':             rota_avisos($conn); break;
    case 'posts':              rota_posts($conn); break;
    case 'mood':               rota_mood($conn); break;
    case 'monitoramento':     rota_monitoramento($conn); break;
    case 'pareamento':        rota_pareamento($conn); break;
    case 'upload_imagem':     rota_upload_imagem($conn); break;
    case 'configurar_botao':  rota_configurar_botao($conn); break;
    case 'listar_botoes':     rota_listar_botoes($conn); break;
    default:
        erro('Rota não encontrada: "' . $rota . '"', 404);
}

$conn->close();
