import { FC } from "react";

import { ClipboardList, Check } from "lucide-react";
import { GeneratedPinDisplayProps } from "@/lib/types";

export const GeneratedPinDisplay: FC<GeneratedPinDisplayProps> = ({
  pin,
  onCopy,
  isCopied,
}) => {
  return (
    <div className="mt-8 p-4 bg-green-50 border border-green-300 rounded-md text-center relative">
      <p className="text-sm text-green-700">Your PIN is:</p>
      <p className="text-3xl font-bold text-green-800 tracking-wider">{pin}</p>
      <p className="text-xs text-gray-500 mt-2">
        Use this PIN to access your content from another device.
      </p>
      <button
        onClick={onCopy}
        className="absolute right-2 top-2 px-1 py-1 bg-green-500/70 text-white rounded-md mb-4"
      >
        {isCopied ? (
          <Check className="text-white size-4 shrink-0" />
        ) : (
          <ClipboardList className="text-white size-4 shrink-0" />
        )}
      </button>
    </div>
  );
};
