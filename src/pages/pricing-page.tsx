/* eslint-disable @typescript-eslint/no-misused-promises */
import { PricingCard } from "@/components/pricing/PricingCard";
import {
  Authenticated,
  Unauthenticated,
  useAction,
  useQuery,
} from "convex/react";
import { api } from "../../convex/_generated/api";
import { CheckoutLink, CustomerPortalLink } from "@convex-dev/polar/react";
import { SignInForm } from "@/SignInForm";

const PricingPage = () => {
  const user = useQuery(api.auth.loggedInUser);
  const userData = useQuery(api.polar.getCurrentUser);
  const products = useQuery(api.polar.getConfiguredProducts);
  const changeSubscription = useAction(api.polar.changeCurrentSubscription);
  const cancelSubscription = useAction(api.polar.cancelCurrentSubscription);

  if (user === undefined) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const plans = [
    {
      title: "Free",
      price: "$0/mo",
      cta: userData?.isFree ? "Current Plan" : "Downgrade to Free",
      productId: null, // No product ID for free plan
      features: [
        "Upload images, text, code, url file types",
        "Store for up to 1 day",
        "Total daily upload: 100MB",
        "Upload file size: 50MB",
      ],
      disabled: userData?.isFree,
    },
    {
      title: "Pro Tier",
      price: "$5/mo",
      cta: userData?.isPro ? "Current Plan" : "Upgrade to Pro",
      productId: "b095ce70-5d7b-40eb-97a0-13edd9570054",
      features: [
        "Upload any file type",
        "Store for up to 7 days",
        "Total daily upload: 5GB",
        "Upload file size: 1GB",
      ],
      highlighted: true,
      disabled: userData?.isPro,
    },
    {
      title: "Team/Business Tier",
      price: "$20/mo",
      cta: userData?.isBusiness ? "Current Plan" : "Upgrade to Team/Business",
      productId: "6c6c84c5-b479-4884-8609-f10047f13102",
      features: [
        "Bulk upload",
        "Store up to 30 days",
        "Up to 50GB/day",
        "Upload up to 5GB per file",
        "Upload any file type",
      ],
      disabled: userData?.isBusiness,
    },
  ];

  const getButtonText = (productId: string | null) => {
    if (!userData?.subscription || !productId) return "Upgrade";
    const currentAmount = userData.subscription.amount ?? 0;
    const targetProduct = Object.values(products ?? {}).find(
      (p) => p?.id === productId
    );
    const targetAmount = targetProduct?.prices[0].priceAmount ?? 0;
    if (targetAmount > currentAmount) return "Upgrade";
    if (targetAmount < currentAmount) return "Downgrade";
    return "Switch";
  };

  const handlePlanChange = async (productId: string | null) => {
    if (!user || !userData) {
      alert("Please log in to change your subscription.");
      return;
    }

    if (!productId) {
      // Handle downgrade to free (cancellation)
      if (
        window.confirm(
          "Are you sure you want to downgrade to the Free plan? This will cancel your current subscription."
        )
      ) {
        try {
          await cancelSubscription({ revokeImmediately: true });
        } catch (error) {
          console.error("Error canceling subscription:", error);
          alert("Failed to cancel subscription. Please try again.");
        }
      }
      return;
    }

    const action = getButtonText(productId);
    if (
      window.confirm(
        `Are you sure you want to ${action.toLowerCase()} your subscription to ${
          plans.find((p) => p.productId === productId)?.title
        }? Any price difference will be prorated.`
      )
    ) {
      try {
        await changeSubscription({ productId: productId });
      } catch (error) {
        console.error("Error changing subscription:", error);
        alert("Failed to change subscription. Please try again.");
      }
    }
  };

  const handleCancelSubscription = async () => {
    if (!user || !userData?.subscription) {
      alert("No active subscription to cancel.");
      return;
    }
    if (
      window.confirm(
        "Are you sure you want to cancel your subscription? This will immediately end your subscription and downgrade you to the Free plan."
      )
    ) {
      try {
        await cancelSubscription({ revokeImmediately: true });
      } catch (error) {
        console.error("Error canceling subscription:", error);
        alert("Failed to cancel subscription. Please try again.");
      }
    }
  };

  return (
    <>
      <Unauthenticated>
        <div className="w-full max-w-md mx-auto bg-white p-8 rounded-xl shadow-2xl text-center">
          <h1 className="text-4xl font-bold text-primary mb-4">
            Welcome to PinDrop!
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Sign in to create and access your pins securely.
          </p>
          <SignInForm />
        </div>
      </Unauthenticated>
      <Authenticated>
        <div className="min-h-screen bg-gray-50 py-20 px-4">
          <div className="max-w-6xl mx-auto text-center">
            <h1 className="text-3xl font-bold mb-4">
              Choose the plan that fits your needs. Upgrade anytime.
            </h1>

            {/* Current Plan Display */}
            {userData && (
              <div className="mb-8 p-6 bg-white rounded-lg shadow-lg">
                <h2 className="text-2xl font-semibold mb-2">Current Plan</h2>
                <div className="flex items-center justify-center gap-4">
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                    {userData.subscription?.product.name ||
                      plans.find(
                        (p) => p.productId === userData.subscription?.productId
                      )?.title ||
                      "Free"}
                  </span>
                  {userData.subscription?.amount && (
                    <span className="text-sm text-gray-600">
                      ${userData.subscription.amount / 100}/
                      {userData.subscription.recurringInterval}
                    </span>
                  )}
                  <span className="text-sm text-gray-600">
                    •{" "}
                    {userData.isBusiness
                      ? "Up to 50GB/day, 5GB/file, 30 days storage"
                      : userData.isPro
                        ? "Up to 5GB/day, 1GB/file, 7 days storage"
                        : "Up to 100MB/day, 50MB/file, 1 day storage"}
                  </span>
                </div>
                {userData.subscription && (
                  <div className="mt-4 flex justify-center gap-4">
                    <CustomerPortalLink
                      polarApi={{
                        generateCustomerPortalUrl:
                          api.polar.generateCustomerPortalUrl,
                      }}
                      className="text-sm text-indigo-600 hover:text-indigo-700"
                    >
                      Manage Subscription
                    </CustomerPortalLink>
                    <button
                      className="text-sm text-red-600 hover:text-red-700"
                      onClick={handleCancelSubscription}
                    >
                      Cancel Subscription
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Pricing Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {plans.map((plan) => (
                <PricingCard
                  key={plan.title}
                  {...plan}
                  onClick={() => handlePlanChange(plan?.productId as string)}
                  cta={
                    plan.productId ? (
                      userData?.isFree ? (
                        <CheckoutLink
                          polarApi={{
                            generateCheckoutLink:
                              api.polar.generateCheckoutLink,
                          }}
                          productIds={[plan.productId].filter(
                            (id): id is string => id !== undefined
                          )}
                          className="text-sm text-black w-full block py-3"
                          embed={false}
                        >
                          {getButtonText(plan.productId)}
                        </CheckoutLink>
                      ) : (
                        getButtonText(plan.productId)
                      )
                    ) : (
                      plan.cta
                    )
                  }
                />
              ))}
            </div>
          </div>
        </div>
      </Authenticated>
    </>
  );
};

export default PricingPage;
