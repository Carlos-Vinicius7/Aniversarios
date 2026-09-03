<?php
namespace App\Models;

class PreferenciaCelebracao {
    public function __construct(
        public int $pessoaId,
        public bool $consentimento,
        public string $canalPreferido,
        public int $diasAntecedencia = 3
    ) {}
}