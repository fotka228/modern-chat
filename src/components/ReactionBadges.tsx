import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

type Props = { messageId: Id<"messages"> };

export function ReactionBadges({ messageId }: Props) {
  const reactions = useQuery(api.reactions.getMessageReactions, { messageId });
  const toggleReaction = useMutation(api.reactions.toggleReaction);

  if (!reactions || reactions.length === 0) return null;

  return (
    <View className="flex-row flex-wrap gap-1.5 mt-1">
      {reactions.map((r) => (
        <TouchableOpacity
          key={r.emoji}
          onPress={() => toggleReaction({ messageId, emoji: r.emoji })}
          activeOpacity={0.7}
          className={`flex-row items-center px-2.5 py-1 rounded-full border ${
            r.hasReacted
              ? "bg-[#0a84ff]/20 border-[#0a84ff]"
              : "bg-[#1c1c1e] border-[#2a2a2c]"
          }`}
        >
          <Text className="text-sm">{r.emoji}</Text>
          <Text
            className={`text-xs font-bold ml-1.5 ${
              r.hasReacted ? "text-[#0a84ff]" : "text-neutral-400"
            }`}
          >
            {r.count}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}