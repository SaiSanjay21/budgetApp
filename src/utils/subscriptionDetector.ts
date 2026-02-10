import { Transaction, BankAccount } from '../types';
import { matchMerchant, KnownSubscription, isAmountInRange } from './merchantKnowledge';

export interface DetectedSubscription {
    id: string;
    merchantName: string;
    /** Cleaned/recognized display name (e.g. "Netflix" instead of "NETFLIX.COM 800-123-4567") */
    displayName: string;
    accountId: string;
    accountName: string;
    accountType: string;
    latestAmount: number;
    averageAmount: number;
    frequency: 'weekly' | 'monthly' | 'yearly' | 'variable' | 'irregular';
    firstChargeDate: string;
    lastChargeDate: string;
    nextExpectedDate: string;
    totalSpent: number;
    chargeCount: number;
    charges: Transaction[]; // Full timeline of charges
    isActive: boolean;
    category: string;
    /** If matched to a known subscription service */
    knownService: KnownSubscription | null;
    /** Confidence level of the detection */
    confidence: 'high' | 'medium' | 'low';
    /** Icon for display */
    icon: string;
}

export interface CardSubscriptionGroup {
    account: BankAccount;
    subscriptions: DetectedSubscription[];
    totalMonthly: number;
}

/**
 * Detect recurring subscriptions from transaction history.
 * 
 * Strategy:
 * 1. KNOWN MERCHANT MATCHING — Check every transaction against the merchant knowledge base.
 *    Even a single charge from Netflix will be detected because we KNOW Netflix is a subscription.
 * 2. RECURRING PATTERN DETECTION — For unknown merchants, look for recurring charges
 *    (same merchant, similar amount, 2+ occurrences).
 */
export function detectSubscriptions(
    transactions: Transaction[],
    accounts: BankAccount[]
): DetectedSubscription[] {
    const subscriptions: DetectedSubscription[] = [];
    const processedKeys = new Set<string>();

    // ========================
    // PHASE 1: Known Merchant Matching
    // This catches subscriptions even from a SINGLE transaction
    // ========================

    // Group all transactions by normalized merchant + account
    const merchantAccountGroups = new Map<string, {
        charges: Transaction[];
        knownService: KnownSubscription;
    }>();

    for (const tx of transactions) {
        const matched = matchMerchant(tx.merchantName);
        if (!matched) continue;

        // Check if the amount is in the expected range for this service
        // (prevents matching a $500 Amazon purchase as "Amazon Prime $14.99")
        if (!isAmountInRange(tx.amount, matched)) continue;

        const key = `${matched.name.toLowerCase().replace(/\s+/g, '_')}__${tx.accountId}`;

        if (!merchantAccountGroups.has(key)) {
            merchantAccountGroups.set(key, {
                charges: [],
                knownService: matched,
            });
        }
        merchantAccountGroups.get(key)!.charges.push(tx);
    }

    // Build DetectedSubscription for each known service match
    merchantAccountGroups.forEach((data, key) => {
        const { charges, knownService } = data;
        processedKeys.add(key);

        const sub = buildSubscriptionFromCharges(
            charges,
            accounts,
            knownService,
            knownService.frequency === 'variable' ? 'monthly' : knownService.frequency,
            'high'
        );
        subscriptions.push(sub);
    });

    // ========================
    // PHASE 2: Recurring Pattern Detection
    // For merchants NOT in the knowledge base
    // ========================

    // Group ALL expense transactions by merchant + account
    const allGroups = new Map<string, Transaction[]>();

    for (const tx of transactions) {
        if (tx.amount >= 0) continue; // Only expenses

        const normName = normalizeMerchant(tx.merchantName);
        const key = `${normName}__${tx.accountId}`;

        // Skip if already detected in Phase 1
        const alreadyDetected = Array.from(processedKeys).some(pk => {
            return pk.split('__')[1] === tx.accountId &&
                matchMerchant(tx.merchantName) !== null;
        });
        if (alreadyDetected) continue;

        if (!allGroups.has(key)) {
            allGroups.set(key, []);
        }
        allGroups.get(key)!.push(tx);
    }

    // Only consider groups with 2+ charges AND similar amounts
    allGroups.forEach((charges, key) => {
        if (charges.length < 2) return;
        if (processedKeys.has(key)) return;

        const amounts = charges.map(tx => Math.abs(tx.amount));
        const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
        const allSimilar = amounts.every(a => Math.abs(a - avg) / avg < 0.25);

        if (!allSimilar) return;

        // Also check that the category suggests it could be recurring
        const isSuggestedCategory = charges.some(tx =>
            tx.category === 'Subscriptions' ||
            tx.category === 'Membership' ||
            tx.category === 'Entertainment' ||
            tx.category === 'Utilities'
        );

        // For non-suggested categories, require 3+ charges to reduce false positives
        if (!isSuggestedCategory && charges.length < 3) return;

        processedKeys.add(key);

        const sub = buildSubscriptionFromCharges(
            charges,
            accounts,
            null,
            undefined,
            charges.length >= 3 ? 'medium' : 'low'
        );
        subscriptions.push(sub);
    });

    // Sort by confidence first, then by latest charge
    return subscriptions.sort((a, b) => {
        const confOrder = { high: 0, medium: 1, low: 2 };
        const confDiff = confOrder[a.confidence] - confOrder[b.confidence];
        if (confDiff !== 0) return confDiff;
        return new Date(b.lastChargeDate).getTime() - new Date(a.lastChargeDate).getTime();
    });
}

