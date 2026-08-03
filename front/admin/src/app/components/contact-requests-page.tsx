import { useEffect, useState } from "react";
import { api } from "../api";
import { CrudDataGrid, fieldsFromColumns } from "./crud-grid";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Textarea } from "./ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { DataGrid, type GridColumn } from "./data-grid";
import { ArrowRight, Save } from "lucide-react";
import { toast } from "sonner";

type ContactRequest = {
  id: string;
  name: string;
  phone: string;
  email: string;
  topic: string;
  message: string;
  preferredTime: string;
  submittedAt: string;
  status: "در انتظار بررسی" | "بررسی شده";
  reviewResult?: string;
  reviewedBy?: string;
  reviewedAt?: string;
};

const initialRequests: ContactRequest[] = [
  { id: "CR-2001", name: "علی حسینی", phone: "0912-1110001", email: "ali.h@example.com", topic: "مشاوره خرید", message: "می‌خواستم درباره پلن‌های ایجنت بازاریاب راهنمایی شوم.", preferredTime: "روزهای کاری ۹ تا ۱۲", submittedAt: "2026-05-05 10:24", status: "در انتظار بررسی" },
  { id: "CR-2002", name: "زهرا قاسمی", phone: "0912-1110002", email: "z.ghasemi@example.com", topic: "پشتیبانی فنی", message: "ایجنت من به درستی پاسخ نمی‌دهد، نیاز به بررسی دارم.", preferredTime: "بعدازظهر", submittedAt: "2026-05-06 14:02", status: "بررسی شده", reviewResult: "تماس برقرار شد و مشکل از طریق ریست توکن حل شد.", reviewedBy: "مریم رضایی", reviewedAt: "2026-05-06 16:30" },
  { id: "CR-2003", name: "محمد کریمی", phone: "0912-1110003", email: "m.karimi@example.com", topic: "همکاری", message: "علاقه‌مند به همکاری به عنوان نماینده فروش هستم.", preferredTime: "هر زمان", submittedAt: "2026-05-07 09:15", status: "در انتظار بررسی" },
  { id: "CR-2004", name: "نگار موسوی", phone: "0912-1110004", email: "negar.m@example.com", topic: "مشاوره خرید", message: "تفاوت پلن استاندارد و حرفه‌ای چیست؟", preferredTime: "صبح", submittedAt: "2026-05-08 11:48", status: "در انتظار بررسی" },
  { id: "CR-2005", name: "رضا نجفی", phone: "0912-1110005", email: "reza@example.com", topic: "گزارش باگ", message: "هنگام خروج گزارش CSV با خطا مواجه می‌شوم.", preferredTime: "ظهر", submittedAt: "2026-05-09 13:30", status: "بررسی شده", reviewResult: "باگ به تیم فنی ارجاع داده شد، در نسخه بعدی برطرف می‌شود.", reviewedBy: "علی حسینی", reviewedAt: "2026-05-09 17:00" },
];

const columns: GridColumn[] = [
  { field: "id", headerName: "شناسه", filterType: "text", width: 120 },
  { field: "name", headerName: "نام مشتری", filterType: "text" },
  { field: "phone", headerName: "تلفن", filterType: "text" },
  { field: "topic", headerName: "موضوع", filterType: "set" },
  { field: "preferredTime", headerName: "زمان ترجیحی", filterType: "set" },
  { field: "submittedAt", headerName: "تاریخ ثبت", filterType: "date" },
  { field: "status", headerName: "وضعیت", filterType: "set" },
];

