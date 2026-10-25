import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";

export const toggleReaction = mutation({
  args: {
    messageId: v.id("messages"),
    emoji: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const existing = await ctx.db
      .query("messageReactions")
      .withIndex("by_message_and_user", (q) =>
        q.eq("messageId", args.messageId).eq("userId", userId)
      )
      .filter((q) => q.eq(q.field("emoji"), args.emoji))
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
      return;
    }

    await ctx.db.insert("messageReactions", {
      messageId: args.messageId,
      userId,
      emoji: args.emoji,
      createdAt: Date.now(),
    });

    // Пуш автору повідомлення (якщо реакцію поставив хтось інший)
    const message = await ctx.db.get(args.messageId);
    if (!message || message.senderId === userId) return;

    const author = await ctx.db.get(message.senderId);
    if (!author?.pushToken) return;

    const reactor = await ctx.db.get(userId);
    const room = await ctx.db.get(message.chatRoomId);
    const reactorName = reactor?.name ?? reactor?.email ?? "Співрозмовник";

    await ctx.scheduler.runAfter(0, internal.pushNotifications.sendPushNotification, {
      pushToken: author.pushToken,
      title: `Нова реакція ${args.emoji}`,
      body: `${reactorName} відреагував(ла) ${args.emoji} на ваше повідомлення у "${room?.title ?? "чаті"}"`,
      data: {
        type: "reaction",
        roomId: message.chatRoomId,
        messageId: message._id,
      },
    });
  },
});

export const getMessageReactions = query({
  args: { messageId: v.id("messages") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const reactions = await ctx.db
      .query("messageReactions")
      .withIndex("by_message", (q) => q.eq("messageId", args.messageId))
      .collect();

    const map = new Map<string, { emoji: string; count: number; hasReacted: boolean }>();

    for (const r of reactions) {
      const item = map.get(r.emoji) || { emoji: r.emoji, count: 0, hasReacted: false };
      item.count += 1;
      if (userId && r.userId === userId) {
        item.hasReacted = true;
      }
      map.set(r.emoji, item);
    }

    return Array.from(map.values());
  },
});