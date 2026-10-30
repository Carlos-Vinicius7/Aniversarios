<?php
namespace App\Controller;

use App\ApiException;
use App\Database\Connection;
use PDO;
use PDOException;

class ApiController
{
    public function __construct(private ?PDO $pdo = null) {}

    public function dispatch(string $route, string $method, array $data = []): array
    {
        return match ("{$method} {$route}") {
            'GET auth.sessao' => $this->sessao(),
            'POST auth.registrar' => $this->registrar($data),
            'POST auth.entrar' => $this->entrar($data),
            'POST auth.sair' => $this->sair(),
            'GET app.dados' => $this->dadosDaAplicacao(),
            'PUT conta.perfil' => $this->atualizarPerfil($data),
            'PUT conta.preferencias' => $this->atualizarPreferencias($data),
            'POST aniversarios.criar' => $this->criarAniversario($data),
            'PUT aniversarios.editar' => $this->editarAniversario($data),
            'DELETE aniversarios.excluir' => $this->excluirAniversario($data),
            'POST notas.criar' => $this->criarNota($data),
            'PUT notas.editar' => $this->editarNota($data),
            'DELETE notas.excluir' => $this->excluirNota($data),
            'GET banco.status' => $this->statusBanco(),
            default => throw new ApiException('Rota não encontrada.', 404),
        };
    }

    private function sessao(): array
    {
        if (!isset($_SESSION['usuario_id'])) {
            throw new ApiException('Sessão não autenticada.', 401);
        }

        return [
            'usuario' => [
                'id' => (int) $_SESSION['usuario_id'],
                'nome' => $_SESSION['usuario_nome'],
                'login' => $_SESSION['usuario_login'],
            ],
        ];
    }

    private function registrar(array $data): array
    {
        $nome = trim((string) ($data['nome'] ?? ''));
        $login = strtolower(trim((string) ($data['email'] ?? '')));
        $senha = (string) ($data['senha'] ?? '');

        if ($nome === '' || strlen($nome) > 200) {
            throw new ApiException('Informe um nome com até 200 caracteres.', 422);
        }
        if (strlen($login) > 50 || filter_var($login, FILTER_VALIDATE_EMAIL) === false) {
            throw new ApiException('Informe um e-mail válido com até 50 caracteres.', 422);
        }
        if (strlen($senha) < 8) {
            throw new ApiException('A senha deve ter pelo menos 8 caracteres.', 422);
        }

        try {
            $stmt = $this->database()->prepare(
                'INSERT INTO tbUsuarios (nome, login, senha) VALUES (:nome, :login, :senha)'
            );
            $stmt->execute([
                'nome' => $nome,
                'login' => $login,
                'senha' => password_hash($senha, PASSWORD_DEFAULT),
            ]);
        } catch (PDOException $error) {
            if ($error->getCode() === '23000') {
                throw new ApiException('Já existe uma conta com este e-mail.', 409);
            }
            throw $error;
        }

        $this->iniciarSessao((int) $this->database()->lastInsertId(), $nome, $login);
        return ['usuario' => $this->usuarioDaSessao()];
    }

    private function entrar(array $data): array
    {
        $login = strtolower(trim((string) ($data['email'] ?? '')));
        $senha = (string) ($data['senha'] ?? '');
        if ($login === '' || $senha === '') {
            throw new ApiException('Informe seu e-mail e sua senha.', 422);
        }

        $stmt = $this->database()->prepare(
            'SELECT usuario_id, nome, login, senha FROM tbUsuarios WHERE login = :login LIMIT 1'
        );
        $stmt->execute(['login' => $login]);
        $usuario = $stmt->fetch();
        if (!$usuario || !password_verify($senha, $usuario['senha'])) {
            throw new ApiException('E-mail ou senha incorretos.', 401);
        }

        $this->iniciarSessao(
            (int) $usuario['usuario_id'],
            $usuario['nome'],
            $usuario['login']
        );
        return ['usuario' => $this->usuarioDaSessao()];
    }

    private function sair(): array
    {
        $_SESSION = [];
        if (ini_get('session.use_cookies')) {
            $cookie = session_get_cookie_params();
            setcookie(session_name(), '', [
                'expires' => time() - 42000,
                'path' => $cookie['path'],
                'domain' => $cookie['domain'],
                'secure' => $cookie['secure'],
                'httponly' => $cookie['httponly'],
                'samesite' => $cookie['samesite'] ?? 'Lax',
            ]);
        }
        session_destroy();
        return ['status' => 'sessao encerrada'];
    }

