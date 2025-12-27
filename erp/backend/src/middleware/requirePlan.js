// src/middleware/requirePlan.js
// Middleware to check if company has required subscription plan/feature

import * as subscriptionService from '../services/subscriptionService.js';

// Check if company has access to a specific feature
export function requireFeature(featureName) {
    return async (req, res, next) => {
        try {
            const { companyId } = req.user || {};

            if (!companyId) {
                return res.status(403).json({
                    success: false,
                    error: 'Company required to access this feature',
                    code: 'NO_COMPANY'
                });
            }

            const hasAccess = await subscriptionService.checkFeatureAccess(companyId, featureName);

            if (!hasAccess) {
                const subscription = await subscriptionService.getCompanySubscription(companyId);
                return res.status(403).json({
                    success: false,
                    error: `Your current plan (${subscription.plan_display_name}) does not include ${featureName}. Please upgrade to access this feature.`,
                    code: 'FEATURE_LOCKED',
                    feature: featureName,
                    currentPlan: subscription.plan_name,
                    upgradeUrl: '/settings/billing'
                });
            }

            next();
        } catch (err) {
            console.error('Error checking feature access:', err);
            // Don't block on error - allow access (fail open for now)
            next();
        }
    };
}

// Check if company is within user limit
export async function checkUserLimit(req, res, next) {
    try {
        const { companyId } = req.user || {};

        if (!companyId) {
            return next();
        }

        const limits = await subscriptionService.getCompanyLimits(companyId);

        // Get current employee count
        const pool = (await import('../db/pool.js')).default;
        const result = await pool.query(
            `SELECT COUNT(*) as count FROM users WHERE company_id = $1 AND is_active = true`,
            [companyId]
        );
        const currentUsers = parseInt(result.rows[0].count);

        if (currentUsers >= limits.maxUsers) {
            return res.status(403).json({
                success: false,
                error: `You have reached the maximum user limit (${limits.maxUsers}) for your ${limits.planName} plan. Please upgrade to add more users.`,
                code: 'USER_LIMIT_REACHED',
                currentUsers,
                maxUsers: limits.maxUsers,
                upgradeUrl: '/settings/billing'
            });
        }

        // Attach limits to request for use in controller
        req.planLimits = limits;
        next();
    } catch (err) {
        console.error('Error checking user limit:', err);
        next();
    }
}

// Require minimum plan level
export function requirePlan(minPlanLevel) {
    const planLevels = {
        'free': 1,
        'starter': 2,
        'professional': 3,
        'enterprise': 4
    };

    return async (req, res, next) => {
        try {
            const { companyId } = req.user || {};

            if (!companyId) {
                return res.status(403).json({
                    success: false,
                    error: 'Company required',
                    code: 'NO_COMPANY'
                });
            }

            const subscription = await subscriptionService.getCompanySubscription(companyId);
            const currentLevel = planLevels[subscription.plan_name] || 1;
            const requiredLevel = planLevels[minPlanLevel] || 1;

            if (currentLevel < requiredLevel) {
                return res.status(403).json({
                    success: false,
                    error: `This feature requires ${minPlanLevel} plan or higher. You are on ${subscription.plan_display_name}.`,
                    code: 'PLAN_REQUIRED',
                    required: minPlanLevel,
                    current: subscription.plan_name,
                    upgradeUrl: '/settings/billing'
                });
            }

            next();
        } catch (err) {
            console.error('Error checking plan:', err);
            next();
        }
    };
}

export default { requireFeature, requirePlan, checkUserLimit };
