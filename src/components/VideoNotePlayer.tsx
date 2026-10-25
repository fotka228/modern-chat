import React, { useEffect, useState } from "react";
import { View, TouchableOpacity, Text } from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";
import Svg, { Circle } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  videoUrl: string;
  duration?: number;
  size?: number;
};

export function VideoNotePlayer({ videoUrl, duration = 0, size = 190 }: Props) {
  const [isMuted, setIsMuted] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);

  const strokeWidth = 3;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;

  const player = useVideoPlayer(videoUrl, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  // currentTime не викликає перемальовування сам, тому читаємо його періодично
  useEffect(() => {
    const id = setInterval(() => {
      try {
        setCurrentTime(player.currentTime ?? 0);
      } catch {}
    }, 150);
    return () => clearInterval(id);
  }, [player]);

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    player.muted = next;
  };

  const progress = duration > 0 ? Math.min(1, currentTime / duration) : 0;
  const offset = circumference - progress * circumference;

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={toggleMute}
      style={{ width: size, height: size }}
      className="relative items-center justify-center"
    >
      <View
        style={{ width: size - 12, height: size - 12, borderRadius: (size - 12) / 2 }}
        className="overflow-hidden bg-[#1c1c1e] items-center justify-center"
      >
        <VideoView
          player={player}
          style={{ width: "100%", height: "100%" }}
          contentFit="cover"
          nativeControls={false}
        />
      </View>

      <Svg width={size} height={size} style={{ position: "absolute" }} pointerEvents="none">
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,255,255,0.25)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#64d2ff"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="none"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>

      <View className="absolute bottom-3 right-3 bg-black/65 px-2 py-1 rounded-full flex-row items-center">
        <Ionicons name={isMuted ? "volume-mute" : "volume-high"} size={12} color="#FFFFFF" />
        {duration > 0 && (
          <Text className="text-[10px] text-white font-semibold ml-1">
            {Math.round(duration)}с
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}