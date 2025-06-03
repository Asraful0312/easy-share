/* eslint-disable @typescript-eslint/no-misused-promises */
import { FormEvent, useState } from "react";
import { useAction } from "convex/react";
import { api } from "../convex/_generated/api";
import { Doc } from "../convex/_generated/dataModel";
import { toast } from "sonner";
import { CopyBlock, monokai } from "react-code-blocks";

// Adjusted type to match the action's return type, allowing imageUrls to be array of strings or nulls
type PinDoc = Doc<"pins">;
type RetrievedPinType = (PinDoc & { imageUrls?: (string | null)[] }) | null;

export function AccessPin() {
  const [pinCode, setPinCode] = useState("");
  const [retrievedContent, setRetrievedContent] =
    useState<RetrievedPinType>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPinAction = useAction(api.pins.fetchPinByCode);

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

  console.log(retrievedContent?.content);
  return (
    <div className="bg-white p-6 md:p-8 rounded-lg shadow-xl w-full max-w-2xl mx-auto mt-10">
      <h2 className="text-2xl font-bold text-primary mb-6 text-center">
        Access Your Pin
      </h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
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
            maxLength={6}
            className="w-full px-4 py-3 rounded-md bg-gray-50 border border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-shadow shadow-sm hover:shadow-md text-center tracking-[0.3em]"
            placeholder="●●●●●●"
            disabled={isLoading}
          />
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
            <p className="text-gray-700 whitespace-pre-wrap break-words bg-white p-3 rounded shadow">
              {retrievedContent.content}
            </p>
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
              <div className="space-y-4">
                {retrievedContent.imageUrls.map((imageUrl, index) =>
                  imageUrl ? (
                    <div key={index} className="flex justify-center">
                      <img
                        src={imageUrl}
                        alt={`PIN Content ${index + 1}`}
                        className="max-w-full h-auto max-h-96 rounded-md shadow-lg"
                      />
                    </div>
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
                <div>
                  <h4 className="text-md font-medium text-gray-800 mb-2">
                    Text:
                  </h4>
                  <p className="text-gray-700 whitespace-pre-wrap break-words bg-white p-3 rounded shadow">
                    {retrievedContent.textContent}
                  </p>
                </div>
              )}

              {/* Images part */}
              {retrievedContent.imageUrls &&
                retrievedContent.imageUrls.length > 0 && (
                  <div>
                    <h4 className="text-md font-medium text-gray-800 mb-2">
                      Images ({retrievedContent.imageUrls.length}):
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {retrievedContent.imageUrls.map((imageUrl, index) =>
                        imageUrl ? (
                          <div key={index} className="flex justify-center">
                            <img
                              src={imageUrl}
                              alt={`PIN Image ${index + 1}`}
                              className="max-w-full h-auto max-h-64 rounded-md shadow-lg"
                            />
                          </div>
                        ) : (
                          <p key={index} className="text-gray-500 text-center">
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
