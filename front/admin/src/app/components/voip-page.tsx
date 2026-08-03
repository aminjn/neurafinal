import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "../api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Save, PhoneCall, Plug, RefreshCw, PhoneOff } from "lucide-react";

const STATUS_LABEL: Record<string, string> = {
  dialing: "در حال شماره‌گیری", ringing: "در حال زنگ‌خوردن", answered: "پاسخ داده شد",
  ended: "پایان‌یافته", failed: "ناموفق", no_number: "شماره نامشخص",
};
const STATUS_VARIANT: Record<string, any> = {
  answered: "default", ringing: "secondary", dialing: "secondary",
  ended: "outline", failed: "destructive", no_number: "destructive",
};

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

// صفحهٔ تنظیمات ویپ (Asterisk ARI) + گزارش تماس‌ها در داشبورد /admin
export function VoipPage() {
  const [s, setS] = useState<any>(null);
  const [calls, setCalls] = useState<any[]>([]);
  const [testing, setTesting] = useState(false);
  const [manual, setManual] = useState({ targetName: "", targetNumber: "", purpose: "" });

  const loadCalls = async () => { try { setCalls(await api.list("call_tasks")); } catch {} };
  useEffect(() => {
    (async () => { try { setS(await api.getSettings()); } catch { toast.error("خطا در دریافت تنظیمات"); } })();
    loadCalls();
  }, []);

  const set = (k: string, v: any) => setS((p: any) => ({ ...p, [k]: v }));
  // پیش‌تنظیم Issabel/FreePBX: شماره‌گیری بیرونی از مسیر outbound routes
  const applyIssabelPreset = () => {
    setS((p: any) => ({ ...p, voipEndpointPattern: "Local/{number}@from-internal", voipTrunk: "", voipAppName: "", voipContext: "from-internal" }));
    toast.success("پیش‌تنظیم Issabel اعمال شد — حالا «ذخیره و اتصال» را بزن");
  };
  // پیش‌تنظیم «صدای هوش مصنوعی» (فاز ۲): تماسِ تکیِ مستقیم روی ترانک + ورود به Stasis app.
  // ⚠️ از Local/...@from-internal استفاده نمی‌کند چون هر دو نیمهٔ کانال دوبار به ترانک زنگ می‌زند.
  const applyAiVoicePreset = () => {
    setS((p: any) => ({
      ...p, voipEnabled: true, voipAppName: "ai-agent",
      voipEndpointPattern: "SIP/shatel/{number}", voipTrunk: "", voipContext: "", voipExtension: "",
    }));
    toast.success("پیش‌تنظیم صدای هوش مصنوعی اعمال شد — حالا «ذخیره و اتصال» را بزن");
  };
  const save = async () => {
    try { const r = await api.putSettings(s); setS(r); toast.success("تنظیمات ویپ ذخیره شد"); return true; }
    catch (e: any) { toast.error(e?.status === 403 ? "فقط سوپر‌ادمین" : "خطا در ذخیره"); return false; }
  };
  const test = async () => {
    setTesting(true);
    try {
      const r = await api.voipTest();
      if (r.ok) toast.success(`اتصال برقرار شد ✅ نسخهٔ Asterisk: ${r.version || "?"}`);
      else toast.error(`اتصال ناموفق: ${r.error || r.status || JSON.stringify(r.detail)}`);
    } catch (e: any) { toast.error("خطا در تست اتصال"); }
    finally { setTesting(false); }
  };
  const saveAndConnect = async () => { if (await save()) await test(); };
  const placeManual = async () => {
    if (!manual.targetNumber && !manual.targetName) return toast.error("نام یا شماره را وارد کن");
    try {
      const r = await api.voipCall({ ...manual, requestedBy: "admin" });
      if (r.ok) { toast.success("تماس برقرار شد"); setManual({ targetName: "", targetNumber: "", purpose: "" }); }
      else toast.error(r.reason === "no_number" ? "شماره پیدا نشد" : "برقراری تماس ناموفق");
      loadCalls();
    } catch { toast.error("خطا در برقراری تماس"); }
  };
  const refresh = async (id: string) => {
    try { const r = await api.voipStatus(id); toast.message(`وضعیت: ${STATUS_LABEL[r.status] || r.status}`); loadCalls(); }
    catch { toast.error("خطا در بروزرسانی"); }
  };
  const hangup = async (id: string) => { try { await api.voipHangup(id); loadCalls(); } catch {} };

  if (!s) return <div className="flex h-48 items-center justify-center text-muted-foreground">در حال بارگذاری…</div>;

  const f = (k: string) => ({ value: s[k], onChange: (e: any) => set(k, e.target.value) });

  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>تماس صوتی (ویپ)</h1>
          <p className="text-sm text-muted-foreground">اتصال به سرور Asterisk و گزارش تماس‌های ایجنت‌ها</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={applyAiVoicePreset}>پیش‌تنظیم صدای هوش مصنوعی (فاز ۲)</Button>
          <Button variant="secondary" onClick={applyIssabelPreset}>پیش‌تنظیم Issabel/FreePBX</Button>
          <Button variant="outline" onClick={test} disabled={testing}><Plug className="size-4 ms-1" /> {testing ? "در حال تست…" : "تست اتصال"}</Button>
          <Button onClick={save}><Save className="size-4 ms-1" /> ذخیره</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><PhoneCall className="size-4" /> تنظیمات VoIP (Asterisk ARI)</CardTitle>
          <CardDescription>آدرس به‌صورت <span dir="ltr">host:port</span> (مثلاً <span dir="ltr">84.241.5.9:8585</span>)؛ <span dir="ltr">http://</span> و <span dir="ltr">/ari</span> خودکار اضافه می‌شوند.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between rounded-lg border p-3">
            <Label className="text-sm">فعال‌سازی تماس صوتی</Label>
            <Switch checked={!!s.voipEnabled} onCheckedChange={(v) => set("voipEnabled", v)} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="آدرس ARI (host:port)" ph="84.241.5.9:8585" {...f("voipBaseUrl")} />
            <Field label="نام Stasis app" ph="ai-agent" hint="برای ورود تماس به اپ صدای هوش مصنوعی (فاز ۲)" {...f("voipAppName")} />
            <Field label="کاربر ARI" ph="ariuser" {...f("voipUsername")} />
            <Field label="رمز ARI" type="password" ph={s.voipPasswordSet ? "•••• (ذخیره‌شده)" : "password"} hint={s.voipPasswordSet ? "ذخیره‌شده — برای تغییر مقدار جدید وارد کن" : ""} {...f("voipPassword")} />
            <Field label="ترانک خروجی" ph="mytrunk" hint="→ PJSIP/{number}@{trunk}" {...f("voipTrunk")} />
            <Field label="Caller ID" ph="+982191004136" {...f("voipCallerId")} />
          </div>
          <div className="flex justify-end pt-1">
            <Button onClick={saveAndConnect} disabled={testing}><Plug className="size-4 ms-1" /> {testing ? "در حال اتصال…" : "ذخیره و اتصال"}</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">تنظیمات پیشرفته (اختیاری)</CardTitle><CardDescription>اگر بدون Stasis app و با dialplan وصل می‌شوی.</CardDescription></CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <Field label="الگوی Endpoint" ph="PJSIP/{number}" hint="{number} و {trunk} جایگزین می‌شوند" {...f("voipEndpointPattern")} />
          <Field label="Context در dialplan" ph="from-internal" {...f("voipContext")} />
          <Field label="داخلیِ اتصال (Extension)" ph="خالی = همان شمارهٔ مقصد" {...f("voipExtension")} />
          <Field label="مهلت زنگ (ثانیه)" type="number" ph="30" {...f("voipTimeout")} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>تماس دستی (تست)</CardTitle><CardDescription>یک تماس آزمایشی برقرار کن.</CardDescription></CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-1.5"><Label className="text-xs">نام مخاطب</Label><Input value={manual.targetName} onChange={(e) => setManual((m) => ({ ...m, targetName: e.target.value }))} placeholder="آقای محمدی" /></div>
          <div className="grid gap-1.5"><Label className="text-xs">شماره</Label><Input dir="ltr" value={manual.targetNumber} onChange={(e) => setManual((m) => ({ ...m, targetNumber: e.target.value }))} placeholder="09120000000" /></div>
          <div className="grid gap-1.5 sm:col-span-2"><Label className="text-xs">هدف تماس</Label><Textarea value={manual.purpose} onChange={(e) => setManual((m) => ({ ...m, purpose: e.target.value }))} placeholder="هماهنگی جلسه" /></div>
          <div><Button onClick={placeManual}><PhoneCall className="size-4 ms-1" /> برقراری تماس</Button></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div><CardTitle>گزارش تماس‌ها</CardTitle><CardDescription>تماس‌هایی که ایجنت‌ها یا ادمین گرفته‌اند.</CardDescription></div>
          <Button variant="outline" size="sm" onClick={loadCalls}><RefreshCw className="size-4 ms-1" /> تازه‌سازی</Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>مخاطب</TableHead><TableHead>شماره</TableHead><TableHead>ایجنت</TableHead>
                <TableHead>هدف</TableHead><TableHead>وضعیت</TableHead><TableHead>نتیجه</TableHead><TableHead>زمان</TableHead><TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {calls.length === 0 && <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground">تماسی ثبت نشده.</TableCell></TableRow>}
              {calls.slice().reverse().map((c) => (
                <TableRow key={c.id}>
                  <TableCell>{c.targetName || "—"}</TableCell>
                  <TableCell dir="ltr">{c.targetNumber || "—"}</TableCell>
                  <TableCell>{c.agentName || c.agentId || "—"}</TableCell>
                  <TableCell className="max-w-40 truncate" title={c.purpose}>{c.purpose || "—"}</TableCell>
                  <TableCell><Badge variant={STATUS_VARIANT[c.status] || "outline"}>{STATUS_LABEL[c.status] || c.status}</Badge></TableCell>
                  <TableCell>{c.outcome || "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground" dir="ltr">{c.createdAt ? new Date(c.createdAt).toLocaleString("fa-IR") : "—"}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" title="بروزرسانی وضعیت" onClick={() => refresh(c.id)}><RefreshCw className="size-4" /></Button>
                      {c.channelId && <Button variant="ghost" size="icon" title="قطع تماس" onClick={() => hangup(c.id)}><PhoneOff className="size-4" /></Button>}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
