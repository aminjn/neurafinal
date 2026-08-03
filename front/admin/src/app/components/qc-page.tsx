import { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { DataGrid, type GridColumn } from "./data-grid";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Star, ThumbsUp, ThumbsDown, Clock } from "lucide-react";

const feedbackColumns: GridColumn[] = [
  { field: "id", headerName: "شناسه", filterType: "text", width: 110 },
  { field: "ticketId", headerName: "شماره تیکت", filterType: "text" },
  { field: "user", headerName: "مشتری", filterType: "text" },
  { field: "supportAgent", headerName: "پشتیبان", filterType: "set" },
  { field: "rating", headerName: "امتیاز (از ۵)", filterType: "number" },
  { field: "sentiment", headerName: "احساس", filterType: "set" },
  { field: "responseTime", headerName: "زمان پاسخ (دقیقه)", filterType: "number" },
  { field: "resolved", headerName: "حل شده", filterType: "set" },
  { field: "comment", headerName: "نظر مشتری", filterType: "text", flex: 2 },
  { field: "submittedAt", headerName: "تاریخ ثبت", filterType: "date" },
];

const DEFAULT_FEEDBACK = [
  { id: "QC-1001", ticketId: "#1024", user: "سارا احمدی", supportAgent: "مریم رضایی", rating: 5, sentiment: "مثبت", responseTime: 18, resolved: "بله", comment: "خیلی سریع پاسخ دادند و مشکلم حل شد.", submittedAt: "2026-04-21" },
  { id: "QC-1002", ticketId: "#1025", user: "محمد کریمی", supportAgent: "علی حسینی", rating: 4, sentiment: "مثبت", responseTime: 42, resolved: "بله", comment: "خوب بود اما کمی طول کشید.", submittedAt: "2026-04-23" },
  { id: "QC-1003", ticketId: "#1026", user: "نگار موسوی", supportAgent: "مریم رضایی", rating: 2, sentiment: "منفی", responseTime: 320, resolved: "خیر", comment: "مشکل اصلی هنوز برطرف نشده است.", submittedAt: "2026-05-02" },
  { id: "QC-1004", ticketId: "#1027", user: "رضا نجفی", supportAgent: "سپیده طاهری", rating: 3, sentiment: "خنثی", responseTime: 95, resolved: "بله", comment: "پاسخ متوسطی دریافت کردم.", submittedAt: "2026-05-04" },
  { id: "QC-1005", ticketId: "#1028", user: "زهرا قاسمی", supportAgent: "علی حسینی", rating: 5, sentiment: "مثبت", responseTime: 12, resolved: "بله", comment: "عالی! تیم پشتیبانی واقعاً حرفه‌ای هستند.", submittedAt: "2026-05-06" },
  { id: "QC-1006", ticketId: "#1029", user: "حسین رحیمی", supportAgent: "سپیده طاهری", rating: 1, sentiment: "منفی", responseTime: 480, resolved: "خیر", comment: "بسیار ناراضی هستم، چندین بار پیگیری کردم.", submittedAt: "2026-05-07" },
  { id: "QC-1007", ticketId: "#1030", user: "علی محمدی", supportAgent: "مریم رضایی", rating: 4, sentiment: "مثبت", responseTime: 35, resolved: "بله", comment: "ممنون از پیگیری شما.", submittedAt: "2026-05-08" },
  { id: "QC-1008", ticketId: "#1031", user: "مریم حسنی", supportAgent: "علی حسینی", rating: 5, sentiment: "مثبت", responseTime: 22, resolved: "بله", comment: "بسیار راضی هستم، تشکر.", submittedAt: "2026-05-09" },
];

const RATING_LABELS = ["۱ ستاره", "۲ ستاره", "۳ ستاره", "۴ ستاره", "۵ ستاره"];
const RATING_COLORS = ["#ef4444", "#f59e0b", "#eab308", "#84cc16", "#10b981"];

function computeQc(rows: any[]) {
  const n = rows.length || 1;
  const avgRating = rows.reduce((s, r) => s + (r.rating || 0), 0) / n;
  const avgResponse = rows.reduce((s, r) => s + (r.responseTime || 0), 0) / n;
  const positive = rows.filter((r) => r.sentiment === "مثبت").length;
  const neutral = rows.filter((r) => r.sentiment === "خنثی").length;
  const negative = rows.filter((r) => r.sentiment === "منفی").length;
  const positivePct = (positive / n) * 100;
  const negativePct = (negative / n) * 100;
  const resolvedPct = (rows.filter((r) => r.resolved === "بله").length / n) * 100;

  const ratingDist = RATING_LABELS.map((rating, i) => ({
    rating,
    count: rows.filter((r) => r.rating === i + 1).length,
    color: RATING_COLORS[i],
  }));
  const sentimentDist = [
    { name: "مثبت", value: positive, color: "#10b981" },
    { name: "خنثی", value: neutral, color: "#f59e0b" },
    { name: "منفی", value: negative, color: "#ef4444" },
  ];
  const stats = [
    { label: "میانگین امتیاز", value: avgRating.toFixed(1), sub: "از ۵", icon: Star, color: "text-amber-500" },
    { label: "رضایت مثبت", value: `${positivePct.toFixed(0)}٪`, sub: "از کل بازخوردها", icon: ThumbsUp, color: "text-green-500" },
    { label: "بازخورد منفی", value: `${negativePct.toFixed(0)}٪`, sub: "نیازمند پیگیری", icon: ThumbsDown, color: "text-red-500" },
    { label: "میانگین زمان پاسخ", value: `${Math.round(avgResponse)}`, sub: "دقیقه", icon: Clock, color: "text-blue-500" },
  ];
  return { stats, ratingDist, sentimentDist, resolvedPct };
}

export function QcPage() {
  const [feedbackRows, setFeedbackRows] = useState<any[]>(DEFAULT_FEEDBACK);

  useEffect(() => {
    (async () => {
      try { setFeedbackRows(await api.list<any>("qc")); } // خالی هم خالی
      catch { /* keep default offline */ }
    })();
  }, []);

  const { stats, ratingDist, sentimentDist, resolvedPct } = useMemo(
    () => computeQc(feedbackRows),
    [feedbackRows],
  );

  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>مدیریت QC</h1>
          <p className="text-sm text-muted-foreground">
            مشاهده بازخورد مشتریان از روند تیکتینگ و کیفیت پشتیبانی
          </p>
        </div>
        <Badge variant="secondary">{`نرخ حل: ${resolvedPct.toFixed(0)}٪`}</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">{s.label}</span>
                <span className="text-2xl">{s.value}</span>
                <span className="text-xs text-muted-foreground">{s.sub}</span>
              </div>
              <s.icon className={`h-8 w-8 ${s.color}`} />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>توزیع امتیاز مشتریان</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={ratingDist}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="rating" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {ratingDist.map((e) => (
                    <Cell key={e.rating} fill={e.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>تحلیل احساس بازخوردها</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={sentimentDist}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={2}
                  label={(e) => `${e.name}: ${e.value}`}
                >
                  {sentimentDist.map((e) => (
                    <Cell key={e.name} fill={e.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>بازخوردهای ثبت‌شده</CardTitle>
        </CardHeader>
        <CardContent>
          <DataGrid rowData={feedbackRows} columnDefs={feedbackColumns} />
        </CardContent>
      </Card>
    </div>
  );
}
