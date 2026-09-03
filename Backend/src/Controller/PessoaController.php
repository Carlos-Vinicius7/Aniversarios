<?php
namespace App\Controllers;

use App\Services\PessoaService;

class PessoaController
{
    public function __construct(private PessoaService $service) {}
    public function cadastrar(array $dadosPost): array
    {
        $pessoa = $this->service->cadastrar($dadosPost);
        return ['status' => 'criado', 'pessoa' => $pessoa];
    }
    public function editar(array $query): array
    {
        $this->service->editarAniversario((int)$query['id'], $query['data']);
        return ['status' => 'atualizado'];
    }
    public function buscar(array $query): array
    {
        $mes = isset($query['mes']) ? (int)$query['mes'] : null;
        return array_values($this->service->buscarFiltrar($query['nome'] ?? null, $mes));
    }
}
