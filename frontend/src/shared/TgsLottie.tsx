import { gunzipSync, strFromU8 } from "fflate";
import type {
  AnimationConfigWithData,
  AnimationItem,
  LottiePlayer,
} from "lottie-web";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";

import {
  enqueueCustomEmojiLoadTask,
  waitForNextPaint,
} from "./customEmojiLoadQueue";
import { useVisibilityGate } from "./useVisibilityGate";

type TgsLottieProps = {
  src: string;
  label: string;
  size: number;
  className?: string;
  priority?: boolean;
  visibilityRoot?: Element | null;
  preloadMargin?: string;
};

type LottieAnimation = Pick<
  AnimationItem,
  | "addEventListener"
  | "destroy"
  | "goToAndStop"
  | "isLoaded"
  | "pause"
  | "play"
  | "setSubframe"
>;

type TgsAnimationData = Record<string, unknown>;

type PreparedTgsAnimation = {
  animationData: TgsAnimationData;
  firstFrame: number;
  shouldAnimate: boolean;
};

type TgsPosterCacheEntry = {
  imageSrc: string;
  shouldAnimate: boolean;
};

const isVitestRuntime = Boolean(import.meta.env.VITEST);
const MAX_CANVAS_DPR = 2;

const customEmojiAnimationDataCache = new Map<
  string,
  Promise<PreparedTgsAnimation>
>();
const customEmojiPosterCache = new Map<string, TgsPosterCacheEntry>();

let lottieModulePromise: Promise<LottiePlayer> | null = null;

const loadLottieModule = async () => {
  if (!lottieModulePromise) {
    lottieModulePromise = import("lottie-web").then((module) => module.default);
  }

  return lottieModulePromise;
};

const readFiniteNumber = (value: unknown, fallback: number): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

const prepareTgsAnimation = (
  animationData: TgsAnimationData,
): PreparedTgsAnimation => {
  const firstFrame = readFiniteNumber(animationData.ip, 0);
  const lastFrame = readFiniteNumber(animationData.op, firstFrame + 1);

  return {
    animationData,
    firstFrame,
    shouldAnimate: lastFrame - firstFrame > 1,
  };
};

const loadTgsAnimationData = async (
  src: string,
): Promise<PreparedTgsAnimation> => {
  const cached = customEmojiAnimationDataCache.get(src);
  if (cached) {
    return cached;
  }

  const promise = fetch(src)
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`Failed to load TGS asset: ${response.status}`);
      }

      const bytes = new Uint8Array(await response.arrayBuffer());
      return prepareTgsAnimation(
        JSON.parse(strFromU8(gunzipSync(bytes))) as TgsAnimationData,
      );
    })
    .catch((error) => {
      customEmojiAnimationDataCache.delete(src);
      throw error;
    });

  customEmojiAnimationDataCache.set(src, promise);
  return promise;
};

const waitForLottieDomReady = (
  animation: LottieAnimation,
): Promise<void> =>
  new Promise((resolve) => {
    if (animation.isLoaded) {
      resolve();
      return;
    }

    let settled = false;
    let removeListener: (() => void) | null = null;
    const timeoutId = setTimeout(() => {
      if (settled) {
        return;
      }

      settled = true;
      removeListener?.();
      resolve();
    }, 250);

    removeListener = animation.addEventListener("DOMLoaded", () => {
      if (settled) {
        return;
      }

      settled = true;
      clearTimeout(timeoutId);
      removeListener?.();
      resolve();
    });
  });

const getCanvasDpr = (): number => {
  if (typeof window === "undefined") {
    return 1;
  }

  return Math.max(1, Math.min(window.devicePixelRatio || 1, MAX_CANVAS_DPR));
};

const readCanvasPoster = (node: HTMLElement): string | null => {
  const canvas = node.querySelector("canvas");
  if (!canvas || !canvas.width || !canvas.height) {
    return null;
  }

  try {
    return canvas.toDataURL("image/webp", 0.86);
  } catch {
    try {
      return canvas.toDataURL("image/png");
    } catch {
      return null;
    }
  }
};

