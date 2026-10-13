import { useEffect } from "react";
import { useConvexAuth } from "convex/react";
import * as SplashScreen from "expo-splash-screen";
import { Stack } from "expo-router";

SplashScreen.preventAutoHideAsync();

export default function InitialLayout() {
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
      screenOptions={{ headerShown: false }}
    >
      <Stack.Protected guard={isAuthenticated}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(app)" />
        <Stack.Screen name="explore" />
        <Stack.Screen name="new-room" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="chat/[id]" />
        <Stack.Screen name="settings/[id]" />
      </Stack.Protected>

      <Stack.Protected guard={!isAuthenticated}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}