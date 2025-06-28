/* eslint-disable @typescript-eslint/no-misused-promises */
import { FormEvent, useRef, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { toast } from "sonner";
import { langs } from "./lib/utils";
import { Check, ClipboardList } from "lucide-react";

export function CreatePin() {
  const [contentType, setContentType] = useState<
    "text" | "image" | "mixed" | "code" | "url"
  >("text");
  const [textContent, setTextContent] = useState("");
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [generatedPin, setGeneratedPin] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState("");
  const [isCopied, setIsCopied] = useState(false);

  const generateUploadUrl = useMutation(api.pins.generateUploadUrl);
  const createPinMutation = useMutation(api.pins.createPin);

  const handleImageSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const fileArray = Array.from(files);
      const newTotal = selectedImages.length + fileArray.length;
      if (newTotal > 10) {
        toast.error(
          `Cannot add ${fileArray.length} images. Maximum 10 images allowed (currently have ${selectedImages.length}).`
        );
        return;
      }
      setSelectedImages((prev) => [...prev, ...fileArray]);
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async (images: File[]): Promise<Id<"_storage">[]> => {
    const uploadPromises = images.map(async (image) => {
      const postUrl = await generateUploadUrl();
      const uploadResult = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": image.type },
        body: image,
      });

      if (!uploadResult.ok) {
        const errorJson = await uploadResult.json();
        throw new Error(
          `Upload failed for ${image.name}: ${JSON.stringify(errorJson)}`
        );
      }
      const { storageId } = (await uploadResult.json()) as {
        storageId: Id<"_storage">;
      };
      return storageId;
    });

    return await Promise.all(uploadPromises);
  };

  const handleCopyText = (text: string) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(
        () => {
          toast.success(`Copied PIN ${text} to clipboard!`);
          setIsCopied(true);
        },
        () => {
          toast.error("Failed to copy PIN to clipboard. Please copy manually.");
        }
      );
    } else {
      toast.warning(
        "Clipboard API not available. Please copy the PIN manually."
      );
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setGeneratedPin(null);
    setIsCopied(false);

    try {
      let result;
      if (contentType === "text") {
        if (!textContent.trim()) {
          toast.error("Text content cannot be empty.");
          setIsLoading(false);
          return;
        }
        result = await createPinMutation({
          type: "text",
          content: textContent,
        });
      } else if (contentType === "url") {
        if (!textContent.trim()) {
          toast.error("Text content cannot be empty.");
          setIsLoading(false);
          return;
        }
        result = await createPinMutation({
          type: "url",
          content: textContent,
        });
      } else if (contentType === "image") {
        if (selectedImages.length === 0) {
          toast.error("Please select at least one image.");
          setIsLoading(false);
          return;
        }
        const imageIds = await uploadImages(selectedImages);
        result = await createPinMutation({
          type: "image",
          imageIds: imageIds,
        });
      } else if (contentType === "mixed") {
        if (!textContent.trim() && selectedImages.length === 0) {
          toast.error("Please provide either text content or images.");
          setIsLoading(false);
          return;
        }
        let imageIds: Id<"_storage">[] = [];
        if (selectedImages.length > 0) {
          imageIds = await uploadImages(selectedImages);
        }
        result = await createPinMutation({
          type: "mixed",
          content: textContent,
          imageIds: imageIds,
        });
      } else if (contentType === "code") {
        if (!textContent.trim() && !language) {
          toast.error("Please provide a code language.");
          setIsLoading(false);
          return;
        }
        result = await createPinMutation({
          type: "code",
          content: textContent,
          language,
        });
      }

      if (result) {
        setGeneratedPin(result.pinCode);
        toast.success(`PIN created: ${result.pinCode}`);
        // Copy PIN to clipboard immediately after generation
        handleCopyText(result.pinCode);
        // Reset form fields
        setTextContent("");
        setSelectedImages([]);
        setLanguage("");
        if (imageInputRef.current) {
          imageInputRef.current.value = "";
        }
      }
    } catch (error) {
      console.error("Error creating pin:", error);
      toast.error("Failed to create PIN. " + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const pasteCopiedText = async () => {
    if (navigator.clipboard && navigator.clipboard.readText) {
      const clipboardText = await navigator.clipboard.readText();
      setTextContent(clipboardText);
    }
  };

  return (
    <div className="bg-white p-6 md:p-8 rounded-lg shadow-xl w-full max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-primary mb-6 text-center">
        Create a New Pin
      </h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Content Type
          </label>
          <select
            value={contentType}
            onChange={(e) =>
              setContentType(
                e.target.value as "text" | "image" | "mixed" | "code" | "url"
              )
            }
            className="w-full px-4 py-3 rounded-md bg-gray-50 border border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-shadow shadow-sm hover:shadow-md"
            disabled={isLoading}
          >
            <option value="text">Text Only</option>
            <option value="image">Images Only</option>
            <option value="mixed">Text + Images</option>
            <option value="code">Code</option>
            <option value="url">Url</option>
          </select>
          {contentType === "code" && (
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-4 py-3 my-4 rounded-md bg-gray-50 border border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-shadow shadow-sm hover:shadow-md"
              disabled={isLoading}
            >
              {langs.map((lan) => (
                <option key={lan} value={lan}>
                  {lan}
                </option>
              ))}
            </select>
          )}
        </div>

        {(contentType === "text" ||
          contentType === "mixed" ||
          contentType === "code" ||
          contentType === "url") && (
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
                onClick={pasteCopiedText}
                className="font-semibold text-primary"
              >
                Click to paste
              </button>
            </div>
            <textarea
              id="textContent"
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 rounded-md bg-gray-50 border border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-shadow shadow-sm hover:shadow-md"
              placeholder="Enter your text here..."
              disabled={isLoading}
            />
            {textContent && (
              <div className="flex items-center justify-end">
                <button
                  onClick={() => setTextContent("")}
                  className="py-2 px-3 rounded bg-red-500 text-white font-medium text-sm"
                >
                  Clear
                </button>
              </div>
            )}
          </div>
        )}

        {(contentType === "image" || contentType === "mixed") && (
          <div>
            <label
              htmlFor="imageUpload"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Images (Max 10)
            </label>
            <p className="text-xs text-gray-500 mb-2">
              💡 Hold Ctrl (or Cmd on Mac) to select multiple images at once
            </p>
            <input
              type="file"
              id="imageUpload"
              accept="image/*"
              multiple
              ref={imageInputRef}
              onChange={handleImageSelection}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-light file:text-primary hover:file:bg-primary-hover hover:file:text-white disabled:opacity-50"
              disabled={isLoading}
            />
            {selectedImages.length > 0 && (
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    Selected images ({selectedImages.length}/10):
                  </p>
                  {selectedImages.length < 10 && (
                    <button
                      type="button"
                      onClick={() => imageInputRef.current?.click()}
                      className="text-xs px-2 py-1 bg-primary-light text-primary rounded hover:bg-primary hover:text-white transition-colors"
                      disabled={isLoading}
                    >
                      + Add More
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                  {selectedImages.map((image, index) => (
                    <div
                      key={index}
                      className="relative bg-gray-100 p-2 rounded-md"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600 truncate flex-1">
                          {image.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="ml-2 text-red-500 hover:text-red-700 text-sm font-bold"
                          disabled={isLoading}
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <button
          type="submit"
          className="w-full px-4 py-3 rounded-md bg-primary text-white font-semibold hover:bg-primary-hover transition-colors shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          disabled={
            isLoading ||
            (contentType === "text" && !textContent.trim()) ||
            (contentType === "image" && selectedImages.length === 0) ||
            (contentType === "mixed" &&
              !textContent.trim() &&
              selectedImages.length === 0) ||
            (contentType === "code" && !textContent.trim() && !language)
          }
        >
          {isLoading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          ) : (
            "Create Pin"
          )}
        </button>
      </form>

      {generatedPin && (
        <div className="mt-8 p-4 bg-green-50 border border-green-300 rounded-md text-center relative">
          <p className="text-sm text-green-700">Your PIN is:</p>
          <p className="text-3xl font-bold text-green-800 tracking-wider">
            {generatedPin}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Use this PIN to access your content from another device.
          </p>
          <button
            onClick={() => handleCopyText(generatedPin)}
            className="absolute right-2 top-2 px-1 py-1 bg-green-500/70 text-white rounded-md mb-4"
          >
            {isCopied ? (
              <Check className="text-white size-4 shrink-0" />
            ) : (
              <ClipboardList className="text-white size-4 shrink-0" />
            )}
          </button>
        </div>
      )}
    </div>
  );
}
