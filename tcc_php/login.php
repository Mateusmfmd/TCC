<?php
require_once 'config.php';
$data = json_decode(file_get_contents("php://input"), true);
if (isset($data['email']) && isset($data['senha'])) {
    $email = $conn->real_escape_string($data['email']);
    $senha = $data['senha'];
    $sql = "SELECT id_usuario, nome, email, senha FROM usuarios WHERE email = '$email'";
    $result = $conn->query($sql);
    if ($result->num_rows > 0) {
        $user = $result->fetch_assoc();
        if ($senha == $user['senha']) { // Em produção, use password_verify
            unset($user['senha']);
            echo json_encode(['success' => true, 'usuario' => $user]);
        } else { echo json_encode(['success' => false, 'message' => 'Senha incorreta']); }
    } else { echo json_encode(['success' => false, 'message' => 'Usuário não encontrado']); }
}
$conn->close();
?>
