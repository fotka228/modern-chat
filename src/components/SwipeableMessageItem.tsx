import { View, Text, TouchableOpacity, Image } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { Id } from "../../convex/_generated/dataModel";
import { VoiceMessagePlayer } from "./VoiceMessagePlayer";
import { VideoNotePlayer } from "./VideoNotePlayer";

export interface MessageItemData {
  _id: Id<"messages">;
  senderId: Id<"users">;
  senderName: string;
  senderPhoto?: string;
  content?: string;
  imageUrl?: string;
  audioUrl?: string;
  audioDuration?: number;
  videoUrl?: string;
  videoDuration?: number;
  isVideoNote?: boolean;
  isEdited?: boolean;
  replyToId?: Id<"messages">;
  replyToSender?: string;
  replyToText?: string;
  _creationTime: number;
}

type MessageProps = {
  item: MessageItemData;
  isOwn: boolean;
  onLongPress: () => void;
  onReply: (message: MessageItemData) => void;
  onImagePress?: (url: string) => void;
  onAuthorPress?: (userId: Id<"users">) => void;
  isFirstInGroup?: boolean;
  isLastInGroup?: boolean;
  /** Те, що показується під бульбашкою (наприклад, реакції) */
  footer?: React.ReactNode;
};

const SWIPE_THRESHOLD = 50;
const NAME_COLORS = ["#64d2ff", "#30d158", "#ff9f0a", "#bf5af2", "#ff6482", "#ffd60a"];

function nameColor(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return NAME_COLORS[h % NAME_COLORS.length];
}

export function SwipeableMessageItem({
  item,
  isOwn,
  onLongPress,
  onReply,
  onImagePress,
  onAuthorPress,
  isFirstInGroup = true,
  isLastInGroup = true,
  footer,
}: MessageProps) {
  const translateX = useSharedValue(0);

  const triggerReply = () => onReply(item);

  const panGesture = Gesture.Pan()
    .activeOffsetX([-15, 15])
    .failOffsetY([-5, 5])
    .onUpdate((e) => {
      if (e.translationX > 0) translateX.value = Math.min(e.translationX, 80);
    })
    .onEnd((e) => {
      if (e.translationX > SWIPE_THRESHOLD) runOnJS(triggerReply)();
      translateX.value = withSpring(0, { damping: 16, stiffness: 200 });
    });

  const bubbleStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const iconStyle = useAnimatedStyle(() => {
    const p = Math.min(translateX.value / SWIPE_THRESHOLD, 1);
    return { opacity: p, transform: [{ scale: 0.5 + p * 0.5 }] };
  });

  const hasVideoNote = !!item.videoUrl && !!item.isVideoNote;
  const hasMedia = !!item.imageUrl || hasVideoNote;
  const pad = hasMedia ? 7 : 0;
  const authorColor = nameColor(item.senderName);

  return (
    <View
      className="relative justify-center"
      style={{ marginTop: isFirstInGroup ? 10 : 2, paddingHorizontal: 4 }}
    >
      <Animated.View
        style={iconStyle}
        className="absolute left-3 items-center justify-center w-9 h-9 rounded-full bg-[#0a84ff]/25"
      >
        <Ionicons name="arrow-undo" size={18} color="#0a84ff" />
      </Animated.View>

      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={[bubbleStyle, { alignItems: isOwn ? "flex-end" : "flex-start" }]}
        >
          <TouchableOpacity
            activeOpacity={0.9}
            onLongPress={onLongPress}
            className={`max-w-[82%] ${
              isOwn ? "bg-[#0a84ff]" : "bg-[#1c1c1e] border border-[#2a2a2c]"
            }`}
            style={{
              paddingHorizontal: hasMedia ? 5 : 12,
              paddingTop: hasMedia ? 5 : 8,
              paddingBottom: 6,
              borderRadius: 20,
              borderBottomRightRadius: isOwn && isLastInGroup ? 6 : 20,
              borderBottomLeftRadius: !isOwn && isLastInGroup ? 6 : 20,
            }}
          >
            {!isOwn && isFirstInGroup && (
              <TouchableOpacity
                onPress={() => onAuthorPress?.(item.senderId)}
                activeOpacity={0.7}
                className="mb-1"
                style={{ paddingHorizontal: pad, paddingTop: hasMedia ? 3 : 0 }}
              >
                <Text className="font-bold text-xs" style={{ color: authorColor }}>
                  {item.senderName}
                </Text>
              </TouchableOpacity>
            )}

            {item.replyToSender ? (
              <View
                className={`mb-1.5 rounded-xl overflow-hidden flex-row ${
                  isOwn ? "bg-black/20" : "bg-[#2a2a2c]"
                }`}
                style={hasMedia ? { marginHorizontal: 2 } : undefined}
              >
                <View style={{ width: 3, backgroundColor: isOwn ? "#fff" : "#0a84ff" }} />
                <View className="px-2.5 py-1.5 flex-1">
                  <Text
                    className="font-semibold text-[11px]"
                    style={{ color: isOwn ? "#fff" : "#0a84ff" }}
                    numberOfLines={1}
                  >
                    {item.replyToSender}
                  </Text>
                  <Text className="text-white/70 text-xs mt-0.5" numberOfLines={2}>
                    {item.replyToText || "📷 Фото"}
                  </Text>
                </View>
              </View>
            ) : null}

            {item.imageUrl && (
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => onImagePress?.(item.imageUrl!)}
                style={{ outlineStyle: "none" } as any}
              >
                <Image
                  source={{ uri: item.imageUrl }}
                  className="w-60 h-60 rounded-2xl mb-1 bg-[#2a2a2c]"
                  resizeMode="cover"
                />
              </TouchableOpacity>
            )}

            {item.audioUrl && (
              <VoiceMessagePlayer
                audioUrl={item.audioUrl}
                duration={item.audioDuration}
                isMyMessage={isOwn}
              />
            )}

            {hasVideoNote && (
              <VideoNotePlayer videoUrl={item.videoUrl!} duration={item.videoDuration} />
            )}

            {item.content ? (
              <Text
                className="text-white text-base leading-[22px]"
                style={{ paddingHorizontal: pad }}
              >
                {item.content}
              </Text>
            ) : null}

            <View
              className="flex-row items-center justify-end mt-0.5 gap-1"
              style={{ paddingHorizontal: pad }}
            >
              {item.isEdited && (
                <Text className={`text-[10px] italic ${isOwn ? "text-white/70" : "text-neutral-500"}`}>
                  змінено
                </Text>
              )}
              <Text className={`text-[10px] ${isOwn ? "text-white/70" : "text-neutral-500"}`}>
                {new Date(item._creationTime).toLocaleTimeString("uk-UA", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </View>
          </TouchableOpacity>

          {footer}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}