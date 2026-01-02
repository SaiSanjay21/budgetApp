import { Modal, View, Text, TextInput, TouchableOpacity, ScrollView, Pressable, Platform } from 'react-native';
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
    const [transactionType, setTransactionType] = useState<'expense' | 'income'>('expense');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    const handleSubmit = () => {
        if (!amount || !merchant) return;

        const parsedAmount = parseFloat(amount);
        const finalAmount = transactionType === 'expense' ? -Math.abs(parsedAmount) : Math.abs(parsedAmount);

        const newTx: Transaction = {
            id: `cash_${Date.now()}`,
            accountId: 'cash',
            amount: finalAmount,
            date: date,
            merchantName: merchant,
            category,
            type: transactionType,
            isPending: false,
            manual: true
        };

        addTransaction(newTx);
        resetForm();
        onClose();
    };

    const resetForm = () => {
        setAmount('');
        setMerchant('');
        setCategory(SPENDING_CATEGORIES[0]);
        setTransactionType('expense');
        setDate(new Date().toISOString().split('T')[0]);
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                <View style={{ backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90%' }}>
                    {/* Header */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                        <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#111827' }}>
                            💵 Add Cash Transaction
                        </Text>
                        <TouchableOpacity onPress={onClose}>
                            <Text style={{ color: '#2563eb', fontWeight: '600' }}>Cancel</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        {/* Transaction Type Toggle */}
                        <Text style={{ color: '#6b7280', fontWeight: '500', marginBottom: 8 }}>Transaction Type</Text>
                        <View style={{ flexDirection: 'row', marginBottom: 20, backgroundColor: '#f3f4f6', borderRadius: 12, padding: 4 }}>
                            <Pressable
                                onPress={() => setTransactionType('expense')}
                                style={{
                                    flex: 1,
                                    padding: 12,
                                    borderRadius: 10,
                                    backgroundColor: transactionType === 'expense' ? '#ef4444' : 'transparent',
                                    alignItems: 'center'
                                }}
                            >
                                <Text style={{
                                    fontWeight: '600',
                                    color: transactionType === 'expense' ? 'white' : '#6b7280'
                                }}>
                                    💸 Spent
                                </Text>
                            </Pressable>
                            <Pressable
                                onPress={() => setTransactionType('income')}
                                style={{
                                    flex: 1,
                                    padding: 12,
                                    borderRadius: 10,
                                    backgroundColor: transactionType === 'income' ? '#22c55e' : 'transparent',
                                    alignItems: 'center'
                                }}
                            >
                                <Text style={{
                                    fontWeight: '600',
                                    color: transactionType === 'income' ? 'white' : '#6b7280'
                                }}>
                                    💰 Received
                                </Text>
                            </Pressable>
                        </View>

                        {/* Amount */}
                        <Text style={{ color: '#6b7280', fontWeight: '500', marginBottom: 8 }}>Amount</Text>
                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            backgroundColor: '#f3f4f6',
                            borderRadius: 12,
                            paddingHorizontal: 16,
                            marginBottom: 16
                        }}>
                            <Text style={{
                                fontSize: 24,
                                fontWeight: 'bold',
                                color: transactionType === 'expense' ? '#ef4444' : '#22c55e',
                                marginRight: 8
                            }}>
                                {transactionType === 'expense' ? '-$' : '+$'}
                            </Text>
                            <TextInput
                                style={{
                                    flex: 1,
                                    padding: 16,
                                    fontSize: 24,
                                    fontWeight: 'bold',
                                    color: '#111827'
                                }}
                                placeholder="0.00"
                                placeholderTextColor="#9ca3af"
                                keyboardType="decimal-pad"
                                value={amount}
                                onChangeText={setAmount}
                            />
                        </View>

                        {/* Merchant/Description */}
                        <Text style={{ color: '#6b7280', fontWeight: '500', marginBottom: 8 }}>Description</Text>
                        <TextInput
                            style={{
                                backgroundColor: '#f3f4f6',
                                padding: 16,
                                borderRadius: 12,
                                fontSize: 16,
                                marginBottom: 16,
                                color: '#111827'
                            }}
                            placeholder="e.g. Coffee, Grocery, Friend payment..."
                            placeholderTextColor="#9ca3af"
                            value={merchant}
                            onChangeText={setMerchant}
                        />

                        {/* Date */}
                        <Text style={{ color: '#6b7280', fontWeight: '500', marginBottom: 8 }}>Date</Text>
                        <TextInput
                            style={{
                                backgroundColor: '#f3f4f6',
                                padding: 16,
                                borderRadius: 12,
                                fontSize: 16,
                                marginBottom: 16,
                                color: '#111827'
                            }}
                            placeholder="YYYY-MM-DD"
                            placeholderTextColor="#9ca3af"
                            value={date}
                            onChangeText={setDate}
                        />

                        {/* Category */}
                        <Text style={{ color: '#6b7280', fontWeight: '500', marginBottom: 8 }}>Category</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 24 }}>
                            {SPENDING_CATEGORIES.map(cat => (
                                <TouchableOpacity
                                    key={cat}
                                    onPress={() => setCategory(cat)}
                                    style={{
                                        marginRight: 8,
                                        paddingHorizontal: 16,
                                        paddingVertical: 10,
                                        borderRadius: 20,
                                        borderWidth: 2,
                                        backgroundColor: category === cat ? '#2563eb' : 'white',
                                        borderColor: category === cat ? '#2563eb' : '#d1d5db'
                                    }}
                                >
                                    <Text style={{
                                        color: category === cat ? 'white' : '#4b5563',
                                        fontWeight: '500'
                                    }}>
                                        {cat}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        {/* Preview */}
                        <View style={{
                            backgroundColor: transactionType === 'expense' ? '#fef2f2' : '#f0fdf4',
                            padding: 16,
                            borderRadius: 12,
                            marginBottom: 16
                        }}>
                            <Text style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Preview</Text>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <View>
                                    <Text style={{ fontWeight: '600', color: '#374151' }}>
                                        {merchant || 'Description...'}
                                    </Text>
                                    <Text style={{ fontSize: 12, color: '#6b7280' }}>{date} • {category}</Text>
                                </View>
                                <Text style={{
                                    fontSize: 20,
                                    fontWeight: 'bold',
                                    color: transactionType === 'expense' ? '#ef4444' : '#22c55e'
                                }}>
                                    {transactionType === 'expense' ? '-' : '+'}${amount || '0.00'}
                                </Text>
                            </View>
                        </View>

                        {/* Submit Button */}
                        <TouchableOpacity
                            onPress={handleSubmit}
                            disabled={!amount || !merchant}
                            style={{
                                backgroundColor: (!amount || !merchant) ? '#9ca3af' : (transactionType === 'expense' ? '#ef4444' : '#22c55e'),
                                padding: 16,
                                borderRadius: 12,
                                alignItems: 'center',
                                marginBottom: 24
                            }}
                        >
                            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>
                                {transactionType === 'expense' ? '💸 Add Expense' : '💰 Add Income'}
                            </Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}
