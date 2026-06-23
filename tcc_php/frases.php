<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        if (isset($_GET['usuario_id'])) {
            $usuario_id = $conn->real_escape_string($_GET['usuario_id']);
            $sql = "SELECT id_frase, texto FROM frases_atalho WHERE usuario_id = '$usuario_id' ORDER BY id_frase DESC";
            $result = $conn->query($sql);
            $frases = [];
            while($row = $result->fetch_assoc()) { $frases[] = $row; }
            echo json_encode(['success' => true, 'frases' => $frases]);
        }
        break;

    case 'POST':
        $data = json_decode(file_get_contents("php://input"), true);
        if (isset($data['usuario_id']) && isset($data['texto'])) {
            $usuario_id = $conn->real_escape_string($data['usuario_id']);
            $texto = $conn->real_escape_string($data['texto']);
            $sql = "INSERT INTO frases_atalho (usuario_id, texto) VALUES ('$usuario_id', '$texto')";
            if ($conn->query($sql)) {
                echo json_encode(['success' => true, 'message' => 'Frase adicionada']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Erro ao adicionar']);
            }
        }
        break;

    case 'DELETE':
        $data = json_decode(file_get_contents("php://input"), true);
        if (isset($data['id_frase'])) {
            $id_frase = $conn->real_escape_string($data['id_frase']);
            $sql = "DELETE FROM frases_atalho WHERE id_frase = '$id_frase'";
            $conn->query($sql);
            echo json_encode(['success' => true]);
        }
        break;
}
$conn->close();
?>
