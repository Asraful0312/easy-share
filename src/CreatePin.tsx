/* eslint-disable @typescript-eslint/no-misused-promises */
import { FormEvent } from "react";
import { Id } from "../convex/_generated/dataModel";
import { toast } from "sonner";
import { formatBytes, formatExpirationDate, langs } from "./lib/utils";
import { ContentTypeSelect } from "./components/PinFormParts/ContentTypeSelect";
import { TextContentSection } from "./components/PinFormParts/TextContentSection";
import { UploadPreview } from "./components/PinFormParts/UploadPreview";
import { UploadProgressBar } from "./components/PinFormParts/UploadProgressBar";
import { GeneratedPinDisplay } from "./components/PinFormParts/GeneratedPinDisplay";
import { useCreatePin } from "./hooks/useCreatePin";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

export function CreatePin() {
  const {
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
  } = useCreatePin();

  const uploadInfo = useQuery(api.pins.getUserUploadInfo);
  const userData = useQuery(api.polar.getCurrentUser);

  // Define plan limits for client-side validation
  const planLimits = {
    free: {
      allowedTypes: ["text", "image", "code", "url", "mixed", "file"],
    },
    pro: {
      allowedTypes: ["text", "image", "mixed", "code", "url", "file"],
    },
    team: {
      allowedTypes: ["text", "image", "mixed", "code", "url", "file"],
    },
    vip: {
      allowedTypes: ["text", "image", "mixed", "code", "url", "file"],
    },
  };

  const subscriptionPlan = userData?.subscriptionPlan || "free";
  const limits =
    planLimits[subscriptionPlan as "free" | "pro" | "team" | "vip"];

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    // Client-side content type validation
    if (!limits.allowedTypes.includes(contentType)) {
      toast.error(
        `Content type "${contentType}" is not allowed on the ${subscriptionPlan} plan. Please upgrade your plan.`
      );
      return;
    }

    setIsLoading(true);
    setGeneratedPin(null);
    setIsCopied(false);
    setUploadProgress(
      selectedImages.map((file) => ({ fileName: file.name, progress: 0 }))
    );

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
      } else if (contentType === "file") {
        if (selectedImages.length === 0) {
          toast.error("Please provide your file.");
          setIsLoading(false);
          return;
        }

        const file = selectedImages[0];
        const key = `${Date.now()}-${file.name}`;
        const { uploadUrl } = await generateR2UploadUrl({ key });

        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("PUT", uploadUrl.url, true);
          xhr.setRequestHeader(
            "Content-Type",
            file.type || "application/octet-stream"
          );

          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const percent = Math.round((event.loaded / event.total) * 100);
              setUploadProgress([{ fileName: file.name, progress: percent }]);
            }
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve();
            } else {
              reject(
                new Error(
                  `Upload failed: ${xhr.statusText} - ${xhr.responseText}`
                )
              );
            }
          };

          xhr.onerror = () => reject(new Error("R2 network error"));
          xhr.send(file);
        });

        await syncMetadata({ key });

        let retries = 5;
        let content;
        while (retries > 0) {
          try {
            content = await getUploadUrl({ key });
            break;
          } catch (err) {
            if (err instanceof Error && err.message.includes("No file found")) {
              await new Promise((r) =>
                setTimeout(r, 600 * Math.pow(2, 5 - retries))
              );
              retries--;
            } else {
              throw err;
            }
          }
        }

        if (!content) {
          throw new Error("Failed to sync file to database after upload.");
        }

        const metadata = await getMetadata({ key });

        result = await createPinMutation({
          type: "file",
          content: content.url,
          fileType: metadata?.contentType,
          fileKey: key,
          fileSize: metadata?.size,
        });
      }

      if (result) {
        setGeneratedPin(result.pinCode);
        toast.success(`PIN created: ${result.pinCode}`);
        handleCopyText(result.pinCode);
        setTextContent("");
        setSelectedImages([]);
        setLanguage("");
        setUploadProgress([]);
        if (imageInputRef.current) {
          imageInputRef.current.value = "";
        }
      }
    } catch (error) {
      console.error("Error creating pin:", error);
      toast.error("Failed to create PIN: " + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasteClipboard = async () => {
    const clipboardText = await navigator.clipboard.readText();
    setTextContent(clipboardText);
  };

  // Format bytes to human-readable string

  return (
    <div className="bg-white p-6 md:p-8 rounded-lg shadow-xl w-full max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-primary mb-6 text-center">
        Create a New Pin
      </h2>

      {userData && uploadInfo ? (
        <>
          {/* Display Upload Usage and Limits */}
          <div className="mb-6 p-4 bg-gray-100 rounded-md">
            <h3 className="text-lg font-semibold text-gray-700">
              Your Upload Status
            </h3>
            <p className="text-sm text-gray-600">
              Plan:{" "}
              <span className="font-semibold capitalize">
                {uploadInfo.subscriptionPlan}
              </span>
            </p>
            <p className="text-sm text-gray-600">
              Uploaded Today: {formatBytes(uploadInfo.dailyUploadTotal)}
            </p>
            <p className="text-sm text-gray-600">
              Remaining Limit: {formatBytes(uploadInfo.remainingUpload)}
            </p>
            <p className="text-sm text-gray-600">
              Next Reset:{" "}
              {uploadInfo.lastResetTime
                ? formatExpirationDate(
                    uploadInfo.lastResetTime + 24 * 60 * 60 * 1000
                  )
                : "Today"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <ContentTypeSelect
              contentType={contentType}
              onChange={setContentType}
              language={language}
              onLanguageChange={setLanguage}
              isLoading={isLoading}
              languages={langs}
              disabledOptions={subscriptionPlan === "free" ? [] : []}
            />

            {(contentType === "text" ||
              contentType === "mixed" ||
              contentType === "code" ||
              contentType === "url") && (
              <TextContentSection
                textContent={textContent}
                onChange={setTextContent}
                onPasteClick={handlePasteClipboard}
                onClear={() => setTextContent("")}
                isLoading={isLoading}
                contentType={contentType}
              />
            )}

            {(contentType === "image" ||
              contentType === "mixed" ||
              contentType === "file") && (
              <>
                <input
                  type="file"
                  ref={imageInputRef}
                  multiple={contentType !== "file"}
                  accept={contentType === "file" ? undefined : "image/*"}
                  onChange={handleImageSelection}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-light file:text-primary hover:file:bg-primary-hover hover:file:text-white disabled:opacity-50"
                  disabled={isLoading}
                />

                <UploadPreview
                  selectedFiles={selectedImages}
                  uploadProgress={uploadProgress}
                  isLoading={isLoading}
                  onRemove={removeImage}
                  onAddMore={() => imageInputRef.current?.click()}
                  type={contentType === "file" ? "file" : "image"}
                />

                <UploadProgressBar uploadProgress={uploadProgress} />
              </>
            )}

            <button
              type="submit"
              className="w-full px-4 py-3 rounded-md bg-primary text-white font-semibold hover:bg-primary-hover transition-colors shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
              ) : (
                "Create Pin"
              )}
            </button>
          </form>
        </>
      ) : (
        <p className="text-center text-gray-600">
          Please log in to create a pin.
        </p>
      )}

      {generatedPin && (
        <GeneratedPinDisplay
          pin={generatedPin}
          onCopy={() => handleCopyText(generatedPin)}
          isCopied={isCopied}
        />
      )}
    </div>
  );
}
