<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');

$bat_path = 'C:\\xammp2\\htdocs\\tcc_php\\sons\\INICIAR_SISTEMA.bat';

function isPythonRunning() {
    $output = shell_exec('tasklist /FI "IMAGENAME eq python.exe" /FO CSV 2>&1');
    return $output && strpos($output, 'python.exe') !== false;
}

if (!isPythonRunning()) {
    if (file_exists($bat_path) && class_exists('COM')) {
        $wsh = new COM('WScript.Shell');
        $wsh->Run("cmd /c \"$bat_path\"", 0, false);
        echo json_encode(['success' => true, 'status' => 'restarted']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Falha ao iniciar']);
    }
} else {
    echo json_encode(['success' => true, 'status' => 'running']);
}
?>