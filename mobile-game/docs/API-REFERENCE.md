# API Reference

![API Status](https://img.shields.io/badge/status-stable-green.svg)
![API Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Protocol](https://img.shields.io/badge/protocol-HTTPS-important.svg)

## Table of Contents

- [Overview](#overview)
- [Base URL](#base-url)
- [Authentication](#authentication)
- [Rate Limiting](#rate-limiting)
- [Error Handling](#error-handling)
- [Endpoints](#endpoints)
  - [Health Check](#health-check)
  - [Get Beings](#get-beings)
  - [Get Reading Progress](#get-reading-progress)
  - [Get Microsocieties](#get-microsocieties)
  - [Get Books Catalog](#get-books-catalog)
- [Data Models](#data-models)
- [Response Codes](#response-codes)
- [Examples](#examples)

---

## Overview

The **Mobile Bridge API** is a **read-only** REST API that provides secure access to user data from the web system for the mobile game. It follows a strict non-invasive architecture:

- **No Write Operations**: Only GET requests are allowed
- **Data Isolation**: Reads from web system but never modifies it
- **Caching**: Responses cached for 5 minutes to reduce load
- **Versioning**: API version included in responses

### Design Principles

1. **Read-Only**: GET requests only, POST/PUT/DELETE rejected with 405
2. **Stateless**: Each request is independent
3. **Idempotent**: Same request always returns same result
4. **Cacheable**: Responses include cache headers
5. **Self-Documenting**: Error messages explain issues clearly

---

## Base URL

### Development
```
http://localhost/coleccion-nuevo-ser/mobile-game/api/mobile-bridge.php
```

### Production
```
https://api.awakeningprotocol.com/mobile-bridge.php
```

---

## Authentication

### Current Implementation (v1.0.0)

API is currently **open** for development. Authentication will be added in v2.0.0.

### Planned (v2.0.0)

All requests will require a JWT token in the `Authorization` header:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Token Acquisition:**
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "secure_password"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "8f3b2c1d-4e5f-6g7h-8i9j-0k1l2m3n4o5p",
  "expires_in": 3600
}
```

---

## Rate Limiting

### Limits

| Type | Limit | Window |
|------|-------|--------|
| Per User | 100 requests | 1 minute |
| Per IP | 1000 requests | 1 hour |
| Per Endpoint | 50 requests | 1 minute |

### Rate Limit Headers

Every response includes rate limit information:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1638360000
```

### Handling Rate Limits

When rate limit is exceeded, API returns:

```json
{
  "status": "error",
  "message": "Rate limit exceeded. Please try again in 60 seconds.",
  "retry_after": 60
}
```

**Status Code:** `429 Too Many Requests`

---

## Error Handling

### Error Response Format

All errors follow a consistent structure:

```json
{
  "status": "error",
  "message": "Human-readable error description",
  "code": "ERROR_CODE",
  "timestamp": 1638360000,
  "request_id": "uuid-v4"
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INVALID_USER_ID` | 400 | User ID is not a valid UUID |
| `USER_NOT_FOUND` | 404 | User does not exist |
| `INVALID_ACTION` | 400 | Unknown action parameter |
| `METHOD_NOT_ALLOWED` | 405 | Only GET requests allowed |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |
| `SERVICE_UNAVAILABLE` | 503 | Database connection failed |

### Error Examples

**Invalid UUID:**
```json
{
  "status": "error",
  "message": "Invalid user ID format. Expected UUID v4.",
  "code": "INVALID_USER_ID",
  "timestamp": 1638360000
}
```

**Method Not Allowed:**
```json
{
  "status": "error",
  "message": "Only GET requests allowed. This API is READ-ONLY.",
  "code": "METHOD_NOT_ALLOWED",
  "timestamp": 1638360000
}
```

---

## Endpoints

### Health Check

Check if the API is operational and get version information.

**Endpoint:** `GET /mobile-bridge.php?action=health`

**Parameters:** None

**Response:**

```json
{
  "status": "success",
  "data": {
    "status": "healthy",
    "version": "1.0.0",
    "mode": "read-only",
    "timestamp": 1638360000,
    "supabase_configured": true
  },
  "timestamp": 1638360000
}
```

**Status Code:** `200 OK`

**Example:**

```bash
curl "https://api.example.com/mobile-bridge.php?action=health"
```

---

### Get Beings

Retrieve all transformative beings for a specific user.

**Endpoint:** `GET /mobile-bridge.php?action=get_beings&user_id={uuid}`

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `action` | string | Yes | Must be "get_beings" |
| `user_id` | UUID | Yes | User's unique identifier |

**Response:**

```json
{
  "status": "success",
  "data": {
    "beings": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "Reflexive Explorer",
        "description": "A being focused on deep introspection",
        "dominant_attribute": "reflection",
        "attributes": {
          "reflection": 85,
          "analysis": 60,
          "creativity": 45,
          "empathy": 70,
          "communication": 55,
          "leadership": 40,
          "action": 50,
          "resilience": 60,
          "strategy": 55,
          "consciousness": 75,
          "connection": 65,
          "wisdom": 70,
          "organization": 45,
          "collaboration": 60,
          "technical": 30
        },
        "created_at": "2024-12-01T10:30:00Z",
        "synced_from_web": true
      }
    ],
    "count": 1,
    "source": "supabase"
  },
  "timestamp": 1638360000
}
```

**Status Codes:**
- `200 OK`: Success
- `400 Bad Request`: Invalid user_id
- `404 Not Found`: User has no beings
- `500 Internal Server Error`: Database error

**Example:**

```bash
curl "https://api.example.com/mobile-bridge.php?action=get_beings&user_id=550e8400-e29b-41d4-a716-446655440000"
```

**Curl Example with Error Handling:**

```bash
#!/bin/bash

USER_ID="550e8400-e29b-41d4-a716-446655440000"
API_URL="https://api.example.com/mobile-bridge.php"

response=$(curl -s -w "\n%{http_code}" "$API_URL?action=get_beings&user_id=$USER_ID")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" -eq 200 ]; then
    echo "Success: $body"
else
    echo "Error ($http_code): $body"
fi
```

---

### Get Reading Progress

Retrieve user's reading progress across all books.

**Endpoint:** `GET /mobile-bridge.php?action=get_progress&user_id={uuid}`

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `action` | string | Yes | Must be "get_progress" |
| `user_id` | UUID | Yes | User's unique identifier |

**Response:**

```json
{
  "status": "success",
  "data": {
    "progress": [
      {
        "book_id": "manifiesto",
        "book_title": "Manifiesto del Nuevo Ser",
        "chapter_id": "cap1",
        "chapter_title": "El Despertar",
        "progress_percent": 75,
        "last_position": 1250,
        "total_length": 1667,
        "completed": false,
        "last_read_at": "2024-12-13T08:30:00Z"
      },
      {
        "book_id": "codigo-despertar",
        "book_title": "El Código del Despertar",
        "chapter_id": "cap3",
        "chapter_title": "Consciencia Colectiva",
        "progress_percent": 100,
        "last_position": 2340,
        "total_length": 2340,
        "completed": true,
        "last_read_at": "2024-12-12T14:20:00Z"
      }
    ],
    "source": "supabase"
  },
  "timestamp": 1638360000
}
```

**Status Codes:**
- `200 OK`: Success (empty array if no progress)
- `400 Bad Request`: Invalid user_id
- `500 Internal Server Error`: Database error

**Example:**

```bash
curl "https://api.example.com/mobile-bridge.php?action=get_progress&user_id=550e8400-e29b-41d4-a716-446655440000"
```

---

### Get Microsocieties

Retrieve user's microsocieties (organizational simulations).

**Endpoint:** `GET /mobile-bridge.php?action=get_societies&user_id={uuid}`

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `action` | string | Yes | Must be "get_societies" |
| `user_id` | UUID | Yes | User's unique identifier |

**Response:**

```json
{
  "status": "success",
  "data": {
    "societies": [
      {
        "id": "soc_001",
        "name": "EcoVillage Alpha",
        "type": "ecological",
        "population": 150,
        "health": 85,
        "happiness": 78,
        "sustainability": 92,
        "resources": {
          "food": 1200,
          "water": 950,
          "energy": 800
        },
        "created_at": "2024-11-15T09:00:00Z",
        "last_simulation": "2024-12-12T18:45:00Z"
      }
    ],
    "count": 1,
    "source": "local"
  },
  "timestamp": 1638360000
}
```

**Status Codes:**
- `200 OK`: Success
- `400 Bad Request`: Invalid user_id
- `404 Not Found`: User has no societies
- `500 Internal Server Error`: Database error

**Example:**

```bash
curl "https://api.example.com/mobile-bridge.php?action=get_societies&user_id=550e8400-e29b-41d4-a716-446655440000"
```

---

### Get Books Catalog

Retrieve the complete catalog of available books (public endpoint).

**Endpoint:** `GET /mobile-bridge.php?action=get_catalog`

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `action` | string | Yes | Must be "get_catalog" |

**Response:**

```json
{
  "status": "success",
  "data": {
    "catalog": [
      {
        "id": "manifiesto",
        "title": "Manifiesto del Nuevo Ser",
        "subtitle": "Llamado a la Transformación",
        "author": "Colectivo Nuevo Ser",
        "description": "Una guía fundamental para comprender...",
        "chapters": 12,
        "estimated_reading_time": 240,
        "difficulty": "beginner",
        "tags": ["philosophy", "consciousness", "transformation"],
        "cover_url": "/books/manifiesto/cover.jpg",
        "available": true
      },
      {
        "id": "codigo-despertar",
        "title": "El Código del Despertar",
        "subtitle": "Ciencia y Consciencia",
        "author": "Dr. Ana Martínez",
        "description": "Explorando la intersección...",
        "chapters": 14,
        "estimated_reading_time": 360,
        "difficulty": "intermediate",
        "tags": ["science", "quantum", "consciousness"],
        "cover_url": "/books/codigo-despertar/cover.jpg",
        "available": true
      }
    ],
    "source": "local"
  },
  "timestamp": 1638360000
}
```

**Status Codes:**
- `200 OK`: Success
- `404 Not Found`: Catalog file missing
- `500 Internal Server Error`: Read error

**Example:**

```bash
curl "https://api.example.com/mobile-bridge.php?action=get_catalog"
```

---

## Data Models

### Being

```typescript
interface Being {
  id: string;                    // UUID
  name: string;
  description?: string;
  dominant_attribute: AttributeType;
  attributes: {
    reflection: number;          // 0-100
    analysis: number;
    creativity: number;
    empathy: number;
    communication: number;
    leadership: number;
    action: number;
    resilience: number;
    strategy: number;
    consciousness: number;
    connection: number;
    wisdom: number;
    organization: number;
    collaboration: number;
    technical: number;
  };
  created_at: string;            // ISO 8601
  synced_from_web: boolean;
}
```

### ReadingProgress

```typescript
interface ReadingProgress {
  book_id: string;
  book_title: string;
  chapter_id: string;
  chapter_title: string;
  progress_percent: number;      // 0-100
  last_position: number;         // Character position
  total_length: number;
  completed: boolean;
  last_read_at: string;          // ISO 8601
}
```

### Microsociety

```typescript
interface Microsociety {
  id: string;
  name: string;
  type: 'ecological' | 'educational' | 'technological' | 'cooperative';
  population: number;
  health: number;                // 0-100
  happiness: number;             // 0-100
  sustainability: number;        // 0-100
  resources: {
    food: number;
    water: number;
    energy: number;
  };
  created_at: string;            // ISO 8601
  last_simulation: string;       // ISO 8601
}
```

### Book

```typescript
interface Book {
  id: string;
  title: string;
  subtitle?: string;
  author: string;
  description: string;
  chapters: number;
  estimated_reading_time: number; // minutes
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  cover_url: string;
  available: boolean;
}
```

---

## Response Codes

### Success Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 304 | Not Modified | Cached version is still valid |

### Client Error Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 400 | Bad Request | Invalid parameters |
| 401 | Unauthorized | Authentication required (v2.0+) |
| 403 | Forbidden | Valid auth but access denied |
| 404 | Not Found | Resource doesn't exist |
| 405 | Method Not Allowed | Only GET allowed |
| 429 | Too Many Requests | Rate limit exceeded |

### Server Error Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 500 | Internal Server Error | Unexpected server error |
| 502 | Bad Gateway | Database connection failed |
| 503 | Service Unavailable | Server overloaded/maintenance |

---

## Examples

### JavaScript (Fetch API)

```javascript
async function getBeings(userId) {
  const apiUrl = 'https://api.example.com/mobile-bridge.php';

  try {
    const response = await fetch(
      `${apiUrl}?action=get_beings&user_id=${userId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.status === 'success') {
      return data.data.beings;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Error fetching beings:', error);
    throw error;
  }
}

// Usage
const userId = '550e8400-e29b-41d4-a716-446655440000';
getBeings(userId)
  .then(beings => console.log('Beings:', beings))
  .catch(error => console.error('Failed:', error));
```

### JavaScript (Axios)

```javascript
import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'https://api.example.com',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 429) {
      console.warn('Rate limit exceeded. Retrying after delay...');
      // Implement exponential backoff
    }
    return Promise.reject(error);
  }
);

// Get beings
async function getBeings(userId) {
  const response = await apiClient.get('/mobile-bridge.php', {
    params: {
      action: 'get_beings',
      user_id: userId
    }
  });

  return response.data.data.beings;
}
```

### React Native Example

```javascript
import { API_BASE_URL } from '../config/constants';

class APIService {
  async request(action, params = {}) {
    const url = new URL(API_BASE_URL);
    url.searchParams.append('action', action);

    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.status === 'error') {
        throw new Error(data.message);
      }

      return data.data;
    } catch (error) {
      console.error(`API Error (${action}):`, error);
      throw error;
    }
  }

  getBeings(userId) {
    return this.request('get_beings', { user_id: userId });
  }

  getProgress(userId) {
    return this.request('get_progress', { user_id: userId });
  }

  getCatalog() {
    return this.request('get_catalog');
  }
}

export default new APIService();
```

### Python Example

```python
import requests
from typing import Dict, List
from uuid import UUID

class MobileBridgeClient:
    def __init__(self, base_url: str):
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json'
        })

    def _request(self, action: str, params: Dict = None) -> Dict:
        """Make GET request to API"""
        params = params or {}
        params['action'] = action

        try:
            response = self.session.get(self.base_url, params=params)
            response.raise_for_status()

            data = response.json()

            if data['status'] == 'error':
                raise ValueError(data['message'])

            return data['data']
        except requests.RequestException as e:
            raise Exception(f"API request failed: {e}")

    def get_beings(self, user_id: UUID) -> List[Dict]:
        """Get user's beings"""
        return self._request('get_beings', {'user_id': str(user_id)})['beings']

    def get_progress(self, user_id: UUID) -> List[Dict]:
        """Get user's reading progress"""
        return self._request('get_progress', {'user_id': str(user_id)})['progress']

    def get_catalog(self) -> List[Dict]:
        """Get books catalog"""
        return self._request('get_catalog')['catalog']

# Usage
client = MobileBridgeClient('https://api.example.com/mobile-bridge.php')
beings = client.get_beings('550e8400-e29b-41d4-a716-446655440000')
```

### cURL Examples

**Health Check:**
```bash
curl -X GET "https://api.example.com/mobile-bridge.php?action=health"
```

**Get Beings with Pretty Print:**
```bash
curl -X GET \
  "https://api.example.com/mobile-bridge.php?action=get_beings&user_id=550e8400-e29b-41d4-a716-446655440000" \
  | jq '.'
```

**Check Response Headers:**
```bash
curl -i -X GET \
  "https://api.example.com/mobile-bridge.php?action=health"
```

**Test Rate Limiting:**
```bash
for i in {1..105}; do
  curl -w "%{http_code}\n" -o /dev/null -s \
    "https://api.example.com/mobile-bridge.php?action=health"
done
```

---

## Changelog

### v1.0.0 (2024-12-13)
- Initial release
- Health check endpoint
- Get beings endpoint
- Get reading progress endpoint
- Get microsocieties endpoint
- Get catalog endpoint
- Read-only architecture
- Basic error handling

### Planned for v2.0.0
- JWT authentication
- Enhanced rate limiting
- WebSocket support for real-time updates
- Pagination for large result sets
- Filtering and sorting options
- GraphQL endpoint (optional)

---

## Support

For API issues or questions:

- **Email:** api-support@awakeningprotocol.com
- **GitHub Issues:** [github.com/awakening-protocol/mobile-game](https://github.com)
- **Documentation:** [docs.awakeningprotocol.com](https://docs.example.com)

---

**Last Updated:** 2025-12-13
**API Version:** 1.0.0
**Maintainer:** Awakening Protocol Team
