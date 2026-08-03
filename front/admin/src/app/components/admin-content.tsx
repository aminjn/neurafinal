import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { getLabel, type MenuKey } from "./admin-sidebar";
import { DataGrid, type GridColumn } from "./data-grid";
import { AgentDefsPage } from "./agent-defs-page";
import { BusinessesPage } from "./businesses-page";
import { ChatsPage } from "./chats-page";
import { HomeDashboard } from "./home-dashboard";
import { agentTypeConfig, getAgentTypeFromKey } from "./agent-management-config";
import { QcPage } from "./qc-page";
import { ContactRequestsPage } from "./contact-requests-page";
import { NewsletterSubscriptionsPage } from "./newsletter-subscriptions-page";
import { GlobalPromptsPage } from "./global-prompts-page";
import { AdminRolesPage } from "./admin-roles-page";
import { AdminsPage } from "./admins-page";
import { AdminLogsPage } from "./admin-logs-page";
import { LanguagesPage } from "./languages-page";
import { ThemesPage } from "./themes-page";
import { useLiveRows } from "../live-data";
import { AiPage } from "./ai-page";
import { SettingsPage } from "./settings-page";
import { VoipPage } from "./voip-page";
import { TrackerPage } from "./tracker-page";
import { PlansPage } from "./plans-page";
import { CrudDataGrid, fieldsFromColumns, type FormField } from "./crud-grid";

// صفحاتی که ایجاد/ویرایش/حذف دارند
const CRUD_CONFIG: Record<string, { apiKind: "data" | "users"; collection: string; mapRow?: (r: any) => any; fields?: FormField[] }> = {
  "data.users": {
    apiKind: "users",
    collection: "users",
    mapRow: (u: any) => ({ id: u.id, name: u.name || u.username, email: u.email || "", role: u.role, status: u.status, createdAt: String(u.created_at || "").slice(0, 10), credit: 0 }),
    fields: [
      { key: "username", label: "نام کاربری", required: true, createOnly: true },
      { key: "password", label: "رمز عبور", type: "password", required: true, createOnly: true },
      { key: "name", label: "نام" },
      { key: "email", label: "ایمیل" },
      { key: "role", label: "نقش", type: "select", options: [{ value: "user", label: "کاربر" }, { value: "admin", label: "ادمین" }, { value: "superadmin", label: "سوپر‌ادمین" }] },
      { key: "status", label: "وضعیت", type: "select", options: [{ value: "active", label: "فعال" }, { value: "inactive", label: "غیرفعال" }] },
    ],
  },
  "data.customers": { apiKind: "data", collection: "customers" },
  "data.transactions": { apiKind: "data", collection: "transactions" },
  "data.invoices": { apiKind: "data", collection: "invoices" },
  // «کیف پول‌ها» عمداً اینجا نیست: از منبعِ زندهٔ /wallet/all (همهٔ کاربران) خوانده می‌شود، نه
  // کالکشنِ خالیِ documents. حذفِ آن باعث می‌شود گرید فقط‌خواندنی + دکمهٔ افزایشِ/کاهشِ موجودی
  // (WalletDetailView) نمایش داده شود و دکمهٔ بی‌معنیِ «افزودن» حذف شود.
  "support.tickets": { apiKind: "data", collection: "tickets" },
};

type GridDataset = {
  columns: GridColumn[];
  rows: any[];
};

