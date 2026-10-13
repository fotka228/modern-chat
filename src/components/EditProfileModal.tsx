import { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

type Props = {
  visible: boolean;
  onClose: () => void;
  currentUser: {
    name?: string;
    username?: string;
    bio?: string;
    image?: string;
  } | null | undefined;
};

const inputCls =
  "bg-[#1c1c1e] border border-[#2a2a2c] rounded-xl px-4 py-3 text-white text-base";

export function EditProfileModal({ visible, onClose, currentUser }: Props) {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateUserProfile = useMutation(api.users.updateUserProfile);
  const generateAvatarUploadUrl = useMutation(api.users.generateAvatarUploadUrl);

  useEffect(() => {
    if (visible && currentUser) {
      setName(currentUser.name || "");
      setUsername(currentUser.username || "");
      setBio(currentUser.bio || "");
      setAvatarUri(currentUser.image || null);
      setError(null);
    }
  }, [visible, currentUser]);

  const pickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError("Ім'я не може бути порожнім");
      return;
    }
    try {
      setIsSubmitting(true);
      setError(null);
      let newStorageId: any = undefined;

      if (avatarUri && avatarUri !== currentUser?.image) {
        const uploadUrl = await generateAvatarUploadUrl();
        const response = await fetch(avatarUri);
        const blob = await response.blob();
        const upload = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": blob.type || "image/jpeg" },
          body: blob,
        });
        if (!upload.ok) throw new Error("Не вдалося завантажити фото");
        newStorageId = (await upload.json()).storageId;
      }

      await updateUserProfile({
        name: name.trim(),
        username: username.trim() || undefined,
        bio: bio.trim() || undefined,
        avatarStorageId: newStorageId,
      });
      onClose();
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "Не вдалося оновити профіль");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1 justify-end items-center bg-black/70"
      >
        <View className="w-full max-w-md bg-[#121212] rounded-t-3xl border-t border-[#2a2a2c] max-h-[90%] p-6">
          <View className="flex-row items-center justify-between pb-4 border-b border-[#2a2a2c]">
            <Text className="text-white text-lg font-bold">Редагувати профіль</Text>
            <TouchableOpacity onPress={onClose} disabled={isSubmitting}>
              <Ionicons name="close" size={24} color="#8e8e93" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} className="mt-4">
            <View className="items-center my-4">
              <TouchableOpacity onPress={pickAvatar} disabled={isSubmitting} activeOpacity={0.8}>
                <View className="w-24 h-24 rounded-full bg-[#1c1c1e] border-2 border-[#0a84ff] overflow-hidden items-center justify-center">
                  {avatarUri ? (
                    <Image source={{ uri: avatarUri }} className="w-full h-full" resizeMode="cover" />
                  ) : (
                    <Ionicons name="person" size={44} color="#0a84ff" />
                  )}
                </View>
                <View className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#0a84ff] items-center justify-center border-2 border-[#121212]">
                  <Ionicons name="camera" size={16} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
              <Text className="text-[#0a84ff] text-xs font-semibold mt-2">Змінити фото</Text>
            </View>

            <Text className="text-neutral-400 text-xs font-semibold uppercase mb-1.5 ml-1">
              Ім'я *
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Ваше ім'я"
              placeholderTextColor="#636366"
              className={`${inputCls} mb-4`}
            />

            <Text className="text-neutral-400 text-xs font-semibold uppercase mb-1.5 ml-1">
              Нікнейм
            </Text>
            <TextInput
              value={username}
              onChangeText={setUsername}
              placeholder="alex_dev"
              placeholderTextColor="#636366"
              autoCapitalize="none"
              className={`${inputCls} mb-4`}
            />

            <Text className="text-neutral-400 text-xs font-semibold uppercase mb-1.5 ml-1">
              Про себе
            </Text>
            <TextInput
              value={bio}
              onChangeText={setBio}
              placeholder="Кілька слів про себе"
              placeholderTextColor="#636366"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              className={`${inputCls} min-h-[80px] mb-5`}
            />

            {error ? <Text className="text-red-500 text-sm mb-3">{error}</Text> : null}

            <TouchableOpacity
              onPress={handleSave}
              disabled={isSubmitting}
              className="bg-[#0a84ff] rounded-xl py-3.5 items-center mb-6"
              style={{ opacity: isSubmitting ? 0.6 : 1 }}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="text-white font-bold text-base">Зберегти</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}