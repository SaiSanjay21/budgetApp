import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDataStore } from '../store/useDataStore';
import { useMemo } from 'react';
import { detectSubscriptions, groupByCard } from '../utils/subscriptionDetector';
import { useRouter } from 'expo-router';

export function SubscriptionWidget() {
    const { transactions, accounts } = useDataStore();
    const router = useRouter();

    const allSubscriptions = useMemo(
        () => detectSubscriptions(transactions, accounts),
        [transactions, accounts]
    );

    const cardGroups = useMemo(
        () => groupByCard(allSubscriptions, accounts),
        [allSubscriptions, accounts]
    );

    const totalMonthly = useMemo(
        () => cardGroups.reduce((sum, g) => sum + g.totalMonthly, 0),
        [cardGroups]
    );

    const activeCount = allSubscriptions.filter(s => s.isActive).length;

    if (activeCount === 0) return null;

    // Get the next upcoming charge
    const nextCharge = useMemo(() => {
        const now = new Date();
        const upcoming = allSubscriptions
            .filter(s => s.isActive && new Date(s.nextExpectedDate) >= now)
            .sort((a, b) => new Date(a.nextExpectedDate).getTime() - new Date(b.nextExpectedDate).getTime());
        return upcoming[0] || null;
    }, [allSubscriptions]);

    return (
        <TouchableOpacity
            onPress={() => router.push('/(tabs)/subscriptions')}
            activeOpacity={0.85}
            style={{
                backgroundColor: '#7c3aed',
                padding: 16,
                borderRadius: 16,
                marginBottom: 24,
                overflow: 'hidden',
                position: 'relative',
            }}
        >
            {/* Decorative circles */}
            <View style={{
                position: 'absolute', right: -20, top: -20,
                width: 100, height: 100, borderRadius: 50,
                backgroundColor: 'rgba(255,255,255,0.08)',
            }} />
            <View style={{
                position: 'absolute', right: 40, bottom: -30,
                width: 80, height: 80, borderRadius: 40,
                backgroundColor: 'rgba(255,255,255,0.05)',
            }} />

            {/* Top row */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={{
                        width: 36, height: 36, borderRadius: 18,
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        alignItems: 'center', justifyContent: 'center',
                    }}>
                        <Ionicons name="infinite" size={20} color="white" />
                    </View>
                    <View>
                        <Text style={{ color: '#ddd6fe', fontSize: 11, fontWeight: '600', letterSpacing: 0.5 }}>
                            RECURRING SUBSCRIPTIONS
                        </Text>
                        <Text style={{ color: 'white', fontSize: 22, fontWeight: 'bold' }}>
                            ${totalMonthly.toFixed(2)}<Text style={{ fontSize: 13, fontWeight: '400', color: '#c4b5fd' }}>/mo</Text>
                        </Text>
                    </View>
                </View>

                <View style={{ alignItems: 'center' }}>
                    <View style={{
                        backgroundColor: 'rgba(255,255,255,0.15)',
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderRadius: 12,
                    }}>
                        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>{activeCount}</Text>
                    </View>
                    <Text style={{ color: '#c4b5fd', fontSize: 10, marginTop: 2 }}>active</Text>
                </View>
            </View>

            {/* Cards breakdown mini preview */}
            {cardGroups.length > 0 && (
                <View style={{
                    flexDirection: 'row',
                    marginTop: 12,
                    gap: 8,
                    flexWrap: 'wrap',
                }}>
                    {cardGroups.slice(0, 3).map(group => (
                        <View key={group.account.id} style={{
                            backgroundColor: 'rgba(255,255,255,0.12)',
                            paddingHorizontal: 10,
                            paddingVertical: 6,
                            borderRadius: 8,
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 4,
                        }}>
                            <Ionicons
                                name={group.account.type === 'credit' ? 'card' : 'wallet'}
                                size={12}
                                color="#e9d5ff"
                            />
                            <Text style={{ color: '#e9d5ff', fontSize: 11 }}>
                                {group.subscriptions.length} subs
                            </Text>
                            <Text style={{ color: 'white', fontSize: 11, fontWeight: '600' }}>
                                ${group.totalMonthly.toFixed(0)}
                            </Text>
                        </View>
                    ))}
                </View>
            )}

            {/* Next charge info */}
            {nextCharge && (
                <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginTop: 12,
                    paddingTop: 12,
                    borderTopWidth: 1,
                    borderTopColor: 'rgba(255,255,255,0.1)',
                    justifyContent: 'space-between',
                }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={{ fontSize: 14 }}>{nextCharge.icon}</Text>
                        <Text style={{ color: '#c4b5fd', fontSize: 12 }}>
                            Next: <Text style={{ color: 'white', fontWeight: '500' }}>
                                {nextCharge.displayName}
                            </Text> on {new Date(nextCharge.nextExpectedDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={14} color="#c4b5fd" />
                </View>
            )}
        </TouchableOpacity>
    );
}
