<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');

$bat = 'C:\\xampp2\\htdocs\\tcc_php\\sons\\INICIAR_SISTEMA.bat';

if (!file_exists($bat)) {
    echo json_encode(['success' => false, 'message' => 'BAT não encontrado']);
    exit();
}

if (class_exists('COM')) {
    $wsh = new COM('WScript.Shell');
    $wsh->Run("cmd /c \"$bat\"", 0, false);
    echo json_encode(['success' => true, 'message' => 'Sistema iniciado!']);
} else {
    pclose(popen("start /b cmd /c \"$bat\"", 'r'));
    echo json_encode(['success' => true, 'message' => 'Sistema iniciado!']);
}
?>