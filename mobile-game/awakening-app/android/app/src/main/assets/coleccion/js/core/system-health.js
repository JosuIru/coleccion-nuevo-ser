/**
 * System Health Monitor
 * Real-time health dashboard for the Premium IA system
 *
 * @version 1.0.0
 */

class SystemHealth {
    constructor() {
        this.status = {
            overall: 'unknown',
            components: {}
        };
        this.checkInterval = null;
    }

    /**
     * Run health check on all components
     */
    async checkHealth() {
        console.log('🏥 Running system health check...\n');

        const checks = [
            { name: 'supabase', fn: () => this.checkSupabase() },
            { name: 'auth', fn: () => this.checkAuth() },
            { name: 'edgeFunctions', fn: () => this.checkEdgeFunctions() },
            { name: 'credits', fn: () => this.checkCredits() },
            { name: 'modules', fn: () => this.checkModules() },
            { name: 'storage', fn: () => this.checkStorage() }
        ];

        for (const check of checks) {
            try {
                this.status.components[check.name] = await check.fn();
            } catch (err) {
                this.status.components[check.name] = {
                    status: 'error',
                    message: err.message
                };
            }
        }

        // Calculate overall status
        const statuses = Object.values(this.status.components).map(c => c.status);
        if (statuses.every(s => s === 'healthy')) {
            this.status.overall = 'healthy';
        } else if (statuses.some(s => s === 'error')) {
            this.status.overall = 'error';
        } else {
            this.status.overall = 'degraded';
        }

        this.printStatus();
        return this.status;
    }

    /**
     * Check Supabase connectivity
     */
    async checkSupabase() {
        if (!window.supabase) {
            return { status: 'error', message: 'Supabase client not loaded' };
        }

        const startTime = Date.now();
        try {
            // Simple health check query
            const { error } = await window.supabase.rpc('health_check').catch(() => ({
                error: null // RPC may not exist, which is fine
            }));

            // Try a basic query as fallback
            await window.supabase.from('profiles').select('count').limit(1);

            const latency = Date.now() - startTime;
            return {
                status: 'healthy',
                latency: `${latency}ms`,
                url: window.supabaseConfig?.url?.substring(0, 30) + '...'
            };
        } catch (err) {
            // Even auth errors mean connection works
            if (err.message?.includes('JWT') || err.code === 'PGRST301') {
                return {
                    status: 'healthy',
                    message: 'Connected (auth required for queries)'
                };
            }
            return { status: 'error', message: err.message };
        }
    }

    /**
     * Check authentication status
     */
    async checkAuth() {
        if (!window.authHelper) {
            return { status: 'warning', message: 'Auth helper not loaded' };
        }

        const user = window.authHelper.getUser();
        if (user) {
            return {
                status: 'healthy',
                authenticated: true,
                email: user.email,
                tier: user.user_metadata?.subscription_tier || 'free'
            };
        }

        return {
            status: 'healthy',
            authenticated: false,
            message: 'No user logged in'
        };
    }

    /**
     * Check Edge Functions availability
     */
    async checkEdgeFunctions() {
        if (!window.supabase) {
            return { status: 'error', message: 'Supabase not available' };
        }

        const functions = [
            'create-checkout-session',
            'stripe-webhook',
            'send-email'
        ];

        const results = {};
        let allAvailable = true;

        for (const fn of functions) {
            try {
                // We can't really call the functions without proper params,
                // but we can check if they respond (even with error)
                const { error } = await window.supabase.functions.invoke(fn, {
                    body: { healthCheck: true }
                });

                // Any response means the function exists
                results[fn] = error ? 'available (auth required)' : 'available';
            } catch (err) {
                // 404 means function doesn't exist
                if (err.message?.includes('404')) {
                    results[fn] = 'not deployed';
                    allAvailable = false;
                } else {
                    results[fn] = 'available';
                }
            }
        }

        return {
            status: allAvailable ? 'healthy' : 'warning',
            functions: results
        };
    }

    /**
     * Check credits system
     */
    async checkCredits() {
        if (!window.aiPremium) {
            return { status: 'warning', message: 'aiPremium not loaded' };
        }

        if (!window.authHelper?.getUser()) {
            return {
                status: 'healthy',
                message: 'Credits check skipped (not authenticated)'
            };
        }

        try {
            const remaining = window.aiPremium.getCreditsRemaining();
            const daysUntilReset = window.aiPremium.getDaysUntilReset();

            return {
                status: remaining > 0 ? 'healthy' : 'warning',
                creditsRemaining: remaining,
                daysUntilReset: daysUntilReset,
                lowCredits: remaining < 100
            };
        } catch (err) {
            return { status: 'error', message: err.message };
        }
    }

    /**
     * Check loaded modules
     */
    checkModules() {
        const modules = {
            supabaseConfig: !!window.supabaseConfig,
            supabase: !!window.supabase,
            authHelper: !!window.authHelper,
            aiPremium: !!window.aiPremium,
            aiBookFeatures: !!window.aiBookFeatures,
            aiGameMaster: !!window.aiGameMaster,
            iaIntegration: !!window.iaIntegration,
            lazyLoader: !!window.lazyLoader
        };

        const loadedCount = Object.values(modules).filter(Boolean).length;
        const totalCount = Object.keys(modules).length;

        return {
            status: loadedCount >= 4 ? 'healthy' : 'warning',
            loaded: `${loadedCount}/${totalCount}`,
            modules
        };
    }

