// convex/messages.ts
import { mutation, query, MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { paginationOptsValidator } from "convex/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

/**
 * Надсилає пуш учасникам кімнати (творцю та всім, хто раніше писав),
 * крім автора повідомлення та тих, кого треба виключити.
 */
async function notifyRoomParticipants(
  ctx: MutationCtx,
  opts: {
    chatRoomId: Id<"chatRooms">;
    senderId: Id<"users">;
    senderName: string;
    body: string;
    messageId: Id<"messages">;
    excludeIds?: (Id<"users"> | null)[];
  }
) {
  const room = await ctx.db.get(opts.chatRoomId);
  const roomTitle = room?.title ?? "Чат";
  const excluded = new Set<Id<"users">>([opts.senderId]);
  for (const id of opts.excludeIds ?? []) if (id) excluded.add(id);

  const recipientIds = new Set<Id<"users">>();
  if (room?.creatorId && !excluded.has(room.creatorId)) {
    recipientIds.add(room.creatorId);
  }

  const roomMessages = await ctx.db
    .query("messages")
    .withIndex("by_chat_room", (q) => q.eq("chatRoomId", opts.chatRoomId))
    .collect();

  for (const msg of roomMessages) {
    if (!excluded.has(msg.senderId)) recipientIds.add(msg.senderId);
  }

  for (const recipientId of recipientIds) {
    const recipient = await ctx.db.get(recipientId);
    if (recipient?.pushToken) {
      await ctx.scheduler.runAfter(
        0,
        internal.pushNotifications.sendPushNotification,
        {
          pushToken: recipient.pushToken,
          title: `${opts.senderName} (${roomTitle})`,
          body: opts.body,
          data: { type: "message", roomId: opts.chatRoomId, messageId: opts.messageId },
        }
      );
    }
  }
}

export const getPaginatedMessages = query({
  args: {
    chatRoomId: v.id("chatRooms"),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return { page: [], isDone: true, continueCursor: "" };
    }

    return await ctx.db
      .query("messages")
      .withIndex("by_chat_room", (q) => q.eq("chatRoomId", args.chatRoomId))
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

export const sendMessage = mutation({
  args: {
    chatRoomId: v.id("chatRooms"),
    content: v.string(),
    replyToId: v.optional(v.id("messages")),
    replyToSender: v.optional(v.string()),
    replyToText: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    const trimmed = args.content.trim();
    if (!trimmed) throw new Error("Message cannot be empty");

    const senderName = user.name ?? user.email ?? "Користувач";

    const messageId = await ctx.db.insert("messages", {
      chatRoomId: args.chatRoomId,
      senderId: userId,
      senderName,
      senderPhoto: user.image,
      content: trimmed,
      replyToId: args.replyToId,
      replyToSender: args.replyToSender,
      replyToText: args.replyToText,
    });

    await ctx.db.patch(args.chatRoomId, {
      lastMessage: trimmed,
      lastMessageAt: Date.now(),
    });

    // --- ПУШ-СПОВІЩЕННЯ ---
    const room = await ctx.db.get(args.chatRoomId);
    const roomTitle = room?.title ?? "Чат";
    let replyAuthorId: Id<"users"> | null = null;

    // Відповідь: персональний пуш автору оригіналу
    if (args.replyToId) {
      const original = await ctx.db.get(args.replyToId);
      if (original && original.senderId !== userId) {
        replyAuthorId = original.senderId;
        const originalAuthor = await ctx.db.get(original.senderId);

        if (originalAuthor?.pushToken) {
          await ctx.scheduler.runAfter(
            0,
            internal.pushNotifications.sendPushNotification,
            {
              pushToken: originalAuthor.pushToken,
              title: `💬 Відповідь від ${senderName}`,
              body: `${senderName} відповів(-ла) у "${roomTitle}": ${trimmed}`,
              data: { type: "reply", roomId: args.chatRoomId, messageId },
            }
          );
        }
      }
    }

    // Решта учасників (без автора відповіді, щоб не було дубля)
    await notifyRoomParticipants(ctx, {
      chatRoomId: args.chatRoomId,
      senderId: userId,
      senderName,
      body: trimmed,
      messageId,
      excludeIds: [replyAuthorId],
    });

    return messageId;
  },
});

export const editMessage = mutation({
  args: {
    messageId: v.id("messages"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const message = await ctx.db.get(args.messageId);
    if (!message || message.senderId !== userId) {
      throw new Error("Forbidden or not found");
    }

    const trimmed = args.content.trim();
    if (!trimmed) throw new Error("Message cannot be empty");

    await ctx.db.patch(args.messageId, {
      content: trimmed,
      isEdited: true,
    });
  },
});

export const deleteMessage = mutation({
  args: { messageId: v.id("messages") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const message = await ctx.db.get(args.messageId);
    if (!message || message.senderId !== userId) {
      throw new Error("Forbidden or not found");
    }

    if (message.storageId) await ctx.storage.delete(message.storageId);
    if (message.audioStorageId) await ctx.storage.delete(message.audioStorageId);
    if (message.videoStorageId) await ctx.storage.delete(message.videoStorageId);

    await ctx.db.delete(args.messageId);
  },
});

export const generateUploadUrl = mutation(async (ctx) => {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Unauthorized");
  return await ctx.storage.generateUploadUrl();
});

export const sendMediaMessage = mutation({
  args: {
    chatRoomId: v.id("chatRooms"),
    storageId: v.id("_storage"),
    content: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    const imageUrl = await ctx.storage.getUrl(args.storageId);
    if (!imageUrl) throw new Error("Upload URL error");

    const senderName = user.name ?? user.email ?? "Користувач";
    const caption = args.content?.trim() || undefined;

    const messageId = await ctx.db.insert("messages", {
      chatRoomId: args.chatRoomId,
      senderId: userId,
      senderName,
      senderPhoto: user.image,
      imageUrl,
      storageId: args.storageId,
      content: caption,
    });

    await ctx.db.patch(args.chatRoomId, {
      lastMessage: "📷 Фото",
      lastMessageAt: Date.now(),
    });

    await notifyRoomParticipants(ctx, {
      chatRoomId: args.chatRoomId,
      senderId: userId,
      senderName,
      body: caption ? `📷 ${caption}` : "📷 Фото",
      messageId,
    });

    return messageId;
  },
});

export const sendAudioMessage = mutation({
  args: {
    chatRoomId: v.id("chatRooms"),
    audioStorageId: v.id("_storage"),
    audioDuration: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    const audioUrl = await ctx.storage.getUrl(args.audioStorageId);
    if (!audioUrl) throw new Error("Audio URL error");

    const senderName = user.name ?? user.email ?? "Користувач";

    const messageId = await ctx.db.insert("messages", {
      chatRoomId: args.chatRoomId,
      senderId: userId,
      senderName,
      senderPhoto: user.image,
      audioUrl,
      audioStorageId: args.audioStorageId,
      audioDuration: args.audioDuration,
    });

    await ctx.db.patch(args.chatRoomId, {
      lastMessage: "🎤 Голосове повідомлення",
      lastMessageAt: Date.now(),
    });

    await notifyRoomParticipants(ctx, {
      chatRoomId: args.chatRoomId,
      senderId: userId,
      senderName,
      body: "🎤 Голосове повідомлення",
      messageId,
    });

    return messageId;
  },
});

export const sendVideoNoteMessage = mutation({
  args: {
    chatRoomId: v.id("chatRooms"),
    videoStorageId: v.id("_storage"),
    videoDuration: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    const videoUrl = await ctx.storage.getUrl(args.videoStorageId);
    if (!videoUrl) throw new Error("Video URL error");

    const senderName = user.name ?? user.email ?? "Користувач";

    const messageId = await ctx.db.insert("messages", {
      chatRoomId: args.chatRoomId,
      senderId: userId,
      senderName,
      senderPhoto: user.image,
      videoUrl,
      videoStorageId: args.videoStorageId,
      videoDuration: args.videoDuration,
      isVideoNote: true,
    });

    await ctx.db.patch(args.chatRoomId, {
      lastMessage: "📹 Відеоповідомлення",
      lastMessageAt: Date.now(),
    });

    await notifyRoomParticipants(ctx, {
      chatRoomId: args.chatRoomId,
      senderId: userId,
      senderName,
      body: "📹 Відеоповідомлення",
      messageId,
    });

    return messageId;
  },
});