import { View, Text } from 'react-native';
import { Transaction } from '../types';
import { CATEGORY_COLORS, Category } from '../constants/Categories';
import { Ionicons } from '@expo/vector-icons';

import { useDataStore } from '../store/useDataStore';

interface Props {
    transaction: Transaction;
}

export function TransactionItem({ transaction }: Props) {
    const { accounts } = useDataStore();
    const isExpense = transaction.type === 'expense';
    const color = CATEGORY_COLORS[transaction.category as Category] || '#9E9E9E';

    const account = accounts.find(acc => acc.id === transaction.accountId);
    const accountName = account ? account.name : '';

    return (
        <View className="flex-row justify-between items-center p-3 bg-white mb-2 rounded-lg border border-gray-50">
            <View className="flex-row items-center gap-3">
                <View style={{ backgroundColor: color }} className="w-10 h-10 rounded-full items-center justify-center opacity-90">
                    <Text className="text-white font-bold text-xs">
                        {transaction.category.substring(0, 2).toUpperCase()}
                    </Text>
                </View>
                <View>
                    <Text className="font-medium text-gray-800">{transaction.merchantName}</Text>
                    <Text className="text-xs text-gray-400">{transaction.category}</Text>
                    {accountName ? (
                        <Text className="text-[10px] text-gray-400 mt-0.5">{accountName}</Text>
                    ) : null}
                </View>
            </View>

            <Text className={`font-semibold ${isExpense ? 'text-gray-900' : 'text-green-600'}`}>
                {isExpense ? '-' : '+'}${Math.abs(transaction.amount).toFixed(2)}
            </Text>
        </View>
    );
}
