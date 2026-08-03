import { useState } from "react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { ArrowDown, ArrowUp, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";

export type PromptRole =
  | "system"
  | "admin"
  | "developer"
  | "business"
  | "user"
  | "model";

export type PromptItem = {
  id: string;
  role: PromptRole;
  content: string;
};

const allRoleOptions: { value: PromptRole; label: string }[] = [
  { value: "system", label: "سیستم" },
  { value: "admin", label: "ادمین" },
  { value: "developer", label: "دولوپر" },
  { value: "business", label: "بیزینس" },
  { value: "user", label: "یوزر" },
  { value: "model", label: "مدل" },
];

const newId = () =>
  `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

export function PromptListEditor({
  value,
  onChange,
  onSave,
  allowedRoles,
}: {
  value?: PromptItem[];
  onChange?: (items: PromptItem[]) => void;
  onSave?: (items: PromptItem[]) => void;
  allowedRoles?: PromptRole[];
}) {
  const roleOptions = allowedRoles
    ? allRoleOptions.filter((r) => allowedRoles.includes(r.value))
    : allRoleOptions;
  const defaultRole = roleOptions[0]?.value ?? "system";
  const [internal, setInternal] = useState<PromptItem[]>(
    value ?? [{ id: newId(), role: defaultRole, content: "" }],
  );
  const items = value ?? internal;

  const update = (next: PromptItem[]) => {
    if (!value) setInternal(next);
    onChange?.(next);
  };

  const add = () =>
    update([...items, { id: newId(), role: defaultRole, content: "" }]);

  const remove = (id: string) => update(items.filter((p) => p.id !== id));

  const move = (id: string, dir: -1 | 1) => {
    const idx = items.findIndex((p) => p.id === id);
    const target = idx + dir;
    if (idx < 0 || target < 0 || target >= items.length) return;
    const next = [...items];
    [next[idx], next[target]] = [next[target], next[idx]];
    update(next);
  };

  const change = (id: string, patch: Partial<PromptItem>) =>
    update(items.map((p) => (p.id === id ? { ...p, ...patch } : p)));

  return (
    <div className="flex flex-col gap-3">
      {items.map((item, i) => (
        <div
          key={item.id}
          className="rounded-md border bg-card p-3 flex flex-col gap-3"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-6 min-w-6 items-center justify-center rounded bg-muted px-1.5 text-xs">
                {i + 1}
              </span>
              <div className="grid gap-1">
                <Label className="text-xs text-muted-foreground">نقش</Label>
                <Select
                  value={item.role}
                  onValueChange={(v) =>
                    change(item.id, { role: v as PromptRole })
                  }
                >
                  <SelectTrigger className="h-8 w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roleOptions.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                size="icon"
                variant="ghost"
                disabled={i === 0}
                onClick={() => move(item.id, -1)}
                title="انتقال به بالا"
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                disabled={i === items.length - 1}
                onClick={() => move(item.id, 1)}
                title="انتقال به پایین"
              >
                <ArrowDown className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => remove(item.id)}
                title="حذف"
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
          <div className="grid gap-1">
            <Label className="text-xs text-muted-foreground">پرامپت</Label>
            <Textarea
              rows={4}
              value={item.content}
              onChange={(e) => change(item.id, { content: e.target.value })}
              placeholder="متن پرامپت..."
            />
          </div>
        </div>
      ))}

      {items.length === 0 && (
        <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
          هیچ پرامپتی اضافه نشده است.
        </div>
      )}

      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={add}>
          <Plus className="h-4 w-4 ml-1" />
          افزودن پرامپت
        </Button>
        <Button
          onClick={() => {
            if (onSave) onSave(items);
            else { onChange?.(items); toast.success("پرامپت‌ها ذخیره شد"); }
          }}
        >
          <Save className="h-4 w-4 ml-1" />
          ذخیره
        </Button>
      </div>
    </div>
  );
}
