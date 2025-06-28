import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { api } from "./_generated/api";
import { Doc, Id } from "./_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";
import { ActionCtx, QueryCtx } from "./_generated/server";

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
      v.literal("url")
    ),
    content: v.optional(v.string()), // Text content
    imageIds: v.optional(v.array(v.id("_storage"))), // Array of storage IDs for images
    language: v.optional(v.string()),
  },
  handler: async (
    ctx,
    args
  ): Promise<{ pinCode: string; pinId: Id<"pins"> }> => {
    const userId = await getAuthUserId(ctx);

    let pinCode = generateRandomPin();
    let existingPin: Doc<"pins"> | null = await ctx.db
      .query("pins")
      .withIndex("by_pinCode", (q) => q.eq("pinCode", pinCode))
      .unique();

    // Ensure PIN is unique
    while (existingPin) {
      pinCode = generateRandomPin();
      existingPin = await ctx.db
        .query("pins")
        .withIndex("by_pinCode", (q) => q.eq("pinCode", pinCode))
        .unique();
    }

    const pinData: any = {
      pinCode,
      type: args.type,
      userId: userId ?? undefined,
    };

    if (args.type === "text") {
      pinData.content = args.content || "";
    } else if (args.type === "url") {
      pinData.content = args.content;
    } else if (args.type === "image") {
      // For single image, store the first imageId in content for backward compatibility
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
      pinData.language = args?.language;
      pinData.content = args.content || "";
    }

    const pinId = await ctx.db.insert("pins", pinData);

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

export const deletePin = mutation({
  args: {
    pinId: v.id("pins"),
    imageIds: v.optional(v.array(v.id("_storage"))),
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
  },
});
