/** Small stroke icons (16 × 16 grid, currentColor). Decorative: the button next to them carries the name. */

import type { ReactNode } from "react";

function Icon({ size = 16, children }: { size?: number; children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export const HistoryIcon = () => (
  <Icon>
    <circle cx="8" cy="8" r="6" />
    <path d="M8 5v3l2 2" />
  </Icon>
);
export const NewChatIcon = () => (
  <Icon>
    <path d="M3 13h3l7-7-3-3-7 7z" />
  </Icon>
);
export const ExpandIcon = () => (
  <Icon>
    <path d="M3 6V3h3M13 10v3h-3M10 3h3v3M6 13H3v-3" />
  </Icon>
);
export const SplitIcon = () => (
  <Icon>
    <rect x="2" y="3" width="12" height="10" rx="2" />
    <path d="M8 3v10" />
  </Icon>
);
export const MinusIcon = () => (
  <Icon>
    <path d="M3 8h10" />
  </Icon>
);
export const MoreIcon = () => (
  <Icon>
    <path d="M3.5 8h.01M8 8h.01M12.5 8h.01" strokeWidth={2.6} />
  </Icon>
);
export const PaperclipIcon = () => (
  <Icon size={18}>
    <path d="M13 7.5 8 12.5a3 3 0 0 1-4.5-4.2L9 2.8a2 2 0 0 1 2.9 2.8L6.6 11a1 1 0 0 1-1.4-1.4L10 4.8" />
  </Icon>
);
export const ArrowUpIcon = () => (
  <Icon>
    <path d="M8 13V3M3.5 7.5 8 3l4.5 4.5" />
  </Icon>
);
export const StopIcon = () => (
  <svg width="12" height="12" viewBox="0 0 16 16" aria-hidden="true">
    <rect x="2" y="2" width="12" height="12" rx="2" fill="currentColor" />
  </svg>
);
export const ChevronDownIcon = () => (
  <Icon size={12}>
    <path d="M4 6l4 4 4-4" />
  </Icon>
);
export const CheckIcon = () => (
  <Icon size={14}>
    <path d="M3 8.5 6.5 12 13 4" />
  </Icon>
);
export const CalendarIcon = () => (
  <Icon>
    <rect x="2.5" y="3.5" width="11" height="10" rx="2" />
    <path d="M5 2v3M11 2v3M2.5 7h11" />
  </Icon>
);
export const FileIcon = () => (
  <Icon size={14}>
    <path d="M4 1.5h5l3 3v10H4z" />
  </Icon>
);
export const FlagIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#9e3039" strokeWidth={1.8} strokeLinecap="round" aria-hidden="true">
    <path d="M4 14V2.5h7l-1.5 3 1.5 3H4" />
  </svg>
);
