<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        if (isset($_GET['usuario_id'])) {
            $usuario_id = $conn->real_escape_string($_GET['usuario_id']);
            $sql = "SELECT id_lembrete, texto, feito FROM lembretes WHERE usuario_id = '$usuario_id' ORDER BY id_lembrete DESC";
            $result = $conn->query($sql);
            $lembretes = [];
            while($row = $result->fetch_assoc()) {
                $row['feito'] = (bool)$row['feito'];
                $lembretes[] = $row;
            }
            echo json_encode(['success' => true, 'lembretes' => $lembretes]);
        }
        break;

    case 'POST':
        $data = json_decode(file_get_contents("php://input"), true);
        if (isset($data['usuario_id']) && isset($data['texto'])) {
            $usuario_id = $conn->real_escape_string($data['usuario_id']);
            $texto = $conn->real_escape_string($data['texto']);
            $sql = "INSERT INTO lembretes (usuario_id, texto) VALUES ('$usuario_id', '$texto')";
            if ($conn->query($sql)) {
                echo json_encode(['success' => true, 'message' => 'Lembrete adicionado']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Erro ao adicionar']);
            }
        }
        break;

    case 'PUT':
        $data = json_decode(file_get_contents("php://input"), true);
        if (isset($data['id_lembrete'])) {
            $id_lembrete = $conn->real_escape_string($data['id_lembrete']);
            $feito = $conn->real_escape_string($data['feito'] ? 1 : 0);
            $sql = "UPDATE lembretes SET feito = '$feito' WHERE id_lembrete = '$id_lembrete'";
            if ($conn->query($sql)) {
                echo json_encode(['success' => true]);
            }
        }
        break;

    case 'DELETE':
        $data = json_decode(file_get_contents("php://input"), true);
        if (isset($data['id_lembrete'])) {
            $id_lembrete = $conn->real_escape_string($data['id_lembrete']);
            $sql = "DELETE FROM lembretes WHERE id_lembrete = '$id_lembrete'";
            $conn->query($sql);
            echo json_encode(['success' => true]);
        }
        break;
}
$conn->close();
?>
