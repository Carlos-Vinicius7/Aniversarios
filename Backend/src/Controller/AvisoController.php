<?php
// src/Controllers/AvisoController.php
namespace App\Controllers;

use App\Services\AvisoService;

class AvisoController
{
    public function __construct(private AvisoService $service) {}
    public function alerta(array $query): array
    {
        $aviso = $this->service->configurarAlerta((int)$query['pessoaId'], 3, 'RH');
        return ['status' => 'criado', 'aviso' => $aviso];
    }
    public function notificar(array $query): array
    {
        $avisos = $this->service->notificarResponsaveis((int)$query['pessoaId'], ['RH', 'Gestor']);
        return ['status' => 'criado', 'avisos' => $avisos];
    }
    public function mensagem(array $query): array
    {
        $aviso = $this->service->enviarMensagem((int)$query['pessoaId'], 'Feliz aniversario!');
        return ['status' => 'criado', 'aviso' => $aviso];
    }
    public function acao(array $query): array
    {
        $aviso = $this->service->planejarAcao((int)$query['pessoaId'], 'Enviar cartao');
        return ['status' => 'criado', 'aviso' => $aviso];
    }
    public function historico(array $query): array
    {
        $pessoaId = isset($query['pessoaId']) ? (int)$query['pessoaId'] : null;
        return array_values($this->service->historico($pessoaId));
    }
}
