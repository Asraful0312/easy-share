import { R2 } from "@convex-dev/r2";
import { api, components } from "./_generated/api";
import { action, internalMutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

export const r2 = new R2(components.r2);

export const {
  generateUploadUrl,
  syncMetadata,
  deleteObject,
  getMetadata,
  onSyncMetadata,
} = r2.clientApi({
  checkUpload: async (ctx) => {
    // Optional: Add logic to validate user permissions for uploads
    const user = await getAuthUserId(ctx);
    if (!user) throw new Error("Unauthorized");
  },
  onUpload: async (ctx, bucket, key) => {
    const userId = await getAuthUserId(ctx);
    // Optional: Add logic to handle the uploaded file key
    console.log(`File uploaded with key: ${key}`);
    await ctx.db.insert("files", { userId, bucket, key });
  },
  checkDelete: async (ctx) => {
    const user = await getAuthUserId(ctx);
    if (!user) throw new Error("Unauthorized");
  },
  onDelete: async (ctx, bucket, key) => {
    const image = await ctx.db
      .query("files")
      .withIndex("by_key", (q) => q.eq("key", key))
      .first();
    if (image) {
      console.log("deleted id", image._id);
      await ctx.db.delete(image._id as Id<"files">);
    }
  },
  onSyncMetadata: async (ctx, args) => {
    console.log("onSyncMetadata", args);
    const metadata = await r2.getMetadata(ctx, args.key);
    console.log("sync metadata", metadata);
  },
});

export const destruct = internalMutation({
  args: {
    key: v.string(),
  },
  handler: async (ctx, args) => {
    const file = await ctx.db
      .query("files")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();

    if (file) {
      await r2.deleteObject(ctx, args.key);
      await ctx.db.delete(file._id);
      console.log("deleted");
    }
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    // In this example, messages have an imageKey field with the object key
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("unauthorized");
    }

    const files = await ctx.db
      .query("files")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
    return Promise.all(
      files.map(async (file) => ({
        ...file,
        fileUrl: await r2.getUrl(file.key),
      }))
    );
  },
});

export const uploadUrlAction = action({
  args: {
    key: v.string(),
  },
  handler: async (ctx, args): Promise<any> => {
    return await ctx.runQuery(api.files.getUploadUrl, {
      key: args.key,
    });
  },
});

export const getUploadUrl = query({
  args: {
    key: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("unauthorized");
    }

    const data = await ctx.db
      .query("files")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();

    if (!data) {
      throw new Error("No file found");
    }
    const url = `https://imagetotextnow.xyz/${args.key}`;

    return { url };
  },
});

export const getR2UploadUrl = action({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("unauthorized");

    const uploadUrl = await r2.generateUploadUrl(args.key);

    return { uploadUrl };
  },
});

export const deleteR2File = internalMutation({
  args: {
    key: v.string(),
  },
  handler: async (ctx, args) => {
    await r2.deleteObject(ctx, args.key);
  },
});
