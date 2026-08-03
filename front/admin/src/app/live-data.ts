import { useEffect, useState } from "react";
import { api } from "./api";

// نگاشت کلیدهای منو به منابع واقعی بک‌اند (/api).
// ستون‌های گرید همان تعاریف دیزاین می‌مانند؛ فقط ردیف‌ها از دیتابیس می‌آیند.

type Mapper = (row: any) => any;
interface LiveSource {
  fetch: () => Promise<any[]>;
  map: Mapper;
}

const faRole: Record<string, string> = { user: "کاربر", admin: "ادمین", superadmin: "سوپر‌ادمین" };
const faStatus: Record<string, string> = { active: "فعال", inactive: "غیرفعال", pending: "در انتظار", lead: "سرنخ" };
const faCompany: Record<string, string> = {
  alpha: "شرکت آلفا تجارت", beta: "گروه صنعتی بتا", gamma: "فناوری گاما", delta: "بازرگانی دلتا",
};

export const LIVE_SOURCES: Record<string, LiveSource> = {
  "data.users": {
    fetch: async () => (await api.listUsers({ limit: 100 })).items,
    map: (u: any) => ({
      id: u.id,
      username: u.username,
      name: u.name || u.username,
      email: u.email || "—",
      role: faRole[u.role] || u.role,
      status: faStatus[u.status] || u.status || "فعال",
      createdAt: String(u.created_at || "").slice(0, 10),
      credit: 0,
    }),
  },
  "data.agents": {
    fetch: () => api.list("agents"),
    map: (a: any) => ({
      ...a,
      name: a.name,
      definition: a.role,
      createdAt: "",
      remainingTokens: 0,
      business: faCompany[a.company] || a.company || "",
    }),
  },
  "data.customers": {
    fetch: () => api.list("customers"),
    map: (c: any) => ({
      ...c,
      name: c.name,
      contact: [c.phone, c.email].filter(Boolean).join(" · "),
      businesses: [],
      createdAt: "",
      lastInteraction: c.lastContact || "",
    }),
  },
  // این مجموعه‌ها مستقیماً از دیتابیس می‌آیند (ستون‌ها با داده هم‌شکل‌اند)
  "data.transactions": { fetch: () => api.list("transactions"), map: (x: any) => x },
  "data.invoices": { fetch: () => api.list("invoices"), map: (x: any) => x },
  "data.wallets": { fetch: () => api.walletsAll(), map: (x: any) => x },
  "support.tickets": { fetch: () => api.list("tickets"), map: (x: any) => x },
};

export function useLiveRows(active: string) {
  const src = LIVE_SOURCES[active];
  const [rows, setRows] = useState<any[] | null>(null);
  const [loading, setLoading] = useState<boolean>(!!src);

  useEffect(() => {
    let alive = true;
    if (!src) { setRows(null); setLoading(false); return; }
    setRows(null); setLoading(true);
    src
      .fetch()
      .then((data) => { if (alive) { setRows(data.map(src.map)); setLoading(false); } })
      .catch(() => { if (alive) { setRows(null); setLoading(false); } }); // fallback to mock
    return () => { alive = false; };
  }, [active]);

  return { rows, loading, hasSource: !!src };
}
