<?php
namespace App;

use RuntimeException;

class ApiException extends RuntimeException
{
    public function __construct(string $message, public int $statusCode)
    {
        parent::__construct($message);
    }
}
