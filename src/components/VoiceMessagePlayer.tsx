import React, { useEffect, useMemo } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  audioUrl: string;
  duration?: number;
  isMyMessage?: boolean;
};

const BARS = 28;

// Однакова "хвиля" для одного й того ж повідомлення
function makeBars(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return Array.from({ length: BARS }, () => {
    h = (h * 1664525 + 1013904223) >>> 0;
    return 6 + (h % 1000) / 1000 * 16; // 6..22 px
  });
}

const formatTime = (sec: number) => {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
};

export function VoiceMessagePlayer({ audioUrl, duration = 0, isMyMessage = false }: Props) {
  const player = useAudioPlayer(audioUrl);
  const status = useAudioPlayerStatus(player);
  const bars = useMemo(() => makeBars(audioUrl), [audioUrl]);

  // Після завершення перемотуємо на початок
  useEffect(() => {
    if (status.didJustFinish) player.seekTo(0);
  }, [status.didJustFinish]);

  const togglePlay = () => {
    if (status.playing) player.pause();
    else player.play();
  };

  const effDuration = status.duration > 0 ? status.duration : duration;
  const progress = effDuration > 0 ? Math.min(1, status.currentTime / effDuration) : 0;
  const activeBars = Math.round(progress * BARS);

  const activeColor = isMyMessage ? "#ffffff" : "#0a84ff";
  const inactiveColor = isMyMessage ? "rgba(255,255,255,0.35)" : "#3a3a3c";

  return (
    <View className="flex-row items-center py-1 min-w-[220px]">
      <TouchableOpacity
        onPress={togglePlay}
        activeOpacity={0.8}
        className={`w-10 h-10 rounded-full items-center justify-center ${
          isMyMessage ? "bg-white" : "bg-[#0a84ff]"
        }`}
      >
        <Ionicons
          name={status.playing ? "pause" : "play"}
          size={20}
          color={isMyMessage ? "#0a84ff" : "#FFFFFF"}
          style={{ marginLeft: status.playing ? 0 : 2 }}
        />
      </TouchableOpacity>

      <View className="flex-1 ml-3">
        <View className="flex-row items-center justify-between" style={{ height: 24 }}>
          {bars.map((h, i) => (
            <View
              key={i}
              style={{
                width: 3,
                height: h,
                borderRadius: 2,
                backgroundColor: i < activeBars ? activeColor : inactiveColor,
              }}
            />
          ))}
        </View>

        <View className="flex-row justify-between mt-1">
          <Text className={`text-[10px] ${isMyMessage ? "text-white/80" : "text-neutral-500"}`}>
            {formatTime(status.currentTime || 0)}
          </Text>
          <Text className={`text-[10px] ${isMyMessage ? "text-white/80" : "text-neutral-500"}`}>
            {formatTime(effDuration)}
          </Text>
        </View>
      </View>
    </View>
  );
}