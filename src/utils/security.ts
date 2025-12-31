/**
 * Security Configuration
 * 
 * IMPORTANT: For production deployment:
 * 1. Replace demo auth with Firebase Auth or OAuth provider
 * 2. Enable HTTPS only
 * 3. Use environment variables for all API keys
 * 4. Enable biometric authentication for sensitive operations
 * 5. Implement certificate pinning for API calls
 */

export const SECURITY_CONFIG = {
    // Session management
    SESSION_TIMEOUT_MINUTES: 30,
    MAX_LOGIN_ATTEMPTS: 5,
    LOCKOUT_DURATION_MINUTES: 15,

    // Data protection
    ENCRYPT_LOCAL_STORAGE: true,
    REQUIRE_BIOMETRIC_FOR_TRANSACTIONS: true,

    // Network security
    API_TIMEOUT_MS: 30000,
    REQUIRE_HTTPS: true,

    // Plaid/Bank integration (placeholder)
    PLAID_ENV: 'sandbox', // Change to 'production' for real accounts
};

// Rate limiting for API calls
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(key: string, maxAttempts: number = 10, windowMs: number = 60000): boolean {
    const now = Date.now();
    const existing = rateLimitMap.get(key);

    if (!existing || now > existing.resetTime) {
        rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
        return true;
    }

    if (existing.count >= maxAttempts) {
        return false;
    }

    existing.count++;
    return true;
}

// Input sanitization
export function sanitizeInput(input: string): string {
    if (typeof input !== 'string') return '';
    return input
        .trim()
        .replace(/[<>]/g, '') // Prevent XSS
        .slice(0, 500); // Limit length
}

// Validate amount input for transactions
export function validateAmount(amount: string): { valid: boolean; value: number; error?: string } {
    const num = parseFloat(amount);

    if (isNaN(num)) {
        return { valid: false, value: 0, error: 'Invalid amount' };
    }

    if (num <= 0) {
        return { valid: false, value: 0, error: 'Amount must be positive' };
    }

    if (num > 1000000) {
        return { valid: false, value: 0, error: 'Amount exceeds limit' };
    }

    // Round to 2 decimal places
    const rounded = Math.round(num * 100) / 100;
    return { valid: true, value: rounded };
}
