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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { DataGrid, type GridColumn } from "./data-grid";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { ArrowRight, Plus, Save, Search, Settings2, Trash2 } from "lucide-react";
import { toast } from "sonner";

type CalendarType = "شمسی" | "قمری" | "گریگوری";

type Language = {
  id: string;
  name: string;
  nativeName: string;
  iso2: string;
  iso3: string;
  locale: string;
  calendar: CalendarType;
  rank: number;
  direction: "rtl" | "ltr";
  timezone: string;
  enabled: boolean;
  translations: Record<string, string>;
};

const calendarOptions: CalendarType[] = ["شمسی", "قمری", "گریگوری"];

const localeOptions = [
  "IR",
  "US",
  "GB",
  "AE",
  "SA",
  "TR",
  "DE",
  "FR",
  "AF",
  "TJ",
];

const defaultKeys: Record<string, string> = {
  "app.title": "پنل مدیریت",
  "common.save": "ذخیره",
  "common.cancel": "انصراف",
  "common.delete": "حذف",
  "common.edit": "ویرایش",
  "common.search": "جستجو",
  "nav.dashboard": "داشبورد",
  "nav.users": "کاربران",
  "nav.businesses": "بیزینس‌ها",
  "auth.login": "ورود",
  "auth.logout": "خروج",
  "agent.marketer": "ایجنت بازاریاب",
  "agent.secretary": "ایجنت منشی",
  "agent.finance": "ایجنت مالی/اداری",
};

const enKeys: Record<string, string> = {
  "app.title": "Admin Panel",
  "common.save": "Save",
  "common.cancel": "Cancel",
  "common.delete": "Delete",
  "common.edit": "Edit",
  "common.search": "Search",
  "nav.dashboard": "Dashboard",
  "nav.users": "Users",
  "nav.businesses": "Businesses",
  "auth.login": "Login",
  "auth.logout": "Logout",
  "agent.marketer": "Marketer Agent",
  "agent.secretary": "Secretary Agent",
  "agent.finance": "Finance Agent",
};

const arKeys: Record<string, string> = {
  "app.title": "لوحة الإدارة",
  "common.save": "حفظ",
  "common.cancel": "إلغاء",
  "common.delete": "حذف",
  "common.edit": "تعديل",
  "common.search": "بحث",
  "nav.dashboard": "اللوحة",
  "nav.users": "المستخدمون",
  "nav.businesses": "الأعمال",
  "auth.login": "تسجيل الدخول",
  "auth.logout": "تسجيل الخروج",
  "agent.marketer": "وكيل التسويق",
  "agent.secretary": "وكيل السكرتارية",
  "agent.finance": "وكيل المالية",
};

const initialLanguages: Language[] = [
  {
    id: "LN-001",
    name: "فارسی",
    nativeName: "فارسی",
    iso2: "fa",
    iso3: "fas",
    locale: "IR",
    calendar: "شمسی",
    rank: 1,
    direction: "rtl",
    timezone: "Asia/Tehran",
    enabled: true,
    translations: { ...defaultKeys },
  },
  {
    id: "LN-002",
    name: "انگلیسی",
    nativeName: "English",
    iso2: "en",
    iso3: "eng",
    locale: "US",
    calendar: "گریگوری",
    rank: 2,
    direction: "ltr",
    timezone: "UTC",
    enabled: true,
    translations: { ...enKeys },
  },
  {
    id: "LN-003",
    name: "عربی",
    nativeName: "العربية",
    iso2: "ar",
    iso3: "ara",
    locale: "SA",
    calendar: "قمری",
    rank: 3,
    direction: "rtl",
    timezone: "Asia/Riyadh",
    enabled: false,
    translations: { ...arKeys },
  },
];

const timezones = [
  "Asia/Tehran",
  "Asia/Dubai",
  "Asia/Riyadh",
  "Asia/Istanbul",
  "Europe/London",
  "Europe/Berlin",
  "America/New_York",
  "UTC",
];

