import { View, Text, Pressable } from 'react-native';
import { useAuthStore } from '../../src/store/useAuthStore';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
    const { login, isLoading } = useAuthStore();
    const router = useRouter();

    const handleLogin = async () => {
        try {
            await login();
            router.replace('/(tabs)/dashboard');
        } catch (error) {
            console.error('Login failed:', error);
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
            <View style={{ marginBottom: 40, alignItems: 'center' }}>
                <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#2563eb', marginBottom: 8 }}>BudgetFree</Text>
                <Text style={{ color: '#6b7280', fontSize: 18 }}>Take control of your finance</Text>
            </View>

            <Pressable
                onPress={handleLogin}
                disabled={isLoading}
                style={{
                    width: '100%',
                    backgroundColor: isLoading ? '#93c5fd' : '#2563eb',
                    padding: 16,
                    borderRadius: 12,
                    alignItems: 'center',
                }}
            >
                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 18 }}>
                    {isLoading ? 'Connecting...' : 'Sign in with Demo Account'}
                </Text>
            </Pressable>

            <View style={{ marginTop: 32 }}>
                <Text style={{ fontSize: 12, color: '#9ca3af' }}>Secured by Biometrics</Text>
            </View>
        </SafeAreaView>
    );
}
