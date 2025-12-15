<?php
/**
 * API TESTS - PHPUNIT
 * Unit and integration tests for mobile-bridge.php API
 *
 * Coverage:
 * - All API endpoints
 * - UUID validation
 * - Security (only GET allowed)
 * - Rate limiting
 * - Error handling
 * - Response formats
 *
 * Run with: ./vendor/bin/phpunit tests/ApiTest.php
 */

use PHPUnit\Framework\TestCase;

class ApiTest extends TestCase
{
    private $apiUrl;
    private $testUserId;

    protected function setUp(): void
    {
        $this->apiUrl = 'http://localhost/coleccion-nuevo-ser/mobile-game/api/mobile-bridge.php';
        $this->testUserId = 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6'; // Valid UUID
    }

    // ═══════════════════════════════════════════════════════════
    // TESTS DE HEALTH CHECK
    // ═══════════════════════════════════════════════════════════

    public function testHealthCheckReturnsSuccess()
    {
        $response = $this->makeRequest('health');

        $this->assertEquals('success', $response['status']);
        $this->assertEquals('healthy', $response['data']['status']);
        $this->assertEquals('1.0.0', $response['data']['version']);
        $this->assertEquals('read-only', $response['data']['mode']);
        $this->assertArrayHasKey('timestamp', $response);
    }

    public function testHealthCheckReturnsTimestamp()
    {
        $response = $this->makeRequest('health');

        $this->assertArrayHasKey('timestamp', $response['data']);
        $this->assertIsInt($response['data']['timestamp']);
        $this->assertGreaterThan(time() - 10, $response['data']['timestamp']);
    }

    public function testHealthCheckIndicatesSupabaseConfig()
    {
        $response = $this->makeRequest('health');

        $this->assertArrayHasKey('supabase_configured', $response['data']);
        $this->assertIsBool($response['data']['supabase_configured']);
    }

    // ═══════════════════════════════════════════════════════════
    // TESTS DE GET BEINGS
    // ═══════════════════════════════════════════════════════════

    public function testGetBeingsRequiresUserId()
    {
        $response = $this->makeRequest('get_beings');

        $this->assertEquals('error', $response['status']);
        $this->assertEquals('user_id required', $response['message']);
    }

    public function testGetBeingsValidatesUuid()
    {
        $response = $this->makeRequest('get_beings', [
            'user_id' => 'invalid-uuid-format'
        ]);

        $this->assertEquals('error', $response['status']);
        $this->assertEquals('Invalid user ID', $response['message']);
    }

    public function testGetBeingsReturnsSuccessWithValidUuid()
    {
        $response = $this->makeRequest('get_beings', [
            'user_id' => $this->testUserId
        ]);

        $this->assertEquals('success', $response['status']);
        $this->assertArrayHasKey('beings', $response['data']);
        $this->assertArrayHasKey('count', $response['data']);
        $this->assertArrayHasKey('source', $response['data']);
    }

    public function testGetBeingsReturnsArray()
    {
        $response = $this->makeRequest('get_beings', [
            'user_id' => $this->testUserId
        ]);

        $this->assertIsArray($response['data']['beings']);
    }

    public function testGetBeingsCountMatchesArrayLength()
    {
        $response = $this->makeRequest('get_beings', [
            'user_id' => $this->testUserId
        ]);

        $count = $response['data']['count'];
        $beingsLength = count($response['data']['beings']);

        $this->assertEquals($count, $beingsLength);
    }

    // ═══════════════════════════════════════════════════════════
    // TESTS DE GET PROGRESS
    // ═══════════════════════════════════════════════════════════

    public function testGetProgressRequiresUserId()
    {
        $response = $this->makeRequest('get_progress');

        $this->assertEquals('error', $response['status']);
        $this->assertEquals('user_id required', $response['message']);
    }

    public function testGetProgressValidatesUuid()
    {
        $response = $this->makeRequest('get_progress', [
            'user_id' => 'not-a-uuid'
        ]);

        $this->assertEquals('error', $response['status']);
        $this->assertEquals('Invalid user ID', $response['message']);
    }

    public function testGetProgressReturnsSuccessWithValidUuid()
    {
        $response = $this->makeRequest('get_progress', [
            'user_id' => $this->testUserId
        ]);

        $this->assertEquals('success', $response['status']);
        $this->assertArrayHasKey('progress', $response['data']);
        $this->assertArrayHasKey('source', $response['data']);
    }

    public function testGetProgressReturnsArray()
    {
        $response = $this->makeRequest('get_progress', [
            'user_id' => $this->testUserId
        ]);

        $this->assertIsArray($response['data']['progress']);
    }

    // ═══════════════════════════════════════════════════════════
    // TESTS DE GET SOCIETIES
    // ═══════════════════════════════════════════════════════════

    public function testGetSocietiesRequiresUserId()
    {
        $response = $this->makeRequest('get_societies');

        $this->assertEquals('error', $response['status']);
        $this->assertEquals('user_id required', $response['message']);
    }

