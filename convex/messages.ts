import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { paginationOptsValidator } from "convex/server";

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
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    const trimmed = args.content.trim();
    if (!trimmed) throw new Error("Message cannot be empty");

    const messageId = await ctx.db.insert("messages", {
      chatRoomId: args.chatRoomId,
      senderId: userId,
      senderName: user.name ?? user.email ?? "Користувач",
      senderPhoto: user.image,
      content: trimmed,
    });

    await ctx.db.patch(args.chatRoomId, {
      lastMessage: trimmed,
      lastMessageAt: Date.now(),
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

    const messageId = await ctx.db.insert("messages", {
      chatRoomId: args.chatRoomId,
      senderId: userId,
      senderName: user.name ?? user.email ?? "Користувач",
      senderPhoto: user.image,
      imageUrl,
      storageId: args.storageId,
      content: args.content?.trim() || undefined,
    });

    await ctx.db.patch(args.chatRoomId, {
      lastMessage: "📷 Фото",
      lastMessageAt: Date.now(),
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

    const messageId = await ctx.db.insert("messages", {
      chatRoomId: args.chatRoomId,
      senderId: userId,
      senderName: user.name ?? user.email ?? "Користувач",
      senderPhoto: user.image,
      audioUrl,
      audioStorageId: args.audioStorageId,
      audioDuration: args.audioDuration,
    });

    await ctx.db.patch(args.chatRoomId, {
      lastMessage: "🎤 Голосове повідомлення",
      lastMessageAt: Date.now(),
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

    const messageId = await ctx.db.insert("messages", {
      chatRoomId: args.chatRoomId,
      senderId: userId,
      senderName: user.name ?? user.email ?? "Користувач",
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

    return messageId;
  },
});