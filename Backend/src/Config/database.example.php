<?php

// Copie este arquivo para database.local.php e preencha com os dados reais.
// Nunca versione senhas: database.local.php deve ficar no .gitignore.
return [
    'host' => getenv('DB_HOST') ?: 'seu-host.mysql.dbaas.com.br',
    'port' => (int) (getenv('DB_PORT') ?: 3306),
    'banco' => getenv('DB_NAME') ?: 'nome_do_banco',
    'usuario' => getenv('DB_USER') ?: 'usuario_do_banco',
    'senha' => getenv('DB_PASSWORD') ?: '',
];