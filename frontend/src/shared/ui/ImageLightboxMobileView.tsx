import controlsStyles from "../../styles/ui/ImageLightbox.controls.module.css";
import mobileStyles from "../../styles/ui/ImageLightbox.mobile.module.css";
import shellStyles from "../../styles/ui/ImageLightbox.module.css";
import type { ImageLightboxViewProps } from "./ImageLightbox.types";

export default function ImageLightboxMobileView({
  mediaItems,
  normalizedCurrentIndex,
  normalizedDisplayIndex,
  isClosing,
  dialogLabel,
  overlayStyle,
  resolvedFrameStyle,
  metadataLines,
  hasNavigation,
  canGoPrevious,
  canGoNext,
  showExpandButton,
  overlayRef,
  frameRef,
  viewportRef,
  mobileTrackRef,
  mobileTrackStyle,
  onMobileTrackTransitionEnd,
  onStopClickPropagation,
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
  onCloseClick,
  onExpandClick,
  renderActiveMediaElement,
  renderPreviewMediaElement,
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
      data-testid="image-lightbox-mobile-view"
    >
      {hasNavigation && (
        <button
          type="button"
          className={[
            controlsStyles.navBtn,
            controlsStyles.navBtnPrev,
            mobileStyles.navBtnMobile,
            mobileStyles.navBtnPrevMobile,
          ]
            .filter(Boolean)
            .join(" ")}
          aria-label="Предыдущее медиа"
          onClick={onPreviousClick}
          disabled={!canGoPrevious}
        >
          <span
            className={[controlsStyles.navBtnIcon, mobileStyles.navBtnIconMobile]
              .filter(Boolean)
              .join(" ")}
            aria-hidden="true"
          >
            {"\u2039"}
          </span>
        </button>
      )}

      {hasNavigation && (
        <button
          type="button"
          className={[
            controlsStyles.navBtn,
            controlsStyles.navBtnNext,
            mobileStyles.navBtnMobile,
            mobileStyles.navBtnNextMobile,
          ]
            .filter(Boolean)
            .join(" ")}
          aria-label="Следующее медиа"
          onClick={onNextClick}
          disabled={!canGoNext}
        >
          <span
            className={[controlsStyles.navBtnIcon, mobileStyles.navBtnIconMobile]
              .filter(Boolean)
              .join(" ")}
            aria-hidden="true"
          >
            {"\u203A"}
          </span>
        </button>
      )}

      <div
        className={[shellStyles.frame, mobileStyles.frameMobile]
          .filter(Boolean)
          .join(" ")}
        style={resolvedFrameStyle}
        ref={frameRef}
      >
        <div className={controlsStyles.actions} onClick={onStopClickPropagation}>
          {showExpandButton && (
            <button
              type="button"
              className={[controlsStyles.actionBtn, mobileStyles.actionBtnMobile]
                .filter(Boolean)
                .join(" ")}
              onClick={onExpandClick}
              aria-label="Развернуть"
            >
              {"\u26F6"}
            </button>
          )}
          <button
            type="button"
            className={[controlsStyles.actionBtn, mobileStyles.actionBtnMobile]
              .filter(Boolean)
              .join(" ")}
            onClick={onCloseClick}
            aria-label="Закрыть"
          >
            {"\u00D7"}
          </button>
        </div>

        <div
          ref={viewportRef}
          className={[shellStyles.mediaViewport, mobileStyles.mediaViewportMobile]
            .filter(Boolean)
            .join(" ")}
          data-testid="lightbox-media-viewport"
          data-layout="mobile"
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
          <div className={mobileStyles.mobileDeck} data-testid="lightbox-mobile-deck">
            <div
              ref={mobileTrackRef}
              className={mobileStyles.mobileTrack}
              data-testid="lightbox-mobile-track"
              style={mobileTrackStyle}
              onTransitionEnd={onMobileTrackTransitionEnd}
            >
              {mediaItems.map((item, index) => {
                const isActiveSlide = index === normalizedDisplayIndex;
                const shouldRenderMedia =
                  Math.abs(index - normalizedCurrentIndex) <= 1 ||
                  Math.abs(index - normalizedDisplayIndex) <= 1;

                return (
                  <div
                    key={item.metadata.attachmentId}
                    className={[
                      mobileStyles.mobileSlide,
                      isActiveSlide ? mobileStyles.mobileSlideActive : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    data-active={isActiveSlide ? "true" : "false"}
                    aria-hidden={isActiveSlide ? undefined : true}
                  >
                    <div className={mobileStyles.mobileDeckCard}>
                      {shouldRenderMedia ? (
                        isActiveSlide ? (
                          renderActiveMediaElement(
                            item,
                            mobileStyles.mobileMediaTransform,
                          )
                        ) : (
                          renderPreviewMediaElement(
                            item,
                            mobileStyles.mobileMediaTransform,
                          )
                        )
                      ) : (
                        <div className={mobileStyles.mobileSlidePlaceholder} />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className={[shellStyles.metaText, mobileStyles.metaTextMobile].join(" ")}>
        {metadataLines.map((line, index) => (
          <div key={`${index}-${line}`}>{line}</div>
        ))}
      </div>
    </div>
  );
}
