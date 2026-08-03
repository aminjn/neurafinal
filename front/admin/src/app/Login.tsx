import { useState } from "react";
import { api, setToken, type AuthUser } from "./api";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { ShieldCheck } from "lucide-react";

export function Login({ onSuccess }: { onSuccess: (u: AuthUser) => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const submit = async () => {
    setErr("");
    setBusy(true);
    try {
      const { token, user } = await api.login(username.trim(), password);
      if (user.role !== "superadmin" && user.role !== "admin") {
        setErr("این حساب دسترسی پنل مدیریت ندارد");
        setBusy(false);
        return;
      }
      setToken(token);
      onSuccess(user);
    } catch (e: any) {
      setErr(e?.status === 401 ? "نام کاربری یا رمز اشتباه است" : "خطا در اتصال به سرور");
    }
    setBusy(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6" dir="rtl">
      <div className="w-full max-w-sm rounded-2xl border bg-card p-6 shadow-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <ShieldCheck className="size-7" />
          </div>
          <h1 className="text-lg">ورود پنل مدیریت</h1>
          <p className="text-sm text-muted-foreground">برای دسترسی وارد شوید</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="u">نام کاربری</Label>
            <Input id="u" dir="ltr" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="superadmin" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="p">رمز عبور</Label>
            <Input id="p" type="password" dir="ltr" value={password} onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()} />
          </div>

          {err && <p className="text-sm text-destructive">{err}</p>}

          <Button className="w-full" onClick={submit} disabled={busy}>
            {busy ? "در حال ورود…" : "ورود"}
          </Button>
        </div>
      </div>
    </div>
  );
}
