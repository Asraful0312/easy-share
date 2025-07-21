import { auth } from "./auth";
import router from "./router";
import { polar } from "./polar";

const http = router;

auth.addHttpRoutes(http);
polar.registerRoutes(http, {
  // Optional custom path, default is "/polar/events"
  path: "/polar/events",
  // Optional callbacks for webhook events
  onSubscriptionUpdated: async (ctx, event) => {
    // Handle subscription updates, like cancellations.
    // Note that a cancelled subscription will not be deleted from the database,
    // so this information remains available without a hook, eg., via
    // `getCurrentSubscription()`.
    if (event.data.customerCancellationReason) {
      console.log("Customer cancelled:", event.data.customerCancellationReason);
    }
  },
  onSubscriptionCreated: async () => {
    // Handle new subscriptions
    console.log("subscription created");
  },
  onProductCreated: async () => {
    // Handle new products
    console.log("product created");
  },
  onProductUpdated: async () => {
    // Handle product updates
    console.log("product updated");
  },
});

export default http;
