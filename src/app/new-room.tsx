import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useState } from "react";
import { useRouter, Stack } from "expo-router";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

export default function NewRoomScreen() {
  const router = useRouter();
  const createRoom = useMutation(api.rooms.createRoom);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleCreate = async () => {
    if (!title.trim()) {
      Alert.alert("Помилка", "Будь ласка, введіть назву кімнати.");
      return;
    }

    setIsLoading(true);
    try {
      const roomId = await createRoom({
        title: title.trim(),
        description: description.trim() || undefined,
      });
      
      // Якщо є куди повертатися — повертаємося, інакше переходимо в чат
      if (router.canGoBack()) {
        router.back();
      }
      router.push(`/chat/${String(roomId)}` as const);
    } catch (error) {
      console.error("Error creating room", error);
      Alert.alert("Помилка", "Не вдалося створити кімнату.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-slate-50 p-6">
      <Stack.Screen
        options={{
          title: "Нова кімната",
          headerRight: () => (
            <TouchableOpacity
              onPress={handleCreate}
              disabled={isLoading || !title.trim()}
              className={`px-3 py-1.5 rounded-xl bg-blue-600 ${
                isLoading || !title.trim() ? "opacity-50" : "active:bg-blue-700"
              }`}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text className="text-white text-sm font-bold">Створити</Text>
              )}
            </TouchableOpacity>
          ),
        }}
      />

      <View className="gap-5 mt-2">
        <View>
          <Text className="text-slate-700 text-xs font-semibold uppercase mb-2">
            Назва кімнати *
          </Text>
          <TextInput
            className="bg-white border border-slate-300 rounded-2xl px-4 py-3.5 text-slate-900 text-base shadow-sm"
            placeholder="Наприклад: Обговорення React Native"
            placeholderTextColor="#94a3b8"
            value={title}
            onChangeText={setTitle}
            maxLength={100}
            autoFocus
          />
        </View>

        <View>
          <Text className="text-slate-700 text-xs font-semibold uppercase mb-2">
            Опис (необов'язково)
          </Text>
          <TextInput
            className="bg-white border border-slate-300 rounded-2xl px-4 py-3.5 text-slate-900 text-base min-h-[100px] shadow-sm"
            placeholder="Короткий опис теми спілкування..."
            placeholderTextColor="#94a3b8"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            maxLength={300}
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity
          onPress={handleCreate}
          disabled={isLoading || !title.trim()}
          className={`bg-blue-600 py-4 rounded-2xl items-center justify-center shadow-md mt-2 ${
            isLoading || !title.trim() ? "opacity-50" : "active:bg-blue-700"
          }`}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text className="text-white text-base font-bold">
              Створити кімнату
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}