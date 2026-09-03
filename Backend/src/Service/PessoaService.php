<?php
namespace App\Services;

use App\Models\Pessoa;
use App\Repository\PessoaRepositoryInterface;

class PessoaService {
    public function __construct(private PessoaRepositoryInterface $pessoaRepository) {}

    public function cadastrar(array $dados): Pessoa {
        $pessoa = new Pessoa(
            id: 0,
            nome: $dados['nome'],
            email: $dados['email'],
            telefone: $dados['telefone'],
            nascimento: new \DateTimeImmutable($dados['nascimento']),
            pessoaTipoId: $dados['pessoaTipoId']
        );

        $this->pessoaRepository->save($pessoa);

        return $pessoa;
    }

    public function editarAniversario(int $id, string $datanova): void {
        $pessoa = $this->pessoaRepository->find($id);
        if (!$pessoa) {
            throw new \Exception("Pessoa não encontrada");
        }

        $pessoa->nascimento = new \DateTimeImmutable($datanova);
        $this->pessoaRepository->save($pessoa);
    }

    public function buscarFiltrar(?string $nome = null, ?int $mes = null, ?int $pessoaTipoId = null): array {
        return $this->pessoaRepository->filtrar($nome, $mes, $pessoaTipoId);
    }
}