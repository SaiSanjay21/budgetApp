/**
 * Expense Predictor
 *
 * Predicts next month's expenses by combining:
 * 1. Active subscription costs (from subscriptionDetector, minus dismissed ones)
 * 2. Historical category average spending (groceries, dining, internet/AI, etc.)
 */

import { Transaction } from '../types';
import { DetectedSubscription } from './subscriptionDetector';

/** Spending categories we track for prediction */
export const PREDICTION_CATEGORIES = [
    { key: 'Groceries', label: 'Groceries', icon: '🛒', color: '#16a34a' },
    { key: 'Dining', label: 'Dining Out', icon: '🍽️', color: '#ea580c' },
    { key: 'Internet_AI', label: 'Internet & AI', icon: '🌐', color: '#7c3aed' },
    { key: 'Transportation', label: 'Transportation', icon: '🚗', color: '#0891b2' },
    { key: 'Shopping', label: 'Shopping', icon: '🛍️', color: '#db2777' },
    { key: 'Utilities', label: 'Utilities', icon: '💡', color: '#ca8a04' },
    { key: 'Healthcare', label: 'Healthcare', icon: '🏥', color: '#dc2626' },
    { key: 'Entertainment', label: 'Entertainment', icon: '🎬', color: '#9333ea' },
    { key: 'Subscriptions', label: 'Subscriptions', icon: '🔄', color: '#6366f1' },
    { key: 'Other', label: 'Other', icon: '📋', color: '#6b7280' },
] as const;

/** Maps transaction categories to our prediction categories */
function mapToCategory(txCategory: string): string {
    const categoryMap: Record<string, string> = {
        'Groceries': 'Groceries',
        'Dining': 'Dining',
        'Utilities': 'Utilities',
        'Transportation': 'Transportation',
        'Shopping': 'Shopping',
        'Entertainment': 'Entertainment',
        'Healthcare': 'Healthcare',
        'Subscriptions': 'Subscriptions',
        'Membership': 'Subscriptions',
        // Internet & AI grouping
        'AI Tools': 'Internet_AI',
    };

    // Check for subscription-related categories -> Internet_AI
    const lower = txCategory.toLowerCase();
    if (lower.includes('subscription') || lower.includes('membership')) {
        return 'Internet_AI';
    }

    return categoryMap[txCategory] || 'Other';
}

export interface CategoryPrediction {
    category: string;
    label: string;
    icon: string;
    color: string;
    /** Average monthly spend in this category */
    averageMonthly: number;
    /** Number of months of data used for calculation */
    monthsOfData: number;
    /** How many transactions contributed */
    transactionCount: number;
    /** Trend: increasing, decreasing, or stable */
    trend: 'up' | 'down' | 'stable';
    /** Percentage change from previous month */
    trendPercent: number;
}

export interface ExpensePrediction {
    /** Total predicted monthly expense */
    totalPredicted: number;
    /** Subscription portion (from active, non-dismissed subscriptions) */
    subscriptionTotal: number;
    /** Non-subscription variable spending prediction */
    variableTotal: number;
    /** Breakdown by category */
    categories: CategoryPrediction[];
    /** Number of months of data used */
    monthsAnalyzed: number;
    /** Confidence: more data = higher confidence */
    confidence: 'high' | 'medium' | 'low';
}

/**
 * Predict next month's expenses.
 *
 * @param transactions All historical transactions
 * @param activeSubscriptions Detected active subscriptions (already filtered for dismissed)
 */