function ContactRequestDetail({
  req,
  onBack,
  onSave,
}: {
  req: ContactRequest;
  onBack: () => void;
  onSave: (updated: ContactRequest) => void;
}) {
  const [status, setStatus] = useState(req.status);
  const [result, setResult] = useState(req.reviewResult ?? "");

  const handleSave = () => {
    if (status === "بررسی شده" && !result.trim()) {
      toast.error("لطفاً نتیجه بررسی را وارد کنید");
      return;
    }
    const updated: ContactRequest = {
      ...req,
      status,
      reviewResult: status === "بررسی شده" ? result.trim() : req.reviewResult,
      reviewedBy: status === "بررسی شده" ? "علی رضایی" : req.reviewedBy,
      reviewedAt:
        status === "بررسی شده"
          ? new Date().toLocaleString("fa-IR")
          : req.reviewedAt,
    };
    onSave(updated);
    toast.success("درخواست با موفقیت ذخیره شد");
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowRight className="h-4 w-4" />
          </Button>
          <div>
            <h1>درخواست تماس — {req.id}</h1>
            <p className="text-sm text-muted-foreground">
              {req.name} · {req.submittedAt}
            </p>
          </div>
        </div>
        <Badge
          variant={status === "بررسی شده" ? "default" : "secondary"}
        >
          {status}
        </Badge>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>اطلاعات مشتری</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label className="text-xs text-muted-foreground">نام</Label>
              <Input value={req.name} disabled />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs text-muted-foreground">تلفن</Label>
              <Input value={req.phone} disabled />
            </div>
            <div className="grid gap-1.5 md:col-span-2">
              <Label className="text-xs text-muted-foreground">ایمیل</Label>
              <Input value={req.email} disabled />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs text-muted-foreground">موضوع</Label>
              <Input value={req.topic} disabled />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs text-muted-foreground">
                زمان ترجیحی
              </Label>
              <Input value={req.preferredTime} disabled />
            </div>
            <div className="grid gap-1.5 md:col-span-2">
              <Label className="text-xs text-muted-foreground">
                پیام مشتری
              </Label>
              <Textarea value={req.message} disabled rows={4} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>بررسی درخواست</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid gap-1.5">
              <Label className="text-xs text-muted-foreground">وضعیت</Label>
              <Select
                value={status}
                onValueChange={(v) =>
                  setStatus(v as ContactRequest["status"])
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="در انتظار بررسی">در انتظار بررسی</SelectItem>
                  <SelectItem value="بررسی شده">بررسی شده</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-1.5">
              <Label className="text-xs text-muted-foreground">
                نتیجه بررسی
              </Label>
              <Textarea
                value={result}
                onChange={(e) => setResult(e.target.value)}
                placeholder="نتیجه تماس / بررسی را وارد کنید..."
                rows={6}
                disabled={status === "در انتظار بررسی"}
              />
              {status === "در انتظار بررسی" && (
                <p className="text-xs text-muted-foreground">
                  برای ثبت نتیجه، وضعیت را به «بررسی شده» تغییر دهید.
                </p>
              )}
            </div>

            {req.reviewedBy && (
              <div className="grid grid-cols-2 gap-3 rounded-md border p-3 bg-muted/30">
                <div className="grid gap-1">
                  <Label className="text-xs text-muted-foreground">
                    بررسی توسط
                  </Label>
                  <span className="text-sm">{req.reviewedBy}</span>
                </div>
                <div className="grid gap-1">
                  <Label className="text-xs text-muted-foreground">
                    تاریخ بررسی
                  </Label>
                  <span className="text-sm">{req.reviewedAt}</span>
                </div>
              </div>
            )}

            <Button onClick={handleSave} className="self-end">
              <Save className="h-4 w-4 ml-1" />
              ذخیره
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function ContactRequestsPage() {
  const [requests, setRequests] = useState<ContactRequest[]>([]);
  const [selected, setSelected] = useState<ContactRequest | null>(null);

  useEffect(() => {
    (async () => {
      try { setRequests(await api.list<ContactRequest>("contact_requests")); } // خالی هم خالی
      catch { setRequests(initialRequests); }
    })();
  }, []);

  if (selected) {
    return (
      <ContactRequestDetail
        req={selected}
        onBack={() => setSelected(null)}
        onSave={(updated) => {
          api.update("contact_requests", updated.id, updated).catch(() => {});
          setRequests((rs) =>
            rs.map((r) => (r.id === updated.id ? updated : r)),
          );
          setSelected(updated);
        }}
      />
    );
  }

  const pending = requests.filter((r) => r.status === "در انتظار بررسی").length;
  const reviewed = requests.filter((r) => r.status === "بررسی شده").length;

  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>درخواست‌های تماس مشتریان</h1>
          <p className="text-sm text-muted-foreground">
            درخواست‌های مشاوره و پشتیبانی ثبت‌شده توسط مشتریان
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">در انتظار بررسی: {pending}</Badge>
          <Badge>بررسی شده: {reviewed}</Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>لیست درخواست‌ها</CardTitle>
        </CardHeader>
        <CardContent>
          <CrudDataGrid
            embedded
            apiKind="data"
            collection="contact_requests"
            columns={columns}
            fields={fieldsFromColumns(columns)}
            onRowAction={(row) => setSelected(row)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
