# Security Policy

## Supported Versions

We release security updates for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

---

## Reporting a Vulnerability

### How to Report

**DO NOT** create a public GitHub issue for security vulnerabilities.

Instead, please report security issues via:

**Email:** security@awakeningprotocol.com

**Subject Line:** [SECURITY] Brief description

**Include:**
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)
- Your contact information

### What to Expect

1. **Acknowledgment**: Within 48 hours of report
2. **Initial Assessment**: Within 5 business days
3. **Status Update**: Every 7 days until resolved
4. **Fix Timeline**:
   - Critical: 7-14 days
   - High: 14-30 days
   - Medium: 30-60 days
   - Low: Next scheduled release

### Disclosure Policy

- We follow **Coordinated Disclosure**
- Fix will be developed privately
- Security advisory published after fix is released
- Reporter credited (unless anonymity requested)

---

## Security Measures

### API Security

**Read-Only Architecture:**
```php
// API rejects all write operations
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    exit('Only GET requests allowed');
}
```

**UUID Validation:**
```php
function validateUserId($userId) {
    $pattern = '/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i';
    return preg_match($pattern, $userId) === 1;
}
```

**SQL Injection Prevention:**
- Prepared statements for all queries
- Input sanitization
- Parameterized queries

**HTTPS Only:**
- All API calls over TLS 1.3
- Certificate pinning (production)
- HSTS headers enabled

---

### Mobile App Security

**Data Storage:**
- Sensitive data encrypted at rest (AsyncStorage encryption)
- No passwords stored locally
- Session tokens expire after 24 hours

**Code Obfuscation:**
- ProGuard enabled (Android)
- Code minification (release builds)
- No debug symbols in production

**Permissions:**
- Request minimal permissions
- Runtime permission checks
- Clear permission rationale to users

**Secure Communication:**
```javascript
// All API calls use HTTPS
const API_BASE_URL = __DEV__
  ? 'http://localhost/...'  // Dev only
  : 'https://api.awakeningprotocol.com';  // Production

// Certificate pinning (production)
fetch(url, {
  // SSL pinning configuration
});
```

---

### Database Security

**Isolation:**
```sql
-- All mobile tables prefixed to prevent conflicts
CREATE TABLE mobile_users (...);
CREATE TABLE mobile_beings (...);

-- No foreign keys to web system tables
-- Optional references are read-only
```

**Access Control:**
```sql
-- API user has read-only access to web tables
GRANT SELECT ON frankenstein_beings TO mobile_api_user;
REVOKE INSERT, UPDATE, DELETE ON frankenstein_beings FROM mobile_api_user;

-- Full access only to mobile tables
GRANT ALL ON mobile_users TO mobile_api_user;
```

**Encryption:**
- Database connections over SSL
- Sensitive fields encrypted (e.g., email)
- Password hashing (bcrypt, cost 12)

---

### Authentication (Planned v2.0)

**JWT Tokens:**
```javascript
{
  "alg": "HS256",
  "typ": "JWT"
}
{
  "sub": "user_id",
  "exp": 1640000000,
  "iat": 1639996400,
  "role": "player"
}
```

**Token Security:**
- Short expiry (1 hour access, 7 days refresh)
- Token rotation on refresh
- Revocation list for compromised tokens
- Secure storage (KeyChain/KeyStore)

**Password Requirements:**
- Minimum 8 characters
- At least one uppercase, lowercase, number
- No common passwords (checked against breach database)
- Rate limiting on login attempts

---

## Vulnerability Disclosure Examples

### Example: SQL Injection (Hypothetical)

**Reporter:** security@example.com
**Severity:** Critical
**Status:** Fixed in v1.0.1

**Description:**
User input in `user_id` parameter not properly sanitized, allowing SQL injection.

**Proof of Concept:**
```
GET /api/mobile-bridge.php?action=get_beings&user_id=' OR '1'='1
```

**Impact:**
- Exposure of all user data
- Potential database manipulation

**Fix:**
Implemented prepared statements with UUID validation:
```php
$stmt = $db->prepare("SELECT * FROM mobile_beings WHERE mobile_user_id = ?");
$stmt->execute([$validatedUserId]);
```

