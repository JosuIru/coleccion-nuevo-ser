# Environment Setup Guide

## Overview

This application uses environment variables for sensitive configuration like API keys. **Never commit real credentials to version control.**

## Quick Setup

### For Development

1. **Copy the example env file:**
   ```bash
   cp www/js/core/env.example.js www/js/core/env.js
   ```

2. **Edit `www/js/core/env.js` with your credentials:**
   ```javascript
   window.env = {
     SUPABASE_URL: 'https://your-project.supabase.co',
     SUPABASE_ANON_KEY: 'your_actual_anon_key_here',
     // ... other settings
   };
   ```

3. **Get your Supabase credentials:**
   - Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api
   - Copy the URL and anon/public key

### For Production

**Option 1: Using env.js file (Traditional)**
- Deploy `www/js/core/env.js` with real credentials to your server
- Ensure `.gitignore` prevents committing this file

**Option 2: Using window.__CONFIG__ (Recommended)**
- Inject configuration at build time or via server-side rendering
- Example:
  ```html
  <script>
    window.__CONFIG__ = {
      SUPABASE_URL: '{{ SUPABASE_URL }}',
      SUPABASE_ANON_KEY: '{{ SUPABASE_ANON_KEY }}'
    };
  </script>
  ```

## Configuration Variables

### Required (Critical)

| Variable | Description | Where to get it |
|----------|-------------|-----------------|
| `SUPABASE_URL` | Your Supabase project URL | Supabase Dashboard → Settings → API |
| `SUPABASE_ANON_KEY` | Supabase anonymous/public key | Supabase Dashboard → Settings → API |

### Optional

| Variable | Description | Default |
|----------|-------------|---------|
| `STRIPE_PUBLISHABLE_KEY` | Stripe public key for payments | '' |
| `RECAPTCHA_SITE_KEY` | Google reCAPTCHA site key | '' |
| `NODE_ENV` | Environment mode | 'development' |
| `DEBUG_MODE` | Enable debug logging | false |

## File Structure

```
coleccion-nuevo-ser/
├── www/
│   ├── .env.example              # Example environment file (reference)
│   └── js/
│       ├── config/
│       │   └── env.js            # 🆕 Environment config module
│       └── core/
│           ├── env.example.js    # Example env.js file
│           ├── env.js            # Your actual credentials (git-ignored)
│           └── supabase-config.js # Reads from env.js
```

## Security Notes

1. **Never commit `env.js`** - It's in `.gitignore` for a reason
2. **Only public keys in frontend** - Never put secret keys in client-side code
3. **Rotate keys if exposed** - If you accidentally commit keys, rotate them immediately
4. **Use different keys for dev/prod** - Keep development and production credentials separate

## Troubleshooting

### "Supabase credentials not found" warning
- You haven't created `www/js/core/env.js`
- Follow the Quick Setup steps above

### "Usando valores de desarrollo en producción" warning
- You deployed to production without configuring env.js
- Create env.js with real credentials on your production server

### Features not working
- Check browser console for configuration errors
- Verify all required variables are set in env.js
- Ensure Supabase URL and key are correct

## Migration Notes (v2.9.197)

If you're upgrading from a previous version:
- Hardcoded fallback credentials have been removed for security
- You **must** configure env.js for the app to work
- The new `www/js/config/env.js` module provides better configuration management

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Stripe API Keys](https://stripe.com/docs/keys)
- [Google reCAPTCHA](https://www.google.com/recaptcha/about/)
