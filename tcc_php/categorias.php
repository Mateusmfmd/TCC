<?php
require_once 'config.php';
$sql = "SELECT id_categoria, nome_categoria, emoji FROM categorias ORDER BY ordem";
$result = $conn->query($sql);
$categorias = [];
while($row = $result->fetch_assoc()) { $categorias[] = $row; }
echo json_encode(['success' => true, 'categorias' => $categorias]);
$conn->close();
?>
