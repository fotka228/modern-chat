import { View, Text, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";

export default function ProfileScreen() {
  const router = useRouter();
  const currentUser = useQuery(api.users.currentUser);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/");
    }
  };

  const handleSignOut = async () => {
    try {
      // Якщо ви зберігаєте токен авторизації у AsyncStorage / SecureStore,
      // видаліть його тут (наприклад: await AsyncStorage.removeItem("token")).
      
      router.replace("/(auth)/login");
    } catch (error) {
      console.error("Sign out error:", error);
      Alert.alert("Помилка", "Не вдалося вийти з акаунту.");
    }
  };

  return (
    <View className="flex-1 bg-slate-50 p-6">
      {/* Кнопка Назад */}
      <TouchableOpacity
        onPress={handleBack}
        className="flex-row items-center mb-6 self-start bg-white border border-slate-200 px-3 py-2 rounded-xl shadow-sm active:bg-slate-100"
        activeOpacity={0.7}
      >
        <Ionicons name="arrow-back" size={20} color="#334155" />
        <Text className="text-slate-700 font-semibold ml-2 text-sm">Назад</Text>
      </TouchableOpacity>

      <View className="items-center mb-8 mt-4">
        <View className="w-20 h-20 rounded-full bg-blue-100 border-2 border-blue-500 items-center justify-center mb-3">
          <Ionicons name="person" size={40} color="#2563eb" />
        </View>
        <Text className="text-slate-900 text-xl font-bold">
          {currentUser?.name || "Користувач"}
        </Text>
        <Text className="text-slate-500 text-sm mt-1">
          {currentUser?.email || "koilinskij@gmail.com"}
        </Text>
      </View>

      <TouchableOpacity
        onPress={handleSignOut}
        className="bg-white border border-red-200 rounded-2xl py-4 flex-row items-center justify-center active:bg-red-50 shadow-sm"
        activeOpacity={0.8}
      >
        <Ionicons
          name="log-out-outline"
          size={20}
          color="#dc2626"
          style={{ marginRight: 8 }}
        />
        <Text className="text-red-600 font-bold text-base">
          Вийти з акаунту
        </Text>
      </TouchableOpacity>
    </View>
  );
}