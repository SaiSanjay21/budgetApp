import { Modal, View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useState } from 'react';
import { SPENDING_CATEGORIES } from '../constants/Categories';
import { useDataStore } from '../store/useDataStore';
import { Transaction } from '../types';

interface Props {
    visible: boolean;
    onClose: () => void;
}

export function AddTransactionModal({ visible, onClose }: Props) {
    const { addTransaction, accounts } = useDataStore();
    const [amount, setAmount] = useState('');
    const [merchant, setMerchant] = useState('');
    const [category, setCategory] = useState<typeof SPENDING_CATEGORIES[number]>(SPENDING_CATEGORIES[0]);

    const handleSubmit = () => {
        if (!amount || !merchant) return;

        const newTx: Transaction = {
            id: Date.now().toString(),
            accountId: accounts[0]?.id || 'acc_default', // Default to first account
            amount: parseFloat(amount),
            date: new Date().toISOString(),
            merchantName: merchant,
            category,
            type: 'expense',
            isPending: false,
            manual: true
        };

        addTransaction(newTx);
        setAmount('');
        setMerchant('');
        onClose();
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View className="flex-1 justify-end bg-black/50">
                <View className="bg-white rounded-t-3xl p-6 h-3/4">
                    <View className="flex-row justify-between items-center mb-6">
                        <Text className="text-xl font-bold text-gray-900">Add Transaction</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Text className="text-blue-600 font-semibold">Cancel</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView>
                        <Text className="label mb-2 text-gray-600 font-medium">Amount</Text>
                        <TextInput
                            className="bg-gray-100 p-4 rounded-xl text-lg mb-4"
                            placeholder="0.00"
                            keyboardType="numeric"
                            value={amount}
                            onChangeText={setAmount}
                        />

                        <Text className="label mb-2 text-gray-600 font-medium">Merchant / Description</Text>
                        <TextInput
                            className="bg-gray-100 p-4 rounded-xl text-lg mb-4"
                            placeholder="e.g. Starbucks"
                            value={merchant}
                            onChangeText={setMerchant}
                        />

                        <Text className="label mb-2 text-gray-600 font-medium">Category</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6 flex-row">
                            {SPENDING_CATEGORIES.map(cat => (
                                <TouchableOpacity
                                    key={cat}
                                    onPress={() => setCategory(cat)}
                                    className={`mr-2 px-4 py-2 rounded-full border ${category === cat ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'}`}
                                >
                                    <Text className={category === cat ? 'text-white font-medium' : 'text-gray-600'}>{cat}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <TouchableOpacity
                            onPress={handleSubmit}
                            className="bg-blue-600 p-4 rounded-xl items-center mt-4"
                        >
                            <Text className="text-white font-bold text-lg">Save Transaction</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}
