import { View, Text, Pressable, ActivityIndicator, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useRef } from 'react';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
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
    const [detectedBankName, setDetectedBankName] = useState<string>('Imported Account');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();
    const { importTransactions } = useDataStore();

    const pickDocument = async () => {
        setError(null);
        setSuccess(null);

        if (Platform.OS === 'web') {
            fileInputRef.current?.click();
            return;
        }

        try {
            setIsLoading(true);
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/pdf', 'text/comma-separated-values', 'text/csv'],
                copyToCacheDirectory: true
            });

            if (result.canceled) {
                setIsLoading(false);
                return;
            }

            const file = result.assets[0];
            const fileName = file.name.toLowerCase();

            // Native File Object for Upload (slightly different structure than Web)
            const fileObj = {
                uri: file.uri,
                name: file.name,
                type: file.mimeType || 'application/octet-stream' // fallback type
            };

            if (fileName.endsWith('.pdf')) {
                await handleNativePDFUpload(fileObj);
            } else if (fileName.endsWith('.csv')) {
                await handleNativePDFUpload(fileObj);
            } else {
                setError('Unsupported file type.');
            }

        } catch (err) {
            console.error('Pick error:', err);
            setError('Failed to pick file');
        } finally {
            setIsLoading(false);
        }
    };

    const handleWebFileSelect = async (event: any) => {
        setError(null);
        setSuccess(null);
        setIsLoading(true);

        try {
            const file = event.target.files?.[0];
            if (!file) {
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
            setError('Failed to process file.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleNativePDFUpload = async (fileObj: any) => {
        try {
            const formData = new FormData();
            formData.append('file', {
                uri: fileObj.uri,
                name: fileObj.name,
                type: fileObj.type
            } as any);

            const response = await fetch(`${BACKEND_URL}/api/parse-pdf`, {
                method: 'POST',
                body: formData,
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || 'Failed to parse PDF');
                return;
            }

            if (data.transactions.length === 0) {
                setError('No transactions found. Format may not be supported.');
                return;
            }

            setPreview(data.transactions);

            // Set detected bank name
            if (data.detectedBank) {
                setDetectedBankName(data.detectedBank);
                setSuccess(`Found ${data.transactions.length} transactions from ${data.detectedBank}!`);
            } else {
                setDetectedBankName('Imported PDF Statement');
                setSuccess(`Found ${data.transactions.length} transactions!`);
            }

        } catch (err) {
            console.error('Upload error:', err);
            setError('Failed to upload file. Check backend connection.');
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

            // Set detected bank name
            if (data.detectedBank) {
                setDetectedBankName(data.detectedBank);
                setSuccess(`Found ${data.transactions.length} transactions from ${data.detectedBank}!`);
            } else {
                setDetectedBankName('Imported PDF Statement');
                setSuccess(`Found ${data.transactions.length} transactions!`);
            }

        } catch (err) {
            console.error('PDF parsing error:', err);
            setError('Failed to connect to server. Make sure backend is running on port 3001.');
        }
    };

    const handleCSVFile = async (file: File) => {
        const content = await file.text();
        const detectedBank = detectBankType(content);
        const finalBankType = selectedBank === 'auto' ? detectedBank : selectedBank;
        const transactions = parseCSV(content, finalBankType);

        if (transactions.length === 0) {
            setError('No transactions found in CSV. Please check the format.');
            return;
        }

        setPreview(transactions);

        // Map bank code to readable name
        const bankNameMap: Record<string, string> = {
            'pnc': 'PNC Bank',
            'amex': 'American Express',
            'capital_one': 'Capital One',
            'auto': 'Imported CSV'
        };

        const friendlyName = bankNameMap[finalBankType] || 'Imported CSV';
        setDetectedBankName(friendlyName);
        setSuccess(`Found ${transactions.length} transactions from ${friendlyName}!`);
    };

    const handleImport = () => {
        setIsLoading(true);
        // Pass the detected bank name to create/update specific account
        importTransactions(preview, detectedBankName);

        setSuccess(`Imported ${preview.length} transactions to "${detectedBankName}"!`);
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
                        onChange={handleWebFileSelect}
                        style={{ display: 'none' }}
                    />
                )}

                <Pressable
                    onPress={pickDocument}
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

                {/* Confirm Import Button (Only when preview exists) */}
                {preview.length > 0 && (
                    <View style={{ marginBottom: 24 }}>
                        <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8 }}>
                            Importing to: <Text style={{ color: '#2563eb' }}>{detectedBankName}</Text>
                        </Text>
                        <Pressable
                            onPress={handleImport}
                            style={{
                                backgroundColor: '#16a34a',
                                padding: 16,
                                borderRadius: 8,
                                alignItems: 'center'
                            }}
                        >
                            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>
                                Confirm Import ({preview.length} Transactions)
                            </Text>
                        </Pressable>
                    </View>
                )}

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
            </ScrollView>
        </SafeAreaView>
    );
}