    private function dadosDaAplicacao(): array
    {
        $usuarioId = $this->usuarioId();
        $pdo = $this->database();
        $usuarioStmt = $pdo->prepare(
            'SELECT nome, login, telefone, nascimento FROM tbUsuarios WHERE usuario_id = :usuario_id'
        );
        $usuarioStmt->execute(['usuario_id' => $usuarioId]);
        $usuario = $usuarioStmt->fetch();
        if (!$usuario) {
            throw new ApiException('Usuário não encontrado.', 404);
        }

        $preferenciasStmt = $pdo->prepare(
            'SELECT notificacao_email, notificacao_push, lembrete_3_dias, lembrete_no_dia
             FROM tbPreferencias WHERE usuario_id = :usuario_id'
        );
        $preferenciasStmt->execute(['usuario_id' => $usuarioId]);
        $preferencias = $preferenciasStmt->fetch();
        $preferencias = $preferencias
            ? array_map(static fn($value): bool => (bool) $value, $preferencias)
            : [
                'notificacao_email' => false,
                'notificacao_push' => false,
                'lembrete_3_dias' => false,
                'lembrete_no_dia' => false,
            ];

        $pessoas = $pdo->prepare(
            'SELECT p.pessoa_id AS id, p.nome, p.nascimento, t.descricao AS grupo
             FROM tbPessoas p
             INNER JOIN tbPessoaTipo t ON t.pessoa_tipo_id = p.pessoa_tipo_id
             WHERE p.criado_por = :usuario_id
             ORDER BY p.nome'
        );
        $pessoas->execute(['usuario_id' => $usuarioId]);

        $notas = $pdo->prepare(
            'SELECT nota_id AS id, titulo, conteudo, data_nota AS data, criado_em AS criadoEm
             FROM tbNotas WHERE usuario_id = :usuario_id
             ORDER BY criado_em DESC, nota_id DESC'
        );
        $notas->execute(['usuario_id' => $usuarioId]);

        $atividades = $pdo->prepare(
            'SELECT descricao, criado_em AS data FROM tbAtividades
             WHERE usuario_id = :usuario_id
             ORDER BY atividade_id DESC LIMIT 20'
        );
        $atividades->execute(['usuario_id' => $usuarioId]);

        return [
            'usuario' => [
                'nome' => $usuario['nome'],
                'email' => $usuario['login'],
                'telefone' => $usuario['telefone'] ?? '',
                'nascimento' => $usuario['nascimento'] ?? '',
            ],
            'preferencias' => $preferencias,
            'aniversarios' => $pessoas->fetchAll(),
            'notas' => $notas->fetchAll(),
            'atividades' => $atividades->fetchAll(),
        ];
    }

    private function atualizarPerfil(array $data): array
    {
        $usuarioId = $this->usuarioId();
        $nome = trim((string) ($data['nome'] ?? ''));
        $email = strtolower(trim((string) ($data['email'] ?? '')));
        $telefone = trim((string) ($data['telefone'] ?? ''));
        $nascimento = (string) ($data['nascimento'] ?? '');
        if ($nome === '' || strlen($nome) > 200) {
            throw new ApiException('Informe um nome com até 200 caracteres.', 422);
        }
        if (strlen($email) > 50 || filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
            throw new ApiException('Informe um e-mail válido com até 50 caracteres.', 422);
        }
        if (strlen($telefone) > 20) {
            throw new ApiException('O telefone deve ter até 20 caracteres.', 422);
        }
        if ($nascimento !== '' && !$this->dataValida($nascimento)) {
            throw new ApiException('Informe uma data de nascimento válida.', 422);
        }

        try {
            $stmt = $this->database()->prepare(
                'UPDATE tbUsuarios
                 SET nome = :nome, login = :login, telefone = :telefone, nascimento = :nascimento
                 WHERE usuario_id = :usuario_id'
            );
            $stmt->execute([
                'nome' => $nome,
                'login' => $email,
                'telefone' => $telefone !== '' ? $telefone : null,
                'nascimento' => $nascimento !== '' ? $nascimento : null,
                'usuario_id' => $usuarioId,
            ]);
        } catch (PDOException $error) {
            if ($error->getCode() === '23000') {
                throw new ApiException('Já existe uma conta com este e-mail.', 409);
            }
            throw $error;
        }

        $_SESSION['usuario_nome'] = $nome;
        $_SESSION['usuario_login'] = $email;
        return [
            'usuario' => [
                'nome' => $nome,
                'email' => $email,
                'telefone' => $telefone,
                'nascimento' => $nascimento,
            ],
        ];
    }

