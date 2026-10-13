import { useMemo, useState } from "react";
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

const STRENGTH_COLORS = ["#2a2a2c", "#ff453a", "#ff9f0a", "#ffd60a", "#30d158"];
const STRENGTH_LABELS = ["", "Слабкий", "Середній", "Добрий", "Надійний"];

function getStrength(p: string) {
  if (!p) return 0;
  let s = 0;
  if (p.length >= 8) s++;
  if (/[a-z]/.test(p) && /[A-Z]/.test(p)) s++;
  if (/\d/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  return Math.max(s, 1);
}

function Field({
  icon,
  right,
  ...props
}: React.ComponentProps<typeof TextInput> & {
  icon: keyof typeof Ionicons.glyphMap;
  right?: React.ReactNode;
}) {
  return (
    <View className="flex-row items-center bg-[#1c1c1e] rounded-xl border border-[#2a2a2c] px-3.5 mb-4">
      <Ionicons name={icon} size={20} color="#8e8e93" />
      <TextInput
        className="flex-1 text-white py-3.5 px-3"
        placeholderTextColor="#636366"
        {...props}
      />
      {right}
    </View>
  );
}

export default function RegisterScreen() {
  const { signIn } = useAuthActions();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const strength = useMemo(() => getStrength(password), [password]);
  const mismatch = confirm.length > 0 && confirm !== password;

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim() || !password) {
      setError("Заповніть усі поля");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError("Некоректний email");
      return;
    }
    if (password.length < 8) {
      setError("Пароль має містити щонайменше 8 символів");
      return;
    }
    if (password !== confirm) {
      setError("Паролі не збігаються");
      return;
    }
    try {
      setLoading(true);
      setError(null);
      await signIn("password", {
        email: email.trim(),
        password,
        name: name.trim(),
        flow: "signUp",
      });
    } catch (e) {
      console.error(e);
      setError("Не вдалося створити акаунт. Можливо, email уже зайнятий");
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
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="w-full max-w-md self-center px-6 pt-14 pb-8">
          <TouchableOpacity
            onPress={() => (router.canGoBack() ? router.back() : router.replace("/login"))}
            className="w-10 h-10 rounded-full bg-[#1c1c1e] items-center justify-center mb-6"
          >
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>

          <Text className="text-white text-3xl font-bold">Приєднуйтесь 👋</Text>
          <Text className="text-neutral-400 text-base mt-2 mb-8">
            Створіть акаунт, щоб почати спілкування
          </Text>

          <Field
            icon="person-outline"
            placeholder="Ваше ім'я"
            value={name}
            onChangeText={setName}
          />
          <Field
            icon="mail-outline"
            placeholder="Email"
            autoCapitalize="none"
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

          {password.length > 0 && (
            <View className="-mt-2 mb-4">
              <View className="flex-row gap-1.5">
                {[1, 2, 3, 4].map((i) => (
                  <View
                    key={i}
                    className="flex-1 h-1 rounded-full"
                    style={{
                      backgroundColor:
                        i <= strength ? STRENGTH_COLORS[strength] : STRENGTH_COLORS[0],
                    }}
                  />
                ))}
              </View>
              <Text className="text-xs mt-1.5" style={{ color: STRENGTH_COLORS[strength] }}>
                {STRENGTH_LABELS[strength]}
              </Text>
            </View>
          )}

          <Field
            icon="shield-checkmark-outline"
            placeholder="Підтвердіть пароль"
            secureTextEntry={!showPass}
            value={confirm}
            onChangeText={setConfirm}
            onSubmitEditing={handleSubmit}
            style={{ color: "#fff" }}
            right={
              confirm.length > 0 ? (
                <Ionicons
                  name={mismatch ? "close-circle" : "checkmark-circle"}
                  size={20}
                  color={mismatch ? "#ff453a" : "#30d158"}
                />
              ) : undefined
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
            className="bg-[#0a84ff] rounded-xl py-4 flex-row items-center justify-center"
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Text className="text-white font-bold text-base mr-2">Створити акаунт</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </>
            )}
          </TouchableOpacity>

          <Text className="text-neutral-500 text-xs text-center mt-4">
            Реєструючись, ви погоджуєтесь з умовами використання
          </Text>

          <TouchableOpacity
            onPress={() => router.replace("/login")}
            className="mt-6 items-center"
          >
            <Text className="text-neutral-400 text-sm">
              Вже є акаунт? <Text className="text-[#0a84ff] font-semibold">Увійти</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}