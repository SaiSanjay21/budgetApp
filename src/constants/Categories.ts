export const SPENDING_CATEGORIES = [
    'Groceries',
    'Dining',
    'Utilities',
    'Transportation',
    'Shopping',
    'Entertainment',
    'Healthcare',
    'Subscriptions',
    'Credit Card Payment',
    'Savings Transfer',
    'Miscellaneous',
] as const;

export type Category = typeof SPENDING_CATEGORIES[number];

export const CATEGORY_COLORS: Record<Category, string> = {
    'Groceries': '#4CAF50', // Green
    'Dining': '#FF9800', // Orange
    'Utilities': '#2196F3', // Blue
    'Transportation': '#9C27B0', // Purple
    'Shopping': '#E91E63', // Pink
    'Entertainment': '#FFC107', // Amber
    'Healthcare': '#F44336', // Red
    'Subscriptions': '#607D8B', // Blue Grey
    'Credit Card Payment': '#795548', // Brown
    'Savings Transfer': '#009688', // Teal
    'Miscellaneous': '#9E9E9E', // Grey
};
