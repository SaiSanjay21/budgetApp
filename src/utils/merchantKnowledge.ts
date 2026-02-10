/**
 * Merchant Knowledge Base
 * 
 * A database of known subscription-based merchants.
 * The system uses this to automatically identify subscription charges
 * even from a single transaction — because we KNOW these merchants
 * operate on a subscription model.
 */

export interface KnownSubscription {
    /** Display name of the service */
    name: string;
    /** Possible names that appear on bank statements */
    aliases: string[];
    /** Typical billing cycle */
    frequency: 'weekly' | 'monthly' | 'yearly' | 'variable';
    /** Typical price range [min, max] in USD */
    priceRange: [number, number];
    /** Category for grouping */
    serviceCategory: 'streaming' | 'music' | 'gaming' | 'productivity' | 'cloud' | 'fitness' | 'news' | 'ai' | 'social' | 'delivery' | 'education' | 'security' | 'finance' | 'other';
    /** Icon/emoji for display */
    icon: string;
}

/**
 * Master list of known subscription services.
 * Each entry includes aliases that might appear on bank/credit card statements.
 */
export const KNOWN_SUBSCRIPTIONS: KnownSubscription[] = [
    // ==================== STREAMING VIDEO ====================
    {
        name: 'Netflix',
        aliases: ['netflix', 'netflix.com', 'netflix inc'],
        frequency: 'monthly',
        priceRange: [6.99, 22.99],
        serviceCategory: 'streaming',
        icon: '🎬',
    },
    {
        name: 'Hulu',
        aliases: ['hulu', 'hulu.com', 'hulu llc'],
        frequency: 'monthly',
        priceRange: [7.99, 17.99],
        serviceCategory: 'streaming',
        icon: '📺',
    },
    {
        name: 'Disney+',
        aliases: ['disney+', 'disney plus', 'disneyplus', 'disney streaming', 'walt disney'],
        frequency: 'monthly',
        priceRange: [7.99, 13.99],
        serviceCategory: 'streaming',
        icon: '🏰',
    },
    {
        name: 'HBO Max',
        aliases: ['hbo', 'hbo max', 'hbomax', 'max.com', 'warner bros'],
        frequency: 'monthly',
        priceRange: [9.99, 15.99],
        serviceCategory: 'streaming',
        icon: '🎭',
    },
    {
        name: 'Paramount+',
        aliases: ['paramount', 'paramount+', 'paramount plus', 'cbs', 'paramountplus'],
        frequency: 'monthly',
        priceRange: [5.99, 11.99],
        serviceCategory: 'streaming',
        icon: '⭐',
    },
    {
        name: 'Peacock',
        aliases: ['peacock', 'peacocktv', 'nbcuniversal'],
        frequency: 'monthly',
        priceRange: [5.99, 11.99],
        serviceCategory: 'streaming',
        icon: '🦚',
    },
    {
        name: 'Apple TV+',
        aliases: ['apple tv', 'apple.com/bill', 'itunes.com/bill'],
        frequency: 'monthly',
        priceRange: [6.99, 6.99],
        serviceCategory: 'streaming',
        icon: '🍎',
    },
    {
        name: 'Amazon Prime Video',
        aliases: ['prime video', 'amazon prime', 'amzn prime', 'amazon digital', 'amzn digital'],
        frequency: 'monthly',
        priceRange: [8.99, 14.99],
        serviceCategory: 'streaming',
        icon: '📦',
    },
    {
        name: 'Crunchyroll',
        aliases: ['crunchyroll', 'crunchy roll'],
        frequency: 'monthly',
        priceRange: [7.99, 14.99],
        serviceCategory: 'streaming',
        icon: '🍙',
    },
    {
        name: 'YouTube Premium',
        aliases: ['youtube premium', 'youtube music', 'google youtube', 'youtube.com'],
        frequency: 'monthly',
        priceRange: [11.99, 22.99],
        serviceCategory: 'streaming',
        icon: '▶️',
    },

    // ==================== MUSIC ====================
    {
        name: 'Spotify',
        aliases: ['spotify', 'spotify usa', 'spotify ab'],
        frequency: 'monthly',
        priceRange: [5.99, 16.99],
        serviceCategory: 'music',
        icon: '🎵',
    },
    {
        name: 'Apple Music',
        aliases: ['apple music', 'apple.com/bill'],
        frequency: 'monthly',
        priceRange: [5.99, 16.99],
        serviceCategory: 'music',
        icon: '🎶',
    },
    {
        name: 'Tidal',
        aliases: ['tidal', 'tidal music'],
        frequency: 'monthly',
        priceRange: [10.99, 19.99],
        serviceCategory: 'music',
        icon: '🌊',
    },
    {
        name: 'Audible',
        aliases: ['audible', 'audible.com', 'audible inc'],
        frequency: 'monthly',
        priceRange: [7.95, 14.95],
        serviceCategory: 'music',
        icon: '🎧',
    },
    {
        name: 'SiriusXM',
        aliases: ['siriusxm', 'sirius xm', 'sirius'],
        frequency: 'monthly',
        priceRange: [7.99, 21.99],
        serviceCategory: 'music',
        icon: '📻',
    },

    // ==================== GAMING ====================
    {
        name: 'PlayStation Plus',
        aliases: ['playstation', 'sony playstation', 'playstation plus', 'psn', 'sony network'],
        frequency: 'monthly',
        priceRange: [9.99, 17.99],
        serviceCategory: 'gaming',
        icon: '🎮',
    },
    {
        name: 'Xbox Game Pass',
        aliases: ['xbox', 'xbox game pass', 'microsoft xbox', 'xbox live'],
        frequency: 'monthly',
        priceRange: [9.99, 19.99],
        serviceCategory: 'gaming',
        icon: '🟢',
    },
    {
        name: 'Nintendo Switch Online',
        aliases: ['nintendo', 'nintendo switch', 'nintendo of america'],
        frequency: 'monthly',
        priceRange: [3.99, 7.99],
        serviceCategory: 'gaming',
        icon: '🔴',
    },
    {
        name: 'EA Play',
        aliases: ['ea play', 'electronic arts', 'ea.com'],
        frequency: 'monthly',
        priceRange: [4.99, 14.99],
        serviceCategory: 'gaming',
        icon: '🕹️',
    },

    // ==================== AI & PRODUCTIVITY ====================
    {
        name: 'ChatGPT Plus',
        aliases: ['openai', 'chatgpt', 'chat gpt', 'openai.com'],
        frequency: 'monthly',
        priceRange: [20.00, 200.00],
        serviceCategory: 'ai',
        icon: '🤖',
    },
    {
        name: 'Claude Pro',
        aliases: ['anthropic', 'claude'],
        frequency: 'monthly',
        priceRange: [20.00, 20.00],
        serviceCategory: 'ai',
        icon: '🧠',
    },
    {
        name: 'Gemini Advanced',
        aliases: ['google one ai', 'gemini'],
        frequency: 'monthly',
        priceRange: [19.99, 19.99],
        serviceCategory: 'ai',
        icon: '✨',
    },
    {
        name: 'Perplexity Pro',
        aliases: ['perplexity'],
        frequency: 'monthly',
        priceRange: [20.00, 20.00],
        serviceCategory: 'ai',
        icon: '🔍',
    },
    {
        name: 'GitHub Copilot',
        aliases: ['github', 'github.com', 'github inc'],
        frequency: 'monthly',
        priceRange: [10.00, 19.00],
        serviceCategory: 'ai',
        icon: '🐙',
    },
    {
        name: 'Grammarly',
        aliases: ['grammarly', 'grammarly inc'],
        frequency: 'monthly',
        priceRange: [12.00, 30.00],
        serviceCategory: 'productivity',
        icon: '✏️',
    },
    {
        name: 'Notion',
        aliases: ['notion', 'notion.so', 'notion labs'],
        frequency: 'monthly',
        priceRange: [8.00, 15.00],
        serviceCategory: 'productivity',
        icon: '📝',
    },
    {
        name: 'Canva Pro',
        aliases: ['canva', 'canva.com', 'canva pty'],
        frequency: 'monthly',
        priceRange: [12.99, 14.99],
        serviceCategory: 'productivity',
        icon: '🎨',
    },
    {
        name: 'Microsoft 365',
        aliases: ['microsoft 365', 'microsoft office', 'microsoft*office', 'msft', 'office 365'],
        frequency: 'monthly',
        priceRange: [6.99, 12.99],
        serviceCategory: 'productivity',
        icon: '💼',
    },
    {
        name: 'Adobe Creative Cloud',
        aliases: ['adobe', 'adobe.com', 'adobe systems', 'adobe creative'],
        frequency: 'monthly',
        priceRange: [9.99, 59.99],
        serviceCategory: 'productivity',
        icon: '🅰️',
    },
    {
        name: 'Slack',
        aliases: ['slack', 'slack technologies'],
        frequency: 'monthly',
        priceRange: [7.25, 12.50],
        serviceCategory: 'productivity',
        icon: '💬',
    },
    {
        name: 'Zoom',
        aliases: ['zoom', 'zoom.us', 'zoom video'],
        frequency: 'monthly',
        priceRange: [13.32, 21.99],
        serviceCategory: 'productivity',
        icon: '📹',
    },
    {
        name: 'Jobright',
        aliases: ['jobright', 'jobright.ai'],
        frequency: 'monthly',
        priceRange: [19.99, 39.99],
        serviceCategory: 'productivity',
        icon: '💼',
    },
    {
        name: 'WhisprGPT',
        aliases: ['whisprgpt', 'whispr'],
        frequency: 'monthly',
        priceRange: [9.99, 19.99],
        serviceCategory: 'ai',
        icon: '🗣️',
    },

    // ==================== CLOUD STORAGE ====================
    {
        name: 'Google One',
        aliases: ['google one', 'google storage', 'google.com/pay', 'google cloud'],
        frequency: 'monthly',
        priceRange: [1.99, 9.99],
        serviceCategory: 'cloud',
        icon: '☁️',
    },
    {
        name: 'iCloud+',
        aliases: ['icloud', 'apple.com/bill icloud', 'apple icloud'],
        frequency: 'monthly',
        priceRange: [0.99, 9.99],
        serviceCategory: 'cloud',
        icon: '🍏',
    },
    {
        name: 'Dropbox',
        aliases: ['dropbox', 'dropbox.com', 'dropbox inc'],
        frequency: 'monthly',
        priceRange: [11.99, 24.00],
        serviceCategory: 'cloud',
        icon: '📁',
    },
    {
        name: 'OneDrive',
        aliases: ['onedrive', 'microsoft onedrive'],
        frequency: 'monthly',
        priceRange: [1.99, 9.99],
        serviceCategory: 'cloud',
        icon: '🔵',
    },

    // ==================== FITNESS ====================
    {
        name: 'Planet Fitness',
        aliases: ['planet fitness', 'planet fit', 'pf membership'],
        frequency: 'monthly',
        priceRange: [10.00, 24.99],
        serviceCategory: 'fitness',
        icon: '💪',
    },
    {
        name: 'LA Fitness',
        aliases: ['la fitness', 'la fit'],
        frequency: 'monthly',
        priceRange: [24.99, 49.99],
        serviceCategory: 'fitness',
        icon: '🏋️',
    },
    {
        name: 'Apple Fitness+',
        aliases: ['apple fitness'],
        frequency: 'monthly',
        priceRange: [9.99, 9.99],
        serviceCategory: 'fitness',
        icon: '🏃',
    },
    {
        name: 'Peloton',
        aliases: ['peloton', 'onepeloton'],
        frequency: 'monthly',
        priceRange: [12.99, 44.00],
        serviceCategory: 'fitness',
        icon: '🚴',
    },
    {
        name: 'Strava',
        aliases: ['strava'],
        frequency: 'monthly',
        priceRange: [5.00, 5.00],
        serviceCategory: 'fitness',
        icon: '🏅',
    },

    // ==================== NEWS & MEDIA ====================
    {
        name: 'NY Times',
        aliases: ['nytimes', 'ny times', 'new york times', 'nyt'],
        frequency: 'monthly',
        priceRange: [4.00, 17.00],
        serviceCategory: 'news',
        icon: '📰',
    },
    {
        name: 'Wall Street Journal',
        aliases: ['wsj', 'wall street journal', 'dow jones'],
        frequency: 'monthly',
        priceRange: [4.00, 12.00],
        serviceCategory: 'news',
        icon: '📈',
    },
    {
        name: 'Washington Post',
        aliases: ['washington post', 'washpost'],
        frequency: 'monthly',
        priceRange: [4.00, 10.00],
        serviceCategory: 'news',
        icon: '🗞️',
    },
    {
        name: 'Medium',
        aliases: ['medium', 'medium.com'],
        frequency: 'monthly',
        priceRange: [5.00, 5.00],
        serviceCategory: 'news',
        icon: '📖',
    },

    // ==================== SOCIAL ====================
    {
        name: 'LinkedIn Premium',
        aliases: ['linkedin', 'linkedin premium', 'linkedin corp'],
        frequency: 'monthly',
        priceRange: [29.99, 59.99],
        serviceCategory: 'social',
        icon: '🔗',
    },
    {
        name: 'Twitter/X Premium',
        aliases: ['twitter', 'x premium', 'x.com'],
        frequency: 'monthly',
        priceRange: [8.00, 16.00],
        serviceCategory: 'social',
        icon: '🐦',
    },
    {
        name: 'Patreon',
        aliases: ['patreon', 'patreon.com'],
        frequency: 'monthly',
        priceRange: [1.00, 100.00],
        serviceCategory: 'social',
        icon: '🎗️',
    },
    {
        name: 'Discord Nitro',
        aliases: ['discord', 'discord nitro', 'discord inc'],
        frequency: 'monthly',
        priceRange: [4.99, 9.99],
        serviceCategory: 'social',
        icon: '🎙️',
    },

    // ==================== DELIVERY ====================
    {
        name: 'DoorDash DashPass',
        aliases: ['doordash', 'dashpass'],
        frequency: 'monthly',
        priceRange: [9.99, 9.99],
        serviceCategory: 'delivery',
        icon: '🚗',
    },
    {
        name: 'Uber One',
        aliases: ['uber one', 'uber pass', 'uber eats pass'],
        frequency: 'monthly',
        priceRange: [9.99, 9.99],
        serviceCategory: 'delivery',
        icon: '🚘',
    },
    {
        name: 'Instacart+',
        aliases: ['instacart', 'instacart+', 'instacart express'],
        frequency: 'monthly',
        priceRange: [9.99, 9.99],
        serviceCategory: 'delivery',
        icon: '🛒',
    },

    // ==================== EDUCATION ====================
    {
        name: 'Coursera Plus',
        aliases: ['coursera'],
        frequency: 'monthly',
        priceRange: [49.00, 59.00],
        serviceCategory: 'education',
        icon: '🎓',
    },
    {
        name: 'Duolingo Plus',
        aliases: ['duolingo'],
        frequency: 'monthly',
        priceRange: [6.99, 13.99],
        serviceCategory: 'education',
        icon: '🦉',
    },
    {
        name: 'Skillshare',
        aliases: ['skillshare'],
        frequency: 'monthly',
        priceRange: [13.99, 13.99],
        serviceCategory: 'education',
        icon: '🎯',
    },
    {
        name: 'MasterClass',
        aliases: ['masterclass'],
        frequency: 'yearly',
        priceRange: [120.00, 240.00],
        serviceCategory: 'education',
        icon: '🌟',
    },

    // ==================== SECURITY / VPN ====================
    {
        name: 'NordVPN',
        aliases: ['nordvpn', 'nord vpn', 'nordsec'],
        frequency: 'monthly',
        priceRange: [3.99, 14.99],
        serviceCategory: 'security',
        icon: '🔒',
    },
    {
        name: 'ExpressVPN',
        aliases: ['expressvpn', 'express vpn'],
        frequency: 'monthly',
        priceRange: [8.32, 12.95],
        serviceCategory: 'security',
        icon: '🛡️',
    },
    {
        name: '1Password',
        aliases: ['1password', 'agilebits'],
        frequency: 'monthly',
        priceRange: [2.99, 7.99],
        serviceCategory: 'security',
        icon: '🔑',
    },
    {
        name: 'LastPass',
        aliases: ['lastpass', 'logmein'],
        frequency: 'monthly',
        priceRange: [3.00, 6.00],
        serviceCategory: 'security',
        icon: '🔐',
    },

    // ==================== FINANCE ====================
    {
        name: 'Amazon Prime',
        aliases: ['amazon prime', 'amzn prime', 'amzn membership', 'amazon.com prime'],
        frequency: 'monthly',
        priceRange: [14.99, 14.99],
        serviceCategory: 'delivery',
        icon: '📦',
    },
    {
        name: 'Kindle Unlimited',
        aliases: ['kindle unlimited', 'kindle', 'amzn kindle'],
        frequency: 'monthly',
        priceRange: [11.99, 11.99],
        serviceCategory: 'education',
        icon: '📚',
    },
];

