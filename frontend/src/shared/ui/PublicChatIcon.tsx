type PublicChatIconProps = {
  className?: string;
};

export function PublicChatIcon({ className }: PublicChatIconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M4.5 5.5h11.75v7.75H9.5L5 17v-3.75h-.5V5.5Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M14.25 15.25a4.25 4.25 0 1 0 8.5 0 4.25 4.25 0 0 0-8.5 0Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.55"
      />
      <path
        d="M14.75 15.25h7.5M18.5 11.25c1 1.1 1.48 2.4 1.48 4s-.48 2.9-1.48 4c-1-1.1-1.48-2.4-1.48-4s.48-2.9 1.48-4Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.2"
      />
    </svg>
  );
}
