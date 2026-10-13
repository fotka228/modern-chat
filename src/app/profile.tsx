import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  Platform,
  Image,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "../../convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";
import { EditProfileModal } from "../components/EditProfileModal";

export default function ProfileScreen() {
  const router = useRouter();
  const { signOut } = useAuthActions();
  const currentUser = useQuery(api.users.currentUser);
  const details = useQuery(
    api.users.getUserProfile,
    currentUser?._id ? { userId: currentUser._id } : "skip"
  );
  const [editOpen, setEditOpen] = useState(false);

  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/");
  };

  const performSignOut = async () => {
    try {
      await signOut();
      if (Platform.OS === "web") window.location.replace("/login");
    } catch (error) {
      console.error("Sign out error:", error);
      Alert.alert("Помилка", "Не вдалося вийти з акаунту.");
    }
  };

  const handleSignOut = () => {
    if (Platform.OS === "web") {
      if (window.confirm("Ви впевнені, що хочете вийти з акаунту?")) performSignOut();
      return;
    }
    Alert.alert("Вихід", "Ви впевнені, що хочете вийти з акаунту?", [
      { text: "Скасувати", style: "cancel" },
      { text: "Вийти", style: "destructive", onPress: performSignOut },
    ]);
  };

  if (currentUser === undefined) {
    return (
      <View className="flex-1 bg-[#121212] justify-center items-center">
        <ActivityIndicator size="large" color="#0a84ff" />
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-[#121212]"
      contentContainerStyle={{ alignItems: "center" }}
    >
      <View className="w-full max-w-md p-6">
        <TouchableOpacity
          onPress={handleBack}
          className="flex-row items-center mb-6 self-start bg-[#1c1c1e] border border-[#2a2a2c] px-3 py-2 rounded-full"
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={18} color="#FFFFFF" />
          <Text className="text-white font-semibold ml-2 text-sm">Назад</Text>
        </TouchableOpacity>

        {/* Шапка профілю */}
        <View className="items-center mb-6">
          <View className="w-28 h-28 rounded-full bg-[#1c1c1e] border-4 border-[#0a84ff]/40 overflow-hidden items-center justify-center mb-3">
            {currentUser?.image ? (
              <Image
                source={{ uri: currentUser.image }}
                className="w-full h-full"
                resizeMode="cover"
              />
            ) : (
              <Ionicons name="person" size={52} color="#0a84ff" />
            )}
          </View>

          <Text className="text-white text-2xl font-bold">
            {currentUser?.name || "Користувач"}
          </Text>

          {currentUser?.username ? (
            <Text className="text-[#0a84ff] text-sm font-semibold mt-0.5">
              @{currentUser.username}
            </Text>
          ) : null}

          {currentUser?.email ? (
            <Text className="text-neutral-400 text-xs mt-1">{currentUser.email}</Text>
          ) : null}

          {currentUser?.bio ? (
            <View className="mt-3 px-4 py-2 bg-[#1c1c1e] rounded-xl border border-[#2a2a2c] max-w-[90%]">
              <Text className="text-neutral-200 text-sm text-center italic">
                {currentUser.bio}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Статистика активності */}
        <View className="flex-row gap-3 mb-6">
          <View className="flex-1 bg-[#1c1c1e] border border-[#2a2a2c] rounded-2xl p-4 items-center">
            <Ionicons name="chatbubble-ellipses" size={22} color="#0a84ff" />
            <Text className="text-white text-xl font-bold mt-2">
              {details?.stats.messagesCount ?? 0}
            </Text>
            <Text className="text-neutral-400 text-xs mt-0.5">Повідомлень</Text>
          </View>

          <View className="flex-1 bg-[#1c1c1e] border border-[#2a2a2c] rounded-2xl p-4 items-center">
            <Ionicons name="folder" size={22} color="#bf5af2" />
            <Text className="text-white text-xl font-bold mt-2">
              {details?.stats.roomsCreatedCount ?? 0}
            </Text>
            <Text className="text-neutral-400 text-xs mt-0.5">Створено кімнат</Text>
          </View>
        </View>

        {/* Дії з акаунтом */}
        <TouchableOpacity
          onPress={() => setEditOpen(true)}
          className="flex-row items-center justify-center bg-[#0a84ff] rounded-2xl py-4 mb-3"
          activeOpacity={0.8}
        >
          <Ionicons name="create-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text className="text-white font-bold text-base">Редагувати профіль</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleSignOut}
          className="bg-[#1c1c1e] border border-red-500/40 rounded-2xl py-4 flex-row items-center justify-center"
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={20} color="#ef4444" style={{ marginRight: 8 }} />
          <Text className="text-red-500 font-bold text-base">Вийти з акаунту</Text>
        </TouchableOpacity>
      </View>

      <EditProfileModal
        visible={editOpen}
        onClose={() => setEditOpen(false)}
        currentUser={currentUser}
      />
    </ScrollView>
  );
}