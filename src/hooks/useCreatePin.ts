import { useState, useRef } from "react";
import { toast } from "sonner";
import { useMutation, useAction, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

export function useCreatePin() {
  const [contentType, setContentType] = useState<
    "text" | "image" | "mixed" | "code" | "url" | "file"
  >("text");
  const [textContent, setTextContent] = useState("");
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<
    { fileName: string; progress: number }[]
  >([]);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [generatedPin, setGeneratedPin] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const abortControllers = useRef<AbortController[]>([]);

  const userData = useQuery(api.polar.getCurrentUser);
  const syncMetadata = useMutation(api.files.syncMetadata);
  const getUploadUrl = useAction(api.files.uploadUrlAction);
  const generateUploadUrl = useMutation(api.pins.generateUploadUrl);
  const generateR2UploadUrl = useAction(api.files.getR2UploadUrl);
  const createPinMutation = useMutation(api.pins.createPin);
  const getMetadata = useAction(api.pins.getMetadataAction);

  // Define plan limits for client-side validation
  const planLimits = {
    free: {
      maxFileSize: 100 * 1024 * 1024, // 50MB
      allowedTypes: ["text", "image", "code", "url", "mixed", "file"],
    },
    pro: {
      maxFileSize: 1 * 1024 * 1024 * 1024, // 1GB
      allowedTypes: ["text", "image", "mixed", "code", "url", "file"],
    },
    team: {
      maxFileSize: 5 * 1024 * 1024 * 1024, // 5GB
      allowedTypes: ["text", "image", "mixed", "code", "url", "file"],
    },
    vip: {
      maxFileSize: 5 * 1024 * 1024 * 1024, // 5GB
      allowedTypes: ["text", "image", "mixed", "code", "url", "file"],
    },
  };

  const subscriptionPlan = userData?.subscriptionPlan || "free";
  const limits =
    planLimits[subscriptionPlan as "pro" | "team" | "free" | "vip"];

  const handleImageSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const fileArray = Array.from(files);
      const validFiles: File[] = [];

      for (const file of fileArray) {
        if (file.size > limits.maxFileSize) {
          toast.error(
            `File "${file.name}" exceeds ${limits.maxFileSize / (1024 * 1024)}MB limit for the ${subscriptionPlan} plan.`
          );
          continue;
        }
        validFiles.push(file);
      }

      const newTotal = selectedImages.length + validFiles.length;
      if (newTotal > 10) {
        toast.error(
          `Cannot add ${validFiles.length} files. Maximum 10 files allowed (currently have ${selectedImages.length}).`
        );
        return;
      }

      setSelectedImages((prev) => [...prev, ...validFiles]);
      setUploadProgress((prev) => [
        ...prev,
        ...validFiles.map((file) => ({ fileName: file.name, progress: 0 })),
      ]);
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
    setUploadProgress((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCopyText = (text: string) => {
    if (!navigator.clipboard) return;

    navigator.clipboard.writeText(text).then(
      () => {
        toast.success(`Copied ${text} to clipboard`);
        setIsCopied(true);
      },
      () => {
        toast.error("Failed to copy PIN to clipboard.");
      }
    );
  };

  const uploadImages = async (images: File[]): Promise<Id<"_storage">[]> => {
    const uploadPromises = images.map(async (image, index) => {
      const postUrl = await generateUploadUrl();
      return new Promise<Id<"_storage">>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", postUrl, true);
        xhr.setRequestHeader(
          "Content-Type",
          image.type || "application/octet-stream"
        );

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round(
              (event.loaded / event.total) * 100
            );
            setUploadProgress((prev) =>
              prev.map((p, i) =>
                i === index ? { ...p, progress: percentComplete } : p
              )
            );
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const response = JSON.parse(xhr.responseText) as {
              storageId: Id<"_storage">;
            };
            resolve(response.storageId);
          } else {
            const error = JSON.parse(xhr.responseText);
            reject(
              new Error(
                `Upload failed for ${image.name}: ${JSON.stringify(error)}`
              )
            );
            setUploadError(error);
          }
        };

        xhr.onerror = () => {
          reject(new Error(`Network error during upload of ${image.name}`));
        };

        xhr.send(image);
      });
    });

    return await Promise.all(uploadPromises);
  };

  const cancelUpload = (index: number) => {
    const controller = abortControllers.current[index];
    if (controller) {
      controller.abort();
    }
  };

  const resetForm = () => {
    setTextContent("");
    setSelectedImages([]);
    setLanguage("");
    setUploadProgress([]);
    setGeneratedPin(null);
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  const overallProgress =
    uploadProgress.length > 0
      ? Math.round(
          uploadProgress.reduce((sum, p) => sum + p.progress, 0) /
            uploadProgress.length
        )
      : 0;

  return {
    contentType,
    setContentType,
    textContent,
    setTextContent,
    selectedImages,
    setSelectedImages,
    uploadProgress,
    setUploadProgress,
    imageInputRef,
    generatedPin,
    setGeneratedPin,
    isLoading,
    setIsLoading,
    language,
    setLanguage,
    isCopied,
    setIsCopied,
    handleImageSelection,
    removeImage,
    handleCopyText,
    uploadImages,
    syncMetadata,
    getUploadUrl,
    getMetadata,
    createPinMutation,
    generateR2UploadUrl,
    resetForm,
    overallProgress,
    uploadError,
    cancelUpload,
  };
}
