import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export interface ReplyTarget {
  messageId: string;
  senderName: string;
  text: string;
}

type Props = { replyTarget: ReplyTarget; onCancel: () => void };

export function ReplyPreviewBar({ replyTarget, onCancel }: Props) {
  return (
    <View className="flex-row items-center bg-[#121212] border-t border-[#2a2a2c] px-3 py-2">
      <View className="w-9 h-9 rounded-full bg-[#0a84ff]/15 items-center justify-center mr-3">
        <Ionicons name="arrow-undo" size={18} color="#0a84ff" />
      </View>

      <View className="flex-1 flex-row bg-[#1c1c1e] rounded-xl overflow-hidden">
        <View style={{ width: 3, backgroundColor: "#0a84ff" }} />
        <View className="flex-1 px-3 py-1.5">
          <Text className="text-[#0a84ff] font-bold text-xs" numberOfLines={1}>
            Відповідь для {replyTarget.senderName}
          </Text>
          <Text className="text-neutral-300 text-xs mt-0.5" numberOfLines={1}>
            {replyTarget.text || "📷 Фото"}
          </Text>
        </View>
      </View>

      <TouchableOpacity onPress={onCancel} hitSlop={10} className="ml-3">
        <Ionicons name="close-circle" size={24} color="#8e8e93" />
      </TouchableOpacity>
    </View>
  );
}