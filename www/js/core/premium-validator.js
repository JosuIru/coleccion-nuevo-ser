/**
// 🔧 FIX v2.9.198: Migrated console.log to logger
 * Premium System Validator
 * Validates that all Premium + IA modules are correctly loaded and configured
 *
 * @version 1.0.0
 */

class PremiumValidator {
    constructor() {
        this.results = {
            passed: [],
            failed: [],
            warnings: []
        };
    }

    /**
     * Run all validations
     */
    async runAllValidations() {
        logger.debug('🔍 Starting Premium System Validation...\n');
        this.results = { passed: [], failed: [], warnings: [] };

        await this.validateModulesLoaded();
        await this.validateSupabaseConnection();
        await this.validateAuthState();
        await this.validateCreditsSystem();
        await this.validateUIComponents();

        this.printReport();
        return this.results;
    }

    /**
     * Validate that all required modules are loaded
     */
    async validateModulesLoaded() {
        logger.debug('📦 Checking modules...');

        const requiredModules = [
            { name: 'supabaseConfig', global: 'supabaseConfig', critical: true },
            { name: 'supabase', global: 'supabase', critical: true },
            { name: 'authHelper', global: 'authHelper', critical: true },
            { name: 'aiPremium', global: 'aiPremium', critical: false },
            { name: 'aiBookFeatures', global: 'aiBookFeatures', critical: false },
            { name: 'aiGameMaster', global: 'aiGameMaster', critical: false },
            { name: 'iaIntegration', global: 'iaIntegration', critical: false },
            { name: 'lazyLoader', global: 'lazyLoader', critical: true }
        ];

        for (const module of requiredModules) {
            if (window[module.global]) {
                this.pass(`Module ${module.name} loaded`);
            } else if (module.critical) {
                this.fail(`Critical module ${module.name} NOT loaded`);
            } else {
                this.warn(`Optional module ${module.name} not loaded (may need lazy loading)`);
            }
        }
    }

    /**
     * Validate Supabase connection
     */
    async validateSupabaseConnection() {
        logger.debug('🔌 Checking Supabase connection...');

        if (!window.supabase) {
            this.fail('Supabase client not initialized');
            return;
        }

        try {
            // Test connection with a simple query
            const { data, error } = await window.supabase
                .from('profiles')
                .select('count')
                .limit(1);

            if (error) {
                // Check if it's just an auth error (which is expected if not logged in)
                if (error.message.includes('JWT') || error.code === 'PGRST301') {
                    this.pass('Supabase connection working (auth required for data)');
                } else {
                    this.warn(`Supabase query warning: ${error.message}`);
                }
            } else {
                this.pass('Supabase connection successful');
            }
        } catch (err) {
            this.fail(`Supabase connection error: ${err.message}`);
        }
    }

    /**
     * Validate authentication state
     */
    async validateAuthState() {
        logger.debug('🔐 Checking auth state...');

        if (!window.authHelper) {
            this.warn('authHelper not available, skipping auth validation');
            return;
        }

        try {
            const user = window.authHelper.getUser();

            if (user) {
                this.pass(`User authenticated: ${user.email}`);

                // Check profile
                const profile = await window.authHelper.getProfile();
                if (profile) {
                    this.pass(`Profile loaded: tier=${profile.subscription_tier || 'free'}`);
                } else {
                    this.warn('User authenticated but profile not found');
                }
            } else {
                this.pass('No user authenticated (normal state)');
            }
        } catch (err) {
            this.warn(`Auth state check warning: ${err.message}`);
        }
    }

