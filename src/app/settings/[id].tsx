import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
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
    <ScrollView
      className="flex-1 bg-[#121212]"
      contentContainerStyle={{ alignItems: "center" }}
      showsVerticalScrollIndicator={false}
    >
      <View className="w-full max-w-md px-6 pt-8 pb-10">
        {/* Шапка кімнати */}
        <View className="items-center mb-8">
          <View
            className="w-24 h-24 rounded-3xl bg-[#1c1c1e] border border-[#2a2a2c] items-center justify-center mb-4"
            style={{
              shadowColor: "#0a84ff",
              shadowOpacity: 0.35,
              shadowRadius: 24,
              shadowOffset: { width: 0, height: 8 },
              elevation: 10,
            }}
          >
            <Ionicons name="chatbubbles" size={44} color="#0a84ff" />
          </View>
          <Text className="text-white text-2xl font-bold text-center">{room.title}</Text>
          {isCreator && (
            <View className="flex-row items-center bg-[#0a84ff]/15 px-3 py-1 rounded-full mt-2">
              <Ionicons name="star" size={12} color="#0a84ff" />
              <Text className="text-[#0a84ff] text-xs font-semibold ml-1">Ви створили цю кімнату</Text>
            </View>
          )}
        </View>

        {/* Інформація */}
        <Text className="text-neutral-500 text-xs font-semibold uppercase mb-2 ml-1">Інформація</Text>
        <View className="bg-[#1c1c1e] border border-[#2a2a2c] rounded-2xl overflow-hidden mb-6">
          <View className="flex-row items-start p-4">
            <View className="w-9 h-9 rounded-xl bg-[#0a84ff]/15 items-center justify-center mr-3">
              <Ionicons name="text" size={20} color="#0a84ff" />
            </View>
            <View className="flex-1">
              <Text className="text-neutral-500 text-xs">Назва</Text>
              <Text className="text-white text-base font-semibold mt-0.5">{room.title}</Text>
            </View>
          </View>

          <View className="h-px bg-[#2a2a2c] ml-16" />

          <View className="flex-row items-start p-4">
            <View className="w-9 h-9 rounded-xl bg-[#bf5af2]/15 items-center justify-center mr-3">
              <Ionicons name="document-text-outline" size={20} color="#bf5af2" />
            </View>
            <View className="flex-1">
              <Text className="text-neutral-500 text-xs">Опис</Text>
              <Text
                className={`text-sm mt-0.5 leading-5 ${
                  room.description ? "text-neutral-200" : "text-neutral-600 italic"
                }`}
              >
                {room.description || "Опису немає"}
              </Text>
            </View>
          </View>
        </View>

        {/* Небезпечна зона */}
        {isCreator && (
          <>
            <Text className="text-neutral-500 text-xs font-semibold uppercase mb-2 ml-1">
              Небезпечна зона
            </Text>
            <View className="bg-[#1c1c1e] border border-[#ff453a]/30 rounded-2xl overflow-hidden">
              <TouchableOpacity
                onPress={handleDelete}
                activeOpacity={0.7}
                className="flex-row items-center px-4 py-3.5"
              >
                <View className="w-9 h-9 rounded-xl bg-[#ff453a]/15 items-center justify-center mr-3">
                  <Ionicons name="trash-outline" size={20} color="#ff453a" />
                </View>
                <View className="flex-1">
                  <Text className="text-[#ff453a] text-base font-semibold">Видалити кімнату</Text>
                  <Text className="text-neutral-500 text-xs mt-0.5">
                    Усі повідомлення буде втрачено
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </ScrollView>
  );
}