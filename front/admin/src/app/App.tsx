import { useEffect, useState } from "react";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "./components/ui/sidebar";
import { Separator } from "./components/ui/separator";
import { AdminSidebar, getLabel, type MenuKey } from "./components/admin-sidebar";
import { AdminContent } from "./components/admin-content";
import { DetailView, type Detail } from "./components/detail-view";
import { UserDetailView } from "./components/user-detail-view";
import { AgentDefSettings } from "./components/agent-def-settings";
import { AgentDetailView } from "./components/agent-detail-view";
import { BusinessDetailView } from "./components/business-detail-view";
import { CustomerDetailView } from "./components/customer-detail-view";
import { WalletDetailView } from "./components/wallet-detail-view";
import { TransactionDetailView } from "./components/transaction-detail-view";
import { InvoiceDetailView } from "./components/invoice-detail-view";
import { MarketerAgentDetail } from "./components/marketer-agent-detail";
import { TicketChatView } from "./components/ticket-chat-view";
import { getAgentTypeFromKey } from "./components/agent-management-config";
import { Toaster } from "./components/ui/sonner";
import { ThemeToggle } from "./components/theme-toggle";
import { Login } from "./Login";
import { api, getToken, setToken, type AuthUser } from "./api";
import { Button } from "./components/ui/button";
import { LogOut } from "lucide-react";

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    document.documentElement.dir = "rtl";
    document.documentElement.lang = "fa";
    (async () => {
      if (getToken()) {
        try {
          const res = await api.me();
          setUser(res.user);
        } catch { setToken(null); }
      }
      setReady(true);
    })();
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground" dir="rtl">
        در حال بارگذاری…
      </div>
    );
  }
  if (!user) return <Login onSuccess={setUser} />;
  return <Dashboard user={user} onLogout={() => { setToken(null); setUser(null); }} />;
}

function Dashboard({ user, onLogout }: { user: AuthUser; onLogout: () => void }) {
  const [active, setActive] = useState<MenuKey>("data.home");
  const [detail, setDetail] = useState<Detail | null>(null);

  const handleSelect = (key: MenuKey) => {
    setActive(key);
    setDetail(null);
  };

  return (
    <div className="size-full" dir="rtl">
      <SidebarProvider>
        <AdminSidebar active={active} onSelect={handleSelect} />
        <SidebarInset>
          <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b bg-background/80 backdrop-blur-md px-3 md:px-4">
            <SidebarTrigger />
            <Separator orientation="vertical" className="h-5" />
            <span className="truncate text-sm text-muted-foreground">
              {getLabel(active)}
              {detail ? " / جزئیات" : ""}
            </span>
            <div className="ms-auto flex items-center gap-2">
              <span className="hidden text-sm text-muted-foreground sm:inline">{user.name || user.username}</span>
              <ThemeToggle />
              <Button variant="ghost" size="icon" onClick={onLogout} title="خروج">
                <LogOut className="size-4" />
              </Button>
            </div>
          </header>
          {detail ? (
            detail.menu === "data.users" ? (
              <UserDetailView user={detail.row} onBack={() => setDetail(null)} />
            ) : detail.menu === "data.agent-defs" ? (
              <AgentDefSettings agent={detail.row} onBack={() => setDetail(null)} />
            ) : detail.menu === "data.agents" ? (
              <AgentDetailView agent={detail.row} onBack={() => setDetail(null)} />
            ) : detail.menu === "data.businesses" ? (
              <BusinessDetailView business={detail.row} onBack={() => setDetail(null)} />
            ) : detail.menu === "data.customers" ? (
              <CustomerDetailView customer={detail.row} onBack={() => setDetail(null)} />
            ) : detail.menu === "data.wallets" ? (
              <WalletDetailView wallet={detail.row} onBack={() => setDetail(null)} />
            ) : detail.menu === "data.transactions" ? (
              <TransactionDetailView tx={detail.row} onBack={() => setDetail(null)} />
            ) : detail.menu === "data.invoices" ? (
              <InvoiceDetailView invoice={detail.row} onBack={() => setDetail(null)} />
            ) : detail.menu === "support.tickets" ? (
              <TicketChatView ticket={detail.row} onBack={() => setDetail(null)} />
            ) : getAgentTypeFromKey(detail.menu) ? (
              <MarketerAgentDetail
                agent={detail.row}
                agentType={getAgentTypeFromKey(detail.menu)!}
                onBack={() => setDetail(null)}
              />
            ) : (
              <DetailView detail={detail} onBack={() => setDetail(null)} />
            )
          ) : (
            <AdminContent
              active={active}
              onRowAction={(menu, row) => setDetail({ menu, row })}
            />
          )}
        </SidebarInset>
      </SidebarProvider>
      <Toaster position="top-center" dir="rtl" />
    </div>
  );
}
