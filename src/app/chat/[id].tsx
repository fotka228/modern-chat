import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { useQuery, useMutation, usePaginatedQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState, useRef } from "react";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Id } from "../../../convex/_generated/dataModel";
import {
  useAudioRecorder,
  useAudioRecorderState,
  RecordingPresets,
  requestRecordingPermissionsAsync,
} from "expo-audio";

import { SwipeableMessageItem, MessageItemData } from "@/components/SwipeableMessageItem";
import { ReplyPreviewBar, ReplyTarget } from "@/components/ReplyPreviewBar";
import { ImageViewerModal } from "@/components/ImageViewerModal";
import { VideoNoteRecorder } from "@/components/VideoNoteRecorder";
import { ReactionBadges } from "@/components/ReactionBadges";
import { TypingDots } from "@/components/TypingDots";

const ACCENT = "#0a84ff";

function formatDuration(ms: number) {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function ChatRoomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const chatRoomId = id as Id<"chatRooms">;
  const router = useRouter();

  const room = useQuery(api.rooms.getRoom, { roomId: chatRoomId });
  const currentUser = useQuery(api.users.currentUser);
  const typingUsers = useQuery(api.typing.getTypingUsers, { chatRoomId });

  const { results: messages, status, loadMore } = usePaginatedQuery(
    api.messages.getPaginatedMessages,
    { chatRoomId },
    { initialNumItems: 25 }
  );

  const sendMessage = useMutation(api.messages.sendMessage);
  const sendMediaMessage = useMutation(api.messages.sendMediaMessage);
  const sendAudioMessage = useMutation(api.messages.sendAudioMessage);
  const sendVideoNoteMessage = useMutation(api.messages.sendVideoNoteMessage);
  const generateUploadUrl = useMutation(api.messages.generateUploadUrl);
  const editMessage = useMutation(api.messages.editMessage);
  const deleteMessage = useMutation(api.messages.deleteMessage);
  const setTyping = useMutation(api.typing.setTyping);
  const toggleReaction = useMutation(api.reactions.toggleReaction);

  const [inputText, setInputText] = useState("");
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<Id<"messages"> | null>(null);
  const [replyTarget, setReplyTarget] = useState<ReplyTarget | null>(null);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [isVideoRecorderVisible, setIsVideoRecorderVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);
  const lastTypingSentRef = useRef(0);

  const handleTextChange = (text: string) => {
    setInputText(text);
    const now = Date.now();
    if (now - lastTypingSentRef.current > 1500) {
      lastTypingSentRef.current = now;
      setTyping({ chatRoomId }).catch(() => {});
    }
  };

  const uploadFile = async (uri: string) => {
    const uploadUrl = await generateUploadUrl();
    const res = await fetch(uri);
    const blob = await res.blob();
    const uploadRes = await fetch(uploadUrl, { method: "POST", body: blob });
    const { storageId } = await uploadRes.json();
    return storageId;
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      setSelectedImageUri(result.assets[0].uri);
    }
  };

  const startAudioRec = async () => {
    const perm = await requestRecordingPermissionsAsync();
    if (!perm.granted) return Alert.alert("Помилка", "Надайте доступ до мікрофона");
    await audioRecorder.prepareToRecordAsync();
    audioRecorder.record();
  };

  const stopAndSendAudioRec = async () => {
    const durSec = Math.round((recorderState.durationMillis || 0) / 1000);
    await audioRecorder.stop();
    const uri = audioRecorder.uri;
    if (!uri || durSec < 1) return;

    setIsSubmitting(true);
    try {
      const storageId = await uploadFile(uri);
      await sendAudioMessage({ chatRoomId, audioStorageId: storageId, audioDuration: durSec });
    } catch (e) {
      console.error(e);
      Alert.alert("Помилка", "Не вдалося надіслати голосове");
    } finally {
      setIsSubmitting(false);
    }
  };

  const cancelAudioRec = async () => {
    try {
      await audioRecorder.stop();
    } catch {}
  };

  const handleSendVideoNote = async (videoUri: string, duration: number) => {
    const storageId = await uploadFile(videoUri);
    await sendVideoNoteMessage({ chatRoomId, videoStorageId: storageId, videoDuration: duration });
  };

  const handleSend = async () => {
    const text = inputText.trim();
    if ((!text && !selectedImageUri) || isSubmitting) return;

    setIsSubmitting(true);
    try {
      if (editingMessageId) {
        await editMessage({ messageId: editingMessageId, content: text });
        setEditingMessageId(null);
      } else if (selectedImageUri) {
        const storageId = await uploadFile(selectedImageUri);
        await sendMediaMessage({ chatRoomId, storageId, content: text || undefined });
        setSelectedImageUri(null);
      } else {
        await sendMessage({
          chatRoomId,
          content: text,
          ...(replyTarget
            ? {
                replyToId: replyTarget.messageId as Id<"messages">,
                replyToSender: replyTarget.senderName,
                replyToText: replyTarget.text,
              }
            : {}),
        });
      }
      setReplyTarget(null);
      setInputText("");
    } catch (e) {
      console.error(e);
      Alert.alert("Помилка", "Не вдалося надіслати повідомлення");
    } finally {
      setIsSubmitting(false);
    }
  };

  const cancelEditing = () => {
    setEditingMessageId(null);
    setInputText("");
  };

  const handleReply = (m: MessageItemData) => {
    setEditingMessageId(null);
    setReplyTarget({
      messageId: m._id,
      senderName: m.senderName,
      text: m.content || "",
    });
  };

  const handleLongPress = (item: MessageItemData) => {
    const isMe = item.senderId === currentUser?._id;

    Alert.alert("Дії з повідомленням", "Оберіть дію:", [
      { text: "👍 Поставити лайк", onPress: () => toggleReaction({ messageId: item._id, emoji: "👍" }) },
      { text: "❤️ Подобається", onPress: () => toggleReaction({ messageId: item._id, emoji: "❤️" }) },
      { text: "🔥 Вогонь", onPress: () => toggleReaction({ messageId: item._id, emoji: "🔥" }) },
      { text: "↩️ Відповісти", onPress: () => handleReply(item) },
      ...(isMe && item.content
        ? [
            {
              text: "Редагувати",
              onPress: () => {
                setReplyTarget(null);
                setEditingMessageId(item._id);
                setInputText(item.content || "");
              },
            },
          ]
        : []),
      ...(isMe
        ? [
            {
              text: "Видалити",
              style: "destructive" as const,
              onPress: () => deleteMessage({ messageId: item._id }),
            },
          ]
        : []),
      { text: "Скасувати", style: "cancel" as const },
    ]);
  };

  const canSend = !!inputText.trim() || !!selectedImageUri;

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
            <TouchableOpacity
              onPress={() => router.push(`/settings/${chatRoomId}` as any)}
              hitSlop={10}
            >
              <Ionicons name="information-circle-outline" size={26} color="#fff" />
            </TouchableOpacity>
          ),
        }}
      />

      <FlatList
        data={messages}
        keyExtractor={(item) => item._id}
        inverted
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 8, paddingVertical: 12 }}
        renderItem={({ item, index }) => {
          const isOwn = item.senderId === currentUser?._id;
          // список перевернутий: index + 1 — старіше повідомлення
          const older = messages[index + 1];
          const newer = messages[index - 1];

          return (
            <SwipeableMessageItem
              item={item as unknown as MessageItemData}
              isOwn={isOwn}
              isFirstInGroup={older?.senderId !== item.senderId}
              isLastInGroup={newer?.senderId !== item.senderId}
              onLongPress={() => handleLongPress(item as unknown as MessageItemData)}
              onReply={handleReply}
              onImagePress={setViewerUrl}
              onAuthorPress={(userId) => router.push(`/user/${userId}` as any)}
              footer={<ReactionBadges messageId={item._id} />}
            />
          );
        }}
        onEndReached={() => status === "CanLoadMore" && loadMore(25)}
        onEndReachedThreshold={0.4}
        ListFooterComponent={
          status === "LoadingMore" ? (
            <View className="py-4">
              <ActivityIndicator color={ACCENT} />
            </View>
          ) : undefined
        }
        ListEmptyComponent={
          status !== "LoadingFirstPage" ? (
            <View
              className="items-center justify-center px-10 py-24"
              style={{ transform: [{ scaleY: -1 }] }}
            >
              <View className="w-16 h-16 rounded-full bg-[#1c1c1e] items-center justify-center mb-4">
                <Ionicons name="chatbubble-ellipses-outline" size={30} color={ACCENT} />
              </View>
              <Text className="text-white text-lg font-semibold">Поки тут тихо</Text>
              <Text className="text-neutral-500 text-sm text-center mt-1">
                Напишіть перше повідомлення, щоб почати розмову
              </Text>
            </View>
          ) : undefined
        }
      />

      {typingUsers && typingUsers.length > 0 && <TypingDots typingUsers={typingUsers} />}

      {replyTarget && (
        <ReplyPreviewBar replyTarget={replyTarget} onCancel={() => setReplyTarget(null)} />
      )}

      {editingMessageId && (
        <View className="flex-row items-center bg-[#1c1c1e] border-t border-[#2a2a2c] px-4 py-2.5">
          <Ionicons name="pencil" size={16} color={ACCENT} />
          <View className="flex-1 ml-3">
            <Text className="text-[#0a84ff] text-xs font-bold">Редагування</Text>
            <Text className="text-neutral-400 text-sm" numberOfLines={1}>
              Змініть текст і натисніть галочку
            </Text>
          </View>
          <TouchableOpacity onPress={cancelEditing} hitSlop={10}>
            <Ionicons name="close-circle" size={22} color="#8e8e93" />
          </TouchableOpacity>
        </View>
      )}

      {selectedImageUri && (
        <View className="flex-row items-center bg-[#1c1c1e] border-t border-[#2a2a2c] px-4 py-2.5">
          <Image source={{ uri: selectedImageUri }} className="w-14 h-14 rounded-xl" />
          <Text className="flex-1 text-neutral-400 text-sm ml-3">Фото додано</Text>
          <TouchableOpacity onPress={() => setSelectedImageUri(null)} hitSlop={10}>
            <Ionicons name="close-circle" size={22} color="#8e8e93" />
          </TouchableOpacity>
        </View>
      )}

      <View className="bg-[#121212] border-t border-[#2a2a2c] px-3 py-2.5">
        {recorderState.isRecording ? (
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={cancelAudioRec}
              className="w-11 h-11 rounded-full bg-[#1c1c1e] items-center justify-center"
            >
              <Ionicons name="trash-outline" size={22} color="#ff453a" />
            </TouchableOpacity>

            <View className="flex-1 flex-row items-center bg-[#1c1c1e] rounded-full px-4 h-11 mx-2">
              <View className="w-2.5 h-2.5 rounded-full bg-[#ff453a] mr-3" />
              <Text className="text-white text-base font-medium">
                {formatDuration(recorderState.durationMillis || 0)}
              </Text>
              <Text className="text-neutral-500 text-sm ml-3">Запис...</Text>
            </View>

            <TouchableOpacity
              onPress={stopAndSendAudioRec}
              className="w-11 h-11 rounded-full bg-[#0a84ff] items-center justify-center"
            >
              <Ionicons name="send" size={20} color="#fff" style={{ marginLeft: 2 }} />
            </TouchableOpacity>
          </View>
        ) : (
          <View className="flex-row items-end">
            <TouchableOpacity
              onPress={pickImage}
              disabled={!!editingMessageId}
              className="w-11 h-11 rounded-full bg-[#1c1c1e] items-center justify-center"
              style={{ opacity: editingMessageId ? 0.4 : 1 }}
            >
              <Ionicons name="image" size={22} color={ACCENT} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setIsVideoRecorderVisible(true)}
              className="w-11 h-11 rounded-full bg-[#1c1c1e] items-center justify-center ml-2"
            >
              <Ionicons name="videocam" size={22} color={ACCENT} />
            </TouchableOpacity>

            <View className="flex-1 bg-[#1c1c1e] rounded-3xl border border-[#2a2a2c] mx-2 px-4 justify-center">
              <TextInput
                className="text-white text-base py-2.5"
                style={{ maxHeight: 120, minHeight: 42 }}
                placeholder="Повідомлення..."
                placeholderTextColor="#636366"
                value={inputText}
                onChangeText={handleTextChange}
                multiline
              />
            </View>

            {canSend ? (
              <TouchableOpacity
                onPress={handleSend}
                disabled={isSubmitting}
                className="w-11 h-11 rounded-full bg-[#0a84ff] items-center justify-center"
                style={{ opacity: isSubmitting ? 0.6 : 1 }}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Ionicons
                    name={editingMessageId ? "checkmark" : "send"}
                    size={editingMessageId ? 24 : 20}
                    color="#fff"
                    style={editingMessageId ? undefined : { marginLeft: 2 }}
                  />
                )}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={startAudioRec}
                className="w-11 h-11 rounded-full bg-[#1c1c1e] items-center justify-center"
              >
                <Ionicons name="mic" size={22} color={ACCENT} />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      <VideoNoteRecorder
        visible={isVideoRecorderVisible}
        onClose={() => setIsVideoRecorderVisible(false)}
        onSendVideo={handleSendVideoNote}
      />

      <ImageViewerModal
        visible={!!viewerUrl}
        imageUrl={viewerUrl}
        onClose={() => setViewerUrl(null)}
      />
    </KeyboardAvoidingView>
  );
}