/**
 * Group subscriptions by card/account
 */
export function groupByCard(
    subscriptions: DetectedSubscription[],
    accounts: BankAccount[]
): CardSubscriptionGroup[] {
    const groups = new Map<string, DetectedSubscription[]>();

    subscriptions.forEach(sub => {
        if (!groups.has(sub.accountId)) {
            groups.set(sub.accountId, []);
        }
        groups.get(sub.accountId)!.push(sub);
    });

    const result: CardSubscriptionGroup[] = [];

    groups.forEach((subs, accountId) => {
        const account = accounts.find(a => a.id === accountId) || {
            id: accountId,
            name: 'Unknown Account',
            type: 'savings' as const,
            institution: 'Unknown',
            balance: 0,
            currency: 'USD',
            lastSynced: new Date().toISOString(),
        };

        const totalMonthly = subs
            .filter(s => s.isActive)
            .reduce((sum, s) => {
                if (s.frequency === 'monthly') return sum + s.latestAmount;
                if (s.frequency === 'yearly') return sum + s.latestAmount / 12;
                if (s.frequency === 'weekly') return sum + s.latestAmount * 4.33;
                return sum + s.latestAmount; // variable/irregular — assume monthly
            }, 0);

        result.push({ account, subscriptions: subs, totalMonthly });
    });

    return result.sort((a, b) => b.totalMonthly - a.totalMonthly);
}

// ============================================================
// Internal helpers
// ============================================================

function buildSubscriptionFromCharges(
    charges: Transaction[],
    accounts: BankAccount[],
    knownService: KnownSubscription | null,
    overrideFrequency?: 'weekly' | 'monthly' | 'yearly',
    confidence: 'high' | 'medium' | 'low' = 'medium'
): DetectedSubscription {
    const sortedCharges = [...charges].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const accountId = sortedCharges[0].accountId;
    const account = accounts.find(a => a.id === accountId);
    const amounts = sortedCharges.map(tx => Math.abs(tx.amount));
    const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const totalSpent = amounts.reduce((a, b) => a + b, 0);

    const firstDate = sortedCharges[0].date;
    const lastDate = sortedCharges[sortedCharges.length - 1].date;
    const frequency = overrideFrequency || detectFrequency(sortedCharges);
    const nextDate = estimateNextCharge(lastDate, frequency);

    // Consider active if last charge was within reasonable timeframe
    const daysSinceLastCharge = Math.floor(
        (Date.now() - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    const isActive = frequency === 'monthly' ? daysSinceLastCharge < 45 :
        frequency === 'yearly' ? daysSinceLastCharge < 400 :
            frequency === 'weekly' ? daysSinceLastCharge < 14 :
                daysSinceLastCharge < 60;

    // Use the known service display name if available
    const displayName = knownService?.name || sortedCharges[0].merchantName;
    const icon = knownService?.icon || '🔄';

    return {
        id: `sub_${normalizeMerchant(displayName)}_${accountId}`,
        merchantName: sortedCharges[0].merchantName,
        displayName,
        accountId,
        accountName: account?.name || 'Unknown Account',
        accountType: account?.type || 'savings',
        latestAmount: Math.abs(sortedCharges[sortedCharges.length - 1].amount),
        averageAmount: avgAmount,
        frequency,
        firstChargeDate: firstDate,
        lastChargeDate: lastDate,
        nextExpectedDate: nextDate,
        totalSpent,
        chargeCount: sortedCharges.length,
        charges: sortedCharges,
        isActive,
        category: knownService?.serviceCategory || sortedCharges[0].category,
        knownService,
        confidence,
        icon,
    };
}

function normalizeMerchant(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 20);
}

function detectFrequency(charges: Transaction[]): 'weekly' | 'monthly' | 'yearly' | 'irregular' {
    if (charges.length < 2) return 'monthly'; // Default assumption

    const gaps: number[] = [];
    for (let i = 1; i < charges.length; i++) {
        const diff = Math.abs(
            new Date(charges[i].date).getTime() - new Date(charges[i - 1].date).getTime()
        );
        gaps.push(diff / (1000 * 60 * 60 * 24)); // days
    }

    const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;

    if (avgGap < 10) return 'weekly';
    if (avgGap >= 25 && avgGap <= 35) return 'monthly';
    if (avgGap >= 350 && avgGap <= 380) return 'yearly';
    return 'irregular';
}

function estimateNextCharge(lastDate: string, frequency: string): string {
    const last = new Date(lastDate);

    switch (frequency) {
        case 'weekly':
            last.setDate(last.getDate() + 7);
            break;
        case 'monthly':
            last.setMonth(last.getMonth() + 1);
            break;
        case 'yearly':
            last.setFullYear(last.getFullYear() + 1);
            break;
        default:
            last.setMonth(last.getMonth() + 1);
    }

    return last.toISOString().split('T')[0];
}
