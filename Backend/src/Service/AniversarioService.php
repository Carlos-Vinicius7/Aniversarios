<?php
namespace App\Services;

use App\Models\Pessoa;
use App\Repository\PessoaRepositoryInterface;

class AniversarioService
{
    public function __construct(private PessoaRepositoryInterface $repo) {}
    public function proximosAniversarios(int $dias = 7): array
    {
        $hoje = new \DateTimeImmutable();
        return array_filter($this->repo->all(), function (Pessoa $p) use ($hoje, $dias) {
            $proximo = $p->nascimento->setDate(
                (int)$hoje->format('Y'),
                (int)$p->nascimento->format('m'),
                (int)$p->nascimento->format('d')
            );
            return $hoje->diff($proximo)->days <= $dias;
        });
    }
}