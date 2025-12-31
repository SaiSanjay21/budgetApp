import { View, Text, TouchableOpacity } from 'react-native';
import { BankAccount } from '../types';
import { Ionicons } from '@expo/vector-icons';

interface Props {
    account: BankAccount;
    onPress?: () => void;
}

export function AccountCard({ account, onPress }: Props) {
    const isCredit = account.type === 'credit';

    return (
        <TouchableOpacity
            onPress={onPress}
            className="bg-white p-4 rounded-xl shadow-sm mb-3 border border-gray-100 flex-row justify-between items-center"
        >
            <View className="flex-row items-center gap-3">
                <View className={`p-2 rounded-full ${isCredit ? 'bg-orange-100' : 'bg-blue-100'}`}>
                    <Ionicons
                        name={isCredit ? "card" : "wallet"}
                        size={24}
                        color={isCredit ? "#f97316" : "#3b82f6"}
                    />
                </View>
                <View>
                    <Text className="font-semibold text-gray-800">{account.name}</Text>
                    <Text className="text-xs text-gray-500">{account.institution}</Text>
                </View>
            </View>

            <View className="items-end">
                <Text className={`font-bold text-base ${isCredit ? 'text-gray-900' : 'text-green-600'}`}>
                    ${account.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </Text>
                {isCredit && <Text className="text-xs text-gray-400">Balance</Text>}
            </View>
        </TouchableOpacity>
    );
}
