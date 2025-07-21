import { ChangeEvent } from "react";

export type ContentType = "text" | "image" | "mixed" | "code" | "url" | "file";

export interface UploadProgress {
  fileName: string;
  progress: number;
}

export interface ContentTypeSelectProps {
  contentType: ContentType;
  onChange: (value: ContentType) => void;
  language: string;
  onLanguageChange: (value: string) => void;
  isLoading: boolean;
  languages: string[];
  disabledOptions?: string[];
}

export interface TextContentSectionProps {
  textContent: string;
  onChange: (text: string) => void;
  onPasteClick: () => void;
  onClear: () => void;
  isLoading: boolean;
  contentType: ContentType;
}

export interface UploadPreviewProps {
  selectedFiles: File[];
  uploadProgress: UploadProgress[];
  isLoading: boolean;
  onRemove: (index: number) => void;
  onAddMore: () => void;
  type: "image" | "file";
}

export interface UploadProgressBarProps {
  uploadProgress: UploadProgress[];
}

export interface GeneratedPinDisplayProps {
  pin: string;
  onCopy: () => void;
  isCopied: boolean;
}