**Timeline:**
- Reported: Dec 1, 2024
- Acknowledged: Dec 1, 2024
- Fixed: Dec 3, 2024
- Released: Dec 5, 2024 (v1.0.1)

---

## Security Best Practices for Contributors

### Code Review Checklist

- [ ] No sensitive data in logs
- [ ] Input validation on all user data
- [ ] SQL queries use prepared statements
- [ ] No hardcoded secrets/keys
- [ ] HTTPS for all external requests
- [ ] Error messages don't leak system info
- [ ] Authentication/authorization checks in place

### Secrets Management

**Never commit:**
- API keys
- Database passwords
- Private keys
- OAuth secrets

**Instead:**
```javascript
// Use environment variables
import Config from 'react-native-config';
const API_KEY = Config.GOOGLE_MAPS_KEY;

// .env (gitignored)
GOOGLE_MAPS_KEY=actual_key_here
```

### Dependency Security

**Keep dependencies updated:**
```bash
# Check for vulnerabilities
npm audit

# Fix automatically (if possible)
npm audit fix

# Manual review for breaking changes
npm audit fix --force
```

**Dependabot:**
- Enabled for automatic PR creation
- Weekly security updates
- Monthly dependency updates

---

## Incident Response Plan

### Severity Levels

| Level | Response Time | Description |
|-------|--------------|-------------|
| **Critical** | < 24 hours | Data breach, RCE, authentication bypass |
| **High** | < 72 hours | XSS, CSRF, privilege escalation |
| **Medium** | < 7 days | Information disclosure, DoS |
| **Low** | Next release | Minor issues, best practice violations |

### Response Steps

1. **Triage** (Security team)
   - Assess severity
   - Determine affected versions
   - Estimate fix timeline

2. **Develop Fix** (Engineering team)
   - Create private branch
   - Develop and test fix
   - Prepare release notes

3. **Deploy** (DevOps team)
   - Release patched version
   - Update app stores
   - Force update if critical

4. **Communicate** (PR team)
   - Publish security advisory
   - Notify affected users
   - Credit reporter

5. **Post-Mortem** (All teams)
   - Document lessons learned
   - Update processes
   - Prevent similar issues

---

## Security Audit History

| Date | Auditor | Scope | Findings |
|------|---------|-------|----------|
| 2024-12-10 | Internal | API, Database | 0 Critical, 2 Medium (fixed) |
| 2024-12-05 | Internal | Mobile App | 0 Critical, 1 Low (acknowledged) |

**Next Audit:** Planned for Q1 2025 (external audit)

---

## Compliance

### Privacy Regulations

**GDPR (Europe):**
- User data export available
- Right to deletion implemented
- Privacy policy published
- Consent for data collection

**COPPA (USA):**
- Age verification (16+)
- Parental consent for <13 (app not marketed to children)

**CCPA (California):**
- Data disclosure on request
- Opt-out of data sale (we don't sell data)

### App Store Requirements

**Google Play:**
- Data safety form completed
- Privacy policy linked
- Permissions justified

**Apple App Store:**
- Privacy nutrition label
- App tracking transparency
- Restricted APIs approved

---

## Bug Bounty Program

**Status:** Planned for v2.0

**Scope:**
- API endpoints
- Mobile app (iOS/Android)
- Web integration

**Rewards:**
- Critical: $500-1000
- High: $250-500
- Medium: $100-250
- Low: $50-100

**Rules:**
- No social engineering
- No DoS attacks on production
- No public disclosure before fix
- One bounty per unique vulnerability

---

## Resources

### Security Tools

- **OWASP Mobile Top 10:** [link](https://owasp.org/www-project-mobile-top-10/)
- **OWASP API Security:** [link](https://owasp.org/www-project-api-security/)
- **React Native Security:** [link](https://reactnative.dev/docs/security)

### Security Contacts

- **General Security:** security@awakeningprotocol.com
- **Privacy Questions:** privacy@awakeningprotocol.com
- **GDPR Requests:** gdpr@awakeningprotocol.com

---

**Last Updated:** 2025-12-13
**Security Policy Version:** 1.0
**Next Review:** 2025-03-13
