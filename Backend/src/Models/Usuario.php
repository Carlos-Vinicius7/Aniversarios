<?php
namespace App\Models;

class Usuario {
    public function __construct(
        public int $id,
        public string $nome,
        public string $email,
        public string $senha
    ) {}
}