import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { ArrowRight, Plus, Minus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { DataGrid, type GridColumn } from "./data-grid";
import { api } from "../api";

const txCols: GridColumn[] = [
  { field: "id", headerName: "شناسه", filterType: "text", width: 150 },
  { field: "title", headerName: "شرح", filterType: "text" },
  { field: "type", headerName: "نوع", filterType: "set" },
  { field: "amount", headerName: "مبلغ (تومان)", filterType: "number" },
  { field: "date", headerName: "تاریخ", filterType: "text" },
];

export function WalletDetailView({
  wallet,
  onBack,
}: {
  wallet: any;
  onBack: () => void;
}) {
  const [balance, setBalance] = useState<number>(Number(wallet.balance ?? 0));
  const [tx, setTx] = useState<any[]>([]);
  const [amount, setAmount] = useState<string>("");
  const [busy, setBusy] = useState(false);

  const reload = () => {
    if (wallet.id == null) return;
    api
      .walletUser(wallet.id)
      .then((w) => {
        setBalance(Number(w.balance ?? 0));
        setTx(Array.isArray(w.tx) ? w.tx : []);
      })
      .catch(() => {});
  };
  useEffect(reload, [wallet.id]);

  const adjust = async (sign: 1 | -1) => {
    const n = Math.trunc(Number(String(amount).replace(/[^\d.-]/g, "")));
    if (!n || n <= 0) { toast.error("مبلغ را وارد کنید"); return; }
    if (wallet.id == null) { toast.error("کاربر نامشخص است"); return; }
    setBusy(true);
    try {
      const r = await api.walletAdjust(wallet.id, sign * n, sign > 0 ? "افزایش موجودی توسط مدیر" : "کاهش موجودی توسط مدیر");
      setBalance(Number(r.balance ?? 0));
      setTx(Array.isArray(r.tx) ? r.tx : []);
      setAmount("");
      toast.success(sign > 0 ? "موجودی افزایش یافت" : "موجودی کاهش یافت");
    } catch (e: any) {
      toast.error(e?.status === 402 ? "موجودی برای کاهش کافی نیست" : "خطا در تغییر موجودی");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowRight className="h-4 w-4" />
          </Button>
          <div>
            <h1>کیف پول — {wallet.user}</h1>
            <p className="text-sm text-muted-foreground">
              موجودی فعلی: {balance.toLocaleString()} تومان
            </p>
          </div>
        </div>
        <Badge variant={wallet.status === "فعال" ? "default" : "secondary"}>
          {wallet.status}
        </Badge>
      </div>

      {/* افزایش / کاهش موجودی */}
      <Card>
        <CardHeader>
          <CardTitle>تغییر موجودی کیف پول</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="grid flex-1 gap-1.5">
            <Label className="text-xs text-muted-foreground">مبلغ (تومان)</Label>
            <Input
              type="number"
              inputMode="numeric"
              placeholder="مثلاً ۵۰۰۰۰۰"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={busy}
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={() => adjust(1)} disabled={busy} className="gap-1">
              <Plus className="h-4 w-4" /> افزایش
            </Button>
            <Button onClick={() => adjust(-1)} disabled={busy} variant="destructive" className="gap-1">
              <Minus className="h-4 w-4" /> کاهش
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="user">
        <TabsList>
          <TabsTrigger value="user">اطلاعات یوزر</TabsTrigger>
          <TabsTrigger value="transactions">تراکنش‌های کیف پول</TabsTrigger>
        </TabsList>

        <TabsContent value="user">
          <Card>
            <CardHeader>
              <CardTitle>اطلاعات کاربر مرتبط با این کیف پول</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label className="text-xs text-muted-foreground">نام کاربر</Label>
                <Input value={wallet.user ?? ""} disabled />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs text-muted-foreground">ایمیل</Label>
                <Input value={wallet.email ?? ""} disabled />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs text-muted-foreground">موجودی</Label>
                <Input value={balance.toLocaleString()} disabled />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs text-muted-foreground">مجموع شارژ</Label>
                <Input value={String(wallet.totalCharged ?? 0)} disabled />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs text-muted-foreground">مجموع مصرف</Label>
                <Input value={String(wallet.totalSpent ?? 0)} disabled />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs text-muted-foreground">آخرین تراکنش</Label>
                <Input value={wallet.lastUpdate ?? ""} disabled />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>تراکنش‌های این کیف پول</CardTitle>
            </CardHeader>
            <CardContent>
              <DataGrid rowData={tx} columnDefs={txCols} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
