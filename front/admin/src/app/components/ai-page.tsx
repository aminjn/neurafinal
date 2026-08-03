import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "../api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { Badge } from "./ui/badge";
import { Textarea } from "./ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "./ui/select";
import { Sparkles, RefreshCw, Trash2, Plus, FlaskConical, Save, Image as ImageIcon } from "lucide-react";

interface Provider { id: string; name: string; baseUrl: string; apiKey?: string; enabled?: boolean; note?: string; }
interface Model { id: string; modelId: string; displayName: string; provider: string; kind?: string; enabled?: boolean; }
interface QuickAction { label: string; prompt: string; }

// مدل‌های «قابل استفاده» = ارائه‌دهنده‌اش فعال است و خودِ مدل هم فعال است.
// لیست‌های انتخاب (انتساب/تست/تصویر) فقط همین‌ها را نشان می‌دهند تا مدلِ ارائه‌دهندهٔ خاموش پیشنهاد نشود.
// مرتب‌سازیِ الفبایی (بر اساس نام نمایشی، وگرنه شناسهٔ مدل)
function sortModels<T extends { displayName?: string; modelId?: string; id?: string }>(list: T[]): T[] {
  return [...list].sort((a, b) =>
    String(a.displayName || a.modelId || a.id || "").localeCompare(String(b.displayName || b.modelId || b.id || ""), undefined, { sensitivity: "base" }),
  );
}

function usableModels(models: Model[], providers: Provider[]): Model[] {
  const okProvider = (id: string) => providers.some((p) => p.id === id && p.enabled !== false);
  return sortModels(models.filter((m) => m.enabled !== false && okProvider(m.provider)));
}
interface Agent { id: string; name: string; role?: string; modelId?: string; imageModel?: string; sttModel?: string; ttsModel?: string; ttsVoice?: string; quickActions?: QuickAction[]; company?: string; instructions?: string; welcomeMsg?: string; memoryDepth?: number }

export function AiPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  // بارگذاریِ اولیه vs. تازه‌سازیِ پس‌زمینه: reload پس از ذخیره نباید کلِ صفحه را unmount کند
  // (وگرنه Tabs به تبِ پیش‌فرض برمی‌گردد و کاربر از جایی که بود «می‌پرد»).
  const reload = async () => {
    try {
      const [p, m, a] = await Promise.all([
        api.list<Provider>("ai_providers"),
        api.list<Model>("ai_models"),
        api.list<Agent>("agents"),
      ]);
      setProviders(p); setModels(m); setAgents(a);
    } catch { toast.error("خطا در دریافت اطلاعات"); }
    setLoading(false);
  };
  useEffect(() => { reload(); }, []);

  // تبِ فعال را کنترل‌شده نگه می‌داریم تا بعد از هر ذخیره در همان تب بمانیم
  const [tab, setTab] = useState("assistant");

  if (loading) return <div className="flex h-48 items-center justify-center text-muted-foreground">در حال بارگذاری…</div>;

  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      <div className="flex items-center gap-2">
        <Sparkles className="size-5 text-primary" />
        <div>
          <h1>هوش مصنوعی و مدل‌ها</h1>
          <p className="text-sm text-muted-foreground">مدیریت ارائه‌دهنده‌ها، مدل‌ها و انتساب به ایجنت‌ها</p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab} dir="rtl">
        <TabsList>
          <TabsTrigger value="assistant" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">⭐ دستیار شخصی</TabsTrigger>
          <TabsTrigger value="models">مدل‌ها</TabsTrigger>
          <TabsTrigger value="providers">ارائه‌دهنده‌ها</TabsTrigger>
          <TabsTrigger value="assign">انتساب به ایجنت‌ها</TabsTrigger>
          <TabsTrigger value="quick">اقدامات سریع</TabsTrigger>
          <TabsTrigger value="test">تست</TabsTrigger>
          <TabsTrigger value="image">تولید تصویر</TabsTrigger>
        </TabsList>

        <TabsContent value="assistant"><AssistantPanel agents={agents} models={models} providers={providers} onChange={reload} /></TabsContent>
        <TabsContent value="models"><ModelsTab models={models} providers={providers} onChange={reload} /></TabsContent>
        <TabsContent value="providers"><ProvidersTab providers={providers} onChange={reload} /></TabsContent>
        <TabsContent value="assign"><AssignTab agents={agents} models={models} providers={providers} onChange={reload} /></TabsContent>
        <TabsContent value="quick"><QuickActionsTab agents={agents} onChange={reload} /></TabsContent>
        <TabsContent value="test"><TestTab providers={providers} models={models} /></TabsContent>
        <TabsContent value="image"><ImageTab providers={providers} models={models} /></TabsContent>
      </Tabs>
    </div>
  );
}

