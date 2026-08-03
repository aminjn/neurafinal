import { useEffect, useState } from "react";
import { api } from "../api";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
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
import { Plus } from "lucide-react";
import { DataGrid, type GridColumn } from "./data-grid";
import { CrudDataGrid, fieldsFromColumns } from "./crud-grid";
import { toast } from "sonner";

export type Business = {
  id: string;
  name: string;
  owner: string;
  agents: string[];
  createdAt: string;
  users: number;
};

const ownerOptions = [
  "سارا احمدی",
  "محمد کریمی",
  "نگار موسوی",
  "رضا نجفی",
  "مریم صادقی",
];

const initialRows: Business[] = [
  { id: "B1", name: "فروشگاه آلفا", owner: "سارا احمدی", agents: ["حسابدار", "پشتیبان"], createdAt: "2026-02-12", users: 12 },
  { id: "B2", name: "انبار بتا", owner: "محمد کریمی", agents: ["انباردار"], createdAt: "2026-02-18", users: 7 },
  { id: "B3", name: "خدمات گاما", owner: "نگار موسوی", agents: ["پشتیبان", "بازاریاب"], createdAt: "2026-03-05", users: 24 },
];

const columns: GridColumn[] = [
  { field: "name", headerName: "نام بیزینس", filterType: "text" },
  { field: "owner", headerName: "صاحب", filterType: "set" },
  {
    field: "agents",
    headerName: "ایجنت‌ها",
    filterType: "text",
    flex: 2,
    valueFormatter: (p: any) => (Array.isArray(p.value) ? p.value.join("، ") : ""),
  },
  { field: "createdAt", headerName: "تاریخ ایجاد", filterType: "date" },
  { field: "users", headerName: "تعداد کاربران", filterType: "number" },
];

export function BusinessesPage({
  onRowAction,
}: {
  onRowAction: (row: Business) => void;
}) {
  const [rows, setRows] = useState<Business[]>([]);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [owner, setOwner] = useState<string>(ownerOptions[0]);

  const load = async () => {
    try {
      setRows(await api.list<Business>("businesses")); // خالی هم خالی نمایش داده شود
    } catch {
      setRows(initialRows); // فقط در حالت آفلاین، نمونه
    }
  };
  useEffect(() => { load(); }, []);

  const submit = async () => {
    if (!name.trim()) return;
    const biz: Business = {
      id: `B${Date.now()}`,
      name,
      owner,
      agents: [],
      createdAt: new Date().toISOString().slice(0, 10),
      users: 0,
    };
    try {
      await api.create("businesses", biz);
      await load();
      toast.success("بیزینس جدید ایجاد شد");
    } catch {
      setRows((r) => [...r, biz]); // fallback محلی
      toast.success("بیزینس جدید ایجاد شد (محلی)");
    }
    setName("");
    setOwner(ownerOptions[0]);
    setOpen(false);
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>بیزینس‌ها</h1>
          <p className="text-sm text-muted-foreground">
            مدیریت بیزینس‌های ثبت‌شده در اپلیکیشن
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 ml-1" />
              بیزینس جدید
            </Button>
          </DialogTrigger>
          <DialogContent dir="rtl">
            <DialogHeader>
              <DialogTitle>بیزینس جدید</DialogTitle>
            </DialogHeader>
            <div className="grid gap-3">
              <div className="grid gap-1.5">
                <Label>نام بیزینس</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثلاً: فروشگاه دلتا"
                />
              </div>
              <div className="grid gap-1.5">
                <Label>صاحب بیزینس</Label>
                <Select value={owner} onValueChange={setOwner}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ownerOptions.map((o) => (
                      <SelectItem key={o} value={o}>
                        {o}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>
                انصراف
              </Button>
              <Button onClick={submit}>ایجاد</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>لیست بیزینس‌ها</CardTitle>
        </CardHeader>
        <CardContent>
          <CrudDataGrid
            embedded
            apiKind="data"
            collection="businesses"
            columns={columns}
            fields={fieldsFromColumns(columns)}
            onRowAction={(row) => onRowAction(row as Business)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
