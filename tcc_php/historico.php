<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        if (isset($_GET['usuario_id'])) {
            $usuario_id = $conn->real_escape_string($_GET['usuario_id']);
            
            // Query para buscar o histórico ordenado pelo mais recente
            $sql = "SELECT id_historico, texto, emoji, tipo, data_uso 
                    FROM historico_comunicacao 
                    WHERE usuario_id = '$usuario_id' 
                    ORDER BY data_uso DESC LIMIT 50";
            
            $result = $conn->query($sql);
            $historico = [];
            
            if ($result && $result->num_rows > 0) {
                while($row = $result->fetch_assoc()) {
                    $historico[] = [
                        'id_historico' => $row['id_historico'],
                        'data_uso' => date('d/m H:i', strtotime($row['data_uso'])),
                        'texto' => $row['texto'],
                        'emoji' => $row['emoji'] ?? '💬',
                        'tipo' => $row['tipo']
                    ];
                }
            }
            echo json_encode(['success' => true, 'historico' => $historico]);
        } else {
            echo json_encode(['success' => false, 'message' => 'usuario_id é obrigatório']);
        }
        break;

    case 'DELETE':
        $data = json_decode(file_get_contents("php://input"), true);
        if (isset($data['usuario_id'])) {
            $usuario_id = $conn->real_escape_string($data['usuario_id']);
            $sql = "DELETE FROM historico_comunicacao WHERE usuario_id = '$usuario_id'";
            if ($conn->query($sql) === TRUE) {
                echo json_encode(['success' => true, 'message' => 'Histórico limpo']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Erro ao limpar']);
            }
        }
        break;

    default:
        echo json_encode(['success' => false, 'message' => 'Método não permitido']);
        break;
}
$conn->close();
?>
