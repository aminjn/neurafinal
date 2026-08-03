import { useEffect, useState } from "react";
import { api } from "../api";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Switch } from "./ui/switch";
import { Textarea } from "./ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { DataGrid, type GridColumn } from "./data-grid";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { ArrowRight, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";

export type AdminRole = {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  adminCount: number;
  operations: Record<string, boolean>;
};

const panelOperations: { key: string; label: string; group: string }[] = [
  { group: "داشبورد", key: "view_dashboard", label: "مشاهده داشبورد" },
  { group: "کاربران", key: "view_users", label: "مشاهده کاربران" },
  { group: "کاربران", key: "edit_users", label: "ویرایش کاربران" },
  { group: "کاربران", key: "delete_users", label: "حذف کاربران" },
  { group: "بیزینس‌ها", key: "view_businesses", label: "مشاهده بیزینس‌ها" },
  { group: "بیزینس‌ها", key: "edit_businesses", label: "ویرایش بیزینس‌ها" },
  { group: "ایجنت‌ها", key: "view_agent_defs", label: "مشاهده تعاریف ایجنت" },
  { group: "ایجنت‌ها", key: "edit_agent_defs", label: "ویرایش تعاریف ایجنت" },
  { group: "ایجنت‌ها", key: "view_agents", label: "مشاهده ایجنت‌ها" },
  { group: "ایجنت‌ها", key: "manage_agent_prompts", label: "مدیریت پرامپت‌های ایجنت" },
  { group: "مالی", key: "view_invoices", label: "مشاهده فاکتورها" },
  { group: "مالی", key: "manage_invoices", label: "مدیریت فاکتورها" },
  { group: "مالی", key: "view_transactions", label: "مشاهده تراکنش‌ها" },
  { group: "مالی", key: "view_wallets", label: "مشاهده کیف پول‌ها" },
  { group: "چت‌ها", key: "view_chats", label: "مشاهده چت‌ها" },
  { group: "چت‌ها", key: "export_chats", label: "گرفتن خروجی چت" },
  { group: "پشتیبانی", key: "view_tickets", label: "مشاهده تیکت‌ها" },
  { group: "پشتیبانی", key: "answer_tickets", label: "پاسخ به تیکت" },
  { group: "پشتیبانی", key: "change_ticket_status", label: "تغییر وضعیت تیکت" },
  { group: "پشتیبانی", key: "view_qc", label: "مشاهده QC" },
  { group: "پشتیبانی", key: "manage_contact_requests", label: "مدیریت درخواست‌های تماس" },
  { group: "پشتیبانی", key: "manage_newsletter", label: "مدیریت خبرنامه" },
  { group: "کنترل پنل", key: "manage_appearance", label: "مدیریت ظاهر اپلیکیشن" },
  { group: "کنترل پنل", key: "manage_languages", label: "مدیریت زبان‌ها" },
  { group: "کنترل پنل", key: "manage_global_prompts", label: "مدیریت پرامپت‌های گلوبال" },
  { group: "سوپر ادمین", key: "manage_admins", label: "مدیریت ادمین‌ها" },
  { group: "سوپر ادمین", key: "manage_admin_roles", label: "مدیریت سطوح دسترسی ادمین" },
  { group: "سوپر ادمین", key: "view_admin_logs", label: "مشاهده لاگ ادمین‌ها" },
];

const initialRoles: AdminRole[] = [
  {
    id: "AR-001",
    name: "ادمین کل",
    description: "دسترسی کامل به همه بخش‌های پنل",
    createdAt: "2026-01-10",
    adminCount: 2,
    operations: Object.fromEntries(panelOperations.map((o) => [o.key, true])),
  },
  {
    id: "AR-002",
    name: "ادمین پشتیبانی",
    description: "دسترسی به تیکتینگ، QC و فرم‌های تماس",
    createdAt: "2026-02-04",
    adminCount: 4,
    operations: Object.fromEntries(
      panelOperations.map((o) => [
        o.key,
        ["view_dashboard", "view_users", "view_chats", "view_tickets", "answer_tickets", "change_ticket_status", "view_qc", "manage_contact_requests", "manage_newsletter"].includes(o.key),
      ]),
    ),
  },
  {
    id: "AR-003",
    name: "ادمین مالی",
    description: "دسترسی به اطلاعات مالی، فاکتورها و تراکنش‌ها",
    createdAt: "2026-02-22",
    adminCount: 3,
    operations: Object.fromEntries(
      panelOperations.map((o) => [
        o.key,
        ["view_dashboard", "view_invoices", "manage_invoices", "view_transactions", "view_wallets", "view_users"].includes(o.key),
      ]),
    ),
  },
  {
    id: "AR-004",
    name: "ادمین محتوا",
    description: "مدیریت تعاریف ایجنت‌ها و پرامپت‌های گلوبال",
    createdAt: "2026-03-15",
    adminCount: 2,
    operations: Object.fromEntries(
      panelOperations.map((o) => [
        o.key,
        ["view_dashboard", "view_agent_defs", "edit_agent_defs", "manage_agent_prompts", "manage_global_prompts"].includes(o.key),
      ]),
    ),
  },
];

const rolesColumns: GridColumn[] = [
  { field: "id", headerName: "شناسه", filterType: "text", width: 120 },
  { field: "name", headerName: "نام سطح دسترسی", filterType: "text" },
  { field: "description", headerName: "توضیحات", filterType: "text", flex: 2 },
  { field: "adminCount", headerName: "تعداد ادمین", filterType: "number" },
  { field: "createdAt", headerName: "تاریخ ایجاد", filterType: "date" },
];

