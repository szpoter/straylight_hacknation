import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Icon({ size = 20, children, ...rest }: IconProps & { children: React.ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden {...rest}>
      {children}
    </svg>
  );
}

export const CheckIcon = (p: IconProps) => <Icon {...p}><path d="M5 12.5l4.5 4.5L19 7.5" /></Icon>;
export const LockIcon = (p: IconProps) => <Icon {...p}><rect x="5" y="10.5" width="14" height="10" rx="2" /><path d="M8 10.5V8a4 4 0 018 0v2.5" /></Icon>;
export const ChevronDownIcon = (p: IconProps) => <Icon {...p}><path d="M6 9l6 6 6-6" /></Icon>;
export const ChevronLeftIcon = (p: IconProps) => <Icon {...p}><path d="M15 6l-6 6 6 6" /></Icon>;
export const ChevronRightIcon = (p: IconProps) => <Icon {...p}><path d="M9 6l6 6-6 6" /></Icon>;
export const ArrowUpIcon = (p: IconProps) => <Icon {...p}><path d="M12 19V5M6 11l6-6 6 6" /></Icon>;
export const ArrowLeftIcon = (p: IconProps) => <Icon {...p}><path d="M19 12H5M11 6l-6 6 6 6" /></Icon>;
export const PlusIcon = (p: IconProps) => <Icon {...p}><path d="M12 5v14M5 12h14" /></Icon>;
export const CloseIcon = (p: IconProps) => <Icon {...p}><path d="M6 6l12 12M18 6L6 18" /></Icon>;
export const ListIcon = (p: IconProps) => <Icon {...p}><path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01" /></Icon>;
export const MapIcon = (p: IconProps) => <Icon {...p}><path d="M4 18c3-6 5 2 8-4s5-2 8-8" /><circle cx="4" cy="18" r="1.5" /><circle cx="20" cy="6" r="1.5" /></Icon>;
export const CalculatorIcon = (p: IconProps) => <Icon {...p}><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M8 7h8M8 11.5h.01M12 11.5h.01M16 11.5h.01M8 15.5h.01M12 15.5h.01M16 15.5h.01" /></Icon>;
export const FileIcon = (p: IconProps) => <Icon {...p}><path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8z" /><path d="M14 3v5h5M9 13h6M9 17h4" /></Icon>;
export const UsersIcon = (p: IconProps) => <Icon {...p}><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0113 0" /><path d="M16 4.5a3.5 3.5 0 010 7M18 14a6.5 6.5 0 013.5 6" /></Icon>;
export const AlertIcon = (p: IconProps) => <Icon {...p}><path d="M12 3l10 18H2z" /><path d="M12 10v4M12 17.5h.01" /></Icon>;
export const InfoIcon = (p: IconProps) => <Icon {...p}><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 7.5h.01" /></Icon>;
export const HeartIcon = (p: IconProps) => <Icon {...p}><path d="M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z" /></Icon>;
export const DutyIcon = (p: IconProps) => <Icon {...p}><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" /></Icon>;
export const FormIcon = (p: IconProps) => <Icon {...p}><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M9 8h6M9 12h6M9 16h3" /></Icon>;
export const AutoIcon = (p: IconProps) => <Icon {...p}><path d="M20 12a8 8 0 11-2.3-5.6M20 4v4h-4" /></Icon>;
export const UploadIcon = (p: IconProps) => <Icon {...p}><path d="M12 16V4M7 9l5-5 5 5M5 20h14" /></Icon>;
export const RefreshIcon = (p: IconProps) => <Icon {...p}><path d="M20 12a8 8 0 01-14.9 4M4 12a8 8 0 0114.9-4M19 4v4h-4M5 20v-4h4" /></Icon>;
