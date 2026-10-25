import { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
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

type FieldKey = "name" | "username" | "bio";

function Label({ text, counter }: { text: string; counter?: string }) {
  return (
    <View className="flex-row items-center justify-between mb-1.5 mx-1">
      <Text className="text-neutral-400 text-xs font-semibold uppercase">{text}</Text>
      {counter ? <Text className="text-neutral-600 text-xs">{counter}</Text> : null}
    </View>
  );
}

export function EditProfileModal({ visible, onClose, currentUser }: Props) {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focused, setFocused] = useState<FieldKey | null>(null);

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

  const borderFor = (k: FieldKey) => (focused === k ? "#0a84ff" : "#2a2a2c");
  const iconFor = (k: FieldKey) => (focused === k ? "#0a84ff" : "#8e8e93");

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1 justify-end items-center"
      >
        {/* Затемнення: натискання закриває вікно */}
        <Pressable
          onPress={isSubmitting ? undefined : onClose}
          style={{ position: "absolute", top: 0, bottom: 0, left: 0, right: 0, backgroundColor: "rgba(0,0,0,0.7)" }}
        />

        <View className="w-full max-w-md bg-[#121212] rounded-t-3xl border-t border-x border-[#2a2a2c] max-h-[92%] px-6 pt-3 pb-4">
          {/* Ручка */}
          <View className="self-center w-10 h-1 rounded-full bg-[#3a3a3c] mb-3" />

          <View className="flex-row items-center justify-between pb-4 border-b border-[#2a2a2c]">
            <Text className="text-white text-xl font-bold">Редагувати профіль</Text>
            <TouchableOpacity
              onPress={onClose}
              disabled={isSubmitting}
              hitSlop={10}
              className="w-9 h-9 rounded-full bg-[#1c1c1e] items-center justify-center"
              style={{ opacity: isSubmitting ? 0.4 : 1 }}
            >
              <Ionicons name="close" size={20} color="#8e8e93" />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            className="mt-2"
          >
            {/* Аватар */}
            <View className="items-center my-5">
              <TouchableOpacity onPress={pickAvatar} disabled={isSubmitting} activeOpacity={0.8}>
                <View
                  className="w-28 h-28 rounded-full bg-[#1c1c1e] border-[3px] border-[#0a84ff] overflow-hidden items-center justify-center"
                  style={{
                    shadowColor: "#0a84ff",
                    shadowOpacity: 0.4,
                    shadowRadius: 20,
                    shadowOffset: { width: 0, height: 6 },
                    elevation: 10,
                  }}
                >
                  {avatarUri ? (
                    <Image source={{ uri: avatarUri }} className="w-full h-full" resizeMode="cover" />
                  ) : (
                    <Ionicons name="person" size={50} color="#0a84ff" />
                  )}
                </View>
                <View className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-[#0a84ff] items-center justify-center border-[3px] border-[#121212]">
                  <Ionicons name="camera" size={16} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
              <Text className="text-[#0a84ff] text-sm font-semibold mt-3">Змінити фото</Text>
            </View>

            {/* Ім'я */}
            <Label text="Ім'я *" counter={`${name.length}/50`} />
            <View
              className="flex-row items-center bg-[#1c1c1e] rounded-xl border px-3.5 mb-4"
              style={{ borderColor: borderFor("name") }}
            >
              <Ionicons name="person-outline" size={20} color={iconFor("name")} />
              <TextInput
                value={name}
                onChangeText={setName}
                onFocus={() => setFocused("name")}
                onBlur={() => setFocused(null)}
                placeholder="Ваше ім'я"
                placeholderTextColor="#636366"
                maxLength={50}
                selectionColor="#0a84ff"
                className="flex-1 text-white text-base py-3.5 px-3"
              />
            </View>

            {/* Нікнейм */}
            <Label text="Нікнейм" />
            <View
              className="flex-row items-center bg-[#1c1c1e] rounded-xl border px-3.5 mb-4"
              style={{ borderColor: borderFor("username") }}
            >
              <Ionicons name="at" size={20} color={iconFor("username")} />
              <TextInput
                value={username}
                onChangeText={setUsername}
                onFocus={() => setFocused("username")}
                onBlur={() => setFocused(null)}
                placeholder="alex_dev"
                placeholderTextColor="#636366"
                autoCapitalize="none"
                autoCorrect={false}
                selectionColor="#0a84ff"
                className="flex-1 text-white text-base py-3.5 px-3"
              />
            </View>

            {/* Про себе */}
            <Label text="Про себе" counter={`${bio.length}/150`} />
            <View
              className="bg-[#1c1c1e] rounded-xl border px-4 mb-5"
              style={{ borderColor: borderFor("bio") }}
            >
              <TextInput
                value={bio}
                onChangeText={setBio}
                onFocus={() => setFocused("bio")}
                onBlur={() => setFocused(null)}
                placeholder="Кілька слів про себе"
                placeholderTextColor="#636366"
                multiline
                numberOfLines={3}
                maxLength={150}
                textAlignVertical="top"
                selectionColor="#0a84ff"
                className="text-white text-base py-3.5 min-h-[90px]"
              />
            </View>

            {error ? (
              <View className="flex-row items-center bg-[#ff453a]/10 rounded-xl px-3 py-2.5 mb-4">
                <Ionicons name="alert-circle" size={18} color="#ff453a" />
                <Text className="text-red-500 text-sm ml-2 flex-1">{error}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              onPress={handleSave}
              disabled={isSubmitting}
              activeOpacity={0.8}
              className="bg-[#0a84ff] rounded-xl py-4 flex-row items-center justify-center mb-4"
              style={{ opacity: isSubmitting ? 0.6 : 1 }}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="checkmark" size={20} color="#fff" />
                  <Text className="text-white font-bold text-base ml-2">Зберегти</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}