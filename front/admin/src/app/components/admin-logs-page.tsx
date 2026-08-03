import { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { DataGrid, type GridColumn } from "./data-grid";
import { Eye, Plus, Pencil, Trash2 } from "lucide-react";

type ActionType = "خواندن" | "ایجاد" | "آپدیت" | "حذف";

type AdminLog = {
  id: string;
  admin: string;
  role: string;
  action: ActionType;
  resource: string;
  target: string;
  ip: string;
  status: "موفق" | "ناموفق";
  timestamp: string;
};

const DEFAULT_LOGS: AdminLog[] = [
  { id: "LG-50001", admin: "علی رضایی", role: "ادمین کل", action: "خواندن", resource: "کاربران", target: "U-1004", ip: "10.20.1.5", status: "موفق", timestamp: "2026-05-11 09:12:04" },
  { id: "LG-50002", admin: "مریم احمدی", role: "ادمین کل", action: "آپدیت", resource: "بیزینس‌ها", target: "BZ-204 (فروشگاه آلفا)", ip: "10.20.1.7", status: "موفق", timestamp: "2026-05-11 09:35:21" },
  { id: "LG-50003", admin: "حسین رحیمی", role: "ادمین پشتیبانی", action: "آپدیت", resource: "تیکت", target: "TK-1287", ip: "10.20.1.12", status: "موفق", timestamp: "2026-05-11 10:02:55" },
  { id: "LG-50004", admin: "نگار موسوی", role: "ادمین پشتیبانی", action: "ایجاد", resource: "پاسخ تیکت", target: "TK-1290", ip: "10.20.1.13", status: "موفق", timestamp: "2026-05-11 10:18:11" },
  { id: "LG-50005", admin: "زهرا قاسمی", role: "ادمین مالی", action: "خواندن", resource: "فاکتورها", target: "INV-9921", ip: "10.20.1.20", status: "موفق", timestamp: "2026-05-11 10:31:48" },
  { id: "LG-50006", admin: "زهرا قاسمی", role: "ادمین مالی", action: "آپدیت", resource: "فاکتورها", target: "INV-9921", ip: "10.20.1.20", status: "موفق", timestamp: "2026-05-11 10:34:02" },
  { id: "LG-50007", admin: "محمد کریمی", role: "ادمین محتوا", action: "ایجاد", resource: "پرامپت گلوبال", target: "P-system-12", ip: "10.20.1.31", status: "موفق", timestamp: "2026-05-11 10:55:39" },
  { id: "LG-50008", admin: "محمد کریمی", role: "ادمین محتوا", action: "حذف", resource: "پرامپت ایجنت", target: "P-marketer-04", ip: "10.20.1.31", status: "موفق", timestamp: "2026-05-11 11:08:17" },
  { id: "LG-50009", admin: "علی رضایی", role: "ادمین کل", action: "حذف", resource: "کاربران", target: "U-1099", ip: "10.20.1.5", status: "موفق", timestamp: "2026-05-11 11:21:00" },
  { id: "LG-50010", admin: "حسین رحیمی", role: "ادمین پشتیبانی", action: "خواندن", resource: "QC", target: "QC-441", ip: "10.20.1.12", status: "موفق", timestamp: "2026-05-11 11:42:36" },
  { id: "LG-50011", admin: "نگار موسوی", role: "ادمین پشتیبانی", action: "آپدیت", resource: "درخواست تماس", target: "CR-2003", ip: "10.20.1.13", status: "موفق", timestamp: "2026-05-11 12:00:14" },
  { id: "LG-50012", admin: "مریم احمدی", role: "ادمین کل", action: "ایجاد", resource: "ادمین جدید", target: "AD-006", ip: "10.20.1.7", status: "موفق", timestamp: "2026-05-11 12:15:51" },
  { id: "LG-50013", admin: "علی رضایی", role: "ادمین کل", action: "آپدیت", resource: "سطح دسترسی", target: "AR-002", ip: "10.20.1.5", status: "موفق", timestamp: "2026-05-11 12:33:09" },
  { id: "LG-50014", admin: "زهرا قاسمی", role: "ادمین مالی", action: "خواندن", resource: "تراکنش‌ها", target: "TR-7782", ip: "10.20.1.20", status: "موفق", timestamp: "2026-05-11 13:01:47" },
  { id: "LG-50015", admin: "محمد کریمی", role: "ادمین محتوا", action: "آپدیت", resource: "تعریف ایجنت", target: "AGT-marketer", ip: "10.20.1.31", status: "ناموفق", timestamp: "2026-05-11 13:22:30" },
  { id: "LG-50016", admin: "حسین رحیمی", role: "ادمین پشتیبانی", action: "آپدیت", resource: "وضعیت تیکت", target: "TK-1295", ip: "10.20.1.12", status: "موفق", timestamp: "2026-05-11 13:48:08" },
  { id: "LG-50017", admin: "نگار موسوی", role: "ادمین پشتیبانی", action: "خواندن", resource: "خبرنامه", target: "NL-3007", ip: "10.20.1.13", status: "موفق", timestamp: "2026-05-11 14:05:22" },
  { id: "LG-50018", admin: "علی رضایی", role: "ادمین کل", action: "خواندن", resource: "لاگ ادمین‌ها", target: "-", ip: "10.20.1.5", status: "موفق", timestamp: "2026-05-11 14:30:55" },
];

const actionStyles: Record<ActionType, string> = {
  خواندن: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  ایجاد: "bg-green-500/15 text-green-600 dark:text-green-400",
  آپدیت: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  حذف: "bg-red-500/15 text-red-600 dark:text-red-400",
};

const actionIcons: Record<ActionType, typeof Eye> = {
  خواندن: Eye,
  ایجاد: Plus,
  آپدیت: Pencil,
  حذف: Trash2,
};

function ActionBadge({ value }: { value: ActionType }) {
  const Icon = actionIcons[value];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs ${actionStyles[value]}`}
    >
      <Icon className="h-3 w-3" />
      {value}
    </span>
  );
}

const columns: GridColumn[] = [
  { field: "id", headerName: "شناسه لاگ", filterType: "text", width: 130 },
  { field: "timestamp", headerName: "زمان", filterType: "date", width: 180 },
  { field: "admin", headerName: "ادمین", filterType: "set" },
  { field: "role", headerName: "سطح دسترسی", filterType: "set" },
  {
    field: "action",
    headerName: "نوع عملیات",
    filterType: "set",
    width: 130,
    cellRenderer: (p: { value: ActionType }) => <ActionBadge value={p.value} />,
  },
  { field: "resource", headerName: "موجودیت", filterType: "set" },
  { field: "target", headerName: "هدف", filterType: "text", flex: 2 },
  { field: "ip", headerName: "IP", filterType: "text", width: 130 },
  { field: "status", headerName: "وضعیت", filterType: "set", width: 110 },
];

export function AdminLogsPage() {
  const [logs, setLogs] = useState<AdminLog[]>(DEFAULT_LOGS);

  useEffect(() => {
    (async () => {
      try {
        const r = await api.listLogs({ limit: 200 });
        if (r.items?.length) setLogs(r.items as AdminLog[]);
      } catch { /* keep fallback */ }
    })();
  }, []);

  const counts = useMemo(() => {
    const c: Record<ActionType, number> = {
      خواندن: 0,
      ایجاد: 0,
      آپدیت: 0,
      حذف: 0,
    };
    for (const l of logs) if (c[l.action] != null) c[l.action] += 1;
    return c;
  }, [logs]);

  const stats: { label: string; value: number; action: ActionType }[] = [
    { label: "خواندن", value: counts["خواندن"], action: "خواندن" },
    { label: "ایجاد", value: counts["ایجاد"], action: "ایجاد" },
    { label: "آپدیت", value: counts["آپدیت"], action: "آپدیت" },
    { label: "حذف", value: counts["حذف"], action: "حذف" },
  ];

  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>لاگ عملکرد ادمین‌ها</h1>
          <p className="text-sm text-muted-foreground">
            ثبت کامل عملیات ادمین‌ها در پنل: خواندن، ایجاد، آپدیت و حذف
          </p>
        </div>
        <Badge variant="secondary">{logs.length} رکورد</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {stats.map((s) => {
          const Icon = actionIcons[s.action];
          return (
            <Card key={s.action}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground">
                    {s.label}
                  </span>
                  <span className="text-2xl">{s.value}</span>
                </div>
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-md ${actionStyles[s.action]}`}
                >
                  <Icon className="h-5 w-5" />
                </span>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>جدول لاگ‌ها</CardTitle>
        </CardHeader>
        <CardContent>
          <DataGrid rowData={logs} columnDefs={columns} />
        </CardContent>
      </Card>
    </div>
  );
}
