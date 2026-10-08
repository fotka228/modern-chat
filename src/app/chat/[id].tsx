import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
} from "react-native";
import { useState, useRef, useEffect } from "react";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);

  const roomId = id as Id<"chatRooms">;
  const room = useQuery(api.rooms.getRoom, { roomId });
  const messages = useQuery(api.messages.listMessages, { chatRoomId: roomId });
  const currentUser = useQuery(api.users.currentUser);
  const sendMessage = useMutation(api.messages.sendMessage);

  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (messages && messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages?.length]);

  const handleSend = async () => {
    if (!inputText.trim() || isSending) return;

    const text = inputText;
    setInputText("");
    setIsSending(true);

    try {
      await sendMessage({
        chatRoomId: roomId,
        content: text,
      });
    } catch (error) {
      console.error("Error sending message", error);
      setInputText(text);
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (timestamp?: number) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  if (!room) {
    return (
      <View className="flex-1 bg-slate-50 justify-center items-center">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      className="flex-1 bg-slate-50"
    >
      <Stack.Screen
        options={{
          title: room.title,
          headerRight: () => (
            <TouchableOpacity
              onPress={() => router.push(`/settings/${roomId}`)}
              className="p-1"
            >
              <Ionicons
                name="information-circle-outline"
                size={24}
                color="#0f172a"
              />
            </TouchableOpacity>
          ),
        }}
      />

      {messages === undefined ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingVertical: 16,
            gap: 12,
          }}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-20">
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={40}
                color="#94a3b8"
              />
              <Text className="text-slate-500 text-sm mt-2 text-center">
                Повідомлень ще немає. Напишіть першим!
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const isMe = currentUser && item.senderId === currentUser._id;

            return (
              <View
                className={`flex-row items-end gap-2 ${
                  isMe ? "justify-end" : "justify-start"
                }`}
              >
                {!isMe && (
                  <View className="w-7 h-7 rounded-full bg-slate-200 border border-slate-300 items-center justify-center mb-1 overflow-hidden">
                    {item.senderPhoto ? (
                      <Image
                        source={{ uri: item.senderPhoto }}
                        className="w-full h-full rounded-full"
                      />
                    ) : (
                      <Text className="text-slate-600 text-xs font-bold">
                        {item.senderName[0]?.toUpperCase() ?? "U"}
                      </Text>
                    )}
                  </View>
                )}

                <View
                  className={`max-w-[78%] px-4 py-2.5 rounded-2xl ${
                    isMe
                      ? "bg-blue-600 rounded-br-none"
                      : "bg-white border border-slate-200 rounded-bl-none shadow-sm"
                  }`}
                >
                  {!isMe && (
                    <Text className="text-blue-600 text-xs font-bold mb-1">
                      {item.senderName}
                    </Text>
                  )}
                  <Text
                    className={`text-base leading-5 ${
                      isMe ? "text-white" : "text-slate-900"
                    }`}
                  >
                    {item.content}
                  </Text>
                  <Text
                    className={`text-[10px] text-right mt-1 ${
                      isMe ? "text-white/80" : "text-slate-400"
                    }`}
                  >
                    {formatTime(item._creationTime)}
                  </Text>
                </View>
              </View>
            );
          }}
        />
      )}

      <View
        style={{ paddingBottom: Math.max(insets.bottom, 10) }}
        className="px-4 py-2 bg-white border-t border-slate-200 flex-row items-end gap-2 shadow-sm"
      >
        <TextInput
          className="flex-1 bg-slate-100 border border-slate-300 rounded-2xl px-4 py-2.5 text-slate-900 text-base max-h-28 min-h-[42px]"
          placeholder="Повідомлення..."
          placeholderTextColor="#94a3b8"
          value={inputText}
          onChangeText={setInputText}
          multiline
        />

        <TouchableOpacity
          onPress={handleSend}
          disabled={!inputText.trim() || isSending}
          className={`w-11 h-11 rounded-2xl items-center justify-center ${
            inputText.trim() && !isSending ? "bg-blue-600" : "bg-slate-200"
          }`}
          activeOpacity={0.8}
        >
          {isSending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Ionicons
              name="send"
              size={18}
              color={inputText.trim() ? "#FFFFFF" : "#94a3b8"}
            />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}