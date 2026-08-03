import { isoToShamsi, shamsiToISO } from "../jalali";
import { useEffect, useState } from "react";
import { api } from "../api";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Switch } from "./ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Plus } from "lucide-react";
import { DataGrid, type GridColumn } from "./data-grid";

export type AgentDef = {
  name: string;
  createdAt: string;
  description: string;
  rank: number;
  status: "فعال" | "غیرفعال";
};

const initialRows: AgentDef[] = [
  { name: "حسابدار", createdAt: "2025-08-12", description: "ایجنت تخصصی برای امور مالی و حسابداری", rank: 5, status: "فعال" },
  { name: "انباردار", createdAt: "2025-09-20", description: "مدیریت موجودی و انبار", rank: 4, status: "فعال" },
  { name: "پشتیبان", createdAt: "2025-10-05", description: "پاسخ‌گویی به سوالات کاربران", rank: 4, status: "فعال" },
  { name: "بازاریاب", createdAt: "2026-01-18", description: "تولید محتوا و کمپین تبلیغاتی", rank: 3, status: "غیرفعال" },
];

const columns: GridColumn[] = [
  { field: "name", headerName: "نام", filterType: "text" },
  { field: "createdAt", headerName: "تاریخ ایجاد", filterType: "date" },
  { field: "description", headerName: "توضیحات", filterType: "text", flex: 2 },
  { field: "rank", headerName: "رتبه", filterType: "number", width: 110 },
  { field: "status", headerName: "وضعیت", filterType: "set", width: 130 },
];

export function AgentDefsPage({
  onRowAction,
}: {
  onRowAction: (row: AgentDef) => void;
}) {
  const [rows, setRows] = useState<AgentDef[]>([]);
  const [open, setOpen] = useState(false);

  // بار اول، تعاریف پیش‌فرض را در DB seed می‌کنیم؛ سپس از همان‌جا می‌خوانیم
  useEffect(() => {
    (async () => {
      try {
        let data = await api.list<AgentDef>("agent_defs");
        if (!data.length) {
          for (const r of initialRows) { try { await api.create("agent_defs", { ...r, id: r.name }); } catch {} }
          data = await api.list<AgentDef>("agent_defs");
        }
        setRows(data.length ? data : initialRows);
      } catch {
        setRows(initialRows);
      }
    })();
  }, []);
  const [draft, setDraft] = useState<AgentDef>({
    name: "",
    createdAt: new Date().toISOString().slice(0, 10),
    description: "",
    rank: 3,
    status: "فعال",
  });

  const reset = () =>
    setDraft({
      name: "",
      createdAt: new Date().toISOString().slice(0, 10),
      description: "",
      rank: 3,
      status: "فعال",
    });

  const submit = async () => {
    if (!draft.name.trim()) return;
    try { await api.create("agent_defs", { ...draft, id: draft.name }); } catch {}
    setRows([...rows, draft]);
    reset();
    setOpen(false);
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>تعاریف ایجنت‌ها</h1>
          <p className="text-sm text-muted-foreground">
            تعریف و مدیریت انواع ایجنت‌های قابل ارائه به کاربران
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 ml-1" />
              تعریف ایجنت جدید
            </Button>
          </DialogTrigger>
          <DialogContent dir="rtl">
            <DialogHeader>
              <DialogTitle>تعریف ایجنت جدید</DialogTitle>
              <DialogDescription>
                مشخصات ایجنت جدید را وارد کنید.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid gap-1.5">
                <Label>نام</Label>
                <Input
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  placeholder="مثلاً: مشاور حقوقی"
                />
              </div>
              <div className="grid gap-1.5">
                <Label>توضیحات</Label>
                <Textarea
                  value={draft.description}
                  onChange={(e) =>
                    setDraft({ ...draft, description: e.target.value })
                  }
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <Label>رتبه (1 تا 5)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={5}
                    value={draft.rank}
                    onChange={(e) =>
                      setDraft({ ...draft, rank: Number(e.target.value) })
                    }
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label>تاریخ ایجاد (شمسی)</Label>
                  <Input
                    dir="ltr"
                    placeholder="۱۴۰۴/۰۴/۱۵"
                    defaultValue={isoToShamsi(draft.createdAt)}
                    onBlur={(e) => { const v = e.target.value.trim(); setDraft({ ...draft, createdAt: v ? shamsiToISO(v) : "" }); }}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between border rounded-md p-3">
                <div className="flex flex-col">
                  <Label>وضعیت فعال</Label>
                  <span className="text-xs text-muted-foreground">
                    در صورت غیرفعال بودن، در دسترس کاربران قرار نمی‌گیرد
                  </span>
                </div>
                <Switch
                  checked={draft.status === "فعال"}
                  onCheckedChange={(c) =>
                    setDraft({ ...draft, status: c ? "فعال" : "غیرفعال" })
                  }
                />
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
          <CardTitle>لیست تعاریف</CardTitle>
        </CardHeader>
        <CardContent>
          <DataGrid
            rowData={rows}
            columnDefs={columns}
            onRowAction={(row) => onRowAction(row as AgentDef)}
            actionLabel="تنظیمات"
          />
        </CardContent>
      </Card>
    </div>
  );
}
