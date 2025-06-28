import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  pins: defineTable({
    pinCode: v.string(),
    type: v.union(
      v.literal("text"),
      v.literal("image"),
      v.literal("mixed"),
      v.literal("code"),
      v.literal("url")
    ),
    content: v.string(), // For text type, this is the text. For image type, this is storageId. For mixed, this is JSON string.
    textContent: v.optional(v.string()), // For mixed type, store text separately
    imageIds: v.optional(v.array(v.id("_storage"))), // For multiple images
    userId: v.optional(v.id("users")), // Optional: associate pin with a user
    language: v.optional(v.string()),
  })
    .index("by_pinCode", ["pinCode"])
    .index("by_userId", ["userId"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
