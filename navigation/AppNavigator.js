import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Screens
import HomeScreen       from '../screens/Home/HomeScreen';
import DebtsScreen      from '../screens/Debts/DebtsScreen';
import DebtDetailScreen from '../screens/Debts/DebtDetailScreen';
import SavingsScreen    from '../screens/Savings/SavingsScreen';
import SavingDetailScreen from '../screens/Savings/SavingDetailScreen';
import ReportsScreen    from '../screens/Reports/ReportsScreen';
import ProfileScreen    from '../screens/Profile/ProfileScreen';

import { COLORS, FONTS } from '../constants/theme';

const Tab   = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// ── Tab icons (emoji-based, no extra library needed) ──────────────────────────
const TAB_ICONS = {
  Home:    { default: '🏠', focused: '🏠' },
  Debts:   { default: '💳', focused: '💳' },
  Savings: { default: '🪙', focused: '🪙' },
  Reports: { default: '📊', focused: '📊' },
  Profile: { default: '👤', focused: '👤' },
};

function CustomTabBar({ state, descriptors, navigation }) {
  return (
    <View style={styles.tabBar}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = options.tabBarLabel ?? route.name;
        const isFocused = state.index === index;
        const icon = TAB_ICONS[route.name];

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
        };

        return (
          <TouchableOpacity
            key={route.key}
            style={styles.tabItem}
            onPress={onPress}
            activeOpacity={0.75}
          >
            {isFocused && <View style={styles.tabIndicator} />}
            <Text style={[styles.tabIcon, isFocused && styles.tabIconFocused]}>
              {icon?.default ?? '●'}
            </Text>
            <Text style={[styles.tabLabel, isFocused && styles.tabLabelFocused]}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ── Stack navigators (allow push to detail screens) ───────────────────────────

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain" component={HomeScreen} />
    </Stack.Navigator>
  );
}

function DebtsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DebtsList"   component={DebtsScreen} />
      <Stack.Screen name="DebtDetail"  component={DebtDetailScreen} />
    </Stack.Navigator>
  );
}

function SavingsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SavingsList"   component={SavingsScreen} />
      <Stack.Screen name="SavingDetail"  component={SavingDetailScreen} />
    </Stack.Navigator>
  );
}

// ── Root Tab Navigator ─────────────────────────────────────────────────────────

function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home"    component={HomeStack}    options={{ tabBarLabel: 'Inicio' }} />
      <Tab.Screen name="Debts"   component={DebtsStack}   options={{ tabBarLabel: 'Deudas' }} />
      <Tab.Screen name="Savings" component={SavingsStack} options={{ tabBarLabel: 'Ahorros' }} />
      <Tab.Screen name="Reports" component={ReportsScreen} options={{ tabBarLabel: 'Reportes' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: 'Perfil' }} />
    </Tab.Navigator>
  );
}

// ── Root Navigator (here you'll add Auth stack later) ─────────────────────────

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <MainTabs />
    </NavigationContainer>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBg,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
    paddingBottom: 8,
    paddingTop: 8,
    height: 68,
  },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  tabIndicator: {
    position: 'absolute',
    top: -8,
    width: 32,
    height: 3,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
  },
  tabIcon: { fontSize: 20, opacity: 0.45 },
  tabIconFocused: { opacity: 1 },
  tabLabel: { fontSize: 10, color: COLORS.textMuted, marginTop: 3 },
  tabLabelFocused: { color: COLORS.primary, fontWeight: '700' },
});
