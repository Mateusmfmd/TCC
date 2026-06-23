<?php
require_once 'config.php';
$data = json_decode(file_get_contents("php://input"), true);
if (isset($data['nome']) && isset($data['email']) && isset($data['senha'])) {
    $nome = $conn->real_escape_string($data['nome']);
    $email = $conn->real_escape_string($data['email']);
    $senha = $conn->real_escape_string($data['senha']);
    $sql = "INSERT INTO usuarios (nome, email, senha) VALUES ('$nome', '$email', '$senha')";
    if ($conn->query($sql) === TRUE) {
        echo json_encode(['success' => true, 'message' => 'Usuário cadastrado']);
    } else { echo json_encode(['success' => false, 'message' => 'Erro ao cadastrar: ' . $conn->error]); }
}
$conn->close();
?>
