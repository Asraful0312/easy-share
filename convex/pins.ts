import { ConvexError, v } from "convex/values";
import { mutation, query, action, internalMutation } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { Doc, Id } from "./_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";
import { ActionCtx, QueryCtx } from "./_generated/server";
import { r2 } from "./files";
import { polar } from "./polar";

// Define the return type for the pin query/action
type PinWithImageUrls =
  | (Doc<"pins"> & { imageUrls?: (string | null)[] })
  | null;

// Function to generate a random 6-digit PIN
const generateRandomPin = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const createPin = mutation({
  args: {
    type: v.union(
      v.literal("text"),
      v.literal("image"),
      v.literal("mixed"),
      v.literal("code"),
      v.literal("url"),
      v.literal("file")
    ),
    content: v.optional(v.string()),
    imageIds: v.optional(v.array(v.id("_storage"))),
    language: v.optional(v.string()),
    fileType: v.optional(v.string()),
    fileKey: v.optional(v.string()),
    fileSize: v.optional(v.number()),
  },
  handler: async (
    ctx,
    args
  ): Promise<{ pinCode: string; pinId: Id<"pins"> }> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User must be authenticated to create a pin.");
    }

    // Fetch user subscription details
    const user = await ctx.runQuery(api.polar.getCurrentUser);
    if (!user) {
      throw new Error("User not found.");
    }

    const subscription = await polar.getCurrentSubscription(ctx, {
      userId: user._id,
    });

    const productKey = subscription?.productKey;
    const isPro = productKey === "proTier";
    const isBusiness = productKey === "businessTier";
    const isVip = user?.isVip;
    const subscriptionPlan =
      user.subscriptionPlan ||
      (isBusiness ? "team" : isPro ? "pro" : isVip ? "vip" : "free");
    const subscriptionStatus = user.subscriptionStatus;

    // Validate subscription status
    if (
      subscriptionPlan !== "free" &&
      subscriptionStatus !== "active" &&
      subscriptionStatus !== "trialing" &&
      subscriptionPlan !== "vip"
    ) {
      throw new ConvexError(
        "Active subscription required to create pins. Please check your subscription status."
      );
    }

    // Define plan limits
    const planLimits = {
      free: {
        maxFileSize: 100 * 1024 * 1024, // 100MB
        maxDailyUpload: 100 * 1024 * 1024, // 100MB
        allowedTypes: ["text", "image", "code", "url", "mixed", "file"],
        maxStorageDays: 1,
      },
      pro: {
        maxFileSize: 1 * 1024 * 1024 * 1024, // 1GB
        maxDailyUpload: 5 * 1024 * 1024 * 1024, // 5GB
        allowedTypes: ["text", "image", "mixed", "code", "url", "file"],
        maxStorageDays: 7,
      },
      team: {
        maxFileSize: 5 * 1024 * 1024 * 1024, // 5GB
        maxDailyUpload: 50 * 1024 * 1024 * 1024, // 50GB
        allowedTypes: ["text", "image", "mixed", "code", "url", "file"],
        maxStorageDays: 30,
      },
      vip: {
        maxFileSize: 5 * 1024 * 1024 * 1024, // 5GB
        maxDailyUpload: 50 * 1024 * 1024 * 1024, // 50GB
        allowedTypes: ["text", "image", "mixed", "code", "url", "file"],
        maxStorageDays: 30,
      },
    };

    const limits =
      planLimits[subscriptionPlan as "pro" | "free" | "team" | "vip"];

    // Validate content type
    if (!limits.allowedTypes.includes(args.type)) {
      throw new ConvexError(
        `Content type "${args.type}" is not allowed on the ${subscriptionPlan} plan.`
      );
    }

    // Validate file size
    if (
      args.type === "image" ||
      args.type === "mixed" ||
      args.type === "file"
    ) {
      if (args.fileSize && args.fileSize > limits.maxFileSize) {
        throw new Error(
          `File size exceeds ${limits.maxFileSize / (1024 * 1024)}MB limit for the ${subscriptionPlan} plan.`
        );
      }

      if (args.imageIds && args.imageIds.length > 0) {
        for (const imageId of args.imageIds) {
          const storageItem = await ctx.storage.getMetadata(imageId);
          if (storageItem && storageItem.size > limits.maxFileSize) {
            throw new Error(
              `Image size exceeds ${limits.maxFileSize / (1024 * 1024)}MB limit for the ${subscriptionPlan} plan.`
            );
          }
        }
      }
    }

    // Check daily upload limit using dailyUploadTotal
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    if (!user.lastResetTime || user.lastResetTime < oneDayAgo) {
      // Reset dailyUploadTotal if last reset was more than 24 hours ago
      await ctx.db.patch(userId, {
        dailyUploadTotal: 0,
        lastResetTime: Date.now(),
      });
    }

    let totalUploadSize = user.dailyUploadTotal || 0;

    if (args.fileSize) {
      totalUploadSize += args.fileSize;
    }
    if (args.imageIds) {
      for (const imageId of args.imageIds) {
        const storageItem = await ctx.storage.getMetadata(imageId);
        if (storageItem) {
          totalUploadSize += storageItem.size;
        }
      }
    }

    if (totalUploadSize > limits.maxDailyUpload) {
      throw new Error(
        `Daily upload limit of ${limits.maxDailyUpload / (1024 * 1024)}MB exceeded for the ${subscriptionPlan} plan.`
      );
    }

    // Generate unique PIN
    let pinCode = generateRandomPin();
    let existingPin: Doc<"pins"> | null = await ctx.db
      .query("pins")
      .withIndex("by_pinCode", (q) => q.eq("pinCode", pinCode))
      .unique();

    while (existingPin) {
      pinCode = generateRandomPin();
      existingPin = await ctx.db
        .query("pins")
        .withIndex("by_pinCode", (q) => q.eq("pinCode", pinCode))
        .unique();
    }

    // Calculate expiration date
    const expirationDate =
      Date.now() + limits.maxStorageDays * 24 * 60 * 60 * 1000;

    // Prepare pin data
    const pinData: any = {
      pinCode,
      type: args.type,
      userId,
      expirationDate,
    };

    if (args.type === "text") {
      pinData.content = args.content || "";
    } else if (args.type === "url") {
      pinData.content = args.content;
    } else if (args.type === "image") {
      pinData.content = args.imageIds?.[0] || "";
      pinData.imageIds = args.imageIds || [];
    } else if (args.type === "mixed") {
      pinData.textContent = args.content || "";
      pinData.imageIds = args.imageIds || [];
      pinData.content = JSON.stringify({
        text: args.content || "",
        imageCount: args.imageIds?.length || 0,
      });
    } else if (args.type === "code") {
      pinData.language = args.language;
      pinData.content = args.content || "";
    } else if (args.type === "file") {
      pinData.content = args.content || "";
      pinData.fileType = args.fileType || "";
      pinData.fileKey = args.fileKey || "";
      pinData.fileSize = args.fileSize || 0;
    }

    const pinId = await ctx.db.insert("pins", pinData);

    // Update dailyUploadTotal
    await ctx.db.patch(userId, {
      dailyUploadTotal: totalUploadSize,
      lastResetTime: user.lastResetTime || Date.now(),
    });

    return { pinCode, pinId };
  },
});

