import { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Switch } from "./ui/switch";
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
import { ArrowRight, Plus, Save, Search, Settings2, Trash2 } from "lucide-react";
import { toast } from "sonner";

type Theme = {
  id: string;
  name: string;
  enabled: boolean;
  rank: number;
  variables: Record<string, string>;
};

const cssVariables: Record<string, string> = {
  "--background": "#ffffff",
  "--foreground": "#0a0a0a",
  "--card": "#ffffff",
  "--card-foreground": "#0a0a0a",
  "--popover": "#ffffff",
  "--popover-foreground": "#0a0a0a",
  "--primary": "#7c3aed",
  "--primary-foreground": "#ffffff",
  "--secondary": "#f4f4f5",
  "--secondary-foreground": "#0a0a0a",
  "--muted": "#f4f4f5",
  "--muted-foreground": "#71717a",
  "--accent": "#f4f4f5",
  "--accent-foreground": "#0a0a0a",
  "--destructive": "#ef4444",
  "--destructive-foreground": "#ffffff",
  "--border": "#e4e4e7",
  "--input": "#e4e4e7",
  "--ring": "#7c3aed",
  "--radius": "0.5rem",
};

const initialThemes: Theme[] = [
  {
    id: "TH-001",
    name: "روشن (پیش‌فرض)",
    enabled: true,
    rank: 1,
    variables: { ...cssVariables },
  },
  {
    id: "TH-002",
    name: "تیره",
    enabled: true,
    rank: 2,
    variables: {
      ...cssVariables,
      "--background": "#0a0a0a",
      "--foreground": "#fafafa",
      "--card": "#171717",
      "--card-foreground": "#fafafa",
      "--popover": "#171717",
      "--popover-foreground": "#fafafa",
      "--secondary": "#262626",
      "--secondary-foreground": "#fafafa",
      "--muted": "#262626",
      "--muted-foreground": "#a3a3a3",
      "--accent": "#262626",
      "--accent-foreground": "#fafafa",
      "--border": "#262626",
      "--input": "#262626",
    },
  },
  {
    id: "TH-003",
    name: "بنفش گلاسی",
    enabled: false,
    rank: 3,
    variables: {
      ...cssVariables,
      "--primary": "#8b5cf6",
      "--ring": "#8b5cf6",
      "--background": "#faf5ff",
      "--accent": "#ede9fe",
      "--accent-foreground": "#4c1d95",
    },
  },
];

