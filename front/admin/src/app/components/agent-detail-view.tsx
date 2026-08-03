import { useState } from "react";
import { toast } from "sonner";
import { api } from "../api";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { ArrowRight, Save } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { PromptListEditor } from "./prompt-list-editor";
import { DataGrid, type GridColumn } from "./data-grid";
import { ChatView, type ChatRecord } from "./chat-view";

const chatCols: GridColumn[] = [
  { field: "id", headerName: "شناسه", filterType: "text", width: 120 },
  { field: "participant", headerName: "طرف گفتگو", filterType: "text" },
  { field: "participantType", headerName: "نوع", filterType: "set" },
  { field: "lastMessage", headerName: "آخرین پیام", filterType: "text", flex: 2 },
  { field: "messageCount", headerName: "تعداد پیام", filterType: "number", width: 130 },
  { field: "startedAt", headerName: "شروع", filterType: "date" },
];

export function AgentDetailView({
  agent,
  onBack,
}: {
  agent: any;
  onBack: () => void;
}) {
  const [openChat, setOpenChat] = useState<ChatRecord | null>(null);
  const [name, setName] = useState(agent.name || "");
  const [definition, setDefinition] = useState(agent.definition ?? agent.role ?? "");
  const [instructions, setInstructions] = useState(agent.instructions || "");
  const [memoryDepth, setMemoryDepth] = useState<string>(agent.memoryDepth != null ? String(agent.memoryDepth) : "");
  const [saving, setSaving] = useState(false);
  const saveAgent = async () => {
    if (!agent.id) { toast.error("شناسهٔ ایجنت نامعتبر است"); return; }
    setSaving(true);
    try {
      const md = parseInt(memoryDepth, 10);
      await api.update("agents", agent.id, { name, role: definition, instructions, memoryDepth: Number.isFinite(md) && md > 0 ? md : null });
      toast.success("ایجنت ذخیره شد ✅");
    } catch (e: any) {
      toast.error(e?.status === 403 ? "فقط سوپر‌ادمین مجاز است" : "خطا در ذخیره");
    } finally { setSaving(false); }
  };

  // فیکِ قبلی حذف شد؛ چت‌های واقعی از بک‌اند می‌آیند (فعلاً خالی تا اتصالِ واقعی).
  const chats: ChatRecord[] = [];

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
            <h1>مدیریت ایجنت — {agent.name}</h1>
            <p className="text-sm text-muted-foreground">
              تعریف: {agent.definition} · بیزینس: {agent.business}
            </p>
          </div>
        </div>
        <Badge variant="secondary">{agent.remainingTokens} توکن باقیمانده</Badge>
      </div>

      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">اطلاعات</TabsTrigger>
          <TabsTrigger value="prompt">پرامپت</TabsTrigger>
          <TabsTrigger value="business">بیزینس</TabsTrigger>
          <TabsTrigger value="customers">مشتریان</TabsTrigger>
          <TabsTrigger value="chats">چت‌ها</TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>اطلاعات ایجنت</CardTitle>
              <Button size="sm" onClick={saveAgent} disabled={saving}>
                <Save className="size-4 ms-1" /> {saving ? "در حال ذخیره…" : "ذخیره"}
              </Button>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label className="text-xs text-muted-foreground">نام ایجنت</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs text-muted-foreground">تعریف ایجنت (نقش)</Label>
                <Input value={definition} onChange={(e) => setDefinition(e.target.value)} />
              </div>
              <div className="grid gap-1.5 md:col-span-2">
                <Label className="text-xs text-muted-foreground">دستورالعمل ایجنت</Label>
                <Textarea rows={4} value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="دستورالعمل رفتار ایجنت…" />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs text-muted-foreground">عمقِ حافظه (چند پیامِ گذشتهٔ کاربر را به‌خاطر بسپارد)</Label>
                <Input type="number" min={0} value={memoryDepth} onChange={(e) => setMemoryDepth(e.target.value)} placeholder="خالی = پیش‌فرضِ سوپرادمین" />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs text-muted-foreground">بیزینس</Label>
                <Input value={agent.business} disabled />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs text-muted-foreground">توکن باقیمانده</Label>
                <Input value={agent.remainingTokens} disabled />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prompt">
          <Card>
            <CardHeader>
              <CardTitle>پرامپت‌های اختصاصی بیزینس</CardTitle>
            </CardHeader>
            <CardContent>
              <PromptListEditor allowedRoles={["business", "user", "model"]} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="business">
          <Card>
            <CardHeader>
              <CardTitle>مشخصات بیزینس صاحب ایجنت</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label className="text-xs text-muted-foreground">نام بیزینس</Label>
                <Input value={agent.business} disabled />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs text-muted-foreground">صاحب بیزینس</Label>
                <Input value="سارا احمدی" disabled />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs text-muted-foreground">صنعت</Label>
                <Input value="خرده‌فروشی" disabled />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs text-muted-foreground">تعداد اعضا</Label>
                <Input value="12" disabled />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs text-muted-foreground">تاریخ ثبت</Label>
                <Input value="2026-02-12" disabled />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs text-muted-foreground">شماره تماس</Label>
                <Input value="021-44556677" disabled />
              </div>
              <div className="grid gap-1.5 md:col-span-2">
                <Label className="text-xs text-muted-foreground">آدرس</Label>
                <Input value="تهران، خیابان آزادی، پلاک ۱۲" disabled />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers">
          <Card>
            <CardHeader>
              <CardTitle>مشتریانی که با این ایجنت تعامل داشته‌اند</CardTitle>
            </CardHeader>
            <CardContent>
              <DataGrid
                rowData={[
                  { name: "علی حسینی", phone: "0912-1110001", email: "ali.h@example.com", messages: 24, lastChat: "2026-05-06" },
                  { name: "زهرا قاسمی", phone: "0912-1110002", email: "z.ghasemi@example.com", messages: 12, lastChat: "2026-04-25" },
                  { name: "نگار موسوی", phone: "0912-1110004", email: "negar.m@example.com", messages: 7, lastChat: "2026-04-30" },
                  { name: "رضا نجفی", phone: "0912-1110005", email: "reza@example.com", messages: 3, lastChat: "2026-05-01" },
                ]}
                columnDefs={[
                  { field: "name", headerName: "نام مشتری", filterType: "text" },
                  { field: "phone", headerName: "تماس", filterType: "text" },
                  { field: "email", headerName: "ایمیل", filterType: "text" },
                  { field: "messages", headerName: "تعداد پیام", filterType: "number" },
                  { field: "lastChat", headerName: "آخرین تعامل", filterType: "date" },
                ]}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chats">
          <Card>
            <CardHeader>
              <CardTitle>مراودات ایجنت</CardTitle>
            </CardHeader>
            <CardContent>
              <DataGrid
                rowData={chats}
                columnDefs={chatCols}
                actionLabel="مشاهده"
                onRowAction={(row) => setOpenChat(row as ChatRecord)}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
