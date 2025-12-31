import { View, Text } from 'react-native';
import { Transaction } from '../types';
import { CATEGORY_COLORS, Category } from '../constants/Categories';
import { Ionicons } from '@expo/vector-icons';

interface Props {
    transaction: Transaction;
}

export function TransactionItem({ transaction }: Props) {
    const isExpense = transaction.type === 'expense';
    const color = CATEGORY_COLORS[transaction.category as Category] || '#9E9E9E';

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
                </View>
            </View>

            <Text className={`font-semibold ${isExpense ? 'text-gray-900' : 'text-green-600'}`}>
                {isExpense ? '-' : '+'}${transaction.amount.toFixed(2)}
            </Text>
        </View>
    );
}