export const TgsLottie = memo(function TgsLottie({
  src,
  label,
  size,
  className,
  priority = false,
  visibilityRoot,
  preloadMargin,
}: TgsLottieProps) {
  const animationContainerRef = useRef<HTMLSpanElement>(null);
  const animationRef = useRef<LottieAnimation | null>(null);
  const queuedSrcRef = useRef<string | null>(null);
  const visibleRef = useRef(false);
  const shouldAnimateRef = useRef(false);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const [readySrc, setReadySrc] = useState<string | null>(null);
  const [rootNode, setRootNode] = useState<HTMLSpanElement | null>(null);
  const bindRootNode = useCallback((node: HTMLSpanElement | null) => {
    setRootNode(node);
  }, []);
  const { isVisible, shouldLoad } = useVisibilityGate(rootNode, {
    priority,
    root: visibilityRoot,
    rootMargin: preloadMargin,
  });

  const cachedPoster = customEmojiPosterCache.get(src);
  const hasPoster = Boolean(cachedPoster);
  const hasFailed = failedSrc === src;

  useEffect(() => {
    visibleRef.current = isVisible;

    const animation = animationRef.current;
    if (!animation) {
      return;
    }

    if (isVisible && shouldAnimateRef.current) {
      animation.play();
    } else {
      animation.pause();
    }
  }, [isVisible]);

  useEffect(() => {
    const node = animationContainerRef.current;
    if (
      !node ||
      !shouldLoad ||
      !isVisible ||
      isVitestRuntime ||
      hasFailed ||
      animationRef.current ||
      queuedSrcRef.current === src
    ) {
      return;
    }

    const cachedPoster = customEmojiPosterCache.get(src);
    if (cachedPoster && !cachedPoster.shouldAnimate) {
      return;
    }

    let cancelled = false;
    queuedSrcRef.current = src;

    void enqueueCustomEmojiLoadTask(async () => {
      if (
        cancelled ||
        !animationContainerRef.current ||
        !visibleRef.current
      ) {
        return;
      }

      const lottie = await loadLottieModule();
      const preparedAnimation = await loadTgsAnimationData(src);
      if (
        cancelled ||
        !animationContainerRef.current ||
        !visibleRef.current
      ) {
        return;
      }

      const animation = lottie.loadAnimation({
        animationData: preparedAnimation.animationData,
        autoplay: false,
        container: animationContainerRef.current,
        loop: preparedAnimation.shouldAnimate,
        renderer: "canvas",
        rendererSettings: {
          clearCanvas: true,
          dpr: getCanvasDpr(),
          preserveAspectRatio: "xMidYMid meet",
          progressiveLoad: true,
        },
      } satisfies AnimationConfigWithData<"canvas">);

      animation.setSubframe(false);
      await waitForLottieDomReady(animation);
      if (cancelled || !animationContainerRef.current) {
        animation.destroy();
        return;
      }

      animation.goToAndStop(preparedAnimation.firstFrame, true);
      const posterImageSrc = readCanvasPoster(animationContainerRef.current);
      if (posterImageSrc) {
        customEmojiPosterCache.set(src, {
          imageSrc: posterImageSrc,
          shouldAnimate: preparedAnimation.shouldAnimate,
        });
      }

      animationRef.current = animation;
      shouldAnimateRef.current = preparedAnimation.shouldAnimate;
      flushSync(() => setReadySrc(src));
      await waitForNextPaint();

      if (cancelled || !animationContainerRef.current) {
        return;
      }

      if (visibleRef.current && preparedAnimation.shouldAnimate) {
        animation.play();
      } else {
        animation.pause();
      }
    })
      .catch(() => {
        if (!cancelled && !customEmojiPosterCache.has(src)) {
          setFailedSrc(src);
        }
      })
      .finally(() => {
        if (queuedSrcRef.current === src) {
          queuedSrcRef.current = null;
        }
      });

    return () => {
      cancelled = true;
    };
  }, [hasFailed, isVisible, shouldLoad, src]);

  useEffect(() => {
    const animationContainer = animationContainerRef.current;

    return () => {
      queuedSrcRef.current = null;
      shouldAnimateRef.current = false;
      animationRef.current?.destroy();
      animationRef.current = null;
      if (animationContainer) {
        animationContainer.replaceChildren();
      }
    };
  }, [src]);

  return (
    <span
      ref={bindRootNode}
      role="img"
      aria-label={label}
      className={className}
      data-custom-emoji-kind="tgs"
      data-custom-emoji-src={src}
      style={{
        alignItems: "center",
        display: "inline-flex",
        flexShrink: 0,
        height: size,
        justifyContent: "center",
        minHeight: size,
        minWidth: size,
        overflow: "hidden",
        position: "relative",
        opacity:
          readySrc === src || hasPoster || hasFailed || isVitestRuntime
            ? 1
            : 0,
        verticalAlign: "middle",
        width: size,
      }}
    >
      <span
        aria-hidden="true"
        style={{
          alignItems: "center",
          display: "inline-flex",
          height: "100%",
          inset: 0,
          justifyContent: "center",
          opacity: hasPoster && readySrc !== src && !hasFailed ? 1 : 0,
          overflow: "hidden",
          pointerEvents: "none",
          position: "absolute",
          width: "100%",
        }}
      >
        {cachedPoster ? (
          <img
            src={cachedPoster.imageSrc}
            alt=""
            draggable={false}
            style={{
              display: "inline-block",
              flexShrink: 0,
              height: "100%",
              objectFit: "contain",
              width: "100%",
            }}
          />
        ) : null}
      </span>
      <span
        ref={animationContainerRef}
        aria-hidden="true"
        style={{
          alignItems: "center",
          display: "inline-flex",
          height: "100%",
          inset: 0,
          justifyContent: "center",
          opacity: readySrc === src ? 1 : 0,
          overflow: "hidden",
          pointerEvents: "none",
          position: "absolute",
          width: "100%",
        }}
      />
      {hasFailed ? (
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
      ) : null}
    </span>
  );
});
