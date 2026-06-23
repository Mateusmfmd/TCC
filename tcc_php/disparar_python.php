<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');

$arquivo_sinal = 'C:\\xammp2\\htdocs\\tcc_php\\sons\\start_signal.txt';
$audio = isset($_GET['audio']) ? $_GET['audio'] : 'som1.mp3';

if (file_put_contents($arquivo_sinal, $audio) !== false) {
    echo json_encode(['success' => true, 'message' => 'Sinal enviado: ' . $audio]);
} else {
    echo json_encode(['success' => false, 'message' => 'Erro ao criar sinal']);
}
?>