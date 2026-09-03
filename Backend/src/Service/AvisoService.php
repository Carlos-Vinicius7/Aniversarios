<?php

namespace App\Service;

use App\Models\Aviso;
use App\Repository\AvisoRepositoryMemoria;

class AvisoService
{
    private const TIPO_ALERTA = 1;
    private const TIPO_NOTIFICACAO = 2;
    private const TIPO_MENSAGEM = 3;
    private const TIPO_ACAO = 4;
    public function __construct(private AvisoRepositoryMemoria $repo) {}
    private function criar(int $pessoaId, int $tipoId, string $texto, string $obs = ''): Aviso
    {
        $aviso = new Aviso(
            id: $this->repo->proximoId(),
            aviso: $texto,
            pessoaId: $pessoaId,
            avisoTipoId: $tipoId,
            observacao: $obs,
            atualizadoEm: new \DateTimeImmutable()
        );
        $this->repo->save($aviso);
        return $aviso;
    }

    // Configurar Alertas
    public function configurarAlerta(int $pessoaId, int $diasAntecedencia, string $responsavel): Aviso
    {
        return $this->criar(
            $pessoaId,
            self::TIPO_ALERTA,
            "Alerta configurado com {$diasAntecedencia} dia(s) de antecedencia",
            "Responsavel: {$responsavel}"
        );
    }

    // Notificar Responsaveis
    public function notificarResponsaveis(int $pessoaId, array $responsaveis): array
    {
        $avisos = [];
        foreach ($responsaveis as $responsavel) {
            $avisos[] = $this->criar($pessoaId, self::TIPO_NOTIFICACAO, "Notificacao enviada para {$responsavel}");
        }
        return $avisos;
    }

    // Enviar Mensagem ao Aniversariante
    public function enviarMensagem(int $pessoaId, string $mensagem, bool $automatica = true): Aviso
    {
        $origem = $automatica ? 'automatica' : 'manual';
        return $this->criar($pessoaId, self::TIPO_MENSAGEM, $mensagem, "Envio {$origem}");
    }

    // Planejar Acoes Comemorativas
    public function planejarAcao(int $pessoaId, string $descricaoAcao): Aviso
    {
        return $this->criar($pessoaId, self::TIPO_ACAO, $descricaoAcao);
    }

    // Historico de Acoes Comemorativas
    public function historico(?int $pessoaId = null, ?int $avisoTipoId = null): array
    {
        if ($pessoaId) {
            return $this->repo->porPessoa($pessoaId);
        }
        if ($avisoTipoId) {
            return $this->repo->porTipo($avisoTipoId);
        }
        return $this->repo->all();
    }
}
