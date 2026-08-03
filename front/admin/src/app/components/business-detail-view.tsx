import { useEffect, useRef, useState } from "react";
import { api } from "../api";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { ArrowRight, Pencil, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { DataGrid, type GridColumn } from "./data-grid";
import {
  AccessLevelDetailView,
  type AccessLevel,
} from "./access-level-detail-view";
import { CustomerDetailView, type Customer } from "./customer-detail-view";
import { toast } from "sonner";

type BizAgent = {
  id: string;
  name: string;
  definition: string;
  createdAt: string;
  remainingTokens: number;
  status: "فعال" | "غیرفعال";
};

const agentDefinitionOptions = [
  "حسابدار",
  "انباردار",
  "پشتیبان",
  "بازاریاب",
];

const initialAgents: BizAgent[] = [
  { id: "AG1", name: "حسابدار فروشگاه من", definition: "حسابدار", createdAt: "2026-02-15", remainingTokens: 124500, status: "فعال" },
  { id: "AG2", name: "پشتیبان آنلاین", definition: "پشتیبان", createdAt: "2026-03-08", remainingTokens: 32000, status: "فعال" },
];

type Personnel = {
  id: string;
  name: string;
  email: string;
  accessLevel: string;
  addedAt: string;
};

const initialLevels: AccessLevel[] = [
  { id: "AL1", name: "مدیر بیزینس", description: "دسترسی کامل", createdAt: "2026-02-15", personnelCount: 2 },
  { id: "AL2", name: "حسابدار", description: "دسترسی به امور مالی", createdAt: "2026-03-02", personnelCount: 1 },
  { id: "AL3", name: "اپراتور پشتیبانی", description: "پاسخ‌گویی به مشتریان", createdAt: "2026-03-20", personnelCount: 4 },
];

const initialPersonnel: Personnel[] = [
  { id: "U1", name: "حسین رحیمی", email: "h.rahimi@example.com", accessLevel: "مدیر بیزینس", addedAt: "2026-02-20" },
  { id: "U2", name: "زهرا قاسمی", email: "z.ghasemi@example.com", accessLevel: "حسابدار", addedAt: "2026-03-04" },
  { id: "U3", name: "علی حسینی", email: "ali.h@example.com", accessLevel: "اپراتور پشتیبانی", addedAt: "2026-03-22" },
  { id: "U4", name: "مریم نوری", email: "m.noori@example.com", accessLevel: "اپراتور پشتیبانی", addedAt: "2026-04-01" },
];

export function BusinessDetailView({
  business,
  onBack,
}: {
  business: any;
  onBack: () => void;
}) {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const transactions = [
    { id: "TX-9001", type: "درآمد فروش", amount: 4800000, date: "2026-03-04", method: "آنلاین", status: "موفق" },
    { id: "TX-9002", type: "بازگشت وجه", amount: 320000, date: "2026-03-09", method: "آنلاین", status: "موفق" },
    { id: "TX-9003", type: "خرید ایجنت", amount: 1200000, date: "2026-03-15", method: "کیف پول", status: "موفق" },
    { id: "TX-9004", type: "درآمد فروش", amount: 2100000, date: "2026-04-02", method: "آنلاین", status: "موفق" },
    { id: "TX-9005", type: "شارژ توکن", amount: 500000, date: "2026-04-18", method: "کیف پول", status: "ناموفق" },
  ];

  const txCols: GridColumn[] = [
    { field: "id", headerName: "شناسه", filterType: "text", width: 120 },
    { field: "type", headerName: "نوع", filterType: "set" },
    { field: "amount", headerName: "مبلغ (تومان)", filterType: "number" },
    { field: "method", headerName: "روش", filterType: "set" },
    { field: "status", headerName: "وضعیت", filterType: "set" },
    { field: "date", headerName: "تاریخ", filterType: "date" },
  ];

  const customers: Customer[] = (business as any).customers ?? [];

  const customerCols: GridColumn[] = [
    { field: "name", headerName: "نام", filterType: "text" },
    { field: "phone", headerName: "تماس", filterType: "text" },
    { field: "email", headerName: "ایمیل", filterType: "text" },
    { field: "joinedAt", headerName: "تاریخ عضویت", filterType: "date" },
    { field: "totalOrders", headerName: "سفارش‌ها", filterType: "number" },
    { field: "totalSpent", headerName: "مجموع خرید", filterType: "number" },
    { field: "status", headerName: "وضعیت", filterType: "set" },
  ];

  const [agents, setAgents] = useState<BizAgent[]>((business as any).agents ?? []);
  const [agentDialogOpen, setAgentDialogOpen] = useState(false);
  const [agentDraft, setAgentDraft] = useState<BizAgent>({
    id: "",
    name: "",
    definition: agentDefinitionOptions[0],
    createdAt: "",
    remainingTokens: 100000,
    status: "فعال",
  });
  const [editingAgentId, setEditingAgentId] = useState<string | null>(null);

  const [levels, setLevels] = useState<AccessLevel[]>((business as any).levels ?? []);
  const [personnel, setPersonnel] = useState<Personnel[]>((business as any).personnel ?? []);
  const [selectedLevel, setSelectedLevel] = useState<AccessLevel | null>(null);

  // ذخیره‌ی خودکار زیرمجموعه‌ها داخل سند بیزینس
  const firstSave = useRef(true);
  useEffect(() => {
    if (firstSave.current) { firstSave.current = false; return; }
    const id = (business as any).id;
    if (id) api.update("businesses", String(id), { agents, levels, personnel } as any).catch(() => {});
  }, [agents, levels, personnel]);

  const [newLevelOpen, setNewLevelOpen] = useState(false);
  const [newLevelName, setNewLevelName] = useState("");

  const [changeLevelFor, setChangeLevelFor] = useState<Personnel | null>(null);
  const [newLevelForPerson, setNewLevelForPerson] = useState<string>("");

  const [addPersonOpen, setAddPersonOpen] = useState(false);
  const [draftPerson, setDraftPerson] = useState<Personnel>({
    id: "",
    name: "",
    email: "",
    accessLevel: levels[0]?.name ?? "",
    addedAt: "",
  });

  const levelCols: GridColumn[] = [
    { field: "name", headerName: "نام", filterType: "text" },
    { field: "createdAt", headerName: "تاریخ ایجاد", filterType: "date" },
    { field: "personnelCount", headerName: "تعداد پرسنل", filterType: "number" },
  ];

  const personnelCols: GridColumn[] = [
    { field: "name", headerName: "نام", filterType: "text" },
    { field: "email", headerName: "ایمیل", filterType: "text" },
    {
      field: "accessLevel",
      headerName: "سطح دسترسی",
      filterType: "set",
      editable: true,
      cellEditor: "agSelectCellEditor",
      cellEditorParams: { values: levels.map((l) => l.name) },
    },
    { field: "addedAt", headerName: "تاریخ افزودن", filterType: "date" },
  ];

  const removeLevel = (row: AccessLevel) => {
    setLevels((ls) => ls.filter((l) => l.id !== row.id));
    toast.success(`سطح «${row.name}» حذف شد`);
  };

  const addLevel = () => {
    if (!newLevelName.trim()) return;
    setLevels((ls) => [
      ...ls,
      {
        id: `AL${Date.now()}`,
        name: newLevelName,
        createdAt: new Date().toISOString().slice(0, 10),
        personnelCount: 0,
      },
    ]);
    setNewLevelName("");
    setNewLevelOpen(false);
    toast.success("سطح دسترسی ایجاد شد");
  };

  const openChangeLevel = (row: Personnel) => {
    setChangeLevelFor(row);
    setNewLevelForPerson(row.accessLevel);
  };

  const submitChangeLevel = () => {
    if (!changeLevelFor) return;
    setPersonnel((p) =>
      p.map((x) =>
        x.id === changeLevelFor.id
          ? { ...x, accessLevel: newLevelForPerson }
          : x,
      ),
    );
    toast.success(
      `سطح دسترسی ${changeLevelFor.name} به «${newLevelForPerson}» تغییر کرد`,
    );
    setChangeLevelFor(null);
  };

  const removePerson = (row: Personnel) => {
    setPersonnel((p) => p.filter((x) => x.id !== row.id));
    toast.success(`${row.name} حذف شد`);
  };

  const agentCols: GridColumn[] = [
    { field: "name", headerName: "نام ایجنت", filterType: "text" },
    { field: "definition", headerName: "تعریف", filterType: "set" },
    { field: "createdAt", headerName: "تاریخ ایجاد", filterType: "date" },
    { field: "remainingTokens", headerName: "توکن باقیمانده", filterType: "number" },
    { field: "status", headerName: "وضعیت", filterType: "set" },
  ];

  const openNewAgent = () => {
    setEditingAgentId(null);
    setAgentDraft({
      id: "",
      name: "",
      definition: agentDefinitionOptions[0],
      createdAt: new Date().toISOString().slice(0, 10),
      remainingTokens: 100000,
      status: "فعال",
    });
    setAgentDialogOpen(true);
  };

  const openEditAgent = (row: BizAgent) => {
    setEditingAgentId(row.id);
    setAgentDraft(row);
    setAgentDialogOpen(true);
  };

  const submitAgent = () => {
    if (!agentDraft.name.trim()) return;
    if (editingAgentId) {
      setAgents((a) =>
        a.map((x) => (x.id === editingAgentId ? { ...agentDraft } : x)),
      );
      toast.success("ایجنت به‌روزرسانی شد");
    } else {
      setAgents((a) => [...a, { ...agentDraft, id: `AG${Date.now()}` }]);
      toast.success("ایجنت اضافه شد");
    }
    setAgentDialogOpen(false);
  };

  const removeAgent = (row: BizAgent) => {
    setAgents((a) => a.filter((x) => x.id !== row.id));
    toast.success(`ایجنت «${row.name}» حذف شد`);
  };

  const addPerson = () => {
    if (!draftPerson.name.trim()) return;
    setPersonnel((p) => [
      ...p,
      {
        ...draftPerson,
        id: `U${Date.now()}`,
        addedAt: new Date().toISOString().slice(0, 10),
      },
    ]);
    setDraftPerson({
      id: "",
      name: "",
      email: "",
      accessLevel: levels[0]?.name ?? "",
      addedAt: "",
    });
    setAddPersonOpen(false);
    toast.success("پرسنل اضافه شد");
  };

  if (selectedCustomer) {
    return (
      <CustomerDetailView
        customer={selectedCustomer}
        onBack={() => setSelectedCustomer(null)}
      />
    );
  }

  if (selectedLevel) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-6">
        <AccessLevelDetailView
          level={selectedLevel}
          onBack={() => setSelectedLevel(null)}
          onUpdate={(next) => {
            setLevels((ls) => ls.map((l) => (l.id === next.id ? next : l)));
            setSelectedLevel(next);
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowRight className="h-4 w-4" />
          </Button>
          <div>
            <h1>مدیریت بیزینس — {business.name}</h1>
            <p className="text-sm text-muted-foreground">
              صاحب: {business.owner ?? "-"}
            </p>
          </div>
        </div>
        <Badge variant="secondary">
          {Array.isArray(business.agents)
            ? `${business.agents.length} ایجنت`
            : business.agent ?? ""}
        </Badge>
      </div>

      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">اطلاعات</TabsTrigger>
          <TabsTrigger value="access">سطوح دسترسی</TabsTrigger>
          <TabsTrigger value="personnel">پرسنل</TabsTrigger>
          <TabsTrigger value="agents">ایجنت‌ها</TabsTrigger>
          <TabsTrigger value="finance">مالی</TabsTrigger>
          <TabsTrigger value="customers">مشتریان</TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <Card>
            <CardHeader>
              <CardTitle>اطلاعات بیزینس</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label className="text-xs text-muted-foreground">نام بیزینس</Label>
                <Input value={business.name ?? ""} disabled />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs text-muted-foreground">صاحب</Label>
                <Input value={business.owner ?? ""} disabled />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs text-muted-foreground">ایجنت‌ها</Label>
                <Input
                  value={
                    Array.isArray(business.agents)
                      ? business.agents.join("، ")
                      : business.agent ?? ""
                  }
                  disabled
                />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs text-muted-foreground">تاریخ ایجاد</Label>
                <Input value={business.createdAt ?? ""} disabled />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs text-muted-foreground">تعداد کاربران</Label>
                <Input value={String(business.users ?? 0)} disabled />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="access">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>سطوح دسترسی</CardTitle>
              <Dialog open={newLevelOpen} onOpenChange={setNewLevelOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 ml-1" />
                    سطح دسترسی جدید
                  </Button>
                </DialogTrigger>
                <DialogContent dir="rtl">
                  <DialogHeader>
                    <DialogTitle>سطح دسترسی جدید</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-1.5">
                    <Label>نام سطح</Label>
                    <Input
                      value={newLevelName}
                      onChange={(e) => setNewLevelName(e.target.value)}
                    />
                  </div>
                  <DialogFooter>
                    <Button
                      variant="ghost"
                      onClick={() => setNewLevelOpen(false)}
                    >
                      انصراف
                    </Button>
                    <Button onClick={addLevel}>ایجاد</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <DataGrid
                rowData={levels}
                columnDefs={levelCols}
                actionsWidth={210}
                rowActions={[
                  {
                    label: "اصلاح",
                    icon: Pencil,
                    variant: "outline",
                    onClick: (row) => setSelectedLevel(row as AccessLevel),
                  },
                  {
                    label: "حذف",
                    icon: Trash2,
                    variant: "destructive",
                    onClick: (row) => removeLevel(row as AccessLevel),
                  },
                ]}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="personnel">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>پرسنل بیزینس</CardTitle>
              <Dialog open={addPersonOpen} onOpenChange={setAddPersonOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 ml-1" />
                    افزودن پرسنل
                  </Button>
                </DialogTrigger>
                <DialogContent dir="rtl">
                  <DialogHeader>
                    <DialogTitle>افزودن پرسنل جدید</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-3">
                    <div className="grid gap-1.5">
                      <Label>نام</Label>
                      <Input
                        value={draftPerson.name}
                        onChange={(e) =>
                          setDraftPerson({ ...draftPerson, name: e.target.value })
                        }
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label>ایمیل</Label>
                      <Input
                        value={draftPerson.email}
                        onChange={(e) =>
                          setDraftPerson({
                            ...draftPerson,
                            email: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label>سطح دسترسی</Label>
                      <Select
                        value={draftPerson.accessLevel}
                        onValueChange={(v) =>
                          setDraftPerson({ ...draftPerson, accessLevel: v })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {levels.map((l) => (
                            <SelectItem key={l.id} value={l.name}>
                              {l.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="ghost"
                      onClick={() => setAddPersonOpen(false)}
                    >
                      انصراف
                    </Button>
                    <Button onClick={addPerson}>افزودن</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <DataGrid
                rowData={personnel}
                columnDefs={personnelCols}
                actionsWidth={260}
                rowActions={[
                  {
                    label: "تغییر سطح دسترسی",
                    icon: ShieldCheck,
                    variant: "outline",
                    onClick: (row) => openChangeLevel(row as Personnel),
                  },
                  {
                    label: "حذف",
                    icon: Trash2,
                    variant: "destructive",
                    onClick: (row) => removePerson(row as Personnel),
                  },
                ]}
              />

              <Dialog
                open={!!changeLevelFor}
                onOpenChange={(o) => !o && setChangeLevelFor(null)}
              >
                <DialogContent dir="rtl">
                  <DialogHeader>
                    <DialogTitle>
                      تغییر سطح دسترسی
                      {changeLevelFor ? ` — ${changeLevelFor.name}` : ""}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-1.5">
                    <Label>سطح دسترسی جدید</Label>
                    <Select
                      value={newLevelForPerson}
                      onValueChange={setNewLevelForPerson}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {levels.map((l) => (
                          <SelectItem key={l.id} value={l.name}>
                            {l.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="ghost"
                      onClick={() => setChangeLevelFor(null)}
                    >
                      انصراف
                    </Button>
                    <Button onClick={submitChangeLevel}>ذخیره</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agents">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>ایجنت‌های بیزینس</CardTitle>
              <Button size="sm" onClick={openNewAgent}>
                <Plus className="h-4 w-4 ml-1" />
                افزودن ایجنت
              </Button>
            </CardHeader>
            <CardContent>
              <DataGrid
                rowData={agents}
                columnDefs={agentCols}
                actionsWidth={210}
                rowActions={[
                  {
                    label: "اصلاح",
                    icon: Pencil,
                    variant: "outline",
                    onClick: (row) => openEditAgent(row as BizAgent),
                  },
                  {
                    label: "حذف",
                    icon: Trash2,
                    variant: "destructive",
                    onClick: (row) => removeAgent(row as BizAgent),
                  },
                ]}
              />

              <Dialog open={agentDialogOpen} onOpenChange={setAgentDialogOpen}>
                <DialogContent dir="rtl">
                  <DialogHeader>
                    <DialogTitle>
                      {editingAgentId ? "اصلاح ایجنت" : "افزودن ایجنت جدید"}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-3">
                    <div className="grid gap-1.5">
                      <Label>نام ایجنت</Label>
                      <Input
                        value={agentDraft.name}
                        onChange={(e) =>
                          setAgentDraft({ ...agentDraft, name: e.target.value })
                        }
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label>تعریف ایجنت</Label>
                      <Select
                        value={agentDraft.definition}
                        onValueChange={(v) =>
                          setAgentDraft({ ...agentDraft, definition: v })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {agentDefinitionOptions.map((d) => (
                            <SelectItem key={d} value={d}>
                              {d}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="grid gap-1.5">
                        <Label>توکن اولیه</Label>
                        <Input
                          type="number"
                          value={agentDraft.remainingTokens}
                          onChange={(e) =>
                            setAgentDraft({
                              ...agentDraft,
                              remainingTokens: Number(e.target.value),
                            })
                          }
                        />
                      </div>
                      <div className="grid gap-1.5">
                        <Label>وضعیت</Label>
                        <Select
                          value={agentDraft.status}
                          onValueChange={(v) =>
                            setAgentDraft({
                              ...agentDraft,
                              status: v as BizAgent["status"],
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="فعال">فعال</SelectItem>
                            <SelectItem value="غیرفعال">غیرفعال</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="ghost"
                      onClick={() => setAgentDialogOpen(false)}
                    >
                      انصراف
                    </Button>
                    <Button onClick={submitAgent}>
                      {editingAgentId ? "ذخیره" : "افزودن"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="finance">
          <Card>
            <CardHeader>
              <CardTitle>تراکنش‌های بیزینس</CardTitle>
            </CardHeader>
            <CardContent>
              <DataGrid rowData={transactions} columnDefs={txCols} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers">
          <Card>
            <CardHeader>
              <CardTitle>مشتریان بیزینس</CardTitle>
            </CardHeader>
            <CardContent>
              <DataGrid
                rowData={customers}
                columnDefs={customerCols}
                actionLabel="مشاهده"
                onRowAction={(row) => setSelectedCustomer(row as Customer)}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
