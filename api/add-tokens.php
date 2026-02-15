<?php
/**
 * SCRIPT ADMIN - Añadir Tokens a Usuario
 *
 * Uso: php add-tokens.php <email> <cantidad>
 * Ejemplo: php add-tokens.php irurag@gmail.com 100000
 */

require_once __DIR__ . '/config.php';

// Verificar argumentos
if ($argc < 3) {
    echo "Uso: php add-tokens.php <email> <cantidad>\n";
    echo "Ejemplo: php add-tokens.php irurag@gmail.com 100000\n";
    exit(1);
}

$userEmail = $argv[1];
$tokensToAdd = intval($argv[2]);

if ($tokensToAdd <= 0) {
    echo "Error: La cantidad debe ser un número positivo\n";
    exit(1);
}

echo "===========================================\n";
echo "AÑADIR TOKENS A USUARIO\n";
echo "===========================================\n";
echo "Email: $userEmail\n";
echo "Tokens a añadir: " . number_format($tokensToAdd) . "\n";
echo "-------------------------------------------\n";

// Buscar usuario en Supabase (usar SERVICE_KEY para bypass RLS)
$supabaseUrl = SUPABASE_URL;
$supabaseKey = SUPABASE_SERVICE_KEY;

// 1. Obtener ID del usuario por email
echo "Buscando usuario...\n";

$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL => "$supabaseUrl/rest/v1/profiles?email=eq.$userEmail&select=*",
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        "apikey: $supabaseKey",
        "Authorization: Bearer $supabaseKey",
        "Content-Type: application/json"
    ]
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode !== 200) {
    echo "Error al buscar usuario: HTTP $httpCode\n";
    echo "Respuesta: $response\n";
    exit(1);
}

$users = json_decode($response, true);

if (empty($users)) {
    echo "Error: No se encontró usuario con email $userEmail\n";
    exit(1);
}

$user = $users[0];
$userId = $user['id'];
$currentTokens = intval($user['token_balance'] ?? 0);
$currentMonthly = intval($user['ai_credits_remaining'] ?? 0);

echo "✓ Usuario encontrado\n";
echo "  ID: $userId\n";
echo "  Nombre: " . ($user['full_name'] ?? 'N/A') . "\n";
echo "  Plan: " . ($user['subscription_tier'] ?? 'free') . "\n";
echo "  Tokens actuales (comprados): " . number_format($currentTokens) . "\n";
echo "  Tokens mensuales restantes: " . number_format($currentMonthly) . "\n";
echo "\n";

// 2. Actualizar tokens
$newTokenBalance = $currentTokens + $tokensToAdd;

echo "Actualizando tokens...\n";

$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL => "$supabaseUrl/rest/v1/profiles?id=eq.$userId",
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_CUSTOMREQUEST => 'PATCH',
    CURLOPT_HTTPHEADER => [
        "apikey: $supabaseKey",
        "Authorization: Bearer $supabaseKey",
        "Content-Type: application/json",
        "Prefer: return=representation"
    ],
    CURLOPT_POSTFIELDS => json_encode([
        'token_balance' => $newTokenBalance,
        'tokens_purchased_total' => ($user['tokens_purchased_total'] ?? 0) + $tokensToAdd
    ])
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode !== 200) {
    echo "Error al actualizar tokens: HTTP $httpCode\n";
    echo "Respuesta: $response\n";
    exit(1);
}

echo "✓ Tokens actualizados exitosamente\n";
echo "\n";
echo "===========================================\n";
echo "RESUMEN\n";
echo "===========================================\n";
echo "Usuario: $userEmail\n";
echo "Tokens añadidos: +" . number_format($tokensToAdd) . "\n";
echo "Tokens anteriores: " . number_format($currentTokens) . "\n";
echo "Tokens nuevos: " . number_format($newTokenBalance) . "\n";
echo "===========================================\n";
echo "\n";
echo "✓ Operación completada\n";