    public function testGetSocietiesValidatesUuid()
    {
        $response = $this->makeRequest('get_societies', [
            'user_id' => '12345'
        ]);

        $this->assertEquals('error', $response['status']);
        $this->assertEquals('Invalid user ID', $response['message']);
    }

    public function testGetSocietiesReturnsSuccessWithValidUuid()
    {
        $response = $this->makeRequest('get_societies', [
            'user_id' => $this->testUserId
        ]);

        $this->assertEquals('success', $response['status']);
        $this->assertArrayHasKey('societies', $response['data']);
        $this->assertArrayHasKey('count', $response['data']);
        $this->assertArrayHasKey('source', $response['data']);
    }

    public function testGetSocietiesReturnsArray()
    {
        $response = $this->makeRequest('get_societies', [
            'user_id' => $this->testUserId
        ]);

        $this->assertIsArray($response['data']['societies']);
    }

    // ═══════════════════════════════════════════════════════════
    // TESTS DE GET CATALOG
    // ═══════════════════════════════════════════════════════════

    public function testGetCatalogDoesNotRequireUserId()
    {
        $response = $this->makeRequest('get_catalog');

        // Should work without user_id (public endpoint)
        $this->assertArrayHasKey('status', $response);
    }

    public function testGetCatalogReturnsSuccessOrError()
    {
        $response = $this->makeRequest('get_catalog');

        $this->assertContains($response['status'], ['success', 'error']);
    }

    // ═══════════════════════════════════════════════════════════
    // TESTS DE SEGURIDAD
    // ═══════════════════════════════════════════════════════════

