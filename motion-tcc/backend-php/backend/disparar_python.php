<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
$arquivo_sinal = __DIR__ . DIRECTORY_SEPARATOR . 'sons' . DIRECTORY_SEPARATOR . 'start_signal.txt';
$audio = isset($_GET['audio']) ? $_GET['audio'] : 'andar.mp3';
if (file_put_contents($arquivo_sinal, $audio) !== false) {
    echo json_encode(['success' => true, 'message' => 'Sinal enviado: ' . $audio]);
} else {
    echo json_encode(['success' => false, 'message' => 'Erro ao criar sinal']);
}
?>
