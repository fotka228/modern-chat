import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuthActions } from "@convex-dev/auth/react";
import { Ionicons } from "@expo/vector-icons";

function Field({
  icon,
  right,
  ...props
}: React.ComponentProps<typeof TextInput> & {
  icon: keyof typeof Ionicons.glyphMap;
  right?: React.ReactNode;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View
      className="flex-row items-center bg-[#1c1c1e] rounded-xl border px-3.5 mb-4"
      style={{ borderColor: focused ? "#0a84ff" : "#2a2a2c" }}
    >
      <Ionicons name={icon} size={20} color={focused ? "#0a84ff" : "#8e8e93"} />
      <TextInput
        className="flex-1 text-white py-3.5 px-3"
        placeholderTextColor="#636366"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        {...props}
      />
      {right}
    </View>
  );
}

export default function LoginScreen() {
  const { signIn } = useAuthActions();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!email.trim() || !password) {
      setError("Введіть email і пароль");
      return;
    }
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
      className="flex-1 bg-[#121212]"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="w-full max-w-md self-center px-6 py-10">
          {/* Логотип */}
          <View className="items-center mb-10">
            <View
              className="w-24 h-24 rounded-3xl bg-[#1c1c1e] border border-[#2a2a2c] items-center justify-center mb-5"
              style={{
                shadowColor: "#0a84ff",
                shadowOpacity: 0.35,
                shadowRadius: 24,
                shadowOffset: { width: 0, height: 8 },
                elevation: 10,
              }}
            >
              <Ionicons name="chatbubbles" size={44} color="#0a84ff" />
            </View>
            <Text className="text-white text-3xl font-bold">З поверненням 👋</Text>
            <Text className="text-neutral-400 text-base mt-2 text-center">
              Увійдіть, щоб продовжити спілкування
            </Text>
          </View>

          <Field
            icon="mail-outline"
            placeholder="Email"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <Field
            icon="lock-closed-outline"
            placeholder="Пароль"
            secureTextEntry={!showPass}
            value={password}
            onChangeText={setPassword}
            onSubmitEditing={handleSubmit}
            right={
              <TouchableOpacity onPress={() => setShowPass((v) => !v)} hitSlop={10}>
                <Ionicons
                  name={showPass ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color="#8e8e93"
                />
              </TouchableOpacity>
            }
          />

          {error ? (
            <View className="flex-row items-center bg-[#ff453a]/10 rounded-xl px-3 py-2.5 mb-4">
              <Ionicons name="alert-circle" size={18} color="#ff453a" />
              <Text className="text-red-500 text-sm ml-2 flex-1">{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={loading}
            className="bg-[#0a84ff] rounded-xl py-4 flex-row items-center justify-center mt-1"
            activeOpacity={0.8}
            style={{ opacity: loading ? 0.7 : 1 }}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Text className="text-white font-bold text-base mr-2">Увійти</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </>
            )}
          </TouchableOpacity>

          {/* Роздільник */}
          <View className="flex-row items-center my-7">
            <View className="flex-1 h-px bg-[#2a2a2c]" />
            <Text className="text-neutral-500 text-xs mx-3">або</Text>
            <View className="flex-1 h-px bg-[#2a2a2c]" />
          </View>

          <TouchableOpacity
            onPress={() => router.push("/register")}
            className="border border-[#2a2a2c] bg-[#1c1c1e] rounded-xl py-4 items-center"
            activeOpacity={0.8}
          >
            <Text className="text-neutral-300 text-base">
              Немає акаунту? <Text className="text-[#0a84ff] font-semibold">Зареєструватись</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}