const datasets: Record<string, GridDataset> = {
  "data.users": {
    columns: [
      { field: "name", headerName: "نام", filterType: "text" },
      { field: "email", headerName: "ایمیل", filterType: "text" },
      { field: "role", headerName: "نقش", filterType: "set" },
      { field: "status", headerName: "وضعیت", filterType: "set" },
      { field: "createdAt", headerName: "تاریخ ایجاد", filterType: "date" },
      { field: "credit", headerName: "اعتبار", filterType: "number" },
    ],
    rows: [
      { name: "سارا احمدی", email: "sara@example.com", role: "کاربر", status: "فعال", createdAt: "2026-01-12", credit: 120000 },
      { name: "محمد کریمی", email: "mk@example.com", role: "کاربر", status: "غیرفعال", createdAt: "2026-02-08", credit: 0 },
      { name: "نگار موسوی", email: "negar@example.com", role: "کاربر ویژه", status: "فعال", createdAt: "2025-12-30", credit: 540000 },
      { name: "رضا نجفی", email: "reza@example.com", role: "ادمین", status: "فعال", createdAt: "2025-11-15", credit: 0 },
      { name: "مریم صادقی", email: "maryam@example.com", role: "کاربر", status: "در انتظار", createdAt: "2026-04-02", credit: 50000 },
    ],
  },
  "data.customers": {
    columns: [
      { field: "name", headerName: "نام مشتری", filterType: "text" },
      { field: "contact", headerName: "اطلاعات تماس", filterType: "text" },
      {
        field: "businesses",
        headerName: "بیزینس‌ها",
        filterType: "text",
        flex: 2,
        valueFormatter: (p: any) =>
          Array.isArray(p.value) ? p.value.join("، ") : "",
      },
      { field: "createdAt", headerName: "تاریخ ایجاد", filterType: "date" },
      { field: "lastInteraction", headerName: "آخرین تعامل", filterType: "date" },
    ],
    rows: [
      { id: "C1", name: "علی حسینی", contact: "0912-1110001 · ali.h@example.com", businesses: ["فروشگاه آلفا", "خدمات گاما"], createdAt: "2026-02-20", lastInteraction: "2026-05-06", phone: "0912-1110001", email: "ali.h@example.com", joinedAt: "2026-02-20", totalOrders: 6, totalSpent: 2400000, status: "فعال" },
      { id: "C2", name: "زهرا قاسمی", contact: "0912-1110002 · z.ghasemi@example.com", businesses: ["فروشگاه آلفا"], createdAt: "2026-03-04", lastInteraction: "2026-05-08", phone: "0912-1110002", email: "z.ghasemi@example.com", joinedAt: "2026-03-04", totalOrders: 3, totalSpent: 980000, status: "فعال" },
      { id: "C3", name: "محمد کریمی", contact: "0912-1110003 · m.karimi@example.com", businesses: ["انبار بتا"], createdAt: "2026-03-22", lastInteraction: "2026-04-11", phone: "0912-1110003", email: "m.karimi@example.com", joinedAt: "2026-03-22", totalOrders: 1, totalSpent: 120000, status: "غیرفعال" },
      { id: "C4", name: "نگار موسوی", contact: "0912-1110004 · negar.m@example.com", businesses: ["خدمات گاما", "فروشگاه آلفا"], createdAt: "2026-04-15", lastInteraction: "2026-05-07", phone: "0912-1110004", email: "negar.m@example.com", joinedAt: "2026-04-15", totalOrders: 9, totalSpent: 5200000, status: "فعال" },
      { id: "C5", name: "رضا نجفی", contact: "0912-1110005 · reza@example.com", businesses: ["خدمات گاما"], createdAt: "2026-04-28", lastInteraction: "2026-05-01", phone: "0912-1110005", email: "reza@example.com", joinedAt: "2026-04-28", totalOrders: 2, totalSpent: 380000, status: "فعال" },
    ],
  },
  "data.transactions": {
    columns: [
      { field: "id", headerName: "شناسه", filterType: "text", width: 120 },
      { field: "user", headerName: "کاربر", filterType: "text" },
      { field: "type", headerName: "نوع", filterType: "set" },
      { field: "amount", headerName: "مبلغ (تومان)", filterType: "number" },
      { field: "method", headerName: "روش پرداخت", filterType: "set" },
      { field: "status", headerName: "وضعیت", filterType: "set" },
      { field: "date", headerName: "تاریخ", filterType: "date" },
      { field: "ref", headerName: "کد پیگیری", filterType: "text" },
    ],
    rows: [
      { id: "TX-3001", user: "سارا احمدی", type: "شارژ کیف پول", amount: 1500000, method: "آنلاین", status: "موفق", date: "2026-04-02", ref: "A8F12C" },
      { id: "TX-3002", user: "محمد کریمی", type: "خرید ایجنت", amount: 1200000, method: "کیف پول", status: "موفق", date: "2026-04-08", ref: "B91DDA" },
      { id: "TX-3003", user: "نگار موسوی", type: "بازگشت وجه", amount: 200000, method: "آنلاین", status: "در انتظار", date: "2026-04-15", ref: "C30FE7" },
      { id: "TX-3004", user: "رضا نجفی", type: "خرید ایجنت", amount: 980000, method: "آنلاین", status: "ناموفق", date: "2026-04-22", ref: "D77AA1" },
      { id: "TX-3005", user: "مریم صادقی", type: "شارژ توکن", amount: 350000, method: "کیف پول", status: "موفق", date: "2026-04-30", ref: "E12B33" },
      { id: "TX-3006", user: "علی حسینی", type: "خرید", amount: 480000, method: "آنلاین", status: "موفق", date: "2026-05-04", ref: "F44CC2" },
    ],
  },
  "data.invoices": {
    columns: [
      { field: "id", headerName: "شماره فاکتور", filterType: "text", width: 140 },
      { field: "business", headerName: "بیزینس", filterType: "set" },
      { field: "createdAt", headerName: "تاریخ ایجاد", filterType: "date" },
      { field: "agent", headerName: "ایجنت خریداری‌شده", filterType: "set" },
      { field: "grossAmount", headerName: "مبلغ خالص", filterType: "number" },
      { field: "finalAmount", headerName: "مبلغ نهایی", filterType: "number" },
      { field: "paymentMethod", headerName: "نحوه پرداخت", filterType: "set" },
      { field: "settledAt", headerName: "تاریخ تسویه", filterType: "date" },
      { field: "status", headerName: "وضعیت", filterType: "set" },
    ],
    rows: [
      { id: "INV-5001", business: "فروشگاه آلفا", createdAt: "2026-02-15", agent: "حسابدار", grossAmount: 1500000, finalAmount: 1200000, paymentMethod: "آنلاین", settledAt: "2026-02-15", status: "تسویه شده" },
      { id: "INV-5002", business: "انبار بتا", createdAt: "2026-02-20", agent: "انباردار", grossAmount: 600000, finalAmount: 480000, paymentMethod: "کیف پول", settledAt: "2026-02-20", status: "تسویه شده" },
      { id: "INV-5003", business: "خدمات گاما", createdAt: "2026-03-08", agent: "پشتیبان", grossAmount: 1400000, finalAmount: 1100000, paymentMethod: "آنلاین", settledAt: "2026-03-09", status: "تسویه شده" },
      { id: "INV-5004", business: "فروشگاه آلفا", createdAt: "2026-04-01", agent: "حسابدار", grossAmount: 1500000, finalAmount: 1500000, paymentMethod: "آنلاین", settledAt: "", status: "در انتظار پرداخت" },
      { id: "INV-5005", business: "خدمات گاما", createdAt: "2026-04-12", agent: "بازاریاب", grossAmount: 900000, finalAmount: 720000, paymentMethod: "کیف پول", settledAt: "2026-04-12", status: "تسویه شده" },
    ],
  },
  "data.wallets": {
    columns: [
      { field: "user", headerName: "نام کاربر", filterType: "text" },
      { field: "email", headerName: "ایمیل", filterType: "text" },
      { field: "balance", headerName: "موجودی (تومان)", filterType: "number" },
      { field: "totalCharged", headerName: "مجموع شارژ", filterType: "number" },
      { field: "totalSpent", headerName: "مجموع مصرف", filterType: "number" },
      { field: "status", headerName: "وضعیت", filterType: "set" },
      // مقدارِ آخرین تراکنش از سرور به‌صورتِ رشتهٔ شمسیِ آماده (nowFa) می‌آید؛ اگر filterType=date
      // باشد گرید دوباره آن را از میلادی به شمسی تبدیل می‌کند و سال را خراب می‌کند (۷۸۴/…). text نگه‌اش می‌داریم.
      { field: "lastUpdate", headerName: "آخرین تراکنش", filterType: "text" },
    ],
    // ردیف‌ها از /wallet/all (زنده) می‌آیند؛ نمونهٔ فیک نگه داشته نمی‌شود.
    rows: [],
  },
  "data.agents": {
    columns: [
      { field: "name", headerName: "نام ایجنت", filterType: "text" },
      { field: "definition", headerName: "نام تعریف ایجنت", filterType: "set" },
      { field: "createdAt", headerName: "تاریخ ایجاد", filterType: "date" },
      { field: "remainingTokens", headerName: "توکن باقیمانده", filterType: "number" },
      { field: "business", headerName: "بیزینس", filterType: "set" },
    ],
    rows: [
      { name: "حسابدار فروشگاه من", definition: "حسابدار", createdAt: "2026-02-15", remainingTokens: 124500, business: "فروشگاه آلفا" },
      { name: "انباردار اصلی", definition: "انباردار", createdAt: "2026-02-20", remainingTokens: 58200, business: "انبار بتا" },
      { name: "پشتیبان آنلاین", definition: "پشتیبان", createdAt: "2026-03-08", remainingTokens: 0, business: "خدمات گاما" },
      { name: "حسابدار فرعی", definition: "حسابدار", createdAt: "2026-04-01", remainingTokens: 220000, business: "فروشگاه آلفا" },
      { name: "بازاریاب کمپین بهار", definition: "بازاریاب", createdAt: "2026-04-12", remainingTokens: 9800, business: "خدمات گاما" },
    ],
  },
  "data.businesses": {
    columns: [
      { field: "name", headerName: "نام بیزینس", filterType: "text" },
      { field: "owner", headerName: "صاحب", filterType: "text" },
      { field: "agent", headerName: "ایجنت", filterType: "set" },
      { field: "createdAt", headerName: "تاریخ ایجاد", filterType: "date" },
      { field: "users", headerName: "تعداد کاربران", filterType: "number" },
    ],
    rows: [
      { name: "فروشگاه آلفا", owner: "سارا احمدی", agent: "حسابدار", createdAt: "2026-02-12", users: 12 },
      { name: "انبار بتا", owner: "محمد کریمی", agent: "انباردار", createdAt: "2026-02-18", users: 7 },
      { name: "خدمات گاما", owner: "نگار موسوی", agent: "پشتیبان", createdAt: "2026-03-05", users: 24 },
    ],
  },
  "support.tickets": {
    columns: [
      { field: "id", headerName: "شناسه", filterType: "text", width: 110 },
      { field: "subject", headerName: "موضوع", filterType: "text" },
      { field: "user", headerName: "کاربر", filterType: "text" },
      { field: "priority", headerName: "اولویت", filterType: "set" },
      { field: "status", headerName: "وضعیت", filterType: "set" },
      { field: "createdAt", headerName: "تاریخ", filterType: "date" },
    ],
    rows: [
      { id: "#1024", subject: "مشکل در ورود", user: "سارا احمدی", priority: "بالا", status: "باز", createdAt: "2026-04-20" },
      { id: "#1025", subject: "خطای پرداخت", user: "محمد کریمی", priority: "بحرانی", status: "بسته", createdAt: "2026-04-22" },
      { id: "#1026", subject: "درخواست بازگشت وجه", user: "نگار موسوی", priority: "متوسط", status: "در حال بررسی", createdAt: "2026-05-01" },
      { id: "#1027", subject: "مشکل آپلود فایل", user: "رضا نجفی", priority: "پایین", status: "باز", createdAt: "2026-05-03" },
    ],
  },
};

