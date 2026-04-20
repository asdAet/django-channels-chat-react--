import { useEffect, useRef } from "react";

import styles from "../../styles/ui/LightboxVideoPlayer.module.css";

type LightboxVideoPlayerProps = {
  src: string;
  poster?: string | null;
  fileName: string;
};

/**
 * Minimal native HTML5 video stage for the unified media viewer.
 *
 * The component deliberately stays close to the browser's default player:
 * there are no custom playback layers, no third-party runtime and no detached
 * player session. Closing the viewer always tears the media element down.
 */
export function LightboxVideoPlayer({
  src,
  poster,
  fileName,
}: LightboxVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;

    return () => {
      if (!video) {
        return;
      }

      try {
        video.pause();
      } catch {
        // Ignore teardown issues from partially detached HTMLMediaElement.
      }
    };
  }, []);

  return (
    <div
      className={styles.root}
      data-testid="lightbox-video-player-desktop"
      data-lightbox-video-player="true"
      data-media-file={fileName}
      onClick={(event) => event.stopPropagation()}
    >
      <div className={styles.playerHost} data-testid="lightbox-video-player">
        <video
          ref={videoRef}
          className={styles.video}
          src={src}
          poster={poster ?? undefined}
          preload="metadata"
          controls
          playsInline
          data-testid="lightbox-video-element"
        >
          <track kind="captions" />
        </video>
      </div>
    </div>
  );
}
