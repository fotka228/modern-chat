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
        <Ionicons name="alert-circle-outline" size={48} color="#ff453a" />
        <Text className="text-white text-lg font-bold mt-3">Користувача не знайдено</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-4 bg-[#1c1c1e] px-5 py-2.5 rounded-xl border border-[#2a2a2c]"
        >
          <Text className="text-white font-medium">Повернутися</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isOwn = currentUser?._id === userId;

  return (
    <ScrollView
      className="flex-1 bg-[#121212]"
      contentContainerStyle={{ alignItems: "center" }}
    >
      <Stack.Screen options={{ title: profile.name, headerBackTitle: "Назад" }} />

      <View className="w-full max-w-md p-6">
        <View className="items-center mb-6">
          <View className="w-28 h-28 rounded-full bg-[#1c1c1e] border-2 border-[#0a84ff] overflow-hidden items-center justify-center mb-3">
            {profile.image ? (
              <Image source={{ uri: profile.image }} className="w-full h-full" resizeMode="cover" />
            ) : (
              <Ionicons name="person" size={52} color="#0a84ff" />
            )}
          </View>
          <Text className="text-white text-2xl font-bold">{profile.name}</Text>
          {profile.username ? (
            <Text className="text-[#0a84ff] text-sm font-semibold mt-0.5">
              @{profile.username}
            </Text>
          ) : null}
          {isOwn && (
            <View className="bg-[#0a84ff]/20 px-2 py-0.5 rounded-full mt-2">
              <Text className="text-[#0a84ff] text-xs font-semibold">Це ваш акаунт</Text>
            </View>
          )}
          {profile.bio ? (
            <View className="mt-4 px-4 py-3 bg-[#1c1c1e] rounded-2xl border border-[#2a2a2c] w-full">
              <Text className="text-neutral-400 text-xs font-semibold uppercase mb-1">Статус</Text>
              <Text className="text-white text-sm leading-5">{profile.bio}</Text>
            </View>
          ) : null}
        </View>

        <View className="flex-row gap-3 mb-4">
          <View className="flex-1 bg-[#1c1c1e] border border-[#2a2a2c] rounded-2xl p-4 items-center">
            <Ionicons name="chatbubble-ellipses" size={22} color="#0a84ff" />
            <Text className="text-white text-xl font-bold mt-2">
              {profile.stats.messagesCount}
            </Text>
            <Text className="text-neutral-400 text-xs mt-0.5">Повідомлень</Text>
          </View>
          <View className="flex-1 bg-[#1c1c1e] border border-[#2a2a2c] rounded-2xl p-4 items-center">
            <Ionicons name="folder" size={22} color="#bf5af2" />
            <Text className="text-white text-xl font-bold mt-2">
              {profile.stats.roomsCreatedCount}
            </Text>
            <Text className="text-neutral-400 text-xs mt-0.5">Кімнат</Text>
          </View>
        </View>

        <View className="bg-[#1c1c1e] border border-[#2a2a2c] rounded-2xl p-4 flex-row items-center mb-6">
          <Ionicons name="calendar-outline" size={20} color="#8e8e93" style={{ marginRight: 10 }} />
          <Text className="text-neutral-400 text-xs">
            Учасник з {new Date(profile._creationTime).toLocaleDateString("uk-UA")}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => router.back()}
          className="bg-[#1c1c1e] border border-[#2a2a2c] rounded-2xl py-4 items-center"
          activeOpacity={0.8}
        >
          <Text className="text-white font-bold text-base">Повернутися до розмови</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}