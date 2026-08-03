import { useState, useEffect } from "react";
import { toast } from "sonner";
import { api } from "../api";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { ArrowRight, Pencil, Save, X } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { DataGrid, type GridColumn } from "./data-grid";
import { isoToShamsi, shamsiToISO } from "../jalali";

type Props = {
  user: any;
  onBack: () => void;
};

const accountFields: { key: string; label: string }[] = [
  { key: "name", label: "نام و نام خانوادگی" },
  { key: "email", label: "ایمیل" },
  { key: "phone", label: "شماره تماس" },
  { key: "username", label: "نام کاربری" },
  { key: "role", label: "نقش" },
  { key: "status", label: "وضعیت" },
];

const identityFields: { key: string; label: string }[] = [
  { key: "nationalId", label: "کد ملی" },
  { key: "fatherName", label: "نام پدر" },
  { key: "birthDate", label: "تاریخ تولد" },
  { key: "gender", label: "جنسیت" },
  { key: "address", label: "آدرس" },
  { key: "postalCode", label: "کد پستی" },
];

const txCols: GridColumn[] = [
  { field: "id", headerName: "شناسه", filterType: "text", width: 110 },
  { field: "type", headerName: "نوع", filterType: "set" },
  { field: "amount", headerName: "مبلغ (تومان)", filterType: "number" },
  { field: "status", headerName: "وضعیت", filterType: "set" },
  { field: "date", headerName: "تاریخ", filterType: "date" },
  { field: "ref", headerName: "کد پیگیری", filterType: "text" },
];

const txRows: any[] = [];

const bizCols: GridColumn[] = [
  { field: "name", headerName: "نام بیزینس", filterType: "text" },
  { field: "industry", headerName: "صنعت", filterType: "set" },
  { field: "agent", headerName: "ایجنت متصل", filterType: "set" },
  { field: "members", headerName: "اعضا", filterType: "number" },
  { field: "createdAt", headerName: "تاریخ ایجاد", filterType: "date" },
];

const bizRows: any[] = [];

const agentCols: GridColumn[] = [
  { field: "name", headerName: "نام ایجنت", filterType: "set" },
  { field: "plan", headerName: "پلن", filterType: "set" },
  { field: "purchasedAt", headerName: "تاریخ خرید", filterType: "date" },
  { field: "expiresAt", headerName: "انقضا", filterType: "date" },
  { field: "price", headerName: "قیمت (تومان)", filterType: "number" },
  { field: "status", headerName: "وضعیت", filterType: "set" },
];

const agentRows: any[] = [];

const logCols: GridColumn[] = [
  { field: "time", headerName: "زمان", filterType: "text" },
  { field: "action", headerName: "عملیات", filterType: "set" },
  { field: "target", headerName: "هدف", filterType: "text" },
  { field: "ip", headerName: "جزئیات", filterType: "text" },
  { field: "result", headerName: "نتیجه", filterType: "set" },
];

