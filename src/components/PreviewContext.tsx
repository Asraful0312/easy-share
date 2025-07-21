import FullscreenImage from "@/FullScreenImage";

type Props = {
  contentType: string;
  url: string;
  handleDownloadImage?: (imageUrl: string, index: number) => void;
};

const PreviewContext = ({ contentType, url, handleDownloadImage }: Props) => {
  return (
    <>
      {contentType.includes("video") && (
        <video controls>
          <source src={url} />
          Your browser does not support the audio element.
        </video>
      )}
      {contentType.includes("audio") && (
        <audio controls className="w-full">
          <source src={url} />
          Your browser does not support the audio element.
        </audio>
      )}
      {contentType.includes("image") && handleDownloadImage && (
        <FullscreenImage
          key={1}
          src={url}
          index={1}
          onDownload={handleDownloadImage}
          className="break-inside-avoid mb-4"
        />
      )}
    </>
  );
};

export default PreviewContext;
