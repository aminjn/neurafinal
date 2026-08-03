import { useState, useEffect } from "react";
import { toast } from "sonner";
import { api } from "../api";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Pencil, Trash2, Check } from "lucide-react";

type Plan = {
  id: string;
  name: string;
  type: "assistant" | "agents" | "tokens";
  price: number | string;
  durationDays?: number | string;
  agentTypes?: string[];
  tokens?: number | string;
  enabled: boolean;
};

const AGENT_TYPES: { key: string; label: string }[] = [
  { key: "secretary", label: "منشی" },
  { key: "marketer", label: "بازاریاب" },
  { key: "finance", label: "مالی/اداری" },
  { key: "procurement", label: "خرید/تدارکات" },
  { key: "cashier", label: "فروشنده/صندوقدار" },
];
const TYPE_LABEL: Record<string, string> = { assistant: "دستیار شخصی", agents: "ایجنت‌های مدیریتی", tokens: "توکنِ اضافه" };
const sel = "h-9 rounded-md border border-input bg-background px-2 text-sm";
const fmtNum = (n: any) => (Number(n) || 0).toLocaleString("fa-IR");

export function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [editing, setEditing] = useState<string | null>(null);

  const reload = () => api.list<Plan>("plans").then((p) => setPlans(p || [])).catch(() => {});
  useEffect(() => { reload(); }, []);

  const addPlan = async () => {
    const id = "plan_" + Date.now();
    const np: Plan = { id, name: "پلن جدید", type: "assistant", price: 0, durationDays: 30, agentTypes: [], tokens: 0, enabled: true };
    try { await api.create("plans", np); reload(); setEditing(id); } catch { toast.error("خطا"); }
  };
  const saveOne = async (p: Plan) => {
    try {
      await api.update("plans", p.id, { ...p, price: Number(p.price) || 0, durationDays: Number(p.durationDays) || 0, tokens: Number(p.tokens) || 0 });
      setEditing(null); reload(); toast.success("پلن ذخیره شد");
    } catch { toast.error("خطا در ذخیره"); }
  };
  const del = async (id: string) => { try { await api.remove("plans", id); reload(); } catch { toast.error("خطا"); } };
  const setLocal = (id: string, patch: Partial<Plan>) => setPlans((p) => p.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  const toggleType = (p: Plan, key: string) => {
    const cur = p.agentTypes || [];
    setLocal(p.id, { agentTypes: cur.includes(key) ? cur.filter((k) => k !== key) : [...cur, key] });
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>پلن‌ها و اشتراک‌ها</h1>
          <p className="text-sm text-muted-foreground">پلن بساز: دستیار شخصی (کاربر عادی)، ایجنت‌های مدیریتی (۵ ایجنت)، یا بستهٔ توکنِ اضافه.</p>
        </div>
        <Button size="sm" onClick={addPlan}>+ پلن جدید</Button>
      </div>

      {!plans.length && <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">هنوز پلنی نساخته‌ای.</CardContent></Card>}

      <div className="grid gap-3 md:grid-cols-2">
        {plans.map((p) => (
          <Card key={p.id} style={{ opacity: p.enabled ? 1 : 0.6 }}>
            {editing === p.id ? (
              <CardContent className="flex flex-col gap-3 pt-5">
                <div className="grid gap-1.5"><Label className="text-xs">نام پلن</Label><Input value={p.name} onChange={(e) => setLocal(p.id, { name: e.target.value })} /></div>
                <div className="grid gap-1.5"><Label className="text-xs">نوع پلن</Label>
                  <select className={sel} value={p.type} onChange={(e) => setLocal(p.id, { type: e.target.value as any })}>
                    <option value="assistant">دستیار شخصی (کاربر عادی)</option>
                    <option value="agents">ایجنت‌های مدیریتی (۵ ایجنت)</option>
                    <option value="tokens">بستهٔ توکنِ اضافه</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="grid gap-1.5"><Label className="text-xs">قیمت (تومان)</Label><Input type="number" value={String(p.price ?? "")} onChange={(e) => setLocal(p.id, { price: e.target.value })} /></div>
                  {p.type !== "tokens"
                    ? <div className="grid gap-1.5"><Label className="text-xs">مدت (روز)</Label><Input type="number" value={String(p.durationDays ?? "")} onChange={(e) => setLocal(p.id, { durationDays: e.target.value })} /></div>
                    : <div className="grid gap-1.5"><Label className="text-xs">تعداد توکن</Label><Input type="number" value={String(p.tokens ?? "")} onChange={(e) => setLocal(p.id, { tokens: e.target.value })} /></div>}
                </div>
                {p.type === "agents" && (
                  <div className="grid gap-1.5"><Label className="text-xs">کدام ایجنت‌ها فعال شوند؟</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {AGENT_TYPES.map((a) => (
                        <button key={a.key} onClick={() => toggleType(p, a.key)} className="text-[12px] px-3 py-1.5 rounded-full border"
                          style={(p.agentTypes || []).includes(a.key) ? { background: "var(--aw-primary,#7B62FC)", color: "#fff", borderColor: "transparent" } : {}}>
                          {a.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <label className="flex items-center gap-1.5 text-sm"><input type="checkbox" checked={p.enabled} onChange={(e) => setLocal(p.id, { enabled: e.target.checked })} /> فعال (قابلِ خرید)</label>
                <Button size="sm" onClick={() => saveOne(p)}><Check className="h-4 w-4 ml-1" />ذخیره</Button>
              </CardContent>
            ) : (
              <>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-base">{p.name}</CardTitle>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => setEditing(p.id)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" className="text-red-500" onClick={() => del(p.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground flex flex-col gap-1">
                  <div>نوع: <b className="text-foreground">{TYPE_LABEL[p.type]}</b></div>
                  <div>قیمت: <b className="text-foreground">{fmtNum(p.price)}</b> تومان</div>
                  {p.type === "tokens" ? <div>توکن: <b className="text-foreground">{fmtNum(p.tokens)}</b></div> : <div>مدت: <b className="text-foreground">{fmtNum(p.durationDays)}</b> روز</div>}
                  {p.type === "agents" && <div>ایجنت‌ها: <b className="text-foreground">{(p.agentTypes || []).map((k) => AGENT_TYPES.find((a) => a.key === k)?.label || k).join("، ") || "—"}</b></div>}
                  {!p.enabled && <div className="text-amber-500">غیرفعال</div>}
                </CardContent>
              </>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
