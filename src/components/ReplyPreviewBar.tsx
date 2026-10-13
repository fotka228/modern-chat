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
    <View
      className="flex-row items-center justify-between px-4 py-2 bg-[#1c1c1e] border-t border-[#2a2a2c]"
      style={{ borderLeftWidth: 3, borderLeftColor: "#0a84ff" }}
    >
      <View className="flex-row items-center flex-1 mr-2">
        <Ionicons name="arrow-undo" size={18} color="#0a84ff" style={{ marginRight: 8 }} />
        <View className="flex-1">
          <Text className="text-[#0a84ff] font-bold text-xs">
            Відповідь для {replyTarget.senderName}
          </Text>
          <Text className="text-neutral-300 text-xs mt-0.5" numberOfLines={1}>
            {replyTarget.text || "📷 Фото"}
          </Text>
        </View>
      </View>
      <TouchableOpacity onPress={onCancel} className="p-1">
        <Ionicons name="close-circle" size={20} color="#8e8e93" />
      </TouchableOpacity>
    </View>
  );
}