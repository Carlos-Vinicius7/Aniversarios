<?php
require_once __DIR__ . '/../autoload.php';

use App\ApiException;
use App\Controller\ApiController;

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

$https = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off';
session_name('agenda_aniversarios');
session_set_cookie_params([
    'lifetime' => 0,
    'path' => '/',
    'secure' => $https,
    'httponly' => true,
    'samesite' => 'Lax',
]);
session_start();

try {
    $rawBody = file_get_contents('php://input');
    $body = $rawBody === '' ? [] : json_decode($rawBody, true, 512, JSON_THROW_ON_ERROR);
    if (!is_array($body)) {
        throw new ApiException('O corpo da requisição deve ser um objeto JSON.', 400);
    }

    $controller = new ApiController();
    $result = $controller->dispatch(
        (string) ($_GET['rota'] ?? ''),
        strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET')),
        $body
    );
    echo json_encode($result, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
} catch (JsonException $error) {
    http_response_code(400);
    echo json_encode(['erro' => 'JSON inválido.'], JSON_UNESCAPED_UNICODE);
} catch (ApiException $error) {
    http_response_code($error->statusCode);
    echo json_encode(['erro' => $error->getMessage()], JSON_UNESCAPED_UNICODE);
} catch (Throwable $error) {
    error_log((string) $error);
    http_response_code(500);
    echo json_encode(['erro' => 'Erro interno ao acessar o banco de dados.'], JSON_UNESCAPED_UNICODE);
}
