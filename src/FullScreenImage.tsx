/* eslint-disable @typescript-eslint/no-misused-promises */
import { useFullscreen } from "@mantine/hooks";
import { Expand } from "lucide-react";

type FullscreenImageProps = {
  src: string;
  index: number;
  onDownload: (src: string, index: number) => void;
  className?: string;
};

export default function FullscreenImage({
  src,
  index,
  onDownload,
  className,
}: FullscreenImageProps) {
  const { ref, toggle } = useFullscreen();

  return (
    <div
      className={
        className
          ? className
          : "break-inside-avoid mb-4 border border-primary shadow rounded-md"
      }
    >
      <figure className="relative">
        <img
          ref={ref}
          src={src}
          alt={`PIN Image ${index + 1}`}
          className="w-full h-auto rounded-md shadow-lg"
        />
        <button
          onClick={() => onDownload(src, index)}
          className="absolute top-2 right-2 p-2 bg-primary text-white rounded-md hover:bg-primary-hover transition-colors"
        >
          {/* Download Icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
        </button>
        <button
          onClick={toggle}
          className="absolute top-2 right-12 p-2 bg-primary text-white rounded-md hover:bg-primary-hover transition-colors"
        >
          <Expand className="size-4 shrink-0" />
        </button>
      </figure>
    </div>
  );
}
