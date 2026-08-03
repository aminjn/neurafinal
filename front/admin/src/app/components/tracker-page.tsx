import { useState, useEffect } from "react";
import { toast } from "sonner";
import { api } from "../api";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Pencil, Trash2, Check } from "lucide-react";

type Rule = {
  id: string;
  enabled: boolean;
  kind: "agent" | "screen";
  value: string;
  action: "sms" | "offer";
  message: string;
  discount?: number | string;
  offerAgentId?: string;
  cta?: string;
  cooldownMin?: number | string;
  patternCode?: string;
};

const AGENT_TYPES: { key: string; label: string }[] = [
  { key: "secretary", label: "منشی" },
  { key: "marketer", label: "بازاریاب" },
  { key: "finance", label: "مالی/اداری" },
  { key: "procurement", label: "خرید/تدارکات" },
  { key: "cashier", label: "فروشنده/صندوقدار" },
];
const PAGES: { id: string; label: string }[] = [
  { id: "euHomeScreen", label: "خانه" },
  { id: "euChatListScreen", label: "گفتگوها" },
  { id: "euPlannerScreen", label: "برنامه‌ها" },
  { id: "euSearchScreen", label: "جستجو" },
  { id: "euReportScreen", label: "گزارش" },
  { id: "euProfileScreen", label: "پروفایل" },
];
const ID_TO_TYPE: Record<string, string> = { marketing: "marketer", marketer: "marketer", sales: "cashier", cashier: "cashier", secretary: "secretary", finance: "finance", procurement: "procurement" };

const sel = "h-9 rounded-md border border-input bg-background px-2 text-sm";

