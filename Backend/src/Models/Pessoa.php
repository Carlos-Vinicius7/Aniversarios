<?php
namespace App\Models;

class Pessoa {
    public function __construct(
        public int $id,
        public string $nome,
        public string $email,
        public string $telefone,
        public \DateTimeImmutable $nascimento,
        public int $pessoaTipoId
    ) {}
}