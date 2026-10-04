import Feather from '@expo/vector-icons/Feather';
import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { Brand, Type } from '@/constants/theme';
import { useBag } from '@/src/context/BagContext';

export default function TabLayout() {
  const { count } = useBag();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarActiveTintColor: Brand.red,
        tabBarInactiveTintColor: Brand.smoke,
        tabBarStyle: { backgroundColor: Brand.bone, borderTopColor: Brand.ink, borderTopWidth: 1, height: 68, paddingTop: 6, paddingBottom: 10 },
        tabBarLabelStyle: { fontFamily: Type.monoBold, fontSize: 10, lineHeight: 14, letterSpacing: 1, textTransform: 'uppercase' },
      }}>
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ color }) => <Feather name="home" size={22} color={color} /> }} />
      <Tabs.Screen name="catalog" options={{ title: 'Shop', tabBarIcon: ({ color }) => <Feather name="grid" size={22} color={color} /> }} />
      <Tabs.Screen
        name="bag"
        options={{
          title: 'Bag',
          tabBarBadge: count > 0 ? count : undefined,
          tabBarBadgeStyle: { backgroundColor: Brand.red, color: Brand.bone, fontFamily: Type.monoBold, fontSize: 10 },
          tabBarIcon: ({ color }) => <Feather name="shopping-bag" size={22} color={color} />,
        }}
      />
      <Tabs.Screen name="admin" options={{ title: 'Admin', tabBarIcon: ({ color }) => <Feather name="user" size={22} color={color} /> }} />
      <Tabs.Screen name="explore" options={{ href: null }} />
    </Tabs>
  );
}
