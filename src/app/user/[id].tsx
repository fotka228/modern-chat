import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Ionicons } from "@expo/vector-icons";

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

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const userId = id as Id<"users">;

  const profile = useQuery(api.users.getUserProfile, { userId });
  const currentUser = useQuery(api.users.currentUser);

  if (profile === undefined) {
    return (
      <View className="flex-1 bg-[#121212] justify-center items-center">
        <ActivityIndicator size="large" color="#0a84ff" />
      </View>
    );
  }

  if (profile === null) {
    return (
      <View className="flex-1 bg-[#121212] justify-center items-center p-6">
        <View className="w-20 h-20 rounded-full bg-[#ff453a]/10 items-center justify-center mb-4">
          <Ionicons name="alert-circle-outline" size={44} color="#ff453a" />
        </View>
        <Text className="text-white text-xl font-bold">Користувача не знайдено</Text>
        <Text className="text-neutral-500 text-sm mt-1 text-center">
          Можливо, акаунт було видалено
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-6 bg-[#1c1c1e] px-6 py-3 rounded-xl border border-[#2a2a2c]"
          activeOpacity={0.8}
        >
          <Text className="text-white font-semibold">Повернутися</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isOwn = currentUser?._id === userId;

  return (
    <ScrollView
      className="flex-1 bg-[#121212]"
      contentContainerStyle={{ alignItems: "center" }}
      showsVerticalScrollIndicator={false}
    >
      <Stack.Screen options={{ title: profile.name, headerBackTitle: "Назад" }} />

      <View className="w-full max-w-md px-6 pt-8 pb-10">
        {/* Шапка */}
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
            {profile.image ? (
              <Image source={{ uri: profile.image }} className="w-full h-full" resizeMode="cover" />
            ) : (
              <Ionicons name="person" size={58} color="#0a84ff" />
            )}
          </View>

          <Text className="text-white text-3xl font-bold text-center">{profile.name}</Text>

          {profile.username ? (
            <View className="bg-[#0a84ff]/15 px-3 py-1 rounded-full mt-2">
              <Text className="text-[#0a84ff] text-sm font-semibold">@{profile.username}</Text>
            </View>
          ) : null}

          {isOwn && (
            <View className="flex-row items-center bg-[#30d158]/15 px-3 py-1 rounded-full mt-2">
              <Ionicons name="checkmark-circle" size={14} color="#30d158" />
              <Text className="text-[#30d158] text-xs font-semibold ml-1">Це ваш акаунт</Text>
            </View>
          )}
        </View>

        {/* Статус */}
        {profile.bio ? (
          <View className="bg-[#1c1c1e] border border-[#2a2a2c] rounded-2xl p-4 mb-4">
            <View className="flex-row items-center mb-2">
              <Ionicons name="chatbox-ellipses-outline" size={16} color="#8e8e93" />
              <Text className="text-neutral-400 text-xs font-semibold uppercase ml-2">Статус</Text>
            </View>
            <Text className="text-white text-base leading-6">{profile.bio}</Text>
          </View>
        ) : null}

        {/* Статистика */}
        <View className="flex-row gap-3 mb-4">
          <StatCard
            icon="chatbubble-ellipses"
            color="#0a84ff"
            value={profile.stats.messagesCount}
            label="Повідомлень"
          />
          <StatCard
            icon="folder"
            color="#bf5af2"
            value={profile.stats.roomsCreatedCount}
            label="Кімнат"
          />
        </View>

        {/* Дата реєстрації */}
        <View className="bg-[#1c1c1e] border border-[#2a2a2c] rounded-2xl p-4 flex-row items-center mb-6">
          <View className="w-10 h-10 rounded-full bg-[#2a2a2c] items-center justify-center mr-3">
            <Ionicons name="calendar-outline" size={20} color="#8e8e93" />
          </View>
          <View>
            <Text className="text-neutral-500 text-xs">Учасник з</Text>
            <Text className="text-white text-sm font-medium mt-0.5">
              {new Date(profile._creationTime).toLocaleDateString("uk-UA", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => router.back()}
          className="bg-[#0a84ff] rounded-xl py-4 flex-row items-center justify-center"
          activeOpacity={0.8}
        >
          <Ionicons name="chatbubble" size={18} color="#fff" />
          <Text className="text-white font-bold text-base ml-2">Повернутися до розмови</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}