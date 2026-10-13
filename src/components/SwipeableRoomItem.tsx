import React from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { GestureDetector, Gesture } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import type { Id } from "../../convex/_generated/dataModel";

// ==================== SWIPEABLE ROOM ITEM ====================

const CARD_BG = "#1c1c1e";
const BORDER = "#2a2a2c";
const TEXT_MUTED = "#8e8e93";
const ACTION_WIDTH = 84;
const SPRING = { damping: 18, stiffness: 180 };

const AVATAR_COLORS = ["#0a84ff", "#30d158", "#ff9f0a", "#bf5af2", "#ff453a", "#64d2ff"];

function colorFor(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

function formatTime(ts?: number) {
  if (!ts) return "";
  const d = new Date(ts);
  if (d.toDateString() === new Date().toDateString()) {
    return d.toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString("uk-UA", { day: "2-digit", month: "2-digit" });
}

type Room = {
  _id: Id<"chatRooms">;
  title: string;
  description?: string;
  lastMessage?: string;
  lastMessageAt?: number;
};

type RoomProps = {
  room: Room;
  isCreator: boolean;
  onPress: () => void;
  onDelete: (roomId: Id<"chatRooms">) => void;
};

export function SwipeableRoomItem({ room, isCreator, onPress, onDelete }: RoomProps) {
  const translateX = useSharedValue(0);
  const color = colorFor(room.title);

  const pan = Gesture.Pan()
    .enabled(isCreator)
    .activeOffsetX([-15, 15])
    .failOffsetY([-5, 5]) // Покращує вертикальний скрол списку
    .onUpdate((e) => {
      const start = translateX.value <= -ACTION_WIDTH + 1 ? -ACTION_WIDTH : 0;
      const next = start + e.translationX;
      translateX.value = Math.min(0, Math.max(next, -ACTION_WIDTH - 20));
    })
    .onEnd(() => {
      translateX.value = withSpring(
        translateX.value < -ACTION_WIDTH / 2 ? -ACTION_WIDTH : 0,
        SPRING
      );
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const iconStyle = useAnimatedStyle(() => {
    const p = Math.min(Math.abs(translateX.value) / ACTION_WIDTH, 1);
    return { opacity: p, transform: [{ scale: 0.6 + 0.4 * p }] };
  });

  const close = () => {
    translateX.value = withSpring(0, SPRING);
  };

  return (
    <View style={{ borderRadius: 18, overflow: "hidden" }}>
      {/* Нижній червоний шар */}
      <View
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: "#ff453a",
          alignItems: "flex-end",
          justifyContent: "center",
        }}
      >
        <TouchableOpacity
          onPress={() => {
            close();
            onDelete(room._id);
          }}
          activeOpacity={0.8}
          style={{ width: ACTION_WIDTH, height: "100%", alignItems: "center", justifyContent: "center" }}
        >
          <Animated.View style={[{ alignItems: "center" }, iconStyle]}>
            <Ionicons name="trash-outline" size={24} color="#FFFFFF" />
            <Text style={{ color: "#fff", fontSize: 11, fontWeight: "700", marginTop: 4 }}>
              Видалити
            </Text>
          </Animated.View>
        </TouchableOpacity>
      </View>

      {/* Верхня картка */}
      <GestureDetector gesture={pan}>
        <Animated.View style={cardStyle}>
          <TouchableOpacity
            onPress={() => (translateX.value !== 0 ? close() : onPress())}
            activeOpacity={0.9}
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
                {room.title.trim().charAt(0).toUpperCase()}
              </Text>
            </View>

            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text
                  style={{ color: "#fff", fontSize: 16, fontWeight: "700", flexShrink: 1 }}
                  numberOfLines={1}
                >
                  {room.title}
                </Text>
                {isCreator && (
                  <View
                    style={{
                      marginLeft: 6,
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                      borderRadius: 6,
                      backgroundColor: "#0a84ff33",
                    }}
                  >
                    <Text style={{ color: "#0a84ff", fontSize: 10, fontWeight: "600" }}>
                      автор
                    </Text>
                  </View>
                )}
                <View style={{ flex: 1 }} />
                <Text style={{ color: TEXT_MUTED, fontSize: 12, marginLeft: 8 }}>
                  {formatTime(room.lastMessageAt)}
                </Text>
              </View>

              {room.description ? (
                <Text style={{ color: "#aeaeb2", fontSize: 13, marginTop: 2 }} numberOfLines={1}>
                  {room.description}
                </Text>
              ) : null}

              <Text
                style={{
                  color: room.lastMessage ? "#c7c7cc" : "#636366",
                  fontSize: 13,
                  marginTop: 4,
                }}
                numberOfLines={1}
              >
                {room.lastMessage ?? "Повідомлень поки немає"}
              </Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}