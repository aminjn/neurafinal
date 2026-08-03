import { useState } from "react";
import { api } from "../api";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Switch } from "./ui/switch";
import { Badge } from "./ui/badge";
import { ArrowRight, Save, X, Pencil } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { toast } from "sonner";
import type { AgentDef } from "./agent-defs-page";
import { PromptListEditor } from "./prompt-list-editor";

export function AgentDefSettings({
  agent,
  onBack,
}: {
  agent: AgentDef;
  onBack: () => void;
}) {
  const [data, setData] = useState<AgentDef>(agent);
  const [draft, setDraft] = useState<AgentDef>(agent);
  const [editing, setEditing] = useState(false);
  const [moduleKey, setModuleKey] = useState<string>("");

  const start = () => {
    setDraft(data);
    setEditing(true);
  };
  const save = () => {
    setData(draft);
    setEditing(false);
    const id = (draft as any).id || draft.name;
    api.update("agent_defs", String(id), draft as any)
      .then(() => toast.success("تعریف ایجنت ذخیره شد"))
      .catch(() => toast.error("خطا در ذخیره"));
  };

  const view = editing ? draft : data;

  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowRight className="h-4 w-4" />
          </Button>
          <div>
            <h1>تنظیمات تعریف ایجنت — {data.name}</h1>
            <p className="text-sm text-muted-foreground">
              ویرایش مشخصات و رفتار این ایجنت
            </p>
          </div>
        </div>
        <Badge variant={data.status === "فعال" ? "default" : "secondary"}>
          {data.status}
        </Badge>
      </div>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">عمومی</TabsTrigger>
          <TabsTrigger value="prompt">پرامپت</TabsTrigger>
          <TabsTrigger value="module">ماژول</TabsTrigger>
          <TabsTrigger value="pricing">قیمت‌گذاری</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>اطلاعات عمومی</CardTitle>
              {editing ? (
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                    <X className="h-4 w-4 ml-1" />
                    انصراف
                  </Button>
                  <Button size="sm" onClick={save}>
                    <Save className="h-4 w-4 ml-1" />
                    ذخیره
                  </Button>
                </div>
              ) : (
                <Button size="sm" variant="outline" onClick={start}>
                  <Pencil className="h-4 w-4 ml-1" />
                  ویرایش
                </Button>
              )}
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <Label>نام</Label>
                  <Input
                    value={view.name}
                    disabled={!editing}
                    onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label>تاریخ ایجاد</Label>
                  <Input value={view.createdAt} disabled />
                </div>
                <div className="grid gap-1.5">
                  <Label>رتبه</Label>
                  <Input
                    type="number"
                    min={1}
                    max={5}
                    value={view.rank}
                    disabled={!editing}
                    onChange={(e) =>
                      setDraft({ ...draft, rank: Number(e.target.value) })
                    }
                  />
                </div>
                <div className="flex items-center justify-between border rounded-md p-3">
                  <Label>وضعیت فعال</Label>
                  <Switch
                    checked={view.status === "فعال"}
                    disabled={!editing}
                    onCheckedChange={(c) =>
                      setDraft({ ...draft, status: c ? "فعال" : "غیرفعال" })
                    }
                  />
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label>توضیحات</Label>
                <Textarea
                  rows={4}
                  value={view.description}
                  disabled={!editing}
                  onChange={(e) =>
                    setDraft({ ...draft, description: e.target.value })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prompt">
          <Card>
            <CardHeader>
              <CardTitle>لیست پرامپت‌ها</CardTitle>
            </CardHeader>
            <CardContent>
              <PromptListEditor />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="module">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>اتصال به ماژول بک‌اند</CardTitle>
              <Button
                size="sm"
                onClick={() => toast.success("ماژول متصل شد")}
                disabled={!moduleKey}
              >
                <Save className="h-4 w-4 ml-1" />
                ذخیره
              </Button>
            </CardHeader>
            <CardContent className="grid gap-4">
              <p className="text-sm text-muted-foreground">
                این تعریف ایجنت را به یکی از ماژول‌های ساخته‌شده در بک‌اند متصل
                کنید. ماژول مشخص می‌کند ایجنت به چه ابزارها و توابعی دسترسی دارد.
              </p>
              <div className="grid gap-1.5">
                <Label>ماژول بک‌اند</Label>
                <Select value={moduleKey} onValueChange={setModuleKey}>
                  <SelectTrigger>
                    <SelectValue placeholder="انتخاب ماژول..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="accounting">accounting — حسابداری</SelectItem>
                    <SelectItem value="inventory">inventory — انبارداری</SelectItem>
                    <SelectItem value="support">support — پشتیبانی</SelectItem>
                    <SelectItem value="marketing">marketing — بازاریابی</SelectItem>
                    <SelectItem value="hr">hr — منابع انسانی</SelectItem>
                    <SelectItem value="legal">legal — حقوقی</SelectItem>
                    <SelectItem value="crm">crm — مدیریت ارتباط با مشتری</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {moduleKey && (
                <div className="rounded-md border bg-muted/40 p-3">
                  <div className="text-xs text-muted-foreground mb-1">
                    ماژول انتخاب‌شده
                  </div>
                  <div className="font-mono text-sm">{moduleKey}</div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pricing">
          <Card>
            <CardHeader>
              <CardTitle>قیمت‌گذاری</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label>قیمت پایه (تومان)</Label>
                <Input type="number" defaultValue={500000} />
              </div>
              <div className="grid gap-1.5">
                <Label>قیمت حرفه‌ای (تومان)</Label>
                <Input type="number" defaultValue={1200000} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
