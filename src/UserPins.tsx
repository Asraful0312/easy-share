/* eslint-disable @typescript-eslint/no-misused-promises */
import { useState, useEffect, Fragment } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { toast } from "sonner";
import { CopyBlock, monokai } from "react-code-blocks";

import FullscreenImage from "./FullScreenImage";
import {
  CheckCheckIcon,
  Clipboard,
  Eye,
  EyeClosed,
  LinkIcon,
  Trash2,
} from "lucide-react";

import { Id } from "../convex/_generated/dataModel";
import { formatExpirationDate } from "./lib/utils";
import PreviewContext from "./components/PreviewContext";

const UserPins = () => {
  const pins = useQuery(api.pins.getUserPins);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedPinId, setExpandedPinId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const deletePin = useMutation(api.pins.deletePin);
  const [copiedText, setCopiedText] = useState("");

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text).then(
      () => toast.success("Text copied successfully."),
      () => toast.error("Failed to copy text.")
    );
    setCopiedText(text);
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      setCopiedText("");
    }, 2000);

    return () => clearTimeout(timeout);
  }, [copiedText]);

  useEffect(() => {
    if (pins && pins?.length === 0 && !isLoading) {
      setError("No pins found for this user.");
    } else {
      setError(null);
    }
    setIsLoading(false);
  }, [pins, isLoading]);

  const handleDownloadImage = async (imageUrl: string, index: number) => {
    try {
      const response = await fetch(imageUrl, { mode: "cors" }); // 'cors' ensures cross-origin fetching
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `pin-image-${index + 1}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up
      URL.revokeObjectURL(url);

      toast.success(`Image ${index + 1} download started!`);
    } catch (error) {
      console.error("Failed to download image", error);
      toast.error("Failed to download image");
    }
  };

  const toggleExpand = (pinId: string) => {
    setExpandedPinId(expandedPinId === pinId ? null : pinId);
  };

  const getContentPreview = (pin: any) => {
    if (!pin) return "N/A";
    if (pin?.type === "text") {
      return pin?.content.length > 50
        ? `${pin?.content.slice(0, 50)}...`
        : pin?.content;
    }
    if (pin?.type === "url") {
      return pin?.content.length > 50
        ? `${pin?.content.slice(0, 50)}...`
        : pin?.content;
    }
    if (pin?.type === "code") {
      return pin?.content.length > 50
        ? `${pin?.content.slice(0, 50)}...`
        : pin?.content;
    }
    if (pin?.type === "image") {
      return `${pin?.imageUrls?.length || 0} image${pin?.imageUrls?.length === 1 ? "" : "s"}`;
    }
    if (pin?.type === "mixed") {
      const textPreview = pin?.textContent
        ? pin?.textContent.length > 30
          ? `${pin?.textContent.slice(0, 30)}...`
          : pin?.textContent
        : "No text";
      return `${textPreview} | ${pin?.imageUrls?.length || 0} image${pin?.imageUrls?.length === 1 ? "" : "s"}`;
    }
    return "N/A";
  };

  const handlePinDelete = async (
    pinId: Id<"pins">,
    imageIds: Id<"_storage">[],
    key: string | null
  ) => {
    if (confirm("Are you sure you want to delete this pin?")) {
      try {
        setIsDeleting(true);
        if (key) {
          await deletePin({ pinId, imageIds, key: key });
        } else {
          await deletePin({ pinId, imageIds });
        }

        setIsDeleting(false);
      } catch {
        setIsDeleting(false);
        toast.error("Failed to delete pin");
      }
    }
  };

  const handleDownloadFile = async (
    fileUrl: string,
    fileType: string,
    index: number
  ) => {
    try {
      const response = await fetch(fileUrl, { mode: "cors" });
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      const extension = fileType?.split("/")[1]?.toLowerCase() || "file";
      link.href = url;
      link.download = `pin-file-${index + 1}.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);

      toast.success(`File download started!`);
    } catch (error) {
      console.error("Failed to download file", error);
      toast.error("Failed to download file");
    }
  };

  return (
    <div className="bg-white p-6 md:p-8 rounded-lg shadow-xl w-full max-w-2xl mx-auto mt-10">
      <h2 className="text-2xl font-bold text-primary mb-6 text-center">
        Your Pins
      </h2>

      {isLoading && (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}

      {error && (
        <div className="mt-6 p-3 bg-red-50 border border-red-300 rounded-md text-center">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {pins && pins?.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                  Pin Code
                </th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                  Type
                </th>

                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                  Content Preview
                </th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                  Expire Date
                </th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="w-full">
              {pins &&
                pins.length > 0 &&
                pins?.map((pin) => {
                  const urlRegex = /https?:\/\/[^\s/$.?#].[^\s]*/g;
                  const urls =
                    (pin?.type === "url" && pin?.content.match(urlRegex)) || [];
                  return (
                    <Fragment key={pin?._id}>
                      <tr className="border-b border-gray-200 hover:bg-gray-50">
                        <td
                          onClick={() => handleCopyText(pin?.pinCode as string)}
                          className="px-4 py-3 text-gray-700 cursor-pointer font-semibold"
                        >
                          {copiedText === pin?.pinCode
                            ? "Copied!"
                            : pin?.pinCode}
                        </td>
                        <td className="px-4 py-3 text-gray-700 capitalize">
                          {pin?.type === "file" ? pin?.fileType : pin?.type}
                        </td>

                        <td className="px-4 py-3 text-gray-700">
                          {getContentPreview(pin)}
                        </td>
                        <td className="px-4 py-3 text-gray-700 cursor-pointer text-sm">
                          {pin?.expirationDate
                            ? formatExpirationDate(pin.expirationDate)
                            : "N/A"}
                        </td>
                        <td className="px-4 py-3 flex items-center">
                          <button
                            onClick={() => toggleExpand(pin?._id as string)}
                            className="text-primary"
                          >
                            {expandedPinId === pin?._id ? (
                              <EyeClosed className="size-5 shrink-0" />
                            ) : (
                              <Eye className="shrink-0 size-5" />
                            )}
                          </button>

                          <button
                            onClick={async () => {
                              await handlePinDelete(
                                pin?._id as Id<"pins">,
                                pin?.imageIds as Id<"_storage">[],
                                pin?.fileKey ? pin.fileKey : null
                              );
                            }}
                            disabled={isDeleting}
                            className="ml-5 disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            <Trash2 className="size-5 shrink-0 text-red-500" />
                          </button>
                        </td>
                      </tr>
                      {expandedPinId === pin?._id && (
                        <tr className="w-full">
                          <td
                            colSpan={5}
                            className="px-4 py-4 bg-gray-50 w-full"
                          >
                            <div className="rounded-md w-full">
                              {/* Text Content */}
                              {pin?.type === "text" && (
                                <div className="bg-white p-3 relative w-full">
                                  <p className="text-gray-700 whitespace-pre-wrap break-words  flex-1 w-full">
                                    {pin?.content}
                                  </p>
                                  <button
                                    onClick={() => handleCopyText(pin?.content)}
                                    className="absolute right-2 top-2  p-1 bg-primary text-white rounded-md hover:bg-primary-hover transition-colors"
                                  >
                                    {copiedText === pin.content ? (
                                      <CheckCheckIcon className="size-4 shrink-0" />
                                    ) : (
                                      <Clipboard className="size-4 shrink-0" />
                                    )}
                                  </button>
                                </div>
                              )}

                              {pin.type === "url" && (
                                <div className="relative bg-white p-4">
                                  <p className="text-gray-700 whitespace-pre-wrap break-words rounded">
                                    {pin.content}
                                  </p>
                                  <button
                                    onClick={() => handleCopyText(pin.content)}
                                    className="absolute top-[5%] right-2 px-1 py-1 bg-primary text-white rounded-md hover:bg-primary-hover transition-colors mb-4"
                                  >
                                    {copiedText === pin.content ? (
                                      <CheckCheckIcon className="size-4 shrink-0" />
                                    ) : (
                                      <Clipboard className="size-4 shrink-0" />
                                    )}
                                  </button>
                                  {urls.length > 0 && (
                                    <div className="mt-4">
                                      <h4 className="text-md font-medium text-gray-800 mb-2">
                                        URL Previews ({urls.length}):
                                      </h4>
                                      <div className="space-y-2">
                                        {urls.map((url, index) => (
                                          <div
                                            key={index}
                                            className="flex items-center space-x-2"
                                          >
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

                                        {urls.map((url, index) => (
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

                              {/* Code Content */}
                              {pin?.type === "code" && (
                                <CopyBlock
                                  language={pin?.language as string}
                                  text={pin?.content}
                                  theme={monokai}
                                  codeBlock
                                  highlight=""
                                />
                              )}

                              {/* Image Content */}
                              {pin?.type === "image" &&
                                pin?.imageUrls &&
                                pin?.imageUrls.length > 0 && (
                                  <div className="space-y-4">
                                    {pin?.imageUrls.map((imageUrl, index) =>
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
                                          className="text-gray-500"
                                        >
                                          Image {index + 1} processing or not
                                          found.
                                        </p>
                                      )
                                    )}
                                  </div>
                                )}

                              {/* Mixed Content */}
                              {pin?.type === "mixed" && (
                                <div className="space-y-4">
                                  {pin?.textContent && (
                                    <div className="">
                                      <h4 className="text-md font-medium text-gray-800 mb-2">
                                        Text:
                                      </h4>
                                      <div className="bg-white p-3 relative">
                                        <p className="text-gray-700 whitespace-pre-wrap break-words  flex-1">
                                          {pin?.textContent}
                                        </p>
                                        <button
                                          onClick={() =>
                                            handleCopyText(
                                              pin?.textContent as string
                                            )
                                          }
                                          className="absolute right-2 top-2  p-1 bg-primary text-white rounded-md hover:bg-primary-hover transition-colors"
                                        >
                                          {copiedText === pin.textContent ? (
                                            <CheckCheckIcon className="size-4 shrink-0" />
                                          ) : (
                                            <Clipboard className="size-4 shrink-0" />
                                          )}
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                  {pin?.imageUrls &&
                                    pin?.imageUrls.length > 0 && (
                                      <div>
                                        <h4 className="text-md font-medium text-gray-800 mb-2">
                                          Images ({pin?.imageUrls.length}):
                                        </h4>
                                        <div
                                          className="columns-1 sm:columns-2 md:columns-3 gap-4"
                                          style={{ columnFill: "balance" }}
                                        >
                                          {pin?.imageUrls.map(
                                            (imageUrl, index) =>
                                              imageUrl ? (
                                                <FullscreenImage
                                                  key={index}
                                                  src={imageUrl}
                                                  index={index}
                                                  onDownload={
                                                    handleDownloadImage
                                                  }
                                                  className="break-inside-avoid mb-4"
                                                />
                                              ) : (
                                                <p
                                                  key={index}
                                                  className="text-gray-500 text-center mb-4"
                                                >
                                                  Image {index + 1} processing
                                                  or not found.
                                                </p>
                                              )
                                          )}
                                        </div>
                                      </div>
                                    )}
                                </div>
                              )}

                              {/* File content */}
                              {pin?.type === "file" && (
                                <>
                                  <PreviewContext
                                    url={pin.content}
                                    contentType={pin.fileType as string}
                                    handleDownloadImage={handleDownloadImage}
                                  />

                                  <div
                                    className="bg-white p-3 relative w-full mt-4
                                  "
                                  >
                                    <p className="text-gray-700 truncate flex-1">
                                      {pin?.content.substring(0, 50)}...
                                    </p>
                                    <button
                                      onClick={() =>
                                        handleCopyText(pin?.content)
                                      }
                                      className="absolute right-2 top-2 p-1 bg-primary text-white rounded-md hover:bg-primary-hover transition-colors"
                                    >
                                      {copiedText === pin.content ? (
                                        <CheckCheckIcon className="size-4 shrink-0" />
                                      ) : (
                                        <Clipboard className="size-4 shrink-0" />
                                      )}
                                    </button>
                                  </div>

                                  <button
                                    onClick={() =>
                                      handleDownloadFile(
                                        pin?.content,
                                        pin?.fileType as string,
                                        pins?.indexOf(pin)
                                      )
                                    }
                                    className="w-full px-4 py-2 mt-3 rounded-md bg-primary text-white font-semibold hover:bg-primary-hover transition-colors shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                                  >
                                    Download
                                  </button>
                                  <p className="text-xs text-red-600 font-bold">
                                    Note: If the download button does not work
                                    copy the file link and open it to a new
                                    browser tab.
                                  </p>
                                </>
                              )}

                              {(pin?.type === "image" ||
                                pin?.type === "mixed") &&
                                (!pin?.imageUrls ||
                                  pin?.imageUrls.length === 0) && (
                                  <p className="text-gray-500">
                                    No images found or still processing.
                                  </p>
                                )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default UserPins;
