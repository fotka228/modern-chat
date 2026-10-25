import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useState } from "react";
import { useRouter, Stack } from "expo-router";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";

export default function NewRoomScreen() {
  const router = useRouter();
  const createRoom = useMutation(api.rooms.createRoom);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [focused, setFocused] = useState<"title" | "desc" | null>(null);

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
      className="flex-1 bg-[#121212]"
    >
      <Stack.Screen options={{ title: "Нова кімната" }} />

      <ScrollView
        contentContainerStyle={{ alignItems: "center" }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="w-full max-w-md px-6 pt-8 pb-10">
          {/* Шапка */}
          <View className="items-center mb-8">
            <View
              className="w-20 h-20 rounded-3xl bg-[#1c1c1e] border border-[#2a2a2c] items-center justify-center mb-4"
              style={{
                shadowColor: "#0a84ff",
                shadowOpacity: 0.35,
                shadowRadius: 20,
                shadowOffset: { width: 0, height: 6 },
                elevation: 8,
              }}
            >
              <Ionicons name="add-circle" size={40} color="#0a84ff" />
            </View>
            <Text className="text-white text-2xl font-bold">Створіть кімнату</Text>
            <Text className="text-neutral-400 text-sm mt-1 text-center">
              Запросіть людей до розмови на вашу тему
            </Text>
          </View>

          {/* Назва */}
          <View className="flex-row justify-between items-center mb-2 mx-1">
            <Text className="text-neutral-400 text-xs font-semibold uppercase">
              Назва кімнати *
            </Text>
            <Text className="text-neutral-600 text-xs">{title.length}/100</Text>
          </View>
          <View
            className="flex-row items-center bg-[#1c1c1e] rounded-xl border px-3.5 mb-5"
            style={{ borderColor: focused === "title" ? "#0a84ff" : "#2a2a2c" }}
          >
            <Ionicons
              name="chatbubbles-outline"
              size={20}
              color={focused === "title" ? "#0a84ff" : "#8e8e93"}
            />
            <TextInput
              className="flex-1 text-white text-base py-3.5 px-3"
              placeholder="Наприклад: Обговорення React Native"
              placeholderTextColor="#636366"
              value={title}
              onChangeText={setTitle}
              onFocus={() => setFocused("title")}
              onBlur={() => setFocused(null)}
              maxLength={100}
              autoFocus
              selectionColor="#0a84ff"
            />
          </View>

          {/* Опис */}
          <View className="flex-row justify-between items-center mb-2 mx-1">
            <Text className="text-neutral-400 text-xs font-semibold uppercase">
              Опис (необов'язково)
            </Text>
            <Text className="text-neutral-600 text-xs">{description.length}/300</Text>
          </View>
          <View
            className="bg-[#1c1c1e] rounded-xl border px-4 mb-6"
            style={{ borderColor: focused === "desc" ? "#0a84ff" : "#2a2a2c" }}
          >
            <TextInput
              className="text-white text-base py-3.5 min-h-[110px]"
              placeholder="Короткий опис теми спілкування..."
              placeholderTextColor="#636366"
              value={description}
              onChangeText={setDescription}
              onFocus={() => setFocused("desc")}
              onBlur={() => setFocused(null)}
              multiline
              numberOfLines={4}
              maxLength={300}
              textAlignVertical="top"
              selectionColor="#0a84ff"
            />
          </View>

          <TouchableOpacity
            onPress={handleCreate}
            disabled={disabled}
            className="bg-[#0a84ff] py-4 rounded-xl flex-row items-center justify-center"
            style={{ opacity: disabled ? 0.5 : 1 }}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Text className="text-white text-base font-bold mr-2">Створити кімнату</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}