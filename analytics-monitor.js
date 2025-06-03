// Analytics and Monitoring Module
class AnalyticsMonitor {
    constructor() {
        this.sessionId = this.generateSessionId();
        this.startTime = Date.now();
        this.events = [];
        this.maxEvents = 100;
        this.isEnabled = true;
        this.userAgent = navigator.userAgent;
        this.screenResolution = `${screen.width}x${screen.height}`;
        this.language = navigator.language;
    }

    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Event tracking
    trackEvent(category, action, label = '', value = 0) {
        if (!this.isEnabled) return;

        const event = {
            timestamp: Date.now(),
            sessionId: this.sessionId,
            category,
            action,
            label,
            value,
            url: window.location.href,
            userAgent: this.userAgent,
            screenResolution: this.screenResolution,
            language: this.language
        };

        this.events.push(event);

        // Keep only recent events
        if (this.events.length > this.maxEvents) {
            this.events = this.events.slice(-this.maxEvents);
        }

        // Log to console in development
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.log('Analytics Event:', event);
        }

        // Send to analytics service (placeholder)
        this.sendToAnalytics(event);
    }

    // Conversion tracking
    trackConversion(conversionType, fileSize, processingTime, success = true) {
        this.trackEvent('conversion', conversionType, success ? 'success' : 'failure', processingTime);
        
        if (success) {
            this.trackEvent('file_processing', 'size', `${Math.round(fileSize / 1024)}KB`, fileSize);
            this.trackEvent('performance', 'processing_time', `${Math.round(processingTime)}ms`, processingTime);
        }
    }

    // User interaction tracking
    trackUserInteraction(element, action) {
        this.trackEvent('user_interaction', action, element);
    }

    // Error tracking
    trackError(error, context = '') {
        this.trackEvent('error', 'javascript_error', `${context}: ${error.message}`, 0);
        
        // Also log to console
        console.error('Tracked Error:', error, 'Context:', context);
    }

    // Performance tracking
    trackPerformance(metric, value, label = '') {
        this.trackEvent('performance', metric, label, value);
    }

    // Page view tracking
    trackPageView(page = window.location.pathname) {
        this.trackEvent('navigation', 'page_view', page);
    }

    // Feature usage tracking
    trackFeatureUsage(feature, action = 'used') {
        this.trackEvent('feature', action, feature);
    }

    // File type tracking
    trackFileType(fileType, action = 'uploaded') {
        this.trackEvent('file_type', action, fileType);
    }

    // Browser compatibility tracking
    trackBrowserCompatibility() {
        const features = {
            webWorkers: typeof Worker !== 'undefined',
            fileAPI: typeof FileReader !== 'undefined',
            canvas: typeof HTMLCanvasElement !== 'undefined',
            webGL: this.checkWebGLSupport(),
            localStorage: typeof Storage !== 'undefined',
            serviceWorker: 'serviceWorker' in navigator,
            webAssembly: typeof WebAssembly !== 'undefined'
        };

        Object.entries(features).forEach(([feature, supported]) => {
            this.trackEvent('browser_compatibility', feature, supported ? 'supported' : 'not_supported');
        });
    }

    checkWebGLSupport() {
        try {
            const canvas = document.createElement('canvas');
            return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
        } catch (e) {
            return false;
        }
    }

    // Session tracking
    trackSessionDuration() {
        const duration = Date.now() - this.startTime;
        this.trackEvent('session', 'duration', 'milliseconds', duration);
    }

    // Send data to analytics service
    async sendToAnalytics(event) {
        // In a real implementation, you would send to Google Analytics, Mixpanel, etc.
        // For now, we'll store locally and provide export functionality
        
        try {
            const stored = localStorage.getItem('bestofthepdf_analytics') || '[]';
            const analytics = JSON.parse(stored);
            analytics.push(event);
            
            // Keep only last 1000 events
            if (analytics.length > 1000) {
                analytics.splice(0, analytics.length - 1000);
            }
            
            localStorage.setItem('bestofthepdf_analytics', JSON.stringify(analytics));
        } catch (error) {
            console.warn('Failed to store analytics:', error);
        }
    }

    // Get analytics summary
    getAnalyticsSummary() {
        try {
            const stored = localStorage.getItem('bestofthepdf_analytics') || '[]';
            const analytics = JSON.parse(stored);
            
            const summary = {
                totalEvents: analytics.length,
                sessionCount: new Set(analytics.map(e => e.sessionId)).size,
                topActions: this.getTopItems(analytics, 'action'),
                topCategories: this.getTopItems(analytics, 'category'),
                errorCount: analytics.filter(e => e.category === 'error').length,
                conversionCount: analytics.filter(e => e.category === 'conversion').length,
                averageProcessingTime: this.getAverageProcessingTime(analytics),
                browserStats: this.getBrowserStats(analytics),
                timeRange: {
                    start: Math.min(...analytics.map(e => e.timestamp)),
                    end: Math.max(...analytics.map(e => e.timestamp))
                }
            };
            
            return summary;
        } catch (error) {
            console.error('Failed to generate analytics summary:', error);
            return null;
        }
    }

    getTopItems(analytics, field, limit = 5) {
        const counts = {};
        analytics.forEach(event => {
            const value = event[field];
            counts[value] = (counts[value] || 0) + 1;
        });
        
        return Object.entries(counts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, limit)
            .map(([item, count]) => ({ item, count }));
    }

    getAverageProcessingTime(analytics) {
        const processingEvents = analytics.filter(e => 
            e.category === 'performance' && e.action === 'processing_time'
        );
        
        if (processingEvents.length === 0) return 0;
        
        const total = processingEvents.reduce((sum, e) => sum + e.value, 0);
        return Math.round(total / processingEvents.length);
    }

    getBrowserStats(analytics) {
        const browsers = {};
        analytics.forEach(event => {
            const ua = event.userAgent;
            let browser = 'Unknown';
            
            if (ua.includes('Chrome')) browser = 'Chrome';
            else if (ua.includes('Firefox')) browser = 'Firefox';
            else if (ua.includes('Safari')) browser = 'Safari';
            else if (ua.includes('Edge')) browser = 'Edge';
            
            browsers[browser] = (browsers[browser] || 0) + 1;
        });
        
        return browsers;
    }

    // Export analytics data
    exportAnalytics() {
        try {
            const stored = localStorage.getItem('bestofthepdf_analytics') || '[]';
            const analytics = JSON.parse(stored);
            const summary = this.getAnalyticsSummary();
            
            const exportData = {
                summary,
                events: analytics,
                exportDate: new Date().toISOString(),
                version: '1.0'
            };
            
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
                type: 'application/json' 
            });
            
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `bestofthepdf-analytics-${Date.now()}.json`;
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            return true;
        } catch (error) {
            console.error('Failed to export analytics:', error);
            return false;
        }
    }

    // Clear analytics data
    clearAnalytics() {
        try {
            localStorage.removeItem('bestofthepdf_analytics');
            this.events = [];
            return true;
        } catch (error) {
            console.error('Failed to clear analytics:', error);
            return false;
        }
    }

    // Privacy controls
    enableTracking() {
        this.isEnabled = true;
        this.trackEvent('privacy', 'tracking_enabled');
    }

    disableTracking() {
        this.trackEvent('privacy', 'tracking_disabled');
        this.isEnabled = false;
    }

    // Initialize tracking
    initialize() {
        // Track initial page load
        this.trackPageView();
        this.trackBrowserCompatibility();
        
        // Track page unload
        window.addEventListener('beforeunload', () => {
            this.trackSessionDuration();
        });
        
        // Track errors
        window.addEventListener('error', (event) => {
            this.trackError(event.error, 'global_error_handler');
        });
        
        // Track unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.trackError(new Error(event.reason), 'unhandled_promise_rejection');
        });
        
        // Track visibility changes
        document.addEventListener('visibilitychange', () => {
            this.trackEvent('session', 'visibility_change', document.hidden ? 'hidden' : 'visible');
        });
        
        console.log('Analytics initialized for session:', this.sessionId);
    }
}

// Export for use in main application
if (typeof window !== 'undefined') {
    window.AnalyticsMonitor = AnalyticsMonitor;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = AnalyticsMonitor;
}

