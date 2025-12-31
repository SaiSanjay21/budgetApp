import { View, Text, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDataStore } from '../../src/store/useDataStore';
import { TransactionItem } from '../../src/components/TransactionItem';

export default function TransactionsScreen() {
    const { transactions } = useDataStore();

    return (
        <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
            <View className="px-4 pb-2 border-b border-gray-100 bg-white">
                <Text className="text-2xl font-bold text-gray-900 my-2">Transactions</Text>
            </View>
            <FlatList
                data={transactions}
                keyExtractor={item => item.id}
                renderItem={({ item }) => <TransactionItem transaction={item} />}
                contentContainerStyle={{ padding: 16 }}
                ListEmptyComponent={() => (
                    <View className="items-center py-10">
                        <Text className="text-gray-400">No transactions found</Text>
                    </View>
                )}
            />
        </SafeAreaView>
    );
}
