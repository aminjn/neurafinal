import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "./ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";
import {
  Users,
  Bot,
  Briefcase,
  MessageSquare,
  FileCog,
  Ticket,
  Mail,
  Rss,
  Palette,
  Languages,
  Settings,
  ShieldCheck,
  UserCog,
  Activity,
  ChevronLeft,
  Calculator,
  Warehouse,
  Headphones,
  LayoutDashboard,
  ScrollText,
  Building2,
  HeartHandshake,
  Receipt,
  Wallet,
  FileText,
  Home,
  Megaphone,
  ClipboardList,
  Landmark,
  ShoppingCart,
  Store,
  Sparkles,
  PhoneCall,
} from "lucide-react";
import { Avatar, AvatarFallback } from "./ui/avatar";

export type MenuKey = string;

type MenuItem = {
  key: MenuKey;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  children?: MenuItem[];
};

type MenuGroup = {
  label: string;
  items: MenuItem[];
};

const agentDefinitions = [
  { key: "secretary", label: "ایجنت منشی", icon: ClipboardList },
  { key: "finance", label: "ایجنت مالی/اداری", icon: Landmark },
  { key: "procurement", label: "ایجنت خرید/تدارکات", icon: ShoppingCart },
  { key: "cashier", label: "ایجنت فروشنده/صندوقدار", icon: Store },
];

// Suppress unused import warnings for retired agent icons
void Calculator;
void Warehouse;
void Headphones;
void Building2;
void ScrollText;
void agentDefinitions;

export const menuGroups: MenuGroup[] = [
  {
    label: "دیتا",
    items: [
      { key: "data.home", label: "خانه", icon: Home },
      { key: "data.users", label: "کاربران", icon: Users },
      { key: "data.agent-defs", label: "تعاریف ایجنت‌ها", icon: FileCog },
      { key: "data.agents", label: "ایجنت‌ها", icon: Bot },
      { key: "data.businesses", label: "بیزینس‌ها", icon: Briefcase },
      { key: "data.chats", label: "چت‌ها", icon: MessageSquare },
      { key: "data.customers", label: "مشتریان", icon: HeartHandshake },
      { key: "data.transactions", label: "تراکنش‌ها", icon: Receipt },
      { key: "data.wallets", label: "کیف پول‌ها", icon: Wallet },
      { key: "data.invoices", label: "فاکتورها", icon: FileText },
    ],
  },
  {
    label: "ایجنت‌ها",
    items: [
      { key: "agents.secretary", label: "ایجنت منشی", icon: ClipboardList },
      { key: "agents.marketer", label: "ایجنت بازاریاب", icon: Megaphone },
      { key: "agents.finance", label: "ایجنت مالی/اداری", icon: Landmark },
      { key: "agents.procurement", label: "ایجنت خرید/تدارکات", icon: ShoppingCart },
      { key: "agents.cashier", label: "ایجنت فروشنده/صندوقدار", icon: Store },
    ],
  },
  {
    label: "پشتیبانی و فرم‌ها",
    items: [
      { key: "support.tickets", label: "تیکتینگ", icon: Ticket },
      { key: "support.qc", label: "مدیریت QC", icon: ShieldCheck },
      { key: "support.contact", label: "فرم‌های تماس", icon: Mail },
      { key: "support.rss", label: "فرم‌های RSS", icon: Rss },
    ],
  },
  {
    label: "کنترل پنل",
    items: [
      { key: "panel.ai", label: "هوش مصنوعی و مدل‌ها", icon: Sparkles },
      { key: "panel.voip", label: "تماس صوتی (ویپ)", icon: PhoneCall },
      { key: "panel.tracker", label: "ردیاب و بازاریابی", icon: Megaphone },
      { key: "panel.plans", label: "پلن‌ها و اشتراک", icon: Receipt },
      { key: "panel.settings", label: "تنظیمات و یکپارچه‌سازی", icon: Settings },
      { key: "panel.appearance", label: "مدیریت ظاهری اپلیکیشن", icon: Palette },
      { key: "panel.languages", label: "مدیریت زبان‌ها", icon: Languages },
      { key: "panel.config", label: "کانفیگ اپلیکیشن", icon: Settings },
    ],
  },
  {
    label: "سوپر ادمین",
    items: [
      { key: "super.roles", label: "سطوح دسترسی", icon: ShieldCheck },
      { key: "super.admins", label: "ادمین‌ها", icon: UserCog },
      { key: "super.logs", label: "لاگ عملکرد ادمین‌ها", icon: Activity },
    ],
  },
];

export function getLabel(key: MenuKey): string {
  for (const g of menuGroups) {
    for (const it of g.items) {
      if (it.key === key) return it.label;
      if (it.children) {
        for (const c of it.children) {
          if (c.key === key) return `${it.label} / ${c.label}`;
        }
      }
    }
  }
  return "";
}

export function AdminSidebar({
  active,
  onSelect,
}: {
  active: MenuKey;
  onSelect: (key: MenuKey) => void;
}) {
  return (
    <Sidebar side="right" collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1.5">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-fuchsia-500 text-primary-foreground shadow-lg shadow-primary/25">
            <LayoutDashboard className="h-5 w-5" />
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-sidebar bg-emerald-400" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span>پنل ادمین</span>
            <span className="text-xs text-muted-foreground">سامانه مدیریت</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {menuGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) =>
                  item.children && item.children.length > 0 ? (
                    <Collapsible
                      key={item.key}
                      defaultOpen={active.startsWith(item.key)}
                      className="group/collapsible"
                    >
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton tooltip={item.label}>
                            {item.icon && <item.icon />}
                            <span>{item.label}</span>
                            <ChevronLeft className="mr-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:-rotate-90" />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {item.children.map((child) => (
                              <SidebarMenuSubItem key={child.key}>
                                <SidebarMenuSubButton
                                  isActive={active === child.key}
                                  onClick={() => onSelect(child.key)}
                                  className="cursor-pointer"
                                >
                                  {child.icon && <child.icon />}
                                  <span>{child.label}</span>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  ) : (
                    <SidebarMenuItem key={item.key}>
                      <SidebarMenuButton
                        tooltip={item.label}
                        isActive={active === item.key}
                        onClick={() => onSelect(item.key)}
                      >
                        {item.icon && <item.icon />}
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ),
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <div className="flex items-center gap-2 px-2 py-1.5">
          <Avatar className="h-8 w-8">
            <AvatarFallback>ع‌ر</AvatarFallback>
          </Avatar>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-sm">علی رضایی</span>
            <span className="text-xs text-muted-foreground">سوپر ادمین</span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