function AdminRoleDetail({
  role,
  onBack,
  onUpdate,
  onDelete,
}: {
  role: AdminRole;
  onBack: () => void;
  onUpdate: (next: AdminRole) => void;
  onDelete: () => void;
}) {
  const [name, setName] = useState(role.name);
  const [description, setDescription] = useState(role.description);
  const [ops, setOps] = useState<Record<string, boolean>>({ ...role.operations });

  const grouped = panelOperations.reduce<
    Record<string, typeof panelOperations>
  >((acc, op) => {
    (acc[op.group] ??= []).push(op);
    return acc;
  }, {});

  const save = () => {
    onUpdate({ ...role, name, description, operations: ops });
    toast.success("سطح دسترسی ذخیره شد");
  };

  const toggleAll = (group: string, value: boolean) => {
    const next = { ...ops };
    panelOperations
      .filter((o) => o.group === group)
      .forEach((o) => (next[o.key] = value));
    setOps(next);
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowRight className="h-4 w-4" />
          </Button>
          <div>
            <h1>سطح دسترسی — {name}</h1>
            <p className="text-sm text-muted-foreground">
              {role.adminCount} ادمین با این سطح دسترسی
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="destructive" onClick={onDelete}>
            <Trash2 className="h-4 w-4 ml-1" />
            حذف
          </Button>
          <Button size="sm" onClick={save}>
            <Save className="h-4 w-4 ml-1" />
            ذخیره
          </Button>
        </div>
      </div>

      <Tabs defaultValue="info" className="flex flex-1 flex-col gap-4">
        <TabsList className="self-start">
          <TabsTrigger value="info">اطلاعات و توضیحات</TabsTrigger>
          <TabsTrigger value="ops">عملیات‌ها</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="m-0">
          <Card>
            <CardHeader>
              <CardTitle>اطلاعات</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-1.5">
                <Label>نام سطح دسترسی</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="grid gap-1.5">
                <Label>توضیحات</Label>
                <Textarea
                  rows={5}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ops" className="m-0">
          <Card>
            <CardHeader>
              <CardTitle>عملیات‌های مجاز در پنل ادمین</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
          {Object.entries(grouped).map(([group, items]) => {
            const allOn = items.every((i) => ops[i.key]);
            return (
              <div key={group} className="flex flex-col gap-2">
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="text-sm">{group}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      انتخاب همه
                    </span>
                    <Switch
                      checked={allOn}
                      onCheckedChange={(c) => toggleAll(group, Boolean(c))}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-2">
                  {items.map((op) => (
                    <div
                      key={op.key}
                      className="flex items-center justify-between py-2 border-b last:border-0"
                    >
                      <div className="flex flex-col">
                        <span className="text-sm">{op.label}</span>
                        <span className="text-xs text-muted-foreground">
                          {op.key}
                        </span>
                      </div>
                      <Switch
                        checked={Boolean(ops[op.key])}
                        onCheckedChange={(c) =>
                          setOps((p) => ({ ...p, [op.key]: Boolean(c) }))
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export function AdminRolesPage() {
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [selected, setSelected] = useState<AdminRole | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");

  // بارگذاری از دیتابیس؛ بار اول، نقش‌های پیش‌فرض را در DB seed می‌کنیم
  useEffect(() => {
    (async () => {
      try {
        let data = await api.list<AdminRole>("roles");
        if (!data.length) {
          for (const r of initialRoles) { try { await api.create("roles", r); } catch {} }
          data = await api.list<AdminRole>("roles");
        }
        setRoles(data.length ? data : initialRoles);
      } catch {
        setRoles(initialRoles); // fallback آفلاین
      }
    })();
  }, []);

  const createRole = async () => {
    if (!newName.trim()) return;
    const role: AdminRole = {
      id: `AR-${Date.now().toString().slice(-4)}`,
      name: newName.trim(),
      description: newDesc.trim(),
      createdAt: new Date().toISOString().slice(0, 10),
      adminCount: 0,
      operations: Object.fromEntries(panelOperations.map((o) => [o.key, false])),
    };
    try { await api.create("roles", role); } catch {}
    setRoles((r) => [role, ...r]);
    setNewName("");
    setNewDesc("");
    setAddOpen(false);
    toast.success("سطح دسترسی ایجاد شد");
  };

  if (selected) {
    return (
      <AdminRoleDetail
        role={selected}
        onBack={() => setSelected(null)}
        onUpdate={(next) => {
          api.update("roles", next.id, next).catch(() => {});
          setRoles((rs) => rs.map((r) => (r.id === next.id ? next : r)));
          setSelected(next);
        }}
        onDelete={() => {
          api.remove("roles", selected.id).catch(() => {});
          setRoles((rs) => rs.filter((r) => r.id !== selected.id));
          setSelected(null);
          toast.success("سطح دسترسی حذف شد");
        }}
      />
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>سطوح دسترسی ادمین‌ها</h1>
          <p className="text-sm text-muted-foreground">
            تعریف سطوح دسترسی توسط سوپر ادمین برای اختصاص به ادمین‌های پنل
          </p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 ml-1" />
              سطح دسترسی جدید
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>ایجاد سطح دسترسی جدید</DialogTitle>
            </DialogHeader>
            <div className="grid gap-3">
              <div className="grid gap-1.5">
                <Label>نام</Label>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="مثلاً: ادمین گزارش‌گیری"
                />
              </div>
              <div className="grid gap-1.5">
                <Label>توضیحات</Label>
                <Textarea
                  rows={3}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={createRole}>ایجاد</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>لیست سطوح دسترسی</span>
            <Badge variant="secondary">{roles.length} سطح</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataGrid
            rowData={roles}
            columnDefs={rolesColumns}
            onRowAction={(row) => setSelected(row as AdminRole)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
