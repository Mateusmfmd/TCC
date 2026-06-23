<?php
include 'config.php'; // Usa sua conexão bd_comunicacao

$id_botao = $_POST['id_botao'];
$nome_audio = $_POST['nome_audio'];

if($id_botao && $nome_audio) {
    $sql = "UPDATE configuracao_botoes SET nome_audio = '$nome_audio' WHERE id_botao = $id_botao";
    if($conn->query($sql)) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'error' => $conn->error]);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Dados incompletos']);
}
?>
