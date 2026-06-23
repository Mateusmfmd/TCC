<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);

    // Buscar falas por categoria
    if (isset($data['id_categoria'])) {
        $id_categoria = $conn->real_escape_string($data['id_categoria']);
        $sql = "SELECT id_fala, texto, emoji FROM falas WHERE id_categoria = '$id_categoria' ORDER BY ordem, id_fala";
        $result = $conn->query($sql);

        $falas = [];
        if ($result && $result->num_rows > 0) {
            while($row = $result->fetch_assoc()) {
                $falas[] = $row;
            }
        }
        echo json_encode(['success' => true, 'falas' => $falas]);

    // Registrar no histórico (Frase Completa ou Individual)
    } elseif (isset($data['id_usuario']) && isset($data['texto'])) {
        $id_usuario = $conn->real_escape_string($data['id_usuario']);
        $texto = $conn->real_escape_string($data['texto']);
        $emoji = $conn->real_escape_string($data['emoji'] ?? '💬');
        $tipo = $conn->real_escape_string($data['tipo'] ?? 'frase');
        $id_fala = isset($data['id_fala']) ? "'".$conn->real_escape_string($data['id_fala'])."'" : "NULL";
        
        $sql = "INSERT INTO historico_comunicacao (usuario_id, id_fala, texto, emoji, tipo) 
                VALUES ('$id_usuario', $id_fala, '$texto', '$emoji', '$tipo')";

        if ($conn->query($sql) === TRUE) {
            echo json_encode(['success' => true, 'message' => 'Registro salvo no histórico']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Erro ao salvar: ' . $conn->error]);
        }
    } else {
        echo json_encode(['success' => false, 'message' => 'Parâmetros inválidos']);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Método não permitido']);
}

$conn->close();
?>
