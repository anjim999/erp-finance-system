// Gateway Cache Invalidation Service
// Calls gateway to clear cached data when company data changes

import { GATEWAY_URL, GATEWAY_INTERNAL_SECRET } from '../config/env.js';

/**
 * Call gateway to invalidate cache
 * @param {string} endpoint - Cache invalidation endpoint path
 * @returns {Promise<boolean>} - Success status
 */
const invalidateGatewayCache = async (endpoint) => {
    const gatewayUrl = GATEWAY_URL;
    const internalSecret = GATEWAY_INTERNAL_SECRET;

    try {
        const response = await fetch(`${gatewayUrl}/api/internal/cache/invalidate/${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-internal-secret': internalSecret || ''
            }
        });

        const data = await response.json();

        if (data.success) {
            console.log(`[CACHE] ✅ Gateway cache invalidated: ${endpoint}`);
            return true;
        } else {
            console.error(`[CACHE] ❌ Failed to invalidate gateway cache: ${endpoint}`, data);
            return false;
        }
    } catch (error) {
        console.error(`[CACHE] ❌ Error calling gateway cache invalidation:`, error.message);
        return false;
    }
};

/**
 * Invalidate all companies cache
 * Call this after creating, updating, or deleting a company
 */
export const invalidateCompaniesCache = async () => {
    return await invalidateGatewayCache('companies');
};

/**
 * Invalidate specific company cache
 * @param {string} slug - Company slug
 */
export const invalidateCompanyCache = async (slug) => {
    return await invalidateGatewayCache(`company/${slug}`);
};

/**
 * Invalidate reviews cache for a company
 * @param {string|number} companyId - Company ID
 */
export const invalidateReviewsCache = async (companyId) => {
    return await invalidateGatewayCache(`reviews/${companyId}`);
};

/**
 * Invalidate all gateway cache
 * Use with caution - only for major data changes
 */
export const invalidateAllCache = async () => {
    return await invalidateGatewayCache('all');
};
