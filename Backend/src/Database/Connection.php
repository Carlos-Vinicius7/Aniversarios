<?php
namespace App\Database;

use PDO;
use PDOException;

class Connection {
    private static ?PDO $instancia = null;

    public static function obter(): PDO {
        if (self::$instancia === null) {
            $arquivoConfig = __DIR__ . '/../Config/database.local.php';
            if (!is_file($arquivoConfig)) {
                $arquivoConfig = __DIR__ . '/../Config/database.example.php';
            }
            $config = require $arquivoConfig;

            foreach (['host', 'port', 'banco', 'usuario', 'senha'] as $chave) {
                if (!isset($config[$chave]) || $config[$chave] === '') {
                    $variavel = [
                        'host' => 'DB_HOST',
                        'port' => 'DB_PORT',
                        'banco' => 'DB_NAME',
                        'usuario' => 'DB_USER',
                        'senha' => 'DB_PASSWORD',
                    ][$chave];
                    throw new \RuntimeException(
                        "A configuração do banco está incompleta. Defina {$variavel} no servidor."
                    );
                }
            }

            $dsn = "mysql:host={$config['host']};port={$config['port']};dbname={$config['banco']};charset=utf8mb4";

            try {
                self::$instancia = new PDO(
                    $dsn,
                    $config['usuario'],
                    $config['senha'],
                    [
                        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                        PDO::ATTR_EMULATE_PREPARES => false,
                    ]
                );
            } catch (PDOException $erro) {
                throw new \RuntimeException("Erro ao conectar ao banco de dados: " . $erro->getMessage());
            }
        }
        return self::$instancia;
    }
}