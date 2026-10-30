<?php
require_once __DIR__ . '/../autoload.php'; // if autoload needed, but not necessary for PDO
$config = require __DIR__ . '/Config/database.local.php';
$dsn = "mysql:host={$config['host']};port={$config['port']};dbname={$config['banco']};charset=utf8mb4";
try {
    $pdo = new PDO($dsn, $config['usuario'], $config['senha'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
    $stmt = $pdo->query('SELECT NOW() AS now');
    $row = $stmt->fetch();
    echo "OK: " . $row['now'] . PHP_EOL;
} catch (Throwable $e) {
    echo "ERROR: " . $e->getMessage() . PHP_EOL;
}
?>
