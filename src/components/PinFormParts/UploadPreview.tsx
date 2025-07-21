import { UploadPreviewProps } from "@/lib/types";
import { FC } from "react";

export const UploadPreview: FC<UploadPreviewProps> = ({
  selectedFiles,
  uploadProgress,
  isLoading,
  onRemove,
  onAddMore,
  type,
}) => {
  if (selectedFiles.length === 0) return null;

  return (
    <div className="mt-3 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Selected {type === "image" ? "images" : "files"} (
          {selectedFiles.length})
        </p>
        {selectedFiles.length < 10 && type === "image" && (
          <button
            type="button"
            onClick={onAddMore}
            className="text-xs px-2 py-1 bg-primary-light text-primary rounded hover:bg-primary hover:text-white transition-colors"
            disabled={isLoading}
          >
            + Add More
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
        {selectedFiles.map((file, index) => (
          <div key={index} className="relative bg-gray-100 p-2 rounded-md">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600 truncate flex-1">
                {file.name}
              </span>
              <button
                type="button"
                onClick={() => onRemove(index)}
                className="ml-2 text-red-500 hover:text-red-700 text-sm font-bold"
                disabled={isLoading}
              >
                ×
              </button>
            </div>
            {uploadProgress[index]?.progress > 0 &&
              uploadProgress[index]?.progress < 100 && (
                <div className="mt-1">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{
                        width: `${uploadProgress[index].progress}%`,
                      }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {uploadProgress[index].progress}% complete
                  </p>
                </div>
              )}
          </div>
        ))}
      </div>
    </div>
  );
};
