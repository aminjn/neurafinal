import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { PromptListEditor, type PromptItem } from "./prompt-list-editor";
import { api } from "../api";

export function GlobalPromptsPage() {
  const [items, setItems] = useState<PromptItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const list = await api.list<any>("config");
        const gp = list.find((x) => x.id === "global_prompts");
        setItems(gp?.items || []);
      } catch { /* ignore */ }
      setReady(true);
    })();
  }, []);

  const save = async (next: PromptItem[]) => {
    setItems(next);
    try {
      await api.create("config", { id: "global_prompts", items: next });
      toast.success("پرامپت‌های گلوبال ذخیره شد");
    } catch {
      toast.error("خطا در ذخیره");
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>کانفیگ اپلیکیشن — پرامپت‌های سراسری</h1>
          <p className="text-sm text-muted-foreground">
            این پرامپت‌ها مختص ایجنت خاصی نیستند و توسط همه ایجنت‌های سامانه
            رعایت می‌شوند.
          </p>
        </div>
        <Badge variant="secondary">Global</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>لیست پرامپت‌های گلوبال</CardTitle>
        </CardHeader>
        <CardContent>
          {ready && (
            <PromptListEditor value={items} onChange={setItems} onSave={save} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