function LanguageDetail({
  lang,
  onBack,
  onUpdate,
  onDelete,
}: {
  lang: Language;
  onBack: () => void;
  onUpdate: (next: Language) => void;
  onDelete: () => void;
}) {
  const [name, setName] = useState(lang.name);
  const [nativeName, setNativeName] = useState(lang.nativeName);
  const [iso2, setIso2] = useState(lang.iso2);
  const [iso3, setIso3] = useState(lang.iso3);
  const [locale, setLocale] = useState(lang.locale);
  const [calendar, setCalendar] = useState<CalendarType>(lang.calendar);
  const [rank, setRank] = useState(lang.rank);
  const [direction, setDirection] = useState(lang.direction);
  const [timezone, setTimezone] = useState(lang.timezone);
  const [enabled, setEnabled] = useState(lang.enabled);
  const [translations, setTranslations] = useState<Record<string, string>>({
    ...lang.translations,
  });
  const [query, setQuery] = useState("");

  const hardcodedKeys = Object.keys(defaultKeys);

  const filteredKeys = useMemo(() => {
    const q = query.trim().toLowerCase();
    const entries = hardcodedKeys.map(
      (k) => [k, translations[k] ?? ""] as [string, string],
    );
    if (!q) return entries;
    return entries.filter(
      ([k, v]) =>
        k.toLowerCase().includes(q) || v.toLowerCase().includes(q),
    );
  }, [translations, query, hardcodedKeys]);

  const save = () => {
    onUpdate({
      ...lang,
      name,
      nativeName,
      iso2,
      iso3,
      locale,
      calendar,
      rank,
      direction,
      timezone,
      enabled,
      translations,
    });
    toast.success("زبان به‌روزرسانی شد");
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowRight className="h-4 w-4" />
          </Button>
          <div>
            <h1>
              مدیریت زبان — {name} ({nativeName})
            </h1>
            <p className="text-sm text-muted-foreground">
              {hardcodedKeys.length} کلید ترجمه
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
          <TabsTrigger value="translations">ترجمه‌ها</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="m-0">
          <Card>
            <CardHeader>
              <CardTitle>اطلاعات زبان</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="grid gap-1.5">
            <Label>نام</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label>نام بومی</Label>
            <Input
              value={nativeName}
              onChange={(e) => setNativeName(e.target.value)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label>ISO 639-1 (دو حرفی)</Label>
            <Input
              value={iso2}
              maxLength={2}
              onChange={(e) => setIso2(e.target.value)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label>ISO 639-2 (سه حرفی)</Label>
            <Input
              value={iso3}
              maxLength={3}
              onChange={(e) => setIso3(e.target.value)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label>Locale</Label>
            <Select value={locale} onValueChange={setLocale}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {localeOptions.map((l) => (
                  <SelectItem key={l} value={l}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label>نوع تقویم</Label>
            <Select
              value={calendar}
              onValueChange={(v) => setCalendar(v as CalendarType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {calendarOptions.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label>رتبه</Label>
            <Input
              type="number"
              value={rank}
              onChange={(e) => setRank(Number(e.target.value) || 0)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label>جهت نوشتار</Label>
            <Select
              value={direction}
              onValueChange={(v) => setDirection(v as "rtl" | "ltr")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rtl">راست به چپ (RTL)</SelectItem>
                <SelectItem value="ltr">چپ به راست (LTR)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label>تایم زون دیفالت</Label>
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {timezones.map((tz) => (
                  <SelectItem key={tz} value={tz}>
                    {tz}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between rounded-md border p-3">
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

        <TabsContent value="translations" className="m-0">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>ترجمه‌ها (Key / Value)</span>
                <Badge variant="secondary">
                  {filteredKeys.length} از {hardcodedKeys.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="relative">
                <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="جستجو در کلید یا مقدار..."
                  className="pr-9"
                />
              </div>

              <div className="flex flex-col divide-y rounded-md border">
                {filteredKeys.length === 0 ? (
                  <div className="p-6 text-center text-sm text-muted-foreground">
                    موردی یافت نشد
                  </div>
                ) : (
                  filteredKeys.map(([k, v]) => (
                    <div
                      key={k}
                      className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-2 p-3 items-center"
                    >
                      <code className="text-xs bg-muted px-2 py-1 rounded self-center">
                        {k}
                      </code>
                      <Input
                        value={v}
                        onChange={(e) =>
                          setTranslations((t) => ({
                            ...t,
                            [k]: e.target.value,
                          }))
                        }
                        dir={direction}
                      />
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

export function LanguagesPage() {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [selected, setSelected] = useState<Language | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        let data = await api.list<Language>("languages");
        if (!data.length) {
          for (const l of initialLanguages) { try { await api.create("languages", l); } catch {} }
          data = await api.list<Language>("languages");
        }
        setLanguages((data.length ? data : initialLanguages).sort((a, b) => a.rank - b.rank));
      } catch { setLanguages(initialLanguages); }
    })();
  }, []);

  const [newName, setNewName] = useState("");
  const [newNative, setNewNative] = useState("");
  const [newIso2, setNewIso2] = useState("");
  const [newIso3, setNewIso3] = useState("");
  const [newLocale, setNewLocale] = useState("US");
  const [newCalendar, setNewCalendar] = useState<CalendarType>("گریگوری");
  const [newRank, setNewRank] = useState(1);
  const [newDirection, setNewDirection] = useState<"rtl" | "ltr">("ltr");
  const [newTimezone, setNewTimezone] = useState("UTC");

  const createLanguage = () => {
    if (!newName.trim() || !newIso2.trim()) {
      toast.error("نام و کد ISO 639-1 الزامی است");
      return;
    }
    const lang: Language = {
      id: `LN-${Date.now().toString().slice(-4)}`,
      name: newName.trim(),
      nativeName: newNative.trim() || newName.trim(),
      iso2: newIso2.trim().toLowerCase(),
      iso3: newIso3.trim().toLowerCase(),
      locale: newLocale,
      calendar: newCalendar,
      rank: newRank,
      direction: newDirection,
      timezone: newTimezone,
      enabled: true,
      translations: Object.fromEntries(
        Object.keys(defaultKeys).map((k) => [k, ""]),
      ),
    };
    api.create("languages", lang).catch(() => {});
    setLanguages((ls) => [...ls, lang].sort((a, b) => a.rank - b.rank));
    setNewName("");
    setNewNative("");
    setNewIso2("");
    setNewIso3("");
    setNewLocale("US");
    setNewCalendar("گریگوری");
    setNewRank(1);
    setNewDirection("ltr");
    setNewTimezone("UTC");
    setAddOpen(false);
    toast.success("زبان جدید اضافه شد");
  };

  const columns: GridColumn[] = [
    { field: "id", headerName: "شناسه", filterType: "text", width: 110 },
    { field: "name", headerName: "نام", filterType: "text" },
    { field: "nativeName", headerName: "نام بومی", filterType: "text" },
    { field: "iso2", headerName: "ISO-2", filterType: "text", width: 90 },
    { field: "iso3", headerName: "ISO-3", filterType: "text", width: 90 },
    { field: "locale", headerName: "Locale", filterType: "set", width: 100 },
    { field: "calendar", headerName: "تقویم", filterType: "set", width: 110 },
    { field: "rank", headerName: "رتبه", filterType: "number", width: 90 },
    { field: "direction", headerName: "جهت", filterType: "set", width: 90 },
    { field: "timezone", headerName: "تایم زون", filterType: "set" },
    {
      field: "enabled",
      headerName: "وضعیت",
      filterType: "set",
      width: 110,
      valueGetter: (p: { data: Language }) =>
        p.data.enabled ? "فعال" : "غیرفعال",
    },
    {
      field: "actions",
      headerName: "عملیات",
      width: 130,
      sortable: false,
      filterType: "text",
      cellRenderer: (p: { data: Language }) => (
        <Button size="sm" variant="ghost" onClick={() => setSelected(p.data)}>
          <Settings2 className="h-4 w-4 ml-1" />
          مدیریت
        </Button>
      ),
    },
  ];

  if (selected) {
    return (
      <LanguageDetail
        lang={selected}
        onBack={() => setSelected(null)}
        onUpdate={(next) => {
          api.update("languages", next.id, next).catch(() => {});
          setLanguages((ls) => ls.map((l) => (l.id === next.id ? next : l)));
          setSelected(next);
        }}
        onDelete={() => {
          api.remove("languages", selected.id).catch(() => {});
          setLanguages((ls) => ls.filter((l) => l.id !== selected.id));
          setSelected(null);
          toast.success("زبان حذف شد");
        }}
      />
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>مدیریت زبان‌ها</h1>
          <p className="text-sm text-muted-foreground">
            تعریف زبان‌های قابل استفاده در اپلیکیشن و مدیریت ترجمه‌های آن‌ها
          </p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 ml-1" />
              زبان جدید
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>تعریف زبان جدید</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>نام</Label>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="مثلاً: ترکی استانبولی"
                />
              </div>
              <div className="grid gap-1.5">
                <Label>نام بومی</Label>
                <Input
                  value={newNative}
                  onChange={(e) => setNewNative(e.target.value)}
                  placeholder="Türkçe"
                />
              </div>
              <div className="grid gap-1.5">
                <Label>ISO-2</Label>
                <Input
                  value={newIso2}
                  maxLength={2}
                  onChange={(e) => setNewIso2(e.target.value)}
                  placeholder="tr"
                />
              </div>
              <div className="grid gap-1.5">
                <Label>ISO-3</Label>
                <Input
                  value={newIso3}
                  maxLength={3}
                  onChange={(e) => setNewIso3(e.target.value)}
                  placeholder="tur"
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Locale</Label>
                <Select value={newLocale} onValueChange={setNewLocale}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {localeOptions.map((l) => (
                      <SelectItem key={l} value={l}>
                        {l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>نوع تقویم</Label>
                <Select
                  value={newCalendar}
                  onValueChange={(v) => setNewCalendar(v as CalendarType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {calendarOptions.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>رتبه</Label>
                <Input
                  type="number"
                  value={newRank}
                  onChange={(e) => setNewRank(Number(e.target.value) || 0)}
                />
              </div>
              <div className="grid gap-1.5">
                <Label>جهت</Label>
                <Select
                  value={newDirection}
                  onValueChange={(v) => setNewDirection(v as "rtl" | "ltr")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rtl">RTL</SelectItem>
                    <SelectItem value="ltr">LTR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5 col-span-2">
                <Label>تایم زون دیفالت</Label>
                <Select value={newTimezone} onValueChange={setNewTimezone}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timezones.map((tz) => (
                      <SelectItem key={tz} value={tz}>
                        {tz}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddOpen(false)}>
                انصراف
              </Button>
              <Button onClick={createLanguage}>ایجاد</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>لیست زبان‌ها</span>
            <Badge variant="secondary">{languages.length} زبان</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataGrid rowData={languages} columnDefs={columns} />
        </CardContent>
      </Card>
    </div>
  );
}