export const getPinByPinCodeQuery = query({
  args: { pinCode: v.string() },
  handler: async (ctx: QueryCtx, args): Promise<PinWithImageUrls> => {
    const pin = await ctx.db
      .query("pins")
      .withIndex("by_pinCode", (q) => q.eq("pinCode", args.pinCode))
      .unique();

    if (!pin) {
      return null;
    }

    if (pin.type === "image" || pin.type === "mixed") {
      const imageIds = pin.imageIds || [];
      const imageUrls = await Promise.all(
        imageIds.map(async (imageId) => {
          return await ctx.storage.getUrl(imageId);
        })
      );
      return { ...pin, imageUrls };
    }

    return pin;
  },
});

export const fetchPinByCode = action({
  args: { pinCode: v.string() },
  handler: async (ctx: ActionCtx, args): Promise<PinWithImageUrls> => {
    return await ctx.runQuery(api.pins.getPinByPinCodeQuery, {
      pinCode: args.pinCode,
    });
  },
});

export const getUserPins = query({
  args: {},
  handler: async (ctx: QueryCtx): Promise<PinWithImageUrls[]> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return []; // Return empty array if user is not authenticated
    }

    const pins = await ctx.db
      .query("pins")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    // Map over pins to add imageUrls for image and mixed types
    const pinsWithImageUrls = await Promise.all(
      pins.map(async (pin) => {
        if (pin.type === "image" || pin.type === "mixed") {
          const imageIds = pin.imageIds || [];
          const imageUrls = await Promise.all(
            imageIds.map(async (imageId) => {
              return await ctx.storage.getUrl(imageId);
            })
          );
          return { ...pin, imageUrls };
        }
        return pin;
      })
    );

    return pinsWithImageUrls;
  },
});

