import type { SVGProps } from "react";

import type { LightboxControlsLayout } from "./types";

type IconProps = SVGProps<SVGSVGElement> & {
  layout?: LightboxControlsLayout;
};

const resolveStrokeWidth = (layout: LightboxControlsLayout) =>
  layout === "mobile" ? 2.15 : 1.85;

function BaseIcon({
  children,
  layout = "desktop",
  viewBox = "0 0 24 24",
  ...props
}: IconProps) {
  return (
    <svg
      viewBox={viewBox}
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={resolveStrokeWidth(layout)}
      {...props}
    >
      {children}
    </svg>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M6 6l12 12" />
      <path d="M18 6l-12 12" />
    </BaseIcon>
  );
}

export function MoreIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="5" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="19" cy="12" r="1.4" fill="currentColor" stroke="none" />
    </BaseIcon>
  );
}

export function DownloadIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M12 4v10" />
      <path d="M8 10.5l4 4 4-4" />
      <path d="M5 19h14" />
    </BaseIcon>
  );
}

export function RotateIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M7 7V3l-4 4 4 4V7h5.2a6 6 0 1 1-5.86 7.3" />
    </BaseIcon>
  );
}

export function ExpandIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M9 4H4v5" />
      <path d="M4 4l6 6" />
      <path d="M15 20h5v-5" />
      <path d="M20 20l-6-6" />
      <path d="M20 9V4h-5" />
      <path d="M20 4l-6 6" />
      <path d="M4 15v5h5" />
      <path d="M4 20l6-6" />
    </BaseIcon>
  );
}

export function OpenInBrowserIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M14 5h5v5" />
      <path d="M10 14 19 5" />
      <path d="M19 13v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5" />
    </BaseIcon>
  );
}

export function CopyLinkIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M10.5 13.5 8.2 15.8a3.25 3.25 0 0 1-4.6-4.6l3.2-3.2a3.25 3.25 0 0 1 4.6 0" />
      <path d="m13.5 10.5 2.3-2.3a3.25 3.25 0 1 1 4.6 4.6l-3.2 3.2a3.25 3.25 0 0 1-4.6 0" />
      <path d="m8.8 15.2 6.4-6.4" />
    </BaseIcon>
  );
}

export function ZoomInIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="11" cy="11" r="6" />
      <path d="M20 20l-4.2-4.2" />
      <path d="M11 8v6" />
      <path d="M8 11h6" />
    </BaseIcon>
  );
}

export function ZoomOutIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="11" cy="11" r="6" />
      <path d="M20 20l-4.2-4.2" />
      <path d="M8 11h6" />
    </BaseIcon>
  );
}

export function ResetZoomIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="11" cy="11" r="6" />
      <path d="M20 20l-4.2-4.2" />
      <path d="M8.2 10.5a3.4 3.4 0 1 1 1.1 3.2" />
      <path d="M8 7.8v2.7h2.7" />
    </BaseIcon>
  );
}

export function PlayIcon({ layout = "desktop", ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="currentColor"
      {...props}
    >
      <path
        d={
          layout === "mobile"
            ? "M8 5.25 18.5 12 8 18.75Z"
            : "M8.5 5.8 17.5 12 8.5 18.2Z"
        }
      />
    </svg>
  );
}

export function PauseIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor" {...props}>
      <path d="M8 5h3.5v14H8zM12.5 5H16v14h-3.5z" />
    </svg>
  );
}

export function VolumeIcon({
  muted,
  layout = "desktop",
  ...props
}: IconProps & { muted: boolean }) {
  if (muted) {
    return (
      <BaseIcon layout={layout} {...props}>
        <path d="M5 9h4.2l4.8-4v14l-4.8-4H5z" />
        <path d="M18 9l-4 6" />
        <path d="M14 9l4 6" />
      </BaseIcon>
    );
  }

  return (
    <BaseIcon layout={layout} {...props}>
      <path d="M5 9h4.2l4.8-4v14l-4.8-4H5z" />
      <path d="M17 9.4a4.7 4.7 0 0 1 0 5.2" />
      <path d="M19.7 7.2a8.2 8.2 0 0 1 0 9.6" />
    </BaseIcon>
  );
}

export function SettingsIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M12 8.4a3.6 3.6 0 1 0 0 7.2 3.6 3.6 0 1 0 0-7.2Z" />
      <path d="m19 12 1.4-1.2-1.3-2.3-1.9.4a6.9 6.9 0 0 0-1.1-.7L15.6 6h-3.2l-.5 1.9c-.4.2-.8.4-1.1.7l-1.9-.4-1.3 2.3L9 12l-1.4 1.2 1.3 2.3 1.9-.4c.3.3.7.5 1.1.7l.5 1.9h3.2l.5-1.9c.4-.2.8-.4 1.1-.7l1.9.4 1.3-2.3z" />
    </BaseIcon>
  );
}

export function PictureInPictureIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <rect x="4" y="5" width="16" height="12" rx="2" />
      <rect
        x="12.2"
        y="9.5"
        width="5.3"
        height="4"
        rx="1"
        fill="currentColor"
        stroke="none"
      />
    </BaseIcon>
  );
}

export function FullscreenIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M9 4H4v5" />
      <path d="M4 4l6 6" />
      <path d="M15 20h5v-5" />
      <path d="M20 20l-6-6" />
    </BaseIcon>
  );
}

export function ChevronLeftIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="m14.5 5.5-6 6 6 6" />
    </BaseIcon>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="m9.5 5.5 6 6-6 6" />
    </BaseIcon>
  );
}
