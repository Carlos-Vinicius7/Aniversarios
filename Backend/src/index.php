<?php
require_once __DIR__ . '/../autoload.php';

use App\Repository\PessoaRepositoryMemoria;
use App\Repository\AvisoRepositoryMemoria;
use App\Services\PessoaService;
use App\Services\PreferenciaService;
use App\Services\AniversarioService;
use App\Services\AvisoService;
use App\Controllers\PessoaController;
use App\Controllers\PreferenciaController;
use App\Controllers\AniversarioController;
use App\Controllers\AvisoController;

$pessoaRepo = new PessoaRepositoryMemoria();
$avisoRepo = new AvisoRepositoryMemoria();
$pessoaController = new PessoaController(new PessoaService($pessoaRepo));
$preferenciaController = new PreferenciaController(new PreferenciaService());
$aniversarioController = new AniversarioController(new AniversarioService($pessoaRepo));
$avisoController = new AvisoController(new AvisoService($avisoRepo));
$rota = $_GET['rota'] ?? '';
$resultado = match ($rota) {
    'pessoas.cadastrar' => $pessoaController->cadastrar($_POST),
    'pessoas.editar' => $pessoaController->editar($_GET),
    'pessoas.buscar' => $pessoaController->buscar($_GET),
    'preferencias.definir' => $preferenciaController->definir($_GET),
    'aniversarios.proximos' => $aniversarioController->proximos(),
    'avisos.alerta' => $avisoController->alerta($_GET),
    'avisos.notificar' => $avisoController->notificar($_GET),
    'avisos.mensagem' => $avisoController->mensagem($_GET),
    'avisos.acao' => $avisoController->acao($_GET),
    'avisos.historico' => $avisoController->historico($_GET),
    default => ['erro' => 'Rota nao encontrada'],
};
header('Content-Type: application/json');
echo json_encode($resultado, JSON_PRETTY_PRINT);
