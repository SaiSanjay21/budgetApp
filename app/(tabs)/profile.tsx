import { View, Text, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../src/store/useAuthStore';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
    const { user, logout } = useAuthStore();

    return (
        <SafeAreaView className="flex-1 bg-slate-50">
            <View className="bg-white p-6 items-center border-b border-gray-100">
                <View className="w-20 h-20 bg-blue-100 rounded-full items-center justify-center mb-4">
                    <Text className="text-3xl font-bold text-blue-600">
                        {user?.displayName?.charAt(0) || 'U'}
                    </Text>
                </View>
                <Text className="text-xl font-bold text-gray-900">{user?.displayName}</Text>
                <Text className="text-gray-500">{user?.email}</Text>
            </View>

            <View className="p-4">
                <Text className="text-sm font-bold text-gray-400 mb-2 uppercase ml-2">Settings</Text>

                <View className="bg-white rounded-xl overflow-hidden">
                    <View className="p-4 flex-row justify-between items-center border-b border-gray-50">
                        <Text className="text-gray-700 font-medium">Biometric Login</Text>
                        <Switch value={user?.biometricEnabled} trackColor={{ false: '#767577', true: '#3b82f6' }} />
                    </View>
                    <View className="p-4 flex-row justify-between items-center">
                        <Text className="text-gray-700 font-medium">Notifications</Text>
                        <Switch value={true} trackColor={{ false: '#767577', true: '#3b82f6' }} />
                    </View>
                </View>

                <TouchableOpacity
                    onPress={logout}
                    className="mt-8 bg-red-50 p-4 rounded-xl flex-row items-center justify-center gap-2"
                >
                    <Ionicons name="log-out-outline" size={20} color="#ef4444" />
                    <Text className="text-red-600 font-bold">Sign Out</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}