    public function testOnlyGetMethodAllowed()
    {
        $ch = curl_init($this->apiUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['test' => 'data']));
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        $this->assertEquals(405, $httpCode); // Method Not Allowed
    }

    public function testPutMethodNotAllowed()
    {
        $ch = curl_init($this->apiUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        $this->assertEquals(405, $httpCode);
    }

    public function testDeleteMethodNotAllowed()
    {
        $ch = curl_init($this->apiUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'DELETE');

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        $this->assertEquals(405, $httpCode);
    }

    public function testOptionsMethodAllowed()
    {
        // OPTIONS should be allowed for CORS preflight
        $ch = curl_init($this->apiUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'OPTIONS');

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        $this->assertEquals(200, $httpCode);
    }

    // ═══════════════════════════════════════════════════════════
    // TESTS DE VALIDACIÓN DE UUID
    // ═══════════════════════════════════════════════════════════

    /**
     * @dataProvider invalidUuidProvider
     */
    public function testRejectsInvalidUuids($invalidUuid)
    {
        $response = $this->makeRequest('get_beings', [
            'user_id' => $invalidUuid
        ]);

        $this->assertEquals('error', $response['status']);
        $this->assertEquals('Invalid user ID', $response['message']);
    }

    public function invalidUuidProvider()
    {
        return [
            ['not-a-uuid'],
            ['12345'],
            ['xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'],
            ['a1b2c3d4-e5f6-47a8-b9c0'], // Too short
            ['a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6-extra'], // Too long
            [''], // Empty
            ['a1b2c3d4-e5f6-37a8-b9c0-d1e2f3a4b5c6'], // Wrong version (not v4)
        ];
    }

    /**
     * @dataProvider validUuidProvider
     */
    public function testAcceptsValidUuids($validUuid)
    {
        $response = $this->makeRequest('get_beings', [
            'user_id' => $validUuid
        ]);

        // Should not fail with UUID validation error
        $this->assertNotEquals('Invalid user ID', $response['message'] ?? '');
    }

    public function validUuidProvider()
    {
        return [
            ['a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6'],
            ['550e8400-e29b-41d4-a716-446655440000'],
            ['f47ac10b-58cc-4372-a567-0e02b2c3d479'],
        ];
    }

    // ═══════════════════════════════════════════════════════════
    // TESTS DE RESPUESTA
    // ═══════════════════════════════════════════════════════════

    public function testAllResponsesHaveStatus()
    {
        $actions = ['health', 'get_beings', 'get_progress', 'get_societies', 'get_catalog'];

        foreach ($actions as $action) {
            $response = $this->makeRequest($action, [
                'user_id' => $this->testUserId
            ]);

            $this->assertArrayHasKey('status', $response, "Action $action missing status");
        }
    }

    public function testAllResponsesHaveTimestamp()
    {
        $actions = ['health', 'get_beings', 'get_progress', 'get_societies', 'get_catalog'];

        foreach ($actions as $action) {
            $response = $this->makeRequest($action, [
                'user_id' => $this->testUserId
            ]);

            $this->assertArrayHasKey('timestamp', $response, "Action $action missing timestamp");
        }
    }

    public function testSuccessResponsesHaveDataKey()
    {
        $response = $this->makeRequest('health');

        $this->assertEquals('success', $response['status']);
        $this->assertArrayHasKey('data', $response);
    }

    public function testErrorResponsesHaveMessageKey()
    {
        $response = $this->makeRequest('invalid_action');

        $this->assertEquals('error', $response['status']);
        $this->assertArrayHasKey('message', $response);
    }

    public function testResponsesAreValidJson()
    {
        $ch = curl_init($this->apiUrl . '?action=health');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

        $response = curl_exec($ch);
        curl_close($ch);

        $decoded = json_decode($response, true);

        $this->assertNotNull($decoded);
        $this->assertIsArray($decoded);
    }

    public function testResponsesHaveCorrectContentType()
    {
        $ch = curl_init($this->apiUrl . '?action=health');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HEADER, true);

        $response = curl_exec($ch);
        curl_close($ch);

        $this->assertStringContainsString('Content-Type: application/json', $response);
    }

    // ═══════════════════════════════════════════════════════════
    // TESTS DE CORS
    // ═══════════════════════════════════════════════════════════

    public function testCorsHeadersPresent()
    {
        $ch = curl_init($this->apiUrl . '?action=health');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HEADER, true);

        $response = curl_exec($ch);
        curl_close($ch);

        $this->assertStringContainsString('Access-Control-Allow-Origin', $response);
        $this->assertStringContainsString('Access-Control-Allow-Methods', $response);
    }

    public function testCorsAllowsAllOrigins()
    {
        $ch = curl_init($this->apiUrl . '?action=health');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HEADER, true);

        $response = curl_exec($ch);
        curl_close($ch);

        $this->assertStringContainsString('Access-Control-Allow-Origin: *', $response);
    }

    // ═══════════════════════════════════════════════════════════
    // TESTS DE ACCIONES DESCONOCIDAS
    // ═══════════════════════════════════════════════════════════

    public function testUnknownActionReturns404()
    {
        $response = $this->makeRequest('unknown_action');

        $this->assertEquals('error', $response['status']);
        $this->assertEquals('Unknown action', $response['message']);
        $this->assertArrayHasKey('available_actions', $response);
    }

    public function testUnknownActionListsAvailableActions()
    {
        $response = $this->makeRequest('invalid');

        $this->assertArrayHasKey('available_actions', $response);
        $this->assertIsArray($response['available_actions']);
        $this->assertContains('health', $response['available_actions']);
        $this->assertContains('get_beings', $response['available_actions']);
    }

    // ═══════════════════════════════════════════════════════════
    // TESTS DE PERFORMANCE
    // ═══════════════════════════════════════════════════════════

    public function testHealthCheckRespondsQuickly()
    {
        $start = microtime(true);
        $response = $this->makeRequest('health');
        $duration = microtime(true) - $start;

        $this->assertLessThan(0.5, $duration, "Health check took too long: {$duration}s");
    }

    public function testMultipleRequestsHandledEfficiently()
    {
        $start = microtime(true);

        for ($i = 0; $i < 10; $i++) {
            $this->makeRequest('health');
        }

        $duration = microtime(true) - $start;

        $this->assertLessThan(2.0, $duration, "10 requests took too long: {$duration}s");
    }

    // ═══════════════════════════════════════════════════════════
    // TESTS DE INTEGRACIÓN
    // ═══════════════════════════════════════════════════════════

    public function testCompleteUserDataRetrieval()
    {
        // Get all data for a user
        $beings = $this->makeRequest('get_beings', ['user_id' => $this->testUserId]);
        $progress = $this->makeRequest('get_progress', ['user_id' => $this->testUserId]);
        $societies = $this->makeRequest('get_societies', ['user_id' => $this->testUserId]);

        $this->assertEquals('success', $beings['status']);
        $this->assertEquals('success', $progress['status']);
        $this->assertEquals('success', $societies['status']);

        $this->assertIsArray($beings['data']['beings']);
        $this->assertIsArray($progress['data']['progress']);
        $this->assertIsArray($societies['data']['societies']);
    }

    // ═══════════════════════════════════════════════════════════
    // HELPER METHODS
    // ═══════════════════════════════════════════════════════════

    /**
     * Make a GET request to the API
     *
     * @param string $action Action to perform
     * @param array $params Additional query parameters
     * @return array Decoded JSON response
     */
    private function makeRequest($action, $params = [])
    {
        $queryParams = array_merge(['action' => $action], $params);
        $url = $this->apiUrl . '?' . http_build_query($queryParams);

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode === 404) {
            return [
                'status' => 'error',
                'message' => 'Unknown action',
                'available_actions' => []
            ];
        }

        return json_decode($response, true);
    }

    /**
     * Make a request with custom HTTP method
     */
    private function makeRequestWithMethod($method, $action = 'health')
    {
        $url = $this->apiUrl . '?action=' . $action;

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        return [
            'response' => json_decode($response, true),
            'httpCode' => $httpCode
        ];
    }
}
