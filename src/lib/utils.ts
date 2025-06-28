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
