import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Ionicons } from "@expo/vector-icons";

export default function RoomSettingsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const room = useQuery(api.rooms.getRoom, {
    roomId: id as Id<"chatRooms">,
  });
  const currentUser = useQuery(api.users.currentUser);
  const deleteRoom = useMutation(api.rooms.deleteRoom);

  const isCreator = room && currentUser && room.creatorId === currentUser._id;

  const handleDelete = () => {
    Alert.alert(
      "Видалення кімнати",
      "Ви впевнені, що хочете видалити цю кімнату та всі її повідомлення?",
      [
        { text: "Скасувати", style: "cancel" },
        {
          text: "Видалити",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteRoom({ roomId: id as Id<"chatRooms"> });
              router.dismissAll();
              router.replace("/(app)");
            } catch (err) {
              console.error(err);
              Alert.alert("Помилка", "Не вдалося видалити кімнату.");
            }
          },
        },
      ]
    );
  };

  if (!room) {
    return (
      <View className="flex-1 bg-[#121212] justify-center items-center">
        <ActivityIndicator size="large" color="#0a84ff" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#121212] items-center">
      <View className="w-full max-w-md p-6">
        <View className="bg-[#1c1c1e] border border-[#2a2a2c] rounded-2xl p-5 mb-6">
          <Text className="text-neutral-500 text-xs font-semibold uppercase mb-1">
            Назва
          </Text>
          <Text className="text-white text-xl font-bold">{room.title}</Text>

          {room.description ? (
            <>
              <Text className="text-neutral-500 text-xs font-semibold uppercase mt-4 mb-1">
                Опис
              </Text>
              <Text className="text-neutral-300 text-sm">{room.description}</Text>
            </>
          ) : null}
        </View>

        {isCreator && (
          <TouchableOpacity
            onPress={handleDelete}
            className="bg-[#1c1c1e] border border-red-500/40 rounded-2xl py-4 flex-row items-center justify-center active:bg-red-500/10"
            activeOpacity={0.8}
          >
            <Ionicons
              name="trash-outline"
              size={20}
              color="#ef4444"
              style={{ marginRight: 8 }}
            />
            <Text className="text-red-500 text-base font-bold">
              Видалити кімнату
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}