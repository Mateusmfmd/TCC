<?php
session_start();
$DIR = __DIR__ . DIRECTORY_SEPARATOR . 'sons';
$BAT = __DIR__ . DIRECTORY_SEPARATOR . 'INICIAR_SISTEMA.bat';
$PY = __DIR__ . DIRECTORY_SEPARATOR . 'sistema_motion_full.py';
$testes = [
    'php_versao' => phpversion(),
    'com_ativo' => class_exists('COM'),
    'py_existe' => file_exists($PY),
    'bat_existe' => file_exists($BAT),
];
$msg = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['action'] ?? '') === 'disparar_bat') {
    if (!$testes['bat_existe']) {
        $msg = 'BAT não encontrado na pasta sons.';
    } elseif (class_exists('COM')) {
        $wsh = new COM('WScript.Shell');
        $wsh->Run('cmd /c "' . $BAT . '"', 0, false);
        $msg = 'Sistema iniciado!';
    } else {
        $msg = 'Extensão COM inativa. Habilite php_com_dotnet.dll no php.ini.';
    }
}
?>
<!DOCTYPE html>
<html lang="pt-br">
<head>
<meta charset="UTF-8"><title>Diagnóstico MOTION</title>
<style>body{font-family:sans-serif;background:#f4f4f9;padding:20px}.card{background:white;padding:20px;border-radius:8px;box-shadow:0 2px 5px rgba(0,0,0,.1)}.status{padding:5px 10px;border-radius:4px;font-weight:bold}.ok{background:#d4edda;color:#155724}.erro{background:#f8d7da;color:#721c24}button{padding:10px 20px;cursor:pointer}</style>
</head>
<body><div class="card"><h1>Painel de Diagnóstico</h1>
<p>PHP Versão: <?= htmlspecialchars($testes['php_versao']) ?></p>
<p>Extensão COM: <span class="status <?= $testes['com_ativo'] ? 'ok' : 'erro' ?>"><?= $testes['com_ativo'] ? 'Ativa' : 'Inativa' ?></span></p>
<p>Script Python: <span class="status <?= $testes['py_existe'] ? 'ok' : 'erro' ?>"><?= $testes['py_existe'] ? 'Encontrado' : 'Não encontrado' ?></span></p>
<p>BAT: <span class="status <?= $testes['bat_existe'] ? 'ok' : 'erro' ?>"><?= $testes['bat_existe'] ? 'Encontrado' : 'Não encontrado' ?></span></p>
<?php if ($msg): ?><p><b><?= htmlspecialchars($msg) ?></b></p><?php endif; ?>
<form method="POST"><input type="hidden" name="action" value="disparar_bat"><button type="submit">Disparar Sistema (.BAT)</button></form>
</div></body></html>
