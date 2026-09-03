<?php
namespace App\Repository;

use App\Models\Aviso;

class AvisoRepositoryMemoria implements AvisoRepositoryInterface {
    private array $avisos = [];
    private int $proximoId = 1;

    public function all(): array{
        return $this->avisos;
    }

    public function save(Aviso $aviso): void{
        $this->avisos[$aviso->id] = $aviso;
    }
    
    public function proximoId(): int{
        return $this->proximoId++;
    }

    public function porPessoa(int $pessoaId): array{
        return array_filter($this->avisos, fn(Aviso $a) => $a->pessoaId === $pessoaId);
    }

    public function porTipo(int $avisoTipoId): array{
        return array_filter($this->avisos, fn(Aviso $a) => $a->avisoTipoId === $avisoTipoId);
    }
}
