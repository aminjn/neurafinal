import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { ArrowRight, Download } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { toast } from "sonner";

function exportInvoice(invoice: any) {
  const lines = [
    `شماره فاکتور: ${invoice.id}`,
    `بیزینس: ${invoice.business}`,
    `ایجنت خریداری‌شده: ${invoice.agent}`,
    `تاریخ ایجاد: ${invoice.createdAt}`,
    `مبلغ خالص: ${invoice.grossAmount}`,
    `مبلغ نهایی: ${invoice.finalAmount}`,
    `نحوه پرداخت: ${invoice.paymentMethod}`,
    `تاریخ تسویه: ${invoice.settledAt || "-"}`,
    `وضعیت: ${invoice.status}`,
  ];
  const blob = new Blob(["﻿" + lines.join("\n")], {
    type: "text/plain;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${invoice.id}.txt`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  toast.success("فاکتور دانلود شد");
}

export function InvoiceDetailView({
  invoice,
  onBack,
}: {
  invoice: any;
  onBack: () => void;
}) {
  const discount =
    Number(invoice.grossAmount ?? 0) - Number(invoice.finalAmount ?? 0);

  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowRight className="h-4 w-4" />
          </Button>
          <div>
            <h1>فاکتور — {invoice.id}</h1>
            <p className="text-sm text-muted-foreground">
              {invoice.business} · {invoice.createdAt}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => exportInvoice(invoice)}
          >
            <Download className="h-4 w-4 ml-1" />
            خروجی فاکتور
          </Button>
          <Badge
            variant={invoice.status === "تسویه شده" ? "default" : "secondary"}
          >
            {invoice.status}
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">اطلاعات فاکتور</TabsTrigger>
          <TabsTrigger value="settlement">تراکنش تسویه فاکتور</TabsTrigger>
          <TabsTrigger value="agent">ایجنت فاکتور</TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <Card>
            <CardHeader>
              <CardTitle>اطلاعات فاکتور</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label className="text-xs text-muted-foreground">شماره فاکتور</Label>
                <Input value={invoice.id ?? ""} disabled />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs text-muted-foreground">بیزینس</Label>
                <Input value={invoice.business ?? ""} disabled />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs text-muted-foreground">تاریخ ایجاد</Label>
                <Input value={invoice.createdAt ?? ""} disabled />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs text-muted-foreground">مبلغ خالص (قبل از تخفیف)</Label>
                <Input value={String(invoice.grossAmount ?? 0)} disabled />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs text-muted-foreground">تخفیف</Label>
                <Input value={String(discount)} disabled />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs text-muted-foreground">مبلغ نهایی</Label>
                <Input value={String(invoice.finalAmount ?? 0)} disabled />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs text-muted-foreground">نحوه پرداخت</Label>
                <Input value={invoice.paymentMethod ?? ""} disabled />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs text-muted-foreground">وضعیت</Label>
                <Input value={invoice.status ?? ""} disabled />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settlement">
          <Card>
            <CardHeader>
              <CardTitle>تراکنش تسویه فاکتور</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label className="text-xs text-muted-foreground">شناسه تراکنش</Label>
                <Input value={`TX-${invoice.id?.slice(-4) ?? ""}`} disabled />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs text-muted-foreground">کد پیگیری</Label>
                <Input value={`RRN-${invoice.id?.slice(-6) ?? ""}`} disabled />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs text-muted-foreground">مبلغ پرداختی</Label>
                <Input value={String(invoice.finalAmount ?? 0)} disabled />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs text-muted-foreground">روش پرداخت</Label>
                <Input value={invoice.paymentMethod ?? ""} disabled />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs text-muted-foreground">تاریخ تسویه</Label>
                <Input value={invoice.settledAt || "-"} disabled />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs text-muted-foreground">وضعیت تراکنش</Label>
                <Input
                  value={invoice.settledAt ? "موفق" : "در انتظار"}
                  disabled
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agent">
          <Card>
            <CardHeader>
              <CardTitle>ایجنت فاکتور</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label className="text-xs text-muted-foreground">نام ایجنت</Label>
                <Input value={invoice.agent ?? ""} disabled />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs text-muted-foreground">پلن خریداری‌شده</Label>
                <Input value={invoice.plan ?? "حرفه‌ای"} disabled />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs text-muted-foreground">مدت اعتبار</Label>
                <Input value={invoice.duration ?? "۱۲ ماه"} disabled />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs text-muted-foreground">توکن اولیه</Label>
                <Input value={String(invoice.initialTokens ?? 200000)} disabled />
              </div>
              <div className="grid gap-1.5 md:col-span-2">
                <Label className="text-xs text-muted-foreground">توضیحات</Label>
                <Input
                  value={`خرید ایجنت ${invoice.agent} برای بیزینس ${invoice.business}`}
                  disabled
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
