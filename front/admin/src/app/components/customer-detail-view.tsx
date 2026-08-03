import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { ArrowRight } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { DataGrid, type GridColumn } from "./data-grid";
import { ChatView, type ChatRecord } from "./chat-view";

export type Customer = {
  id: string;
  name: string;
  phone: string;
  email: string;
  joinedAt: string;
  totalOrders: number;
  totalSpent: number;
  status: "فعال" | "غیرفعال";
};

const businessCols: GridColumn[] = [
  { field: "name", headerName: "نام بیزینس", filterType: "text" },
  { field: "industry", headerName: "صنعت", filterType: "set" },
  { field: "firstInteraction", headerName: "اولین تعامل", filterType: "date" },
  { field: "lastInteraction", headerName: "آخرین تعامل", filterType: "date" },
  { field: "interactionsCount", headerName: "تعداد تعاملات", filterType: "number" },
];

const businessRows = [
  { name: "فروشگاه آلفا", industry: "خرده‌فروشی", firstInteraction: "2026-02-22", lastInteraction: "2026-05-06", interactionsCount: 14 },
  { name: "خدمات گاما", industry: "خدمات", firstInteraction: "2026-03-10", lastInteraction: "2026-04-28", interactionsCount: 5 },
];

const agentCols: GridColumn[] = [
  { field: "name", headerName: "نام ایجنت", filterType: "text" },
  { field: "definition", headerName: "تعریف", filterType: "set" },
  { field: "business", headerName: "بیزینس", filterType: "set" },
  { field: "messages", headerName: "تعداد پیام", filterType: "number" },
  { field: "lastChat", headerName: "آخرین چت", filterType: "date" },
];

const agentRows = [
  { name: "پشتیبان آنلاین", definition: "پشتیبان", business: "فروشگاه آلفا", messages: 32, lastChat: "2026-05-06" },
  { name: "حسابدار فروشگاه من", definition: "حسابدار", business: "فروشگاه آلفا", messages: 4, lastChat: "2026-04-19" },
  { name: "پشتیبان آنلاین", definition: "پشتیبان", business: "خدمات گاما", messages: 11, lastChat: "2026-04-28" },
];

const chatCols: GridColumn[] = [
  { field: "id", headerName: "شناسه", filterType: "text", width: 120 },
  { field: "agentName", headerName: "ایجنت", filterType: "set" },
  { field: "business", headerName: "بیزینس", filterType: "set" },
  { field: "lastMessage", headerName: "آخرین پیام", filterType: "text", flex: 2 },
  { field: "messageCount", headerName: "تعداد پیام", filterType: "number" },
  { field: "startedAt", headerName: "شروع", filterType: "date" },
];

const chatRows: (ChatRecord & { business: string })[] = [
  { id: "CH-701", participant: "", participantType: "مشتری", agentName: "پشتیبان آنلاین", business: "فروشگاه آلفا", lastMessage: "زمان تحویل سفارش من چقدره؟", messageCount: 8, startedAt: "2026-04-12" },
  { id: "CH-702", participant: "", participantType: "مشتری", agentName: "حسابدار فروشگاه من", business: "فروشگاه آلفا", lastMessage: "صورت حساب آخرم رو می‌خوام", messageCount: 4, startedAt: "2026-04-19" },
  { id: "CH-703", participant: "", participantType: "مشتری", agentName: "پشتیبان آنلاین", business: "خدمات گاما", lastMessage: "ممنون از پاسخ‌گویی", messageCount: 11, startedAt: "2026-04-28" },
];

const txCols: GridColumn[] = [
  { field: "id", headerName: "شناسه", filterType: "text", width: 120 },
  { field: "type", headerName: "نوع", filterType: "set" },
  { field: "business", headerName: "بیزینس", filterType: "set" },
  { field: "amount", headerName: "مبلغ (تومان)", filterType: "number" },
  { field: "status", headerName: "وضعیت", filterType: "set" },
  { field: "date", headerName: "تاریخ", filterType: "date" },
];

const txRows = [
  { id: "TX-2001", type: "خرید", business: "فروشگاه آلفا", amount: 480000, status: "موفق", date: "2026-03-12" },
  { id: "TX-2015", type: "خرید", business: "فروشگاه آلفا", amount: 120000, status: "موفق", date: "2026-04-02" },
  { id: "TX-2042", type: "خرید", business: "خدمات گاما", amount: 1250000, status: "در انتظار", date: "2026-04-25" },
  { id: "TX-2050", type: "بازگشت", business: "فروشگاه آلفا", amount: 80000, status: "موفق", date: "2026-04-30" },
];

