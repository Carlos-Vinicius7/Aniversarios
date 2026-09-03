<?php
namespace App\Repository;

use App\Models\Aviso;

interface AvisoRepositoryInterface {
    public function all(): array;
    public function save(Aviso $aviso): void;
    public function porPessoa(int $pessoaid): array;
    public function porTipo(int $avisoTipoId): array;
}