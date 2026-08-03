// تبدیلِ تاریخِ میلادی↔شمسی (الگوریتمِ jalaali-js، فشرده) — برای ورودی‌های تاریخ.
function div(a: number, b: number) { return Math.trunc(a / b); }
function g2d(gy: number, gm: number, gd: number) {
  let d = div((gy + div(gm - 8, 6) + 100100) * 1461, 4) + div(153 * ((gm + 9) % 12) + 2, 5) + gd - 34840408;
  d = d - div(div(gy + 100100 + div(gm - 8, 6), 100) * 3, 4) + 752;
  return d;
}
function jalCal(jy: number) {
  const breaks = [-61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178];
  const gy = jy + 621;
  let leapJ = -14, jp = breaks[0], jump = 0;
  for (let i = 1; i < breaks.length; i++) {
    const jm = breaks[i]; jump = jm - jp;
    if (jy < jm) break;
    leapJ += div(jump, 33) * 8 + div(jump % 33, 4);
    jp = jm;
  }
  let n = jy - jp;
  leapJ += div(n, 33) * 8 + div((n % 33) + 3, 4);
  if ((jump % 33) === 4 && (jump - n) === 4) leapJ += 1;
  const leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150;
  const march = 20 + leapJ - leapG;
  return { gy, march };
}
function j2d(jy: number, jm: number, jd: number) {
  const r = jalCal(jy);
  return g2d(r.gy, 3, r.march) + (jm - 1) * 31 - div(jm, 7) * (jm - 7) + jd - 1;
}
function d2g(jdn: number) {
  let j = 4 * jdn + 139361631;
  j = j + div(div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908;
  const i = div(j % 1461, 4) * 5 + 308;
  const gd = div(i % 153, 5) + 1;
  const gm = (div(i, 153) % 12) + 1;
  const gy = div(j, 1461) - 100100 + div(8 - gm, 6);
  return { gy, gm, gd };
}

// "YYYY/MM/DD"ِ شمسی (با ارقامِ لاتین) → ISO میلادی (yyyy-mm-dd) یا "" اگر نامعتبر
export function shamsiToISO(str: string): string {
  const s = String(str || "").replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))).trim();
  const m = s.match(/^(\d{3,4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
  if (!m) return "";
  const jy = +m[1], jm = +m[2], jd = +m[3];
  if (jm < 1 || jm > 12 || jd < 1 || jd > 31) return "";
  const g = d2g(j2d(jy, jm, jd));
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${g.gy}-${pad(g.gm)}-${pad(g.gd)}`;
}

// ISO میلادی → "YYYY/MM/DD"ِ شمسی با ارقامِ لاتین (برای فیلدِ ورودی)
export function isoToShamsi(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  try {
    const f = new Intl.DateTimeFormat("en-US-u-ca-persian-nu-latn", { year: "numeric", month: "2-digit", day: "2-digit" });
    const parts = f.formatToParts(d);
    const y = parts.find((p) => p.type === "year")?.value || "";
    const mo = parts.find((p) => p.type === "month")?.value || "";
    const da = parts.find((p) => p.type === "day")?.value || "";
    return `${y}/${mo}/${da}`;
  } catch { return ""; }
}

// نمایشِ خوانا (شمسی، با ارقامِ فارسی)
export function shamsiDisplay(value: any): string {
  if (value === null || value === undefined || value === "") return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return String(value);
  try { return d.toLocaleDateString("fa-IR"); } catch { return String(value); }
}