function ThemeDetail({
  theme,
  onBack,
  onUpdate,
  onDelete,
}: {
  theme: Theme;
  onBack: () => void;
  onUpdate: (next: Theme) => void;
  onDelete: () => void;
}) {
  const [name, setName] = useState(theme.name);
  const [enabled, setEnabled] = useState(theme.enabled);
  const [rank, setRank] = useState(theme.rank);
  const [variables, setVariables] = useState<Record<string, string>>({
    ...theme.variables,
  });
  const [query, setQuery] = useState("");

  const cssKeys = Object.keys(cssVariables);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const entries = cssKeys.map(
      (k) => [k, variables[k] ?? ""] as [string, string],
    );
    if (!q) return entries;
    return entries.filter(
      ([k, v]) =>
        k.toLowerCase().includes(q) || v.toLowerCase().includes(q),
    );
  }, [variables, query, cssKeys]);

  const isColor = (v: string) =>
    /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(v.trim());

  const save = () => {
    onUpdate({ ...theme, name, enabled, rank, variables });
    toast.success("تم به‌روزرسانی شد");
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowRight className="h-4 w-4" />
          </Button>
          <div>
            <h1>مدیریت تم — {name}</h1>
            <p className="text-sm text-muted-foreground">
              {cssKeys.length} متغیر CSS
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
          <TabsTrigger value="info">اطلاعات کلی</TabsTrigger>
          <TabsTrigger value="vars">متغیرهای CSS</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="m-0">
          <Card>
            <CardHeader>
              <CardTitle>اطلاعات تم</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label>نام</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="grid gap-1.5">
                <Label>رتبه</Label>
                <Input
                  type="number"
                  value={rank}
                  onChange={(e) => setRank(Number(e.target.value) || 0)}
                />
              </div>
              <div className="flex items-center justify-between rounded-md border p-3 md:col-span-2">
                <div className="flex flex-col">
                  <span className="text-sm">فعال</span>
                  <span className="text-xs text-muted-foreground">
                    در دسترس کاربران نهایی
                  </span>
                </div>
                <Switch checked={enabled} onCheckedChange={setEnabled} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vars" className="m-0">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>متغیرهای CSS</span>
                <Badge variant="secondary">
                  {filtered.length} از {cssKeys.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="relative">
                <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="جستجو در متغیر یا مقدار..."
                  className="pr-9"
                />
              </div>

              <div className="flex flex-col divide-y rounded-md border">
                {filtered.length === 0 ? (
                  <div className="p-6 text-center text-sm text-muted-foreground">
                    موردی یافت نشد
                  </div>
                ) : (
                  filtered.map(([k, v]) => (
                    <div
                      key={k}
                      className="grid grid-cols-1 md:grid-cols-[1fr_2fr_auto] gap-2 p-3 items-center"
                    >
                      <code className="text-xs bg-muted px-2 py-1 rounded self-center">
                        {k}
                      </code>
                      <Input
                        value={v}
                        dir="ltr"
                        onChange={(e) =>
                          setVariables((vars) => ({
                            ...vars,
                            [k]: e.target.value,
                          }))
                        }
                      />
                      {isColor(v) ? (
                        <input
                          type="color"
                          value={v}
                          onChange={(e) =>
                            setVariables((vars) => ({
                              ...vars,
                              [k]: e.target.value,
                            }))
                          }
                          className="h-9 w-12 cursor-pointer rounded border bg-background"
                        />
                      ) : (
                        <span className="h-9 w-12" />
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export function ThemesPage() {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [selected, setSelected] = useState<Theme | null>(null);

  useEffect(() => {
    (async () => {
      try {
        let data = await api.list<Theme>("themes");
        if (!data.length) {
          for (const t of initialThemes) { try { await api.create("themes", t); } catch {} }
          data = await api.list<Theme>("themes");
        }
        setThemes((data.length ? data : initialThemes).sort((a, b) => a.rank - b.rank));
      } catch { setThemes(initialThemes); }
    })();
  }, []);
  const [addOpen, setAddOpen] = useState(false);

  const [newName, setNewName] = useState("");
  const [newRank, setNewRank] = useState(1);
  const [newEnabled, setNewEnabled] = useState(true);

  const createTheme = () => {
    if (!newName.trim()) {
      toast.error("نام تم الزامی است");
      return;
    }
    const theme: Theme = {
      id: `TH-${Date.now().toString().slice(-4)}`,
      name: newName.trim(),
      enabled: newEnabled,
      rank: newRank,
      variables: { ...cssVariables },
    };
    api.create("themes", theme).catch(() => {});
    setThemes((ts) => [...ts, theme].sort((a, b) => a.rank - b.rank));
    setNewName("");
    setNewRank(1);
    setNewEnabled(true);
    setAddOpen(false);
    toast.success("تم جدید اضافه شد");
  };

  const columns: GridColumn[] = [
    { field: "id", headerName: "شناسه", filterType: "text", width: 110 },
    { field: "name", headerName: "نام", filterType: "text", flex: 2 },
    { field: "rank", headerName: "رتبه", filterType: "number", width: 90 },
    {
      field: "enabled",
      headerName: "وضعیت",
      filterType: "set",
      width: 110,
      valueGetter: (p: { data: Theme }) =>
        p.data.enabled ? "فعال" : "غیرفعال",
    },
    {
      field: "actions",
      headerName: "عملیات",
      width: 130,
      sortable: false,
      filterType: "text",
      cellRenderer: (p: { data: Theme }) => (
        <Button size="sm" variant="ghost" onClick={() => setSelected(p.data)}>
          <Settings2 className="h-4 w-4 ml-1" />
          مدیریت
        </Button>
      ),
    },
  ];

  if (selected) {
    return (
      <ThemeDetail
        theme={selected}
        onBack={() => setSelected(null)}
        onUpdate={(next) => {
          api.update("themes", next.id, next).catch(() => {});
          setThemes((ts) => ts.map((t) => (t.id === next.id ? next : t)));
          setSelected(next);
        }}
        onDelete={() => {
          api.remove("themes", selected.id).catch(() => {});
          setThemes((ts) => ts.filter((t) => t.id !== selected.id));
          setSelected(null);
          toast.success("تم حذف شد");
        }}
      />
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>مدیریت ظاهری اپلیکیشن</h1>
          <p className="text-sm text-muted-foreground">
            تعریف تم‌های اپلیکیشن و مدیریت متغیرهای CSS هر تم
          </p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 ml-1" />
              تم جدید
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>تعریف تم جدید</DialogTitle>
            </DialogHeader>
            <div className="grid gap-3">
              <div className="grid gap-1.5">
                <Label>نام</Label>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="مثلاً: تم آبی"
                />
              </div>
              <div className="grid gap-1.5">
                <Label>رتبه</Label>
                <Input
                  type="number"
                  value={newRank}
                  onChange={(e) => setNewRank(Number(e.target.value) || 0)}
                />
              </div>
              <div className="flex items-center justify-between rounded-md border p-3">
                <span className="text-sm">فعال</span>
                <Switch checked={newEnabled} onCheckedChange={setNewEnabled} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddOpen(false)}>
                انصراف
              </Button>
              <Button onClick={createTheme}>ایجاد</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>لیست تم‌ها</span>
            <Badge variant="secondary">{themes.length} تم</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataGrid rowData={themes} columnDefs={columns} />
        </CardContent>
      </Card>
    </div>
  );
}
