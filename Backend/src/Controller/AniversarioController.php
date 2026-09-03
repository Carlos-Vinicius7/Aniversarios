<?php
// src/Controllers/AniversarioController.php
namespace App\Controllers;

use App\Services\AniversarioService;

class AniversarioController
{
    public function __construct(private AniversarioService $service) {}
    
    public function proximos(): array
    {
        return array_values($this->service->proximosAniversarios());
    }
}
