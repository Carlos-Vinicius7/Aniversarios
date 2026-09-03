<?php

namespace App\Services;

use App\Models\PreferenciaCelebracao;

class PreferenciaService
{
    private array $preferencias = [];

    public function definir(int $pessoaId, bool $consentimento, string $canal, int $dias = 3): PreferenciaCelebracao{
        $pref = new PreferenciaCelebracao($pessoaId, $consentimento, $canal, $dias);
        $this->preferencias[$pessoaId] = $pref;
        return $pref;
    }

    public function obter(int $pessoaId): ?PreferenciaCelebracao{
        return $this->preferencias[$pessoaId] ?? null;
    }
}