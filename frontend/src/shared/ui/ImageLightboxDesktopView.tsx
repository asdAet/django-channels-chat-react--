import controlsStyles from "../../styles/ui/ImageLightbox.controls.module.css";
import desktopStyles from "../../styles/ui/ImageLightbox.desktop.module.css";
import shellStyles from "../../styles/ui/ImageLightbox.module.css";
import type { ImageLightboxViewProps } from "./ImageLightbox.types";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
} from "./lightboxControls/LightboxIcons";

export default function ImageLightboxDesktopView({
  chrome,
  currentItem,
  isClosing,
  dialogLabel,
  overlayStyle,
  resolvedFrameStyle,
  metadataLines,
  hasNavigation,
  canGoPrevious,
  canGoNext,
  overlayRef,
  frameRef,
  viewportRef,
  onViewportWheel,
  onPointerDown,
  onPointerMove,
  onEndPointerDrag,
  onViewportBackgroundClick,
  onViewportDoubleClick,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  onPreviousClick,
  onNextClick,
  renderActiveMediaElement,
}: ImageLightboxViewProps) {
  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-label={dialogLabel}
      className={[shellStyles.overlay, isClosing ? shellStyles.exiting : ""]
        .filter(Boolean)
        .join(" ")}
      style={overlayStyle}
      data-testid="image-lightbox-desktop-view"
    >
      {chrome}

      {hasNavigation && (
        <button
          type="button"
          className={[controlsStyles.navBtn, controlsStyles.navBtnPrev].join(" ")}
          aria-label="Предыдущее медиа"
          onClick={onPreviousClick}
          disabled={!canGoPrevious}
        >
          <span className={controlsStyles.navBtnIcon} aria-hidden="true">
            <ChevronLeftIcon />
          </span>
        </button>
      )}

      {hasNavigation && (
        <button
          type="button"
          className={[controlsStyles.navBtn, controlsStyles.navBtnNext].join(" ")}
          aria-label="Следующее медиа"
          onClick={onNextClick}
          disabled={!canGoNext}
        >
          <span className={controlsStyles.navBtnIcon} aria-hidden="true">
            <ChevronRightIcon />
          </span>
        </button>
      )}

      <div
        className={[shellStyles.frame, desktopStyles.frameDesktop]
          .filter(Boolean)
          .join(" ")}
        style={resolvedFrameStyle}
        ref={frameRef}
      >
        <div
          ref={viewportRef}
          className={[shellStyles.mediaViewport, desktopStyles.mediaViewportDesktop]
            .filter(Boolean)
            .join(" ")}
          data-testid="lightbox-media-viewport"
          data-layout="desktop"
          onWheel={onViewportWheel}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onEndPointerDrag}
          onPointerCancel={onEndPointerDrag}
          onPointerLeave={onEndPointerDrag}
          onClick={onViewportBackgroundClick}
          onDoubleClick={onViewportDoubleClick}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onTouchCancel={onTouchEnd}
        >
          <div
            className={[desktopStyles.desktopStage, desktopStyles.desktopStageViewport]
              .filter(Boolean)
              .join(" ")}
            data-testid="lightbox-desktop-stage"
          >
            {renderActiveMediaElement(
              currentItem,
              desktopStyles.desktopImageMediaTransform,
            )}
          </div>
        </div>
      </div>

      <div className={shellStyles.metaText}>
        {metadataLines.map((line, index) => (
          <div key={`${index}-${line}`}>{line}</div>
        ))}
      </div>
    </div>
  );
}
