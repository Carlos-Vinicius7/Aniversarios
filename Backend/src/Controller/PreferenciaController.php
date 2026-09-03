<?php
namespace App\Controller;

use App\Service\PreferenciaService;

class PreferenciaController
{
    public function __construct(private PreferenciaService $service) {}
    public function definir(array $query): array
    {
        $pref = $this->service->definir((int)$query['pessoaId'], true, $query['canal']);
        return ['status' => 'salvo', 'preferencia' => $pref];
    }
}