function FieldGrid({
  fields,
  values,
  readOnly,
  onChange,
}: {
  fields: { key: string; label: string }[];
  values: Record<string, any>;
  readOnly: boolean;
  onChange: (k: string, v: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {fields.map((f) => (
        <div key={f.key} className="flex flex-col gap-1.5">
          <Label className="text-xs text-muted-foreground">{f.label}</Label>
          <Input
            value={values[f.key] ?? ""}
            disabled={readOnly}
            onChange={(e) => onChange(f.key, e.target.value)}
          />
        </div>
      ))}
    </div>
  );
}

export function UserDetailView({ user, onBack }: Props) {
  const m = (user as any).meta || {};
  const initial = {
    name: user.name ?? "",
    email: user.email ?? "",
    phone: user.phone ?? m.phone ?? "",
    username: user.username ?? user.email?.split("@")[0] ?? "",
    role: user.role ?? "",
    status: user.status ?? "",
    nationalId: user.nationalId ?? m.nationalId ?? "",
    fatherName: user.fatherName ?? m.fatherName ?? "",
    birthDate: user.birthDate ?? m.birthDate ?? "",
    gender: user.gender ?? m.gender ?? "",
    address: user.address ?? m.address ?? "",
    postalCode: user.postalCode ?? m.postalCode ?? "",
  };

  const [account, setAccount] = useState(initial);
  const [draft, setDraft] = useState(initial);
  const [editing, setEditing] = useState(false);

  // ایجنت‌های واقعی‌ای که این کاربر خریده/درخواست داده (از meta.ownedAgents)
  const [ownedRows, setOwnedRows] = useState<any[]>([]);
  const reloadAgents = () => {
    if (!user.id) { setOwnedRows([]); return; }
    api.userAgents(user.id)
      .then((r) => setOwnedRows((r && Array.isArray(r.agents)) ? r.agents : []))
      .catch(() => setOwnedRows([]));
  };
  useEffect(() => { reloadAgents(); }, [user.id]);

  // مصرفِ توکنِ کاربر
  const [usage, setUsage] = useState<{ used: number; balance: number } | null>(null);
  useEffect(() => {
    if (!user.id) return;
    api.userUsage(user.id).then((u) => setUsage(u)).catch(() => setUsage(null));
  }, [user.id]);

  const toggleAgent = async (agentId: string, active: boolean) => {
    try { await api.setUserAgent(user.id, agentId, { active }); reloadAgents(); toast.success(active ? "ایجنت فعال شد" : "ایجنت غیرفعال شد"); }
    catch { toast.error("خطا"); }
  };
  const setAgentExpiry = async (agentId: string, expiresAt: string) => {
    try { await api.setUserAgent(user.id, agentId, { expiresAt: expiresAt || null }); reloadAgents(); toast.success("تاریخ انقضا ذخیره شد"); }
    catch { toast.error("خطا"); }
  };
  // ویرایشِ نام/نقشِ ایجنتِ این کاربر (روی شخصی‌سازیِ per-userِ او می‌نویسد؛ هویت دخالت ندارد)
  const saveAgentEdit = async (agentId: string, name: string, role: string) => {
    try { await api.updateUserAgent(user.id, agentId, { name, role }); reloadAgents(); toast.success("ایجنت ذخیره شد"); }
    catch { toast.error("خطا در ذخیرهٔ ایجنت"); }
  };
  // حذفِ کاملِ ایجنت از کاربر (مالکیت + گرنت + شخصی‌سازی)
  const removeAgent = async (agentId: string) => {
    const bare = String(agentId).split("::").pop() || agentId;
    try { await api.removeUserAgent(user.id, bare); reloadAgents(); toast.success("ایجنت حذف شد"); }
    catch { toast.error("خطا در حذف ایجنت"); }
  };

  // لاگِ فعالیتِ واقعی (تماس‌ها + گفتگوها)
  const [activityRows, setActivityRows] = useState<any[]>([]);
  useEffect(() => {
    (async () => {
      if (!user.id) { setActivityRows([]); return; }
      try {
        const r = await api.userActivity(user.id);
        const list = (r && Array.isArray(r.events)) ? r.events : [];
        setActivityRows(list.map((e) => ({
          time: e.time ? new Date(e.time).toLocaleString("fa-IR") : "—",
          action: e.action, target: e.target, ip: e.ip, result: e.result,
        })));
      } catch { setActivityRows([]); }
    })();
  }, [user.id]);

  const startEdit = () => {
    setDraft(account);
    setEditing(true);
  };
  const cancel = () => setEditing(false);
  const save = () => {
    setAccount(draft);
    setEditing(false);
    if (user.id) {
      api.updateUser(user.id, {
        name: draft.name, email: draft.email,
        meta: { phone: draft.phone, nationalId: draft.nationalId, fatherName: draft.fatherName, birthDate: draft.birthDate, gender: draft.gender, address: draft.address, postalCode: draft.postalCode },
      }).then(() => toast.success("اطلاعات کاربر ذخیره شد")).catch(() => toast.error("خطا در ذخیره"));
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowRight className="h-4 w-4" />
          </Button>
          <div>
            <h1>مدیریت کاربر — {account.name}</h1>
            <p className="text-sm text-muted-foreground">
              مشاهده و ویرایش اطلاعات کاربر
            </p>
          </div>
        </div>
        <Badge variant="secondary">{account.email}</Badge>
      </div>

      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">اطلاعات</TabsTrigger>
          <TabsTrigger value="identity">اطلاعات هویتی</TabsTrigger>
          <TabsTrigger value="finance">مالی</TabsTrigger>
          <TabsTrigger value="businesses">بیزینس‌ها</TabsTrigger>
          <TabsTrigger value="agents">ایجنت‌ها</TabsTrigger>
          <TabsTrigger value="logs">لاگ</TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>اطلاعات حساب کاربری</CardTitle>
              {editing ? (
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={cancel}>
                    <X className="h-4 w-4 ml-1" />
                    انصراف
                  </Button>
                  <Button size="sm" onClick={save}>
                    <Save className="h-4 w-4 ml-1" />
                    ذخیره
                  </Button>
                </div>
              ) : (
                <Button size="sm" variant="outline" onClick={startEdit}>
                  <Pencil className="h-4 w-4 ml-1" />
                  ویرایش
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <FieldGrid
                fields={accountFields}
                values={editing ? draft : account}
                readOnly={!editing}
                onChange={(k, v) => setDraft({ ...draft, [k]: v })}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="identity">
          <Card>
            <CardHeader>
              <CardTitle>اطلاعات هویتی</CardTitle>
            </CardHeader>
            <CardContent>
              <FieldGrid
                fields={identityFields}
                values={account}
                readOnly
                onChange={() => {}}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="finance">
          <Card>
            <CardHeader>
              <CardTitle>تراکنش‌های کاربر</CardTitle>
            </CardHeader>
            <CardContent>
              <DataGrid rowData={txRows} columnDefs={txCols} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="businesses">
          <Card>
            <CardHeader>
              <CardTitle>بیزینس‌های کاربر</CardTitle>
            </CardHeader>
            <CardContent>
              <DataGrid rowData={bizRows} columnDefs={bizCols} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agents">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>ایجنت‌های خریداری‌شده</CardTitle>
              {usage && <Badge variant="secondary">مصرفِ توکن: {usage.used.toLocaleString("fa-IR")}{usage.balance ? " از " + usage.balance.toLocaleString("fa-IR") : ""}</Badge>}
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {!ownedRows.length && <div className="text-sm text-muted-foreground py-4 text-center">این کاربر ایجنتی ندارد.</div>}
              {ownedRows.map((a: any) => (
                <div key={a.id} className="flex flex-wrap items-center gap-3 rounded-lg border p-3" style={{ opacity: a.active ? 1 : 0.6 }}>
                  <div className="flex flex-col gap-1 flex-1 min-w-[140px]">
                    <Label className="text-[11px] text-muted-foreground">نام / نقشِ ایجنت</Label>
                    <div className="flex gap-2">
                      <Input className="h-8" defaultValue={a.name} placeholder="نام ایجنت"
                        onBlur={(e) => { const v = e.target.value.trim(); if (v && v !== a.name) saveAgentEdit(a.id, v, a.role || ""); }} />
                      <Input className="h-8" defaultValue={a.role} placeholder="نقش"
                        onBlur={(e) => { const v = e.target.value.trim(); if (v !== (a.role || "")) saveAgentEdit(a.id, a.name, v); }} />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label className="text-[11px] text-muted-foreground">تاریخ انقضا (شمسی)</Label>
                    <Input className="h-8 w-40" placeholder="۱۴۰۴/۰۴/۱۵" dir="ltr"
                      defaultValue={isoToShamsi(a.expiresAt)}
                      onBlur={(e) => { const v = e.target.value.trim(); setAgentExpiry(a.id, v ? shamsiToISO(v) : ""); }} />
                  </div>
                  <Badge variant={a.expired ? "destructive" : a.active ? "secondary" : "outline"}>
                    {a.expired ? "منقضی" : a.active ? "فعال" : "غیرفعال"}
                  </Badge>
                  <Button size="sm" variant={a.active ? "outline" : "default"} onClick={() => toggleAgent(a.id, !a.active)}>
                    {a.active ? "غیرفعال کن" : "فعال کن"}
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => removeAgent(a.id)}>حذف</Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>لاگ عملیات کاربر</CardTitle>
            </CardHeader>
            <CardContent>
              <DataGrid rowData={activityRows} columnDefs={logCols} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