export function TrackerPage() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const loadFeed = () => api.trackFeed(200).then((r: any) => setEvents(r?.events || [])).catch(() => {});
  useEffect(() => {
    api.getSettings<any>().then((s) => setRules(Array.isArray(s?.trackRules) ? s.trackRules : [])).catch(() => {});
    loadFeed();
    const t = setInterval(loadFeed, 5000);
    return () => clearInterval(t);
  }, []);

  const addRule = () => {
    const id = "r" + Date.now();
    setRules((p) => [...p, { id, enabled: true, kind: "agent", value: "marketer", action: "offer", message: "ایجنتِ «{agent}» را همین حالا با {discount}٪ تخفیف فعال کن!", discount: 20, offerAgentId: "marketer", cta: "فعال‌سازی", cooldownMin: 60, patternCode: "" }]);
    setEditing(id);
  };
  const upd = (id: string, patch: Partial<Rule>) => setRules((p) => p.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const del = (id: string) => { setRules((p) => p.filter((r) => r.id !== id)); if (editing === id) setEditing(null); };
  const save = async () => {
    setSaving(true);
    try {
      const clean = rules.map((r) => ({ ...r, discount: Number(r.discount) || 0, cooldownMin: Number(r.cooldownMin) || 0 }));
      await api.putSettings({ trackRules: clean } as any);
      setEditing(null);
      toast.success("قوانینِ ردیاب ذخیره شد");
    } catch { toast.error("خطا در ذخیره"); }
    setSaving(false);
  };

  const typeLabel = (key: string | null) => AGENT_TYPES.find((t) => t.key === key)?.label || key || "—";
  const pageLabel = (id: string) => PAGES.find((p) => p.id === id)?.label || id;
  const ruleSummary = (r: Rule) =>
    `وقتی کاربر واردِ ${r.kind === "agent" ? "ایجنتِ " + typeLabel(r.value) : "صفحهٔ " + pageLabel(r.value)} شد → ${r.action === "offer" ? "آفرِ درجا" : "پیامک"}${r.discount ? ` (${r.discount}٪)` : ""}`;
  const targetLabel = (e: any) => e.kind === "screen" ? "صفحهٔ " + pageLabel(e.target) : "ایجنتِ " + typeLabel(ID_TO_TYPE[e.target] || e.target);
  const fmt = (ts: number) => { try { return new Date(ts).toLocaleString("fa-IR"); } catch { return "—"; } };

  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      <div>
        <h1>ردیاب و اتوماسیونِ بازاریابی</h1>
        <p className="text-sm text-muted-foreground">قانون بگذار: وقتی کاربر واردِ یکی از ۵ ایجنت (یا یک صفحهٔ خاص) شد، پیامک بده یا همان‌جا آفر نشان بده.</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>قوانینِ اتوماسیون</CardTitle>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={addRule}>+ قانون جدید</Button>
            <Button size="sm" onClick={save} disabled={saving}>{saving ? "…" : "ذخیره"}</Button>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {!rules.length && <div className="text-sm text-muted-foreground py-4 text-center">هنوز قانونی نداری. «+ قانون جدید» را بزن.</div>}
          {rules.map((r) => editing === r.id ? (
            // ── حالتِ ویرایش ──
            <div key={r.id} className="rounded-lg border p-3 flex flex-col gap-2" style={{ borderColor: "var(--aw-primary, #7B62FC)" }}>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <label className="flex items-center gap-1"><input type="checkbox" checked={r.enabled} onChange={(e) => upd(r.id, { enabled: e.target.checked })} /> فعال</label>
                <span>وقتی کاربر واردِ</span>
                <select className={sel} value={r.kind} onChange={(e) => { const k = e.target.value as any; upd(r.id, { kind: k, value: k === "agent" ? "marketer" : "euHomeScreen" }); }}>
                  <option value="agent">ایجنت</option>
                  <option value="screen">صفحه</option>
                </select>
                {r.kind === "agent" ? (
                  <select className={sel} value={r.value} onChange={(e) => upd(r.id, { value: e.target.value })}>
                    {AGENT_TYPES.map((a) => <option key={a.key} value={a.key}>{a.label}</option>)}
                  </select>
                ) : (
                  <select className={sel} value={r.value} onChange={(e) => upd(r.id, { value: e.target.value })}>
                    {PAGES.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
                  </select>
                )}
                <span>شد →</span>
                <select className={sel} value={r.action} onChange={(e) => upd(r.id, { action: e.target.value as any })}>
                  <option value="offer">آفرِ درجا در اپ</option>
                  <option value="sms">پیامک</option>
                </select>
                <Button size="sm" onClick={() => setEditing(null)} className="ml-auto"><Check className="h-4 w-4 ml-1" />تمام</Button>
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                <div className="md:col-span-2 grid gap-1.5">
                  <Label className="text-xs">متن ({"{discount}"} = تخفیف، {"{agent}"} = نامِ ایجنتِ پیشنهادی)</Label>
                  <Input value={r.message} onChange={(e) => upd(r.id, { message: e.target.value })} />
                </div>
                <div className="grid gap-1.5"><Label className="text-xs">درصد تخفیف</Label><Input type="number" value={String(r.discount ?? "")} onChange={(e) => upd(r.id, { discount: e.target.value })} /></div>
                <div className="grid gap-1.5"><Label className="text-xs">کدام ایجنت پیشنهاد شود؟ ({"{agent}"})</Label>
                  <select className={sel} value={r.offerAgentId || ""} onChange={(e) => upd(r.id, { offerAgentId: e.target.value })}>
                    <option value="">—</option>
                    {AGENT_TYPES.map((a) => <option key={a.key} value={a.key}>{a.label}</option>)}
                  </select>
                </div>
                {r.action === "offer" && <div className="grid gap-1.5"><Label className="text-xs">متن دکمه</Label><Input value={r.cta || ""} onChange={(e) => upd(r.id, { cta: e.target.value })} /></div>}
                {r.action === "sms" && <div className="grid gap-1.5"><Label className="text-xs">کدِ پترنِ ippanel (برای همین قانون)</Label><Input value={r.patternCode || ""} onChange={(e) => upd(r.id, { patternCode: e.target.value })} placeholder="کدِ پترن" /></div>}
                <div className="grid gap-1.5"><Label className="text-xs">فاصلهٔ تکرار (دقیقه)</Label><Input type="number" value={String(r.cooldownMin ?? "")} onChange={(e) => upd(r.id, { cooldownMin: e.target.value })} /></div>
              </div>
            </div>
          ) : (
            // ── حالتِ جمع‌شده (خلاصه) ──
            <div key={r.id} className="flex items-center gap-3 rounded-lg border p-3 text-sm" style={{ opacity: r.enabled ? 1 : 0.5 }}>
              <input type="checkbox" checked={r.enabled} onChange={(e) => upd(r.id, { enabled: e.target.checked })} title="فعال/غیرفعال" />
              <span className="flex-1">{ruleSummary(r)}</span>
              <Button size="icon" variant="ghost" onClick={() => setEditing(r.id)} title="ویرایش"><Pencil className="h-4 w-4" /></Button>
              <Button size="icon" variant="ghost" className="text-red-500" onClick={() => del(r.id)} title="حذف"><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>فعالیتِ زندهٔ کاربران (آخرین بازدیدها)</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-col gap-1 max-h-[420px] overflow-y-auto text-sm">
            {!events.length && <div className="text-muted-foreground py-4 text-center">هنوز فعالیتی ثبت نشده.</div>}
            {events.map((e, i) => (
              <div key={i} className="flex items-center gap-3 py-1.5 border-b last:border-0">
                <span className="text-xs text-muted-foreground w-36 shrink-0">{fmt(e.ts)}</span>
                <span style={{ fontWeight: 600 }}>{e.name || (e.sub ? "کاربر #" + e.sub : "مهمان")}</span>
                <span className="text-muted-foreground">واردِ <b>{targetLabel(e)}</b> شد</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