    private function atualizarPreferencias(array $data): array
    {
        $usuarioId = $this->usuarioId();
        $campos = [
            'notificacao_email',
            'notificacao_push',
            'lembrete_3_dias',
            'lembrete_no_dia',
        ];
        foreach ($campos as $campo) {
            if (!isset($data[$campo]) || !is_bool($data[$campo])) {
                throw new ApiException('Informe todas as preferências como valores booleanos.', 422);
            }
        }

        $this->executarTransacao(function () use ($data, $usuarioId): void {
            $stmt = $this->database()->prepare(
                'INSERT INTO tbPreferencias
                    (usuario_id, notificacao_email, notificacao_push, lembrete_3_dias, lembrete_no_dia)
                 VALUES
                    (:usuario_id, :notificacao_email, :notificacao_push, :lembrete_3_dias, :lembrete_no_dia)
                 ON DUPLICATE KEY UPDATE
                    notificacao_email = :atualizar_notificacao_email,
                    notificacao_push = :atualizar_notificacao_push,
                    lembrete_3_dias = :atualizar_lembrete_3_dias,
                    lembrete_no_dia = :atualizar_lembrete_no_dia'
            );
            $stmt->execute([
                'usuario_id' => $usuarioId,
                'notificacao_email' => (int) $data['notificacao_email'],
                'notificacao_push' => (int) $data['notificacao_push'],
                'lembrete_3_dias' => (int) $data['lembrete_3_dias'],
                'lembrete_no_dia' => (int) $data['lembrete_no_dia'],
                'atualizar_notificacao_email' => (int) $data['notificacao_email'],
                'atualizar_notificacao_push' => (int) $data['notificacao_push'],
                'atualizar_lembrete_3_dias' => (int) $data['lembrete_3_dias'],
                'atualizar_lembrete_no_dia' => (int) $data['lembrete_no_dia'],
            ]);
        });
        $preferencias = [];
        foreach ($campos as $campo) {
            $preferencias[$campo] = $data[$campo];
        }
        return ['preferencias' => $preferencias];
    }

    private function criarAniversario(array $data): array
    {
        $usuarioId = $this->usuarioId();
        [$nome, $nascimento, $tipoId, $grupo] = $this->validarAniversario($data);

        $id = $this->executarTransacao(function () use ($nome, $nascimento, $tipoId, $usuarioId): int {
            $stmt = $this->database()->prepare(
                'INSERT INTO tbPessoas
                    (nome, cpf, nascimento, telefone, pessoa_tipo_id, atualizado_por, criado_por, atualizado_em)
                 VALUES (:nome, NULL, :nascimento, NULL, :tipo_id, :atualizado_por, :criado_por, CURRENT_DATE())'
            );
            $stmt->execute([
                'nome' => $nome,
                'nascimento' => $nascimento,
                'tipo_id' => $tipoId,
                'atualizado_por' => $usuarioId,
                'criado_por' => $usuarioId,
            ]);
            $id = (int) $this->database()->lastInsertId();
            $this->registrarAtividade($usuarioId, "Novo aniversário adicionado: {$nome}");
            return $id;
        });

        return [
            'aniversario' => [
                'id' => $id,
                'nome' => $nome,
                'dataNascimento' => $nascimento,
                'grupo' => $grupo,
            ],
        ];
    }

    private function editarAniversario(array $data): array
    {
        $usuarioId = $this->usuarioId();
        $id = $this->idDaRequisicao($data);
        [$nome, $nascimento, $tipoId, $grupo] = $this->validarAniversario($data);

        $this->executarTransacao(function () use ($nome, $nascimento, $tipoId, $usuarioId, $id): void {
            $stmt = $this->database()->prepare(
                'UPDATE tbPessoas
                 SET nome = :nome, nascimento = :nascimento, pessoa_tipo_id = :tipo_id,
                     atualizado_por = :usuario_atualiza, atualizado_em = CURRENT_DATE()
                 WHERE pessoa_id = :id AND criado_por = :usuario_dono'
            );
            $stmt->execute([
                'nome' => $nome,
                'nascimento' => $nascimento,
                'tipo_id' => $tipoId,
                'usuario_atualiza' => $usuarioId,
                'usuario_dono' => $usuarioId,
                'id' => $id,
            ]);
            if ($stmt->rowCount() === 0 && !$this->aniversarioPertenceAoUsuario($id, $usuarioId)) {
                throw new ApiException('Aniversário não encontrado.', 404);
            }
            $this->registrarAtividade($usuarioId, "Aniversário atualizado: {$nome}");
        });

        return [
            'aniversario' => [
                'id' => $id,
                'nome' => $nome,
                'dataNascimento' => $nascimento,
                'grupo' => $grupo,
            ],
        ];
    }

