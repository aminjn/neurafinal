import { useEffect, useState } from "react";
import { api } from "../api";
import { CrudDataGrid, fieldsFromColumns } from "./crud-grid";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { DataGrid, type GridColumn } from "./data-grid";
import { ChatView, type ChatRecord } from "./chat-view";

type ChatRow = ChatRecord & {
  business: string;
  createdAt: string;
  lastMessageAt: string;
  totalTokens: number;
};

const DEFAULT_ROWS: ChatRow[] = [
  { id: "CH-501", participant: "سارا احمدی", participantType: "صاحب بیزینس", agentName: "حسابدار فروشگاه من", business: "فروشگاه آلفا", createdAt: "2026-04-12", lastMessageAt: "2026-05-06", lastMessage: "گزارش ماهانه رو برام بفرست", messageCount: 24, totalTokens: 18420, startedAt: "2026-04-12" },
  { id: "CH-502", participant: "علی حسینی", participantType: "مشتری", agentName: "پشتیبان آنلاین", business: "فروشگاه آلفا", createdAt: "2026-04-18", lastMessageAt: "2026-05-08", lastMessage: "زمان تحویل سفارش چقدره؟", messageCount: 8, totalTokens: 5210, startedAt: "2026-04-18" },
  { id: "CH-503", participant: "زهرا قاسمی", participantType: "مشتری", agentName: "پشتیبان آنلاین", business: "خدمات گاما", createdAt: "2026-04-25", lastMessageAt: "2026-04-28", lastMessage: "ممنون از پاسخ‌گویی", messageCount: 12, totalTokens: 7340, startedAt: "2026-04-25" },
  { id: "CH-504", participant: "محمد کریمی", participantType: "صاحب بیزینس", agentName: "انباردار اصلی", business: "انبار بتا", createdAt: "2026-04-02", lastMessageAt: "2026-05-02", lastMessage: "موجودی محصول A-203 چقدره؟", messageCount: 6, totalTokens: 3120, startedAt: "2026-04-02" },
  { id: "CH-505", participant: "نگار موسوی", participantType: "صاحب بیزینس", agentName: "بازاریاب کمپین بهار", business: "خدمات گاما", createdAt: "2026-04-15", lastMessageAt: "2026-05-07", lastMessage: "ایده‌هایی برای کمپین بهار میخوام", messageCount: 18, totalTokens: 14820, startedAt: "2026-04-15" },
  { id: "CH-506", participant: "رضا نجفی", participantType: "مشتری", agentName: "پشتیبان آنلاین", business: "خدمات گاما", createdAt: "2026-04-28", lastMessageAt: "2026-05-01", lastMessage: "نحوه پرداخت چطوریه؟", messageCount: 5, totalTokens: 2410, startedAt: "2026-04-28" },
];

const columns: GridColumn[] = [
  { field: "id", headerName: "شناسه", filterType: "text", width: 120 },
  { field: "createdAt", headerName: "تاریخ ایجاد", filterType: "date" },
  { field: "lastMessageAt", headerName: "آخرین پیام", filterType: "date" },
  { field: "agentName", headerName: "ایجنت", filterType: "set" },
  { field: "business", headerName: "بیزینس", filterType: "set" },
  { field: "participant", headerName: "کاربر", filterType: "text" },
  { field: "participantType", headerName: "نوع کاربر", filterType: "set" },
  { field: "totalTokens", headerName: "توکن مصرفی", filterType: "number" },
  { field: "messageCount", headerName: "تعداد پیام", filterType: "number" },
];

export function ChatsPage() {
  const [openChat, setOpenChat] = useState<ChatRow | null>(null);
  const [rows, setRows] = useState<ChatRow[]>([]);

  useEffect(() => {
    (async () => {
      try { setRows(await api.list<ChatRow>("chats")); }
      catch { setRows(DEFAULT_ROWS); }
    })();
  }, []);

  if (openChat) {
    return <ChatView chat={openChat} onBack={() => setOpenChat(null)} />;
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      <div>
        <h1>چت‌ها</h1>
        <p className="text-sm text-muted-foreground">
          مرور تمام چت‌های ایجنت‌ها با مشتریان و صاحبان بیزینس
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>لیست چت‌ها</CardTitle>
        </CardHeader>
        <CardContent>
          <CrudDataGrid
            embedded
            apiKind="data"
            collection="chats"
            columns={columns}
            fields={fieldsFromColumns(columns)}
            onRowAction={(row) => setOpenChat(row as ChatRow)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
