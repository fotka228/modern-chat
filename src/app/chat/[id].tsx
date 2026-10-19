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
} from "react-native";
import { useLocalSearchParams, Stack, useRouter } from "expo-router";
import { useQuery, useMutation, usePaginatedQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState, useRef } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Id } from "../../../convex/_generated/dataModel";
import { useAudioRecorder, useAudioRecorderState, RecordingPresets, requestRecordingPermissionsAsync } from "expo-audio";

import { VoiceMessagePlayer } from "@/components/VoiceMessagePlayer";
import { VideoNotePlayer } from "@/components/VideoNotePlayer";
import { VideoNoteRecorder } from "@/components/VideoNoteRecorder";
import { ReactionBadges } from "@/components/ReactionBadges";
import { TypingDots } from "@/components/TypingDots";

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
      const uploadUrl = await generateUploadUrl();
      const res = await fetch(uri);
      const blob = await res.blob();
      const uploadRes = await fetch(uploadUrl, { method: "POST", body: blob });
      const { storageId } = await uploadRes.json();

      await sendAudioMessage({ chatRoomId, audioStorageId: storageId, audioDuration: durSec });
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendVideoNote = async (videoUri: string, duration: number) => {
    const uploadUrl = await generateUploadUrl();
    const res = await fetch(videoUri);
    const blob = await res.blob();
    const uploadRes = await fetch(uploadUrl, { method: "POST", body: blob });
    const { storageId } = await uploadRes.json();

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
        const uploadUrl = await generateUploadUrl();
        const res = await fetch(selectedImageUri);
        const blob = await res.blob();
        const uploadRes = await fetch(uploadUrl, { method: "POST", body: blob });
        const { storageId } = await uploadRes.json();

        await sendMediaMessage({ chatRoomId, storageId, content: text || undefined });
        setSelectedImageUri(null);
      } else {
        await sendMessage({ chatRoomId, content: text });
      }
      setInputText("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLongPress = (item: any) => {
    const isMe = item.senderId === currentUser?._id;
    
    Alert.alert("Дії з повідомленням", "Оберіть дію:", [
      { text: "👍 Поставити лайк", onPress: () => toggleReaction({ messageId: item._id, emoji: "👍" }) },
      { text: "❤️ Подобається", onPress: () => toggleReaction({ messageId: item._id, emoji: "❤️" }) },
      { text: "🔥 Вогонь", onPress: () => toggleReaction({ messageId: item._id, emoji: "🔥" }) },
      ...(isMe
        ? [
            { text: "Редагувати", onPress: () => { setEditingMessageId(item._id); setInputText(item.content || ""); } },
            { text: "Видалити", style: "destructive" as const, onPress: () => deleteMessage({ messageId: item._id }) },
          ]
        : []),
      { text: "Скасувати", style: "cancel" as const },
    ]);
  };

  return (
    <KeyboardAvoidingView className="flex-1 bg-slate-50" behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Stack.Screen options={{ title: room?.title ?? "Чат" }} />

      <FlatList
        data={messages}
        keyExtractor={(item) => item._id}
        inverted
        renderItem={({ item }) => {
          const isOwn = item.senderId === currentUser?._id;
          return (
            <View className={`my-1 ${isOwn ? "items-end" : "items-start"}`}>
              <TouchableOpacity activeOpacity={0.9} onLongPress={() => handleLongPress(item)}>
                <View className={`max-w-[80%] rounded-2xl p-3 ${isOwn ? "bg-blue-600" : "bg-white border border-slate-200"}`}>
                  {!isOwn && <Text className="text-blue-600 text-xs font-bold mb-1">{item.senderName}</Text>}
                  {item.imageUrl && <Image source={{ uri: item.imageUrl }} className="w-52 h-52 rounded-xl mb-1" />}
                  {item.audioUrl && <VoiceMessagePlayer audioUrl={item.audioUrl} duration={item.audioDuration} isMyMessage={isOwn} />}
                  {item.videoUrl && item.isVideoNote && <VideoNotePlayer videoUrl={item.videoUrl} duration={item.videoDuration} />}
                  {item.content && <Text className={`text-base ${isOwn ? "text-white" : "text-slate-900"}`}>{item.content}</Text>}
                </View>
              </TouchableOpacity>
              <ReactionBadges messageId={item._id} />
            </View>
          );
        }}
        onEndReached={() => status === "CanLoadMore" && loadMore(25)}
      />

      {typingUsers && typingUsers.length > 0 && <TypingDots typingUsers={typingUsers} />}

      <View className="flex-row items-center p-3 bg-white border-t border-slate-200">
        <TouchableOpacity onPress={() => setIsVideoRecorderVisible(true)} className="p-2">
          <Ionicons name="videocam-outline" size={24} color="#2563eb" />
        </TouchableOpacity>

        <TextInput
          className="flex-1 bg-slate-100 text-slate-900 px-4 py-2 rounded-full mr-2"
          placeholder="Повідомлення..."
          value={inputText}
          onChangeText={handleTextChange}
        />

        {recorderState.isRecording ? (
          <TouchableOpacity onPress={stopAndSendAudioRec} className="p-2 bg-red-500 rounded-full">
            <Ionicons name="stop" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        ) : inputText.trim() ? (
          <TouchableOpacity onPress={handleSend} className="p-2 bg-blue-600 rounded-full">
            <Ionicons name="send" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={startAudioRec} className="p-2 bg-slate-100 rounded-full">
            <Ionicons name="mic" size={22} color="#2563eb" />
          </TouchableOpacity>
        )}
      </View>

      <VideoNoteRecorder
        visible={isVideoRecorderVisible}
        onClose={() => setIsVideoRecorderVisible(false)}
        onSendVideo={handleSendVideoNote}
      />
    </KeyboardAvoidingView>
  );
}