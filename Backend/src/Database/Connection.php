<?php
namespace App\Database;

use PDO;
use PDOException;

class Connection {
    private static ?PDO $instancia = null;

    public static function obter(): PDO {
        if (self::$instancia  === null) {
            $config = require __DIR__.''.'/../Config/database.local.php';

            $dsn = "mysql:host={$config['host']};port={$config['port']};dbname={$config['banco']};charset=utf8mb4";

            try{
                self::$instancia = new PDO(
                    $dsn,
                    $config['usuario'],
                    $config['senha'],
                    [
                        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
                    ]
                );
            } catch (PDOException $erro) {
                throw new \RuntimeException("Erro ao conectar ao banco de dados: " . $erro->getMessage());
            }
        }
        return self::$instancia;
    }
}