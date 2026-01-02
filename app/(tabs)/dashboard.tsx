import { View, Text, ScrollView, RefreshControl, TouchableOpacity, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDataStore } from '../../src/store/useDataStore';
import { useAuthStore } from '../../src/store/useAuthStore';
import { useEffect, useMemo, useState } from 'react';
import { AccountCard } from '../../src/components/AccountCard';
import { PieChart } from 'react-native-gifted-charts';
import { CATEGORY_COLORS, Category } from '../../src/constants/Categories';
import { AddTransactionModal } from '../../src/components/AddTransactionModal';
import { useRouter } from 'expo-router';

export default function Dashboard() {
    const { user } = useAuthStore();
    const { accounts, transactions, refreshData, isLoading, clearAllData } = useDataStore();
    const [refreshing, setRefreshing] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        refreshData();
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await refreshData();
        setRefreshing(false);
    };

    const totalBalance = useMemo(() => {
        return accounts.reduce((acc, curr) => {
            if (curr.type === 'credit') return acc - curr.balance;
            return acc + curr.balance;
        }, 0);
    }, [accounts]);

    // Calculate spending and income by category
    const categoryData = useMemo(() => {
        const spending: Record<string, number> = {};
        const income: Record<string, number> = {};

        transactions.forEach(tx => {
            if (tx.amount < 0) {
                spending[tx.category] = (spending[tx.category] || 0) + Math.abs(tx.amount);
            } else {
                income[tx.category] = (income[tx.category] || 0) + tx.amount;
            }
        });

        return { spending, income };
    }, [transactions]);

    // Pie chart data (spending only)
    const spendingData = useMemo(() => {
        const data = Object.keys(categoryData.spending).map(cat => ({
            value: categoryData.spending[cat],
            color: CATEGORY_COLORS[cat as Category] || '#9E9E9E',
            text: '',
            label: cat,
            focused: selectedCategory === cat
        }));

        return data.sort((a, b) => b.value - a.value);
    }, [categoryData.spending, selectedCategory]);

    // Total spending and income
    const totals = useMemo(() => {
        const totalSpending = transactions
            .filter(tx => tx.amount < 0)
            .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
        const totalIncome = transactions
            .filter(tx => tx.amount > 0)
            .reduce((sum, tx) => sum + tx.amount, 0);
        return { totalSpending, totalIncome };
    }, [transactions]);

    const hasTransactions = transactions.length > 0;

    const handleCategoryPress = (category: string) => {
        setSelectedCategory(selectedCategory === category ? null : category);
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
            <ScrollView
                style={{ flex: 1, paddingHorizontal: 16 }}
                refreshControl={<RefreshControl refreshing={refreshing || isLoading} onRefresh={onRefresh} />}
            >
                <View style={{ marginBottom: 24, marginTop: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View>
                        <Text style={{ color: '#6b7280', fontSize: 14 }}>Welcome back,</Text>
                        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#111827' }}>{user?.displayName}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                        {hasTransactions && (
                            <TouchableOpacity
                                onPress={() => clearAllData()}
                                style={{ backgroundColor: '#ef4444', width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}
                            >
                                <Text style={{ color: 'white', fontSize: 18 }}>🗑</Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            onPress={() => setModalVisible(true)}
                            style={{ backgroundColor: '#2563eb', width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}
                        >
                            <Text style={{ color: 'white', fontSize: 24, fontWeight: '300' }}>+</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Total Balance Card */}
                <View style={{ backgroundColor: '#2563eb', padding: 24, borderRadius: 16, marginBottom: 24 }}>
                    <Text style={{ color: '#bfdbfe', fontSize: 14, marginBottom: 4 }}>Total Balance</Text>
                    <Text style={{ color: 'white', fontSize: 32, fontWeight: 'bold' }}>
                        ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </Text>
                    {hasTransactions && (
                        <View style={{ flexDirection: 'row', marginTop: 12, gap: 16 }}>
                            <View>
                                <Text style={{ color: '#86efac', fontSize: 12 }}>Income</Text>
                                <Text style={{ color: '#22c55e', fontSize: 16, fontWeight: '600' }}>
                                    +${totals.totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </Text>
                            </View>
                            <View>
                                <Text style={{ color: '#fca5a5', fontSize: 12 }}>Spending</Text>
                                <Text style={{ color: '#ef4444', fontSize: 16, fontWeight: '600' }}>
                                    -${totals.totalSpending.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </Text>
                            </View>
                        </View>
                    )}
                </View>

                {/* Empty State */}
                {!hasTransactions && (
                    <View style={{ backgroundColor: 'white', padding: 24, borderRadius: 16, marginBottom: 24, alignItems: 'center' }}>
                        <Text style={{ fontSize: 48, marginBottom: 16 }}>📄</Text>
                        <Text style={{ fontSize: 18, fontWeight: '600', color: '#374151', marginBottom: 8 }}>
                            No Transactions Yet
                        </Text>
                        <Text style={{ color: '#6b7280', textAlign: 'center', marginBottom: 16 }}>
                            Import your bank statement to get started
                        </Text>
                        <Pressable
                            onPress={() => router.push('/(tabs)/import')}
                            style={{ backgroundColor: '#16a34a', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 }}
                        >
                            <Text style={{ color: 'white', fontWeight: '600' }}>Import PDF Statement</Text>
                        </Pressable>
                    </View>
                )}

                {/* Monthly Spending Chart */}
                {hasTransactions && (
                    <View style={{ backgroundColor: 'white', padding: 16, borderRadius: 16, marginBottom: 24 }}>
                        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1f2937', marginBottom: 16 }}>
                            Spending by Category
                        </Text>

                        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                            {/* Pie Chart */}
                            <View style={{ alignItems: 'center' }}>
                                <PieChart
                                    data={spendingData}
                                    donut
                                    radius={80}
                                    innerRadius={55}
                                    showGradient
                                    focusOnPress
                                    onPress={(item: any) => handleCategoryPress(item.label)}
                                    centerLabelComponent={() => (
                                        <View style={{ alignItems: 'center' }}>
                                            <Text style={{ fontSize: 10, color: '#6b7280' }}>Total</Text>
                                            <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#ef4444' }}>
                                                ${totals.totalSpending.toFixed(0)}
                                            </Text>
                                        </View>
                                    )}
                                />
                            </View>

                            {/* Category Legend */}
                            <View style={{ flex: 1, marginLeft: 16 }}>
                                {spendingData.slice(0, 6).map((item, index) => (
                                    <Pressable
                                        key={index}
                                        onPress={() => handleCategoryPress(item.label)}
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            marginBottom: 8,
                                            padding: 6,
                                            borderRadius: 6,
                                            backgroundColor: selectedCategory === item.label ? '#f3f4f6' : 'transparent'
                                        }}
                                    >
                                        <View style={{
                                            backgroundColor: item.color,
                                            width: 12,
                                            height: 12,
                                            borderRadius: 6,
                                            marginRight: 8
                                        }} />
                                        <View style={{ flex: 1 }}>
                                            <Text style={{ fontSize: 12, color: '#374151' }}>{item.label}</Text>
                                        </View>
                                        <Text style={{ fontSize: 12, fontWeight: '600', color: '#ef4444' }}>
                                            -${item.value.toFixed(2)}
                                        </Text>
                                    </Pressable>
                                ))}
                            </View>
                        </View>

                        {/* Selected Category Details */}
                        {selectedCategory && (
                            <View style={{
                                marginTop: 16,
                                padding: 12,
                                backgroundColor: '#f9fafb',
                                borderRadius: 8,
                                borderLeftWidth: 4,
                                borderLeftColor: CATEGORY_COLORS[selectedCategory as Category] || '#9E9E9E'
                            }}>
                                <Text style={{ fontWeight: '600', color: '#374151', marginBottom: 8 }}>
                                    {selectedCategory}
                                </Text>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                    <View>
                                        <Text style={{ fontSize: 12, color: '#6b7280' }}>Spent</Text>
                                        <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#ef4444' }}>
                                            -${(categoryData.spending[selectedCategory] || 0).toFixed(2)}
                                        </Text>
                                    </View>
                                    <View>
                                        <Text style={{ fontSize: 12, color: '#6b7280' }}>Received</Text>
                                        <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#22c55e' }}>
                                            +${(categoryData.income[selectedCategory] || 0).toFixed(2)}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        )}
                    </View>
                )}

                {/* Income Summary */}
                {hasTransactions && Object.keys(categoryData.income).length > 0 && (
                    <View style={{ backgroundColor: 'white', padding: 16, borderRadius: 16, marginBottom: 24 }}>
                        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1f2937', marginBottom: 16 }}>
                            Income Sources
                        </Text>
                        {Object.entries(categoryData.income).map(([cat, amount], index) => (
                            <View key={index} style={{
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                paddingVertical: 8,
                                borderBottomWidth: index < Object.keys(categoryData.income).length - 1 ? 1 : 0,
                                borderBottomColor: '#f3f4f6'
                            }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <View style={{
                                        width: 8,
                                        height: 8,
                                        borderRadius: 4,
                                        backgroundColor: '#22c55e',
                                        marginRight: 8
                                    }} />
                                    <Text style={{ color: '#374151' }}>{cat}</Text>
                                </View>
                                <Text style={{ fontWeight: '600', color: '#22c55e' }}>
                                    +${amount.toFixed(2)}
                                </Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* Connected Accounts */}
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1f2937', marginBottom: 12 }}>Accounts</Text>
                {accounts.map(acc => (
                    <AccountCard key={acc.id} account={acc} />
                ))}

                <View style={{ height: 40 }} />
            </ScrollView>
            <AddTransactionModal visible={modalVisible} onClose={() => setModalVisible(false)} />
        </SafeAreaView>
    );
}
