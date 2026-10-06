<?php
header('Content-Type: application/json; charset=utf-8');
echo json_encode([
    'success' => true,
    'status' => 'online',
    'php' => PHP_VERSION,
    'message' => 'Apache e PHP estão respondendo. Para testar o banco, use uma rota da API.'
], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
