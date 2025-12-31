import { View, Text, Pressable, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { plaidService } from '../../src/services/plaidService';

export default function ConnectBankScreen() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const router = useRouter();

    // Load Plaid Link script on web
    useEffect(() => {
        if (Platform.OS === 'web') {
            const script = document.createElement('script');
            script.src = 'https://cdn.plaid.com/link/v2/stable/link-initialize.js';
            script.async = true;
            document.body.appendChild(script);
        }
    }, []);

    const handleConnectBank = async () => {
        setIsLoading(true);
        setError(null);

        try {
            // Step 1: Get link token from our secure backend
            const linkToken = await plaidService.createLinkToken();
            console.log('Got link token:', linkToken);

            if (Platform.OS === 'web' && (window as any).Plaid) {
                // Open Plaid Link on web
                const handler = (window as any).Plaid.create({
                    token: linkToken,
                    onSuccess: async (publicToken: string, metadata: any) => {
                        console.log('Plaid success!', publicToken);
                        setIsLoading(true);

                        try {
                            // Exchange token
                            await plaidService.exchangeToken(publicToken);

                            // Get accounts
                            const accounts = await plaidService.getAccounts();
                            setSuccess(`Connected ${accounts.length} account(s)!`);

                            setTimeout(() => {
                                router.replace('/(tabs)/dashboard');
                            }, 2000);
                        } catch (err) {
                            setError('Failed to complete connection');
                        }
                        setIsLoading(false);
                    },
                    onExit: (err: any) => {
                        console.log('Plaid exit', err);
                        setIsLoading(false);
                        if (err) {
                            setError('Connection cancelled');
                        }
                    },
                    onEvent: (eventName: string) => {
                        console.log('Plaid event:', eventName);
                    },
                });

                handler.open();
            } else {
                // For mobile or if Plaid SDK not loaded
                setError('Plaid Link is loading... Please try again in a moment.');
            }
        } catch (err) {
            console.error('Error:', err);
            setError('Failed to initialize. Make sure backend is running on port 3001.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: 'white', padding: 24 }}>
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#1f2937', marginBottom: 8, textAlign: 'center' }}>
                    Connect Your Bank
                </Text>
                <Text style={{ fontSize: 16, color: '#6b7280', marginBottom: 40, textAlign: 'center' }}>
                    Securely link your accounts to track spending
                </Text>

                <View style={{ width: '100%', marginBottom: 20 }}>
                    <BankOption name="PNC Bank" logo="🏦" />
                    <BankOption name="American Express" logo="💳" />
                    <BankOption name="Capital One" logo="🏧" />
                </View>

                {error && (
                    <View style={{ backgroundColor: '#fef2f2', padding: 12, borderRadius: 8, marginBottom: 16, width: '100%' }}>
                        <Text style={{ color: '#dc2626', textAlign: 'center' }}>{error}</Text>
                    </View>
                )}

                {success && (
                    <View style={{ backgroundColor: '#f0fdf4', padding: 12, borderRadius: 8, marginBottom: 16, width: '100%' }}>
                        <Text style={{ color: '#16a34a', textAlign: 'center' }}>{success}</Text>
                    </View>
                )}

                <Pressable
                    onPress={handleConnectBank}
                    disabled={isLoading}
                    style={{
                        width: '100%',
                        backgroundColor: isLoading ? '#93c5fd' : '#2563eb',
                        padding: 16,
                        borderRadius: 12,
                        alignItems: 'center',
                        marginTop: 20,
                    }}
                >
                    {isLoading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 18 }}>
                            Connect via Plaid
                        </Text>
                    )}
                </Pressable>

                <View style={{ marginTop: 20, padding: 16, backgroundColor: '#fef3c7', borderRadius: 8, width: '100%' }}>
                    <Text style={{ fontWeight: 'bold', color: '#92400e', marginBottom: 8 }}>
                        🧪 Sandbox Mode - Test Credentials:
                    </Text>
                    <Text style={{ color: '#92400e' }}>Username: user_good</Text>
                    <Text style={{ color: '#92400e' }}>Password: pass_good</Text>
                </View>

                <Text style={{ marginTop: 20, fontSize: 12, color: '#9ca3af', textAlign: 'center' }}>
                    🔒 Your credentials are entered directly on your bank's secure website.{'\n'}
                    This app never sees your password.
                </Text>

                <Pressable
                    onPress={() => router.back()}
                    style={{ marginTop: 30, padding: 10 }}
                >
                    <Text style={{ color: '#6b7280' }}>Skip for now</Text>
                </Pressable>
            </View>
        </SafeAreaView>
    );
}

function BankOption({ name, logo }: { name: string; logo: string }) {
    return (
        <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            padding: 16,
            backgroundColor: '#f3f4f6',
            borderRadius: 12,
            marginBottom: 12,
        }}>
            <Text style={{ fontSize: 24, marginRight: 12 }}>{logo}</Text>
            <Text style={{ fontSize: 16, fontWeight: '500', color: '#374151' }}>{name}</Text>
            <Text style={{ marginLeft: 'auto', color: '#10b981' }}>✓ Supported</Text>
        </View>
    );
}
