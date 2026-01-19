# KudiLoop Security Best Practices

This document outlines the security measures implemented in KudiLoop and best practices for developers.

## Overview

KudiLoop is a fintech application that handles sensitive financial data including:
- User authentication tokens
- PIN codes
- Bank details
- Transaction data

Security is paramount. Follow these guidelines strictly.

## Security Implementation

### 1. Secure Storage

All sensitive data is stored using `expo-secure-store`:
- Uses iOS Keychain (encrypted, hardware-backed)
- Uses Android EncryptedSharedPreferences
- Never use AsyncStorage for sensitive data

```typescript
// ✅ CORRECT - Use secureStorage for sensitive data
import { secureStorage } from '@/services/secureStorage';
await secureStorage.setPin('1234');

// ❌ WRONG - Never use AsyncStorage for sensitive data
import AsyncStorage from '@react-native-async-storage/async-storage';
await AsyncStorage.setItem('pin', '1234'); // INSECURE!
```

### 2. PIN Security

PINs are never stored in plain text:
- Hashed using SHA-256 before storage
- Salted to prevent rainbow table attacks
- Verification compares hashes, not plain text

### 3. Session Timeout

The app implements automatic session timeout:
- Session times out after 5 minutes of inactivity
- Requires re-authentication when returning from background
- Configurable per environment (15 minutes in dev)

### 4. Input Sanitization

All user input is sanitized to prevent injection attacks:
- HTML stripping for text display
- Character whitelisting for financial data
- Length limits on all inputs

```typescript
import { sanitize } from '@/utils/sanitize';

// Sanitize monetary input
const amount = sanitize.money(userInput); // '1234.56'

// Sanitize bank account
const account = sanitize.nigerianBankAccount(userInput); // '1234567890'
```

## For Developers

### Never Do These:

- ❌ Log sensitive data (tokens, PINs, passwords)
- ❌ Store secrets in code or config files
- ❌ Use HTTP (always HTTPS)
- ❌ Trust user input without validation
- ❌ Store sensitive data in AsyncStorage
- ❌ Commit .env files to git
- ❌ Use console.log in production code

### Always Do These:

- ✅ Use `expo-secure-store` for tokens and sensitive data
- ✅ Hash PINs before storing
- ✅ Validate and sanitize all user input
- ✅ Use environment variables for secrets
- ✅ Enable certificate pinning for production
- ✅ Use `__DEV__` checks for development logging
- ✅ Review dependencies for vulnerabilities

## Environment Variables

### Local Development

Create a `.env` file (never commit this):

```bash
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
EXPO_PUBLIC_API_URL=https://kudiloop.com
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=dv5up7vpe
EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET=kudiloop_receipts
```

### EAS Secrets Setup (Production)

1. Go to https://expo.dev/accounts/[account]/projects/kudiloop/secrets
2. Add production secrets:
   - `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `EXPO_PUBLIC_SENTRY_DSN` (optional)
   - `EXPO_PUBLIC_API_URL`

Never put secret keys in `app.json` or `eas.json`.

## API Security

### Token Management

- Auth tokens are refreshed automatically
- Tokens are stored in SecureStore via Clerk
- Failed requests with 401 trigger automatic refresh
- All API calls include `Authorization: Bearer <token>`

### Network Security

- All API calls use HTTPS
- Timeout set to 30 seconds
- Network connectivity checked before requests
- Offline errors handled gracefully

## Code Review Checklist

Before merging code, verify:

- [ ] No sensitive data logged
- [ ] No hardcoded secrets
- [ ] User input is sanitized
- [ ] Sensitive data uses SecureStore
- [ ] Error messages don't leak sensitive info
- [ ] `__DEV__` guards on debug logging
- [ ] No `console.log` without `__DEV__` check

## Testing Security

### Manual Testing

1. **PIN Security**
   - Set a PIN → verify it's hashed (check SecureStore)
   - Enter wrong PIN → verify it doesn't reveal the correct one

2. **Session Timeout**
   - Background app for 6 minutes → should require PIN on return
   - Background app for 2 minutes → should NOT require PIN

3. **Production Build**
   - Build production bundle → verify no console.logs visible
   - Check bundle doesn't contain secrets

### Automated Testing

```bash
# Check for hardcoded secrets
grep -r "sk_" --include="*.ts" --include="*.tsx" .
grep -r "password" --include="*.ts" --include="*.tsx" .

# Run security audit
npm audit
```

## Incident Response

If you discover a security issue:

1. Do NOT commit a fix without review
2. Contact the security team immediately
3. Document the issue privately
4. Follow responsible disclosure practices

## Dependencies

Keep dependencies updated:

```bash
# Check for vulnerabilities
npm audit

# Update dependencies
npm update

# Check Expo compatibility
npx expo-doctor
```

## Production Checklist

Before each release:

- [ ] `npm audit` shows no high/critical vulnerabilities
- [ ] All console.logs wrapped in `__DEV__` checks
- [ ] No test credentials in code
- [ ] SecureStore working on both platforms
- [ ] Session timeout tested
- [ ] API error messages reviewed

## Resources

- [Expo SecureStore Docs](https://docs.expo.dev/versions/latest/sdk/securestore/)
- [React Native Security Guide](https://reactnative.dev/docs/security)
- [OWASP Mobile Security](https://owasp.org/www-project-mobile-security/)
- [Clerk Security](https://clerk.com/docs/security/overview)