/**
 * Match a transaction merchant name against the known subscription database.
 * Uses fuzzy matching to handle variations in how names appear on statements.
 * 
 * @returns The matched KnownSubscription, or null if no match found.
 */
export function matchMerchant(merchantName: string): KnownSubscription | null {
    const lower = merchantName.toLowerCase().trim();

    // 1. Exact alias match
    for (const sub of KNOWN_SUBSCRIPTIONS) {
        for (const alias of sub.aliases) {
            if (lower === alias || lower.includes(alias) || alias.includes(lower)) {
                return sub;
            }
        }
    }

    // 2. Fuzzy match — remove common bank statement noise
    const cleaned = lower
        .replace(/[*#]/g, ' ')          // Remove * and #
        .replace(/\b(purchase|debit|pos|ach|recurring|pmt|pymt)\b/gi, '') // Remove noise
        .replace(/\d{3,}/g, '')         // Remove long numbers (reference IDs)
        .replace(/\s+/g, ' ')           // Collapse spaces
        .trim();

    for (const sub of KNOWN_SUBSCRIPTIONS) {
        for (const alias of sub.aliases) {
            if (cleaned.includes(alias) || alias.includes(cleaned)) {
                return sub;
            }
        }
    }

    // 3. Token-based matching — check if any alias words appear in the merchant
    const merchantTokens = cleaned.split(/\s+/);
    for (const sub of KNOWN_SUBSCRIPTIONS) {
        for (const alias of sub.aliases) {
            const aliasTokens = alias.split(/\s+/);
            // If the first significant token of an alias matches any merchant token
            if (aliasTokens.length === 1 && aliasTokens[0].length >= 4) {
                if (merchantTokens.some(t => t.includes(aliasTokens[0]) || aliasTokens[0].includes(t))) {
                    return sub;
                }
            }
        }
    }

    return null;
}

/**
 * Check if a transaction amount falls within the expected price range
 * for a known subscription.
 */
export function isAmountInRange(amount: number, sub: KnownSubscription): boolean {
    const absAmount = Math.abs(amount);
    return absAmount >= sub.priceRange[0] * 0.8 && absAmount <= sub.priceRange[1] * 1.2;
}

/**
 * Service category display config
 */
export const SERVICE_CATEGORY_CONFIG: Record<string, { label: string; color: string }> = {
    streaming: { label: 'Streaming', color: '#e11d48' },
    music: { label: 'Music', color: '#16a34a' },
    gaming: { label: 'Gaming', color: '#7c3aed' },
    productivity: { label: 'Productivity', color: '#2563eb' },
    cloud: { label: 'Cloud Storage', color: '#0891b2' },
    fitness: { label: 'Fitness', color: '#ea580c' },
    news: { label: 'News & Media', color: '#4b5563' },
    ai: { label: 'AI Tools', color: '#8b5cf6' },
    social: { label: 'Social', color: '#0ea5e9' },
    delivery: { label: 'Delivery', color: '#d97706' },
    education: { label: 'Education', color: '#059669' },
    security: { label: 'Security', color: '#dc2626' },
    finance: { label: 'Finance', color: '#15803d' },
    other: { label: 'Other', color: '#6b7280' },
};
