import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  audioUrl: string;
  duration?: number;
  isMyMessage?: boolean;
};

export function VoiceMessagePlayer({ audioUrl, duration = 0, isMyMessage = false }: Props) {
  const player = useAudioPlayer(audioUrl);
  const status = useAudioPlayerStatus(player);

  const togglePlay = () => {
    if (status.playing) player.pause();
    else player.play();
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const effDuration = status.duration > 0 ? status.duration : duration;
  const progress = effDuration > 0 ? status.currentTime / effDuration : 0;

  return (
    <View className="flex-row items-center gap-3 py-1 px-1 min-w-[200px]">
      <TouchableOpacity
        onPress={togglePlay}
        className={`w-9 h-9 rounded-full items-center justify-center ${
          isMyMessage ? "bg-white" : "bg-blue-600"
        }`}
      >
        <Ionicons
          name={status.playing ? "pause" : "play"}
          size={18}
          color={isMyMessage ? "#2563eb" : "#FFFFFF"}
          style={{ marginLeft: status.playing ? 0 : 2 }}
        />
      </TouchableOpacity>

      <View className="flex-1 justify-center">
        <View className={`h-1.5 rounded-full overflow-hidden mb-1 ${isMyMessage ? "bg-white/30" : "bg-slate-200"}`}>
          <View className={`h-full ${isMyMessage ? "bg-white" : "bg-blue-600"}`} style={{ width: `${progress * 100}%` }} />
        </View>

        <View className="flex-row justify-between">
          <Text className={`text-[10px] ${isMyMessage ? "text-white/80" : "text-slate-500"}`}>{formatTime(status.currentTime || 0)}</Text>
          <Text className={`text-[10px] ${isMyMessage ? "text-white/80" : "text-slate-500"}`}>{formatTime(effDuration)}</Text>
        </View>
      </View>
    </View>
  );
}