import { useState, useRef, useEffect } from "react";
import { api } from "../api";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Avatar, AvatarFallback } from "./ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { ArrowRight, Send, Headphones, User } from "lucide-react";
import { toast } from "sonner";

type Message = {
  id: string;
  from: "user" | "support";
  text: string;
  at: string;
};

const STATUSES = ["باز", "در حال بررسی", "در انتظار پاسخ", "بسته شده"] as const;

function statusVariant(s: string) {
  if (s === "بسته شده") return "secondary";
  if (s === "باز") return "destructive";
  return "default";
}

export function TicketChatView({
  ticket,
  onBack,
}: {
  ticket: any;
  onBack: () => void;
}) {
  const [status, setStatus] = useState<string>(ticket.status ?? "باز");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "m1",
      from: "user",
      text: `سلام، ${ticket.subject}. لطفاً بررسی کنید.`,
      at: "2026-05-08 10:12",
    },
    {
      id: "m2",
      from: "support",
      text: "سلام، تیکت شما دریافت شد. در حال بررسی هستیم.",
      at: "2026-05-08 10:25",
    },
    {
      id: "m3",
      from: "user",
      text: "ممنون، منتظر پاسخ هستم.",
      at: "2026-05-08 11:02",
    },
  ]);
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    setMessages((m) => [
      ...m,
      {
        id: `m${m.length + 1}`,
        from: "support",
        text,
        at: new Date().toLocaleString("fa-IR"),
      },
    ]);
    setDraft("");
  };

  const changeStatus = (s: string) => {
    setStatus(s);
    ticket.status = s;
    if (ticket.id) api.update("tickets", String(ticket.id), { status: s }).catch(() => {});
    toast.success(`وضعیت تیکت به «${s}» تغییر کرد`);
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-6 overflow-hidden">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowRight className="h-4 w-4" />
          </Button>
          <div>
            <h1>
              تیکت {ticket.id} — {ticket.subject}
            </h1>
            <p className="text-sm text-muted-foreground">
              کاربر: {ticket.user} · اولویت: {ticket.priority} ·{" "}
              {ticket.createdAt}
            </p>
          </div>
        </div>
        <Badge variant={statusVariant(status) as any}>{status}</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 flex-1 min-h-0">
        <Card className="flex flex-col min-h-0">
          <CardHeader>
            <CardTitle>گفت‌وگو با کاربر</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col flex-1 min-h-0 gap-3">
            <div
              ref={scrollRef}
              className="flex-1 overflow-auto flex flex-col gap-3 pr-1"
            >
              {messages.map((m) => {
                const mine = m.from === "support";
                return (
                  <div
                    key={m.id}
                    className={`flex gap-2 ${
                      mine ? "flex-row-reverse" : ""
                    }`}
                  >
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarFallback>
                        {mine ? (
                          <Headphones className="h-4 w-4" />
                        ) : (
                          <User className="h-4 w-4" />
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                        mine
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <div>{m.text}</div>
                      <div
                        className={`text-xs mt-1 ${
                          mine
                            ? "text-primary-foreground/70"
                            : "text-muted-foreground"
                        }`}
                      >
                        {m.at}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center gap-2 border-t pt-3">
              <Input
                placeholder="پاسخ خود را بنویسید..."
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                disabled={status === "بسته شده"}
              />
              <Button
                onClick={send}
                disabled={!draft.trim() || status === "بسته شده"}
              >
                <Send className="h-4 w-4 ml-1" />
                ارسال
              </Button>
            </div>
            {status === "بسته شده" && (
              <p className="text-xs text-muted-foreground">
                این تیکت بسته شده است. برای ارسال پاسخ ابتدا وضعیت را تغییر دهید.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>مدیریت تیکت</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="grid gap-1.5">
              <Label className="text-xs text-muted-foreground">وضعیت</Label>
              <Select value={status} onValueChange={changeStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-1.5">
              <Label className="text-xs text-muted-foreground">
                تغییر سریع
              </Label>
              <div className="flex flex-col gap-2">
                {STATUSES.filter((s) => s !== status).map((s) => (
                  <Button
                    key={s}
                    size="sm"
                    variant="outline"
                    onClick={() => changeStatus(s)}
                  >
                    {s}
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid gap-1.5 pt-2 border-t">
              <Label className="text-xs text-muted-foreground">کاربر</Label>
              <span className="text-sm">{ticket.user}</span>
              <Label className="text-xs text-muted-foreground mt-2">
                اولویت
              </Label>
              <span className="text-sm">{ticket.priority}</span>
              <Label className="text-xs text-muted-foreground mt-2">
                تاریخ ایجاد
              </Label>
              <span className="text-sm">{ticket.createdAt}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
