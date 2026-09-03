<?php
namespace App\Models;

class Aviso {
    public function __construct(
        public int $id,
        public string $aviso,
        public int $pessoaId,
        public int $avisoTipoId,
        public string $observacao,
        public \DateTimeImmutable $atualizadoEm
    ) {}
}