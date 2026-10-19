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
    <View className="flex-row flex-wrap gap-1 mt-1">
      {reactions.map((r) => (
        <TouchableOpacity
          key={r.emoji}
          onPress={() => toggleReaction({ messageId, emoji: r.emoji })}
          className={`flex-row items-center px-2 py-0.5 rounded-full border ${
            r.hasReacted ? "bg-blue-100 border-blue-500" : "bg-white border-slate-200"
          }`}
        >
          <Text className="text-xs">{r.emoji}</Text>
          <Text className="text-xs font-bold ml-1 text-slate-700">{r.count}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}