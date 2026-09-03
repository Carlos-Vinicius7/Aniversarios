<?php
namespace App\Repository;

use App\Models\Pessoa;

class PessoaRepositoryMemoria implements PessoaRepositoryInterface {
    private array $pessoas = [];

    public function all(): array {
        return $this->pessoas;
    }

    public function find(int $id): ?Pessoa {
        return $this->pessoas[$id] ?? null;
    }

    public function save(Pessoa $pessoa): void {
        $this->pessoas[$pessoa->id] = $pessoa;
    }

    public function filtrar(?string $nome, ?int $mes, ?int $pessoaTipoId): array {
        return array_filter($this->pessoas, function (Pessoa $p) use ($nome, $mes, $pessoaTipoId) {
            $okNome = !$nome || stripos($p->nome, $nome) !== false;
            $okMes = !$mes || $p->nascimento->format('m') == $mes;
            $okTipo = !$pessoaTipoId || $p->pessoaTipoId == $pessoaTipoId;
            return $okNome && $okMes && $okTipo;
        });
    }
}