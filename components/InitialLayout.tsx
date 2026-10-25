import { useEffect } from "react";
import { TouchableOpacity } from "react-native";
import { useConvexAuth } from "convex/react";
import * as SplashScreen from "expo-splash-screen";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { usePushNotifications } from "@/hooks/usePushNotifications";

SplashScreen.preventAutoHideAsync();

function HeaderBack() {
  const router = useRouter();
  return (
    <TouchableOpacity
      onPress={() => (router.canGoBack() ? router.back() : router.replace("/(app)"))}
      hitSlop={10}
      activeOpacity={0.7}
      style={{
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "#1c1c1e",
        borderWidth: 1,
        borderColor: "#2a2a2c",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 8,
      }}
    >
      <Ionicons name="arrow-back" size={20} color="#fff" />
    </TouchableOpacity>
  );
}

const headerBase = {
  headerShown: true,
  headerStyle: { backgroundColor: "#121212" },
  headerTintColor: "#fff",
  headerTitleStyle: { fontWeight: "700" as const },
  headerShadowVisible: false,
  headerLeft: () => <HeaderBack />,
  contentStyle: { backgroundColor: "#121212" },
};

export default function InitialLayout() {
  usePushNotifications();

  const { isAuthenticated, isLoading } = useConvexAuth();

  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync();
    }
  }, [isLoading]);

  if (isLoading) {
    return null;
  }

  return (
    <Stack
      key={isAuthenticated ? "signed-in" : "signed-out"}
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#121212" },
        animation: "fade",
      }}
    >
      <Stack.Protected guard={isAuthenticated}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(app)" />
        <Stack.Screen name="chat/[id]" options={{ ...headerBase, title: "Чат", animation: "slide_from_right" }} />
        <Stack.Screen name="user/[id]" options={{ ...headerBase, title: "Профіль", animation: "slide_from_right" }} />
        <Stack.Screen name="settings/[id]" options={{ ...headerBase, title: "Інформація про кімнату", animation: "slide_from_right" }} />
        <Stack.Screen name="new-room" options={{ ...headerBase, title: "Нова кімната", animation: "slide_from_right" }} />
        <Stack.Screen name="profile" options={{ headerShown: false, animation: "slide_from_right" }} />
      </Stack.Protected>

      <Stack.Protected guard={!isAuthenticated}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}