<?php
namespace App\Repository;

use App\Models\Pessoa;

interface PessoaRepositoryInterface {
    public function all(): array;
    public function find(int $id): ?Pessoa;
    public function save(Pessoa $pessoa): void;
    public function filtrar(?string $nome, ?int $mes, ?int $pessoaTipoId): array;
}