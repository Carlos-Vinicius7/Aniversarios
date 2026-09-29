<?php
namespace App\Repository;

use App\Models\Aviso;
use App\Database\Connection;
use PDO;

class AvisoRepositoryPDO implements AvisoRepositoryInterface
{
    private PDO $pdo;
    public function __construct()
    {
        $this->pdo = Connection::obter();
    }
    private function hidratar(array $linha): Aviso
    {
        return new Aviso(
            id: (int) $linha['id'],
            aviso: $linha['aviso'],
            pessoaId: (int) $linha['pessoa_id'],
            avisoTipoId: (int) $linha['aviso_tipo_id'],
            observacao: $linha['observacao'] ?? '',
            atualizadoEm: new \DateTimeImmutable($linha['atualizado_em'])
        );
    }
    public function all(): array
    {
        $stmt = $this->pdo->query('SELECT * FROM tbAvisos ORDER BY atualizado_em DESC');
        return array_map([$this, 'hidratar'], $stmt->fetchAll());
    }
    public function save(Aviso $aviso): void
    {
        // Diferente de Pessoa, um Aviso nunca e' editado depois de criado
        // (o AvisoService sempre chama criar() -> save() para um aviso novo),
        // entao aqui e' sempre um INSERT simples, sem ON DUPLICATE KEY.
        $sql = 'INSERT INTO tbAvisos (aviso, pessoa_id, aviso_tipo_id, observacao, atualizado_em)
 VALUES (:aviso, :pessoaId, :avisoTipoId, :observacao, :atualizadoEm)';
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([
            'aviso' => $aviso->aviso,
            'pessoaId' => $aviso->pessoaId,
            'avisoTipoId' => $aviso->avisoTipoId,
            'observacao' => $aviso->observacao,
            'atualizadoEm' => $aviso->atualizadoEm->format('Y-m-d H:i:s'),
        ]);
        // O AUTO_INCREMENT do MySQL gerou o id de verdade — atualizamos
        // o objeto Aviso que o Service ja tinha montado, com esse id real.
        $aviso->id = (int) $this->pdo->lastInsertId();
    }
    // Na versao em memoria, proximoId() gerava o proximo numero manualmente.
    // Aqui isso vira so um "placeholder": quem realmente decide o id e' o
    // AUTO_INCREMENT do MySQL, dentro de save(). O valor devolvido aqui
    // e' descartado assim que save() roda.
    public function proximoId(): int
    {
        return 0;
    }
    public function porPessoa(int $pessoaId): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT * FROM tbAvisos WHERE pessoa_id = ? ORDER BY atualizado_em DESC'
        );
        $stmt->execute([$pessoaId]);
        return array_map([$this, 'hidratar'], $stmt->fetchAll());
    }
    public function porTipo(int $avisoTipoId): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT * FROM tbAvisos WHERE aviso_tipo_id = ? ORDER BY atualizado_em DESC'
        );
        $stmt->execute([$avisoTipoId]);
        return array_map([$this, 'hidratar'], $stmt->fetchAll());
    }
}
