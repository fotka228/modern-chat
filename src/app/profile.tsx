import { View, Text, TouchableOpacity, Alert, Platform } from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "../../convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";

export default function ProfileScreen() {
  const router = useRouter();
  const { signOut } = useAuthActions();
  const currentUser = useQuery(api.users.currentUser);

  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/");
  };

  const performSignOut = async () => {
    try {
      await signOut();
      // На вебі повністю перезавантажуємо сторінку, щоб скинути стек навігації
      if (Platform.OS === "web") {
        window.location.replace("/login");
      }
      // На телефоні перекине Stack.Protected в InitialLayout
    } catch (error) {
      console.error("Sign out error:", error);
      Alert.alert("Помилка", "Не вдалося вийти з акаунту.");
    }
  };

  const handleSignOut = () => {
    if (Platform.OS === "web") {
      // На вебі Alert.alert не працює, тому використовуємо window.confirm
      if (window.confirm("Ви впевнені, що хочете вийти з акаунту?")) {
        performSignOut();
      }
      return;
    }

    Alert.alert("Вихід", "Ви впевнені, що хочете вийти з акаунту?", [
      { text: "Скасувати", style: "cancel" },
      { text: "Вийти", style: "destructive", onPress: performSignOut },
    ]);
  };

  return (
    <View className="flex-1 bg-[#121212] items-center">
      <View className="w-full max-w-md p-6">
        {/* Назад */}
        <TouchableOpacity
          onPress={handleBack}
          className="flex-row items-center mb-8 self-start bg-[#1c1c1e] border border-[#2a2a2c] px-3 py-2 rounded-full active:opacity-70"
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={18} color="#FFFFFF" />
          <Text className="text-white font-semibold ml-2 text-sm">Назад</Text>
        </TouchableOpacity>

        {/* Профіль */}
        <View className="items-center mb-8">
          <View className="w-24 h-24 rounded-full bg-[#1c1c1e] border-2 border-[#0a84ff] items-center justify-center mb-4">
            <Ionicons name="person" size={44} color="#0a84ff" />
          </View>
          <Text className="text-white text-2xl font-bold">
            {currentUser?.name || "Користувач"}
          </Text>
          {currentUser?.email ? (
            <Text className="text-neutral-400 text-sm mt-1">
              {currentUser.email}
            </Text>
          ) : null}
        </View>

        {/* Вихід */}
        <TouchableOpacity
          onPress={handleSignOut}
          className="bg-[#1c1c1e] border border-red-500/40 rounded-2xl py-4 flex-row items-center justify-center active:bg-red-500/10"
          activeOpacity={0.8}
        >
          <Ionicons
            name="log-out-outline"
            size={20}
            color="#ef4444"
            style={{ marginRight: 8 }}
          />
          <Text className="text-red-500 font-bold text-base">
            Вийти з акаунту
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}