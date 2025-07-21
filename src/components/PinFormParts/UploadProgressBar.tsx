import { UploadProgressBarProps } from "@/lib/types";
import { FC } from "react";

export const UploadProgressBar: FC<UploadProgressBarProps> = ({
  uploadProgress,
}) => {
  if (!uploadProgress.length) return null;

  const overallProgress = Math.round(
    uploadProgress.reduce((acc, cur) => acc + cur.progress, 0) /
      uploadProgress.length
  );

  const isInProgress = uploadProgress.some(
    (p) => p.progress > 0 && p.progress < 100
  );

  if (!isInProgress) return null;

  return (
    <div className="mt-4">
      <p className="text-sm font-medium text-gray-700">
        Overall Upload Progress
      </p>
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div
          className="bg-primary h-3 rounded-full"
          style={{ width: `${overallProgress}%` }}
        ></div>
      </div>
      <p className="text-xs text-gray-500 mt-1">{overallProgress}% complete</p>
    </div>
  );
};
