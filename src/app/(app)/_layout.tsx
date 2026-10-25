import { Stack } from "expo-router";
import { COLORS } from "@/constants/theme";

export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.surface },
        headerTintColor: COLORS.white,
        headerTitleStyle: { fontWeight: "700" },
        headerLargeTitleStyle: { color: COLORS.white },
        headerLargeStyle: { backgroundColor: COLORS.surface },
        headerShadowVisible: false,
        headerBackButtonDisplayMode: "minimal",
        contentStyle: { backgroundColor: COLORS.surface },
        animation: "slide_from_right",
      }}
    >
      {/* Залиште лише ті екрани, для яких явно перевизначаєте options на рівні макету, або видаліть їх усі, якщо налаштовуєте все в самих файлах */}
      <Stack.Screen name="index" options={{ title: "Чат-кімнати", headerLargeTitle: true }} />
      <Stack.Screen name="chat/[id]" options={{ title: "Чат", headerBackTitle: "Назад" }} />
      <Stack.Screen name="new-room" options={{ presentation: "modal", title: "Нова кімната", animation: "slide_from_bottom" }} />
      <Stack.Screen name="profile" options={{ presentation: "modal", title: "Профіль", animation: "slide_from_bottom" }} />
      <Stack.Screen name="settings/[id]" options={{ presentation: "modal", title: "Інформація про кімнату", animation: "slide_from_bottom" }} />
    </Stack>
  );
}