export const getUserUploadInfo = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      return null;
    }

    const subscription = await polar.getCurrentSubscription(ctx, {
      userId: user._id,
    });

    const productKey = subscription?.productKey;
    const isPro = productKey === "proTier";
    const isBusiness = productKey === "businessTier";
    const isVip = user?.isVip;
    const subscriptionPlan =
      user.subscriptionPlan ||
      (isBusiness ? "team" : isPro ? "pro" : isVip ? "vip" : "free");

    const planLimits = {
      free: {
        maxDailyUpload: 100 * 1024 * 1024, // 100MB
      },
      pro: {
        maxDailyUpload: 5 * 1024 * 1024 * 1024, // 5GB
      },
      team: {
        maxDailyUpload: 50 * 1024 * 1024 * 1024, // 50GB
      },
      vip: {
        maxDailyUpload: 50 * 1024 * 1024 * 1024, // 50GB
      },
    };

    const limits = planLimits[subscriptionPlan];
    const dailyUploadTotal = user.dailyUploadTotal || 0;
    const remainingUpload = Math.max(
      0,
      limits.maxDailyUpload - dailyUploadTotal
    );

    // Fetch user's pins with expiration dates
    const pins = await ctx.db
      .query("pins")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    return {
      subscriptionPlan,
      dailyUploadTotal,
      maxDailyUpload: limits.maxDailyUpload,
      remainingUpload,
      lastResetTime: user.lastResetTime || null,
      pins: pins.map((pin) => ({
        pinCode: pin.pinCode,
        type: pin.type,
        expirationDate: pin.expirationDate,
      })),
    };
  },
});

export const deletePin = mutation({
  args: {
    pinId: v.id("pins"),
    imageIds: v.optional(v.array(v.id("_storage"))),
    key: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    if (args.imageIds) {
      for (const imageId of args.imageIds) {
        await ctx.storage.delete(imageId);
      }
    }

    await ctx.db.delete(args.pinId);
    if (args.key) {
      const file = await ctx.db
        .query("files")
        .withIndex("by_key", (q) => q.eq("key", args.key as string))
        .first();
      if (file) {
        console.log("deleted id", file._id);
        await ctx.db.delete(file._id as Id<"files">);
      }
      await r2.deleteObject(ctx, args.key);
    }
  },
});

export const getMetadataAction = action({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    return await r2.getMetadata(ctx, args.key);
  },
});

export const deleteExpiredPins = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    // Query pins that have expired
    const expiredPins = await ctx.db
      .query("pins")
      .withIndex("by_expirationDate", (q) => q.lte("expirationDate", now))
      .take(1000);

    // Delete each expired pin and its associated resources
    for (const pin of expiredPins) {
      try {
        // Delete images from Convex storage
        if (
          pin.type !== "file" &&
          pin.type !== "text" &&
          pin.imageIds &&
          pin.imageIds.length > 0
        ) {
          for (const imageId of pin.imageIds as Id<"_storage">[]) {
            await ctx.storage.delete(imageId);
          }
        }

        // Delete file from Cloudflare R2 (if applicable)
        if (pin.type === "file" && pin.fileKey) {
          await ctx.runMutation(internal.files.deleteR2File, {
            key: pin.fileKey,
          });
        }

        // Delete the pin from the database
        await ctx.db.delete(pin._id);

        // Optional: Log successful deletion
        await ctx.db.insert("logs", {
          timestamp: Date.now(),
          message: `Deleted pin ${pin.pinCode} with expiration date ${pin.expirationDate}`,
        });
      } catch (error) {
        console.error(`Failed to delete pin ${pin.pinCode}:`, error);
        // Log failure to a logs table
        await ctx.db.insert("logs", {
          timestamp: Date.now(),
          message: `Failed to delete pin ${pin.pinCode}: ${(error as Error).message}`,
        });
      }
    }
  },
});

export const resetDailyUploadLimits = internalMutation({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    const now = Date.now();

    for (const user of users) {
      if (
        !user.lastResetTime ||
        user.lastResetTime < now - 24 * 60 * 60 * 1000
      ) {
        await ctx.db.patch(user._id, {
          dailyUploadTotal: 0,
          lastResetTime: now,
        });
      }
    }
  },
});
