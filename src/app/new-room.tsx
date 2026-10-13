import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
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

  const disabled = isLoading || !title.trim();

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
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-[#121212] items-center"
    >
      <Stack.Screen options={{ title: "Нова кімната" }} />

      <View className="w-full max-w-md p-6">
        <Text className="text-neutral-400 text-xs font-semibold uppercase mb-2 ml-1">
          Назва кімнати *
        </Text>
        <TextInput
          className="bg-[#1c1c1e] text-white px-4 py-3.5 rounded-2xl border border-[#2a2a2c] text-base mb-5"
          placeholder="Наприклад: Обговорення React Native"
          placeholderTextColor="#636366"
          value={title}
          onChangeText={setTitle}
          maxLength={100}
          autoFocus
          selectionColor="#0a84ff"
        />

        <Text className="text-neutral-400 text-xs font-semibold uppercase mb-2 ml-1">
          Опис (необов'язково)
        </Text>
        <TextInput
          className="bg-[#1c1c1e] text-white px-4 py-3.5 rounded-2xl border border-[#2a2a2c] text-base min-h-[100px] mb-6"
          placeholder="Короткий опис теми спілкування..."
          placeholderTextColor="#636366"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          maxLength={300}
          textAlignVertical="top"
          selectionColor="#0a84ff"
        />

        <TouchableOpacity
          onPress={handleCreate}
          disabled={disabled}
          className="bg-[#0a84ff] py-4 rounded-2xl items-center justify-center"
          style={{ opacity: disabled ? 0.5 : 1 }}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text className="text-white text-base font-bold">Створити кімнату</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}