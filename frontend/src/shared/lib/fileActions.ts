export const triggerFileDownload = (url: string, fileName: string): void => {
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.rel = "noopener noreferrer";
  anchor.target = "_blank";
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
};

const convertImageBlobToPng = async (blob: Blob): Promise<Blob> => {
  const objectUrl = URL.createObjectURL(blob);

  try {
    const image = new Image();
    image.decoding = "async";
    image.src = objectUrl;
    await image.decode();

    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;

    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("2D canvas context is unavailable.");
    }

    context.drawImage(image, 0, 0);

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((pngBlob) => {
        if (pngBlob) {
          resolve(pngBlob);
          return;
        }
        reject(new Error("Image conversion failed."));
      }, "image/png");
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
};

export const copyImageUrlToClipboard = async (url: string): Promise<void> => {
  if (
    typeof navigator === "undefined" ||
    typeof navigator.clipboard?.write !== "function" ||
    typeof ClipboardItem === "undefined"
  ) {
    throw new Error("Image clipboard API is unavailable.");
  }

  const response = await fetch(url, { credentials: "include" });
  if (!response.ok) {
    throw new Error(`Image request failed with ${response.status}.`);
  }

  const sourceBlob = await response.blob();
  if (!sourceBlob.type.startsWith("image/")) {
    throw new Error("Clipboard source is not an image.");
  }

  const clipboardBlob =
    sourceBlob.type === "image/png"
      ? sourceBlob
      : await convertImageBlobToPng(sourceBlob);

  await navigator.clipboard.write([
    new ClipboardItem({ [clipboardBlob.type]: clipboardBlob }),
  ]);
};