// ---------- Personal assistant (distinct, complete config) ----------
const ASSIST_VOICES = ["alloy", "ash", "ballad", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer", "verse"];

function AssistantPanel({ agents, models, providers, onChange }: { agents: Agent[]; models: Model[]; providers: Provider[]; onChange: () => void }) {
  const assistant = agents.find((a) => a.id === "assistant") || agents.find((a) => /دستیار/.test(a.name || ""));
  const usable = usableModels(models, providers);
  const chatModels = usable.filter((m) => (m.kind || "chat") === "chat");
  const audioModels = usable.filter((m) => m.kind === "audio");
  // تفکیکِ صوتی: STT (گفتار→متن) از TTS (متن→گفتار) تا اشتباه انتخاب نشود
  const isStt = (m: Model) => /whisper|transcri|scribe|stt/i.test(String(m.modelId));
  const sttModels = audioModels.filter(isStt);
  const ttsModels = audioModels.filter((m) => !isStt(m) && /tts|speech|text-to/i.test(String(m.modelId)));

  const blank = { name: "", role: "", welcomeMsg: "", instructions: "", memoryDepth: "", modelId: "", sttModel: "", ttsModel: "", ttsVoice: "" };
  const [d, setD] = useState<Record<string, string>>(blank);
  useEffect(() => {
    if (!assistant) return;
    setD({
      name: assistant.name || "", role: assistant.role || "", welcomeMsg: assistant.welcomeMsg || "",
      instructions: assistant.instructions || "", memoryDepth: assistant.memoryDepth != null ? String(assistant.memoryDepth) : "",
      modelId: assistant.modelId || "", sttModel: assistant.sttModel || "", ttsModel: assistant.ttsModel || "", ttsVoice: assistant.ttsVoice || "",
    });
  }, [assistant?.id]);

  if (!assistant) {
    return <Card><CardContent className="p-6 text-center text-sm text-muted-foreground">ایجنتِ «دستیار شخصی» (شناسهٔ <b>assistant</b>) در دیتابیس پیدا نشد. در «تعاریف ایجنت‌ها» بسازش.</CardContent></Card>;
  }
  const set = (k: string, v: string) => setD((p) => ({ ...p, [k]: v }));
  const save = async () => {
    const md = parseInt(d.memoryDepth, 10);
    try {
      await api.update("agents", assistant.id, {
        name: d.name, role: d.role, welcomeMsg: d.welcomeMsg, instructions: d.instructions,
        memoryDepth: Number.isFinite(md) && md > 0 ? md : null,
        modelId: d.modelId || null, sttModel: d.sttModel || null, ttsModel: d.ttsModel || null, ttsVoice: d.ttsVoice || null,
      } as any);
      toast.success("تنظیماتِ دستیار شخصی ذخیره شد"); onChange();
    } catch { toast.error("خطا در ذخیره"); }
  };

  const Drop = ({ field, list, ph }: { field: string; list: Model[]; ph: string }) => (
    <div className="flex flex-col gap-1">
      <Label className="text-xs">{ph}</Label>
      <Select value={d[field] || ""} onValueChange={(v) => set(field, v)}>
        <SelectTrigger className="w-full"><SelectValue placeholder="—" /></SelectTrigger>
        <SelectContent>
          {list.length ? list.map((m) => <SelectItem key={m.id} value={m.modelId}>{m.displayName} <span className="text-muted-foreground">({m.provider})</span></SelectItem>)
            : <SelectItem value="none" disabled>مدلی نیست — ارائه‌دهنده را فعال و Sync کن</SelectItem>}
          {d[field] && !list.some((m) => m.modelId === d[field]) && <SelectItem value={d[field]}>{d[field]} (ذخیره‌شده)</SelectItem>}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <Card className="border-primary/40 ring-1 ring-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Sparkles className="size-4 text-primary" /> دستیار شخصی (رایگانِ همهٔ کاربران)</CardTitle>
        <CardDescription>ایجنتِ پیش‌فرضی که همه بدونِ خرید دارند. مدل‌ها فقط از ارائه‌دهنده‌های <b>فعال</b> خوانده می‌شوند و به ترتیبِ الفبا مرتب‌اند.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-1.5"><Label className="text-xs">نام</Label><Input value={d.name} onChange={(e) => set("name", e.target.value)} /></div>
          <div className="grid gap-1.5"><Label className="text-xs">نقش/سمت</Label><Input value={d.role} onChange={(e) => set("role", e.target.value)} /></div>
          <div className="grid gap-1.5"><Label className="text-xs">پیام خوش‌آمد</Label><Input value={d.welcomeMsg} onChange={(e) => set("welcomeMsg", e.target.value)} /></div>
          <div className="grid gap-1.5"><Label className="text-xs">عمقِ حافظه (چند پیامِ گذشته)</Label><Input type="number" placeholder="خالی = پیش‌فرضِ سراسری" value={d.memoryDepth} onChange={(e) => set("memoryDepth", e.target.value)} /></div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Drop field="modelId" list={chatModels} ph="مدلِ متن (چت)" />
          <Drop field="sttModel" list={sttModels} ph="گفتار→متن (STT)" />
          <Drop field="ttsModel" list={ttsModels} ph="متن→گفتار (TTS)" />
          <div className="flex flex-col gap-1">
            <Label className="text-xs">صدای TTS</Label>
            <Select value={d.ttsVoice || ""} onValueChange={(v) => set("ttsVoice", v)}>
              <SelectTrigger className="w-full"><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>{ASSIST_VOICES.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid gap-1.5">
          <Label className="text-xs">دستورالعمل (instructions)</Label>
          <Textarea rows={4} value={d.instructions} onChange={(e) => set("instructions", e.target.value)} />
        </div>
        <div><Button onClick={save}><Save className="size-4 ms-1" /> ذخیرهٔ دستیار شخصی</Button></div>
      </CardContent>
    </Card>
  );
}

// ---------- Models ----------
function ModelsTab({ models, providers, onChange }: { models: Model[]; providers: Provider[]; onChange: () => void }) {
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [pFilter, setPFilter] = useState<string>("all");
  const [kFilter, setKFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("name");
  const [latency, setLatency] = useState<Record<string, number | "err" | "...">>({});
  const [measuring, setMeasuring] = useState(false);

  const provOk = (id: string) => providers.some((p) => p.id === id && p.enabled !== false);
  const isStale = (m: Model) => !provOk(m.provider); // ارائه‌دهنده غیرفعال یا حذف‌شده
  const staleCount = models.filter(isStale).length;
  const filtered = models.filter((m) =>
    (pFilter === "all" ? true : pFilter === "__stale" ? isStale(m) : m.provider === pFilter) &&
    (kFilter === "all" ? true : (m.kind || "chat") === kFilter),
  );
  const speedVal = (m: Model) => { const v = latency[m.id]; return typeof v === "number" ? v : Infinity; };
  const shown = sortBy === "speed"
    ? [...filtered].sort((a, b) => speedVal(a) - speedVal(b) || String(a.modelId).localeCompare(String(b.modelId)))
    : sortModels(filtered);

  const delStale = async () => {
    const list = models.filter(isStale);
    if (!list.length) return;
    if (!confirm(`${list.length} مدل از ارائه‌دهنده‌های غیرفعال/حذف‌شده پاک شود؟`)) return;
    for (const m of list) { try { await api.remove("ai_models", m.id); } catch {} }
    toast.success("مدل‌های ارائه‌دهنده‌های غیرفعال پاک شد"); onChange();
  };

  // اندازه‌گیریِ سرعتِ پاسخِ همهٔ مدل‌های نمایش‌داده‌شده (با چند درخواستِ هم‌زمان)
  const measureAll = async () => {
    const targets = shown.filter((m) => provOk(m.provider)); // فقط مدل‌های ارائه‌دهندهٔ فعال قابل‌اندازه‌گیری‌اند
    if (!targets.length) { toast.error("مدلی از ارائه‌دهندهٔ فعال برای اندازه‌گیری نیست"); return; }
    setMeasuring(true);
    setLatency((p) => { const n = { ...p }; targets.forEach((m) => { n[m.id] = "..."; }); return n; });
    let i = 0;
    const worker = async () => {
      while (i < targets.length) {
        const m = targets[i++];
        try { const r = await api.modelLatency(m.modelId); setLatency((p) => ({ ...p, [m.id]: r.ms })); }
        catch { setLatency((p) => ({ ...p, [m.id]: "err" })); }
      }
    };
    await Promise.all(Array.from({ length: 4 }, worker));
    setMeasuring(false);
    toast.success(`سرعتِ ${targets.length} مدل اندازه‌گیری شد`);
  };
  const latBadge = (m: Model) => {
    const v = latency[m.id];
    if (v == null) return null;
    if (v === "...") return <Badge variant="outline" className="text-[10px]">⏱…</Badge>;
    if (v === "err") return <Badge variant="outline" className="text-[10px] text-destructive">خطا</Badge>;
    const color = v < 1200 ? "text-emerald-500" : v < 3000 ? "text-amber-500" : "text-destructive";
    return <Badge variant="outline" className={`text-[10px] ${color}`} dir="ltr">{(v / 1000).toFixed(1)}s</Badge>;
  };

  const saveName = async (m: Model) => {
    const name = draft[m.id] ?? m.displayName;
    await api.update("ai_models", m.id, { displayName: name });
    toast.success("نام نمایشی ذخیره شد");
    onChange();
  };
  const toggle = async (m: Model) => { await api.update("ai_models", m.id, { enabled: !m.enabled }); onChange(); };
  const del = async (m: Model) => { await api.remove("ai_models", m.id); toast.success("مدل حذف شد"); onChange(); };
  const add = async () => {
    const modelId = prompt("شناسه واقعی مدل (مثلاً gpt-4o):");
    if (!modelId) return;
    const displayName = prompt("نام نمایشی:", modelId) || modelId;
    await api.create("ai_models", { id: modelId, modelId, displayName, provider: providers[0]?.id || "noyan", kind: "chat", enabled: true });
    toast.success("مدل اضافه شد"); onChange();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <div>
          <CardTitle>کاتالوگ مدل‌ها</CardTitle>
          <CardDescription>نام نمایشی هر مدل را تنظیم کن. لیست از خود API خوانده می‌شود. {shown.length} از {models.length} مدل</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Select value={pFilter} onValueChange={setPFilter}>
            <SelectTrigger className="h-8 w-40"><SelectValue placeholder="فیلتر ارائه‌دهنده" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">همهٔ ارائه‌دهنده‌ها</SelectItem>
              {providers.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}{p.enabled === false ? " (غیرفعال)" : ""}</SelectItem>)}
              {staleCount > 0 && <SelectItem value="__stale">فقط غیرفعال‌ها ({staleCount})</SelectItem>}
            </SelectContent>
          </Select>
          <Select value={kFilter} onValueChange={setKFilter}>
            <SelectTrigger className="h-8 w-32"><SelectValue placeholder="نوع" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">همهٔ نوع‌ها</SelectItem>
              <SelectItem value="chat">متن (chat)</SelectItem>
              <SelectItem value="image">تصویر (image)</SelectItem>
              <SelectItem value="audio">صوت (STT/TTS)</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="h-8 w-36"><SelectValue placeholder="مرتب‌سازی" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="name">مرتب: الفبا</SelectItem>
              <SelectItem value="speed">مرتب: سریع‌ترین</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline" disabled={measuring} onClick={measureAll} title="سنجشِ سرعتِ پاسخِ همهٔ مدل‌های نمایش‌داده‌شده">
            <FlaskConical className={`size-4 ms-1 ${measuring ? "animate-pulse" : ""}`} /> {measuring ? "در حال سنجش…" : "سنجشِ سرعتِ همه"}
          </Button>
          {staleCount > 0 && (
            <Button size="sm" variant="outline" onClick={delStale} title="حذف مدل‌های ارائه‌دهنده‌های غیرفعال">
              <Trash2 className="size-4 ms-1 text-destructive" /> پاک‌سازی ({staleCount})
            </Button>
          )}
          <Button size="sm" onClick={add}><Plus className="size-4 ms-1" /> افزودن مدل</Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {shown.map((m) => (
          <div key={m.id} className={`flex flex-wrap items-center gap-2 rounded-lg border p-2.5 ${isStale(m) ? "opacity-50" : ""}`}>
            <Input className="w-44" value={draft[m.id] ?? m.displayName} onChange={(e) => setDraft({ ...draft, [m.id]: e.target.value })} />
            <Badge variant="secondary" dir="ltr">{m.modelId}</Badge>
            <Select value={m.kind || "chat"} onValueChange={async (v) => { await api.update("ai_models", m.id, { kind: v }); onChange(); }}>
              <SelectTrigger className="h-8 w-28"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="chat">متن (chat)</SelectItem>
                <SelectItem value="image">تصویر (image)</SelectItem>
                <SelectItem value="audio">صوت (STT/TTS)</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-xs text-muted-foreground">{m.provider}</span>
            {latBadge(m)}
            {isStale(m) && <Badge variant="outline" className="text-[10px] text-destructive">ارائه‌دهندهٔ غیرفعال</Badge>}
            <div className="ms-auto flex items-center gap-2">
              <Switch checked={!!m.enabled} onCheckedChange={() => toggle(m)} />
              <Button size="sm" variant="ghost" onClick={() => saveName(m)}><Save className="size-4" /></Button>
              <Button size="sm" variant="ghost" onClick={() => del(m)}><Trash2 className="size-4 text-destructive" /></Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ---------- Providers ----------
function ProvidersTab({ providers, onChange }: { providers: Provider[]; onChange: () => void }) {
  const [edit, setEdit] = useState<Record<string, Partial<Provider>>>({});
  const [syncing, setSyncing] = useState<string | null>(null);

  const val = (p: Provider, k: keyof Provider) => (edit[p.id]?.[k] ?? (p as any)[k]) as any;
  const set = (id: string, k: keyof Provider, v: any) => setEdit({ ...edit, [id]: { ...edit[id], [k]: v } });

  const save = async (p: Provider) => {
    await api.update("ai_providers", p.id, { name: val(p, "name"), baseUrl: val(p, "baseUrl"), apiKey: val(p, "apiKey"), enabled: val(p, "enabled") });
    toast.success("ارائه‌دهنده ذخیره شد"); onChange();
  };
  const sync = async (p: Provider) => {
    setSyncing(p.id);
    try {
      const r = await api.syncProvider(p.id);
      toast.success(`${r.total} مدل دریافت شد (${r.added} جدید، ${r.updated} به‌روز)`);
      onChange();
    } catch (e: any) {
      const msg = e?.message;
      toast.error(
        e?.status === 400 ? "ابتدا کلید API را ذخیره کن"
        : msg === "provider_error" ? "ارائه‌دهنده خطا داد — کلید API یا Base URL را بررسی کن"
        : msg === "fetch_failed" ? "اتصال به ارائه‌دهنده ناموفق — آدرس Base URL یا دسترسی شبکه سرور را بررسی کن"
        : "خطا در دریافت مدل‌ها از ارائه‌دهنده"
      );
    }
    setSyncing(null);
  };
  const addProvider = async () => {
    const name = prompt("نام ارائه‌دهنده:"); if (!name) return;
    const baseUrl = prompt("Base URL (سازگار با OpenAI):", "https://api.openai.com/v1") || "";
    await api.create("ai_providers", { id: name.toLowerCase().replace(/\s+/g, "-"), name, baseUrl, apiKey: "", enabled: true });
    toast.success("ارائه‌دهنده اضافه شد"); onChange();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>ارائه‌دهنده‌های هوش مصنوعی</CardTitle>
          <CardDescription>کلید API را وارد و «دریافت مدل‌ها» را بزن تا کل لیست واقعی import شود.</CardDescription>
        </div>
        <Button size="sm" onClick={addProvider}><Plus className="size-4 ms-1" /> ارائه‌دهنده جدید</Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {providers.map((p) => (
          <div key={p.id} className="space-y-3 rounded-lg border p-4">
            <div className="flex items-center gap-2">
              <Input className="w-44" value={val(p, "name")} onChange={(e) => set(p.id, "name", e.target.value)} />
              <Badge variant="outline" dir="ltr">{p.id}</Badge>
              <div className="ms-auto flex items-center gap-2">
                <Label className="text-xs">فعال</Label>
                <Switch checked={!!val(p, "enabled")} onCheckedChange={(v) => set(p.id, "enabled", v)} />
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs">Base URL</Label>
                <Input dir="ltr" value={val(p, "baseUrl")} onChange={(e) => set(p.id, "baseUrl", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">کلید API</Label>
                <Input dir="ltr" type="password" placeholder="••••••" value={val(p, "apiKey") || ""} onChange={(e) => set(p.id, "apiKey", e.target.value)} />
              </div>
            </div>
            {p.note && <p className="text-xs text-muted-foreground">{p.note}</p>}
            <div className="flex gap-2">
              <Button size="sm" onClick={() => save(p)}><Save className="size-4 ms-1" /> ذخیره</Button>
              <Button size="sm" variant="secondary" disabled={syncing === p.id} onClick={() => sync(p)}>
                <RefreshCw className={`size-4 ms-1 ${syncing === p.id ? "animate-spin" : ""}`} /> دریافت مدل‌ها
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ---------- Assign to agents ----------
// صداهای TTS سازگار با OpenAI/AvalAI (tts-1, tts-1-hd, gpt-4o-mini-tts)
const TTS_VOICES = ["alloy", "ash", "ballad", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer", "verse"];

function AssignTab({ agents, models, providers, onChange }: { agents: Agent[]; models: Model[]; providers: Provider[]; onChange: () => void }) {
  const usable = usableModels(models, providers);
  const chatModels = usable.filter((m) => (m.kind || "chat") === "chat");
  const imageModels = usable.filter((m) => m.kind === "image");
  const audioAll = usable.filter((m) => m.kind === "audio");
  const isStt2 = (m: Model) => /whisper|transcri|scribe|stt/i.test(String(m.modelId));
  const sttModels = audioAll.filter(isStt2);
  const ttsModels = audioAll.filter((m) => !isStt2(m) && /tts|speech|text-to/i.test(String(m.modelId)));

  const assign = async (a: Agent, patch: Record<string, string>) => {
    await api.update("agents", a.id, patch);
    toast.success(`تنظیمات ایجنت «${a.name}» ذخیره شد`);
    onChange();
  };

  // انتخابِ بهترین مدل از یک لیست بر اساس ترجیح‌ها (اولین تطابق؛ وگرنه اولین موجود)
  const pick = (list: Model[], prefers: RegExp[]) => {
    for (const rx of prefers) { const m = list.find((x) => rx.test(String(x.modelId))); if (m) return m; }
    return list[0];
  };
  const chatPick = pick(chatModels, [/^gpt-4o$/i, /gpt-4o(?!-mini-tts)/i, /gpt-4/i, /claude/i, /gpt-3\.5/i]);
  const imgPick = pick(imageModels, [/^dall-e-3$/i, /dall-e-3/i, /dall/i, /flux/i, /seedream/i]);
  // whisper-1 ساده را بر gapgpt/whisper-1 (که api_limit/429 می‌دهد) ترجیح بده
  const sttPick = pick(sttModels, [/^whisper-1$/i, /whisper-1/i, /whisper/i, /transcri/i, /scribe/i]);
  // مدل‌های OpenAIِ استاندارد را بر gemini (که صدای alloy را نمی‌پذیرد) ترجیح بده
  const ttsPick = pick(ttsModels, [/^gpt-4o-mini-tts$/i, /gpt-4o-mini-tts/i, /^tts-1$/i, /tts-1-hd/i, /tts-1/i, /tts|speech/i]);

  const [autoBusy, setAutoBusy] = useState(false);
  // انتساب خودکار: هر خانهٔ خالیِ هر ایجنت را با بهترین مدلِ موجود پر می‌کند (انتخاب‌های دستیِ قبلی دست‌نخورده می‌مانند).
  const autoAssignAll = async () => {
    // شمارشِ مدل‌های فعالِ هر دسته — همیشه در پیام نشان داده می‌شود تا وضعیت شفاف باشد
    const counts = `چت ${chatModels.length}، تصویر ${imageModels.length}، STT ${sttModels.length}، TTS ${ttsModels.length}`;
    if (!usable.length) {
      toast.error(`هیچ مدلِ فعالی نیست (${counts}). در تب «ارائه‌دهنده‌ها» ارائه‌دهنده را فعال و «دریافت مدل‌ها» را بزن.`);
      return;
    }
    const missing: string[] = [];
    if (!chatModels.length) missing.push("چت");
    if (!imageModels.length) missing.push("تصویر");
    if (!sttModels.length) missing.push("STT");
    if (!ttsModels.length) missing.push("TTS");
    // خانه‌ای نیازِ انتساب دارد اگر خالی باشد یا مقدارش یک مدلِ فعالِ همان دسته نباشد
    // (مثلاً id قدیمی از ارائه‌دهندهٔ خاموش که در دراپ‌داون خالی دیده می‌شود ولی تهی نیست).
    const chatValid = new Set(chatModels.map((m) => m.modelId));
    const imageValid = new Set(imageModels.map((m) => m.modelId));
    const sttValid = new Set(sttModels.map((m) => m.modelId));
    const ttsValid = new Set(ttsModels.map((m) => m.modelId));
    setAutoBusy(true);
    let changed = 0;
    try {
      for (const a of agents) {
        const patch: Record<string, string> = {};
        if (chatPick && (!a.modelId || !chatValid.has(a.modelId))) patch.modelId = chatPick.modelId;
        if (imgPick && (!a.imageModel || !imageValid.has(a.imageModel))) patch.imageModel = imgPick.modelId;
        if (sttPick && (!a.sttModel || !sttValid.has(a.sttModel))) patch.sttModel = sttPick.modelId;
        if (ttsPick && (!a.ttsModel || !ttsValid.has(a.ttsModel))) patch.ttsModel = ttsPick.modelId;
        if (!a.ttsVoice && ttsPick) patch.ttsVoice = "alloy";
        if (Object.keys(patch).length) { await api.update("agents", a.id, patch); changed++; }
      }
      onChange();
      toast.success(`انتساب: ${changed} ایجنت به‌روز شد • مدل‌های فعال ← ${counts}`
        + (missing.length ? ` • بدونِ مدل: ${missing.join("، ")} (در تب «مدل‌ها» فعال کن)` : ""));
    } catch {
      toast.error("خطا در انتساب خودکار");
    } finally { setAutoBusy(false); }
  };

  const ModelSelect = ({ a, field, list, ph }: { a: Agent; field: keyof Agent; list: Model[]; ph: string }) => (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] text-muted-foreground">{ph}</label>
      <Select value={(a[field] as string) || ""} onValueChange={(v) => assign(a, { [field]: v } as any)}>
        <SelectTrigger className="w-full"><SelectValue placeholder="—" /></SelectTrigger>
        <SelectContent>
          {list.length ? list.map((m) => <SelectItem key={m.id} value={m.modelId}>{m.displayName}</SelectItem>)
            : <SelectItem value="none" disabled>موجود نیست</SelectItem>}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>انتساب مدل به ایجنت‌ها</CardTitle>
            <CardDescription>برای هر ایجنت: مدل متن (چت)، تصویر، تبدیل گفتار به متن (STT) و متن به گفتار (TTS). {agents.length} ایجنت</CardDescription>
          </div>
          <Button size="sm" onClick={autoAssignAll} disabled={autoBusy || !usable.length} className="shrink-0 gap-1.5">
            <Sparkles className={`h-4 w-4 ${autoBusy ? "animate-pulse" : ""}`} />
            {autoBusy ? "در حال انتساب…" : "انتساب خودکار همه"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {usable.length === 0 && (
          <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
            هیچ مدلِ قابل‌استفاده‌ای نیست. مطمئن شو ارائه‌دهنده <b>فعال</b> است، «دریافت مدل‌ها» را زده‌ای، و مدل‌های موردنظر را در تب «مدل‌ها» <b>فعال</b> کرده‌ای.
          </div>
        )}
        {[...agents].sort((a, b) => (a.id === "assistant" ? -1 : b.id === "assistant" ? 1 : 0)).map((a) => (
          <div key={a.id} className={`rounded-lg border p-3 ${a.id === "assistant" ? "border-primary/50 ring-1 ring-primary/20 bg-primary/5" : ""}`}>
            <div className="mb-2">
              <div className="text-sm flex items-center gap-1.5">{a.name}{a.id === "assistant" && <span className="text-[10px] rounded-full bg-primary/15 text-primary px-2 py-0.5">دستیار شخصی</span>}</div>
              <div className="text-xs text-muted-foreground">{a.role || a.id}</div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
              <ModelSelect a={a} field="modelId" list={chatModels} ph="متن (چت)" />
              <ModelSelect a={a} field="imageModel" list={imageModels} ph="تصویر" />
              <ModelSelect a={a} field="sttModel" list={sttModels} ph="گفتار→متن (STT)" />
              <ModelSelect a={a} field="ttsModel" list={ttsModels} ph="متن→گفتار (TTS)" />
              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-muted-foreground">صدای TTS</label>
                <Select value={a.ttsVoice || ""} onValueChange={(v) => assign(a, { ttsVoice: v })}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>
                    {TTS_VOICES.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ---------- Quick actions (فقط برای ایجنت دستیار) ----------
function QuickActionsTab({ agents, onChange }: { agents: Agent[]; onChange: () => void }) {
  const editable = agents.filter((a) => a.id === 'assistant');
  const [draft, setDraft] = useState<Record<string, QuickAction[]>>(
    () => Object.fromEntries(editable.map((a) => [a.id, a.quickActions || []])),
  );
  const setActions = (id: string, arr: QuickAction[]) => setDraft((d) => ({ ...d, [id]: arr }));
  const add = (id: string) => setActions(id, [...(draft[id] || []), { label: '', prompt: '' }]);
  const upd = (id: string, i: number, k: keyof QuickAction, v: string) =>
    setActions(id, (draft[id] || []).map((x, j) => (j === i ? { ...x, [k]: v } : x)));
  const rm = (id: string, i: number) => setActions(id, (draft[id] || []).filter((_, j) => j !== i));
  const save = async (a: Agent) => {
    try {
      await api.update('agents', a.id, { quickActions: (draft[a.id] || []).filter((x) => x.label.trim()) });
      toast.success(`اقدامات «${a.name}» ذخیره شد`); onChange();
    } catch { toast.error('خطا در ذخیره'); }
  };
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">اقدامات سریع فقط برای «دستیار هوشمند» تعریف می‌شود: یک «برچسب» (که کاربر می‌بیند) و یک «دستور» (که به AI فرستاده می‌شود).</p>
      {editable.length === 0 && <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">ایجنت «دستیار» یافت نشد.</div>}
      {editable.map((a) => (
        <Card key={a.id}>
          <CardHeader className="flex flex-row items-center justify-between py-3">
            <div><CardTitle className="text-sm">{a.name}</CardTitle><CardDescription>{a.role || a.id}</CardDescription></div>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => add(a.id)}><Plus className="size-4 ms-1" /> اقدام</Button>
              <Button size="sm" onClick={() => save(a)}><Save className="size-4 ms-1" /> ذخیره</Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {(draft[a.id] || []).length === 0 && <div className="text-xs text-muted-foreground">اقدامی تعریف نشده.</div>}
            {(draft[a.id] || []).map((qa, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input className="w-52" placeholder="برچسب (مثلاً: لیدهای داغ امروز)" value={qa.label} onChange={(e) => upd(a.id, i, 'label', e.target.value)} />
                <Input className="flex-1" placeholder="دستور به AI (مثلاً: لیدهای داغ امروز را فهرست کن)" value={qa.prompt} onChange={(e) => upd(a.id, i, 'prompt', e.target.value)} />
                <Button size="sm" variant="ghost" onClick={() => rm(a.id, i)}><Trash2 className="size-4 text-destructive" /></Button>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ---------- Test ----------
function TestTab({ providers, models }: { providers: Provider[]; models: Model[] }) {
  const enabledProviders = providers.filter((p) => p.enabled !== false);
  const [providerId, setProviderId] = useState(enabledProviders[0]?.id || providers[0]?.id || "");
  // فقط مدل‌های همین ارائه‌دهنده (تا مدلِ یک ارائه‌دهندهٔ دیگر روی این تست نشود)
  const providerModels = sortModels(models.filter((m) => m.provider === providerId));
  const [model, setModel] = useState(providerModels[0]?.modelId || "");
  useEffect(() => { setModel(providerModels[0]?.modelId || ""); /* eslint-disable-next-line */ }, [providerId]);
  const [prompt, setPrompt] = useState("سلام! یک جمله کوتاه فارسی بگو.");
  const [out, setOut] = useState("");
  const [busy, setBusy] = useState(false);

  const run = async () => {
    setBusy(true); setOut("");
    try {
      const r = await api.testModel({ providerId, model, prompt });
      setOut(r.text || "(پاسخ خالی)");
    } catch (e: any) {
      setOut("خطا: " + (e?.status === 400 ? "کلید API این ارائه‌دهنده تنظیم نشده" : e?.message || "اتصال ناموفق"));
    }
    setBusy(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><FlaskConical className="size-4" /> تست مدل</CardTitle>
        <CardDescription>یک پیام بفرست تا اتصال و پاسخ مدل را بررسی کنی.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-xs">ارائه‌دهنده</Label>
            <Select value={providerId} onValueChange={setProviderId}>
              <SelectTrigger><SelectValue placeholder="ارائه‌دهنده" /></SelectTrigger>
              <SelectContent>{providers.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}{p.enabled === false ? " (غیرفعال)" : ""}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">مدل</Label>
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger><SelectValue placeholder="مدل" /></SelectTrigger>
              <SelectContent>{providerModels.length
                ? providerModels.map((m) => <SelectItem key={m.id} value={m.modelId}>{m.displayName} ({m.modelId})</SelectItem>)
                : <SelectItem value="none" disabled>برای این ارائه‌دهنده «دریافت مدل‌ها» را بزن</SelectItem>}</SelectContent>
            </Select>
          </div>
        </div>
        <Textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={3} />
        <Button onClick={run} disabled={busy}>{busy ? "در حال ارسال…" : "ارسال"}</Button>
        {out && <div className="whitespace-pre-wrap rounded-lg border bg-muted/40 p-3 text-sm">{out}</div>}
      </CardContent>
    </Card>
  );
}

// ---------- Image generation ----------
function ImageTab({ providers, models }: { providers: Provider[]; models: Model[] }) {
  const imageModels = usableModels(models, providers).filter((m) => m.kind === "image");
  const enabledProviders = providers.filter((p) => p.enabled !== false);
  const [providerId, setProviderId] = useState(enabledProviders[0]?.id || providers[0]?.id || "");
  const [model, setModel] = useState(imageModels[0]?.modelId || "");
  const [prompt, setPrompt] = useState("یک لوگوی مینیمال برای یک برند فناوری روی پس‌زمینه سفید");
  const [size, setSize] = useState("1024x1024");
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);

  const run = async () => {
    if (!model) { toast.error("ابتدا یک مدل تصویر را در تب «مدل‌ها» فعال کن"); return; }
    setBusy(true); setUrl("");
    try {
      const r = await api.generateImage({ providerId, model, prompt, size });
      if (r.url) setUrl(r.url); else toast.error("تصویری برنگشت");
    } catch (e: any) {
      toast.error(e?.status === 400 ? "کلید API این ارائه‌دهنده تنظیم نشده" : "خطا در تولید تصویر");
    }
    setBusy(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><ImageIcon className="size-4" /> تولید تصویر</CardTitle>
        <CardDescription>با مدل‌های تصویری (kind=image) یک تصویر بساز.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-2 sm:grid-cols-3">
          <div className="space-y-1">
            <Label className="text-xs">ارائه‌دهنده</Label>
            <Select value={providerId} onValueChange={setProviderId}>
              <SelectTrigger><SelectValue placeholder="ارائه‌دهنده" /></SelectTrigger>
              <SelectContent>{providers.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">مدل تصویر</Label>
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger><SelectValue placeholder="مدل تصویر" /></SelectTrigger>
              <SelectContent>
                {imageModels.length
                  ? imageModels.map((m) => <SelectItem key={m.id} value={m.modelId}>{m.displayName}</SelectItem>)
                  : <SelectItem value="none" disabled>مدلی با نوع image یافت نشد</SelectItem>}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">اندازه</Label>
            <Select value={size} onValueChange={setSize}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1024x1024">۱۰۲۴×۱۰۲۴</SelectItem>
                <SelectItem value="1024x1536">۱۰۲۴×۱۵۳۶</SelectItem>
                <SelectItem value="1536x1024">۱۵۳۶×۱۰۲۴</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={3} />
        <Button onClick={run} disabled={busy}>{busy ? "در حال تولید…" : "تولید تصویر"}</Button>
        {url && (
          <div className="rounded-lg border p-3">
            <img src={url} alt="generated" className="mx-auto max-h-96 rounded-md" />
            <a href={url} target="_blank" rel="noreferrer" className="mt-2 block text-center text-xs text-primary underline">باز کردن در تب جدید</a>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
