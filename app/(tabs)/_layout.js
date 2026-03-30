import { Tabs, Redirect } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';
import { useAuth } from '../../utils/authStore';

const TABS = [
  { name: 'index',   icon: 'home',      iconActive: 'home',           label: 'Inicio'   },
  { name: 'debts',   icon: 'card-outline', iconActive: 'card',        label: 'Deudas'   },
  { name: 'savings', icon: 'wallet-outline', iconActive: 'wallet',    label: 'Ahorros'  },
  { name: 'reports', icon: 'bar-chart-outline', iconActive: 'bar-chart', label: 'Reportes' },
  { name: 'profile', icon: 'person-outline', iconActive: 'person',    label: 'Perfil'   },
];

function CustomTabBar({ state, navigation }) {
  return (
    <View style={styles.tabBar}>
      {TABS.map((tab) => {
        const route = state.routes.find((r) => r.name === tab.name);
        if (!route) return null;
        const isFocused = state.index === state.routes.indexOf(route);
        return (
          <TouchableOpacity
            key={tab.name}
            style={styles.tabItem}
            onPress={() => navigation.navigate(tab.name)}
            activeOpacity={0.75}
          >
            {isFocused && <View style={styles.tabIndicator} />}
            <Ionicons
              name={isFocused ? tab.iconActive : tab.icon}
              size={22}
              color={isFocused ? COLORS.primary : COLORS.textMuted}
            />
            <Text style={[styles.tabLabel, isFocused && styles.tabLabelFocused]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  const { isLoggedIn, firstRunDone, loading } = useAuth();

  if (loading) return <View style={{ flex: 1, backgroundColor: COLORS.background }} />;

  if (!isLoggedIn) {
    return <Redirect href="/login" />;
  }

  if (!firstRunDone) {
    return <Redirect href="/firstrun" />;
  }

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index"   />
      <Tabs.Screen name="debts"   />
      <Tabs.Screen name="savings" />
      <Tabs.Screen name="reports" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar:         { flexDirection: 'row', backgroundColor: COLORS.cardBg, borderTopWidth: 1, borderTopColor: COLORS.cardBorder, paddingBottom: 8, paddingTop: 8, height: 68 },
  tabItem:        { flex: 1, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  tabIndicator:   { position: 'absolute', top: -8, width: 32, height: 3, borderRadius: 2, backgroundColor: COLORS.primary },
  tabLabel:       { fontSize: 10, color: COLORS.textMuted, marginTop: 3 },
  tabLabelFocused:{ color: COLORS.primary, fontWeight: '700' },
});
