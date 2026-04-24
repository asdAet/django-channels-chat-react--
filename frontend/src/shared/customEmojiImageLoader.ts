const customEmojiImageReadyCache = new Map<string, Promise<void>>();
const customEmojiImageReadySrcSet = new Set<string>();

const waitForImageDecode = (image: HTMLImageElement): Promise<void> => {
  if (typeof image.decode !== "function") {
    return Promise.resolve();
  }

  return image.decode().catch(() => {
    // Decode can fail for browser-specific reasons even after a successful load.
  });
};

export const loadCustomEmojiImage = (src: string): Promise<void> => {
  const cached = customEmojiImageReadyCache.get(src);
  if (cached) {
    return cached;
  }

  if (typeof Image === "undefined") {
    customEmojiImageReadySrcSet.add(src);
    return Promise.resolve();
  }

  const promise = new Promise<void>((resolve, reject) => {
    const image = new Image();
    let settled = false;

    const resolveOnce = () => {
      if (settled) {
        return;
      }

      settled = true;
      resolve();
    };

    const rejectOnce = () => {
      if (settled) {
        return;
      }

      settled = true;
      reject(new Error(`Failed to load custom emoji image: ${src}`));
    };

    image.decoding = "async";
    image.onload = () => {
      void waitForImageDecode(image).then(resolveOnce);
    };
    image.onerror = rejectOnce;
    image.src = src;

    if (image.complete && image.naturalWidth > 0) {
      void waitForImageDecode(image).then(resolveOnce);
    }
  })
    .then(() => {
      customEmojiImageReadySrcSet.add(src);
    })
    .catch((error) => {
      customEmojiImageReadyCache.delete(src);
      throw error;
    });

  customEmojiImageReadyCache.set(src, promise);
  return promise;
};

export const isCustomEmojiImageReady = (src: string): boolean =>
  customEmojiImageReadySrcSet.has(src);
