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

function StatCard({
  icon,
  color,
  value,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  value: number;
  label: string;
}) {
  return (
    <View className="flex-1 bg-[#1c1c1e] border border-[#2a2a2c] rounded-2xl p-4 items-center">
      <View
        className="w-11 h-11 rounded-full items-center justify-center mb-2"
        style={{ backgroundColor: color + "26" }}
      >
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text className="text-white text-2xl font-bold">{value}</Text>
      <Text className="text-neutral-400 text-xs mt-0.5">{label}</Text>
    </View>
  );
}

function MenuRow({
  icon,
  label,
  onPress,
  color = "#0a84ff",
  danger = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  color?: string;
  danger?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className="flex-row items-center px-4 py-3.5"
    >
      <View
        className="w-9 h-9 rounded-xl items-center justify-center mr-3"
        style={{ backgroundColor: (danger ? "#ff453a" : color) + "26" }}
      >
        <Ionicons name={icon} size={20} color={danger ? "#ff453a" : color} />
      </View>
      <Text
        className="flex-1 text-base font-medium"
        style={{ color: danger ? "#ff453a" : "#fff" }}
      >
        {label}
      </Text>
      {!danger && <Ionicons name="chevron-forward" size={18} color="#636366" />}
    </TouchableOpacity>
  );
}

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
      showsVerticalScrollIndicator={false}
    >
      <View className="w-full max-w-md px-6 pt-6 pb-10">
        <TouchableOpacity
          onPress={handleBack}
          className="w-10 h-10 rounded-full bg-[#1c1c1e] border border-[#2a2a2c] items-center justify-center mb-4"
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Шапка профілю */}
        <View className="items-center mb-8">
          <View
            className="w-32 h-32 rounded-full bg-[#1c1c1e] border-[3px] border-[#0a84ff] overflow-hidden items-center justify-center mb-4"
            style={{
              shadowColor: "#0a84ff",
              shadowOpacity: 0.45,
              shadowRadius: 24,
              shadowOffset: { width: 0, height: 8 },
              elevation: 12,
            }}
          >
            {currentUser?.image ? (
              <Image
                source={{ uri: currentUser.image }}
                className="w-full h-full"
                resizeMode="cover"
              />
            ) : (
              <Ionicons name="person" size={58} color="#0a84ff" />
            )}
          </View>

          <Text className="text-white text-3xl font-bold text-center">
            {currentUser?.name || "Користувач"}
          </Text>

          {currentUser?.username ? (
            <View className="bg-[#0a84ff]/15 px-3 py-1 rounded-full mt-2">
              <Text className="text-[#0a84ff] text-sm font-semibold">
                @{currentUser.username}
              </Text>
            </View>
          ) : null}

          {currentUser?.email ? (
            <View className="flex-row items-center mt-2">
              <Ionicons name="mail-outline" size={14} color="#8e8e93" />
              <Text className="text-neutral-400 text-sm ml-1.5">{currentUser.email}</Text>
            </View>
          ) : null}

          {currentUser?.bio ? (
            <View className="mt-4 px-4 py-3 bg-[#1c1c1e] rounded-2xl border border-[#2a2a2c] w-full">
              <Text className="text-neutral-200 text-sm text-center leading-5">
                {currentUser.bio}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Статистика */}
        <View className="flex-row gap-3 mb-6">
          <StatCard
            icon="chatbubble-ellipses"
            color="#0a84ff"
            value={details?.stats.messagesCount ?? 0}
            label="Повідомлень"
          />
          <StatCard
            icon="folder"
            color="#bf5af2"
            value={details?.stats.roomsCreatedCount ?? 0}
            label="Створено кімнат"
          />
        </View>

        {/* Меню */}
        <Text className="text-neutral-500 text-xs font-semibold uppercase mb-2 ml-1">Акаунт</Text>
        <View className="bg-[#1c1c1e] border border-[#2a2a2c] rounded-2xl overflow-hidden">
          <MenuRow
            icon="create-outline"
            label="Редагувати профіль"
            onPress={() => setEditOpen(true)}
          />
          <View className="h-px bg-[#2a2a2c] ml-16" />
          <MenuRow
            icon="log-out-outline"
            label="Вийти з акаунту"
            onPress={handleSignOut}
            danger
          />
        </View>
      </View>

      <EditProfileModal
        visible={editOpen}
        onClose={() => setEditOpen(false)}
        currentUser={currentUser}
      />
    </ScrollView>
  );
}