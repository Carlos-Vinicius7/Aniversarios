<?php
spl_autoload_register(function ($class) {
    $prefixo = 'App\\';
    $diretorioBase = __DIR__ . '/src/';

    if (strncmp($prefixo, $class, strlen($prefixo)) !== 0) {
        return;
    }

    $classeRelativa = substr($class, strlen($prefixo));

    $arquivo = $diretorioBase . str_replace('\\', '/', $classeRelativa) . '.php';

    if (file_exists($arquivo)) {
        require $arquivo;
    }
});