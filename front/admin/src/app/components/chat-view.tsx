import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { ArrowRight, Bot, Download } from "lucide-react";

export type ChatMessage = {
  id: string;
  sender: "agent" | "user";
  senderName: string;
  text: string;
  time: string;
};

export type ChatRecord = {
  id: string;
  participant: string;
  participantType: "صاحب بیزینس" | "مشتری";
  agentName: string;
  lastMessage: string;
  messageCount: number;
  startedAt: string;
};

const mockMessages: ChatMessage[] = [
  { id: "1", sender: "user", senderName: "کاربر", text: "سلام، می‌خوام موجودی انبار رو بررسی کنم", time: "10:12" },
  { id: "2", sender: "agent", senderName: "ایجنت", text: "سلام! حتما، کدام محصول مدنظر شماست؟", time: "10:12" },
  { id: "3", sender: "user", senderName: "کاربر", text: "محصول کد A-203", time: "10:13" },
  { id: "4", sender: "agent", senderName: "ایجنت", text: "موجودی فعلی این محصول 45 عدد است. آخرین ورودی 1405/02/10 ثبت شده.", time: "10:13" },
  { id: "5", sender: "user", senderName: "کاربر", text: "ممنون. گزارش ماهانه‌ام رو هم می‌فرستی؟", time: "10:14" },
  { id: "6", sender: "agent", senderName: "ایجنت", text: "بله، در حال آماده‌سازی گزارش ماه گذشته هستم...", time: "10:14" },
];

function exportChatCsv(chat: ChatRecord, messages: ChatMessage[]) {
  const escape = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
  const headers = ["شناسه", "زمان", "نقش", "فرستنده", "متن"];
  const lines = [headers.map(escape).join(",")];
  for (const m of messages) {
    lines.push(
      [m.id, m.time, m.sender, m.senderName, m.text].map(escape).join(","),
    );
  }
  const bom = "﻿";
  const blob = new Blob([bom + lines.join("\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `chat-${chat.id}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function ChatView({
  chat,
  onBack,
}: {
  chat: ChatRecord;
  onBack: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowRight className="h-4 w-4" />
          </Button>
          <div>
            <h1>چت — {chat.participant}</h1>
            <p className="text-sm text-muted-foreground">
              ایجنت: {chat.agentName} · شروع: {chat.startedAt}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => exportChatCsv(chat, mockMessages)}
          >
            <Download className="h-4 w-4 ml-1" />
            خروجی CSV
          </Button>
          <Badge variant="secondary">{chat.participantType}</Badge>
        </div>
      </div>

      <Card className="flex-1">
        <CardHeader>
          <CardTitle>پیام‌ها</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {mockMessages.map((m) => {
            const isAgent = m.sender === "agent";
            return (
              <div
                key={m.id}
                className={`flex gap-2 ${isAgent ? "flex-row-reverse" : ""}`}
              >
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback>
                    {isAgent ? <Bot className="h-4 w-4" /> : chat.participant.slice(0, 1)}
                  </AvatarFallback>
                </Avatar>
                <div
                  className={`max-w-[70%] rounded-md px-3 py-2 text-sm ${
                    isAgent
                      ? "bg-muted"
                      : "bg-primary text-primary-foreground"
                  }`}
                >
                  <div className="text-xs opacity-70 mb-1">
                    {m.senderName} · {m.time}
                  </div>
                  <div>{m.text}</div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
