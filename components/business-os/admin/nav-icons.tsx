import type { ReactNode } from "react";
import {
  AppIcon,
  AudienceIcon,
  BankIcon,
  CalendarIcon,
  CashIcon,
  ChartIcon,
  DocumentIcon,
  ExpenseIcon,
  HomeIcon,
  NoteIcon,
  ProjectIcon,
  RegistryIcon,
  RepeatIcon,
  SalesIcon,
  SettingsIcon,
  SourcesIcon,
  SparkIcon,
  StatementIcon,
  UserIcon,
} from "@/components/business-os/ui/icons";

export {
  BrainIcon,
  CheckIcon,
  ExpenseIcon,
  HomeIcon,
  IncomeIcon,
  LogoutIcon,
  MoreIcon,
  MoonIcon,
  PlusIcon,
  ProjectIcon,
  SettingsIcon,
  SourcesIcon,
  SunIcon,
  CashIcon as MoneyNavIcon,
} from "@/components/business-os/ui/icons";

export function sectionIcon(section: string, size = 18): ReactNode {
  const props = { size };
  switch (section) {
    case "home":
      return <HomeIcon {...props} />;
    case "overview":
      return <ChartIcon {...props} />;
    case "appstore":
      return <AppIcon {...props} />;
    case "notes":
      return <NoteIcon {...props} />;
    case "ask":
      return <SparkIcon {...props} />;
    case "sales":
      return <SalesIcon {...props} />;
    case "expenses":
      return <ExpenseIcon {...props} />;
    case "subscriptions":
      return <RepeatIcon {...props} />;
    case "accounts":
      return <CashIcon {...props} />;
    case "bank":
      return <BankIcon {...props} />;
    case "reports":
      return <StatementIcon {...props} />;
    case "traffic":
      return <AudienceIcon {...props} />;
    case "integrations":
      return <SourcesIcon {...props} />;
    case "projects":
      return <ProjectIcon {...props} />;
    case "documents":
      return <DocumentIcon {...props} />;
    case "records":
      return <RegistryIcon {...props} />;
    case "timeline":
      return <CalendarIcon {...props} />;
    case "settings":
      return <UserIcon {...props} />;
    default:
      return <SettingsIcon {...props} />;
  }
}
