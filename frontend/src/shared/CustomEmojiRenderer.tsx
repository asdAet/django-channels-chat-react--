import { memo, useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";

import type { CustomEmoji } from "./customEmoji.types";
import { loadCustomEmojiById } from "./customEmojiCatalog";
import {
  isCustomEmojiImageReady,
  loadCustomEmojiImage,
} from "./customEmojiImageLoader";
import {
  enqueueCustomEmojiLoadTask,
  waitForNextPaint,
} from "./customEmojiLoadQueue";
import { TgsLottie } from "./TgsLottie";
import { useVisibilityGate } from "./useVisibilityGate";

type Props = {
  emoji: CustomEmoji;
  size: number;
  className?: string;
  priority?: boolean;
  visibilityRoot?: Element | null;
  preloadMargin?: string;
};

const isVitestRuntime = Boolean(import.meta.env.VITEST);

export const CustomEmojiRenderer = memo(function CustomEmojiRenderer({
  emoji,
  size,
  className,
  priority = false,
  visibilityRoot,
  preloadMargin,
}: Props) {
  const imageVisibleRef = useRef(false);
  const [pendingShellNode, setPendingShellNode] =
    useState<HTMLSpanElement | null>(null);
  const [imageShellNode, setImageShellNode] =
    useState<HTMLSpanElement | null>(null);
  const [failedEmojiId, setFailedEmojiId] = useState<string | null>(null);
  const [loadedEmoji, setLoadedEmoji] = useState<CustomEmoji | null>(null);
  const [decodedImageSrc, setDecodedImageSrc] = useState<string | null>(null);
  const resolvedEmoji = loadedEmoji?.id === emoji.id ? loadedEmoji : emoji;
  const bindPendingShellNode = useCallback((node: HTMLSpanElement | null) => {
    setPendingShellNode(node);
  }, []);
  const bindImageShellNode = useCallback((node: HTMLSpanElement | null) => {
    setImageShellNode(node);
  }, []);
  const { shouldLoad: shouldResolve } = useVisibilityGate(pendingShellNode, {
    priority,
    root: visibilityRoot,
    rootMargin: preloadMargin,
  });
  const { isVisible } = useVisibilityGate(imageShellNode, {
    priority,
    root: visibilityRoot,
    rootMargin: preloadMargin,
  });

  useEffect(() => {
    imageVisibleRef.current = isVisible;
  }, [isVisible]);

  useEffect(() => {
    if (resolvedEmoji.src || failedEmojiId === resolvedEmoji.id || !shouldResolve) {
      return;
    }

    let cancelled = false;

    void loadCustomEmojiById(resolvedEmoji.id)
      .then((loadedEmoji) => {
        if (cancelled) {
          return;
        }

        if (!loadedEmoji) {
          setFailedEmojiId(resolvedEmoji.id);
          return;
        }

        setLoadedEmoji(loadedEmoji);
      })
      .catch(() => {
        if (!cancelled) {
          setFailedEmojiId(resolvedEmoji.id);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [failedEmojiId, resolvedEmoji.id, resolvedEmoji.src, shouldResolve]);

  useEffect(() => {
    if (
      resolvedEmoji.assetKind !== "webp" ||
      !resolvedEmoji.src ||
      failedEmojiId === resolvedEmoji.id
    ) {
      return;
    }

    if (
      isVitestRuntime ||
      decodedImageSrc === resolvedEmoji.src ||
      isCustomEmojiImageReady(resolvedEmoji.src) ||
      !isVisible ||
      !imageShellNode
    ) {
      return;
    }

    const src = resolvedEmoji.src;
    let cancelled = false;

    void enqueueCustomEmojiLoadTask(async () => {
      if (cancelled || !imageShellNode || !imageVisibleRef.current) {
        return;
      }

      await loadCustomEmojiImage(src);
      if (cancelled || !imageShellNode) {
        return;
      }

      flushSync(() => setDecodedImageSrc(src));
      await waitForNextPaint();
    }).catch(() => {
      if (!cancelled) {
        setFailedEmojiId(resolvedEmoji.id);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [
    decodedImageSrc,
    failedEmojiId,
    imageShellNode,
    isVisible,
    resolvedEmoji.assetKind,
    resolvedEmoji.id,
    resolvedEmoji.src,
  ]);

  const renderFallback = () => (
    <span
      aria-hidden="true"
      style={{
        color: "currentColor",
        fontSize: Math.max(12, Math.round(size * 0.55)),
        lineHeight: 1,
        opacity: 0.65,
      }}
    >
      ?
    </span>
  );

  if (!resolvedEmoji.src) {
    const hasFailed = failedEmojiId === resolvedEmoji.id;

    return (
      <span
        ref={bindPendingShellNode}
        role="img"
        aria-label={resolvedEmoji.label}
        className={className}
        data-custom-emoji-kind={resolvedEmoji.assetKind}
        data-custom-emoji-failed={hasFailed ? "true" : undefined}
        data-custom-emoji-pending="true"
        style={{
          alignItems: "center",
          display: "inline-flex",
          flexShrink: 0,
          height: size,
          justifyContent: "center",
          minHeight: size,
          minWidth: size,
          overflow: "hidden",
          verticalAlign: "middle",
          width: size,
        }}
      >
        {hasFailed ? renderFallback() : null}
      </span>
    );
  }

  if (resolvedEmoji.assetKind === "webp") {
    const imageSrc =
      resolvedEmoji.src &&
      (isVitestRuntime ||
        decodedImageSrc === resolvedEmoji.src ||
        isCustomEmojiImageReady(resolvedEmoji.src))
        ? resolvedEmoji.src
        : null;

    return (
      <span
        ref={bindImageShellNode}
        className={className}
        data-custom-emoji-kind={resolvedEmoji.assetKind}
        data-custom-emoji-failed={
          failedEmojiId === resolvedEmoji.id ? "true" : undefined
        }
        data-custom-emoji-src={resolvedEmoji.src}
        style={{
          alignItems: "center",
          display: "inline-flex",
          flexShrink: 0,
          height: size,
          justifyContent: "center",
          minHeight: size,
          minWidth: size,
          overflow: "hidden",
          verticalAlign: "middle",
          width: size,
        }}
      >
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={resolvedEmoji.label}
            width={size}
            height={size}
            draggable={false}
            decoding="async"
            style={{
              display: "inline-block",
              flexShrink: 0,
              height: size,
              minHeight: size,
              minWidth: size,
              objectFit: "contain",
              verticalAlign: "middle",
              width: size,
            }}
          />
        ) : failedEmojiId === resolvedEmoji.id ? (
          renderFallback()
        ) : null}
      </span>
    );
  }

  if (resolvedEmoji.assetKind === "webm") {
    const videoSrc = isVisible ? resolvedEmoji.src : null;

    return (
      <span
        ref={bindImageShellNode}
        role="img"
        aria-label={resolvedEmoji.label}
        className={className}
        data-custom-emoji-kind={resolvedEmoji.assetKind}
        data-custom-emoji-failed={
          failedEmojiId === resolvedEmoji.id ? "true" : undefined
        }
        data-custom-emoji-src={resolvedEmoji.src}
        style={{
          alignItems: "center",
          display: "inline-flex",
          flexShrink: 0,
          height: size,
          justifyContent: "center",
          minHeight: size,
          minWidth: size,
          overflow: "hidden",
          verticalAlign: "middle",
          width: size,
        }}
      >
        {videoSrc ? (
          <video
            src={videoSrc}
            aria-hidden="true"
            width={size}
            height={size}
            autoPlay={isVisible}
            loop
            muted
            playsInline
            preload={isVisible ? "auto" : "none"}
            disablePictureInPicture
            draggable={false}
            style={{
              display: "inline-block",
              flexShrink: 0,
              height: size,
              minHeight: size,
              minWidth: size,
              objectFit: "contain",
              verticalAlign: "middle",
              width: size,
            }}
          />
        ) : failedEmojiId === resolvedEmoji.id ? (
          renderFallback()
        ) : null}
      </span>
    );
  }

  return (
    <TgsLottie
      src={resolvedEmoji.src}
      label={resolvedEmoji.label}
      size={size}
      className={className}
      priority={priority}
      visibilityRoot={visibilityRoot}
      preloadMargin={preloadMargin}
    />
  );
});
