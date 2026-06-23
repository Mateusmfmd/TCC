<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        if (isset($_GET['usuario_id']) && isset($_GET['dia_semana'])) {
            $usuario_id = $conn->real_escape_string($_GET['usuario_id']);
            $dia_semana = $conn->real_escape_string($_GET['dia_semana']);
            $sql = "SELECT id_rotina, atividade, horario FROM rotinas WHERE usuario_id = '$usuario_id' AND dia_semana = '$dia_semana' ORDER BY horario";
            $result = $conn->query($sql);

            $rotinas = [];
            if ($result && $result->num_rows > 0) {
                while($row = $result->fetch_assoc()) {
                    $rotinas[] = $row;
                }
            }
            echo json_encode(['success' => true, 'rotinas' => $rotinas]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Parâmetros ausentes']);
        }
        break;

    case 'POST':
        $data = json_decode(file_get_contents("php://input"), true);
        $usuario_id = $conn->real_escape_string($data['usuario_id']);
        $dia_semana = $conn->real_escape_string($data['dia_semana']);
        $atividade = $conn->real_escape_string($data['atividade']);
        $horario = $conn->real_escape_string($data['horario']);

        $sql = "INSERT INTO rotinas (usuario_id, dia_semana, atividade, horario) VALUES ('$usuario_id', '$dia_semana', '$atividade', '$horario')";
        if ($conn->query($sql) === TRUE) {
            echo json_encode(['success' => true, 'message' => 'Rotina adicionada']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Erro: ' . $conn->error]);
        }
        break;

    case 'DELETE':
        $data = json_decode(file_get_contents("php://input"), true);
        $id_rotina = $conn->real_escape_string($data['id_rotina']);
        $sql = "DELETE FROM rotinas WHERE id_rotina = '$id_rotina'";
        if ($conn->query($sql) === TRUE) {
            echo json_encode(['success' => true, 'message' => 'Deletado']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Erro']);
        }
        break;
}
$conn->close();
?>
