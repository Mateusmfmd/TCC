<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
$bat_path = __DIR__ . DIRECTORY_SEPARATOR . 'INICIAR_SISTEMA.bat';
function isPythonRunning() {
    $output = shell_exec('tasklist /FI "IMAGENAME eq python.exe" /FO CSV 2>&1');
    return $output && strpos($output, 'python.exe') !== false;
}
if (!isPythonRunning()) {
    if (file_exists($bat_path) && class_exists('COM')) {
        $wsh = new COM('WScript.Shell');
        $wsh->Run('cmd /c "' . $bat_path . '"', 0, false);
        echo json_encode(['success' => true, 'status' => 'restarted']);
    } elseif (file_exists($bat_path)) {
        pclose(popen('start /b cmd /c "' . $bat_path . '"', 'r'));
        echo json_encode(['success' => true, 'status' => 'restarted_without_com']);
    } else {
        echo json_encode(['success' => false, 'message' => 'BAT não encontrado em ' . $bat_path]);
    }
} else {
    echo json_encode(['success' => true, 'status' => 'running']);
}
?>
