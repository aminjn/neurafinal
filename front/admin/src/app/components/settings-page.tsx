import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "../api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { Save, KeyRound } from "lucide-react";

// ورودی متنی پایدار (سطح ماژول) تا با هر کاراکتر remount نشود و focus نپرد.
function Field({ label, value, onChange, ph, type = "text", hint }: any) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs">{label}</Label>
      <Input dir="ltr" type={type} value={value ?? ""} placeholder={ph} onChange={onChange} />
      {hint && <span className="text-[11px] text-muted-foreground">{hint}</span>}
    </div>
  );
}

// تنظیماتِ «دستیار شخصی» (ایجنتِ رایگانِ همهٔ کاربران) — مستقیماً روی همان ایجنت در DB ذخیره می‌شود.
function AssistantSettings({ freeId }: { freeId: string }) {
  const [agent, setAgent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<any>({});
  const [models, setModels] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const list = await api.list<any>("agents");
        const a = (list || []).find((x: any) => x.id === freeId) || (list || []).find((x: any) => x.id === "assistant");
        setAgent(a || null);
        if (a) setDraft({ name: a.name || "", role: a.role || "", instructions: a.instructions || "", welcomeMsg: a.welcomeMsg || "", modelId: a.modelId || "", memoryDepth: a.memoryDepth != null ? String(a.memoryDepth) : "" });
      } catch { toast.error("خطا در دریافت دستیار شخصی"); }
      try {
        const [ms, ps] = await Promise.all([api.list<any>("ai_models"), api.list<any>("ai_providers")]);
        const okProvider = (id: string) => !(ps || []).length || (ps || []).some((p: any) => p.id === id && p.enabled !== false);
        setModels((ms || [])
          .filter((m: any) => (m.kind || "chat") === "chat" && m.enabled !== false && okProvider(m.provider))
          .sort((a: any, b: any) => String(a.displayName || a.modelId || a.id || "").localeCompare(String(b.displayName || b.modelId || b.id || ""), undefined, { sensitivity: "base" })));
      } catch {}
      setLoading(false);
    })();
  }, [freeId]);

  const upd = (k: string, v: any) => setDraft((p: any) => ({ ...p, [k]: v }));
  const fld = (k: string) => ({ value: draft[k], onChange: (e: any) => upd(k, e.target.value) });
  const saveAgent = async () => {
    if (!agent) return;
    const md = parseInt(draft.memoryDepth, 10);
    const payload = { ...draft, memoryDepth: Number.isFinite(md) && md > 0 ? md : null };
    try { await api.update("agents", agent.id, payload); toast.success("تنظیمات دستیار شخصی ذخیره شد"); }
    catch { toast.error("خطا در ذخیرهٔ دستیار شخصی"); }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>تنظیمات دستیار شخصی (رایگانِ همه)</CardTitle>
        <CardDescription>ایجنتِ پیش‌فرضی که همهٔ کاربران بدونِ خرید دارند (لادن لرستانی). این مقادیر مستقیماً روی همان ایجنت ذخیره می‌شوند.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        {loading ? (
          <span className="text-sm text-muted-foreground">در حال بارگذاری…</span>
        ) : !agent ? (
          <span className="text-sm text-muted-foreground">ایجنتِ دستیار (شناسه «{freeId}») در دیتابیس پیدا نشد.</span>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="نام" {...fld("name")} />
              <Field label="نقش/سمت" {...fld("role")} />
              <div className="grid gap-1.5">
                <Label className="text-xs">مدل (modelId)</Label>
                <select
                  dir="ltr"
                  value={draft.modelId ?? ""}
                  onChange={(e) => upd("modelId", e.target.value)}
                  className="rounded-md border bg-transparent p-2 text-sm"
                >
                  <option value="">— انتخاب مدل —</option>
                  {models.map((m: any) => (
                    <option key={m.id} value={m.modelId || m.id}>{m.displayName || m.modelId || m.id}</option>
                  ))}
                  {draft.modelId && !models.some((m: any) => (m.modelId || m.id) === draft.modelId) && (
                    <option value={draft.modelId}>{draft.modelId} (دستی)</option>
                  )}
                </select>
                {!models.length && (
                  <span className="text-[11px] text-muted-foreground">مدلی در کاتالوگ نیست — از صفحهٔ «تعاریف ایجنت‌ها/هوش مصنوعی» مدل را Sync کن.</span>
                )}
              </div>
              <Field label="پیام خوش‌آمد" {...fld("welcomeMsg")} />
              <Field label="عمقِ حافظه (چند پیامِ گذشته را به‌خاطر بسپارد)" type="number" ph="خالی = پیش‌فرضِ سراسری" {...fld("memoryDepth")} />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs">دستورالعمل (instructions)</Label>
              <textarea dir="rtl" rows={4} value={draft.instructions ?? ""} onChange={(e) => upd("instructions", e.target.value)} className="rounded-md border bg-transparent p-2 text-sm" />
            </div>
            <div><Button onClick={saveAgent}><Save className="size-4 ms-1" /> ذخیرهٔ دستیار شخصی</Button></div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// صفحه‌ی تنظیمات سیستم و یکپارچه‌سازی‌ها در داشبورد /admin
export function SettingsPage() {
  const [s, setS] = useState<any>(null);
  const [allModels, setAllModels] = useState<any[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [dineRev, setDineRev] = useState<any>(null);

  useEffect(() => { (async () => { try { setS(await api.getSettings()); } catch { toast.error("خطا در دریافت تنظیمات"); } })(); }, []);
  useEffect(() => { (async () => { try { setDineRev(await api.dineRevenue()); } catch {} })(); }, []);
  useEffect(() => { (async () => { try { setAllModels((await api.list<any>("ai_models")) || []); } catch {} })(); }, []);
  useEffect(() => { (async () => { try { setProviders((await api.list<any>("ai_providers")) || []); } catch {} })(); }, []);

  // فقط مدل‌های قابل‌استفاده: ارائه‌دهنده فعال + خود مدل فعال
  const okProvider = (id: string) => providers.length === 0 || providers.some((p) => p.id === id && p.enabled !== false);
  const usable = allModels
    .filter((m: any) => m.enabled !== false && okProvider(m.provider))
    .sort((a: any, b: any) => String(a.displayName || a.modelId || a.id || "").localeCompare(String(b.displayName || b.modelId || b.id || ""), undefined, { sensitivity: "base" }));

  // dropdownِ مدل از کاتالوگ (با حفظِ مقدارِ فعلی حتی اگر در کاتالوگ نباشد)
  const ModelSelect = ({ k, filter }: { k: string; filter?: (m: any) => boolean }) => {
    const list = filter ? usable.filter(filter) : usable;
    const cur = s[k] || "";
    return (
      <select dir="ltr" value={cur} onChange={(e) => set(k, e.target.value)}
        style={{ colorScheme: "dark", background: "var(--card, #15151f)", color: "var(--foreground, #fff)" }}
        className="rounded-md border bg-transparent p-2 text-sm">
        <option value="" style={{ background: "#15151f", color: "#fff" }}>— انتخاب مدل —</option>
        {list.map((m: any) => <option key={m.id} value={m.modelId || m.id} style={{ background: "#15151f", color: "#fff" }}>{(m.displayName || m.modelId || m.id) + " — " + (m.provider || "")}</option>)}
        {cur && !list.some((m: any) => (m.modelId || m.id) === cur) && <option value={cur} style={{ background: "#15151f", color: "#fff" }}>{cur} (ذخیره‌شده)</option>}
      </select>
    );
  };

  const set = (k: string, v: any) => setS((p: any) => ({ ...p, [k]: v }));
  const save = async () => {
    try { const r = await api.putSettings(s); setS(r); toast.success("تنظیمات ذخیره شد"); }
    catch (e: any) { toast.error(e?.status === 403 ? "فقط سوپر‌ادمین" : "خطا در ذخیره"); }
  };

  if (!s) return <div className="flex h-48 items-center justify-center text-muted-foreground">در حال بارگذاری…</div>;

  const f = (k: string) => ({ value: s[k], onChange: (e: any) => set(k, e.target.value) });

  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>تنظیمات و یکپارچه‌سازی</h1>
          <p className="text-sm text-muted-foreground">برند، ورود پیامکی (ippanel) و سرویس‌های جانبی</p>
        </div>
        <Button onClick={save}><Save className="size-4 ms-1" /> ذخیره</Button>
      </div>

      <Card>
        <CardHeader><CardTitle>عمومی و برند</CardTitle></CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <Field label="نام برند" {...f("brandName")} />
          <Field label="ایمیل پشتیبانی" {...f("supportEmail")} />
          <Field label="تلفن پشتیبانی" {...f("supportPhone")} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>کیف پول — اعدادِ پیش‌فرض</CardTitle>
          <CardDescription>موجودیِ اولیهٔ کاربرِ جدید و مبالغِ سریعِ شارژ (تومان) — بلافاصله روی همهٔ کاربران اعمال می‌شود.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <Field label="موجودی اولیهٔ کاربر جدید (تومان)" type="number"
            value={s.walletInitialBalance ?? 0}
            onChange={(e: any) => set("walletInitialBalance", Number(e.target.value) || 0)}
            hint="کاربرِ تازه‌ثبت‌نام با این موجودی شروع می‌کند" />
          <Field label="مبالغِ سریعِ شارژ (با ویرگول)"
            value={Array.isArray(s.walletQuickAmounts) ? s.walletQuickAmounts.join("، ") : ""}
            onChange={(e: any) => set("walletQuickAmounts", String(e.target.value).split(/[,،]/).map((x: string) => Number(x.replace(/[^\d]/g, ""))).filter((n: number) => n > 0))}
            hint="مثلاً: 1000000، 2000000، 5000000، 10000000" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>پیشنهادها و کدهای تخفیف (مارکت)</CardTitle>
          <CardDescription>این پیشنهادها در تبِ «پیشنهادها»ی مارکت و «پیشنهادات ویژه»ی خانه به کاربران نشان داده می‌شوند. خالی = هیچ پیشنهادی نمایش داده نمی‌شود.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {(Array.isArray(s.marketOffers) ? s.marketOffers : []).map((o: any, i: number) => {
            const upd = (patch: any) => set("marketOffers", (s.marketOffers || []).map((x: any, j: number) => (j === i ? { ...x, ...patch } : x)));
            return (
              <div key={i} className="grid gap-2 sm:grid-cols-2 rounded-lg border border-border p-3">
                <Field label="عنوان" value={o.title || ""} onChange={(e: any) => upd({ title: e.target.value })} />
                <Field label="توضیح" value={o.desc || ""} onChange={(e: any) => upd({ desc: e.target.value })} />
                <Field label="درصد تخفیف" type="number" value={o.discount ?? 0} onChange={(e: any) => upd({ discount: Number(e.target.value) || 0 })} />
                <Field label="کد تخفیف" value={o.code || ""} onChange={(e: any) => upd({ code: e.target.value })} />
                <Field label="فروشگاه / دامنه" value={o.shop || ""} onChange={(e: any) => upd({ shop: e.target.value })} />
                <Field label="اعتبار تا" value={o.validUntil || ""} onChange={(e: any) => upd({ validUntil: e.target.value })} />
                <Field label="رنگ (hex)" value={o.color || "#F59E0B"} onChange={(e: any) => upd({ color: e.target.value })} />
                <Field label="آیکون (FontAwesome)" value={o.icon || "fa-solid fa-gift"} onChange={(e: any) => upd({ icon: e.target.value })} />
                <div className="sm:col-span-2">
                  <Button variant="destructive" onClick={() => set("marketOffers", (s.marketOffers || []).filter((_: any, j: number) => j !== i))}>حذف این پیشنهاد</Button>
                </div>
              </div>
            );
          })}
          <div>
            <Button variant="outline" onClick={() => set("marketOffers", [...(Array.isArray(s.marketOffers) ? s.marketOffers : []), { id: Date.now(), title: "", desc: "", discount: 0, code: "", shop: "همه فروشگاه‌ها", validUntil: "", color: "#F59E0B", icon: "fa-solid fa-gift" }])}>+ افزودن پیشنهاد</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>صوت — گفتار↔متن (STT / TTS) — پیش‌فرضِ سیستم</CardTitle>
          <CardDescription>پیش‌فرضِ سراسری برای تبدیلِ گفتار↔متن (مثلاً تماسِ تلفنیِ هوش مصنوعی). فقط مدل‌های ارائه‌دهنده‌های <b>فعال</b> فهرست می‌شوند. هر ایجنت می‌تواند مدلِ خودش را داشته باشد؛ تنظیماتِ «دستیار شخصی» در منوی «هوش مصنوعی» اولویت دارد. اگر لیست خالی است، آنجا مدل‌ها را Sync کن.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label className="text-xs">مدلِ گفتار به متن (STT)</Label>
            <ModelSelect k="sttModel" filter={(m) => /whisper|stt|transcri|speech-to|gpt-4o-(mini-)?transcribe/i.test(String(m.modelId || m.id))} />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs">مدلِ متن به صوت (TTS) — پیش‌فرض</Label>
            <ModelSelect k="ttsModel" filter={(m) => /tts|speech|text-to|gpt-4o-(mini-)?tts/i.test(String(m.modelId || m.id))} />
          </div>
          <Field label="صدای TTS (voice) — پیش‌فرض" ph="alloy / nova / shimmer / …" {...f("ttsVoice")} />
          <div className="sm:col-span-2 mt-1 rounded-lg border border-[var(--aw-border)] p-3 grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2 text-[11px] text-muted-foreground">
              صدا به تفکیکِ جنسیت — بعضی مدل‌ها (مثل Gemini) جنسیتِ صدا را اعمال نمی‌کنند؛ برای هر جنسیت مدل و صدای جدا تعیین کنید.
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs">مدلِ صدای زنانه</Label>
              <ModelSelect k="ttsModelFemale" filter={(m) => /tts|speech|text-to|gpt-4o-(mini-)?tts/i.test(String(m.modelId || m.id))} />
            </div>
            <Field label="صدای زنانه (voice)" ph="Aoede / Kore / nova / shimmer …" {...f("ttsVoiceFemale")} />
            <div className="grid gap-1.5">
              <Label className="text-xs">مدلِ صدای مردانه</Label>
              <ModelSelect k="ttsModelMale" filter={(m) => /tts|speech|text-to|gpt-4o-(mini-)?tts/i.test(String(m.modelId || m.id))} />
            </div>
            <Field label="صدای مردانه (voice)" ph="onyx / echo / ash …" {...f("ttsVoiceMale")} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>پترن‌های پیامکِ بازاریابی (ippanel)</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2 text-[12px] text-muted-foreground leading-6">
            متنِ پترن‌ها را در پنلِ ippanel ثبت کن و کدِ هرکدام را این‌جا بگذار. متغیرها:
            <br />• صفحات → متغیرِ <b>offer</b> &nbsp;|&nbsp; ایجنت‌ها → متغیرهای <b>agent</b> و <b>discount</b>.
          </div>
          <Field label="کدِ پترنِ پیامکِ صفحات" ph="مثلاً t9k…" {...f("smsPatternPage")} />
          <div />
          {[["secretary", "منشی"], ["marketer", "بازاریاب"], ["finance", "مالی/اداری"], ["procurement", "خرید/تدارکات"], ["cashier", "فروشنده/صندوقدار"]].map(([k, lbl]) => (
            <div key={k} className="grid gap-1.5">
              <Label className="text-xs">کدِ پترنِ ایجنتِ {lbl}</Label>
              <Input value={(s.smsPatternsByAgent || {})[k] || ""} onChange={(e) => set("smsPatternsByAgent", { ...(s.smsPatternsByAgent || {}), [k]: e.target.value })} placeholder="کدِ پترن" />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>ایجنت‌های قفل (خرید اشتراک)</CardTitle>
          <CardDescription>کاربرِ عادی فقط دستیار شخصی را دارد؛ بقیهٔ ایجنت‌ها قفل (سیاه‌سفید) نمایش داده می‌شوند. این متن به‌جای نامِ ایجنتِ قفل نشان داده می‌شود.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          <Field label="متنِ نمایشی روی ایجنت‌های قفل" ph="مثلاً: برای فعال‌سازی کلیک کنید" {...f("trialMessage")} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>حافظهٔ هوش مصنوعی (پیش‌فرضِ همهٔ ایجنت‌ها)</CardTitle>
          <CardDescription>چند پیامِ گذشتهٔ هر کاربر به‌خاطر سپرده و در پاسخِ ایجنت‌ها لحاظ شود. هر ایجنت (حتی ایجنت‌های جدید) می‌تواند مقدارِ خودش را داشته باشد؛ اگر خالی بماند، از همین پیش‌فرض استفاده می‌کند.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <Field label="عمقِ حافظهٔ پیش‌فرض (تعداد پیام)" type="number" ph="50" {...f("aiMemoryDepth")} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>حافظهٔ بلندمدت (پروفایلِ پایدارِ کاربر)</CardTitle>
          <CardDescription>یک خلاصهٔ ماندگار از هر کاربر (کیست، علایق، چیزهایی که دوست ندارد، شخصیت و ترجیحات) ساخته و همیشه به‌خاطر سپرده می‌شود — هیچ‌وقت پاک نمی‌شود، حتی اگر کاربر سال‌ها بعد برگردد. این پروفایل از روی گفتگوها به‌صورت خودکار به‌روزرسانی می‌شود.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between rounded-lg border p-3">
            <Label className="text-sm">فعال‌سازی حافظهٔ بلندمدت</Label>
            <Switch checked={s.aiProfileEnabled !== false} onCheckedChange={(v) => set("aiProfileEnabled", v)} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="هر چند پیام، پروفایل به‌روزرسانی شود" type="number" ph="6" {...f("aiProfileEveryN")} />
            <Field label="حداکثر طولِ پروفایل (کلمه)" type="number" ph="220" {...f("aiProfileMaxWords")} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><KeyRound className="size-4" /> ورود پیامکی (OTP) — ippanel</CardTitle>
          <CardDescription>کلید را وارد، کلید الگو را تنظیم و «ورود پیامکی» را فعال کن.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between rounded-lg border p-3">
            <Label className="text-sm">فعال‌سازی ورود پیامکی</Label>
            <Switch checked={!!s.otpEnabled} onCheckedChange={(v) => set("otpEnabled", v)} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="کلید API (AccessKey)" type="password" ph={s.ippanelApiKeySet ? "•••• (ذخیره‌شده)" : "AccessKey"} hint={s.ippanelApiKeySet ? "ذخیره‌شده — برای تغییر مقدار جدید وارد کن" : ""} {...f("ippanelApiKey")} />
            <Field label="کد الگو (Pattern)" ph="xxxxxx" {...f("ippanelPatternCode")} />
            <Field label="کد الگوی یادآور (Reminder)" ph="xxxxxx" {...f("reminderPatternCode")}
              hint="الگوی جدا برای پیامکِ یادآور. در پنلِ ippanel باید متغیرهای title و time (و در صورت نیاز name) داشته باشد." />
            <Field label="شماره فرستنده" ph="+983000505" {...f("ippanelSender")} />
            <Field label="نام متغیر کد در الگو" ph="code" {...f("ippanelVariable")} />
            <Field label="آدرس API" ph="https://api2.ippanel.com/api/v1" {...f("ippanelBaseUrl")} />
            <Field label="خطِ ارسالِ متنِ آزاد (برای پیامکِ دستیار)" ph="مثلاً +98xxxx — اگر خالی، همان فرستندهٔ بالا" {...f("ippanelTextSender")} />
            <Field label="مسیرِ ارسالِ متنِ آزاد" ph="/sms/send/webservice/single" {...f("ippanelTextSendPath")} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>نقشه و آدرس (ژئوکدینگ فارسی)</CardTitle>
          <CardDescription>گرفتن آدرس و لوکیشن کاربر با «تکمیل خودکار نقشه». کلید هرگز به کلاینت داده نمی‌شود؛ سرور به‌عنوان پروکسی درخواست می‌زند (/api/map/*).</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">فعال‌سازی نقشه</span>
            <Switch checked={!!s.mapEnabled} onCheckedChange={(v) => set("mapEnabled", v)} />
          </div>
          {s.mapEnabled && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="آدرس پایه API نقشه (بدون /v1)" ph="https://map.example.ir" {...f("mapApiBaseUrl")} />
              <Field label="کلید API نقشه" type="password" ph={s.mapApiKeySet ? "•••••• (ذخیره‌شده)" : "API Key"} {...f("mapApiKey")} />
              <Field label="نام پارامتر کلید (کوئری)" ph="api_key" {...f("mapApiKeyParam")} />
              <Field label="نام هدر کلید (اختیاری)" ph="X-API-Key" {...f("mapApiKeyHeader")} />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>داین (رستوران/کافه) — درآمدزایی</CardTitle>
          <CardDescription>قیمتِ اشتراکِ ماهانهٔ ایجنتِ داین و درصدِ کمیسیونِ پلتفرم روی هر سفارشِ آنلاین. با انقضای اشتراک، رستورانِ کاربر خودبه‌خود از «سفارش غذا» خارج می‌شود.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="اشتراک ماهانه داین (تومان)" type="number" ph="0 = رایگان" {...f("dineSubscriptionPrice")} />
            <Field label="کمیسیون هر سفارش (٪)" type="number" ph="0 تا 100" {...f("dineCommissionPct")} />
            <Field label="هدف فودکاست (٪)" type="number" ph="30" {...f("dineTargetFoodCostPct")} />
          </div>
          <div className="rounded-lg border p-3 text-sm">
            <div className="mb-2 text-muted-foreground">درآمدِ داین تا این لحظه (واقعی):</div>
            {dineRev ? (
              <div className="grid grid-cols-3 gap-2 text-center">
                <div><div className="text-xs text-muted-foreground">اشتراک‌ها</div><div className="font-bold">{Number(dineRev.subscriptions || 0).toLocaleString("en-US")}</div></div>
                <div><div className="text-xs text-muted-foreground">کمیسیون‌ها</div><div className="font-bold">{Number(dineRev.commissions || 0).toLocaleString("en-US")}</div></div>
                <div><div className="text-xs text-muted-foreground">مجموع (تومان)</div><div className="font-bold text-emerald-500">{Number(dineRev.total || 0).toLocaleString("en-US")}</div></div>
              </div>
            ) : <div className="text-xs text-muted-foreground">— (هنوز درآمدی ثبت نشده یا در حال بارگذاری)</div>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>سرویس‌های دیگر</CardTitle></CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <Field label="آدرس وب‌هوک" ph="https://example.com/webhook" {...f("webhookUrl")} />
        </CardContent>
      </Card>
    </div>
  );
}
