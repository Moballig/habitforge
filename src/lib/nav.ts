import {
  Home,
  CalendarRange,
  PlusCircle,
  MessageCircle,
  Dumbbell,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  labelKey: string;
  icon: LucideIcon;
  center?: boolean;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/home", labelKey: "nav.home", icon: Home },
  { href: "/plan", labelKey: "nav.plan", icon: CalendarRange },
  { href: "/log", labelKey: "nav.log", icon: PlusCircle, center: true },
  { href: "/coach", labelKey: "nav.coach", icon: MessageCircle },
  { href: "/activity", labelKey: "nav.activity", icon: Dumbbell },
];

export const SIDEBAR_EXTRA = [
  { href: "/family", labelKey: "nav.family" },
  { href: "/settings", labelKey: "nav.settings" },
  { href: "/insights", labelKey: "nav.insights" },
];
