<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');

$data = json_decode(file_get_contents('php://input'), true);
$audio = isset($data['audio']) ? $data['audio'] : 'som1.mp3';

$arquivo_sinal = 'C:\\xammp2\\htdocs\\tcc_php\\sons\\start_signal.txt';

if (file_put_contents($arquivo_sinal, $audio) !== false) {
    echo json_encode(['success' => true, 'message' => 'Reprodução solicitada: ' . $audio]);
} else {
    echo json_encode(['success' => false, 'message' => 'Erro ao acessar pasta de sons']);
}
?>