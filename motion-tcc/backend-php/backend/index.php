<?php
header('Content-Type: application/json; charset=utf-8');
echo json_encode([
    'success' => true,
    'app' => 'M.O.T.I.O.N API',
    'status' => 'online',
    'api' => 'Use /api.php?rota=login ou outra rota disponível.'
], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
