import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { useEffect, useState } from "react";
import { api } from "../api";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  TrendingUp,
  Users,
  Receipt,
  FileText,
  Bot,
  AlertCircle,
} from "lucide-react";

const txByMonth = [
  { month: "آذر", amount: 12_400_000, count: 42 },
  { month: "دی", amount: 18_900_000, count: 61 },
  { month: "بهمن", amount: 22_700_000, count: 78 },
  { month: "اسفند", amount: 31_200_000, count: 96 },
  { month: "فروردین", amount: 28_500_000, count: 84 },
  { month: "اردیبهشت", amount: 41_800_000, count: 119 },
];

const newUsers = [
  { day: "ش", users: 12 },
  { day: "ی", users: 18 },
  { day: "د", users: 9 },
  { day: "س", users: 22 },
  { day: "چ", users: 27 },
  { day: "پ", users: 19 },
  { day: "ج", users: 14 },
];

const DEFAULT_INVOICE_STATUS = [
  { name: "تسویه شده", value: 124, color: "#10b981" },
  { name: "در انتظار", value: 18, color: "#f59e0b" },
  { name: "لغو شده", value: 6, color: "#ef4444" },
];

const DEFAULT_TOP_AGENTS = [
  { name: "حسابدار", purchases: 48 },
  { name: "پشتیبان", purchases: 39 },
  { name: "انباردار", purchases: 27 },
  { name: "بازاریاب", purchases: 18 },
  { name: "حقوقی", purchases: 9 },
];

function invoiceColor(status: string) {
  if (status.includes("تسویه")) return "#10b981";
  if (status.includes("لغو")) return "#ef4444";
  return "#f59e0b";
}

const toFa = (n: number | string) => String(n).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[+d]);

// متادیتای کارت‌ها؛ مقدار از API پر می‌شود (key) و در نبود داده، fallback استفاده می‌شود.
const STAT_META = [
  { key: "users", label: "کاربران", fallback: "—", delta: "", icon: Users, color: "text-blue-500" },
  { key: "customers", label: "مشتریان", fallback: "—", delta: "", icon: Receipt, color: "text-green-500" },
  { key: "tasks", label: "وظایف", fallback: "—", delta: "", icon: FileText, color: "text-purple-500" },
  { key: "agents", label: "ایجنت‌های فعال", fallback: "—", delta: "", icon: Bot, color: "text-orange-500" },
] as const;

const alerts = [
  { type: "warning", text: "۱۸ فاکتور در انتظار تسویه بیش از ۷ روز" },
  { type: "danger", text: "۳ تراکنش ناموفق در ۲۴ ساعت گذشته" },
  { type: "info", text: "۵ ایجنت با توکن کمتر از ۱۰٪" },
];

export function HomeDashboard() {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [invoiceStatus, setInvoiceStatus] = useState(DEFAULT_INVOICE_STATUS);
  const [topAgents, setTopAgents] = useState(DEFAULT_TOP_AGENTS);

  useEffect(() => {
    (async () => {
      try {
        const [u, ag, cu, ta, inv] = await Promise.all([
          api.listUsers({ limit: 1 }),
          api.list<any>("agents"),
          api.list("customers"),
          api.list("tasks"),
          api.list<any>("invoices"),
        ]);
        setCounts({ users: u.total, agents: ag.length, customers: cu.length, tasks: ta.length });

        // وضعیت فاکتورها از داده‌ی واقعی
        if (inv.length) {
          const byStatus: Record<string, number> = {};
          for (const i of inv) byStatus[i.status] = (byStatus[i.status] || 0) + 1;
          setInvoiceStatus(Object.entries(byStatus).map(([name, value]) => ({ name, value, color: invoiceColor(name) })));
        }
        // برترین ایجنت‌ها بر اساس کارهای انجام‌شده
        if (ag.length) {
          setTopAgents(
            [...ag].sort((a, b) => (b.done || 0) - (a.done || 0)).slice(0, 5)
              .map((a) => ({ name: a.name, purchases: a.done || 0 }))
          );
        }
      } catch { /* keep fallback */ }
    })();
  }, []);

  const stats = STAT_META.map((s) => ({
    ...s,
    value: counts[s.key] != null ? toFa(counts[s.key]) : s.fallback,
  }));

  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      <div>
        <h1>خانه</h1>
        <p className="text-sm text-muted-foreground">
          نمای کلی از وضعیت اپلیکیشن
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">{s.label}</span>
                <span className="text-2xl">{s.value}</span>
                {s.delta && (
                  <span className="text-xs text-green-600 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    {s.delta}
                  </span>
                )}
              </div>
              <s.icon className={`h-8 w-8 ${s.color}`} />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>روند تراکنش‌ها (مبلغ به تومان)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={txByMonth}>
                <defs>
                  <linearGradient id="amt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="month" reversed />
                <YAxis tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}م`} />
                <Tooltip
                  formatter={(v: number) => v.toLocaleString() + " تومان"}
                />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="#6366f1"
                  fill="url(#amt)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>وضعیت فاکتورها</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={invoiceStatus}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                >
                  {invoiceStatus.map((e) => (
                    <Cell key={e.name} fill={e.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>کاربران جدید این هفته</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={newUsers}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="day" reversed />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="users"
                  stroke="#10b981"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>پرفروش‌ترین ایجنت‌ها</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={topAgents} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={70} />
                <Tooltip />
                <Bar dataKey="purchases" fill="#f59e0b" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>هشدارها</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {alerts.map((a, i) => (
              <div
                key={i}
                className={`flex items-start gap-2 rounded-md border p-3 text-sm ${
                  a.type === "danger"
                    ? "bg-red-50 border-red-200 text-red-800 dark:bg-red-950/40 dark:text-red-200"
                    : a.type === "warning"
                    ? "bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
                    : "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950/40 dark:text-blue-200"
                }`}
              >
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{a.text}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
