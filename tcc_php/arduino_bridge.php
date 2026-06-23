<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');

$json = file_get_contents('php://input');
$data = json_decode($json, true);
$comando = isset($data['comando']) ? $data['comando'] : 'som1.mp3';

$arquivo_sinal = 'C:\\xammp2\\htdocs\\tcc_php\\sons\\start_signal.txt';

if (file_put_contents($arquivo_sinal, $comando) !== false) {
    echo json_encode(['success' => true, 'message' => 'Sinal registrado']);
} else {
    echo json_encode(['success' => false, 'message' => 'Erro ao acessar pasta de sons']);
}
?>