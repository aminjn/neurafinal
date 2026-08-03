import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { ArrowRight } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

export function TransactionDetailView({
  tx,
  onBack,
}: {
  tx: any;
  onBack: () => void;
}) {
  const statusVariant =
    tx.status === "موفق"
      ? "default"
      : tx.status === "ناموفق"
      ? "destructive"
      : "secondary";

  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowRight className="h-4 w-4" />
          </Button>
          <div>
            <h1>تراکنش — {tx.id}</h1>
            <p className="text-sm text-muted-foreground">
              مبلغ: {Number(tx.amount ?? 0).toLocaleString()} تومان
            </p>
          </div>
        </div>
        <Badge variant={statusVariant as any}>{tx.status}</Badge>
      </div>

      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">اطلاعات تراکنش</TabsTrigger>
          <TabsTrigger value="user">اطلاعات یوزر تراکنش</TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <Card>
            <CardHeader>
              <CardTitle>اطلاعات تراکنش</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label className="text-xs text-muted-foreground">شناسه تراکنش</Label>
                <Input value={tx.id ?? ""} disabled />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs text-muted-foreground">کد پیگیری</Label>
                <Input value={tx.ref ?? ""} disabled />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs text-muted-foreground">کد مرجع</Label>
                <Input value={tx.gatewayRef ?? `RRN-${tx.id?.slice(-6) ?? ""}`} disabled />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs text-muted-foreground">نوع تراکنش</Label>
                <Input value={tx.type ?? ""} disabled />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs text-muted-foreground">مبلغ (تومان)</Label>
                <Input value={String(tx.amount ?? 0)} disabled />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs text-muted-foreground">روش پرداخت</Label>
                <Input value={tx.method ?? ""} disabled />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs text-muted-foreground">وضعیت</Label>
                <Input value={tx.status ?? ""} disabled />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs text-muted-foreground">تاریخ</Label>
                <Input value={tx.date ?? ""} disabled />
              </div>
              <div className="grid gap-1.5 md:col-span-2">
                <Label className="text-xs text-muted-foreground">توضیحات درگاه</Label>
                <Input value={tx.gatewayMessage ?? "تراکنش با موفقیت انجام شد"} disabled />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="user">
          <Card>
            <CardHeader>
              <CardTitle>اطلاعات یوزر تراکنش</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label className="text-xs text-muted-foreground">نام کاربر</Label>
                <Input value={tx.user ?? ""} disabled />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs text-muted-foreground">ایمیل</Label>
                <Input value={tx.userEmail ?? "-"} disabled />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs text-muted-foreground">شماره تماس</Label>
                <Input value={tx.userPhone ?? "0912-XXXXXXX"} disabled />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs text-muted-foreground">نقش</Label>
                <Input value={tx.userRole ?? "کاربر"} disabled />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