    private function excluirAniversario(array $data): array
    {
        $usuarioId = $this->usuarioId();
        $id = $this->idDaRequisicao($data);
        try {
            $this->executarTransacao(function () use ($id, $usuarioId): void {
                $stmt = $this->database()->prepare(
                    'DELETE FROM tbPessoas WHERE pessoa_id = :id AND criado_por = :usuario_id'
                );
                $stmt->execute(['id' => $id, 'usuario_id' => $usuarioId]);
                if ($stmt->rowCount() === 0) {
                    throw new ApiException('Aniversário não encontrado.', 404);
                }
                $this->registrarAtividade($usuarioId, 'Aniversário removido');
            });
        } catch (PDOException $error) {
            if ($error->getCode() === '23000') {
                throw new ApiException('Não é possível remover este aniversário porque há avisos associados.', 409);
            }
            throw $error;
        }
        return ['status' => 'excluído'];
    }

    private function criarNota(array $data): array
    {
        $usuarioId = $this->usuarioId();
        [$titulo, $conteudo, $dataNota] = $this->validarNota($data);
        $id = $this->executarTransacao(function () use ($usuarioId, $titulo, $conteudo, $dataNota): int {
            $stmt = $this->database()->prepare(
                'INSERT INTO tbNotas (usuario_id, titulo, conteudo, data_nota)
                 VALUES (:usuario_id, :titulo, :conteudo, :data_nota)'
            );
            $stmt->execute([
                'usuario_id' => $usuarioId,
                'titulo' => $titulo,
                'conteudo' => $conteudo,
                'data_nota' => $dataNota,
            ]);
            $id = (int) $this->database()->lastInsertId();
            $this->registrarAtividade($usuarioId, "Nova nota criada: {$titulo}");
            return $id;
        });
        return [
            'nota' => [
                'id' => $id,
                'titulo' => $titulo,
                'conteudo' => $conteudo,
                'data' => $dataNota,
            ],
        ];
    }

    private function editarNota(array $data): array
    {
        $usuarioId = $this->usuarioId();
        $id = $this->idDaRequisicao($data);
        [$titulo, $conteudo, $dataNota] = $this->validarNota($data);
        $this->executarTransacao(function () use ($titulo, $conteudo, $dataNota, $id, $usuarioId): void {
            $stmt = $this->database()->prepare(
                'UPDATE tbNotas
                 SET titulo = :titulo, conteudo = :conteudo, data_nota = :data_nota
                 WHERE nota_id = :id AND usuario_id = :usuario_id'
            );
            $stmt->execute([
                'titulo' => $titulo,
                'conteudo' => $conteudo,
                'data_nota' => $dataNota,
                'id' => $id,
                'usuario_id' => $usuarioId,
            ]);
            if ($stmt->rowCount() === 0 && !$this->notaPertenceAoUsuario($id, $usuarioId)) {
                throw new ApiException('Nota não encontrada.', 404);
            }
            $this->registrarAtividade($usuarioId, "Nota atualizada: {$titulo}");
        });
        return [
            'nota' => [
                'id' => $id,
                'titulo' => $titulo,
                'conteudo' => $conteudo,
                'data' => $dataNota,
            ],
        ];
    }

    private function excluirNota(array $data): array
    {
        $usuarioId = $this->usuarioId();
        $id = $this->idDaRequisicao($data);
        $this->executarTransacao(function () use ($id, $usuarioId): void {
            $stmt = $this->database()->prepare(
                'DELETE FROM tbNotas WHERE nota_id = :id AND usuario_id = :usuario_id'
            );
            $stmt->execute(['id' => $id, 'usuario_id' => $usuarioId]);
            if ($stmt->rowCount() === 0) {
                throw new ApiException('Nota não encontrada.', 404);
            }
            $this->registrarAtividade($usuarioId, 'Nota removida');
        });
        return ['status' => 'excluída'];
    }

