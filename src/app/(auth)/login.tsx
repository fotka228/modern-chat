import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuthActions } from "@convex-dev/auth/react";
import { Ionicons } from "@expo/vector-icons";

export default function LoginScreen() {
  const { signIn } = useAuthActions();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!email.trim() || !password) return;
    try {
      setLoading(true);
      setError(null);
      await signIn("password", { email: email.trim(), password, flow: "signIn" });
    } catch (e) {
      console.error(e);
      setError("Невірний email або пароль");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-[#121212] items-center justify-center"
    >
      <View className="w-full max-w-md p-6">
        <View className="items-center mb-8">
          <View className="w-20 h-20 rounded-full bg-[#1c1c1e] border-2 border-[#0a84ff] items-center justify-center mb-4">
            <Ionicons name="chatbubbles" size={36} color="#0a84ff" />
          </View>
          <Text className="text-white text-2xl font-bold">Modern Chat</Text>
          <Text className="text-neutral-400 text-sm mt-1">Увійдіть в акаунт</Text>
        </View>

        <TextInput
          className="bg-[#1c1c1e] text-white px-4 py-3.5 rounded-2xl border border-[#2a2a2c] mb-3"
          placeholder="Email"
          placeholderTextColor="#8e8e93"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          className="bg-[#1c1c1e] text-white px-4 py-3.5 rounded-2xl border border-[#2a2a2c] mb-3"
          placeholder="Пароль"
          placeholderTextColor="#8e8e93"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          onSubmitEditing={handleSubmit}
        />

        {error ? <Text className="text-red-500 text-sm mb-3">{error}</Text> : null}

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={loading}
          className="bg-[#0a84ff] rounded-2xl py-4 items-center"
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text className="text-white font-bold text-base">Увійти</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/register")} className="mt-4 items-center">
          <Text className="text-neutral-400 text-sm">Немає акаунту? Зареєструватись</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}