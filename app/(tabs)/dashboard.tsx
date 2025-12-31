import { View, Text, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDataStore } from '../../src/store/useDataStore';
import { useAuthStore } from '../../src/store/useAuthStore';
import { useEffect, useMemo, useState } from 'react';
import { AccountCard } from '../../src/components/AccountCard';
import { PieChart } from 'react-native-gifted-charts';
import { CATEGORY_COLORS, Category } from '../../src/constants/Categories';
import { AddTransactionModal } from '../../src/components/AddTransactionModal';

export default function Dashboard() {
    const { user } = useAuthStore();
    const { accounts, transactions, refreshData, isLoading } = useDataStore();
    const [refreshing, setRefreshing] = useState(false);

    const [modalVisible, setModalVisible] = useState(false);

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

    const spendingData = useMemo(() => {
        const categories: Record<string, number> = {};

        transactions.forEach(tx => {
            if (tx.type === 'expense') {
                categories[tx.category] = (categories[tx.category] || 0) + tx.amount;
            }
        });

        const data = Object.keys(categories).map(cat => ({
            value: categories[cat],
            color: CATEGORY_COLORS[cat as Category] || '#ccc',
            text: '',
            label: cat
        }));

        // Sort by value desc
        return data.sort((a, b) => b.value - a.value);
    }, [transactions]);

    return (
        <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
            <ScrollView
                className="flex-1 px-4"
                refreshControl={<RefreshControl refreshing={refreshing || isLoading} onRefresh={onRefresh} />}
            >
                <View className="mb-6 mt-2 flex-row justify-between items-center">
                    <View>
                        <Text className="text-gray-500 text-sm">Welcome back,</Text>
                        <Text className="text-2xl font-bold text-gray-900">{user?.displayName}</Text>
                    </View>
                    <TouchableOpacity onPress={() => setModalVisible(true)} className="bg-blue-600 w-10 h-10 rounded-full items-center justify-center shadow-md">
                        <Text className="text-white text-2xl font-light">+</Text>
                    </TouchableOpacity>
                </View>

                {/* Total Balance Card */}
                <View className="bg-blue-600 p-6 rounded-2xl shadow-lg mb-6">
                    <Text className="text-blue-100 text-sm mb-1">Total Net Worth</Text>
                    <Text className="text-white text-3xl font-bold">
                        ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </Text>
                </View>

                {/* Monthly Spending Chart */}
                <View className="bg-white p-4 rounded-2xl shadow-sm mb-6 items-center">
                    <Text className="text-lg font-bold text-gray-800 w-full mb-4">Monthly Spending</Text>
                    {spendingData.length > 0 ? (
                        <View className="flex-row items-center">
                            <PieChart
                                data={spendingData}
                                donut
                                radius={80}
                                innerRadius={60}
                                showGradient
                            />
                            <View className="ml-4">
                                {spendingData.slice(0, 4).map((item, index) => (
                                    <View key={index} className="flex-row items-center mb-2">
                                        <View style={{ backgroundColor: item.color }} className="w-3 h-3 rounded-full mr-2" />
                                        <Text className="text-xs text-gray-600">{item.label}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    ) : (
                        <Text className="text-gray-400 py-10">No spending data</Text>
                    )}
                </View>

                {/* Connected Accounts */}
                <Text className="text-lg font-bold text-gray-800 mb-3">Accounts</Text>
                {accounts.map(acc => (
                    <AccountCard key={acc.id} account={acc} />
                ))}

                <View className="h-10" />
            </ScrollView>
            <AddTransactionModal visible={modalVisible} onClose={() => setModalVisible(false)} />
        </SafeAreaView>
    );
}
