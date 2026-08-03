import { useEffect, useState } from "react";
import { api } from "../api";
import { CrudDataGrid, fieldsFromColumns } from "./crud-grid";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { DataGrid, type GridColumn } from "./data-grid";
import { Download, Mail, UserCheck, UserX } from "lucide-react";
import { toast } from "sonner";

type Subscription = {
  id: string;
  email: string;
  name: string;
  source: string;
  topics: string;
  status: "فعال" | "لغو شده" | "تأیید نشده";
  subscribedAt: string;
  unsubscribedAt?: string;
};

const initialSubs: Subscription[] = [
  { id: "NL-3001", email: "ali.h@example.com", name: "علی حسینی", source: "صفحه اصلی", topics: "اخبار، تخفیف‌ها", status: "فعال", subscribedAt: "2026-02-12" },
  { id: "NL-3002", email: "z.ghasemi@example.com", name: "زهرا قاسمی", source: "بلاگ", topics: "اخبار", status: "فعال", subscribedAt: "2026-02-22" },
  { id: "NL-3003", email: "m.karimi@example.com", name: "محمد کریمی", source: "پاپ‌آپ", topics: "تخفیف‌ها", status: "تأیید نشده", subscribedAt: "2026-03-04" },
  { id: "NL-3004", email: "negar.m@example.com", name: "نگار موسوی", source: "فوتر", topics: "اخبار، محصولات جدید", status: "فعال", subscribedAt: "2026-03-15" },
  { id: "NL-3005", email: "reza@example.com", name: "رضا نجفی", source: "صفحه اصلی", topics: "اخبار", status: "لغو شده", subscribedAt: "2026-01-10", unsubscribedAt: "2026-04-05" },
  { id: "NL-3006", email: "maryam@example.com", name: "مریم صادقی", source: "بلاگ", topics: "محصولات جدید", status: "فعال", subscribedAt: "2026-04-02" },
  { id: "NL-3007", email: "hossein.r@example.com", name: "حسین رحیمی", source: "پاپ‌آپ", topics: "اخبار، تخفیف‌ها، محصولات جدید", status: "فعال", subscribedAt: "2026-04-18" },
  { id: "NL-3008", email: "sepideh@example.com", name: "سپیده طاهری", source: "فوتر", topics: "تخفیف‌ها", status: "تأیید نشده", subscribedAt: "2026-05-01" },
];

const columns: GridColumn[] = [
  { field: "id", headerName: "شناسه", filterType: "text", width: 120 },
  { field: "email", headerName: "ایمیل", filterType: "text" },
  { field: "name", headerName: "نام", filterType: "text" },
  { field: "source", headerName: "منبع عضویت", filterType: "set" },
  { field: "topics", headerName: "موضوعات", filterType: "text", flex: 2 },
  { field: "status", headerName: "وضعیت", filterType: "set" },
  { field: "subscribedAt", headerName: "تاریخ عضویت", filterType: "date" },
  { field: "unsubscribedAt", headerName: "تاریخ لغو", filterType: "date" },
];

function exportCSV(rows: Subscription[]) {
  const headers = [
    "شناسه",
    "ایمیل",
    "نام",
    "منبع عضویت",
    "موضوعات",
    "وضعیت",
    "تاریخ عضویت",
    "تاریخ لغو",
  ];
  const lines = [headers.join(",")];
  for (const r of rows) {
    const cells = [
      r.id,
      r.email,
      r.name,
      r.source,
      `"${r.topics}"`,
      r.status,
      r.subscribedAt,
      r.unsubscribedAt ?? "",
    ];
    lines.push(cells.join(","));
  }
  const blob = new Blob(["﻿" + lines.join("\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `newsletter-subscriptions-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  toast.success("فایل CSV دانلود شد");
}

function exportEmails(rows: Subscription[]) {
  const emails = rows
    .filter((r) => r.status === "فعال")
    .map((r) => r.email)
    .join("\n");
  const blob = new Blob(["﻿" + emails], {
    type: "text/plain;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `active-emails-${new Date().toISOString().slice(0, 10)}.txt`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  toast.success("لیست ایمیل‌های فعال دانلود شد");
}

export function NewsletterSubscriptionsPage() {
  const [subs, setSubs] = useState<Subscription[]>([]);

  useEffect(() => {
    (async () => {
      try { setSubs(await api.list<Subscription>("newsletter")); } // خالی هم خالی
      catch { setSubs(initialSubs); }
    })();
  }, []);

  const active = subs.filter((s) => s.status === "فعال").length;
  const cancelled = subs.filter((s) => s.status === "لغو شده").length;
  const unverified = subs.filter((s) => s.status === "تأیید نشده").length;

  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>عضویت‌های خبرنامه</h1>
          <p className="text-sm text-muted-foreground">
            مدیریت درخواست‌های عضویت در newsletter سایت
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => exportEmails(subs)}
          >
            <Mail className="h-4 w-4 ml-1" />
            خروجی ایمیل‌های فعال
          </Button>
          <Button size="sm" onClick={() => exportCSV(subs)}>
            <Download className="h-4 w-4 ml-1" />
            خروجی CSV
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">عضو فعال</span>
              <span className="text-2xl">{active}</span>
            </div>
            <UserCheck className="h-8 w-8 text-green-500" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">
                تأیید نشده
              </span>
              <span className="text-2xl">{unverified}</span>
            </div>
            <Mail className="h-8 w-8 text-amber-500" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">لغو شده</span>
              <span className="text-2xl">{cancelled}</span>
            </div>
            <UserX className="h-8 w-8 text-red-500" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>لیست عضویت‌ها</span>
            <Badge variant="secondary">{subs.length} رکورد</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CrudDataGrid embedded apiKind="data" collection="newsletter" columns={columns} fields={fieldsFromColumns(columns)} />
        </CardContent>
      </Card>
    </div>
  );
}
