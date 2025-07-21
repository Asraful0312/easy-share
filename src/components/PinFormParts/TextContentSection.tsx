import { TextContentSectionProps } from "@/lib/types";
import { FC } from "react";

export const TextContentSection: FC<TextContentSectionProps> = ({
  textContent,
  onChange,
  onPasteClick,
  onClear,
  isLoading,
  contentType,
}) => {
  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <label
          htmlFor="textContent"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {contentType === "code"
            ? "Code"
            : contentType === "url"
              ? "URL"
              : "Text Content"}
        </label>
        <button
          type="button"
          onClick={onPasteClick}
          className="font-semibold text-primary"
        >
          Click to paste
        </button>
      </div>
      <textarea
        id="textContent"
        value={textContent}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        className="w-full px-4 py-3 rounded-md bg-gray-50 border border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-shadow shadow-sm hover:shadow-md"
        placeholder="Enter your text here..."
        disabled={isLoading}
      />
      {textContent && (
        <div className="flex items-center justify-end">
          <button
            onClick={onClear}
            className="py-2 px-3 rounded bg-red-500 text-white font-medium text-sm"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
};
