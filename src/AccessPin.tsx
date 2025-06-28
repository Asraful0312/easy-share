/* eslint-disable @typescript-eslint/no-misused-promises */
import { FormEvent, useEffect, useState } from "react";
import { useAction } from "convex/react";
import { api } from "../convex/_generated/api";
import { Doc } from "../convex/_generated/dataModel";
import { toast } from "sonner";
import { CopyBlock, monokai } from "react-code-blocks";
import { Check, ClipboardList, LinkIcon, X } from "lucide-react";

import FullscreenImage from "./FullScreenImage";

// Adjusted type to match the action's return type, allowing imageUrls to be array of strings or nulls
export type PinDoc = Doc<"pins">;
type RetrievedPinType = (PinDoc & { imageUrls?: (string | null)[] }) | null;

export function AccessPin() {
  const [pinCode, setPinCode] = useState("");
  const [retrievedContent, setRetrievedContent] =
    useState<RetrievedPinType>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [urlArray, setUrlArray] = useState<string[]>([]);

  const fetchPinAction = useAction(api.pins.fetchPinByCode);

  useEffect(() => {
    if (
      retrievedContent &&
      retrievedContent.type === "url" &&
      retrievedContent.content
    ) {
      // Regular expression to match URLs
      const urlRegex = /https?:\/\/[^\s/$.?#].[^\s]*/g;
      const urls = retrievedContent.content.match(urlRegex) || [];
      setUrlArray(urls);
    } else {
      setUrlArray([]);
    }
  }, [retrievedContent]);

  // Handle clipboard paste on input focus
  const handleInputFocus = async () => {
    try {
      // Check if clipboard API is available and has permission
      if (navigator.clipboard && navigator.clipboard.readText) {
        const clipboardText = await navigator.clipboard.readText();
        // Validate clipboard content: must be 6 digits
        if (/^\d{6}$/.test(clipboardText)) {
          setPinCode(clipboardText);
          toast.success("PIN pasted from clipboard!");
        }
      }
    } catch (err) {
      console.error("Failed to read clipboard:", err);
      // Optionally, you can show a toast message for clipboard access errors
      // toast.error("Failed to access clipboard.");
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!pinCode.trim() || pinCode.length !== 6) {
      toast.error("PIN code must be 6 digits.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setRetrievedContent(null);

    try {
      const result: RetrievedPinType = await fetchPinAction({ pinCode });
      if (result) {
        setRetrievedContent(result);
        toast.success("Content retrieved!");
      } else {
        setError("Invalid PIN or content not found.");
        toast.error("Invalid PIN or content not found.");
      }
    } catch (err) {
      console.error("Error accessing pin:", err);
      setError("Failed to access PIN. Please try again.");
      toast.error("Failed to access PIN. " + (err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        toast.success("Text copied to clipboard!");
        setIsCopied(true);
      },
      () => toast.error("Failed to copy text.")
    );
  };

  const handleDownloadImage = (imageUrl: string, index: number) => {
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `pin-image-${index + 1}.jpg`;
    document.body.appendChild(link);
    link.target = "_blank";
    link.click();
    document.body.removeChild(link);
    toast.success(`Image ${index + 1} download started!`);
  };

  console.log(retrievedContent);

  return (
    <div className="bg-white p-6 md:p-8 rounded-lg shadow-xl w-full max-w-2xl mx-auto mt-10">
      <h2 className="text-2xl font-bold text-primary mb-6 text-center">
        Access Your Pin
      </h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="relative">
          <label
            htmlFor="pinCode"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Enter 6-digit PIN
          </label>
          <input
            type="text"
            id="pinCode"
            value={pinCode}
            onChange={(e) =>
              setPinCode(e.target.value.replace(/\D/g, "").slice(0, 6))
            }
            onFocus={handleInputFocus} // Add onFocus handler
            maxLength={6}
            className="w-full px-4 py-3 rounded-md bg-gray-50 border border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-shadow shadow-sm hover:shadow-md text-center tracking-[0.3em]"
            placeholder="●●●●●●"
            disabled={isLoading}
          />
          {pinCode && (
            <button
              type="button"
              onClick={() => setPinCode("")}
              className="absolute right-2 top-[47%]"
            >
              <X className="size-6 text-red-500" />
            </button>
          )}
        </div>
        <button
          type="submit"
          className="w-full px-4 py-3 rounded-md bg-primary text-white font-semibold hover:bg-primary-hover transition-colors shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          disabled={isLoading || pinCode.length !== 6}
        >
          {isLoading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          ) : (
            "Access Content"
          )}
        </button>
      </form>

      {error && (
        <div className="mt-6 p-3 bg-red-50 border border-red-300 rounded-md text-center">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {retrievedContent && (
        <div className="mt-8 p-4 border border-gray-200 rounded-md bg-gray-50">
          <h3 className="text-lg font-semibold text-primary mb-3">
            Retrieved Content:
          </h3>

          {/* Text Content */}
          {retrievedContent.type === "text" && (
            <div className="relative bg-white p-4">
              <p className="text-gray-700 whitespace-pre-wrap break-words  rounded ">
                {retrievedContent.content}
              </p>
              <button
                onClick={() => handleCopyText(retrievedContent?.content)}
                className="absolute top-[5%] right-2 px-1 py-1 bg-primary text-white rounded-md hover:bg-primary-hover transition-colors mb-4"
              >
                {isCopied ? (
                  <Check className="text-white size-4 shrink-0" />
                ) : (
                  <ClipboardList className="text-white size-4 shrink-0" />
                )}
              </button>
            </div>
          )}

          {/* URL Content */}
          {retrievedContent.type === "url" && (
            <div className="relative bg-white p-4">
              <p className="text-gray-700 whitespace-pre-wrap break-words rounded">
                {retrievedContent.content}
              </p>
              <button
                onClick={() => handleCopyText(retrievedContent.content)}
                className="absolute top-[5%] right-2 px-1 py-1 bg-primary text-white rounded-md hover:bg-primary-hover transition-colors mb-4"
              >
                {isCopied ? (
                  <Check className="text-white size-4 shrink-0" />
                ) : (
                  <ClipboardList className="text-white size-4 shrink-0" />
                )}
              </button>
              {urlArray.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-md font-medium text-gray-800 mb-2">
                    URL Previews ({urlArray.length}):
                  </h4>
                  <div className="space-y-2">
                    {urlArray.map((url, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <LinkIcon className="size-4 text-primary" />
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline break-all"
                        >
                          {url}
                        </a>
                      </div>
                    ))}

                    {urlArray.map((url, index) => (
                      <div key={index} className="mt-2">
                        <iframe
                          src={url}
                          title={`Preview ${index + 1}`}
                          className="w-full h-64 border border-gray-300 rounded-md"
                          sandbox="allow-scripts allow-same-origin"
                          loading="lazy"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {retrievedContent.type === "code" && (
            <CopyBlock
              language={retrievedContent.language as string}
              text={retrievedContent.content}
              theme={monokai}
              codeBlock
              highlight=""
            />
          )}

          {/* Single Image Content */}
          {retrievedContent.type === "image" &&
            retrievedContent.imageUrls &&
            retrievedContent.imageUrls.length > 0 && (
              <div className="space-y-4 columns-1 sm:columns-2 md:columns-3 gap-2">
                {retrievedContent.imageUrls.map((imageUrl, index) =>
                  imageUrl ? (
                    <FullscreenImage
                      key={index}
                      src={imageUrl}
                      index={index}
                      onDownload={handleDownloadImage}
                    />
                  ) : (
                    <p key={index} className="text-gray-500">
                      Image {index + 1} processing or not found.
                    </p>
                  )
                )}
              </div>
            )}

          {/* Mixed Content */}
          {retrievedContent.type === "mixed" && (
            <div className="space-y-4">
              {/* Text part */}
              {retrievedContent.textContent && (
                <div className="relative bg-white p-4">
                  <p className="text-gray-700 whitespace-pre-wrap break-words rounded ">
                    {retrievedContent.textContent}
                  </p>
                  <button
                    onClick={() =>
                      handleCopyText(retrievedContent?.textContent as string)
                    }
                    className="absolute top-[6%] right-2 px-1 py-1 bg-primary text-white rounded-md hover:bg-primary-hover transition-colors mb-4"
                  >
                    {isCopied ? (
                      <Check className="text-white size-4 shrink-0" />
                    ) : (
                      <ClipboardList className="text-white size-4 shrink-0" />
                    )}
                  </button>
                </div>
              )}

              {/* Images part */}
              {retrievedContent.imageUrls &&
                retrievedContent.imageUrls.length > 0 && (
                  <div>
                    <h4 className="text-md font-medium text-gray-800 mb-2">
                      Images ({retrievedContent.imageUrls.length}):
                    </h4>
                    <div
                      className="columns-1 sm:columns-2 md:columns-3 gap-2"
                      style={{ columnFill: "balance" }}
                    >
                      {retrievedContent.imageUrls.map((imageUrl, index) =>
                        imageUrl ? (
                          <FullscreenImage
                            key={index}
                            src={imageUrl}
                            index={index}
                            onDownload={handleDownloadImage}
                          />
                        ) : (
                          <p
                            key={index}
                            className="text-gray-500 text-center mb-4"
                          >
                            Image {index + 1} processing or not found.
                          </p>
                        )
                      )}
                    </div>
                  </div>
                )}
            </div>
          )}

          {/* Fallback for image types with no URLs */}
          {(retrievedContent.type === "image" ||
            retrievedContent.type === "mixed") &&
            (!retrievedContent.imageUrls ||
              retrievedContent.imageUrls.length === 0) && (
              <p className="text-gray-500">
                No images found or still processing.
              </p>
            )}
        </div>
      )}
    </div>
  );
}
