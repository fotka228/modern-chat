import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useRouter, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { COLORS } from "@/constants/theme";

const CARD_BG = "#1c1c1e";
const BORDER = "#2a2a2c";
const TEXT_MUTED = "#8e8e93";
const ACCENT = "#0a84ff";
const AVATAR_COLORS = ["#0a84ff", "#30d158", "#ff9f0a", "#bf5af2", "#ff453a", "#64d2ff"];

function colorFor(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

function formatTime(ts?: number) {
  if (!ts) return "";
  const d = new Date(ts);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString("uk-UA", { day: "2-digit", month: "2-digit" });
}

export default function HomeScreen() {
  const router = useRouter();
  const rooms = useQuery(api.rooms.listRooms);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  };

  return (
    <View className="flex-1 bg-[#121212]">
      <Stack.Screen
        options={{
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.push("/profile")}
              className="mr-3 w-9 h-9 rounded-full bg-[#1c1c1e] border border-[#2a2a2c] items-center justify-center"
              activeOpacity={0.8}
            >
              <Ionicons name="person" size={18} color={ACCENT} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity
              onPress={() => router.push("/new-room")}
              className="w-9 h-9 rounded-full bg-[#0a84ff] items-center justify-center"
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          ),
        }}
      />

      {rooms === undefined ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={ACCENT} />
        </View>
      ) : rooms.length === 0 ? (
        <View className="flex-1 justify-center items-center px-6">
          <View className="w-20 h-20 rounded-full bg-[#1c1c1e] items-center justify-center mb-4">
            <Ionicons name="chatbubbles-outline" size={36} color={TEXT_MUTED} />
          </View>
          <Text className="text-white text-lg font-bold text-center">
            Немає активних кімнат
          </Text>
          <Text className="text-[#8e8e93] text-sm text-center mt-1">
            Створіть першу кімнату кнопкою «+» угорі
          </Text>
        </View>
      ) : (
        <FlatList
          data={rooms}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{
            padding: 16,
            gap: 10,
            width: "100%",
            maxWidth: 720,
            alignSelf: "center",
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={ACCENT}
            />
          }
          renderItem={({ item }) => {
            const color = colorFor(item.title);
            return (
              <TouchableOpacity
                onPress={() => router.push(`/chat/${item._id}`)}
                activeOpacity={0.7}
                style={{
                  backgroundColor: CARD_BG,
                  borderColor: BORDER,
                  borderWidth: 1,
                  borderRadius: 18,
                  padding: 14,
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <View
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 26,
                    backgroundColor: color + "26",
                    borderWidth: 1.5,
                    borderColor: color,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 14,
                  }}
                >
                  <Text style={{ color, fontSize: 20, fontWeight: "700" }}>
                    {item.title.trim().charAt(0).toUpperCase()}
                  </Text>
                </View>

                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Text
                      style={{ color: "#fff", fontSize: 16, fontWeight: "700", flex: 1 }}
                      numberOfLines={1}
                    >
                      {item.title}
                    </Text>
                    <Text style={{ color: TEXT_MUTED, fontSize: 12, marginLeft: 8 }}>
                      {formatTime(item.lastMessageAt)}
                    </Text>
                  </View>

                  {item.description ? (
                    <Text
                      style={{ color: "#aeaeb2", fontSize: 13, marginTop: 2 }}
                      numberOfLines={1}
                    >
                      {item.description}
                    </Text>
                  ) : null}

                  <Text
                    style={{
                      color: item.lastMessage ? "#c7c7cc" : "#636366",
                      fontSize: 13,
                      marginTop: 4,
                    }}
                    numberOfLines={1}
                  >
                    {item.lastMessage ?? "Повідомлень поки немає"}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}