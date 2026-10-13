import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { useRouter, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { SwipeableRoomItem } from "../../components/SwipeableRoomItem";

const TEXT_MUTED = "#8e8e93";
const ACCENT = "#0a84ff";

function notify(title: string, message: string) {
  if (Platform.OS === "web") window.alert(`${title}\n\n${message}`);
  else Alert.alert(title, message);
}

export default function HomeScreen() {
  const router = useRouter();
  const rooms = useQuery(api.rooms.listRooms);
  const currentUser = useQuery(api.users.currentUser);
  const deleteRoom = useMutation(api.rooms.deleteRoom);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  };

  const runDelete = async (roomId: Id<"chatRooms">) => {
    try {
      await deleteRoom({ roomId });
    } catch (e: any) {
      notify("Помилка", e?.message || "Не вдалося видалити кімнату");
    }
  };

  const handleDeleteRoom = (roomId: Id<"chatRooms">) => {
    const room = rooms?.find((r) => r._id === roomId);
    if (!room) return;

    if (room.creatorId !== currentUser?._id) {
      notify("Обмеження доступу", "Лише автор кімнати може її видалити.");
      return;
    }

    const text = `Видалити кімнату «${room.title}» та всі її повідомлення? Цю дію неможливо скасувати.`;

    if (Platform.OS === "web") {
      if (window.confirm(text)) runDelete(roomId);
      return;
    }

    Alert.alert("Видалити кімнату?", text, [
      { text: "Скасувати", style: "cancel" },
      { text: "Видалити", style: "destructive", onPress: () => runDelete(roomId) },
    ]);
  };

  return (
    <View className="flex-1 bg-[#121212]">
      <Stack.Screen
        options={{
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.push("/profile")}
              className="mr-3 w-9 h-9 rounded-full bg-[#1c1c1e] border border-[#2a2a2c] items-center justify-center"
              activeOpacity={0.8}
            >
              <Ionicons name="person" size={18} color={ACCENT} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity
              onPress={() => router.push("/new-room")}
              className="w-9 h-9 rounded-full bg-[#0a84ff] items-center justify-center"
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          ),
        }}
      />

      {rooms === undefined ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={ACCENT} />
        </View>
      ) : rooms.length === 0 ? (
        <View className="flex-1 justify-center items-center px-6">
          <View className="w-20 h-20 rounded-full bg-[#1c1c1e] items-center justify-center mb-4">
            <Ionicons name="chatbubbles-outline" size={36} color={TEXT_MUTED} />
          </View>
          <Text className="text-white text-lg font-bold text-center">
            Немає активних кімнат
          </Text>
          <Text className="text-[#8e8e93] text-sm text-center mt-1">
            Створіть першу кімнату кнопкою «+» угорі
          </Text>
        </View>
      ) : (
        <FlatList
          data={rooms}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{
            padding: 16,
            gap: 10,
            width: "100%",
            maxWidth: 720,
            alignSelf: "center",
          }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ACCENT} />
          }
          renderItem={({ item }) => (
            <SwipeableRoomItem
              room={item}
              isCreator={item.creatorId === currentUser?._id}
              onPress={() => router.push(`/chat/${item._id}`)}
              onDelete={handleDeleteRoom}
            />
          )}
        />
      )}
    </View>
  );
}