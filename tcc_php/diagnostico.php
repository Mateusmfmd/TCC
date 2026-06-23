<?php
session_start();
$DIR   = 'C:\\xampp2\\htdocs\\tcc_php\\sons';
$BAT   = $DIR . '\\INICIAR_SISTEMA.bat';
$PY    = $DIR . '\\sistema_motion_full.py';
$LOG   = $DIR . '\\log_bat.txt';
$SINAL = $DIR . '\\start_signal.txt';

$testes = [];
$testes['php_versao'] = phpversion();
$testes['com_ativo'] = class_exists('COM');
$testes['py_existe'] = file_exists($PY);
$testes['bat_existe'] = file_exists($BAT);

$msg = '';
if ($_SERVER['REQUEST_METHOD'] == 'POST' && isset($_POST['action'])) {
    if ($_POST['action'] == 'disparar_bat') {
        if (class_exists('COM')) {
            $wsh = new COM('WScript.Shell');
            $wsh->Run("cmd /c \"$BAT\"", 0, false);
            $msg = "Sistema iniciado!";
        } else {
            $msg = "Extensão COM inativa!";
        }
    }
}
?>
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <title>Diagnóstico MOTION</title>
    <style>
        body { font-family: sans-serif; background: #f4f4f9; padding: 20px; }
        .card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
        .status { padding: 5px 10px; border-radius: 4px; font-weight: bold; }
        .ok { background: #d4edda; color: #155724; }
        .erro { background: #f8d7da; color: #721c24; }
    </style>
</head>
<body>
    <div class="card">
        <h1>Painel de Diagnóstico</h1>
        <p>PHP Versão: <?= $testes['php_versao'] ?></p>
        <p>Extensão COM: <span class="status <?= $testes['com_ativo'] ? 'ok' : 'erro' ?>"><?= $testes['com_ativo'] ? 'Ativa' : 'Inativa' ?></span></p>
        <p>Script Python: <span class="status <?= $testes['py_existe'] ? 'ok' : 'erro' ?>"><?= $testes['py_existe'] ? 'Encontrado' : 'Não encontrado' ?></span></p>
        <p>BAT: <span class="status <?= $testes['bat_existe'] ? 'ok' : 'erro' ?>"><?= $testes['bat_existe'] ? 'Encontrado' : 'Não encontrado' ?></span></p>
        <?php if ($msg) echo "<p><b>$msg</b></p>"; ?>
        <form method="POST">
            <input type="hidden" name="action" value="disparar_bat">
            <button type="submit" style="padding: 10px 20px; cursor: pointer;">Disparar Sistema (.BAT)</button>
        </form>
    </div>
</body>
</html>