<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') { exit(0); }

$host = 'localhost';
$user = 'root';
$password = '';
$database = 'bd_comunicacao';

$conn = new mysqli($host, $user, $password, $database);
if ($conn->connect_error) {
    die(json_encode(['success' => false, 'message' => 'Erro de conexão: ' . $conn->connect_error]));
}
$conn->set_charset("utf8mb4");
?>