    /**
     * Check local storage
     */
    checkStorage() {
        try {
            // Check if storage is available
            const testKey = '__health_check__';
            localStorage.setItem(testKey, 'test');
            localStorage.removeItem(testKey);

            // Check storage usage
            let totalSize = 0;
            for (const key in localStorage) {
                if (localStorage.hasOwnProperty(key)) {
                    totalSize += localStorage[key].length * 2; // UTF-16 = 2 bytes per char
                }
            }

            const usedMB = (totalSize / (1024 * 1024)).toFixed(2);
            const maxMB = 5; // ~5MB limit for localStorage

            return {
                status: 'healthy',
                usedMB,
                maxMB,
                percentUsed: `${((totalSize / (maxMB * 1024 * 1024)) * 100).toFixed(1)}%`,
                authKey: !!localStorage.getItem('nuevosser-auth')
            };
        } catch (err) {
            return { status: 'error', message: err.message };
        }
    }

    /**
     * Print status to console
     */
    printStatus() {
        const statusEmoji = {
            healthy: '🟢',
            warning: '🟡',
            error: '🔴',
            degraded: '🟠',
            unknown: '⚪'
        };

        console.log('\n' + '═'.repeat(50));
        console.log(`${statusEmoji[this.status.overall]} SYSTEM HEALTH: ${this.status.overall.toUpperCase()}`);
        console.log('═'.repeat(50));

        for (const [name, data] of Object.entries(this.status.components)) {
            const emoji = statusEmoji[data.status] || '⚪';
            console.log(`\n${emoji} ${name.toUpperCase()}`);

            for (const [key, value] of Object.entries(data)) {
                if (key !== 'status') {
                    if (typeof value === 'object') {
                        console.log(`   ${key}:`, value);
                    } else {
                        console.log(`   ${key}: ${value}`);
                    }
                }
            }
        }

        console.log('\n' + '═'.repeat(50));
        console.log(`Checked at: ${new Date().toLocaleString()}`);
        console.log('═'.repeat(50) + '\n');
    }

    /**
     * Get status as JSON
     */
    getStatus() {
        return {
            ...this.status,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Start periodic health checks
     */
    startMonitoring(intervalMs = 60000) {
        this.stopMonitoring();
        console.log(`🔄 Starting health monitoring (every ${intervalMs / 1000}s)`);
        this.checkHealth();
        this.checkInterval = setInterval(() => this.checkHealth(), intervalMs);
    }

    /**
     * Stop periodic health checks
     */
    stopMonitoring() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
            console.log('⏹️ Health monitoring stopped');
        }
    }

    /**
     * Create HTML dashboard
     */
    createDashboard(containerId = 'health-dashboard') {
        let container = document.getElementById(containerId);

        if (!container) {
            container = document.createElement('div');
            container.id = containerId;
            document.body.appendChild(container);
        }

        const statusColors = {
            healthy: '#10b981',
            warning: '#f59e0b',
            error: '#ef4444',
            degraded: '#f97316',
            unknown: '#6b7280'
        };

        const html = `
            <style>
                #${containerId} {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    background: #1e293b;
                    border-radius: 12px;
                    padding: 16px;
                    font-family: system-ui, sans-serif;
                    font-size: 14px;
                    color: #e2e8f0;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.3);
                    z-index: 10000;
                    min-width: 280px;
                }
                #${containerId} h3 {
                    margin: 0 0 12px 0;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                #${containerId} .status-dot {
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                    display: inline-block;
                }
                #${containerId} .component {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 6px 0;
                    border-bottom: 1px solid #334155;
                }
                #${containerId} .component:last-child {
                    border-bottom: none;
                }
                #${containerId} button {
                    margin-top: 12px;
                    padding: 8px 16px;
                    background: #3b82f6;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    width: 100%;
                }
                #${containerId} button:hover {
                    background: #2563eb;
                }
                #${containerId} .close-btn {
                    position: absolute;
                    top: 8px;
                    right: 8px;
                    background: none;
                    border: none;
                    color: #94a3b8;
                    cursor: pointer;
                    font-size: 18px;
                    width: auto;
                    padding: 4px 8px;
                    margin: 0;
                }
            </style>
            <button class="close-btn" onclick="document.getElementById('${containerId}').remove()">×</button>
            <h3>
                <span class="status-dot" style="background: ${statusColors[this.status.overall]}"></span>
                System Health
            </h3>
            ${Object.entries(this.status.components).map(([name, data]) => `
                <div class="component">
                    <span>${name}</span>
                    <span class="status-dot" style="background: ${statusColors[data.status]}"></span>
                </div>
            `).join('')}
            <button onclick="window.systemHealth.checkHealth().then(() => window.systemHealth.createDashboard())">
                🔄 Refresh
            </button>
        `;

        container.innerHTML = html;
    }
}

// Create global instance
window.systemHealth = new SystemHealth();

console.log('🏥 SystemHealth loaded. Run: systemHealth.checkHealth()');
