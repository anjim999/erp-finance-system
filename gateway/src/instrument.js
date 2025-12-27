// Sentry Initialization - Import this FIRST in index.js
// Captures errors, performance, and logs for monitoring

import * as Sentry from "@sentry/node";

Sentry.init({
    dsn: process.env.SENTRY_DSN,

    // Environment tag (development, staging, production)
    environment: process.env.NODE_ENV || 'development',

    // Send default PII data (IP address, etc.)
    sendDefaultPii: true,

    // Performance Monitoring - sample 100% of transactions in dev, 10% in prod
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Profiles for performance (optional)
    profilesSampleRate: 0.1,
});

console.log('[SENTRY] ✅ Monitoring initialized');

export default Sentry;
