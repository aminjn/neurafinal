import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Switch } from "./ui/switch";
import { Badge } from "./ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { ArrowRight, Plus, Save, Trash2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { DataGrid, type GridColumn } from "./data-grid";
import { toast } from "sonner";

export type AccessLevel = {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  personnelCount: number;
};

type Operation = { key: string; label: string; allowed: boolean };

const defaultOperations: Operation[] = [
  { key: "read_chats", label: "خواندن چت‌های ایجنت", allowed: true },
  { key: "edit_business", label: "اصلاح اطلاعات بیزینس", allowed: false },
  { key: "edit_agent_prompt", label: "تغییر دستورالعمل ایجنت", allowed: false },
  { key: "manage_personnel", label: "مدیریت پرسنل", allowed: false },
  { key: "view_finance", label: "مشاهده اطلاعات مالی", allowed: false },
  { key: "manage_access_levels", label: "مدیریت سطوح دسترسی", allowed: false },
  { key: "buy_agents", label: "خرید ایجنت", allowed: false },
  { key: "view_logs", label: "مشاهده لاگ‌ها", allowed: true },
];

type Personnel = {
  id: string;
  name: string;
  email: string;
  addedAt: string;
};

const initialPersonnel: Personnel[] = [
  { id: "P1", name: "حسین رحیمی", email: "h.rahimi@example.com", addedAt: "2026-03-10" },
  { id: "P2", name: "زهرا قاسمی", email: "z.ghasemi@example.com", addedAt: "2026-03-22" },
];

export function AccessLevelDetailView({
  level,
  onBack,
  onUpdate,
}: {
  level: AccessLevel;
  onBack: () => void;
  onUpdate?: (next: AccessLevel) => void;
}) {
  const [name, setName] = useState(level.name);
  const [description, setDescription] = useState(level.description ?? "");
  const [ops, setOps] = useState<Operation[]>(defaultOperations);
  const [personnel, setPersonnel] = useState<Personnel[]>(initialPersonnel);

  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");

  const personnelCols: GridColumn[] = [
    { field: "name", headerName: "نام", filterType: "text" },
    { field: "email", headerName: "ایمیل", filterType: "text" },
    { field: "addedAt", headerName: "تاریخ افزودن", filterType: "date" },
  ];

  const removePersonnel = (row: Personnel) => {
    setPersonnel((p) => p.filter((x) => x.id !== row.id));
    toast.success(`${row.name} از این سطح دسترسی حذف شد`);
  };

  const addPersonnel = () => {
    if (!newName.trim()) return;
    setPersonnel((p) => [
      ...p,
      {
        id: `P${Date.now()}`,
        name: newName,
        email: newEmail,
        addedAt: new Date().toISOString().slice(0, 10),
      },
    ]);
    setNewName("");
    setNewEmail("");
    setAddOpen(false);
    toast.success("پرسنل اضافه شد");
  };

  const saveSettings = () => {
    onUpdate?.({ ...level, name, description });
    toast.success("تنظیمات ذخیره شد");
  };

  const saveOps = () => toast.success("دسترسی‌ها ذخیره شد");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowRight className="h-4 w-4" />
          </Button>
          <div>
            <h2>مدیریت سطح دسترسی — {name}</h2>
            <p className="text-sm text-muted-foreground">
              {personnel.length} پرسنل با این سطح دسترسی
            </p>
          </div>
        </div>
        <Badge variant="secondary">ایجاد: {level.createdAt}</Badge>
      </div>

      <Tabs defaultValue="settings">
        <TabsList>
          <TabsTrigger value="settings">تنظیمات</TabsTrigger>
          <TabsTrigger value="operations">مدیریت عملیات‌ها</TabsTrigger>
          <TabsTrigger value="personnel">پرسنل با این سطح دسترسی</TabsTrigger>
        </TabsList>

        <TabsContent value="settings">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>تنظیمات</CardTitle>
              <Button size="sm" onClick={saveSettings}>
                <Save className="h-4 w-4 ml-1" />
                ذخیره
              </Button>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-1.5">
                <Label>نام سطح دسترسی</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="grid gap-1.5">
                <Label>توضیحات</Label>
                <Textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="operations">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>عملیات‌های مجاز</CardTitle>
              <Button size="sm" onClick={saveOps}>
                <Save className="h-4 w-4 ml-1" />
                ذخیره
              </Button>
            </CardHeader>
            <CardContent className="flex flex-col">
              {ops.map((op, i) => (
                <div
                  key={op.key}
                  className="flex items-center justify-between py-3 border-b last:border-0"
                >
                  <div className="flex flex-col">
                    <span className="text-sm">{op.label}</span>
                    <span className="text-xs text-muted-foreground">
                      {op.key}
                    </span>
                  </div>
                  <Switch
                    checked={op.allowed}
                    onCheckedChange={(c) => {
                      const next = [...ops];
                      next[i] = { ...op, allowed: Boolean(c) };
                      setOps(next);
                    }}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="personnel">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>پرسنل با این سطح دسترسی</CardTitle>
              {addOpen ? (
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="نام"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="h-9 w-40"
                  />
                  <Input
                    placeholder="ایمیل"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="h-9 w-56"
                  />
                  <Button size="sm" onClick={addPersonnel}>
                    افزودن
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setAddOpen(false)}
                  >
                    انصراف
                  </Button>
                </div>
              ) : (
                <Button size="sm" onClick={() => setAddOpen(true)}>
                  <Plus className="h-4 w-4 ml-1" />
                  افزودن پرسنل
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <DataGrid
                rowData={personnel}
                columnDefs={personnelCols}
                actionLabel="حذف دسترسی"
                onRowAction={(row) => removePersonnel(row as Personnel)}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
