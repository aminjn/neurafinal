import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { ArrowRight } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

export type Detail = { menu: string; row: any };

const titleMap: Record<string, { title: (r: any) => string; subtitle: string }> = {
  "data.users": {
    title: (r) => `مدیریت کاربر — ${r.name}`,
    subtitle: "مشاهده و ویرایش اطلاعات کاربر",
  },
  "data.businesses": {
    title: (r) => `مدیریت بیزینس — ${r.name}`,
    subtitle: "تنظیمات و اطلاعات بیزینس",
  },
  "support.tickets": {
    title: (r) => `تیکت ${r.id} — ${r.subject}`,
    subtitle: "مدیریت تیکت پشتیبانی",
  },
};

export function DetailView({
  detail,
  onBack,
}: {
  detail: Detail;
  onBack: () => void;
}) {
  const meta = titleMap[detail.menu];
  const row = detail.row;
  const title = meta?.title(row) ?? "جزئیات";
  const subtitle = meta?.subtitle ?? "";

  const fields = Object.entries(row).filter(([k]) => k !== "__id");

  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowRight className="h-4 w-4" />
          </Button>
          <div>
            <h1>{title}</h1>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>
        </div>
        <Badge variant="secondary">{detail.menu}</Badge>
      </div>

      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">اطلاعات</TabsTrigger>
          <TabsTrigger value="activity">فعالیت‌ها</TabsTrigger>
          <TabsTrigger value="settings">تنظیمات</TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <Card>
            <CardHeader>
              <CardTitle>اطلاعات کلی</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {fields.map(([k, v]) => (
                  <div key={k} className="flex flex-col gap-1">
                    <dt className="text-xs text-muted-foreground">{k}</dt>
                    <dd className="text-sm">{String(v)}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>فعالیت‌های اخیر</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                هنوز فعالیتی ثبت نشده است.
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>تنظیمات</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-2">
              <Button variant="outline">ویرایش</Button>
              <Button variant="destructive">حذف</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