    /**
     * Validate credits system
     */
    async validateCreditsSystem() {
        logger.debug('💰 Checking credits system...');

        if (!window.aiPremium) {
            this.warn('aiPremium not loaded, attempting lazy load...');

            if (window.lazyLoader) {
                try {
                    await window.lazyLoader.load('ai-features');
                    await new Promise(resolve => setTimeout(resolve, 500));
                } catch (err) {
                    this.warn('Could not lazy load ai-features');
                    return;
                }
            }
        }

        if (!window.aiPremium) {
            this.warn('aiPremium still not available after lazy load');
            return;
        }

        // Check methods exist
        const requiredMethods = [
            'hasFeature',
            'checkCredits',
            'getCreditsRemaining',
            'getDaysUntilReset'
        ];

        for (const method of requiredMethods) {
            if (typeof window.aiPremium[method] === 'function') {
                this.pass(`aiPremium.${method}() available`);
            } else {
                this.fail(`aiPremium.${method}() NOT available`);
            }
        }

        // Check if user has credits info (if authenticated)
        if (window.authHelper?.getUser()) {
            try {
                const credits = window.aiPremium.getCreditsRemaining();
                const days = window.aiPremium.getDaysUntilReset();
                this.pass(`Credits info: ${credits} remaining, resets in ${days} days`);
            } catch (err) {
                this.warn(`Credits info error: ${err.message}`);
            }
        }
    }

    /**
     * Validate UI components
     */
    async validateUIComponents() {
        logger.debug('🎨 Checking UI components...');

        // Check for key DOM elements
        const elements = [
            { selector: '#app', name: 'Main app container', critical: true },
            { selector: '.book-reader', name: 'Book reader', critical: false },
            { selector: '#ai-credits-widget-container', name: 'Credits widget', critical: false }
        ];

        for (const el of elements) {
            const element = document.querySelector(el.selector);
            if (element) {
                this.pass(`UI element ${el.name} found`);
            } else if (el.critical) {
                this.fail(`Critical UI element ${el.name} NOT found`);
            } else {
                this.warn(`Optional UI element ${el.name} not found (may appear later)`);
            }
        }

        // Check CSS loaded
        const hasAIStyles = Array.from(document.styleSheets).some(sheet =>
            sheet.href && sheet.href.includes('ai-features.css')
        );

        if (hasAIStyles) {
            this.pass('AI features CSS loaded');
        } else {
            this.warn('AI features CSS not yet loaded');
        }
    }

    /**
     * Add passed result
     */
    pass(message) {
        this.results.passed.push(message);
        logger.debug(`  ✅ ${message}`);
    }

    /**
     * Add failed result
     */
    fail(message) {
        this.results.failed.push(message);
        logger.debug(`  ❌ ${message}`);
    }

    /**
     * Add warning result
     */
    warn(message) {
        this.results.warnings.push(message);
        logger.debug(`  ⚠️ ${message}`);
    }

    /**
     * Print final report
     */
    printReport() {
        logger.debug('\n' + '='.repeat(50));
        logger.debug('📊 VALIDATION REPORT');
        logger.debug('='.repeat(50));
        logger.debug(`✅ Passed: ${this.results.passed.length}`);
        logger.debug(`❌ Failed: ${this.results.failed.length}`);
        logger.debug(`⚠️ Warnings: ${this.results.warnings.length}`);
        logger.debug('='.repeat(50));

        if (this.results.failed.length === 0) {
            logger.debug('🎉 All critical validations passed!');
        } else {
            logger.debug('🚨 Some validations failed. Please review the errors above.');
        }

        return {
            success: this.results.failed.length === 0,
            ...this.results
        };
    }

    /**
     * Quick check - returns boolean
     */
    async quickCheck() {
        const results = await this.runAllValidations();
        return results.failed.length === 0;
    }
}

// Create global instance
window.premiumValidator = new PremiumValidator();

// Auto-run validation if in debug mode
if (window.supabaseConfig?.debugMode || window.location.search.includes('validate=true')) {
    document.addEventListener('DOMContentLoaded', async () => {
        // Wait a bit for all modules to load
        await new Promise(resolve => setTimeout(resolve, 1000));
        window.premiumValidator.runAllValidations();
    });
}

logger.debug('🔍 PremiumValidator loaded. Run: premiumValidator.runAllValidations()');