const logCols: GridColumn[] = [
  { field: "time", headerName: "زمان", filterType: "date" },
  { field: "action", headerName: "عملیات", filterType: "set" },
  { field: "target", headerName: "هدف", filterType: "text" },
  { field: "ip", headerName: "IP", filterType: "text" },
  { field: "result", headerName: "نتیجه", filterType: "set" },
];

const logRows = [
  { time: "2026-05-08", action: "ورود به اپلیکیشن", target: "-", ip: "5.232.10.4", result: "موفق" },
  { time: "2026-05-06", action: "ثبت سفارش", target: "ORD-1042", ip: "5.232.10.4", result: "موفق" },
  { time: "2026-04-30", action: "درخواست بازگشت وجه", target: "TX-2050", ip: "5.232.10.4", result: "موفق" },
  { time: "2026-04-28", action: "چت با ایجنت", target: "پشتیبان آنلاین", ip: "84.12.9.71", result: "موفق" },
];

export function CustomerDetailView({
  customer,
  onBack,
}: {
  customer: Customer;
  onBack: () => void;
}) {
  const [openChat, setOpenChat] = useState<ChatRecord | null>(null);

  if (openChat) {
    return <ChatView chat={openChat} onBack={() => setOpenChat(null)} />;
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowRight className="h-4 w-4" />
          </Button>
          <div>
            <h1>مدیریت مشتری — {customer.name}</h1>
            <p className="text-sm text-muted-foreground">
              عضویت از {customer.joinedAt}
            </p>
          </div>
        </div>
        <Badge variant={customer.status === "فعال" ? "default" : "secondary"}>
          {customer.status}
        </Badge>
      </div>

      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">اطلاعات</TabsTrigger>
          <TabsTrigger value="businesses">بیزینس‌های مرتبط</TabsTrigger>
          <TabsTrigger value="agents">ایجنت‌ها</TabsTrigger>
          <TabsTrigger value="chats">سابقه چت‌ها</TabsTrigger>
          <TabsTrigger value="finance">مالی</TabsTrigger>
          <TabsTrigger value="logs">لاگ عملیات</TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <Card>
            <CardHeader>
              <CardTitle>اطلاعات مشتری</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label className="text-xs text-muted-foreground">نام</Label>
                <Input value={customer.name} disabled />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs text-muted-foreground">تماس</Label>
                <Input value={customer.phone} disabled />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs text-muted-foreground">ایمیل</Label>
                <Input value={customer.email} disabled />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs text-muted-foreground">تعداد سفارش</Label>
                <Input value={String(customer.totalOrders)} disabled />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs text-muted-foreground">مجموع خرید (تومان)</Label>
                <Input value={String(customer.totalSpent)} disabled />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs text-muted-foreground">عضویت از</Label>
                <Input value={customer.joinedAt} disabled />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="businesses">
          <Card>
            <CardHeader>
              <CardTitle>بیزینس‌های مرتبط با مشتری</CardTitle>
            </CardHeader>
            <CardContent>
              <DataGrid rowData={businessRows} columnDefs={businessCols} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agents">
          <Card>
            <CardHeader>
              <CardTitle>ایجنت‌هایی که مشتری با آنها تعامل داشته</CardTitle>
            </CardHeader>
            <CardContent>
              <DataGrid rowData={agentRows} columnDefs={agentCols} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chats">
          <Card>
            <CardHeader>
              <CardTitle>سابقه چت‌های مشتری</CardTitle>
            </CardHeader>
            <CardContent>
              <DataGrid
                rowData={chatRows.map((r) => ({ ...r, participant: customer.name }))}
                columnDefs={chatCols}
                actionLabel="مشاهده"
                onRowAction={(row) => setOpenChat(row as ChatRecord)}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="finance">
          <Card>
            <CardHeader>
              <CardTitle>تراکنش‌های مشتری</CardTitle>
            </CardHeader>
            <CardContent>
              <DataGrid rowData={txRows} columnDefs={txCols} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>لاگ عملیات مشتری</CardTitle>
            </CardHeader>
            <CardContent>
              <DataGrid rowData={logRows} columnDefs={logCols} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
