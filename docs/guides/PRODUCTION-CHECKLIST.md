# Production Deployment Checklist

## Pre-Deployment

### Environment Configuration
- [ ] Copy `.env.example` to `.env` in www/
- [ ] Configure `SUPABASE_URL` (production project)
- [ ] Configure `SUPABASE_ANON_KEY` (production project)
- [ ] Configure `STRIPE_PUBLISHABLE_KEY` (pk_live_...)
- [ ] Configure `STRIPE_SECRET_KEY` in Edge Functions (sk_live_...)
- [ ] Configure `STRIPE_WEBHOOK_SECRET` (whsec_...)
- [ ] Configure `RECAPTCHA_SITE_KEY` and secret
- [ ] Configure `RESEND_API_KEY` for emails
- [ ] Set `NODE_ENV=production`
- [ ] Set `DEBUG_MODE=false`
- [ ] Run `./scripts/setup-env.sh validate`

### Supabase Configuration
- [ ] Create production Supabase project
- [ ] Run all migrations (001_initial_schema.sql, 002_email_triggers.sql)
- [ ] Verify RLS policies are active on all tables
- [ ] Configure auth email templates
- [ ] Set up database backups (daily)
- [ ] Configure rate limiting if available

### Stripe Configuration
- [ ] Switch from test mode to live mode
- [ ] Create production products and prices
- [ ] Update price IDs in code if different from test
- [ ] Configure webhook endpoint in Stripe dashboard
- [ ] Test webhook signature verification
- [ ] Set up Stripe tax settings if applicable

### Edge Functions
- [ ] Deploy `create-checkout-session` function
- [ ] Deploy `stripe-webhook` function
- [ ] Deploy `send-email` function
- [ ] Configure environment secrets in Supabase dashboard
- [ ] Test each function with production credentials

### Security
- [ ] Verify no API keys in frontend code (only public keys)
- [ ] Verify no secrets in git repository
- [ ] Enable HTTPS only
- [ ] Configure CORS properly
- [ ] Review RLS policies
- [ ] Enable MFA for admin accounts

## Deployment

### Web Deployment
- [ ] Build production assets
- [ ] Upload to hosting (Vercel, Netlify, etc.)
- [ ] Configure custom domain
- [ ] Set up SSL certificate
- [ ] Configure CDN caching
- [ ] Test all pages load correctly

### Android Deployment
- [ ] Update version in build.gradle
- [ ] Run `npx cap sync`
- [ ] Build release APK: `./gradlew assembleRelease`
- [ ] Sign APK with production keystore
- [ ] Test on multiple devices
- [ ] Upload to Google Play Console
- [ ] Complete store listing

## Post-Deployment Testing

### Authentication Flow
- [ ] Test sign up with email verification
- [ ] Test login/logout
- [ ] Test password reset
- [ ] Test session persistence
- [ ] Test social logins (if enabled)

### Payment Flow
- [ ] Test Premium subscription purchase
- [ ] Test Pro subscription purchase
- [ ] Verify credits assigned after payment
- [ ] Test subscription cancellation
- [ ] Test webhook processing
- [ ] Check Stripe dashboard for events

### AI Features
- [ ] Test AI chat feature (Premium)
- [ ] Test quiz generation (Premium)
- [ ] Test summary generation (Premium)
- [ ] Test Game Master features (Pro)
- [ ] Verify credits consumed correctly
- [ ] Test upgrade prompts for Free users

### Email System
- [ ] Test welcome email on signup
- [ ] Test payment confirmation email
- [ ] Test low credits warning
- [ ] Test renewal reminder
- [ ] Check spam folder delivery

### Mobile App
- [ ] Test all features on Android
- [ ] Test offline functionality
- [ ] Test push notifications (if enabled)
- [ ] Test deep links

## Monitoring Setup

### Error Tracking
- [ ] Set up Sentry or similar
- [ ] Configure error alerts
- [ ] Test error reporting

### Analytics
- [ ] Set up Google Analytics / Plausible
- [ ] Configure conversion tracking
- [ ] Set up event tracking for key actions

### Performance
- [ ] Set up uptime monitoring
- [ ] Configure performance alerts
- [ ] Set up database query monitoring

### Logs
- [ ] Configure log retention
- [ ] Set up log alerts for errors
- [ ] Document log access procedures

## Documentation

- [ ] Update README with production info
- [ ] Document deployment process
- [ ] Document rollback procedures
- [ ] Create incident response plan
- [ ] Document support procedures

## Final Verification

- [ ] All checklist items complete
- [ ] Team members have access to monitoring
- [ ] Support email configured
- [ ] Backup restore tested
- [ ] Launch communication prepared

---

**Deployment Date:** _______________

**Deployed By:** _______________

**Sign-off:** _______________
