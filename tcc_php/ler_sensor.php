<?php
// ler_sensor.php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');

/**
 * IMPORTANTE:
 * A leitura direta da serial via PHP/Python a cada clique no app é lenta.
 * O ideal é o Python rodar em loop e o PHP ler um arquivo de log ou banco de dados.
 * Mas aqui está a forma direta para teste:
 */

$python_path = 'python3';
$script_path = __DIR__ . '/../ler_arduino.py';

$command = "$python_path " . escapeshellarg($script_path) . " 2>&1";

$output = [];
$return_var = 0;
exec($command, $output, $return_var);

if ($return_var === 0) {
    echo json_encode([
        'success' => true, 
        'sensor' => trim(implode("", $output)) // Retorna "verde", "azul", etc.
    ]);
} else {
    echo json_encode([
        'success' => false, 
        'message' => 'Falha ao ler sensor',
        'error' => implode("\n", $output)
    ]);
}
?>
