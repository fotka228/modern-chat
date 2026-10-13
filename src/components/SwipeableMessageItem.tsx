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

export interface MessageItemData {
  _id: Id<"messages">;
  senderId: Id<"users">;
  senderName: string;
  senderPhoto?: string;
  content?: string;
  imageUrl?: string;
  isEdited?: boolean;
  replyToId?: Id<"messages">;
  replyToSender?: string;
  replyToText?: string;
  _creationTime: number;
}

type Props = {
  item: MessageItemData;
  isOwn: boolean;
  onLongPress: () => void;
  onReply: (message: MessageItemData) => void;
  onImagePress?: (url: string) => void;
  onAuthorPress?: (userId: Id<"users">) => void;
};

const SWIPE_THRESHOLD = 50;

export function SwipeableMessageItem({
  item,
  isOwn,
  onLongPress,
  onReply,
  onImagePress,
  onAuthorPress,
}: Props) {
  const translateX = useSharedValue(0);

  const triggerReply = () => onReply(item);

  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .failOffsetY([-15, 15])
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

  return (
    <View className="relative justify-center my-1">
      <Animated.View
        style={iconStyle}
        className="absolute left-2 items-center justify-center w-8 h-8 rounded-full bg-[#0a84ff]/30"
      >
        <Ionicons name="arrow-undo" size={18} color="#0a84ff" />
      </Animated.View>

      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={bubbleStyle}
          className={`flex-row ${isOwn ? "justify-end" : "justify-start"}`}
        >
          <TouchableOpacity
            activeOpacity={0.9}
            onLongPress={onLongPress}
            className={`max-w-[82%] rounded-2xl p-3 ${
              isOwn
                ? "bg-[#0a84ff] rounded-br-md"
                : "bg-[#1c1c1e] border border-[#2a2a2c] rounded-bl-md"
            }`}
          >
            {!isOwn && (
              <TouchableOpacity
                onPress={() => onAuthorPress?.(item.senderId)}
                activeOpacity={0.7}
                className="mb-1"
              >
                <Text className="text-[#0a84ff] font-bold text-xs">{item.senderName}</Text>
              </TouchableOpacity>
            )}

            {item.replyToSender ? (
              <View
                className={`mb-2 p-2 rounded-lg ${isOwn ? "bg-black/20" : "bg-[#2a2a2c]"}`}
                style={{ borderLeftWidth: 2, borderLeftColor: isOwn ? "#fff" : "#0a84ff" }}
              >
                <Text
                  className={`font-semibold text-[11px] ${
                    isOwn ? "text-white" : "text-[#0a84ff]"
                  }`}
                >
                  {item.replyToSender}
                </Text>
                <Text className="text-white/70 text-xs mt-0.5" numberOfLines={2}>
                  {item.replyToText || "📷 Фото"}
                </Text>
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
                  className="w-56 h-56 rounded-xl mb-1.5 bg-[#2a2a2c]"
                  resizeMode="cover"
                />
              </TouchableOpacity>
            )}

            {item.content ? (
              <Text className="text-white text-base leading-5">{item.content}</Text>
            ) : null}

            <View className="flex-row items-center justify-end mt-1 gap-1">
              {item.isEdited && (
                <Text className="text-white/60 text-[10px] italic">(ред.)</Text>
              )}
              <Text className="text-white/60 text-[10px]">
                {new Date(item._creationTime).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}