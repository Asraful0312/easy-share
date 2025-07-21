// components/pricing/PricingCard.tsx
import React from "react";

interface PricingCardProps {
  title: string;
  price: string;
  cta: string | React.ReactNode; // Allow cta to be a string or component (e.g., CheckoutLink)
  features: string[];
  highlighted?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

export const PricingCard: React.FC<PricingCardProps> = ({
  title,
  price,
  cta,
  features,
  highlighted = false,
  disabled = false,
  onClick,
}) => {
  return (
    <div
      className={`p-6 rounded-lg shadow-lg ${
        highlighted ? "bg-blue-100 border-2 border-blue-500" : "bg-white"
      }`}
    >
      <h2 className="text-2xl font-semibold mb-2">{title}</h2>
      <p className="text-3xl font-bold mb-4">{price}</p>
      {typeof cta === "string" ? (
        <button
          onClick={onClick}
          disabled={disabled}
          className={`w-full py-3 rounded  ${
            disabled
              ? "bg-gray-400 cursor-not-allowed"
              : highlighted
                ? "bg-blue-500 text-white"
                : "bg-gray-200"
          }`}
        >
          {cta}
        </button>
      ) : (
        <div className="w-full bg-blue-500 rounded text-black">{cta}</div>
      )}
      <ul className="mt-4 space-y-2">
        {features.map((feature) => (
          <li key={feature} className="text-gray-600">
            • {feature}
          </li>
        ))}
      </ul>
    </div>
  );
};
