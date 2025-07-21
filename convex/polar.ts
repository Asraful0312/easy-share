import { Polar } from "@convex-dev/polar";
import { api, components } from "./_generated/api";
import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const polar = new Polar(components.polar, {
  // Required: provide a function the component can use to get the current user's ID and
  // email - this will be used for retrieving the correct subscription data for the
  // current user. The function should return an object with `userId` and `email`
  // properties.
  getUserInfo: async (ctx): Promise<any> => {
    const user = await ctx.runQuery(api.auth.loggedInUser);
    if (!user) {
      return null;
    }
    return {
      userId: user._id,
      email: user.email,
    };
  },
  // Optional: Configure static keys for referencing your products.
  // Alternatively you can use the `listAllProducts` function to get
  // the product data and sort it out in your UI however you like
  // (eg., by price, name, recurrence, etc.).
  // Map your product keys to Polar product IDs (you can also use env vars for this)
  // Replace these keys with whatever is useful for your app (eg., "pro", "proMonthly",
  // whatever you want), and replace the values with the actual product IDs from your
  // Polar dashboard
  products: {
    proTier: "b095ce70-5d7b-40eb-97a0-13edd9570054",
    businessTier: "6c6c84c5-b479-4884-8609-f10047f13102",
  },
  server: "production", // Optional: "sandbox" or "production", defaults to POLAR_SERVER env var
});

// Export API functions from the Polar client
export const {
  changeCurrentSubscription,
  cancelCurrentSubscription,
  getConfiguredProducts,
  listAllProducts,
  generateCheckoutLink,
  generateCustomerPortalUrl,
} = polar.api();

export const getCurrentUser = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }
    const userData = await ctx.db.get(userId);
    if (!userData) {
      return null;
    }

    const subscription = await polar.getCurrentSubscription(ctx, {
      userId: userData._id,
    });

    const productKey = subscription?.productKey;
    const isPro = productKey === "proTier";
    const isBusiness = productKey === "businessTier";
    const isVip = userData.isVip;

    const newUserData = {
      ...userData,
      isFree: !isPro && !isBusiness && !isVip,
      isPro,
      isBusiness,
      subscription,
      subscriptionStatus: subscription?.status,
      subscriptionPlan: isBusiness
        ? "team"
        : isPro
          ? "pro"
          : isVip
            ? "vip"
            : "free",

      maxDailyUpload: isBusiness
        ? 50 * 1024 * 1024 * 1024 // 50GB
        : isPro
          ? 5 * 1024 * 1024 * 1024 // 5GB
          : 100 * 1024 * 1024, // 100MB
      maxFileSize: isBusiness
        ? 5 * 1024 * 1024 * 1024 // 5GB
        : isPro
          ? 1 * 1024 * 1024 * 1024 // 1GB
          : 50 * 1024 * 1024, // 50MB
      maxStorageDays: isBusiness ? 30 : isPro ? 7 : 1,
    };

    return newUserData;
  },
});
