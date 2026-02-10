import { View, Text, TouchableOpacity, Modal, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDataStore } from '../store/useDataStore';
import { useMemo, useState } from 'react';
import { detectSubscriptions } from '../utils/subscriptionDetector';
import { predictMonthlyExpenses, ExpensePrediction } from '../utils/expensePredictor';

const CONFIDENCE_DISPLAY = {
    high: { label: 'High confidence', icon: 'checkmark-circle' as const, color: '#16a34a' },
    medium: { label: 'Medium confidence', icon: 'alert-circle' as const, color: '#d97706' },
    low: { label: 'Limited data', icon: 'information-circle' as const, color: '#6b7280' },
};

export function ExpensePredictionWidget() {
    const { transactions, accounts, dismissedSubscriptionIds } = useDataStore();
    const [showDetail, setShowDetail] = useState(false);

    // Detect subscriptions & filter out dismissed ones
    const activeSubscriptions = useMemo(() => {
        const all = detectSubscriptions(transactions, accounts);
        return all.filter(
            s => s.isActive && !dismissedSubscriptionIds.includes(s.id)
        );
    }, [transactions, accounts, dismissedSubscriptionIds]);

    // Run prediction
    const prediction = useMemo(
        () => predictMonthlyExpenses(transactions, activeSubscriptions),
        [transactions, activeSubscriptions]
    );

    if (transactions.length === 0) return null;

    const confDisplay = CONFIDENCE_DISPLAY[prediction.confidence];
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const monthName = nextMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    return (
        <>
            <TouchableOpacity
                onPress={() => setShowDetail(true)}
                activeOpacity={0.85}
                style={{
                    backgroundColor: '#0f172a',
                    padding: 16,
                    borderRadius: 16,
                    marginBottom: 24,
                    overflow: 'hidden',
                    position: 'relative',
                }}
            >
                {/* Decorative gradient effect */}
                <View style={{
                    position: 'absolute', left: -30, top: -30,
                    width: 120, height: 120, borderRadius: 60,
                    backgroundColor: 'rgba(99,102,241,0.15)',
                }} />
                <View style={{
                    position: 'absolute', right: -20, bottom: -20,
                    width: 100, height: 100, borderRadius: 50,
                    backgroundColor: 'rgba(236,72,153,0.1)',
                }} />

                {/* Header */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <View style={{
                            width: 32, height: 32, borderRadius: 16,
                            backgroundColor: 'rgba(99,102,241,0.3)',
                            alignItems: 'center', justifyContent: 'center',
                        }}>
                            <Ionicons name="analytics" size={18} color="#818cf8" />
                        </View>
                        <View>
                            <Text style={{ color: '#94a3b8', fontSize: 11, fontWeight: '600', letterSpacing: 0.5 }}>
                                PREDICTED EXPENSES
                            </Text>
                            <Text style={{ color: '#64748b', fontSize: 10 }}>{monthName}</Text>
                        </View>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Ionicons name={confDisplay.icon} size={12} color={confDisplay.color} />
                        <Text style={{ color: confDisplay.color, fontSize: 10 }}>{confDisplay.label}</Text>
                    </View>
                </View>

                {/* Total */}
                <Text style={{ color: 'white', fontSize: 28, fontWeight: 'bold', marginBottom: 12 }}>
                    ${prediction.totalPredicted.toFixed(2)}
                </Text>

                {/* Breakdown bar */}
                <View style={{ flexDirection: 'row', height: 6, borderRadius: 3, overflow: 'hidden', marginBottom: 12 }}>
                    {prediction.categories.filter(c => c.averageMonthly > 0).map((cat, i) => (
                        <View
                            key={cat.category}
                            style={{
                                flex: cat.averageMonthly / prediction.totalPredicted,
                                backgroundColor: cat.color,
                                marginLeft: i === 0 ? 0 : 1,
                            }}
                        />
                    ))}
                </View>

                {/* Top categories preview */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {prediction.categories.slice(0, 4).map(cat => (
                        <View key={cat.category} style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 4,
                        }}>
                            <Text style={{ fontSize: 12 }}>{cat.icon}</Text>
                            <Text style={{ color: '#94a3b8', fontSize: 11 }}>
                                {cat.label}
                            </Text>
                            <Text style={{ color: 'white', fontSize: 11, fontWeight: '600' }}>
                                ${cat.averageMonthly.toFixed(0)}
                            </Text>
                            {cat.trend !== 'stable' && (
                                <Ionicons
                                    name={cat.trend === 'up' ? 'arrow-up' : 'arrow-down'}
                                    size={10}
                                    color={cat.trend === 'up' ? '#ef4444' : '#22c55e'}
                                />
                            )}
                        </View>
                    ))}
                </View>

                {/* Tap hint */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 12, gap: 4 }}>
                    <Text style={{ color: '#475569', fontSize: 10 }}>Tap for full breakdown</Text>
                    <Ionicons name="chevron-forward" size={10} color="#475569" />
                </View>
            </TouchableOpacity>

            {/* ============ FULL BREAKDOWN MODAL ============ */}
            <PredictionDetailModal
                visible={showDetail}
                onClose={() => setShowDetail(false)}
                prediction={prediction}
                monthName={monthName}
            />
        </>
    );
}

