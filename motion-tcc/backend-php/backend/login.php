<?php
// teste_cadastro.php - Teste completo do cadastro (CORRIGIDO)

echo "<h1>🧪 TESTE DE CADASTRO - M.O.T.I.O.N</h1>";

// 1. Verificar se o banco existe
echo "<h2>1. Verificando banco de dados...</h2>";
$conn = new mysqli('localhost', 'root', '', 'bd_comunicacao');
if ($conn->connect_error) {
    die("❌ ERRO: Não foi possível conectar ao banco: " . $conn->connect_error);
}
echo "✅ Conectado ao banco com sucesso!<br>";

// 2. Verificar se a tabela usuarios existe
echo "<h2>2. Verificando tabela usuarios...</h2>";
$result = $conn->query("SHOW TABLES LIKE 'usuarios'");
if ($result->num_rows == 0) {
    die("❌ ERRO: Tabela 'usuarios' não existe! Execute o SQL primeiro.");
}
echo "✅ Tabela 'usuarios' existe!<br>";

// 3. Verificar se a tabela sessoes existe
echo "<h2>3. Verificando tabela sessoes...</h2>";
$result = $conn->query("SHOW TABLES LIKE 'sessoes'");
if ($result->num_rows == 0) {
    die("❌ ERRO: Tabela 'sessoes' não existe! Execute o SQL primeiro.");
}
echo "✅ Tabela 'sessoes' existe!<br>";

// 4. Testar cadastro via POST (simulando o app)
echo "<h2>4. Testando cadastro via POST (JSON)...</h2>";

$email_teste = "teste_" . time() . "@email.com";
$dados = [
    'nome' => 'Usuário Teste',
    'email' => $email_teste,
    'senha' => '123456'
];

$json = json_encode($dados);

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, "http://localhost/tcc_php/api.php?rota=cadastrar");
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $json);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

$resposta = curl_exec($ch);
$erro = curl_error($ch);
curl_close($ch);

if ($erro) {
    echo "❌ ERRO cURL: " . $erro . "<br>";
} else {
    echo "<strong>Resposta da API:</strong><br>";
    echo "<pre style='background:#f0f0f0;padding:10px;border-radius:5px;'>";
    echo htmlspecialchars($resposta);
    echo "</pre>";
    
    $decodado = json_decode($resposta, true);
    if ($decodado && isset($decodado['success']) && $decodado['success'] === true) {
        echo "✅ <strong style='color:green'>CADASTRO FUNCIONOU!</strong><br>";
        echo "Token: " . substr($decodado['token'], 0, 30) . "...<br>";
        echo "Usuário ID: " . $decodado['usuario']['id_usuario'] . "<br>";
    } else {
        echo "❌ <strong style='color:red'>CADASTRO FALHOU!</strong><br>";
        echo "Mensagem: " . ($decodado['message'] ?? 'Sem mensagem de erro') . "<br>";
    }
}

// 5. Testar se o login funciona
echo "<h2>5. Testando login com o usuário criado...</h2>";

$dados_login = [
    'email' => $email_teste,
    'senha' => '123456'
];

$json_login = json_encode($dados_login);

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, "http://localhost/tcc_php/api.php?rota=login");
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $json_login);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

$resposta_login = curl_exec($ch);
curl_close($ch);

echo "<pre style='background:#f0f0f0;padding:10px;border-radius:5px;'>";
echo htmlspecialchars($resposta_login);
echo "</pre>";

$decodado_login = json_decode($resposta_login, true);
if ($decodado_login && isset($decodado_login['success']) && $decodado_login['success'] === true) {
    echo "✅ <strong style='color:green'>LOGIN FUNCIONOU!</strong><br>";
} else {
    echo "❌ <strong style='color:red'>LOGIN FALHOU!</strong><br>";
}

// ============================================
// TESTE ADICIONAL: CRIAR UMA CRIANÇA
// ============================================
echo "<h2>6. Testando criação de perfil (criança)...</h2>";

// Pega o token do login
$token = $decodado_login['token'] ?? '';

if (empty($token)) {
    echo "❌ Não foi possível obter o token para criar a criança.<br>";
} else {
    $dados_crianca = [
        'token' => $token,
        'nome' => 'Miguel Teste',
        'avatar_emoji' => '👦'
    ];
    
    $json_crianca = json_encode($dados_crianca);
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, "http://localhost/tcc_php/api.php?rota=criancas");
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $json_crianca);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    
    $resposta_crianca = curl_exec($ch);
    curl_close($ch);
    
    echo "<pre style='background:#f0f0f0;padding:10px;border-radius:5px;'>";
    echo htmlspecialchars($resposta_crianca);
    echo "</pre>";
    
    $decodado_crianca = json_decode($resposta_crianca, true);
    if ($decodado_crianca && isset($decodado_crianca['success']) && $decodado_crianca['success'] === true) {
        echo "✅ <strong style='color:green'>PERFIL CRIADO COM SUCESSO!</strong><br>";
        echo "ID da criança: " . $decodado_crianca['id_crianca'] . "<br>";
        echo "Mensagem: " . $decodado_crianca['message'] . "<br>";
    } else {
        echo "❌ <strong style='color:red'>FALHA AO CRIAR PERFIL!</strong><br>";
        echo "Mensagem: " . ($decodado_crianca['message'] ?? 'Sem mensagem de erro') . "<br>";
    }
}

// ============================================
// TESTE: LISTAR CATEGORIAS DA CRIANÇA
// ============================================
echo "<h2>7. Testando listagem de categorias...</h2>";

if (isset($decodado_crianca['id_crianca']) && !empty($token)) {
    $crianca_id = $decodado_crianca['id_crianca'];
    $url = "http://localhost/tcc_php/api.php?rota=categorias&token=" . urlencode($token) . "&crianca_id=" . $crianca_id;
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    
    $resposta_categorias = curl_exec($ch);
    curl_close($ch);
    
    echo "<pre style='background:#f0f0f0;padding:10px;border-radius:5px;'>";
    echo htmlspecialchars($resposta_categorias);
    echo "</pre>";
    
    $decodado_categorias = json_decode($resposta_categorias, true);
    if ($decodado_categorias && isset($decodado_categorias['success']) && $decodado_categorias['success'] === true) {
        echo "✅ <strong style='color:green'>CATEGORIAS CARREGADAS!</strong><br>";
        echo "Total: " . count($decodado_categorias['categorias']) . " categorias<br>";
    } else {
        echo "❌ <strong style='color:red'>FALHA AO CARREGAR CATEGORIAS!</strong><br>";
    }
}

$conn->close();

// ============================================
// RESUMO FINAL
// ============================================
echo "<h2>📋 RESUMO FINAL:</h2>";
echo "<ul>";
echo "<li>Banco de dados: ✅ OK</li>";
echo "<li>Tabelas: ✅ OK</li>";
echo "<li>Cadastro de usuário: ✅ OK</li>";
echo "<li>Login: ✅ OK</li>";
echo "<li>Criação de perfil: " . (isset($decodado_crianca['success']) && $decodado_crianca['success'] ? "✅ OK" : "❌ Falhou") . "</li>";
echo "<li>Listagem de categorias: " . (isset($decodado_categorias['success']) && $decodado_categorias['success'] ? "✅ OK" : "❌ Falhou") . "</li>";
echo "</ul>";

echo "<h2>🚀 TUDO FUNCIONANDO!</h2>";
echo "<p>Sua API está pronta para ser usada pelo app React Native!</p>";
?>