import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";
import { useLocalSearchParams, Stack, useRouter } from "expo-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState, useRef } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Id } from "../../../convex/_generated/dataModel";
import * as ImagePicker from "expo-image-picker";
import { ImageViewerModal } from "@/components/ImageViewerModal";
import { TypingDots } from "@/components/TypingDots";
import { SwipeableMessageItem, MessageItemData } from "../../components/SwipeableMessageItem";
import { ReplyPreviewBar, ReplyTarget } from "../../components/ReplyPreviewBar";

const ACCENT = "#0a84ff";

export default function ChatRoomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const chatRoomId = id as Id<"chatRooms">;
  const router = useRouter();

  const room = useQuery(api.rooms.getRoom, { roomId: chatRoomId });
  const messages = useQuery(api.messages.listMessages, { chatRoomId });
  const currentUser = useQuery(api.users.currentUser);
  const typingUsers = useQuery(api.typing.getTypingUsers, { chatRoomId });

  const sendMessage = useMutation(api.messages.sendMessage);
  const sendMediaMessage = useMutation(api.messages.sendMediaMessage);
  const generateUploadUrl = useMutation(api.messages.generateUploadUrl);
  const editMessage = useMutation(api.messages.editMessage);
  const deleteMessage = useMutation(api.messages.deleteMessage);
  const setTyping = useMutation(api.typing.setTyping);

  const [inputText, setInputText] = useState("");
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<Id<"messages"> | null>(null);
  const [replyTarget, setReplyTarget] = useState<ReplyTarget | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const flatListRef = useRef<FlatList>(null);
  const lastTypingSentRef = useRef(0);

  const handleTextChange = (text: string) => {
    setInputText(text);
    const now = Date.now();
    if (now - lastTypingSentRef.current > 1500) {
      lastTypingSentRef.current = now;
      setTyping({ chatRoomId }).catch(() => {});
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0].uri) {
      setSelectedImageUri(result.assets[0].uri);
    }
  };

  const handleStartReply = (msg: MessageItemData) => {
    setReplyTarget({
      messageId: msg._id,
      senderName: msg.senderName,
      text: msg.content || (msg.imageUrl ? "📷 Фото" : ""),
    });
    setEditingMessageId(null);
  };

  const replyArgs = () => ({
    replyToId: replyTarget ? (replyTarget.messageId as Id<"messages">) : undefined,
    replyToSender: replyTarget?.senderName,
    replyToText: replyTarget?.text,
  });

  const handleSend = async () => {
    const text = inputText.trim();
    if ((!text && !selectedImageUri) || isSubmitting) return;

    try {
      setIsSubmitting(true);

      if (editingMessageId) {
        await editMessage({ messageId: editingMessageId, content: text });
        setEditingMessageId(null);
      } else if (selectedImageUri) {
        const uploadUrl = await generateUploadUrl();
        const response = await fetch(selectedImageUri);
        const blob = await response.blob();

        const uploadResult = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": blob.type || "image/jpeg" },
          body: blob,
        });
        const { storageId } = await uploadResult.json();

        await sendMediaMessage({
          chatRoomId,
          storageId,
          content: text || undefined,
          ...replyArgs(),
        });
        setSelectedImageUri(null);
        setReplyTarget(null);
      } else {
        await sendMessage({ chatRoomId, content: text, ...replyArgs() });
        setReplyTarget(null);
      }

      setInputText("");
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (error) {
      console.error(error);
      Alert.alert("Помилка", "Не вдалося надіслати повідомлення");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMessageLongPress = (item: MessageItemData) => {
    const isOwn = item.senderId === currentUser?._id;
    const options: any[] = [{ text: "Відповісти", onPress: () => handleStartReply(item) }];

    if (isOwn) {
      if (item.content) {
        options.push({
          text: "Редагувати",
          onPress: () => {
            setEditingMessageId(item._id);
            setInputText(item.content || "");
            setReplyTarget(null);
          },
        });
      }
      options.push({
        text: "Видалити",
        style: "destructive",
        onPress: () => {
          Alert.alert("Видалити повідомлення", "Ви впевнені?", [
            { text: "Скасувати", style: "cancel" },
            {
              text: "Так",
              style: "destructive",
              onPress: () => deleteMessage({ messageId: item._id }),
            },
          ]);
        },
      });
    }
    options.push({ text: "Скасувати", style: "cancel" });

    Alert.alert("Дії з повідомленням", undefined, options);
  };

  const canSend = (!!inputText.trim() || !!selectedImageUri) && !isSubmitting;

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-[#121212]"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <Stack.Screen
        options={{
          title: room?.title ?? "Чат",
          headerRight: () => (
            <View className="flex-row items-center gap-2">
              <TouchableOpacity
                onPress={() => router.replace("/(app)")}
                className="flex-row items-center bg-[#0a84ff] px-3 py-1.5 rounded-full"
                activeOpacity={0.8}
              >
                <Ionicons name="home-outline" size={16} color="#fff" />
                <Text className="text-white text-xs font-bold ml-1.5">Головне меню</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push(`/settings/${chatRoomId}`)}
                className="p-1"
              >
                <Ionicons name="information-circle-outline" size={24} color={ACCENT} />
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ padding: 16 }}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        renderItem={({ item }) => (
          <SwipeableMessageItem
            item={item as MessageItemData}
            isOwn={item.senderId === currentUser?._id}
            onLongPress={() => handleMessageLongPress(item as MessageItemData)}
            onReply={handleStartReply}
            onImagePress={(url) => setFullscreenImage(url)}
            onAuthorPress={(authorId) =>
              // `as any` можна прибрати, коли Expo перегенерує типи роутів
              router.push({ pathname: "/user/[id]", params: { id: authorId } } as any)
            }
          />
        )}
      />

      {typingUsers && typingUsers.length > 0 && <TypingDots typingUsers={typingUsers} />}

      {replyTarget && (
        <ReplyPreviewBar replyTarget={replyTarget} onCancel={() => setReplyTarget(null)} />
      )}

      {editingMessageId && (
        <View className="flex-row items-center justify-between px-4 py-2 bg-[#1c1c1e] border-t border-[#2a2a2c]">
          <View className="flex-row items-center flex-1 mr-2">
            <Ionicons name="pencil" size={16} color={ACCENT} style={{ marginRight: 6 }} />
            <Text className="text-white text-xs font-semibold">Редагування повідомлення</Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              setEditingMessageId(null);
              setInputText("");
            }}
          >
            <Ionicons name="close-circle" size={20} color="#8e8e93" />
          </TouchableOpacity>
        </View>
      )}

      {selectedImageUri && (
        <View className="flex-row items-center px-4 py-2 bg-[#1c1c1e] border-t border-[#2a2a2c]">
          <Image source={{ uri: selectedImageUri }} className="w-12 h-12 rounded-lg mr-3" />
          <Text className="text-white text-xs flex-1">Фото прикріплено</Text>
          <TouchableOpacity onPress={() => setSelectedImageUri(null)}>
            <Ionicons name="close-circle" size={22} color="#ff453a" />
          </TouchableOpacity>
        </View>
      )}

      <View className="flex-row items-center p-3 bg-[#121212] border-t border-[#2a2a2c]">
        <TouchableOpacity
          onPress={pickImage}
          disabled={isSubmitting}
          className="mr-2 w-10 h-10 rounded-full bg-[#1c1c1e] items-center justify-center"
        >
          <Ionicons name="image-outline" size={22} color={ACCENT} />
        </TouchableOpacity>

        <TextInput
          className="flex-1 bg-[#1c1c1e] text-white px-4 py-2.5 rounded-full text-base border border-[#2a2a2c] mr-2 max-h-28"
          placeholder={
            editingMessageId
              ? "Змініть текст..."
              : replyTarget
              ? `Відповідь для ${replyTarget.senderName}...`
              : selectedImageUri
              ? "Додайте підпис..."
              : "Напишіть повідомлення..."
          }
          placeholderTextColor="#636366"
          selectionColor={ACCENT}
          value={inputText}
          onChangeText={handleTextChange}
          multiline
        />

        <TouchableOpacity
          onPress={handleSend}
          disabled={!canSend}
          className="w-11 h-11 rounded-full items-center justify-center bg-[#0a84ff]"
          style={{ opacity: canSend ? 1 : 0.4 }}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Ionicons name={editingMessageId ? "checkmark" : "send"} size={20} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>

      <ImageViewerModal
        visible={!!fullscreenImage}
        imageUrl={fullscreenImage}
        onClose={() => setFullscreenImage(null)}
      />
    </KeyboardAvoidingView>
  );
}