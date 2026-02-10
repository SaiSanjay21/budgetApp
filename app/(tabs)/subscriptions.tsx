import { View, Text, ScrollView, TouchableOpacity, Pressable, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDataStore } from '../../src/store/useDataStore';
import { useMemo, useState } from 'react';
import {
    detectSubscriptions,
    groupByCard,
    DetectedSubscription,
} from '../../src/utils/subscriptionDetector';
import { SERVICE_CATEGORY_CONFIG } from '../../src/utils/merchantKnowledge';

const FREQUENCY_LABELS: Record<string, string> = {
    weekly: 'Weekly',
    monthly: 'Monthly',
    yearly: 'Yearly',
    variable: 'Variable',
    irregular: 'Irregular',
};

const FREQUENCY_COLORS: Record<string, string> = {
    weekly: '#f59e0b',
    monthly: '#8b5cf6',
    yearly: '#3b82f6',
    variable: '#14b8a6',
    irregular: '#6b7280',
};

const CONFIDENCE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    high: { label: 'Verified Service', color: '#16a34a', bg: '#dcfce7' },
    medium: { label: 'Likely Recurring', color: '#d97706', bg: '#fef3c7' },
    low: { label: 'Possible', color: '#6b7280', bg: '#f3f4f6' },
};

export default function SubscriptionsScreen() {
    const { transactions, accounts, dismissedSubscriptionIds, dismissSubscription, restoreSubscription } = useDataStore();
    const [selectedSub, setSelectedSub] = useState<DetectedSubscription | null>(null);
    const [expandedCard, setExpandedCard] = useState<string | null>(null);

    const allDetected = useMemo(
        () => detectSubscriptions(transactions, accounts),
        [transactions, accounts]
    );

    // Split into active (non-dismissed) and dismissed
    const allSubscriptions = useMemo(
        () => allDetected.filter(s => !dismissedSubscriptionIds.includes(s.id)),
        [allDetected, dismissedSubscriptionIds]
    );

    const dismissedSubscriptions = useMemo(
        () => allDetected.filter(s => dismissedSubscriptionIds.includes(s.id)),
        [allDetected, dismissedSubscriptionIds]
    );

    const cardGroups = useMemo(
        () => groupByCard(allSubscriptions, accounts),
        [allSubscriptions, accounts]
    );

    const totalMonthly = useMemo(
        () => cardGroups.reduce((sum, g) => sum + g.totalMonthly, 0),
        [cardGroups]
    );

    const totalYearly = totalMonthly * 12;
    const activeCount = allSubscriptions.filter(s => s.isActive).length;
    const verifiedCount = allSubscriptions.filter(s => s.confidence === 'high').length;

    const toggleCard = (accountId: string) => {
        setExpandedCard(expandedCard === accountId ? null : accountId);
    };

    const handleDismiss = (sub: DetectedSubscription) => {
        Alert.alert(
            `Remove ${sub.displayName}?`,
            'This subscription will be excluded from your expense predictions. You can restore it later.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: () => dismissSubscription(sub.id),
                },
            ]
        );
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }} edges={['top']}>
            {/* Header */}
            <View style={{
                paddingHorizontal: 16,
                paddingBottom: 12,
                borderBottomWidth: 1,
                borderBottomColor: '#e5e7eb',
                backgroundColor: 'white',
            }}>
                <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#111827', marginVertical: 8 }}>
                    Subscriptions
                </Text>
                <Text style={{ fontSize: 12, color: '#6b7280' }}>
                    {verifiedCount} verified • {allSubscriptions.length - verifiedCount} detected from patterns
                </Text>
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
                {/* Summary Cards */}
                <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
                    <View style={{
                        flex: 1,
                        backgroundColor: '#7c3aed',
                        padding: 16,
                        borderRadius: 16,
                    }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                            <View style={{
                                width: 32, height: 32, borderRadius: 16,
                                backgroundColor: 'rgba(255,255,255,0.2)',
                                alignItems: 'center', justifyContent: 'center',
                            }}>
                                <Ionicons name="calendar" size={16} color="white" />
                            </View>
                        </View>
                        <Text style={{ color: '#ddd6fe', fontSize: 11, fontWeight: '600' }}>MONTHLY</Text>
                        <Text style={{ color: 'white', fontSize: 22, fontWeight: 'bold' }}>
                            ${totalMonthly.toFixed(2)}
                        </Text>
                    </View>

                    <View style={{
                        flex: 1,
                        backgroundColor: '#1e40af',
                        padding: 16,
                        borderRadius: 16,
                    }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                            <View style={{
                                width: 32, height: 32, borderRadius: 16,
                                backgroundColor: 'rgba(255,255,255,0.2)',
                                alignItems: 'center', justifyContent: 'center',
                            }}>
                                <Ionicons name="trending-up" size={16} color="white" />
                            </View>
                        </View>
                        <Text style={{ color: '#bfdbfe', fontSize: 11, fontWeight: '600' }}>YEARLY</Text>
                        <Text style={{ color: 'white', fontSize: 22, fontWeight: 'bold' }}>
                            ${totalYearly.toFixed(0)}
                        </Text>
                    </View>

                    <View style={{
                        flex: 0.7,
                        backgroundColor: '#065f46',
                        padding: 16,
                        borderRadius: 16,
                    }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                            <View style={{
                                width: 32, height: 32, borderRadius: 16,
                                backgroundColor: 'rgba(255,255,255,0.2)',
                                alignItems: 'center', justifyContent: 'center',
                            }}>
                                <Ionicons name="checkmark-circle" size={16} color="white" />
                            </View>
                        </View>
                        <Text style={{ color: '#a7f3d0', fontSize: 11, fontWeight: '600' }}>ACTIVE</Text>
                        <Text style={{ color: 'white', fontSize: 22, fontWeight: 'bold' }}>{activeCount}</Text>
                    </View>
                </View>

                {/* Empty State */}
                {cardGroups.length === 0 && (
                    <View style={{
                        backgroundColor: 'white',
                        padding: 32,
                        borderRadius: 16,
                        alignItems: 'center',
                    }}>
                        <Text style={{ fontSize: 48, marginBottom: 12 }}>🔍</Text>
                        <Text style={{ fontSize: 18, fontWeight: '600', color: '#374151', marginBottom: 8 }}>
                            No Subscriptions Found
                        </Text>
                        <Text style={{ color: '#6b7280', textAlign: 'center' }}>
                            Import your bank statements to automatically detect recurring subscriptions.
                        </Text>
                    </View>
                )}

                {/* Card Groups */}
                {cardGroups.map(group => (
                    <View key={group.account.id} style={{ marginBottom: 16 }}>
                        {/* Card Header */}
                        <TouchableOpacity
                            onPress={() => toggleCard(group.account.id)}
                            activeOpacity={0.7}
                            style={{
                                backgroundColor: group.account.type === 'credit' ? '#f97316' : '#2563eb',
                                padding: 16,
                                borderTopLeftRadius: 16,
                                borderTopRightRadius: 16,
                                borderBottomLeftRadius: expandedCard === group.account.id ? 0 : 16,
                                borderBottomRightRadius: expandedCard === group.account.id ? 0 : 16,
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                            }}
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                                <View style={{
                                    width: 40, height: 40, borderRadius: 20,
                                    backgroundColor: 'rgba(255,255,255,0.2)',
                                    alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <Ionicons
                                        name={group.account.type === 'credit' ? 'card' : 'wallet'}
                                        size={20}
                                        color="white"
                                    />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 15 }}>
                                        {group.account.name}
                                    </Text>
                                    <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>
                                        {group.subscriptions.length} sub{group.subscriptions.length !== 1 ? 's' : ''} • ${group.totalMonthly.toFixed(2)}/mo
                                    </Text>
                                </View>
                            </View>
                            <Ionicons
                                name={expandedCard === group.account.id ? 'chevron-up' : 'chevron-down'}
                                size={20}
                                color="white"
                            />
                        </TouchableOpacity>

                        {/* Expanded Subscription List */}
                        {expandedCard === group.account.id && (
                            <View style={{
                                backgroundColor: 'white',
                                borderBottomLeftRadius: 16,
                                borderBottomRightRadius: 16,
                                borderWidth: 1,
                                borderTopWidth: 0,
                                borderColor: '#e5e7eb',
                                overflow: 'hidden',
                            }}>
                                {group.subscriptions.map((sub, index) => {
                                    const confConfig = CONFIDENCE_CONFIG[sub.confidence];
                                    const serviceConfig = sub.knownService
                                        ? SERVICE_CATEGORY_CONFIG[sub.knownService.serviceCategory]
                                        : null;

                                    return (
                                        <View
                                            key={sub.id}
                                            style={{
                                                padding: 16,
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                borderBottomWidth: index < group.subscriptions.length - 1 ? 1 : 0,
                                                borderBottomColor: '#f3f4f6',
                                            }}
                                        >
                                            {/* Icon — tap to see timeline */}
                                            <TouchableOpacity onPress={() => setSelectedSub(sub)} activeOpacity={0.6}>
                                                <Text style={{ fontSize: 24, marginRight: 12 }}>{sub.icon}</Text>
                                            </TouchableOpacity>

                                            {/* Info — tap to see timeline */}
                                            <TouchableOpacity onPress={() => setSelectedSub(sub)} activeOpacity={0.6} style={{ flex: 1 }}>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                                    <Text style={{ fontWeight: '600', color: '#1f2937', fontSize: 15 }}>
                                                        {sub.displayName}
                                                    </Text>
                                                    {sub.isActive ? (
                                                        <View style={{
                                                            backgroundColor: '#dcfce7',
                                                            paddingHorizontal: 5,
                                                            paddingVertical: 1,
                                                            borderRadius: 4,
                                                        }}>
                                                            <Text style={{ color: '#16a34a', fontSize: 9, fontWeight: 'bold' }}>
                                                                ACTIVE
                                                            </Text>
                                                        </View>
                                                    ) : (
                                                        <View style={{
                                                            backgroundColor: '#fee2e2',
                                                            paddingHorizontal: 5,
                                                            paddingVertical: 1,
                                                            borderRadius: 4,
                                                        }}>
                                                            <Text style={{ color: '#dc2626', fontSize: 9, fontWeight: 'bold' }}>
                                                                INACTIVE
                                                            </Text>
                                                        </View>
                                                    )}
                                                </View>

                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                                    <View style={{
                                                        backgroundColor: FREQUENCY_COLORS[sub.frequency] + '20',
                                                        paddingHorizontal: 5,
                                                        paddingVertical: 1,
                                                        borderRadius: 4,
                                                    }}>
                                                        <Text style={{
                                                            color: FREQUENCY_COLORS[sub.frequency],
                                                            fontSize: 10,
                                                            fontWeight: '600',
                                                        }}>
                                                            {FREQUENCY_LABELS[sub.frequency]}
                                                        </Text>
                                                    </View>

                                                    <View style={{
                                                        backgroundColor: confConfig.bg,
                                                        paddingHorizontal: 5,
                                                        paddingVertical: 1,
                                                        borderRadius: 4,
                                                    }}>
                                                        <Text style={{
                                                            color: confConfig.color,
                                                            fontSize: 10,
                                                            fontWeight: '600',
                                                        }}>
                                                            {sub.confidence === 'high' ? '✓ ' : ''}{confConfig.label}
                                                        </Text>
                                                    </View>

                                                    {serviceConfig && (
                                                        <Text style={{ color: serviceConfig.color, fontSize: 10, fontWeight: '500' }}>
                                                            {serviceConfig.label}
                                                        </Text>
                                                    )}
                                                </View>

                                                <Text style={{ color: '#9ca3af', fontSize: 11, marginTop: 4 }}>
                                                    {sub.chargeCount} charge{sub.chargeCount !== 1 ? 's' : ''} • Next: {formatShortDate(sub.nextExpectedDate)}
                                                </Text>
                                            </TouchableOpacity>

                                            {/* Amount */}
                                            <View style={{ alignItems: 'flex-end', marginLeft: 8, marginRight: 8 }}>
                                                <Text style={{ fontWeight: 'bold', color: '#7c3aed', fontSize: 16 }}>
                                                    ${sub.latestAmount.toFixed(2)}
                                                </Text>
                                                <Text style={{ color: '#9ca3af', fontSize: 10 }}>
                                                    /{sub.frequency === 'yearly' ? 'yr' : sub.frequency === 'weekly' ? 'wk' : 'mo'}
                                                </Text>
                                            </View>

                                            {/* Dismiss X button */}
                                            <TouchableOpacity
                                                onPress={() => handleDismiss(sub)}
                                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                                style={{
                                                    width: 28, height: 28, borderRadius: 14,
                                                    backgroundColor: '#fee2e2',
                                                    alignItems: 'center', justifyContent: 'center',
                                                }}
                                            >
                                                <Ionicons name="close" size={14} color="#dc2626" />
                                            </TouchableOpacity>
                                        </View>
                                    );
                                })}
                            </View>
                        )}
                    </View>
                ))}

                {/* Dismissed Subscriptions Section */}
                {dismissedSubscriptions.length > 0 && (
                    <View style={{ marginTop: 8, marginBottom: 16 }}>
                        <Text style={{ fontSize: 16, fontWeight: '600', color: '#6b7280', marginBottom: 12 }}>
                            Removed ({dismissedSubscriptions.length})
                        </Text>
                        <View style={{
                            backgroundColor: 'white',
                            borderRadius: 16,
                            borderWidth: 1,
                            borderColor: '#e5e7eb',
                            overflow: 'hidden',
                            opacity: 0.6,
                        }}>
                            {dismissedSubscriptions.map((sub, index) => (
                                <View
                                    key={sub.id}
                                    style={{
                                        padding: 14,
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        borderBottomWidth: index < dismissedSubscriptions.length - 1 ? 1 : 0,
                                        borderBottomColor: '#f3f4f6',
                                    }}
                                >
                                    <Text style={{ fontSize: 20, marginRight: 10 }}>{sub.icon}</Text>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ fontWeight: '500', color: '#6b7280', fontSize: 14, textDecorationLine: 'line-through' }}>
                                            {sub.displayName}
                                        </Text>
                                        <Text style={{ color: '#9ca3af', fontSize: 11 }}>
                                            ${sub.latestAmount.toFixed(2)}/{sub.frequency === 'yearly' ? 'yr' : 'mo'}
                                        </Text>
                                    </View>
                                    <TouchableOpacity
                                        onPress={() => restoreSubscription(sub.id)}
                                        style={{
                                            backgroundColor: '#dbeafe',
                                            paddingHorizontal: 12,
                                            paddingVertical: 6,
                                            borderRadius: 8,
                                        }}
                                    >
                                        <Text style={{ color: '#2563eb', fontSize: 12, fontWeight: '600' }}>Restore</Text>
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* ===================== TIMELINE DETAIL MODAL ===================== */}
            <Modal
                visible={selectedSub !== null}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setSelectedSub(null)}
            >
                <View style={{
                    flex: 1,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    justifyContent: 'flex-end',
                }}>
                    <Pressable style={{ flex: 1 }} onPress={() => setSelectedSub(null)} />

                    {selectedSub && (
                        <View style={{
                            backgroundColor: 'white',
                            borderTopLeftRadius: 24,
                            borderTopRightRadius: 24,
                            maxHeight: '85%',
                        }}>
                            {/* Modal Header */}
                            <View style={{
                                padding: 20,
                                borderBottomWidth: 1,
                                borderBottomColor: '#f3f4f6',
                                backgroundColor: '#faf5ff',
                                borderTopLeftRadius: 24,
                                borderTopRightRadius: 24,
                            }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                        <Text style={{ fontSize: 32 }}>{selectedSub.icon}</Text>
                                        <View style={{ flex: 1 }}>
                                            <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#1f2937' }}>
                                                {selectedSub.displayName}
                                            </Text>
                                            {/* Show original merchant name if different */}
                                            {selectedSub.displayName !== selectedSub.merchantName && (
                                                <Text style={{ color: '#9ca3af', fontSize: 11, marginTop: 2 }}>
                                                    Statement: "{selectedSub.merchantName}"
                                                </Text>
                                            )}
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                                                <Ionicons
                                                    name={selectedSub.accountType === 'credit' ? 'card' : 'wallet'}
                                                    size={14}
                                                    color="#6b7280"
                                                />
                                                <Text style={{ color: '#6b7280', fontSize: 13 }}>
                                                    {selectedSub.accountName}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                    <Pressable
                                        onPress={() => setSelectedSub(null)}
                                        style={{
                                            width: 32, height: 32, borderRadius: 16,
                                            backgroundColor: '#e5e7eb',
                                            alignItems: 'center', justifyContent: 'center',
                                        }}
                                    >
                                        <Ionicons name="close" size={18} color="#4b5563" />
                                    </Pressable>
                                </View>

                                {/* Known service info */}
                                {selectedSub.knownService && (
                                    <View style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        gap: 6,
                                        marginTop: 8,
                                        backgroundColor: '#dcfce7',
                                        paddingHorizontal: 10,
                                        paddingVertical: 6,
                                        borderRadius: 8,
                                    }}>
                                        <Ionicons name="checkmark-circle" size={14} color="#16a34a" />
                                        <Text style={{ color: '#16a34a', fontSize: 12, fontWeight: '500' }}>
                                            Known subscription service • Typical ${selectedSub.knownService.priceRange[0].toFixed(2)} – ${selectedSub.knownService.priceRange[1].toFixed(2)}/{selectedSub.knownService.frequency === 'yearly' ? 'yr' : 'mo'}
                                        </Text>
                                    </View>
                                )}

                                {/* Stats Row */}
                                <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
                                    <View style={{
                                        flex: 1,
                                        backgroundColor: 'white',
                                        padding: 12,
                                        borderRadius: 12,
                                        borderWidth: 1,
                                        borderColor: '#e9d5ff',
                                    }}>
                                        <Text style={{ fontSize: 10, color: '#7c3aed', fontWeight: '600' }}>AMOUNT</Text>
                                        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1f2937' }}>
                                            ${selectedSub.latestAmount.toFixed(2)}
                                        </Text>
                                        <Text style={{ fontSize: 10, color: '#9ca3af' }}>
                                            {FREQUENCY_LABELS[selectedSub.frequency]}
                                        </Text>
                                    </View>
                                    <View style={{
                                        flex: 1,
                                        backgroundColor: 'white',
                                        padding: 12,
                                        borderRadius: 12,
                                        borderWidth: 1,
                                        borderColor: '#fce7f3',
                                    }}>
                                        <Text style={{ fontSize: 10, color: '#ec4899', fontWeight: '600' }}>TOTAL SPENT</Text>
                                        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1f2937' }}>
                                            ${selectedSub.totalSpent.toFixed(2)}
                                        </Text>
                                        <Text style={{ fontSize: 10, color: '#9ca3af' }}>
                                            {selectedSub.chargeCount} charges
                                        </Text>
                                    </View>
                                    <View style={{
                                        flex: 1,
                                        backgroundColor: 'white',
                                        padding: 12,
                                        borderRadius: 12,
                                        borderWidth: 1,
                                        borderColor: '#dbeafe',
                                    }}>
                                        <Text style={{ fontSize: 10, color: '#2563eb', fontWeight: '600' }}>NEXT</Text>
                                        <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#1f2937' }}>
                                            {formatShortDate(selectedSub.nextExpectedDate)}
                                        </Text>
                                        <Text style={{ fontSize: 10, color: '#9ca3af' }}>estimated</Text>
                                    </View>
                                </View>
                            </View>

                            {/* Timeline Header */}
                            <View style={{ padding: 20, paddingBottom: 4 }}>
                                <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#1f2937', marginBottom: 4 }}>
                                    Payment Timeline
                                </Text>
                                <Text style={{ fontSize: 12, color: '#9ca3af', marginBottom: 16 }}>
                                    {formatLongDate(selectedSub.firstChargeDate)} — {formatLongDate(selectedSub.lastChargeDate)}
                                </Text>
                            </View>

                            {/* Timeline Scrollable */}
                            <ScrollView style={{ paddingHorizontal: 20, maxHeight: 350 }}>
                                {/* Future expected charge */}
                                {selectedSub.isActive && (
                                    <View style={{ flexDirection: 'row', marginBottom: 0 }}>
                                        <View style={{ width: 40, alignItems: 'center' }}>
                                            <View style={{
                                                width: 14, height: 14, borderRadius: 7,
                                                borderWidth: 2,
                                                borderColor: '#d1d5db',
                                                backgroundColor: 'white',
                                            }} />
                                            <View style={{
                                                width: 2, flex: 1,
                                                backgroundColor: '#e5e7eb',
                                                borderStyle: 'dashed' as any,
                                            }} />
                                        </View>
                                        <View style={{ flex: 1, paddingBottom: 20, paddingLeft: 12 }}>
                                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <View>
                                                    <Text style={{ color: '#9ca3af', fontSize: 12, fontStyle: 'italic' }}>
                                                        Next Expected
                                                    </Text>
                                                    <Text style={{ color: '#6b7280', fontWeight: '500' }}>
                                                        {formatLongDate(selectedSub.nextExpectedDate)}
                                                    </Text>
                                                </View>
                                                <Text style={{ color: '#d1d5db', fontWeight: '600', fontSize: 15 }}>
                                                    ~${selectedSub.latestAmount.toFixed(2)}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                )}

                                {/* Actual charge history (reverse chronological) */}
                                {[...selectedSub.charges].reverse().map((charge, index) => {
                                    const isFirst = index === 0;
                                    const isLast = index === selectedSub.charges.length - 1;

                                    return (
                                        <View key={charge.id} style={{ flexDirection: 'row' }}>
                                            <View style={{ width: 40, alignItems: 'center' }}>
                                                <View style={{
                                                    width: 14, height: 14, borderRadius: 7,
                                                    backgroundColor: isFirst ? '#7c3aed' : '#c4b5fd',
                                                }} />
                                                {!isLast && (
                                                    <View style={{
                                                        width: 2, flex: 1,
                                                        backgroundColor: '#e9d5ff',
                                                    }} />
                                                )}
                                            </View>

                                            <View style={{ flex: 1, paddingBottom: isLast ? 8 : 20, paddingLeft: 12 }}>
                                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <View>
                                                        <Text style={{
                                                            color: '#374151',
                                                            fontWeight: isFirst ? '600' : '400',
                                                            fontSize: 14,
                                                        }}>
                                                            {formatLongDate(charge.date)}
                                                        </Text>
                                                        {isFirst && (
                                                            <Text style={{ color: '#7c3aed', fontSize: 11, fontWeight: '500' }}>
                                                                Most recent
                                                            </Text>
                                                        )}
                                                        {isLast && selectedSub.chargeCount > 1 && (
                                                            <Text style={{ color: '#9ca3af', fontSize: 11 }}>First charge</Text>
                                                        )}
                                                    </View>
                                                    <Text style={{
                                                        fontWeight: '600',
                                                        color: '#ef4444',
                                                        fontSize: 15,
                                                    }}>
                                                        -${Math.abs(charge.amount).toFixed(2)}
                                                    </Text>
                                                </View>
                                            </View>
                                        </View>
                                    );
                                })}

                                <View style={{ height: 40 }} />
                            </ScrollView>
                        </View>
                    )}
                </View>
            </Modal>
        </SafeAreaView>
    );
}

// --- Date helpers ---

function formatShortDate(dateStr: string): string {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatLongDate(dateStr: string): string {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}
