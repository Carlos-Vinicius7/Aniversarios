<?php

namespace App\Repository;

use App\Models\Pessoa;
use App\Database\Connection;
use PDO;

class PessoaRepositoryPDO implements PessoaRepositoryInterface
{
    private PDO $pdo;
    public function __construct()
    {
        // Pega a conexao unica criada pela classe Connection (Fase 5)
        $this->pdo = Connection::obter();
    }
    // Converte uma linha crua do banco (array associativo) num objeto Pessoa.
    // Fica num metodo separado porque all(), find() e filtrar() precisam
    // fazer exatamente essa mesma conversao.
    private function hidratar(array $linha): Pessoa
    {
        return new Pessoa(
            id: (int) $linha['id'],
            nome: $linha['nome'],
            email: $linha['email'],
            telefone: $linha['telefone'],
            // O banco devolve a data como texto (ex: "1990-09-05") — o
            // construtor de DateTimeImmutable entende esse formato direto.
            nascimento: new \DateTimeImmutable($linha['nascimento']),
            pessoaTipoId: (int) $linha['pessoa_tipo_id']
        );
    }
    public function all(): array
    {
        $stmt = $this->pdo->query('SELECT * FROM tbPessoas');
        // fetchAll() traz todas as linhas de uma vez; array_map aplica
        // hidratar() em cada uma, transformando linhas cruas em objetos Pessoa.
        return array_map([$this, 'hidratar'], $stmt->fetchAll());
    }
    public function find(int $id): ?Pessoa
    {
        // Prepared statement: o "?" e' um espaco reservado que o PDO preenche
        // com o valor de forma segura, prevenindo SQL Injection.
        $stmt = $this->pdo->prepare('SELECT * FROM tbPessoas WHERE id = ?');
        $stmt->execute([$id]);
        $linha = $stmt->fetch();
        // fetch() devolve false quando nao encontra nenhuma linha
        return $linha ? $this->hidratar($linha) : null;
    }
    public function save(Pessoa $pessoa): void
    {
        // Um unico comando cobre cadastrar E editar:
        // - Se pessoa->id for 0 (pessoa nova), vira NULL -> o AUTO_INCREMENT gera um id novo.
        // - Se pessoa->id ja existir (edicao), o INSERT esbarra na PRIMARY KEY
        // e o "ON DUPLICATE KEY UPDATE" atualiza a linha existente em vez de duplicar.
        $sql = 'INSERT INTO tbPessoas (id, nome, email, telefone, nascimento, pessoa_tipo_id)
        VALUES (:id, :nome, :email, :telefone, :nascimento, :pessoaTipoId)
        ON DUPLICATE KEY UPDATE
        nome = VALUES(nome),
        email = VALUES(email),
        telefone = VALUES(telefone),
        nascimento = VALUES(nascimento),
        pessoa_tipo_id = VALUES(pessoa_tipo_id)';
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([
            'id' => $pessoa->id ?: null,
            'nome' => $pessoa->nome,
            'email' => $pessoa->email,
            'telefone' => $pessoa->telefone,
            'nascimento' => $pessoa->nascimento->format('Y-m-d'),
            'pessoaTipoId' => $pessoa->pessoaTipoId,
        ]);
        // Se era uma pessoa nova (id era 0), agora atualizamos o objeto
        // com o id de verdade que o MySQL acabou de gerar.
        if (!$pessoa->id) {
            $pessoa->id = (int) $this->pdo->lastInsertId();
        }
    }
    public function filtrar(?string $nome, ?int $mes, ?int $pessoaTipoId): array
    {
        // Monta o SQL dinamicamente, so adicionando cada filtro
        // se ele realmente foi informado.
        $sql = 'SELECT * FROM tbPessoas WHERE 1=1';
        $params = [];
        if ($nome) {
            $sql .= ' AND nome LIKE :nome';
            $params['nome'] = "%{$nome}%";
        }
        if ($mes) {
            $sql .= ' AND MONTH(nascimento) = :mes';
            $params['mes'] = $mes;
        }
        if ($pessoaTipoId) {
            $sql .= ' AND pessoa_tipo_id = :pessoaTipoId';
            $params['pessoaTipoId'] = $pessoaTipoId;
        }
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        return array_map([$this, 'hidratar'], $stmt->fetchAll());
    }
}