function PredictionDetailModal({
    visible,
    onClose,
    prediction,
    monthName,
}: {
    visible: boolean;
    onClose: () => void;
    prediction: ExpensePrediction;
    monthName: string;
}) {
    const confDisplay = CONFIDENCE_DISPLAY[prediction.confidence];

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
                <Pressable style={{ flex: 1 }} onPress={onClose} />

                <View style={{
                    backgroundColor: 'white',
                    borderTopLeftRadius: 24,
                    borderTopRightRadius: 24,
                    maxHeight: '88%',
                }}>
                    {/* Header */}
                    <View style={{
                        padding: 20,
                        borderBottomWidth: 1,
                        borderBottomColor: '#f3f4f6',
                        backgroundColor: '#f8fafc',
                        borderTopLeftRadius: 24,
                        borderTopRightRadius: 24,
                    }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <View>
                                <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#111827' }}>
                                    Predicted Expenses
                                </Text>
                                <Text style={{ color: '#6b7280', fontSize: 13, marginTop: 2 }}>
                                    Forecast for {monthName}
                                </Text>
                            </View>
                            <Pressable
                                onPress={onClose}
                                style={{
                                    width: 32, height: 32, borderRadius: 16,
                                    backgroundColor: '#e5e7eb',
                                    alignItems: 'center', justifyContent: 'center',
                                }}
                            >
                                <Ionicons name="close" size={18} color="#4b5563" />
                            </Pressable>
                        </View>

                        {/* Summary stats */}
                        <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
                            <View style={{
                                flex: 1,
                                backgroundColor: '#0f172a',
                                padding: 14,
                                borderRadius: 12,
                            }}>
                                <Text style={{ color: '#94a3b8', fontSize: 10, fontWeight: '600' }}>TOTAL PREDICTED</Text>
                                <Text style={{ color: 'white', fontSize: 22, fontWeight: 'bold' }}>
                                    ${prediction.totalPredicted.toFixed(2)}
                                </Text>
                            </View>
                            <View style={{
                                flex: 0.5,
                                backgroundColor: '#6366f1',
                                padding: 14,
                                borderRadius: 12,
                            }}>
                                <Text style={{ color: '#c7d2fe', fontSize: 10, fontWeight: '600' }}>SUBS</Text>
                                <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>
                                    ${prediction.subscriptionTotal.toFixed(0)}
                                </Text>
                            </View>
                            <View style={{
                                flex: 0.5,
                                backgroundColor: '#ec4899',
                                padding: 14,
                                borderRadius: 12,
                            }}>
                                <Text style={{ color: '#fbcfe8', fontSize: 10, fontWeight: '600' }}>OTHER</Text>
                                <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>
                                    ${prediction.variableTotal.toFixed(0)}
                                </Text>
                            </View>
                        </View>

                        {/* Confidence + data info */}
                        <View style={{
                            flexDirection: 'row', alignItems: 'center', gap: 6,
                            marginTop: 12,
                            backgroundColor: confDisplay.color + '15',
                            paddingHorizontal: 10, paddingVertical: 6,
                            borderRadius: 8,
                        }}>
                            <Ionicons name={confDisplay.icon} size={14} color={confDisplay.color} />
                            <Text style={{ color: confDisplay.color, fontSize: 12 }}>
                                {confDisplay.label} — Based on {prediction.monthsAnalyzed} month{prediction.monthsAnalyzed !== 1 ? 's' : ''} of data
                            </Text>
                        </View>
                    </View>

                    {/* Category Breakdown */}
                    <ScrollView style={{ padding: 20 }}>
                        <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 16 }}>
                            Category Breakdown
                        </Text>

                        {prediction.categories.map(cat => {
                            const barWidth = prediction.totalPredicted > 0
                                ? (cat.averageMonthly / prediction.totalPredicted) * 100
                                : 0;

                            return (
                                <View key={cat.category} style={{
                                    marginBottom: 16,
                                    backgroundColor: '#f9fafb',
                                    padding: 14,
                                    borderRadius: 12,
                                    borderLeftWidth: 4,
                                    borderLeftColor: cat.color,
                                }}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                            <Text style={{ fontSize: 18 }}>{cat.icon}</Text>
                                            <View>
                                                <Text style={{ fontWeight: '600', color: '#1f2937', fontSize: 14 }}>
                                                    {cat.label}
                                                </Text>
                                                <Text style={{ color: '#9ca3af', fontSize: 11 }}>
                                                    {cat.transactionCount} transaction{cat.transactionCount !== 1 ? 's' : ''} • {cat.monthsOfData}mo avg
                                                </Text>
                                            </View>
                                        </View>
                                        <View style={{ alignItems: 'flex-end' }}>
                                            <Text style={{ fontWeight: 'bold', color: '#1f2937', fontSize: 16 }}>
                                                ${cat.averageMonthly.toFixed(2)}
                                            </Text>
                                            {cat.trend !== 'stable' && (
                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                                                    <Ionicons
                                                        name={cat.trend === 'up' ? 'arrow-up' : 'arrow-down'}
                                                        size={10}
                                                        color={cat.trend === 'up' ? '#ef4444' : '#22c55e'}
                                                    />
                                                    <Text style={{
                                                        fontSize: 10,
                                                        color: cat.trend === 'up' ? '#ef4444' : '#22c55e',
                                                        fontWeight: '600',
                                                    }}>
                                                        {Math.abs(cat.trendPercent)}%
                                                    </Text>
                                                </View>
                                            )}
                                        </View>
                                    </View>

                                    {/* Progress bar */}
                                    <View style={{ height: 6, backgroundColor: '#e5e7eb', borderRadius: 3, overflow: 'hidden' }}>
                                        <View style={{
                                            height: '100%',
                                            width: `${Math.min(barWidth, 100)}%`,
                                            backgroundColor: cat.color,
                                            borderRadius: 3,
                                        }} />
                                    </View>
                                    <Text style={{ color: '#9ca3af', fontSize: 10, marginTop: 4, textAlign: 'right' }}>
                                        {barWidth.toFixed(0)}% of total
                                    </Text>
                                </View>
                            );
                        })}

                        {/* Disclaimer */}
                        <View style={{
                            backgroundColor: '#fffbeb',
                            padding: 12,
                            borderRadius: 10,
                            flexDirection: 'row',
                            gap: 8,
                            marginTop: 4,
                            marginBottom: 40,
                        }}>
                            <Ionicons name="information-circle" size={16} color="#d97706" />
                            <Text style={{ color: '#92400e', fontSize: 11, flex: 1 }}>
                                Predictions are based on your historical spending patterns. Actual expenses may vary.
                                Remove cancelled subscriptions to improve accuracy.
                            </Text>
                        </View>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}
