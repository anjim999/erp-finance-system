// Cache Invalidation Utilities for Vyapar360 Gateway
// Functions to clear cache when data is modified

import { deleteCachePattern, deleteCache } from '../utils/cache.js';

// ============================================
// CACHE INVALIDATION FUNCTIONS
// ============================================

/**
 * Invalidate all companies-related cache
 * Call this when any company data is modified
 */
export const invalidateCompaniesCache = async () => {
    try {
        console.log('[CACHE INVALIDATION] Clearing companies cache...');
        await deleteCachePattern('companies:*');
        console.log('[CACHE INVALIDATION] Companies cache cleared');
        return true;
    } catch (error) {
        console.error('[CACHE INVALIDATION] Error clearing companies cache:', error.message);
        return false;
    }
};

/**
 * Invalidate cache for a specific company
 * @param {string} slug - Company slug
 */
export const invalidateCompanyCache = async (slug) => {
    try {
        console.log(`[CACHE INVALIDATION] Clearing cache for company: ${slug}`);

        // Clear company detail cache
        await deleteCache(`companies:detail:${slug}`);

        // Also clear the listing cache since company data changed
        await deleteCachePattern('companies:public:*');

        console.log(`[CACHE INVALIDATION] Company ${slug} cache cleared`);
        return true;
    } catch (error) {
        console.error('[CACHE INVALIDATION] Error:', error.message);
        return false;
    }
};

/**
 * Invalidate all marketplace reviews cache
 * Call this when reviews are added/modified
 */
export const invalidateMarketplaceReviewsCache = async () => {
    try {
        console.log('[CACHE INVALIDATION] Clearing marketplace reviews cache...');
        await deleteCachePattern('marketplace:reviews:*');
        console.log('[CACHE INVALIDATION] Marketplace reviews cache cleared');
        return true;
    } catch (error) {
        console.error('[CACHE INVALIDATION] Error:', error.message);
        return false;
    }
};

/**
 * Invalidate reviews cache for a specific company
 * @param {string} companyId - Company ID
 */
export const invalidateCompanyReviewsCache = async (companyId) => {
    try {
        console.log(`[CACHE INVALIDATION] Clearing reviews cache for company: ${companyId}`);
        await deleteCache(`marketplace:reviews:${companyId}`);
        console.log(`[CACHE INVALIDATION] Reviews cache for company ${companyId} cleared`);
        return true;
    } catch (error) {
        console.error('[CACHE INVALIDATION] Error:', error.message);
        return false;
    }
};

/**
 * Invalidate static data cache (industries, cities)
 * Call this when static data is modified (rarely needed)
 */
export const invalidateStaticDataCache = async () => {
    try {
        console.log('[CACHE INVALIDATION] Clearing static data cache...');
        await deleteCache('companies:industries');
        await deleteCache('companies:cities');
        console.log('[CACHE INVALIDATION] Static data cache cleared');
        return true;
    } catch (error) {
        console.error('[CACHE INVALIDATION] Error:', error.message);
        return false;
    }
};

/**
 * Invalidate ALL gateway cache
 * Use with caution - only for maintenance/debugging
 */
export const invalidateAllCache = async () => {
    try {
        console.log('[CACHE INVALIDATION] ⚠️ Clearing ALL gateway cache...');
        await deleteCachePattern('companies:*');
        await deleteCachePattern('marketplace:*');
        await deleteCachePattern('gateway:*');
        console.log('[CACHE INVALIDATION] ✅ All gateway cache cleared');
        return true;
    } catch (error) {
        console.error('[CACHE INVALIDATION] Error:', error.message);
        return false;
    }
};