export function AdminContent({
  active,
  onRowAction,
}: {
  active: MenuKey;
  onRowAction: (menu: MenuKey, row: any) => void;
}) {
  const title = getLabel(active) || "داشبورد";
  const agentType = getAgentTypeFromKey(active);
  const data: GridDataset | undefined = agentType
    ? {
        columns: agentTypeConfig[agentType].agentsColumns,
        rows: agentTypeConfig[agentType].agents,
      }
    : datasets[active];

  // دیتای زنده از بک‌اند (در صورت وجود نگاشت برای این بخش)
  const live = useLiveRows(active);
  const gridRows = live.hasSource && live.rows ? live.rows : data?.rows;

  if (active === "data.home") {
    return <HomeDashboard />;
  }

  if (active === "data.agent-defs") {
    return (
      <AgentDefsPage onRowAction={(row) => onRowAction(active, row)} />
    );
  }

  if (active === "data.businesses") {
    return (
      <BusinessesPage onRowAction={(row) => onRowAction(active, row)} />
    );
  }

  if (active === "data.chats") {
    return <ChatsPage />;
  }

  if (active === "support.qc") {
    return <QcPage />;
  }

  if (active === "support.contact") {
    return <ContactRequestsPage />;
  }

  if (active === "support.rss") {
    return <NewsletterSubscriptionsPage />;
  }

  if (active === "panel.ai") {
    return <AiPage />;
  }

  if (active === "panel.settings") {
    return <SettingsPage />;
  }

  if (active === "panel.voip") {
    return <VoipPage />;
  }

  if (active === "panel.tracker") {
    return <TrackerPage />;
  }

  if (active === "panel.plans") {
    return <PlansPage />;
  }

  if (active === "panel.config") {
    return <GlobalPromptsPage />;
  }

  if (active === "panel.languages") {
    return <LanguagesPage />;
  }

  if (active === "panel.appearance") {
    return <ThemesPage />;
  }

  if (active === "super.roles") {
    return <AdminRolesPage />;
  }

  if (active === "super.admins") {
    return <AdminsPage />;
  }

  if (active === "super.logs") {
    return <AdminLogsPage />;
  }

  // صفحات دارای ایجاد/ویرایش/حذف
  const crud = CRUD_CONFIG[active];
  if (crud && data) {
    return (
      <CrudDataGrid
        title={title}
        apiKind={crud.apiKind}
        collection={crud.collection}
        columns={data.columns}
        mapRow={crud.mapRow}
        fields={crud.fields ?? fieldsFromColumns(data.columns)}
        onRowAction={(row) => onRowAction(active, row)}
      />
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>{title}</h1>
          <p className="text-sm text-muted-foreground">
            مدیریت و مشاهده اطلاعات این بخش
          </p>
        </div>
        <Badge variant="secondary">{active}</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          {data ? (
            live.loading ? (
              <div className="flex h-48 items-center justify-center text-muted-foreground">در حال بارگذاری…</div>
            ) : (
              <DataGrid
                rowData={gridRows}
                columnDefs={data.columns}
                onRowAction={(row) => onRowAction(active, row)}
              />
            )
          ) : (
            <div className="flex h-48 items-center justify-center rounded-md border border-dashed text-muted-foreground">
              محتوای بخش «{title}» در اینجا نمایش داده می‌شود.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
