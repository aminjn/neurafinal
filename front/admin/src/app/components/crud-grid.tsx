import { useEffect, useState } from "react";
import { DataGrid, type GridColumn } from "./data-grid";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "./ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "./ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "./ui/alert-dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "../api";

export type FormField = {
  key: string;
  label: string;
  type?: "text" | "number" | "password" | "select";
  options?: { value: string; label: string }[];
  required?: boolean;
  createOnly?: boolean; // فقط هنگام ساخت (مثلاً نام‌کاربری)
};

// تولید خودکار فیلدهای فرم از روی ستون‌ها (به‌جز شناسه و ستون‌های محاسبه‌ای)
export function fieldsFromColumns(columns: GridColumn[]): FormField[] {
  return columns
    .filter((c: any) =>
      c.field && c.field !== "id" && !c.valueFormatter && !c.valueGetter && !c.cellRenderer,
    )
    .map((c: any) => ({
      key: c.field,
      label: c.headerName || c.field,
      type: c.filterType === "number" ? "number" : "text",
    }));
}

export function CrudDataGrid({
  title, description, apiKind, collection, columns, fields, mapRow, onRowAction, embedded,
}: {
  title?: string;
  description?: string;
  apiKind: "data" | "users";
  collection: string;
  columns: GridColumn[];
  fields: FormField[];
  mapRow?: (raw: any) => any; // نگاشت رکورد سرور به ردیف گرید
  onRowAction?: (row: any) => void;
  embedded?: boolean; // فقط دکمه افزودن + جدول + دیالوگ‌ها (بدون هدر صفحه)
}) {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any | null>(null); // null=بسته، {}=جدید، {...}=ویرایش
  const [draft, setDraft] = useState<Record<string, any>>({});
  const [confirmDel, setConfirmDel] = useState<any | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      if (apiKind === "users") {
        const r = await api.listUsers({ limit: 200 });
        setRows(r.items.map((u: any) => mapRow ? mapRow(u) : u));
      } else {
        const data = await api.list(collection);
        setRows(mapRow ? data.map(mapRow) : data);
      }
    } catch { /* خالی می‌ماند */ }
    setLoading(false);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [collection, apiKind]);

  const isEdit = !!(editing && editing.id != null);

  const save = async () => {
    for (const f of fields) {
      if (f.required && (f.createOnly ? !isEdit : true) && !String(draft[f.key] ?? "").trim()) {
        toast.error(`«${f.label}» الزامی است`);
        return;
      }
    }
    // فقط فیلدهای فرم را بفرست
    const payload: Record<string, any> = {};
    for (const f of fields) {
      if (draft[f.key] === undefined || draft[f.key] === "") continue;
      if (f.createOnly && isEdit) continue;
      payload[f.key] = f.type === "number" ? Number(draft[f.key]) : draft[f.key];
    }
    try {
      if (apiKind === "users") {
        if (isEdit) await api.updateUser(editing.id, payload as any);
        else await api.createUser(payload as any);
      } else {
        if (isEdit) await api.update(collection, String(editing.id), payload);
        else await api.create(collection, payload);
      }
      toast.success(isEdit ? "ویرایش شد" : "ایجاد شد");
      setEditing(null);
      load();
    } catch (e: any) {
      toast.error(e?.status === 409 ? "تکراری است" : e?.status === 403 ? "دسترسی کافی نیست" : "خطا در ذخیره");
    }
  };

  const del = async () => {
    try {
      if (apiKind === "users") await api.deleteUser(confirmDel.id);
      else await api.remove(collection, String(confirmDel.id));
      toast.success("حذف شد");
      load();
    } catch { toast.error("خطا در حذف"); }
    setConfirmDel(null);
  };

  const gridColumns: GridColumn[] = [
    ...columns,
    {
      field: "__actions",
      headerName: "عملیات",
      width: 130,
      sortable: false,
      filterType: "text",
      cellRenderer: (p: { data: any }) => (
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" onClick={() => { setEditing(p.data); setDraft({ ...p.data }); }} title="ویرایش">
            <Pencil className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setConfirmDel(p.data)} title="حذف">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    } as any,
  ];

  const dialogs = (
    <>
      {/* فرم ایجاد/ویرایش */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>{isEdit ? "ویرایش" : "افزودن"}{title ? ` — ${title}` : ""}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-1 max-h-[60vh] overflow-y-auto">
            {fields.map((f) => (
              (f.createOnly && isEdit) ? null : (
                <div key={f.key} className="grid gap-1.5">
                  <Label className="text-xs">{f.label}{f.required ? " *" : ""}</Label>
                  {f.type === "select" ? (
                    <Select value={String(draft[f.key] ?? "")} onValueChange={(v) => setDraft({ ...draft, [f.key]: v })}>
                      <SelectTrigger><SelectValue placeholder="انتخاب" /></SelectTrigger>
                      <SelectContent>
                        {f.options?.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      type={f.type === "number" ? "number" : f.type === "password" ? "password" : "text"}
                      dir={f.type === "password" ? "ltr" : undefined}
                      value={draft[f.key] ?? ""}
                      onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}
                    />
                  )}
                </div>
              )
            ))}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)}>انصراف</Button>
            <Button onClick={save}>{isEdit ? "ذخیره" : "ایجاد"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* تأیید حذف */}
      <AlertDialog open={!!confirmDel} onOpenChange={(o) => !o && setConfirmDel(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>حذف رکورد</AlertDialogTitle>
            <AlertDialogDescription>این مورد حذف شود؟ این عمل قابل بازگشت نیست.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>انصراف</AlertDialogCancel>
            <AlertDialogAction onClick={del}>حذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );

  if (embedded) {
    return (
      <>
        <div className="mb-2 flex justify-end">
          <Button size="sm" onClick={() => { setEditing({}); setDraft({}); }}>
            <Plus className="h-4 w-4 ml-1" /> افزودن
          </Button>
        </div>
        {loading ? (
          <div className="flex h-48 items-center justify-center text-muted-foreground">در حال بارگذاری…</div>
        ) : (
          <DataGrid rowData={rows} columnDefs={gridColumns} onRowAction={onRowAction} />
        )}
        {dialogs}
      </>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>{title}</h1>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        <Button onClick={() => { setEditing({}); setDraft({}); }}>
          <Plus className="h-4 w-4 ml-1" /> افزودن
        </Button>
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center text-muted-foreground">در حال بارگذاری…</div>
      ) : (
        <DataGrid rowData={rows} columnDefs={gridColumns} onRowAction={onRowAction} />
      )}

      {dialogs}
    </div>
  );
}