    private function validarAniversario(array $data): array
    {
        $nome = trim((string) ($data['nome'] ?? ''));
        $nascimento = (string) ($data['dataNascimento'] ?? '');
        $grupo = trim((string) ($data['grupo'] ?? ''));
        if ($nome === '' || strlen($nome) > 200 || !$this->dataValida($nascimento)) {
            throw new ApiException('Informe um nome e uma data de nascimento válidos.', 422);
        }

        $tipo = $this->database()->prepare(
            'SELECT pessoa_tipo_id FROM tbPessoaTipo WHERE descricao = :descricao LIMIT 1'
        );
        $tipo->execute(['descricao' => $grupo]);
        $tipoId = $tipo->fetchColumn();
        if ($tipoId === false) {
            throw new ApiException('Grupo inválido. Importe a migração do banco e tente novamente.', 422);
        }
        return [$nome, $nascimento, (int) $tipoId, $grupo];
    }

    private function validarNota(array $data): array
    {
        $titulo = trim((string) ($data['titulo'] ?? ''));
        $conteudo = trim((string) ($data['conteudo'] ?? ''));
        $dataNota = (string) ($data['data'] ?? '');
        if ($titulo === '' || strlen($titulo) > 200 || $conteudo === '' || !$this->dataValida($dataNota)) {
            throw new ApiException('Informe título, conteúdo e data válidos para a nota.', 422);
        }
        return [$titulo, $conteudo, $dataNota];
    }

    private function dataValida(string $value): bool
    {
        $data = \DateTimeImmutable::createFromFormat('!Y-m-d', $value);
        return $data !== false && $data->format('Y-m-d') === $value;
    }

    private function idDaRequisicao(array $data): int
    {
        $id = filter_var($data['id'] ?? null, FILTER_VALIDATE_INT);
        if ($id === false || $id < 1) {
            throw new ApiException('Identificador inválido.', 422);
        }
        return $id;
    }

    private function usuarioId(): int
    {
        if (!isset($_SESSION['usuario_id'])) {
            throw new ApiException('Faça login para continuar.', 401);
        }
        return (int) $_SESSION['usuario_id'];
    }

    private function usuarioDaSessao(): array
    {
        return [
            'id' => (int) $_SESSION['usuario_id'],
            'nome' => $_SESSION['usuario_nome'],
            'login' => $_SESSION['usuario_login'],
        ];
    }

    private function iniciarSessao(int $id, string $nome, string $login): void
    {
        session_regenerate_id(true);
        $_SESSION['usuario_id'] = $id;
        $_SESSION['usuario_nome'] = $nome;
        $_SESSION['usuario_login'] = $login;
    }

    private function registrarAtividade(int $usuarioId, string $descricao): void
    {
        $stmt = $this->database()->prepare(
            'INSERT INTO tbAtividades (usuario_id, descricao) VALUES (:usuario_id, :descricao)'
        );
        $stmt->execute(['usuario_id' => $usuarioId, 'descricao' => $descricao]);
    }

    private function aniversarioPertenceAoUsuario(int $id, int $usuarioId): bool
    {
        $stmt = $this->database()->prepare(
            'SELECT 1 FROM tbPessoas WHERE pessoa_id = :id AND criado_por = :usuario_id'
        );
        $stmt->execute(['id' => $id, 'usuario_id' => $usuarioId]);
        return (bool) $stmt->fetchColumn();
    }

    private function notaPertenceAoUsuario(int $id, int $usuarioId): bool
    {
        $stmt = $this->database()->prepare(
            'SELECT 1 FROM tbNotas WHERE nota_id = :id AND usuario_id = :usuario_id'
        );
        $stmt->execute(['id' => $id, 'usuario_id' => $usuarioId]);
        return (bool) $stmt->fetchColumn();
    }

    private function statusBanco(): array
    {
        $this->usuarioId();
        $database = (string) $this->database()->query('SELECT DATABASE()')->fetchColumn();
        return ['status' => 'conectado', 'banco' => $database];
    }

    private function database(): PDO
    {
        return $this->pdo ??= Connection::obter();
    }

    private function executarTransacao(callable $operacao): mixed
    {
        $pdo = $this->database();
        $pdo->beginTransaction();
        try {
            $resultado = $operacao();
            $pdo->commit();
            return $resultado;
        } catch (\Throwable $error) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            throw $error;
        }
    }
}
