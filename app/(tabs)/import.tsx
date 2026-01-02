import { View, Text, Pressable, ActivityIndicator, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useRef } from 'react';
import { useRouter } from 'expo-router';
import { parseCSV, detectBankType, BankType } from '../../src/services/csvParser';
import { useDataStore } from '../../src/store/useDataStore';
import { Transaction } from '../../src/types';

const BACKEND_URL = 'http://localhost:3001';

export default function ImportScreen() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [preview, setPreview] = useState<Transaction[]>([]);
    const [selectedBank, setSelectedBank] = useState<BankType>('auto');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();
    const { importTransactions } = useDataStore();

    const handleFileSelect = async (event: any) => {
        setError(null);
        setSuccess(null);
        setIsLoading(true);

        try {
            const file = event.target.files?.[0];
            if (!file) {
                setError('No file selected');
                setIsLoading(false);
                return;
            }

            const fileName = file.name.toLowerCase();

            // Handle PDF files
            if (fileName.endsWith('.pdf')) {
                await handlePDFFile(file);
            }
            // Handle CSV files
            else if (fileName.endsWith('.csv')) {
                await handleCSVFile(file);
            } else {
                setError('Unsupported file type. Please upload a PDF or CSV file.');
            }
        } catch (err) {
            console.error('Error processing file:', err);
            setError('Failed to process file. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePDFFile = async (file: File) => {
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch(`${BACKEND_URL}/api/parse-pdf`, {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || 'Failed to parse PDF');
                return;
            }

            if (data.transactions.length === 0) {
                setError('No transactions found in PDF. The format may not be supported.');
                return;
            }

            setPreview(data.transactions);
            setSuccess(`Found ${data.transactions.length} transactions from PDF!`);
        } catch (err) {
            console.error('PDF parsing error:', err);
            setError('Failed to connect to server. Make sure backend is running on port 3001.');
        }
    };

    const handleCSVFile = async (file: File) => {
        const content = await file.text();
        const detectedBank = detectBankType(content);
        const transactions = parseCSV(content, selectedBank === 'auto' ? detectedBank : selectedBank);

        if (transactions.length === 0) {
            setError('No transactions found in CSV. Please check the format.');
            return;
        }

        setPreview(transactions);
        setSuccess(`Found ${transactions.length} transactions!`);
    };

    const handleImport = () => {
        setIsLoading(true);
        importTransactions(preview);
        setSuccess(`Imported ${preview.length} transactions!`);
        setPreview([]);

        setTimeout(() => {
            router.replace('/(tabs)/transactions');
        }, 1500);

        setIsLoading(false);
    };

    const triggerFileInput = () => {
        if (Platform.OS === 'web' && fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
            <ScrollView style={{ flex: 1, padding: 24 }}>
                <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#1f2937', marginBottom: 8 }}>
                    Import Transactions
                </Text>
                <Text style={{ fontSize: 16, color: '#6b7280', marginBottom: 24 }}>
                    Upload PDF or CSV statements from your bank
                </Text>

                {/* Bank Selection */}
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 12 }}>
                    Select Your Bank (for CSV):
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 24, gap: 8 }}>
                    {[
                        { id: 'auto', name: '🔍 Auto-Detect' },
                        { id: 'pnc', name: '🏦 PNC Bank' },
                        { id: 'amex', name: '💳 American Express' },
                        { id: 'capital_one', name: '🏧 Capital One' },
                    ].map(bank => (
                        <Pressable
                            key={bank.id}
                            onPress={() => setSelectedBank(bank.id as BankType)}
                            style={{
                                padding: 12,
                                borderRadius: 8,
                                backgroundColor: selectedBank === bank.id ? '#2563eb' : '#f3f4f6',
                                borderWidth: 2,
                                borderColor: selectedBank === bank.id ? '#2563eb' : 'transparent',
                            }}
                        >
                            <Text style={{
                                color: selectedBank === bank.id ? 'white' : '#374151',
                                fontWeight: '500'
                            }}>
                                {bank.name}
                            </Text>
                        </Pressable>
                    ))}
                </View>

                {/* File Upload */}
                {Platform.OS === 'web' && (
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv,.pdf"
                        onChange={handleFileSelect}
                        style={{ display: 'none' }}
                    />
                )}

                <Pressable
                    onPress={triggerFileInput}
                    disabled={isLoading}
                    style={{
                        backgroundColor: '#f3f4f6',
                        borderWidth: 2,
                        borderColor: '#d1d5db',
                        borderStyle: 'dashed',
                        borderRadius: 12,
                        padding: 32,
                        alignItems: 'center',
                        marginBottom: 24,
                    }}
                >
                    {isLoading ? (
                        <ActivityIndicator size="large" color="#2563eb" />
                    ) : (
                        <>
                            <Text style={{ fontSize: 48, marginBottom: 12 }}>📄</Text>
                            <Text style={{ fontSize: 16, fontWeight: '600', color: '#374151' }}>
                                Click to upload PDF or CSV file
                            </Text>
                            <Text style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>
                                Supported: PDF statements, CSV exports
                            </Text>
                        </>
                    )}
                </Pressable>

                {/* Error/Success Messages */}
                {error && (
                    <View style={{ backgroundColor: '#fef2f2', padding: 12, borderRadius: 8, marginBottom: 16 }}>
                        <Text style={{ color: '#dc2626' }}>❌ {error}</Text>
                    </View>
                )}

                {success && (
                    <View style={{ backgroundColor: '#f0fdf4', padding: 12, borderRadius: 8, marginBottom: 16 }}>
                        <Text style={{ color: '#16a34a' }}>✅ {success}</Text>
                    </View>
                )}

                {/* Preview */}
                {preview.length > 0 && (
                    <View style={{ marginBottom: 24 }}>
                        <Text style={{ fontSize: 18, fontWeight: '600', color: '#374151', marginBottom: 12 }}>
                            Preview ({preview.length} transactions)
                        </Text>

                        <View style={{ backgroundColor: '#f9fafb', borderRadius: 12, padding: 16, maxHeight: 300 }}>
                            {preview.slice(0, 10).map((t, index) => (
                                <View key={index} style={{
                                    flexDirection: 'row',
                                    justifyContent: 'space-between',
                                    paddingVertical: 8,
                                    borderBottomWidth: index < 9 ? 1 : 0,
                                    borderBottomColor: '#e5e7eb',
                                }}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ fontWeight: '500', color: '#374151' }} numberOfLines={1}>
                                            {t.merchantName}
                                        </Text>
                                        <Text style={{ fontSize: 12, color: '#6b7280' }}>
                                            {t.date} • {t.category}
                                        </Text>
                                    </View>
                                    <Text style={{
                                        fontWeight: '600',
                                        color: t.amount < 0 ? '#dc2626' : '#16a34a'
                                    }}>
                                        {t.amount < 0 ? '-' : '+'}${Math.abs(t.amount).toFixed(2)}
                                    </Text>
                                </View>
                            ))}
                            {preview.length > 10 && (
                                <Text style={{ marginTop: 8, color: '#6b7280', textAlign: 'center' }}>
                                    ... and {preview.length - 10} more
                                </Text>
                            )}
                        </View>

                        <Pressable
                            onPress={handleImport}
                            disabled={isLoading}
                            style={{
                                backgroundColor: '#16a34a',
                                padding: 16,
                                borderRadius: 12,
                                alignItems: 'center',
                                marginTop: 16,
                            }}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>
                                    Import {preview.length} Transactions
                                </Text>
                            )}
                        </Pressable>
                    </View>
                )}

                {/* Instructions */}
                <View style={{ backgroundColor: '#f0f9ff', padding: 16, borderRadius: 12, marginBottom: 24 }}>
                    <Text style={{ fontWeight: '600', color: '#0369a1', marginBottom: 8 }}>
                        📋 How to download your statements:
                    </Text>
                    <Text style={{ color: '#0369a1', lineHeight: 20 }}>
                        • <Text style={{ fontWeight: '600' }}>PNC:</Text> Online Banking → Statements → Download PDF{'\n'}
                        • <Text style={{ fontWeight: '600' }}>Amex:</Text> Statements & Activity → View PDF{'\n'}
                        • <Text style={{ fontWeight: '600' }}>Capital One:</Text> Statements → Download
                    </Text>
                </View>

                <Pressable
                    onPress={() => router.back()}
                    style={{ padding: 16, alignItems: 'center' }}
                >
                    <Text style={{ color: '#6b7280' }}>Go Back</Text>
                </Pressable>
            </ScrollView>
        </SafeAreaView>
    );
}
