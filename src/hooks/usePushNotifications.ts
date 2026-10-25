import { useEffect } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { useMutation, useConvexAuth } from "convex/react";
import { api } from "../../convex/_generated/api";

// Налаштування поведінки сповіщень у фоновому/активному режимі
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function usePushNotifications() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const savePushToken = useMutation(api.users.savePushToken);
  const router = useRouter();

  // Спрацьовує і при холодному старті, і при натисканні на сповіщення в роботі
  const lastResponse = Notifications.useLastNotificationResponse();

  // Навігація за сповіщенням (лише коли користувач увійшов)
  useEffect(() => {
    if (isLoading || !isAuthenticated) return;
    if (
      !lastResponse ||
      lastResponse.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER
    ) {
      return;
    }

    const data = lastResponse.notification.request.content.data as
      | { roomId?: string; chatRoomId?: string }
      | undefined;
    const roomId = data?.roomId ?? data?.chatRoomId;

    if (roomId) router.push(`/chat/${roomId}` as any);
    else router.push("/(app)" as any);
  }, [lastResponse, isAuthenticated, isLoading]);

  // Отримання й збереження токена
  useEffect(() => {
    if (isLoading || !isAuthenticated) return;

    // Пуш-токени не працюють у браузері (на веб)
    if (Platform.OS === "web") {
      console.log("🌐 Веб-платформа: отримання Expo Push Token пропущено.");
      return;
    }

    registerForPushNotificationsAsync().then((token) => {
      if (token) {
        savePushToken({ pushToken: token }).catch((err) => {
          console.error("Помилка збереження pushToken у Convex:", err);
        });
      }
    });
  }, [isAuthenticated, isLoading]);
}

async function registerForPushNotificationsAsync(): Promise<string | null> {
  // На всякий випадок додатковий захист від виконання на веб
  if (Platform.OS === "web") return null;

  try {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Повідомлення чату",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#0a84ff",
        sound: "default",
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("Дозвіл на отримання сповіщень не було надано.");
      return null;
    }

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;

    if (!projectId) {
      console.error("⚠️ Попередження: Project ID не знайдено в app.json для отримання Push-токена.");
    }

    // Запит за токеном до серверів Expo
    const tokenData = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );
    
    return tokenData.data;
  } catch (error: any) {
    // М'яко обробляємо помилку мережі або симулятора, щоб не ламати додаток
    console.warn("Не вдалося отримати pushToken (можливо, це симулятор або відсутнє з'єднання):", error?.message || error);
    return null;
  }
}