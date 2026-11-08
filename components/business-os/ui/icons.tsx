import type { ReactNode, SVGProps } from "react";

type IconProps = Omit<SVGProps<SVGSVGElement>, "children"> & { size?: number };

function make(paths: ReactNode) {
  return function Icon({ size = 18, ...props }: IconProps) {
    return (
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        aria-hidden
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
      >
        {paths}
      </svg>
    );
  };
}

export const HomeIcon = make(<><path d="M4 11.5 12 5l8 6.5" /><path d="M6 10v9h12v-9" /></>);
export const SalesIcon = make(<><path d="M6 7h12v12H6z" /><path d="M9 7V5h6v2" /><path d="M9 12h6" /></>);
export const ExpenseIcon = make(<><path d="M7 4h10v16l-2.5-1.5L12 20l-2.5-1.5L7 20z" /><path d="M10 9h4M10 13h4" /></>);
export const RepeatIcon = make(<><path d="M17 3l3 3-3 3" /><path d="M4 11V9a3 3 0 0 1 3-3h13" /><path d="M7 21l-3-3 3-3" /><path d="M20 13v2a3 3 0 0 1-3 3H4" /></>);
export const BankIcon = make(<><path d="M3 9.5 12 4l9 5.5" /><path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8" /><path d="M3 20h18" /></>);
export const CashIcon = make(<><rect x="3" y="6" width="18" height="13" rx="2" /><path d="M3 10h18" /><path d="M16 15h2" /></>);
export const StatementIcon = make(<><path d="M5 19V9M10 19V5M15 19v-7M20 19v-4" /></>);
export const AudienceIcon = make(<><circle cx="9" cy="9" r="3" /><path d="M3.5 19a5.5 5.5 0 0 1 11 0" /><path d="M16 6.5a3 3 0 0 1 0 5.5M17.5 14.5A5.5 5.5 0 0 1 20.5 19" /></>);
export const SourcesIcon = make(<><path d="M8 6a4 4 0 0 1 8 0v2H8z" /><path d="M6 8h12v4a6 6 0 0 1-12 0z" /><path d="M12 18v3" /></>);
export const ProjectIcon = make(<><rect x="4" y="4" width="7" height="7" rx="1.5" /><rect x="13" y="4" width="7" height="7" rx="1.5" /><rect x="4" y="13" width="7" height="7" rx="1.5" /><rect x="13" y="13" width="7" height="7" rx="1.5" /></>);
export const DocumentIcon = make(<><path d="M7 3h7l4 4v14H7z" /><path d="M14 3v4h4" /><path d="M10 12h5M10 16h5" /></>);
export const RegistryIcon = make(<><path d="M5 4h14v16H5z" /><path d="M9 8h6M9 12h6M9 16h3" /></>);
export const TimelineIcon = make(<><circle cx="6" cy="6" r="2" /><circle cx="6" cy="18" r="2" /><path d="M6 8v8" /><path d="M10 6h10M10 18h10" /></>);
export const SettingsIcon = make(<><circle cx="12" cy="12" r="3" /><path d="M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.3 1a7 7 0 0 0-2-1.2L14.3 3h-4l-.4 2.6a7 7 0 0 0-2 1.2l-2.3-1-2 3.4 2 1.5a7 7 0 0 0 0 2.4l-2 1.5 2 3.4 2.3-1a7 7 0 0 0 2 1.2l.4 2.7h4l.3-2.6a7 7 0 0 0 2-1.2l2.3 1 2-3.4-2-1.5c.1-.4.1-.8.1-1.3z" /></>);
export const MoreIcon = make(<><circle cx="5" cy="12" r="1.2" /><circle cx="12" cy="12" r="1.2" /><circle cx="19" cy="12" r="1.2" /></>);
export const PlusIcon = make(<path d="M12 5v14M5 12h14" />);
export const CloseIcon = make(<path d="M6 6l12 12M18 6 6 18" />);
export const ChevronLeftIcon = make(<path d="m15 6-6 6 6 6" />);
export const ChevronRightIcon = make(<path d="m9 6 6 6-6 6" />);
export const ChevronDownIcon = make(<path d="m7 10 5 5 5-5" />);
export const CalendarIcon = make(<><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M4 10h16M9 3v4M15 3v4" /></>);
export const FilterIcon = make(<path d="M4 6h16M7 12h10M10 18h4" />);
export const AlertIcon = make(<><circle cx="12" cy="12" r="8" /><path d="M12 8v5M12 16h.01" /></>);
export const CheckIcon = make(<path d="m5 12.5 4.5 4.5L19 7.5" />);
export const CheckCircleIcon = make(<><circle cx="12" cy="12" r="8" /><path d="m8.5 12.2 2.4 2.4 4.6-4.8" /></>);
export const TriangleIcon = make(<><path d="M12 4 3 19h18z" /><path d="M12 10v4M12 16.5h.01" /></>);
export const XCircleIcon = make(<><circle cx="12" cy="12" r="8" /><path d="m9.5 9.5 5 5M14.5 9.5l-5 5" /></>);
export const ClockIcon = make(<><circle cx="12" cy="12" r="8" /><path d="M12 8v4l3 2" /></>);
export const CircleIcon = make(<circle cx="12" cy="12" r="6" />);
export const DownloadIcon = make(<><path d="M12 4v11" /><path d="m7 10 5 5 5-5" /><path d="M5 20h14" /></>);
export const SortIcon = make(<path d="m8 9 4-4 4 4M8 15l4 4 4-4" />);
export const SortUpIcon = make(<path d="m8 14 4-4 4 4" />);
export const SortDownIcon = make(<path d="m8 10 4 4 4-4" />);
export const SunIcon = make(<><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>);
export const MoonIcon = make(<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />);
export const LogoutIcon = make(<><path d="M15 4h4v16h-4" /><path d="M10 8l-4 4 4 4" /><path d="M6 12h10" /></>);
export const UserIcon = make(<><circle cx="12" cy="8" r="4" /><path d="M4 20a8 8 0 0 1 16 0" /></>);
export const InfoIcon = make(<><circle cx="12" cy="12" r="8" /><path d="M12 11v5M12 8h.01" /></>);
export const EyeIcon = make(<><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" /><circle cx="12" cy="12" r="3" /></>);
export const EyeOffIcon = make(<><path d="M10 5.7A9 9 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-2.6 3.4M6.6 6.6C3.9 8.3 2.5 12 2.5 12S6 18.5 12 18.5a9 9 0 0 0 4.4-1.1" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" /><path d="m3 3 18 18" /></>);
export const SidebarIcon = make(<><rect x="3" y="4" width="18" height="16" rx="2.5" /><path d="M9 4v16" /></>);
export const SearchIcon =make(<><circle cx="11" cy="11" r="6" /><path d="m20 20-4.5-4.5" /></>);
export const ExternalIcon = make(<><path d="M14 4h6v6" /><path d="M20 4 11 13" /><path d="M18 14v6H4V6h6" /></>);
export const ServerIcon = make(<><rect x="4" y="4" width="16" height="7" rx="1.5" /><rect x="4" y="13" width="16" height="7" rx="1.5" /><path d="M8 7.5h.01M8 16.5h.01M12 7.5h4M12 16.5h4" /></>);
export const DatabaseIcon = make(<><ellipse cx="12" cy="6" rx="7" ry="3" /><path d="M5 6v12c0 1.7 3.1 3 7 3s7-1.3 7-3V6" /><path d="M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3" /></>);
export const LockIcon = make(<><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>);
export const IncomeIcon = make(<><path d="M12 19V7" /><path d="m7 12 5-5 5 5" /><path d="M5 4h14" /></>);
export const ChartIcon = make(<><path d="M4 20h16" /><path d="M7 16v-5M12 16V7M17 16v-8" /></>);
export const NoteIcon = make(<><path d="M5 4h14v16H5z" /><path d="M9 4v16" /><path d="M12 9h4M12 13h4" /></>);
export const SparkIcon = make(<><path d="M12 3v4M12 17v4M3 12h4M17 12h4" /><path d="m7.5 7.5 2 2M14.5 14.5l2 2M16.5 7.5l-2 2M9.5 14.5l-2 2" /></>);
export const AppIcon = make(<><rect x="4" y="4" width="16" height="16" rx="4" /><path d="M9 15l3-6 3 6M10 13h4" /></>);
export const BrainIcon = make(<><path d="M9 4a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3 3 0 0 0 2 5 3 3 0 0 0 3 3h0V4z" /><path d="M15 4a3 3 0 0 1 3 3 3 3 0 0 1 2 5 3 3 0 0 1-2 5 3 3 0 0 1-3 3h0V4z" /></>);
export const FolderIcon = make(<><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></>);
export const UploadIcon = make(<><path d="M12 16V4" /><path d="m7 9 5-5 5 5" /><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" /></>);
export const TrashIcon = make(<><path d="M4 7h16" /><path d="M9 7V4h6v3" /><path d="M6 7l1 13h10l1-13" /></>);
export const ImageIcon = make(<><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="9" cy="10" r="1.5" /><path d="m21 16-5-5-9 8" /></>);
