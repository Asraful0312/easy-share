import { useState, useEffect, Fragment } from "react";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { toast } from "sonner";
import { CopyBlock, monokai } from "react-code-blocks";

const UserPins = () => {
  const pins = useQuery(api.pins.getUserPins);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedPinId, setExpandedPinId] = useState<string | null>(null);

  useEffect(() => {
    if (pins && pins?.length === 0 && !isLoading) {
      setError("No pins found for this user.");
    } else {
      setError(null);
    }
    setIsLoading(false);
  }, [pins, isLoading]);

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text).then(
      () => toast.success("Text copied to clipboard!"),
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
    window.open(imageUrl, "_blank");
    toast.success(
      `Image ${index + 1} download started and opened in a new tab!`
    );
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
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {pins &&
                pins.length > 0 &&
                pins?.map((pin) => (
                  <Fragment key={pin?._id}>
                    <tr className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-700">
                        {pin?.pinCode}
                      </td>
                      <td className="px-4 py-3 text-gray-700 capitalize">
                        {pin?.type}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {getContentPreview(pin)}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleExpand(pin?._id as string)}
                          className="px-3 py-1 bg-primary text-white rounded-md hover:bg-primary-hover transition-colors"
                        >
                          {expandedPinId === pin?._id ? "Hide" : "View"} Details
                        </button>
                      </td>
                    </tr>
                    {expandedPinId === pin?._id && (
                      <tr>
                        <td colSpan={4} className="px-4 py-4 bg-gray-50">
                          <div className="p-4 border border-gray-200 rounded-md">
                            {/* Text Content */}
                            {pin?.type === "text" && (
                              <div className="relative">
                                <p className="text-gray-700 whitespace-pre-wrap break-words bg-white p-3 rounded shadow">
                                  {pin?.content}
                                </p>
                                <button
                                  onClick={() => handleCopyText(pin?.content)}
                                  className="absolute top-2 right-2 px-3 py-1 bg-primary text-white rounded-md hover:bg-primary-hover transition-colors"
                                >
                                  Copy
                                </button>
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
                                      <div
                                        key={index}
                                        className="flex flex-col items-center"
                                      >
                                        <figure className="relative ">
                                          <img
                                            src={imageUrl}
                                            alt={`PIN Image ${index + 1}`}
                                            className="w-full h-auto rounded-md shadow-lg"
                                          />
                                          <button
                                            onClick={() =>
                                              handleDownloadImage(
                                                imageUrl,
                                                index
                                              )
                                            }
                                            className="absolute top-2 right-2 p-2 bg-primary text-white rounded-md hover:bg-primary-hover transition-colors"
                                          >
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
                                        </figure>
                                      </div>
                                    ) : (
                                      <p key={index} className="text-gray-500">
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
                                  <div className="relative">
                                    <h4 className="text-md font-medium text-gray-800 mb-2">
                                      Text:
                                    </h4>
                                    <p className="text-gray-700 whitespace-pre-wrap break-words bg-white p-3 rounded shadow">
                                      {pin?.textContent}
                                    </p>
                                    <button
                                      onClick={() =>
                                        handleCopyText(
                                          pin?.textContent as string
                                        )
                                      }
                                      className="absolute top-2 right-2 px-3 py-1 bg-primary text-white rounded-md hover:bg-primary-hover transition-colors"
                                    >
                                      Copy
                                    </button>
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
                                              <div
                                                key={index}
                                                className="break-inside-avoid mb-4"
                                              >
                                                <figure className="relative">
                                                  <img
                                                    src={imageUrl}
                                                    alt={`PIN Image ${index + 1}`}
                                                    className="w-full h-auto rounded-md shadow-lg"
                                                  />
                                                  <button
                                                    onClick={() =>
                                                      handleDownloadImage(
                                                        imageUrl,
                                                        index
                                                      )
                                                    }
                                                    className="absolute top-2 right-2 p-2 bg-primary text-white rounded-md hover:bg-primary-hover transition-colors"
                                                  >
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
                                                </figure>
                                              </div>
                                            ) : (
                                              <p
                                                key={index}
                                                className="text-gray-500 text-center mb-4"
                                              >
                                                Image {index + 1} processing or
                                                not found.
                                              </p>
                                            )
                                        )}
                                      </div>
                                    </div>
                                  )}
                              </div>
                            )}

                            {(pin?.type === "image" || pin?.type === "mixed") &&
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
                ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default UserPins;
