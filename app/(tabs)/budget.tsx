import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SPENDING_CATEGORIES, CATEGORY_COLORS, Category } from '../../src/constants/Categories';

// Mock Budget Limits
const BUDGET_LIMITS: Record<string, number> = {
    'Groceries': 500,
    'Dining': 300,
    'Transportation': 150,
    'Entertainment': 200,
    'Shopping': 400
};

export default function BudgetScreen() {
    return (
        <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
            <View className="px-4 pb-2 border-b border-gray-100 bg-white">
                <Text className="text-2xl font-bold text-gray-900 my-2">Monthly Budget</Text>
            </View>
            <ScrollView className="p-4">
                {Object.entries(BUDGET_LIMITS).map(([cat, limit]) => {
                    const spent = Math.floor(Math.random() * limit * 1.2); // Mock spending
                    const progress = Math.min(spent / limit, 1);
                    const isOver = spent > limit;
                    const color = CATEGORY_COLORS[cat as Category];

                    return (
                        <View key={cat} className="bg-white p-4 rounded-xl mb-4 shadow-sm">
                            <View className="flex-row justify-between mb-2">
                                <View className="flex-row items-center gap-2">
                                    <View style={{ backgroundColor: color }} className="w-3 h-3 rounded-full" />
                                    <Text className="font-semibold text-gray-800">{cat}</Text>
                                </View>
                                <Text className={isOver ? 'text-red-500 font-bold' : 'text-gray-600'}>
                                    ${spent} / ${limit}
                                </Text>
                            </View>
                            <View className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                <View
                                    style={{ width: `${progress * 100}%`, backgroundColor: isOver ? '#ef4444' : color }}
                                    className="h-full rounded-full"
                                />
                            </View>
                            {isOver && <Text className="text-xs text-red-500 mt-2">Budget exceeded by ${spent - limit}</Text>}
                        </View>
                    );
                })}
            </ScrollView>
        </SafeAreaView>
    );
}
