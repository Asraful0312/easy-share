import { clsx, type ClassValue } from "clsx";
import { toast } from "sonner";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const langs = [
  "javascript",
  "jsx",
  "html",
  "java",
  "python",
  "php",
  "ruby",
  "rust",
  "tsx",
  "swift",
  "sql",
  "scala",
  "r",
  "ocmal",
  "objectivec",
  "matlab",
  "makefile",
  "lisp",
  "julia",
  "haskell",
  "go",
  "graphql",
  "csharp",
  "c",
  "bash",
];

export const handleCopyText = (text: string) => {
  navigator.clipboard.writeText(text).then(
    () => toast.success("Text copied to clipboard!"),
    () => toast.error("Failed to copy text.")
  );
};

export const formatBytes = (bytes: number) => {
  if (bytes === 0) return "0 MB";
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(2)} MB`;
};

// Format expiration date to readable string
export const formatExpirationDate = (timestamp: number) => {
  const date = new Date(timestamp);
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });
};
