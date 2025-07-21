import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,

  pins: defineTable({
    pinCode: v.string(),
    type: v.union(
      v.literal("text"),
      v.literal("image"),
      v.literal("mixed"),
      v.literal("code"),
      v.literal("url"),
      v.literal("file")
    ),
    content: v.string(),
    textContent: v.optional(v.string()),
    imageIds: v.optional(v.array(v.id("_storage"))),
    userId: v.optional(v.id("users")),
    language: v.optional(v.string()),
    fileType: v.optional(v.string()),
    fileKey: v.optional(v.string()),
    fileSize: v.optional(v.number()),
    expirationDate: v.optional(v.number()),
  })
    .index("by_pinCode", ["pinCode"])
    .index("by_userId", ["userId"])
    .index("by_expirationDate", ["expirationDate"]),
  files: defineTable({
    userId: v.id("users"),
    key: v.string(),
    bucket: v.string(),
    caption: v.optional(v.string()),
    size: v.optional(v.number()),
  })
    .index("bucket_key", ["bucket", "key"])
    .index("by_key", ["key"])
    .index("by_userId", ["userId"]),
  // Extend the users table with subscription fields
  users: defineTable({
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),

    //custom fields
    isFree: v.optional(v.boolean()),
    isPro: v.optional(v.boolean()),
    isBusiness: v.optional(v.boolean()),
    isVip: v.optional(v.boolean()),
    subscriptionId: v.optional(v.string()), // Polar subscription ID
    subscriptionPlan: v.optional(
      v.union(
        v.literal("free"),
        v.literal("pro"),
        v.literal("team"),
        v.literal("vip")
      )
    ), // Plan type
    subscriptionStatus: v.optional(
      v.union(
        v.literal("active"),
        v.literal("canceled"),
        v.literal("past_due"),
        v.literal("unpaid"),
        v.literal("trialing")
      )
    ), // Subscription status
    subscriptionEndDate: v.optional(v.number()), // Unix timestamp for subscription end
    lastPaymentDate: v.optional(v.number()), // Unix timestamp for last payment
    dailyUploadTotal: v.optional(v.number()), // Tracks total uploads in last 24 hours
    maxDailyUpload: v.optional(v.number()),
    maxFileSize: v.optional(v.number()),
    maxStorageDays: v.optional(v.number()),
    lastResetTime: v.optional(v.number()), // Timestamp of last reset
  })
    .index("email", ["email"])
    .index("by_subscriptionId", ["subscriptionId"])
    .index("by_subscriptionPlan", ["subscriptionPlan"]),
  logs: defineTable({
    timestamp: v.number(),
    message: v.string(),
  }),
});