export function predictMonthlyExpenses(
    transactions: Transaction[],
    activeSubscriptions: DetectedSubscription[]
): ExpensePrediction {
    // 1. Calculate subscription total
    const subscriptionTotal = activeSubscriptions.reduce((sum, sub) => {
        if (sub.frequency === 'monthly') return sum + sub.latestAmount;
        if (sub.frequency === 'yearly') return sum + sub.latestAmount / 12;
        if (sub.frequency === 'weekly') return sum + sub.latestAmount * 4.33;
        return sum + sub.latestAmount; // variable/irregular - assume monthly
    }, 0);

    // 2. Analyze historical spending by category (excluding subscription charges)
    const expenses = transactions.filter(tx => tx.amount < 0);

    if (expenses.length === 0) {
        return {
            totalPredicted: subscriptionTotal,
            subscriptionTotal,
            variableTotal: 0,
            categories: [],
            monthsAnalyzed: 0,
            confidence: 'low',
        };
    }

    // Build subscription merchant set to exclude from variable spending
    const subscriptionMerchants = new Set(
        activeSubscriptions.map(s => s.merchantName.toLowerCase())
    );

    // Group expenses by month
    const monthlySpending: Record<string, Record<string, number>> = {};
    const monthTransactionCounts: Record<string, Record<string, number>> = {};

    for (const tx of expenses) {
        // Skip subscription charges (they're counted separately)
        if (subscriptionMerchants.has(tx.merchantName.toLowerCase())) continue;

        const monthKey = tx.date.substring(0, 7); // "2025-01"
        const category = mapToCategory(tx.category);

        if (!monthlySpending[monthKey]) {
            monthlySpending[monthKey] = {};
            monthTransactionCounts[monthKey] = {};
        }

        monthlySpending[monthKey][category] =
            (monthlySpending[monthKey][category] || 0) + Math.abs(tx.amount);
        monthTransactionCounts[monthKey][category] =
            (monthTransactionCounts[monthKey][category] || 0) + 1;
    }

    const months = Object.keys(monthlySpending).sort();
    const monthCount = months.length;

    if (monthCount === 0) {
        return {
            totalPredicted: subscriptionTotal,
            subscriptionTotal,
            variableTotal: 0,
            categories: [],
            monthsAnalyzed: 0,
            confidence: 'low',
        };
    }

    // 3. Calculate category averages and trends
    const categories: CategoryPrediction[] = [];
    let variableTotal = 0;

    for (const cat of PREDICTION_CATEGORIES) {
        // Skip the subscriptions category (it's handled separately)
        if (cat.key === 'Subscriptions') continue;

        // Also skip Internet_AI here — it will be combined with subscription total
        // Actually, let's keep it for non-subscription internet/AI charges

        const monthlyValues: number[] = months.map(m => monthlySpending[m][cat.key] || 0);
        const totalTxCount = months.reduce(
            (sum, m) => sum + (monthTransactionCounts[m]?.[cat.key] || 0), 0
        );

        // Skip categories with no transactions
        if (totalTxCount === 0) continue;

        // Weighted average: recent months count more
        const avg = weightedAverage(monthlyValues);

        // Calculate trend
        let trend: 'up' | 'down' | 'stable' = 'stable';
        let trendPercent = 0;

        if (monthlyValues.length >= 2) {
            const lastMonth = monthlyValues[monthlyValues.length - 1];
            const prevMonth = monthlyValues[monthlyValues.length - 2];

            if (prevMonth > 0) {
                trendPercent = ((lastMonth - prevMonth) / prevMonth) * 100;
                if (trendPercent > 10) trend = 'up';
                else if (trendPercent < -10) trend = 'down';
            }
        }

        variableTotal += avg;

        categories.push({
            category: cat.key,
            label: cat.label,
            icon: cat.icon,
            color: cat.color,
            averageMonthly: avg,
            monthsOfData: monthCount,
            transactionCount: totalTxCount,
            trend,
            trendPercent: Math.round(trendPercent),
        });
    }

    // Add Subscriptions as a special category at the top
    categories.unshift({
        category: 'Subscriptions',
        label: 'Subscriptions & Internet',
        icon: '🔄',
        color: '#6366f1',
        averageMonthly: subscriptionTotal,
        monthsOfData: monthCount,
        transactionCount: activeSubscriptions.length,
        trend: 'stable',
        trendPercent: 0,
    });

    // Sort by average monthly (highest first), but keep subscriptions at top
    const subCategory = categories.shift()!;
    categories.sort((a, b) => b.averageMonthly - a.averageMonthly);
    categories.unshift(subCategory);

    const totalPredicted = subscriptionTotal + variableTotal;

    // Confidence based on data amount
    const confidence: 'high' | 'medium' | 'low' =
        monthCount >= 3 ? 'high' :
            monthCount >= 2 ? 'medium' : 'low';

    return {
        totalPredicted,
        subscriptionTotal,
        variableTotal,
        categories,
        monthsAnalyzed: monthCount,
        confidence,
    };
}

/**
 * Weighted average: recent values have more weight.
 * Last month = weight 3, second-to-last = weight 2, rest = weight 1
 */
function weightedAverage(values: number[]): number {
    if (values.length === 0) return 0;
    if (values.length === 1) return values[0];

    let totalWeight = 0;
    let weightedSum = 0;

    for (let i = 0; i < values.length; i++) {
        const weight = i === values.length - 1 ? 3 :
            i === values.length - 2 ? 2 : 1;
        weightedSum += values[i] * weight;
        totalWeight += weight;
    }

    return weightedSum / totalWeight;
}
