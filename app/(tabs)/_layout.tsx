import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: '#FFFFFF',
                    borderTopWidth: 0,
                    elevation: 5,
                    shadowOpacity: 0.1,
                    shadowRadius: 10,
                    height: 90,
                    paddingTop: 10,
                },
                tabBarActiveTintColor: '#2563eb',
                tabBarInactiveTintColor: '#94a3b8',
                tabBarLabelStyle: {
                    paddingBottom: 10,
                    fontSize: 12,
                    fontWeight: '600'
                }
            }}
        >
            <Tabs.Screen
                name="dashboard"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color, size }) => <Ionicons name="pie-chart" size={size} color={color} />,
                }}
            />
            <Tabs.Screen
                name="transactions"
                options={{
                    title: 'Activity',
                    tabBarIcon: ({ color, size }) => <Ionicons name="list" size={size} color={color} />,
                }}
            />
            <Tabs.Screen
                name="budget"
                options={{
                    title: 'Budget',
                    tabBarIcon: ({ color, size }) => <Ionicons name="wallet" size={size} color={color} />,
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />,
                }}
            />
            <Tabs.Screen
                name="import"
                options={{
                    title: 'Import',
                    tabBarIcon: ({ color, size }) => <Ionicons name="cloud-upload" size={size} color={color} />,
                }}
            />
            <Tabs.Screen
                name="connect"
                options={{
                    href: null, // Hide from tab bar but keep accessible
                }}
            />
        </Tabs>
    );
}
