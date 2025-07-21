import { ContentTypeSelectProps } from "@/lib/types";
import { FC } from "react";

export const ContentTypeSelect: FC<ContentTypeSelectProps> = ({
  contentType,
  onChange,
  language,
  onLanguageChange,
  isLoading,
  languages,
  disabledOptions,
}) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Content Type
      </label>
      <select
        value={contentType}
        onChange={(e) => onChange(e.target.value as any)}
        className="w-full px-4 py-3 rounded-md bg-gray-50 border border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-shadow shadow-sm hover:shadow-md"
        disabled={isLoading}
      >
        <option value="text">Text Only</option>
        <option value="image" disabled={disabledOptions?.includes("image")}>
          Images Only
        </option>
        <option value="mixed" disabled={disabledOptions?.includes("mixed")}>
          Text + Images
        </option>
        <option value="file" disabled={disabledOptions?.includes("file")}>
          File
        </option>
        <option value="code">Code</option>
        <option value="url">Url</option>
      </select>

      {contentType === "code" && (
        <select
          value={language}
          onChange={(e) => onLanguageChange(e.target.value)}
          className="w-full px-4 py-3 my-4 rounded-md bg-gray-50 border border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-shadow shadow-sm hover:shadow-md"
          disabled={isLoading}
        >
          {languages.map((lan) => (
            <option key={lan} value={lan}>
              {lan}
            </option>
          ))}
        </select>
      )}
    </div>
  );
};
