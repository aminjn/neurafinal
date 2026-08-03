import React, { useState, useEffect, useRef } from 'react';

function __grpFa(v: any): string {
  const n = String(v == null ? '' : v).replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/[^0-9]/g, '');
  return n ? Number(n).toLocaleString('en-US').replace(/[0-9]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[+d]) : '';
}

function __dlCsv(filename: string, rows: any[]): boolean {
  try {
    if (!rows || !rows.length) return false;
    const headers = Object.keys(rows[0]);
    const esc = (v: any) => '"' + String(v == null ? '' : (typeof v === 'object' ? JSON.stringify(v) : v)).replace(/"/g, '""') + '"';
    const csv = [headers.join(','), ...rows.map((r: any) => headers.map((h) => esc(r[h])).join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; document.body.appendChild(a); a.click();
    document.body.removeChild(a); setTimeout(() => URL.revokeObjectURL(url), 1000);
    return true;
  } catch (_) { return false; }
}
function __pickFile(accept: string, cb: (name: string) => void) {
  try { const i = document.createElement('input'); i.type = 'file'; if (accept) i.accept = accept; i.onchange = () => { const f = (i.files && i.files[0]); if (f) cb(f.name); }; i.click(); } catch (_) {}
}
function __speak(text: string) {
  try { const u = new SpeechSynthesisUtterance(text); u.lang = 'fa-IR'; window.speechSynthesis.cancel(); window.speechSynthesis.speak(u); } catch (_) {}
}
function __recMic(onOk: () => void, onErr: () => void) {
  try { (navigator as any).mediaDevices.getUserMedia({ audio: true }).then((st: any) => { onOk(); try { st.getTracks().forEach((t: any) => setTimeout(() => t.stop(), 4000)); } catch (_) {} }).catch(() => onErr()); } catch (_) { onErr(); }
}
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from './app-context';
import { TimePicker } from './time-picker';
import { api } from '../services/api';
// persistِ per-user برای دادهٔ منشی (انبارِ /api/me/data) — per-account و cross-device
function __usePersist(coll: string, value: any, setValue: (v: any) => void) {
  const __l = React.useRef(false);
  React.useEffect(() => { (async () => { try { const v: any = await (api as any).myList(coll); if (Array.isArray(v)) setValue(v); } catch (_) {} __l.current = true; })(); }, []);
  React.useEffect(() => { if (!__l.current) return; const h = setTimeout(() => { (api as any).myBulkSave(coll, value).catch(() => {}); }, 700); return () => clearTimeout(h); }, [value]);
}
import { toFa } from './data';
import { LetterAvatar } from './letter-avatar';
import { FormGroup, FormInput, FormSelect } from './admin-panel';
import Layer from '../../imports/Layer4-1/index';
const WALLET_MASK = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAAB4CAYAAAA6//q/AAAQAElEQVR4AexcC5gU1ZU+51ZV93TPi+GhIgygICgqKiADfmiW7K7u7ve5fvH7dLP5stm4JrMxu8lukiUq+GhfENT4ihpEJfhcg8ZHjPgkvqIIETDGPHyA+KmoGd7MMEBX3ZNzbnXPMEOPdPVMz/T03P7qcKvOPefWvef/77m3qplW0M1PKkVq6VJyRJ54LH3K048Hs598LLhw2cPB3CceCS761UPBJY8/mE798sH05Y/+PH3Vow+k5z/yQHrBw/elr2H58SP3pq9/6O70jb+427/pwSX+zUuX+Lc+sNi/7YE7/Nv//w7/Tpaf3bfIv+ve2/y77/mpf+89Pw3uv/uW4IG7btFLl/xEP8Ty8OIb9aOLr9e/vOM6/SuWZbdfq59adI1+muXZhVfr5Qt/pJ9fON9/8dar/JdvudJ/5ZYr/BU3X+avvOkyf9VNKf/1G1PBmhsvCd644aLgd9dfFPz+urnBH6+bE/zp2guCt1neveb84L2rZwfrF/wg+PZtjeRlhYiwm+Hrc/eCCCBgL1tG8eefp4oZU4Ozayv1d2uS+n+VUg1EUFCbfR6JPDqACD/cVq3XbavR67dW6w0LZsM/zb+A6paeRU4e7iVpEgksYbyAPmRI+riEA1/We/Q3EPHgkhxZL3RKB/oO2q3/vG6E/4Urv0/1Z/VDIuRNgKVLP0wsXw4HQeD/jQJnGoGu7IUY94tbaFI/B1+vPfZgf/oV/02H9YtOZzqZFwEef5ySw+oOmRLD4HQEHJXxtUWnCChUjwME91/5HZrWqapkLz+XAG+9RbGXXqJhyaR/vAIcX7KjKKmO4ZG8NDxz+XnpL5RUt7rojOpCD6++Sokdm2GCA3CKsuB3Fabcek6ThOrBy76VPi23QeloVa6uyMxPp/eO0xBM8v3ArvW5gnRgXYJJsPiS//TPOLBp71tk75iTAE1NO2s8zxmrNWDW0JbRI8DBq1WIN11ynn9WdO/e8diPAJL6HaficJ2GZO90oezvMgwBF6Qa/a+U4kg7EODddylOBMcAqMNLsbP9tk8EwzmX/kcp9r8DAVpbIYkYjCnFjvb3PhHgWM4CjaU2jjYCyMZv13b/6FLrYLn0BwGGE6jZF3/T/3opjckQgF/xqubNe0aDwgH7Wrc3QCGgegT8Ym/cK997GAKsXg0OOe64fJ2sXcERUEBwwtxv+l8quIUedjQEWL8eUCmo6OG2bXM5IkAIY5FwVo6qXlF1volK8ff5o0f7MztX2OsiRYAgxrOuZB6xuS8ARFhdpOHaZnNEQAOcOfcbwZwcVb2uMgTo9bsO8BsiQK2D/NV6CcRBnXba7lEl0I8B1wUifjVUAqNWjuMd251+IAIf7aJcanBcmuF6NMNx6CQuWXCG5+GMWAynuyx8Pt2t4HMPG5wYNrCuwfGgwY1DgxeDabE4TvMq8EQvbmRqvAKnxOM0JZ5gqdCT4xX6BCMJfTyXxyUSelK8Uk9KVOpjK5L6GJE4lyxHJ5J6YkWlPqqiEo5MVOGERDWOZzkiUYPjktVGxiar4bBkDYxJ1sKYyhoYzVLP5yOrBsGIylo4tKoWhlfVwSGVg+BgloO4fhjrh3L94OpBUFddB7VGBkN1TSiVNUMgyZJgidcOhnj1EIjVDgG3digo1qmaofBv184J/nztBcE7LOb/HV57frDu6h8G7y+YHWxY8H/BBz/6QfAhy0fzvx98PP97wcZ53wvWZf8/Yuqst2KpFLndwU58lfxTiBCAowk8x4VjlGLABXSXpnNbDos9ihOBys1J/dGmhP7YG37Ux86W4MnUudsHp75NVYXergACoMvPsnF+bBzPM/xEfrlRXejNB7Ifp03k8RcQf/bKHAh4gpuoes9VtOTS79Ko1Lk0OFOVd5F/BxA9TZgk1Icj0hR+dqjL+y7WcL8IkIYq0NAjk4cn4d+6Wr+pKvSPL/+vPUfP+w4N63zDrq7zIgCzNYZKj+K1/ThUOKSrxqw+QgQIHM6k3V7DO93xTCB3RdoPLp3T2DK8U13OywMSQMDnNX4kb/MOytmCVZZgBPDrMafiwksbeVngF32f10HVZSVv5ZQDFTzjRyCiBb/LQJVsxbnK1RfBp+mpqcaNya562SUB+Dm1gtf5el7v7TeEXUWv1PUEXwVwrwQcPjHVRSZQucaACDHFXpz27XqfK0D9SUd0Cm/cz6ONMDJXt1VnpYDPs34kf0FgZ37n4PTXa5MJgrlzGmm/jWFnAnhEVI8Eds3vr2B30W8CPMclfUXqWzs7YNuZAC6v/Xk/Q3ZxL6suoQh06sq/A1UN3Ve3LwFcQKrft9Kel18EAqIrLvzajra9nSGA/AEIKoiDAvt2r/ww7zgiojMcL3lyKhV+kWQIwBs/pYH61Z81dxyVvYoSAUS8snXj1krxyRKAdWAUorRS9hE4KhHU8as+AIUIyK96J5b9kO0AO0RAK3qpsZE8kwG4JsFijwEUAX7cn3joVp78A2jMdqg5IqD4ub8mh96q+nkE8um+X6Mv5yWAJuRjbG3KMgLnMwHKcmB2UHlGwBIgz0CVq5klQLkim+e4LAHyDFS5mlkClCuyeY7LEiDPQJWrmSVAmSEbdTiWAFEjVmb2lgBlBmjU4VgCRI1YmdlbApQZoFGHYwkQNWJlZm8JUGaARh2OJUDUiJWZvSVAmQBa6DAsAQqNXIF+hNCaqKTHxk6ic8YeT7PHT6Z5444PFkyYCtdMOBGuO2oa3DCxAW46ZjrcfPRJcOukk/Rtk06G2487GRYfcxLcoxxoLvDWOd0sAXKGpeeVjod/OGIyfenIqfTVCZPh9hFH0If1R9DG4YfBXw4Zo5oOqqdNhx5GTcPHUNMho2nT0HractBI2DJslNoybARsHToSth48CjadeCosbfgHuOfIE2lZT/TSEqAnoniANpQL7x17UvA/DGzTwfW0uWYYtToOuEGAXhCAx+6uUuACmHNPa4gBoOg7CCJ4VYP0ntqhupUJ9NnEBnoWuvlR3fS37geIAAP94eS/0+fUDIY9bNoGaBAggwwe1xvwpQyYDCIAKGQwegZdzjN+OlOCJ/r68dB01Ax6EbrxsQToRvAO5IoKNs08I/hyMgnItgKaARARYwL4vrOegTeE4DpjI/YinA3kmkmg5Q93DSlEpxSa6/ojmATTaCXbFnRYAhQUtgM7MeLEYO4CQAHQSGBmPXpE7ekeADIpH9im3Vb07RLOfPaLiTD4bCv2ph2XN4aKbQs6CnYs6G4DyQlxd/04fanvG6AYMDTpnkPguS7wdQg8z+YYE4WzQwi+UmEdQLYMwRe7sM7YmdkvZBCJJyBI1sAO9ol8qMge1iHPCBCNGE8fSaonQt7wQXbDZ8DnRjKlAdScC8AMNJNBwBfgtTlHhJjUAWcTPuflACSLxADA42tv2EjYJU8UfB35UJE9rEOUCDDoyAJm9jOIrhAi6GKzJ+Bz40wGzSIkyArydbgxlHq2M+Bze6wPbQpdBiwBOKLFOHhmcrMowBvhC7PWp9NgwEMUUKENQAZVznl2h5u9jD3rUGY769ttkR8H2+vNPoBtDEFYHe2wBIgWr7ytiQCzaz07GfClDGdtR/BF31kEZJXZ6XOdmyEIAw0irlLgsk0bMfjcgQI+lgAFBC2CC89gaAMfedaLsL/R71+GqR8ReO03M9rYMZl4owjmnOsM+EII1hsdtyNEcLiMfFgCRA5ZJAcDkMxWgHDWC4AAbWByvYCuGXDN56EeMrYMsnnsg3Z7AXofQoX23KbH7xwsAThQJXVkN3taG/DbZm5ICAFcJASRO54hgLGVNG/2CqJngF0RnvGGEHyesQ19Rc92lgAchJI5GCQUoJHTvpTcsTbQtDbAmWf5TB2v8QK8iKnjjACGMJn6DoSQtlhvdCH4KJnBEoADU2IHegwUgxvu/DPAMxE6z3w0gDOYkt65HoyIvQgPytQjggBt6kQv14gGfKl32C7yoSJ7WIe8I8AgxUTYwYAGIMCLhAAjSommjsE3KZ8Jk702pfhyXds5+5jMISWAgC/tiYADBXwsAQoIWn4u/G0ACMAgs5MB1JINMufA1yIh+EISAZ5BlbSeqZP6UETP95Q62QNwG/JuIPTlOs4KyDpLAI5R6RxEJAww63g480MwuYcZgFHSvQBqXvMyCQTgTF1oy+Aa0rT7yBKAbTZ8D/ZHkzkIwh9+ZNtIh4pkbY3zjgA/loktg6wF2AwRwKRv5oYBkWe92d2zYbbe6PlaZrSRjsRoBx+RDPBimxG7BHAgSu1oA1SABBAARcIZDmBK2SQyUcJznvWGFEQgxGnzB+OrDSkAQvDZ1tSLLZ9bAkApffhV8J49Wn59NQNamPIZqOzM5bVbUroB3gDJ3TelAMrnJltIibzTRwxtOe2LTdZXbLyW7eB+9kEm57BDlENFMba2+UeAZ3zszRfU19iDAUMhQdtanwWT63gNDx8ReTkQG7ZtJwQi8rWIZAPNxAnP2Y/1ogPxcXftRNX0MRDrIx+WAJFDlr8DaYgDp24hAwAIaCa9yznPcgbU6MxGj21ypHwwdTzr2RbF3xNfFskApo7PPSDeAPIukM8jHyqyh3XIOwL81W/lqqfwKwI2ZlI4lwI0AxqCz40JsAbQzDlfo8xsLjVniHC9z9SJnaR948/teps/QVj7Au7m+oIOS4CCwpa/0949ULPm1/jPe3dDQma5CHubTMBkMCUDaQBlPYOOLJLe21O+2HFdFnjzzSD7MPgAq5+FVq4r+LAEKDh0+TvuaYFBb76MX2xthpq9rVApgIoIiBkxMxsRDSEANJMAjY7vIiVfhxlDCMTtOFs+BVq9HLv9V0KWABzh3jh2NUPd6ufw7/+wEidv3wR1LIOat0Il7+DjLdsxvmsHxlq2Q6x5m+YSeWePTvN2cFjntOxAxaVq2QEowP/mMdyxZjnu7Il+WwL0RBQjtMGgD37jRWxY+zxO4aVhDM/i2jW/hqrXn4Pk6ucg/ttnlbfqGVSrngbk/QOtfAr915bB3teWYStLyxsvdH/W79tdS4B9ozEAzy0BBiDo+w7ZEmDfaJTwebG6ZglQrMj2k3YtAfoJUMXqpiVAsSLbT9q1BOgnQBWrm5YAxYpsP2nXEqCfAFWsbloCFCuy/aRdS4ASB6rY3bMEKHaEu2ofIQAEv6vq3tJbAvRWpDvdBxU0g4Ie+UavU9ORLi0BIoWr54wp/C9cuudaLKwlS4DC4lY2XkKAJ8tmNHYgESNAz6gNG9yCf2Qw4t2seYlFwN3hnC4ZoMS6Vf7dQeAnAOj7JwCJtCEAovqLXFjppQjw7t9xYNPn3a3YdYj4x411QOrsszFA/GxRsW9o2w8jQGD+gqfvd/8aT1m0CNMmAwwZMlw6tCPsov23qBFA2IsILUW9xwEbx9bdMUNEfhXBxhs2gB8E8Aqf2qPIEeD1fw8ToE9fABHRQxWB+fn6kACzZqG/c6f7utb4dpHHP6CbJ4S0eQPYh1FAolcCrWanFuEuIcmzzAAAAnFJREFU6YZZAuTk1FNhl+s6z8i5lSJEgMFXCE08+7cVofX8m0RnXnw0bM06tBEAEamlRSrwt9lKW/ZcBDj171UKtvRciwW1dJdymtemUtj2JVQbAaQ5XgqaHcdZBgpfk2srPRQBnv2c+vsUfCbgz+KoLk4trO7wyN+BADLc6dORnwacFaiwLU2I3krBEfBRwSeIkFfqhyJ8GHzeeKr75i7CTzo3vx8BxCAehybQ6lUkkMdDUVkpLAKBcuAjXvv7DHzuNr96gFv3Bi05N/g5CTB1Ku5SMVihkZZpIJsJOIoFHBodkF/u2V6Ab0+5yA9HXA+OumHeHVWf5Wo0JwHEUJaCRMJ9CdG9k1PIy6Kzkn8EeMO3nmc+L6f5+/Sw5Z1E+kxAdUPqVvy0q7a7JIA4SCY4+WRcn9Y7n+B1zJJAgnIAQYRmTvtvo6I+fNlDS/YGu+enFnovpBZih01f5+5/LgGyxrNm1W1Dx3kEHOcqIFyb1duyYwR41r/D8j4g9dGrXlwOpE/3XOeyeYsq99vwdexteJUXAcR05kzcOXMmvE+oFhPR/TzIPv02S/pUKsKgv+O69Ltw1tPe3u4XEWwh0tfpNDYeucn9zZyfYFO+fcibANIg8suiWbOwGRz3uepB7hz0nEYiWid1A1CIv9J9V3m0hieDrPW9DzzQWr+1eZz21BTd4l7Nr3c3nf0gBlGwiESAbMNMAl/2B1w2b9nuXuxUOP+q4s6/KNe5Ewja3jJl7culVC5+4Hq4wvFopevRKp7xW3iD7CPyqLs5yDzdfUK4emirGpH+5E8jgsHOP6burN2SugG3pZag7PjzbKbd7K8AAAD//5bYI6cAAAAGSURBVAMAs/+IOjJrdQYAAAAASUVORK5CYII=";
const walletIconStyle = (size) => ({ width: size, height: Math.round(size*0.94), flexShrink: 0, background: 'var(--aw-primary)', WebkitMaskImage: 'url('+WALLET_MASK+')', maskImage: 'url('+WALLET_MASK+')', WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat', WebkitMaskSize: 'contain', maskSize: 'contain', WebkitMaskPosition: 'center', maskPosition: 'center' });
import { QuickForm } from './quick-actions';

// ========================
// SHARED STYLES
// ========================
const cardStyle: React.CSSProperties = {
  background: 'color-mix(in srgb, var(--aw-primary) 3%, transparent)',
  backdropFilter: 'blur(20px) saturate(1.4)',
  WebkitBackdropFilter: 'blur(20px) saturate(1.4)',
  borderRadius: 10,
  border: '1px solid color-mix(in srgb, var(--aw-primary) 14%, transparent)',
  boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.18), 0 2px 6px color-mix(in srgb, var(--aw-primary) 8%, transparent)',
};
const tabBarStyle: React.CSSProperties = {
  background: 'var(--aw-eu-nav-bg)',
  border: '1px solid var(--aw-eu-nav-border)',
  borderRadius: 9999,
  padding: 3,
  backdropFilter: 'blur(20px)',
};
const activeTabStyle: React.CSSProperties = {
  background: 'var(--aw-bg-card)',
  borderRadius: 9999,
  color: 'var(--aw-text-primary)',
  fontWeight: 700,
  boxShadow: 'inset 0 0 0 1px var(--aw-border), 0 2px 6px rgba(0,0,0,0.10)',
};
const inactiveTabStyle: React.CSSProperties = {
  background: 'transparent',
  borderRadius: 9999,
  color: 'var(--aw-text-secondary)',
};

function SecPick({ value, onChange, options, placeholder, inputCls }: { value: string; onChange: (v: string) => void; options: string[]; placeholder?: string; inputCls?: string }) {
  const [open, setOpen] = React.useState(false);
  const q = String(value || '').trim();
  const list = (q ? (options || []).filter((o: string) => o && o.includes(q)) : (options || [])).filter(Boolean).slice(0, 8);
  return (
    <div className="relative">
      <input className={inputCls} placeholder={placeholder || ''} value={value}
        onFocus={() => setOpen(true)}
        onChange={e => { onChange(e.target.value); setOpen(true); }}
        onBlur={() => setTimeout(() => setOpen(false), 200)} />
      {open && list.length > 0 && (
        <div className="mt-1 rounded-[10px] overflow-hidden" style={{ background: 'var(--aw-bg-card)', border: '1px solid var(--aw-border)', maxHeight: 176, overflowY: 'auto' }}>
          {list.map((o: string) => (
            <button key={o} type="button" onMouseDown={e => { e.preventDefault(); onChange(o); setOpen(false); }}
              className="w-full text-right px-3 py-2 border-none bg-transparent cursor-pointer text-[13px] text-[var(--aw-text-primary)] hover:bg-[var(--aw-bg-hover)]">{o}</button>
          ))}
        </div>
      )}
    </div>
  );
}

function TabBar({ tabs, active, onChange }: { tabs: { id: string; label: string; icon: string }[]; active: string; onChange: (id: string) => void }) {
  return (
    <div className="flex gap-1 p-1 mx-4 mt-3 mb-2 overflow-x-auto aw-noscroll" style={tabBarStyle}>
      {tabs.map(t => (
        <button
          key={t.id}
          className="flex-shrink-0 flex items-center justify-center gap-1.5 py-1.5 px-3 border-none cursor-pointer transition-all text-[11px]"
          style={active === t.id ? activeTabStyle : inactiveTabStyle}
          onClick={() => onChange(t.id)}
        >
          <i className={`${t.icon} text-[13px]`} />
          <span style={{ whiteSpace: 'nowrap' }}>{t.label}</span>
        </button>
      ))}
    </div>
  );
}

function SectionHeader({ title, icon, count }: { title: string; icon: string; count?: number }) {
  return (
    <div className="flex items-center gap-2 px-4 pt-3 pb-1">
      <i className={`${icon} text-[14px]`} style={{ color: 'var(--aw-primary)' }} />
      <span className="text-[14px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>{title}</span>
      {count !== undefined && (
        <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: 'var(--aw-primary-bg)', color: 'var(--aw-primary)' }}>{count}</span>
      )}
    </div>
  );
}

// ========================
// 1. PLANNING SCREEN (برنامه‌ریزی)
// ========================
const PLANNING_TABS = [
  { id: 'calendar', label: 'تقویم', icon: 'fa-solid fa-calendar' },
  { id: 'tasks', label: 'تسک‌ها', icon: 'fa-solid fa-list-check' },
  { id: 'todo', label: 'To-Do', icon: 'fa-solid fa-square-check' },
  { id: 'meetings', label: 'جلسات', icon: 'fa-solid fa-users' },
  { id: 'reminders', label: 'یادآوری‌ها', icon: 'fa-solid fa-bell' },
];

const MOCK_REMINDERS = [];

const REMINDER_TYPE_ICONS: Record<string, string> = {
  call: 'fa-solid fa-phone',
  report: 'fa-solid fa-file-lines',
  invoice: 'fa-solid fa-file-invoice',
  system: 'fa-solid fa-gear',
  meeting: 'fa-solid fa-users',
};

const MOCK_TASKS = [];

const MOCK_TODOS = [];

const MOCK_CALENDAR = [];

const JALALI_WEEKDAYS = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];
const JALALI_MONTHS = ['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'];
// تبدیلِ جلالی→میلادی (الگوریتمِ استانداردِ jalaali) برای محاسبهٔ دقیقِ روزِ هفته و تعدادِ روزِ ماه.
function __jalToGreg(jy: number, jm: number, jd: number): Date {
  let gy = jy <= 979 ? 621 : 1600; jy -= jy <= 979 ? 0 : 979;
  let days = 365 * jy + Math.floor(jy / 33) * 8 + Math.floor(((jy % 33) + 3) / 4) + 78 + jd + (jm < 7 ? (jm - 1) * 31 : (jm - 7) * 30 + 186);
  gy += 400 * Math.floor(days / 146097); days %= 146097;
  if (days > 36524) { gy += 100 * Math.floor(--days / 36524); days %= 36524; if (days >= 365) days++; }
  gy += 4 * Math.floor(days / 1461); days %= 1461;
  if (days > 365) { gy += Math.floor((days - 1) / 365); days = (days - 1) % 365; }
  let gd = days + 1;
  const sal = [0, 31, ((gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let gm = 1; for (; gm <= 12; gm++) { if (gd <= sal[gm]) break; gd -= sal[gm]; }
  return new Date(gy, gm - 1, gd);
}
function __jNow(): { y: number; m: number; d: number } {
  try {
    const p = new Intl.DateTimeFormat('en-US-u-ca-persian', { year: 'numeric', month: 'numeric', day: 'numeric' }).formatToParts(new Date());
    const g = (t: string) => { const f = p.find((x) => x.type === t); return f ? parseInt(f.value, 10) : 0; };
    return { y: g('year'), m: g('month') - 1, d: g('day') };
  } catch (e) { return { y: 1404, m: 11, d: 1 }; }
}
const __JNOW = __jNow();

const MOCK_MEETINGS = [];

const priorityColors: Record<string, string> = { high: '#EF4444', medium: '#F59E0B', low: '#10B981' };
const priorityLabels: Record<string, string> = { high: 'فوری', medium: 'متوسط', low: 'عادی' };
const statusLabels: Record<string, string> = { todo: 'انجام نشده', doing: 'در حال انجام', done: 'انجام شده', referred: 'ارجاع شده', stopped: 'متوقف شده', cancelled: 'لغو شده' };
const statusColors: Record<string, string> = { todo: '#94A3B8', doing: '#A78BFA', done: '#10B981', referred: '#22A6F0', stopped: '#F59E0B', cancelled: '#EF4444' };
const TASK_STATUS_TABS = [
  { id: 'all', label: 'همه', icon: 'fa-solid fa-layer-group' },
  { id: 'todo', label: 'انجام نشده', icon: 'fa-regular fa-circle' },
  { id: 'doing', label: 'در حال انجام', icon: 'fa-solid fa-spinner' },
  { id: 'done', label: 'انجام شده', icon: 'fa-solid fa-circle-check' },
  { id: 'referred', label: 'ارجاع شده', icon: 'fa-solid fa-share' },
  { id: 'stopped', label: 'متوقف شده', icon: 'fa-solid fa-circle-pause' },
  { id: 'cancelled', label: 'لغو شده', icon: 'fa-solid fa-circle-xmark' },
];

type TaskItem = { id: number; title: string; priority: string; status: string; assignee: string; due: string; team: string; desc?: string };
type CalEvent = { id: number; title: string; time: string; color: string; day: string; dayNum: number; attendees?: string[]; notify?: boolean };
type MeetingItem = { id: number; title: string; time: string; attendees: number; location: string; status: string };

const EVENT_COLORS = ['#10B981','#3B82F6','#8B5CF6','#F97316','#22A6F0','#F59E0B','#06B6D4','#EF4444'];
const TIME_SLOTS = (() => {
  const out: string[] = [];
  for (let h = 6; h <= 23; h++) for (const mm of ['00', '30']) out.push(`${String(h).padStart(2, '0')}:${mm}`);
  return out;
})();

function NewMeetingForm({ onCreate }: { onCreate: (m: any) => void }) {
  const { closeModal, showToast, agents, personnel } = useApp();
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [day, setDay] = useState('شنبه');
  const [slot, setSlot] = useState('');
  const [location, setLocation] = useState('سالن کنفرانس');
  const [picked, setPicked] = useState<string[]>([]);

  const WEEKDAYS = ['شنبه', 'یک‌شنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه'];
  const time = slot ? `${day} ${toFa(slot)}` : '';

  const agentPeople = (agents || []).filter((a: any) => !a.locked).map((a: any) => ({ key: 'a-' + a.id, name: a.name, sub: a.role, init: a.init, bg: a.bg }));
  const staffPeople = (personnel || []).map((p: any) => ({ key: 'p-' + p.id, name: p.name, sub: p.role, init: p.name[0], bg: 'bg-blue-500' }));
  const toggle = (k: string) => setPicked(s => s.includes(k) ? s.filter(x => x !== k) : [...s, k]);

  // Deterministic mock availability for the chosen day+slot
  const isAvailable = (key: string) => {
    if (!slot) return true;
    let h = 0; const str = key + day + slot;
    for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
    return h % 10 > 2; // ~70% available
  };
  const busyPicked = picked.filter(k => !isAvailable(k));

  const PersonRow = (p: any) => {
    const on = picked.includes(p.key);
    const avail = isAvailable(p.key);
    return (
      <button key={p.key} onClick={() => toggle(p.key)} className="flex items-center gap-2.5 p-2 rounded-[10px] border-none cursor-pointer text-right transition-colors w-full" style={{ background: on ? 'var(--aw-primary-bg)' : 'transparent' }}>
        <span className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-[12px] flex-shrink-0 ${p.bg} relative`} style={{ fontWeight: 700 }}>
          {p.init}
          {slot && <span className="absolute -bottom-0.5 -left-0.5 w-3 h-3 rounded-full border-2" style={{ background: avail ? '#10B981' : '#EF4444', borderColor: 'var(--aw-bg-input)' }} />}
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-[12.5px] truncate" style={{ fontWeight: 600, color: 'var(--aw-text-primary)' }}>{p.name}</span>
          <span className="block text-[10px] text-[var(--aw-text-muted)] truncate">{p.sub}</span>
        </span>
        {slot && (
          <span className="text-[9px] px-1.5 py-0.5 rounded-full flex-shrink-0" style={{ background: avail ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: avail ? '#10B981' : '#EF4444', fontWeight: 700 }}>
            {avail ? 'در دسترس' : 'مشغول'}
          </span>
        )}
        <span className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: on ? 'var(--aw-eu-primary)' : 'transparent', border: on ? 'none' : '1.5px solid var(--aw-border)' }}>
          {on && <i className="fa-solid fa-check text-white text-[10px]" />}
        </span>
      </button>
    );
  };

  const inputStyle: React.CSSProperties = { background: 'var(--aw-bg-input)', border: '1px solid var(--aw-border)', color: 'var(--aw-text-primary)', borderRadius: 12, padding: '11px 13px', fontSize: 13, width: '100%', outline: 'none', fontFamily: "'Kamand', 'Vazirmatn', sans-serif" };

  const submit = () => {
    if (!title.trim()) { showToast('عنوان جلسه را وارد کنید'); return; }
    onCreate({ id: Date.now(), title, desc, time: time || '—', attendees: picked.length || 1, location, status: 'pending' });
    closeModal();
    showToast(picked.length > 0 ? `جلسه ایجاد شد و دعوت‌نامه به ${toFa(picked.length)} نفر ارسال شد` : 'جلسه جدید ایجاد شد');
  };

  return (
    <div className="flex flex-col gap-3 p-1">
      <div className="flex flex-col gap-1.5">
        <label className="text-[12px]" style={{ color: 'var(--aw-text-secondary)', fontWeight: 600 }}>عنوان جلسه</label>
        <input style={inputStyle} value={title} onChange={e => setTitle(e.target.value)} placeholder="مثلاً جلسه هفتگی مدیران" />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-[12px]" style={{ color: 'var(--aw-text-secondary)', fontWeight: 600 }}>موضوع و توضیحات</label>
        <textarea style={{ ...inputStyle, minHeight: 70, resize: 'vertical' }} rows={3} value={desc} onChange={e => setDesc(e.target.value)} placeholder="دستور جلسه، موضوعات قابل بحث..." />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-[12px]" style={{ color: 'var(--aw-text-secondary)', fontWeight: 600 }}>زمان</label>
        <div className="grid grid-cols-2 gap-2">
          <select style={inputStyle} value={day} onChange={e => setDay(e.target.value)}>
            {WEEKDAYS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <select style={inputStyle} dir="ltr" value={slot} onChange={e => setSlot(e.target.value)}>
            <option value="">انتخاب ساعت</option>
            {TIME_SLOTS.map(t => <option key={t} value={t}>{toFa(t)}</option>)}
          </select>
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-[12px]" style={{ color: 'var(--aw-text-secondary)', fontWeight: 600 }}>محل برگزاری</label>
        <select style={inputStyle} value={location} onChange={e => setLocation(e.target.value)}>
          {['سالن کنفرانس', 'دفتر مدیریت', 'آنلاین', 'سالن آموزش'].map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-[12px] flex items-center justify-between" style={{ color: 'var(--aw-text-secondary)', fontWeight: 600 }}>
          <span>نفرات حاضر در جلسه {picked.length > 0 && <span style={{ color: 'var(--aw-eu-primary)' }}>({toFa(picked.length)})</span>}</span>
          {!slot && <span className="text-[10px] text-[var(--aw-text-muted)]" style={{ fontWeight: 500 }}>ابتدا ساعت را انتخاب کنید</span>}
        </label>
        {slot && busyPicked.length > 0 && (
          <div className="flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 rounded-lg" style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', fontWeight: 600 }}>
            <i className="fa-solid fa-triangle-exclamation text-[10px]" />
            {toFa(busyPicked.length)} نفر از انتخاب‌شده‌ها در این زمان مشغول‌اند
          </div>
        )}
        <div className="flex flex-col gap-1 max-h-[240px] overflow-y-auto aw-scroll p-1.5 rounded-[12px]" style={{ background: 'var(--aw-bg-input)', border: '1px solid var(--aw-border)' }}>
          <div className="text-[10px] px-1 pt-0.5 pb-1" style={{ color: 'var(--aw-text-muted)', fontWeight: 700 }}>ایجنت‌ها</div>
          {agentPeople.map(PersonRow)}
          <div className="text-[10px] px-1 pt-2 pb-1 mt-1 border-t border-[var(--aw-border)]" style={{ color: 'var(--aw-text-muted)', fontWeight: 700 }}>کارمندان</div>
          {staffPeople.map(PersonRow)}
        </div>
      </div>
      <button onClick={submit} className="mt-1 w-full rounded-[12px] border-none cursor-pointer text-white py-3 text-[14px]" style={{ background: 'var(--aw-primary)', fontWeight: 700, fontFamily: "'Kamand', 'Vazirmatn', sans-serif" }}>ثبت جلسه</button>
    </div>
  );
}

export function SecPlanningScreen() {
  const { openModal, closeModal, showToast, agents, personnel } = useApp();
  const [tab, setTab] = useState('calendar');
  const [taskFilter, setTaskFilter] = useState('all');
  const [todos, setTodos] = useState<any[]>([]); /* __secfix: per-user server (نه localStorage نشتی) */
  __usePersist('sec_todos', todos, setTodos);
  const [tasks, setTasks] = useState<TaskItem[]>(MOCK_TASKS);
  const __tRef = useRef(false); // __secTasksPersist
  useEffect(() => { (async () => { try { const v: any = await (api as any).myList('sec_tasks'); if (Array.isArray(v)) setTasks((prev: any) => { const __ids = new Set((v as any[]).map((x: any) => x && x.id)); return [...(v as any[]), ...(((prev as any[]) || []).filter((p: any) => p && !__ids.has(p.id)))]; }); } catch (_) {} __tRef.current = true; })(); }, []);
  useEffect(() => { if (!__tRef.current) return; const h = setTimeout(() => { (api as any).myBulkSave('sec_tasks', tasks).catch(() => {}); }, 600); return () => clearTimeout(h); }, [tasks]);
  __usePersist('sec_tasks', tasks, setTasks);
  const [events, setEvents] = useState<CalEvent[]>(MOCK_CALENDAR);
  const __evRef = useRef(false); // __secTasksPersist
  useEffect(() => { (async () => { try { const v: any = await (api as any).myList('sec_events'); if (Array.isArray(v)) setEvents((prev: any) => { const __ids = new Set((v as any[]).map((x: any) => x && x.id)); return [...(v as any[]), ...(((prev as any[]) || []).filter((p: any) => p && !__ids.has(p.id)))]; }); } catch (_) {} __evRef.current = true; })(); }, []);
  useEffect(() => { if (!__evRef.current) return; const h = setTimeout(() => { (api as any).myBulkSave('sec_events', events).catch(() => {}); }, 600); return () => clearTimeout(h); }, [events]);
  __usePersist('sec_events', events, setEvents);
  const [meetings, setMeetings] = useState<MeetingItem[]>(MOCK_MEETINGS);
  const __mtRef = useRef(false); // __secTasksPersist
  useEffect(() => { (async () => { try { const v: any = await (api as any).myList('sec_meetings'); if (Array.isArray(v)) setMeetings((prev: any) => { const __ids = new Set((v as any[]).map((x: any) => x && x.id)); return [...(v as any[]), ...(((prev as any[]) || []).filter((p: any) => p && !__ids.has(p.id)))]; }); } catch (_) {} __mtRef.current = true; })(); }, []);
  useEffect(() => { if (!__mtRef.current) return; const h = setTimeout(() => { (api as any).myBulkSave('sec_meetings', meetings).catch(() => {}); }, 600); return () => clearTimeout(h); }, [meetings]);
  __usePersist('sec_meetings', meetings, setMeetings);
  const [calMonth, setCalMonth] = useState(__JNOW.m);
  const [reminders, setReminders] = useState(MOCK_REMINDERS);
  const __rmRef = useRef(false); // __secTasksPersist
  useEffect(() => { (async () => { try { const v: any = await (api as any).myList('sec_reminders'); if (Array.isArray(v)) setReminders((prev: any) => { const __ids = new Set((v as any[]).map((x: any) => x && x.id)); return [...(v as any[]), ...(((prev as any[]) || []).filter((p: any) => p && !__ids.has(p.id)))]; }); } catch (_) {} __rmRef.current = true; })(); }, []);
  useEffect(() => { if (!__rmRef.current) return; const h = setTimeout(() => { (api as any).myBulkSave('sec_reminders', reminders).catch(() => {}); }, 600); return () => clearTimeout(h); }, [reminders]);
  __usePersist('sec_reminders', reminders, setReminders);
  const [snoozeId, setSnoozeId] = useState<number | null>(null);
  const snoozeReminder = (id: number, label: string) => {
    setReminders(prev => prev.map(r => r.id === id ? { ...r, when: `${label} ⏰`, snoozed: true } as any : r));
    setSnoozeId(null);
    showToast(`یادآوری به ${label} موکول شد`);
  };
  const [calYear, setCalYear] = useState(__JNOW.y);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const [taskForm, setTaskForm] = useState<TaskItem | null>(null);
  const [eventForm, setEventForm] = useState<CalEvent | null>(null);
  const [meetingForm, setMeetingForm] = useState<MeetingItem | null>(null);
  const [evStart, setEvStart] = useState('');
  const [evEnd, setEvEnd] = useState('');
  const composeTime = (s: string, e: string) => {
    if (!s && !e) return '';
    if (s && e) return `${toFa(s)} - ${toFa(e)}`;
    return toFa(s || e);
  };
  // Parse "۰۹:۰۰ - ۱۰:۰۰" back to latin HH:MM for the pickers
  const openEventForm = (ev: CalEvent) => {
    const toLatin = (str: string) => str.replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));
    const parts = (ev.time || '').split('-').map(p => toLatin(p.trim()));
    setEvStart(/^\d{1,2}:\d{2}$/.test(parts[0] || '') ? parts[0] : '');
    setEvEnd(/^\d{1,2}:\d{2}$/.test(parts[1] || '') ? parts[1] : '');
    setEventForm(ev);
  };

  const toggleTodo = (id: number) => {
    setTodos(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };
  const toggleTodoImportant = (id: number) => {
    setTodos(prev => prev.map(t => t.id === id ? { ...t, important: !t.important, priority: !t.important ? 'high' : t.priority } : t));
  };
  const removeTodo = (id: number) => setTodos(prev => prev.filter(t => t.id !== id));
  // New-todo composer state (Microsoft To-Do style)
  const [newTodo, setNewTodo] = useState('');
  const [ntPriority, setNtPriority] = useState('medium');
  const [ntDue, setNtDue] = useState('');
  const [ntMyDay, setNtMyDay] = useState(false);
  const [ntRemind, setNtRemind] = useState(false);
  const [ntRepeat, setNtRepeat] = useState('بدون تکرار');
  const [ntOptsOpen, setNtOptsOpen] = useState(false);
  const addTodo = () => {
    const text = newTodo.trim();
    if (!text) return;
    setTodos(prev => [{ id: Date.now(), text, done: false, priority: ntPriority, important: ntPriority === 'high', due: ntDue, myDay: ntMyDay, remind: ntRemind, repeat: ntRepeat }, ...prev]);
    setNewTodo(''); setNtPriority('medium'); setNtDue(''); setNtMyDay(false); setNtRemind(false); setNtRepeat('بدون تکرار'); setNtOptsOpen(false);
    showToast('آیتم به فهرست اضافه شد');
  };

  const blankTask = (): TaskItem => ({ id: Date.now(), title: '', priority: 'medium', status: 'todo', assignee: '', due: '', team: '', desc: '' });
  const blankEvent = (): CalEvent => ({ id: Date.now(), title: '', time: '', color: EVENT_COLORS[0], day: '', dayNum: selectedDay || 1, attendees: [], notify: true });
  const blankMeeting = (): MeetingItem => ({ id: Date.now(), title: '', time: '', attendees: 1, location: '', status: 'pending' });

  const saveTask = (t: TaskItem) => {
    if (!t.title.trim()) return;
    setTasks(prev => prev.some(x => x.id === t.id) ? prev.map(x => x.id === t.id ? t : x) : [...prev, t]);
    setTaskForm(null);
  };
  const removeTask = (id: number) => setTasks(prev => prev.filter(x => x.id !== id));

  const saveEvent = (e: CalEvent) => {
    if (!e.title.trim()) return;
    setEvents(prev => prev.some(x => x.id === e.id) ? prev.map(x => x.id === e.id ? e : x) : [...prev, e]);
    const n = (e.attendees || []).length;
    if (n > 0 && e.notify) showToast(`قرار ثبت شد و به ${toFa(n)} نفر اعلان ارسال شد`);
    else showToast('قرار ثبت شد');
    setEventForm(null);
  };
  // People list for attendee pickers (agents + personnel)
  const peopleList = [
    ...((agents || []).filter((a: any) => !a.locked).map((a: any) => ({ key: 'a-' + a.id, name: a.name, sub: a.role, init: a.init || a.name?.[0], bg: a.bg || 'bg-violet-500' }))),
    ...((personnel || []).map((p: any) => ({ key: 'p-' + p.id, name: p.name, sub: p.role, init: p.name?.[0], bg: 'bg-blue-500' }))),
  ];
  const removeEvent = (id: number) => setEvents(prev => prev.filter(x => x.id !== id));

  const saveMeeting = (m: MeetingItem) => {
    if (!m.title.trim()) return;
    setMeetings(prev => prev.some(x => x.id === m.id) ? prev.map(x => x.id === m.id ? m : x) : [...prev, m]);
    setMeetingForm(null);
  };
  const removeMeeting = (id: number) => setMeetings(prev => prev.filter(x => x.id !== id));
  const confirmMeeting = (id: number) => setMeetings(prev => prev.map(x => x.id === id ? { ...x, status: 'confirmed' } : x));

  const inputCls = "w-full bg-[var(--aw-bg-input)] border border-[var(--aw-border)] rounded-lg px-3 py-2 text-[12px] text-[var(--aw-text-primary)] outline-none";
  const btnPrimary = "px-3 py-2 rounded-lg border-none text-white text-[12px] cursor-pointer";
  const btnGhost = "px-3 py-2 rounded-lg border border-[var(--aw-border)] bg-transparent text-[var(--aw-text-muted)] text-[12px] cursor-pointer";

  const [viewMode, setViewMode] = useState('month');
  const [popTab, setPopTab] = useState('tasks');
  const [popKind, setPopKind] = useState(null);
  const [popWeek, setPopWeek] = useState(0);
  const [openSel, setOpenSel] = useState(null); // which glass dropdown is open: 'view' | 'range' | 'status'
  // Chat-style drag sheet: live-follow the finger, tap toggles full ⇆ below-spectrum,
  // pull down past a threshold closes. Sits below the avatar/spectrum (kept sharp).
  const FULL_TOP = 0;
  const [sheetTop, setSheetTop] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [headerBottom, setHeaderBottom] = useState(0);
  const sheetDrag = React.useRef(null);
  const restBase = headerBottom > 0 ? headerBottom : Math.round((typeof window !== 'undefined' ? window.innerHeight : 800) * 0.42);
  const curTop = sheetTop != null ? sheetTop : restBase;
  React.useLayoutEffect(() => {
    const measure = () => {
      const corner = document.querySelector('[data-avatar-corner]');
      const anchor = document.querySelector('[data-chat-top-anchor]');
      let b = 0;
      if (corner && corner.getBoundingClientRect().height > 0) b = corner.getBoundingClientRect().bottom + 6;
      else if (anchor) b = anchor.getBoundingClientRect().bottom;
      setHeaderBottom(Math.max(0, b));
    };
    measure();
    const anchor = document.querySelector('[data-chat-top-anchor]');
    const ro = anchor ? new ResizeObserver(measure) : null;
    if (anchor && ro) ro.observe(anchor);
    const iv = popKind !== null ? setInterval(measure, 140) : null;
    window.addEventListener('resize', measure);
    return () => { if (ro) ro.disconnect(); if (iv) clearInterval(iv); window.removeEventListener('resize', measure); };
  }, [popKind]);
  React.useEffect(() => { setSheetTop(null); }, [popKind]);
  const onSheetDown = (e) => {
    if (window.innerWidth >= 768) return;
    sheetDrag.current = { startY: e.clientY, startTop: curTop, moved: false };
    setDragging(true);
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
  };
  const onSheetMove = (e) => {
    if (!sheetDrag.current) return;
    const d = e.clientY - sheetDrag.current.startY;
    if (Math.abs(d) > 6) sheetDrag.current.moved = true;
    setSheetTop(Math.max(FULL_TOP, sheetDrag.current.startTop + d));
  };
  const onSheetUp = () => {
    if (!sheetDrag.current) return;
    const wasTap = !sheetDrag.current.moved;
    const startTop = sheetDrag.current.startTop;
    sheetDrag.current = null;
    setDragging(false);
    const base = restBase;
    if (wasTap) { setSheetTop(curTop < base - 4 ? null : FULL_TOP); return; }
    if (curTop > base + 90) { closePop(); return; }
    const delta = curTop - startTop; // + dragged down, - dragged up
    // A committed drag honours its direction even from the full state
    if (Math.abs(delta) > 40) { setSheetTop(delta > 0 ? null : FULL_TOP); return; }
    // small nudge: snap to the nearer of full / rest
    setSheetTop(curTop < base / 2 ? FULL_TOP : null);
  };
  const [weekIdx, setWeekIdx] = useState(0);
  const [dayCursor, setDayCursor] = useState(5);

  const daysInMonth = Math.round(((calMonth === 11 ? __jalToGreg(calYear + 1, 1, 1) : __jalToGreg(calYear, calMonth + 2, 1)).getTime() - __jalToGreg(calYear, calMonth + 1, 1).getTime()) / 86400000);
  const startDow = (__jalToGreg(calYear, calMonth + 1, 1).getDay() + 1) % 7;
  const todayNum = (calMonth === __JNOW.m && calYear === __JNOW.y) ? __JNOW.d : -1;
  const weekCount = Math.ceil((startDow + daysInMonth) / 7);
  const clampWeek = Math.max(0, Math.min(weekIdx, weekCount - 1));
  const weekDays = Array.from({ length: 7 }, (_, c) => { const dn = clampWeek * 7 - startDow + c + 1; return (dn >= 1 && dn <= daysInMonth) ? dn : null; });
  const dotColors = (d: number) => events.filter(e => e.dayNum === d).map(e => e.color);
  const openDay = (d: number) => { setSelectedDay(d); setPopKind('day'); setPopTab('tasks'); };
  const openWeek = (wi: number) => { setPopWeek(wi); setPopKind('week'); setPopTab('tasks'); };
  const openMonth = () => { setPopKind('month'); setPopTab('tasks'); };
  const closePop = () => { setPopKind(null); setSelectedDay(null); setTaskForm(null); };
  const rangeDaySet = popKind === 'week'
    ? new Set(Array.from({ length: 7 }, (_, c) => { const dn = popWeek * 7 - startDow + c + 1; return (dn >= 1 && dn <= daysInMonth) ? dn : -1; }))
    : popKind === 'day'
    ? new Set([selectedDay || (todayNum > 0 ? todayNum : 1)])
    : null;
  const inRange = (dn?: number) => popKind === 'month' || dn == null || (rangeDaySet != null && rangeDaySet.has(dn));
  const emptyNote = (
    <div className="p-5 flex flex-col items-center gap-2 text-[var(--aw-text-muted)] mt-1" style={cardStyle}>
      <i className="fa-solid fa-calendar-xmark text-[18px]" style={{ opacity: 0.4 }} />
      <span className="text-[11px]">موردی در این بازه نیست</span>
    </div>
  );
  const DetailRow = ({ icon, label, value, color }) => (
    value ? (
      <div className="flex items-center gap-2.5 py-2 border-b" style={{ borderColor: 'var(--aw-border-light, var(--aw-border))' }}>
        <div className="w-8 h-8 rounded-[10px] flex items-center justify-center flex-shrink-0" style={{ background: `${color || 'var(--aw-primary)'}1f`, color: color || 'var(--aw-primary)' }}><i className={icon + ' text-[12px]'} /></div>
        <span className="text-[11px] text-[var(--aw-text-muted)] flex-shrink-0" style={{ minWidth: 56 }}>{label}</span>
        <span className="text-[12.5px] text-[var(--aw-text-primary)] text-left flex-1" style={{ fontWeight: 600 }}>{value}</span>
      </div>
    ) : null
  );
  const openTaskDetail = (task) => openModal('جزئیات تسک', (
    <div className="flex flex-col gap-1">
      <div className="text-[15px] mb-1" style={{ fontWeight: 800, color: 'var(--aw-text-primary)' }}>{task.title}</div>
      <div className="flex gap-1.5 mb-2">
        <span className="text-[11px] px-2.5 py-1 rounded-full" style={{ background: `${priorityColors[task.priority]}22`, color: priorityColors[task.priority], fontWeight: 700 }}>{priorityLabels[task.priority]}</span>
        <span className="text-[11px] px-2.5 py-1 rounded-full" style={{ background: `${statusColors[task.status]}22`, color: statusColors[task.status], fontWeight: 700 }}>{statusLabels[task.status]}</span>
      </div>
      {task.desc && <p className="text-[12.5px] text-[var(--aw-text-secondary)] leading-7 mb-2">{task.desc}</p>}
      <DetailRow icon="fa-solid fa-user" label="مسئول" value={task.assignee} color="#22A6F0" />
      <DetailRow icon="fa-solid fa-building" label="تیم" value={task.team} color="#7B62FC" />
      <DetailRow icon="fa-regular fa-clock" label="موعد" value={task.due} color="#F59E0B" />
      <button onClick={() => { closeModal(); setTaskForm({ ...task }); }} className="w-full mt-3 py-2.5 rounded-[12px] border-none cursor-pointer text-white text-[13px] flex items-center justify-center gap-2" style={{ background: '#22A6F0', fontWeight: 700 }}><i className="fa-solid fa-pen text-[12px]" />ویرایش تسک</button>
    </div>
  ));
  const openMeetingDetail = (m) => openModal('جزئیات جلسه', (
    <div className="flex flex-col gap-1">
      <div className="text-[15px] mb-1" style={{ fontWeight: 800, color: 'var(--aw-text-primary)' }}>{m.title}</div>
      <div className="mb-2"><span className="text-[11px] px-2.5 py-1 rounded-full" style={{ background: m.status === 'confirmed' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)', color: m.status === 'confirmed' ? '#10B981' : '#F59E0B', fontWeight: 700 }}>{m.status === 'confirmed' ? 'تأیید شده' : 'در انتظار'}</span></div>
      {m.desc && <p className="text-[12.5px] text-[var(--aw-text-secondary)] leading-7 mb-2">{m.desc}</p>}
      <DetailRow icon="fa-regular fa-clock" label="زمان" value={m.time} color="#22A6F0" />
      <DetailRow icon="fa-solid fa-users" label="حاضران" value={m.attendees + ' نفر'} color="#7B62FC" />
      <DetailRow icon="fa-solid fa-location-dot" label="محل" value={m.location} color="#F59E0B" />
      <button onClick={() => openModal('ویرایش جلسه', <QuickForm submitLabel="ذخیره تغییرات" toast="جلسه ویرایش شد" initial={{ title: m.title, time: m.time, location: m.location }} onSubmit={(v) => setMeetings(prev => prev.map(x => x.id === m.id ? { ...x, title: v.title || x.title, time: v.time || x.time, location: v.location || x.location } : x))} fields={[{ key: 'title', label: 'عنوان جلسه' }, { key: 'time', label: 'زمان' }, { key: 'location', label: 'محل برگزاری' }]} />)} className="w-full mt-3 py-2.5 rounded-[12px] border-none cursor-pointer text-white text-[13px] flex items-center justify-center gap-2" style={{ background: '#22A6F0', fontWeight: 700 }}><i className="fa-solid fa-pen text-[12px]" />ویرایش جلسه</button>
    </div>
  ));
  const openReminderDetail = (r) => openModal('جزئیات یادآوری', (
    <div className="flex flex-col gap-1">
      <div className="text-[15px] mb-2" style={{ fontWeight: 800, color: 'var(--aw-text-primary)' }}>{r.title}</div>
      <DetailRow icon="fa-regular fa-clock" label="زمان" value={r.when} color="#22A6F0" />
      <DetailRow icon="fa-solid fa-repeat" label="تکرار" value={r.repeat} color="#7B62FC" />
      <button onClick={() => openModal('ویرایش یادآوری', <QuickForm submitLabel="ذخیره تغییرات" toast="یادآوری ویرایش شد" initial={{ title: r.title, when: r.when, repeat: r.repeat }} onSubmit={(v) => setReminders(prev => prev.map(x => x.id === r.id ? { ...x, title: v.title, when: v.when || x.when, repeat: v.repeat || x.repeat } : x))} fields={[{ key: 'title', label: 'عنوان یادآوری' }, { key: 'when', label: 'زمان', type: 'time' }, { key: 'repeat', label: 'تکرار', type: 'select', options: ['یک‌بار', 'روزانه', 'هفتگی', 'ماهانه'] }]} />)} className="w-full mt-3 py-2.5 rounded-[12px] border-none cursor-pointer text-white text-[13px] flex items-center justify-center gap-2" style={{ background: '#22A6F0', fontWeight: 700 }}><i className="fa-solid fa-pen text-[12px]" />ویرایش یادآوری</button>
    </div>
  ));
  const openTodoDetail = (item) => openModal('جزئیات آیتم', (
    <div className="flex flex-col gap-1">
      <div className="text-[15px] mb-2" style={{ fontWeight: 800, color: 'var(--aw-text-primary)' }}>{item.text}</div>
      <DetailRow icon="fa-solid fa-flag" label="اولویت" value={item.priority === 'high' ? 'بالا' : item.priority === 'medium' ? 'متوسط' : 'عادی'} color={priorityColors[item.priority]} />
      <DetailRow icon="fa-solid fa-check" label="وضعیت" value={item.done ? 'انجام شده' : 'انجام نشده'} color={item.done ? '#10B981' : '#F59E0B'} />
      <DetailRow icon="fa-regular fa-clock" label="موعد" value={item.due} color="#F59E0B" />
      <DetailRow icon="fa-solid fa-repeat" label="تکرار" value={item.repeat} color="#7B62FC" />
      <button onClick={() => openModal('ویرایش آیتم', <QuickForm submitLabel="ذخیره تغییرات" toast="آیتم ویرایش شد" initial={{ text: item.text, due: item.due }} onSubmit={(v) => setTodos(prev => prev.map(x => x.id === item.id ? { ...x, text: v.text || x.text, due: v.due || x.due } : x))} fields={[{ key: 'text', label: 'عنوان آیتم' }, { key: 'due', label: 'موعد' }]} />)} className="w-full mt-3 py-2.5 rounded-[12px] border-none cursor-pointer text-white text-[13px] flex items-center justify-center gap-2" style={{ background: '#22A6F0', fontWeight: 700 }}><i className="fa-solid fa-pen text-[12px]" />ویرایش آیتم</button>
    </div>
  ));
  const gotoPrevMonth = () => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); } else setCalMonth(m => m - 1); setSelectedDay(null); setWeekIdx(0); };
  const gotoNextMonth = () => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); } else setCalMonth(m => m + 1); setSelectedDay(null); setWeekIdx(0); };

  const POP_TABS = [
    { id: 'tasks', label: 'تسک‌ها', icon: 'fa-solid fa-list-check' },
    { id: 'todo', label: 'To-Do', icon: 'fa-solid fa-square-check' },
    { id: 'meetings', label: 'جلسات', icon: 'fa-solid fa-users' },
    { id: 'reminders', label: 'یادآوری', icon: 'fa-solid fa-bell' },
  ];

  const monthNav = (
    <div className="flex items-center justify-between mb-3">
      <button className="w-8 h-8 rounded-lg border-none cursor-pointer flex items-center justify-center" style={{ background: 'var(--aw-bg-hover)' }} onClick={gotoPrevMonth}>
        <i className="fa-solid fa-chevron-right text-[11px] text-[var(--aw-text-muted)]" />
      </button>
      <button onClick={openMonth} title="برنامهٔ کل ماه" className="flex items-center gap-2 bg-transparent border-none cursor-pointer">
        <span className="text-[14px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>{JALALI_MONTHS[calMonth]}</span>
        <span className="text-[13px] text-[var(--aw-text-muted)]">{calYear}</span>
        <i className="fa-solid fa-chevron-down text-[9px] text-[var(--aw-text-muted)]" />
      </button>
      <button className="w-8 h-8 rounded-lg border-none cursor-pointer flex items-center justify-center" style={{ background: 'var(--aw-bg-hover)' }} onClick={gotoNextMonth}>
        <i className="fa-solid fa-chevron-left text-[11px] text-[var(--aw-text-muted)]" />
      </button>
    </div>
  );

  const weekdayHeader = (
    <div className="grid grid-cols-7 gap-1 mb-1">
      {JALALI_WEEKDAYS.map(wd => (
        <div key={wd} className="text-center text-[10px] text-[var(--aw-text-muted)] py-1" style={{ fontWeight: 600 }}>{wd}</div>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col h-full">

      <div className="flex-1 overflow-y-auto px-4 pb-24 aw-scroll flex flex-col gap-3 pt-3">
        {/* ── MONTH VIEW ── */}
        {viewMode === 'month' && (
          <div className="p-3" style={cardStyle}>
            {monthNav}
            {(() => {
              const gridCols = '26px repeat(7, minmax(0,1fr))';
              const rows = Array.from({ length: weekCount }, (_, wi) =>
                Array.from({ length: 7 }, (_, c) => { const dn = wi * 7 - startDow + c + 1; return (dn >= 1 && dn <= daysInMonth) ? dn : null; })
              );
              return (
                <>
                  <div className="grid mb-1" style={{ gridTemplateColumns: gridCols, gap: 4 }}>
                    <div />
                    {JALALI_WEEKDAYS.map(wd => (
                      <div key={wd} className="text-center text-[10px] text-[var(--aw-text-muted)] py-1" style={{ fontWeight: 600 }}>{wd}</div>
                    ))}
                  </div>
                  <div className="flex flex-col gap-1">
                    {rows.map((week, wi) => (
                      <div key={'w-' + wi} className="grid items-center" style={{ gridTemplateColumns: gridCols, gap: 4 }}>
                        <button onClick={() => openWeek(wi)} title="برنامهٔ این هفته" className="h-9 rounded-lg border-none cursor-pointer flex items-center justify-center text-[10px]" style={{ background: 'color-mix(in srgb, var(--aw-primary) 10%, transparent)', color: 'var(--aw-primary)', fontWeight: 700 }}>
                          ه{toFa(wi + 1)}
                        </button>
                        {week.map((d, c) => {
                          if (d === null) return <div key={'e-' + wi + '-' + c} className="h-9" />;
                          const cols = dotColors(d);
                          const isToday = d === todayNum;
                          const isFriday = c === 6;
                          return (
                            <button key={d} className="h-9 rounded-lg border-none cursor-pointer flex flex-col items-center justify-center gap-0.5 transition-all relative" style={{ background: isToday ? 'color-mix(in srgb, var(--aw-primary) 14%, transparent)' : 'transparent', color: isFriday ? '#EF4444' : 'var(--aw-text-primary)', fontWeight: isToday ? 700 : 400, fontSize: 13 }} onClick={() => openDay(d)}>
                              {d}
                              {cols.length > 0 && (
                                <div className="flex gap-0.5 absolute bottom-0.5">
                                  {cols.slice(0, 3).map((cc, ci) => <span key={ci} className="w-1 h-1 rounded-full" style={{ background: cc }} />)}
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {/* ── WEEK VIEW ── */}
        {viewMode === 'week' && (
          <div className="p-3" style={cardStyle}>
            <div className="flex items-center justify-between mb-3">
              <button className="w-8 h-8 rounded-lg border-none cursor-pointer flex items-center justify-center" style={{ background: 'var(--aw-bg-hover)' }} onClick={() => setWeekIdx(w => Math.max(0, Math.min(weekCount - 1, w) - 1))}>
                <i className="fa-solid fa-chevron-right text-[11px] text-[var(--aw-text-muted)]" />
              </button>
              <div className="flex items-center gap-2">
                <span className="text-[13px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>هفته {toFa(clampWeek + 1)}</span>
                <span className="text-[12px] text-[var(--aw-text-muted)]">{JALALI_MONTHS[calMonth]} {calYear}</span>
              </div>
              <button className="w-8 h-8 rounded-lg border-none cursor-pointer flex items-center justify-center" style={{ background: 'var(--aw-bg-hover)' }} onClick={() => setWeekIdx(w => Math.min(weekCount - 1, Math.max(0, w) + 1))}>
                <i className="fa-solid fa-chevron-left text-[11px] text-[var(--aw-text-muted)]" />
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {weekDays.map((d, c) => {
                if (d === null) return <div key={'we-' + c} className="rounded-xl" style={{ minHeight: 72, background: 'var(--aw-bg-hover)', opacity: 0.4 }} />;
                const cols = dotColors(d);
                const isToday = d === todayNum;
                const isFriday = c === 6;
                return (
                  <button key={d} onClick={() => openDay(d)} className="rounded-xl border cursor-pointer flex flex-col items-center justify-start gap-1 pt-1.5 pb-1 transition-all" style={{ minHeight: 72, background: isToday ? 'color-mix(in srgb, var(--aw-primary) 12%, transparent)' : 'var(--aw-bg-hover)', borderColor: isToday ? 'var(--aw-primary)' : 'transparent' }}>
                    <span className="text-[9px]" style={{ color: isFriday ? '#EF4444' : 'var(--aw-text-muted)', fontWeight: 600 }}>{JALALI_WEEKDAYS[c]}</span>
                    <span className="text-[15px]" style={{ color: isFriday ? '#EF4444' : 'var(--aw-text-primary)', fontWeight: isToday ? 800 : 600 }}>{d}</span>
                    <div className="flex gap-0.5 mt-auto flex-wrap justify-center px-1">
                      {cols.slice(0, 4).map((cc, ci) => <span key={ci} className="w-1.5 h-1.5 rounded-full" style={{ background: cc }} />)}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── DAY VIEW ── */}
        {viewMode === 'day' && (
          <div className="flex flex-col gap-3">
            <div className="p-3 flex items-center justify-between" style={cardStyle}>
              <button className="w-9 h-9 rounded-lg border-none cursor-pointer flex items-center justify-center" style={{ background: 'var(--aw-bg-hover)' }} onClick={() => setDayCursor(d => Math.max(1, d - 1))}>
                <i className="fa-solid fa-chevron-right text-[12px] text-[var(--aw-text-muted)]" />
              </button>
              <div className="flex flex-col items-center">
                <span className="text-[11px] text-[var(--aw-text-muted)]" style={{ fontWeight: 600 }}>{JALALI_WEEKDAYS[(startDow + dayCursor - 1) % 7]}{dayCursor === todayNum ? ' · امروز' : ''}</span>
                <span className="text-[24px] text-[var(--aw-text-primary)]" style={{ fontWeight: 800 }}>{toFa(dayCursor)}</span>
                <span className="text-[12px] text-[var(--aw-text-muted)]">{JALALI_MONTHS[calMonth]} {calYear}</span>
              </div>
              <button className="w-9 h-9 rounded-lg border-none cursor-pointer flex items-center justify-center" style={{ background: 'var(--aw-bg-hover)' }} onClick={() => setDayCursor(d => Math.min(daysInMonth, d + 1))}>
                <i className="fa-solid fa-chevron-left text-[12px] text-[var(--aw-text-muted)]" />
              </button>
            </div>
            {(() => {
              const cols = dotColors(dayCursor);
              return cols.length > 0 ? (
                <div className="flex items-center gap-2 px-1">
                  <span className="text-[11px] text-[var(--aw-text-muted)]">قرارها:</span>
                  <div className="flex gap-1">{cols.map((c, i) => <span key={i} className="w-2 h-2 rounded-full" style={{ background: c }} />)}</div>
                </div>
              ) : null;
            })()}
            <button onClick={() => openDay(dayCursor)} className="w-full py-3 rounded-[14px] border-none cursor-pointer text-white text-[13px] flex items-center justify-center gap-2" style={{ background: 'linear-gradient(135deg, var(--aw-primary-light), var(--aw-primary-dark))', fontWeight: 700 }}>
              <i className="fa-solid fa-list-check text-[13px]" />مشاهده و مدیریت برنامهٔ این روز
            </button>
          </div>
        )}

        {/* Reminders preview — between calendar and upcoming events */}
        {(() => {
          const typeMeta = {
            call: { icon: 'fa-solid fa-phone', color: '#22A6F0' },
            report: { icon: 'fa-solid fa-file-lines', color: '#7B62FC' },
            invoice: { icon: 'fa-solid fa-file-invoice-dollar', color: '#10B981' },
            system: { icon: 'fa-solid fa-gear', color: '#F59E0B' },
            meeting: { icon: 'fa-solid fa-users', color: '#EF4444' },
          };
          const top5 = [...reminders].sort((a, b) => (a.dayNum || 99) - (b.dayNum || 99)).slice(0, 5);
          if (top5.length === 0) return null;
          return (
            <div className="flex flex-col gap-1.5 mt-1">
              <div className="flex items-center gap-2 px-1">
                <i className="fa-solid fa-bell text-[11px] text-[var(--aw-primary)]" />
                <span className="text-[12px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>یادآوری</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: 'color-mix(in srgb, var(--aw-primary) 15%, transparent)', color: 'var(--aw-primary)' }}>{toFa(top5.length)}</span>
              </div>
              {top5.map(r => {
                const m = typeMeta[r.type] || typeMeta.call;
                return (
                  <button key={'rm' + r.id} onClick={() => { setPopKind('month'); setPopTab('reminders'); }} className="p-2.5 flex items-center gap-2.5 w-full text-right border-none cursor-pointer" style={cardStyle}>
                    <span className="flex items-center justify-center w-9 h-9 rounded-[10px] flex-shrink-0" style={{ background: m.color + '1f', color: m.color }}>
                      <i className={m.icon + ' text-[13px]'} />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-[12.5px] truncate" style={{ fontWeight: 600, color: 'var(--aw-text-primary)' }}>{r.title}</span>
                      <span className="block text-[10px] text-[var(--aw-text-muted)] truncate"><i className="fa-regular fa-clock text-[8px] ml-1" />{r.when}</span>
                    </span>
                    <i className="fa-solid fa-chevron-left text-[10px] text-[var(--aw-text-muted)]" />
                  </button>
                );
              })}
              <button onClick={() => { setPopKind('month'); setPopTab('reminders'); }} className="w-full mt-0.5 py-2 rounded-lg border border-dashed cursor-pointer bg-transparent text-[11px] text-[var(--aw-text-muted)] hover:text-[var(--aw-primary)] transition-colors" style={{ borderColor: 'var(--aw-border)' }}>
                مشاهده بیشتر <i className="fa-solid fa-chevron-left text-[9px] mr-1" />
              </button>
            </div>
          );
        })()}

        {/* Upcoming events overview */}
        {(() => {
          const base = todayNum > 0 ? todayNum : 1;
          const sorted = [...events].sort((a, b) => a.dayNum - b.dayNum);
          const upcoming = sorted.filter(e => e.dayNum >= base).slice(0, 4);
          if (upcoming.length === 0) return null;
          return (
            <div className="flex flex-col gap-1.5 mt-1">
              <div className="flex items-center gap-2 px-1">
                <i className="fa-solid fa-arrow-trend-up text-[11px] text-[var(--aw-primary)]" />
                <span className="text-[12px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>رویدادهای پیش‌رو</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: 'color-mix(in srgb, var(--aw-primary) 15%, transparent)', color: 'var(--aw-primary)' }}>{toFa(upcoming.length)}</span>
              </div>
              {upcoming.map(e => (
                <button key={'u' + e.id} onClick={() => openDay(e.dayNum)} className="p-2.5 flex items-center gap-2.5 w-full text-right border-none cursor-pointer" style={cardStyle}>
                  <span className="flex flex-col items-center justify-center w-9 h-9 rounded-[10px] flex-shrink-0" style={{ background: e.color + '1f', color: e.color }}>
                    <span className="text-[13px] leading-none" style={{ fontWeight: 800 }}>{e.dayNum}</span>
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-[12.5px] truncate" style={{ fontWeight: 600, color: 'var(--aw-text-primary)' }}>{e.title}</span>
                    <span className="block text-[10px] text-[var(--aw-text-muted)] truncate"><i className="fa-regular fa-clock text-[8px] ml-1" />{e.time}</span>
                  </span>
                  <i className="fa-solid fa-chevron-left text-[10px] text-[var(--aw-text-muted)]" />
                </button>
              ))}
            </div>
          );
        })()}
      </div>

      {/* ── DAY PLANNER POPUP — 4 switchable panes ── */}
      {popKind !== null && (
        <div className="fixed inset-0 z-40 flex items-end justify-center" onClick={closePop}>
          <div aria-hidden onClick={closePop} style={{ position: 'fixed', top: headerBottom || 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)' }} />
          <div className="w-full max-w-[480px] flex flex-col overflow-hidden"
            style={(typeof window !== 'undefined' && window.innerWidth < 768) ? {
              position: 'fixed', top: curTop, bottom: 'var(--kb-h, 0px)', left: 0, right: 0,
              borderRadius: curTop > 2 ? '24px 24px 0 0' : 0,
              background: 'linear-gradient(180deg, color-mix(in srgb, var(--aw-primary) 16%, var(--aw-bg-modal)), var(--aw-bg-modal))',
              backdropFilter: 'blur(28px) saturate(1.5)', WebkitBackdropFilter: 'blur(28px) saturate(1.5)',
              border: '1px solid color-mix(in srgb, var(--aw-primary) 30%, var(--aw-border))',
              boxShadow: '0 -12px 40px rgba(0,0,0,0.35)',
              transition: dragging ? 'none' : 'top 0.3s cubic-bezier(0.32,0.72,0,1), border-radius 0.3s',
            } : {
              height: '78vh', maxHeight: '92vh', borderRadius: '24px',
              background: 'linear-gradient(180deg, color-mix(in srgb, var(--aw-primary) 16%, var(--aw-bg-modal)), var(--aw-bg-modal))',
              backdropFilter: 'blur(28px) saturate(1.5)', WebkitBackdropFilter: 'blur(28px) saturate(1.5)',
              border: '1px solid color-mix(in srgb, var(--aw-primary) 30%, var(--aw-border))',
              boxShadow: '0 -12px 40px rgba(0,0,0,0.35)',
            }} onClick={e => e.stopPropagation()}>
            <div className="flex-shrink-0 pt-2 pb-1 flex items-center justify-center cursor-grab active:cursor-grabbing touch-none" onPointerDown={onSheetDown} onPointerMove={onSheetMove} onPointerUp={onSheetUp} onPointerCancel={onSheetUp}>
              <div className="w-10 h-1.5 rounded-full" style={{ background: 'var(--aw-text-muted)', opacity: 0.4 }} />
            </div>
            <div className="flex items-center gap-2 px-4 pb-3 pt-1 border-b flex-shrink-0" style={{ borderColor: 'var(--aw-glass-border, rgba(255,255,255,0.12))' }}>
              <i className={`${popKind === 'week' ? 'fa-solid fa-calendar-week' : popKind === 'month' ? 'fa-solid fa-calendar' : 'fa-solid fa-calendar-day'} text-[14px] text-[var(--aw-primary)]`} />
              <span className="text-[14px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>{popKind === 'week' ? `هفته ${toFa(popWeek + 1)} — ${JALALI_MONTHS[calMonth]} ${calYear}` : popKind === 'month' ? `${JALALI_MONTHS[calMonth]} ${calYear} — کل ماه` : `${toFa(selectedDay || 1)} ${JALALI_MONTHS[calMonth]} ${calYear}`}</span>
              <button className="mr-auto w-8 h-8 rounded-[10px] flex items-center justify-center border cursor-pointer text-[var(--aw-text-muted)] hover:text-[var(--aw-text-primary)]" style={{ background: 'var(--aw-eu-nav-bg)', borderColor: 'var(--aw-eu-nav-border)', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)' }} onClick={closePop}><i className="fa-solid fa-xmark text-[16px]" /></button>
            </div>
            {/* ── 3 side-by-side dropdowns: نما / بازه / وضعیت ── */}
            <div className="px-4 pt-3 flex-shrink-0 flex items-stretch gap-2">
              {(() => {
                const tasksOn = popTab === 'tasks';
                const glassPanel: React.CSSProperties = { background: 'var(--aw-eu-nav-bg)', borderColor: 'var(--aw-eu-nav-border)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', boxShadow: '0 12px 32px -8px rgba(0,0,0,0.45)', fontFamily: "'Kamand', 'Vazirmatn', sans-serif" };
                const btnStyle: React.CSSProperties = { background: 'var(--aw-eu-nav-bg)', borderColor: 'var(--aw-eu-nav-border)', color: 'var(--aw-text-primary)', fontWeight: 600, backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)', fontFamily: "'Kamand', 'Vazirmatn', sans-serif" };
                const GlassSelect = ({ id, label, value, options, onPick, disabled }: any) => {
                  const open = openSel === id && !disabled;
                  const cur = options.find((o: any) => o.id === value) || options[0];
                  return (
                    <div className="relative flex-1 min-w-0 flex flex-col gap-1" style={{ opacity: disabled ? 0.45 : 1 }}>
                      <span className="text-[9.5px] text-[var(--aw-text-muted)] pr-0.5" style={{ fontWeight: 600 }}>{label}</span>
                      <button type="button" disabled={disabled}
                        onClick={() => setOpenSel(open ? null : id)}
                        className="w-full flex items-center justify-between gap-1 rounded-[10px] border text-[11.5px] pr-3 pl-2.5 py-2 outline-none"
                        style={{ ...btnStyle, cursor: disabled ? 'not-allowed' : 'pointer' }}>
                        <span className="truncate">{cur ? cur.label : ''}</span>
                        <i className={`fa-solid fa-chevron-down text-[9px] text-[var(--aw-text-muted)] transition-transform ${open ? 'rotate-180' : ''}`} />
                      </button>
                      <AnimatePresence>
                        {open && (
                          <>
                            <div className="fixed inset-0 z-[40]" onClick={() => setOpenSel(null)} />
                            <motion.div initial={{ opacity: 0, y: -6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.97 }} transition={{ duration: 0.14 }}
                              className="absolute z-[41] top-full mt-1 left-0 right-0 rounded-[12px] border p-1 overflow-hidden" style={glassPanel}>
                              {options.map((o: any) => (
                                <button key={o.id} type="button"
                                  onClick={() => { onPick(o.id); setOpenSel(null); }}
                                  className="w-full text-right px-2.5 py-2 rounded-[8px] text-[11.5px] flex items-center justify-between gap-2 transition-colors hover:bg-[var(--aw-hover)]"
                                  style={{ color: 'var(--aw-text-primary)', fontWeight: o.id === value ? 700 : 500, background: o.id === value ? 'var(--aw-hover)' : 'transparent' }}>
                                  <span className="truncate">{o.label}</span>
                                  {o.id === value && <i className="fa-solid fa-check text-[9px] text-[#22A6F0]" />}
                                </button>
                              ))}
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                };
                return (
                  <>
                    <GlassSelect id="view" label="نما" value={popTab} options={POP_TABS.map(t => ({ id: t.id, label: t.label }))} onPick={(v: string) => setPopTab(v)} />
                    <GlassSelect id="range" label="بازه" value={popKind || 'day'} options={[{ id: 'day', label: 'روز' }, { id: 'week', label: 'هفته' }, { id: 'month', label: 'ماه' }]} onPick={(v: string) => { if (v === 'day' && !selectedDay) setSelectedDay(todayNum > 0 ? todayNum : 1); setPopKind(v); }} />
                    <GlassSelect id="status" label="وضعیت" value={taskFilter} disabled={!tasksOn} options={TASK_STATUS_TABS.map(st => ({ id: st.id, label: st.id === 'all' ? 'همه وضعیت‌ها' : st.label }))} onPick={(v: string) => setTaskFilter(v)} />
                  </>
                );
              })()}
            </div>
            <div className="flex-1 overflow-y-auto px-4 pb-4 aw-scroll">
              <AnimatePresence mode="wait">
                {popTab === 'tasks' && (
                  <motion.div key="tasks" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-col gap-2 pt-2">
              {!taskForm && (
                <button className="p-3 flex items-center gap-2 border-2 border-dashed border-[var(--aw-border)] rounded-[10px] cursor-pointer hover:border-[#22A6F0] transition-colors bg-transparent" onClick={() => setTaskForm(blankTask())}>
                  <i className="fa-solid fa-plus text-[14px] text-[#22A6F0]" />
                  <span className="text-[13px] text-[var(--aw-text-muted)]">افزودن تسک جدید</span>
                </button>
              )}
              {taskForm && (
                <div className="p-3 flex flex-col gap-2" style={cardStyle}>
                  <div className="text-[11px] px-0.5 flex items-center gap-1.5" style={{ color: 'var(--aw-primary)', fontWeight: 700 }}><i className="fa-solid fa-calendar-day text-[10px]" />{toFa(selectedDay || 1)} {JALALI_MONTHS[calMonth]} {toFa(calYear)}</div>
                                    <input className={inputCls} placeholder="عنوان تسک" value={taskForm.title} onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} autoFocus />
                  <div className="grid grid-cols-2 gap-2">
                    <label className="flex flex-col gap-1"><span className="text-[10px] text-[var(--aw-text-muted)] px-0.5" style={{ fontWeight: 600 }}>پرسنل</span><SecPick value={taskForm.assignee} onChange={(v: string) => setTaskForm({ ...taskForm, assignee: v })} options={(personnel || []).map((p: any) => p.name)} placeholder="جستجوی پرسنل…" inputCls={inputCls} /></label>
                    <label className="flex flex-col gap-1"><span className="text-[10px] text-[var(--aw-text-muted)] px-0.5" style={{ fontWeight: 600 }}>ایجنت</span><SecPick value={taskForm.team} onChange={(v: string) => setTaskForm({ ...taskForm, team: v })} options={(agents || []).map((a: any) => a.name)} placeholder="جستجوی ایجنت…" inputCls={inputCls} /></label>
                    <label className="flex flex-col gap-1"><span className="text-[10px] text-[var(--aw-text-muted)] px-0.5" style={{ fontWeight: 600 }}>ساعت</span><TimePicker className={inputCls} value={taskForm.due} onChange={(v: string) => setTaskForm({ ...taskForm, due: v })} /></label>
                    <label className="flex flex-col gap-1"><span className="text-[10px] text-[var(--aw-text-muted)] px-0.5" style={{ fontWeight: 600 }}>اولویت</span><select className={inputCls} value={taskForm.priority} onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })}>
                      <option value="high">فوری</option>
                      <option value="medium">متوسط</option>
                      <option value="low">عادی</option>
                    </select></label>
                    <label className="flex flex-col gap-1"><span className="text-[10px] text-[var(--aw-text-muted)] px-0.5" style={{ fontWeight: 600 }}>وضعیت</span><select className={inputCls} value={taskForm.status} onChange={e => setTaskForm({ ...taskForm, status: e.target.value })}>
                      <option value="todo">انجام نشده</option>
                      <option value="doing">در حال انجام</option>
                      <option value="done">انجام شده</option>
                      <option value="referred">ارجاع شده</option>
                      <option value="stopped">متوقف شده</option>
                      <option value="cancelled">لغو شده</option>
                    </select></label>
                  </div>
                  <textarea className={inputCls} rows={3} placeholder="توضیحات (اختیاری)" value={taskForm.desc || ''} onChange={e => setTaskForm({ ...taskForm, desc: e.target.value })} style={{ resize: 'vertical', minHeight: 64, fontFamily: "'Kamand', 'Vazirmatn', sans-serif" }} />
                  <div className="flex gap-2 justify-end">
                    <button className={btnGhost} onClick={() => setTaskForm(null)}>انصراف</button>
                    <button className={btnPrimary} style={{ background: '#22A6F0' }} onClick={() => saveTask(taskForm)}>ذخیره</button>
                  </div>
                </div>
              )}
              {tasks.filter(t => (taskFilter === 'all' || t.status === taskFilter) && inRange(t.dayNum)).map(task => (
                <div key={task.id} className="p-3 flex flex-col gap-2 group" style={{ ...cardStyle, cursor: 'pointer' }} onClick={(e) => { if (!(e.target as HTMLElement).closest('button')) openTaskDetail(task); }}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <span className="text-[13px] text-[var(--aw-text-primary)]" style={{ fontWeight: 600 }}>{task.title}</span>
                      {task.desc && <p className="text-[11px] text-[var(--aw-text-muted)] mt-1 leading-relaxed">{task.desc}</p>}
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: `${priorityColors[task.priority]}22`, color: priorityColors[task.priority] }}>
                          {priorityLabels[task.priority]}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: `${statusColors[task.status]}22`, color: statusColors[task.status] }}>
                          {statusLabels[task.status]}
                        </span>
                        <span className="text-[10px] text-[var(--aw-text-muted)]">
                          <i className="fa-solid fa-building text-[9px] ml-1" />{task.team}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-[10px] text-[var(--aw-text-muted)]"><i className="fa-regular fa-clock text-[9px] ml-1" />{task.due}</span>
                      <span className="text-[10px] text-[var(--aw-text-muted)]"><i className="fa-solid fa-user text-[9px] ml-1" />{task.assignee}</span>
                    </div>
                  </div>
                  <div className="flex gap-1 justify-end">
                    <button className="w-7 h-7 rounded-md border-none bg-transparent text-[var(--aw-text-muted)] text-[11px] cursor-pointer hover:text-[#22A6F0]" onClick={() => setTaskForm({ ...task })} title="ویرایش"><i className="fa-solid fa-pen" /></button>
                    <button className="w-7 h-7 rounded-md border-none bg-transparent text-[var(--aw-text-muted)] text-[11px] cursor-pointer hover:text-red-400" onClick={() => removeTask(task.id)} title="حذف"><i className="fa-solid fa-trash" /></button>
                  </div>
                </div>
              ))}
              {tasks.filter(t => (taskFilter === 'all' || t.status === taskFilter) && inRange(t.dayNum)).length === 0 && emptyNote}
            </motion.div>
                )}
                {popTab === 'todo' && (
                  <motion.div key="todo" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-col gap-1.5 pt-2">
              {todos.filter(item => inRange(item.dayNum)).map(item => (
                <div
                  key={item.id}
                  className="p-3 flex items-center gap-3 w-full text-right group"
                  style={{ ...cardStyle, background: item.done ? 'var(--aw-bg-hover)' : 'var(--aw-bg-card)', border: `1px solid ${priorityColors[item.priority] || 'var(--aw-border)'}` }}
                >
                  <button
                    onClick={() => toggleTodo(item.id)}
                    className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all border-none cursor-pointer p-0"
                    style={{
                      background: item.done ? priorityColors[item.priority] || '#22A6F0' : 'transparent',
                      border: item.done ? 'none' : `2px solid ${priorityColors[item.priority] || 'var(--aw-border)'}`,
                    }}
                  >
                    {item.done && <i className="fa-solid fa-check text-[10px] text-white" />}
                  </button>
                  <button onClick={() => toggleTodo(item.id)} className="flex-1 min-w-0 border-none bg-transparent cursor-pointer text-right p-0">
                    <span className={`block text-[13px] transition-all truncate ${item.done ? 'line-through text-[var(--aw-text-muted)]' : 'text-[var(--aw-text-primary)]'}`}>
                      {item.text}
                    </span>
                    <span className="flex items-center gap-2 mt-1 text-[10px] flex-wrap">
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full" style={{ background: `${priorityColors[item.priority]}1f`, color: priorityColors[item.priority], fontWeight: 700 }}>
                        <i className="fa-solid fa-flag text-[8px]" />{priorityLabels[item.priority]}
                      </span>
                      {item.myDay && <span className="text-[var(--aw-text-muted)]"><i className="fa-solid fa-sun text-[9px] ml-0.5" />روز من</span>}
                      {item.due && <span className="text-[var(--aw-text-muted)]"><i className="fa-regular fa-calendar text-[9px] ml-0.5" />{item.due}</span>}
                      {item.remind && <span className="text-[var(--aw-text-muted)]"><i className="fa-solid fa-bell text-[9px] ml-0.5" />یادآوری</span>}
                      {item.repeat && item.repeat !== 'بدون تکرار' && <span className="text-[var(--aw-text-muted)]"><i className="fa-solid fa-repeat text-[9px] ml-0.5" />{item.repeat}</span>}
                    </span>
                  </button>
                  <button onClick={() => openTodoDetail(item)} className="w-7 h-7 rounded-md border-none bg-transparent cursor-pointer flex-shrink-0 text-[var(--aw-text-muted)] hover:text-[#22A6F0]" title="جزئیات">
                    <i className="fa-solid fa-circle-info text-[12px]" />
                  </button>
                  <button onClick={() => toggleTodoImportant(item.id)} className="w-7 h-7 rounded-md border-none bg-transparent cursor-pointer flex-shrink-0" title="مهم" style={{ color: item.important ? '#F59E0B' : 'var(--aw-text-muted)' }}>
                    <i className={`${item.important ? 'fa-solid' : 'fa-regular'} fa-star text-[12px]`} />
                  </button>
                  <button onClick={() => removeTodo(item.id)} className="w-7 h-7 rounded-md border-none bg-transparent text-[var(--aw-text-muted)] text-[11px] cursor-pointer hover:text-red-400 flex-shrink-0 md:opacity-0 md:group-hover:opacity-100 transition-opacity" title="حذف"><i className="fa-solid fa-trash" /></button>
                </div>
              ))}
              {todos.filter(item => inRange(item.dayNum)).length === 0 && emptyNote}

              {/* Microsoft To-Do style composer */}
              <div className="mt-2 rounded-[10px] overflow-hidden" style={cardStyle}>
                <div className="flex items-center gap-3 p-3">
                  <i className="fa-solid fa-plus text-[14px]" style={{ color: priorityColors[ntPriority] }} />
                  <input
                    className="flex-1 bg-transparent border-none outline-none text-[13px] text-[var(--aw-text-primary)]"
                    placeholder="افزودن وظیفه..."
                    value={newTodo}
                    onChange={e => setNewTodo(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') addTodo(); }}
                    onFocus={() => setNtOptsOpen(true)}
                    style={{ fontFamily: "'Kamand', 'Vazirmatn', sans-serif" }}
                  />
                  {newTodo.trim() && (
                    <button onClick={addTodo} className="px-3 py-1.5 rounded-lg border-none text-white text-[12px] cursor-pointer flex-shrink-0" style={{ background: '#22A6F0', fontWeight: 700 }}>افزودن</button>
                  )}
                </div>
                {ntOptsOpen && (
                  <div className="px-3 pb-3 flex flex-col gap-2.5 border-t border-[var(--aw-border)] pt-2.5">
                    {/* Quick toggles */}
                    <div className="flex gap-1.5 flex-wrap">
                      <button onClick={() => setNtMyDay(v => !v)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border cursor-pointer text-[11px]" style={ntMyDay ? { background: '#22A6F0', borderColor: '#22A6F0', color: '#fff', fontWeight: 700 } : { background: 'transparent', borderColor: 'var(--aw-border)', color: 'var(--aw-text-secondary)' }}>
                        <i className="fa-solid fa-sun text-[10px]" /> افزودن به روز من
                      </button>
                      <button onClick={() => setNtRemind(v => !v)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border cursor-pointer text-[11px]" style={ntRemind ? { background: '#8B5CF6', borderColor: '#8B5CF6', color: '#fff', fontWeight: 700 } : { background: 'transparent', borderColor: 'var(--aw-border)', color: 'var(--aw-text-secondary)' }}>
                        <i className="fa-solid fa-bell text-[10px]" /> یادآوری
                      </button>
                    </div>
                    {/* Due date — quick chips + free text */}
                    <div className="flex flex-col gap-1.5">
                      <div className="flex gap-1.5 flex-wrap">
                        {['امروز', 'فردا', 'این هفته', 'آخر هفته'].map(d => (
                          <button key={d} onClick={() => setNtDue(d)} className="px-2.5 py-1 rounded-full border cursor-pointer text-[11px]" style={ntDue === d ? { background: '#10B981', borderColor: '#10B981', color: '#fff', fontWeight: 700 } : { background: 'transparent', borderColor: 'var(--aw-border)', color: 'var(--aw-text-secondary)' }}>
                            <i className="fa-regular fa-calendar text-[9px] ml-1" />{d}
                          </button>
                        ))}
                        {ntDue && <button onClick={() => setNtDue('')} className="px-2 py-1 rounded-[10px] border-none cursor-pointer text-[11px] text-[var(--aw-text-muted)]" title="حذف موعد"><i className="fa-solid fa-xmark" /></button>}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <TimePicker className={inputCls} value={ntDue} onChange={(v: string) => setNtDue(v)} />
                        <select className={inputCls} value={ntRepeat} onChange={e => setNtRepeat(e.target.value)}>
                          {['بدون تکرار', 'روزانه', 'روزهای کاری', 'هفتگی', 'ماهانه', 'سالانه'].map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      </div>
                    </div>
                    {/* Priority */}
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-[var(--aw-text-muted)]">فوریت:</span>
                      <div className="flex gap-1.5">
                        {[{ id: 'low', label: 'عادی' }, { id: 'medium', label: 'متوسط' }, { id: 'high', label: 'فوری' }].map(p => {
                          const on = ntPriority === p.id;
                          return (
                            <button key={p.id} onClick={() => setNtPriority(p.id)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border cursor-pointer text-[11px]" style={on ? { background: priorityColors[p.id], borderColor: priorityColors[p.id], color: '#fff', fontWeight: 700 } : { background: 'transparent', borderColor: 'var(--aw-border)', color: 'var(--aw-text-secondary)' }}>
                              <span className="w-2 h-2 rounded-full" style={{ background: on ? '#fff' : priorityColors[p.id] }} /> {p.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
                )}
                {popTab === 'meetings' && (
                  <motion.div key="meetings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-col gap-2 pt-2">
              <button onClick={() => openModal('ایجاد جلسه جدید', <NewMeetingForm onCreate={(m) => setMeetings(prev => [m, ...prev])} />)} className="p-3 flex items-center gap-2 border-2 border-dashed border-[var(--aw-border)] rounded-[10px] cursor-pointer hover:border-[#22A6F0] transition-colors bg-transparent">
                <i className="fa-solid fa-plus text-[14px] text-[#22A6F0]" />
                <span className="text-[13px] text-[var(--aw-text-muted)]">ایجاد جلسه جدید</span>
              </button>
              {meetings.filter(m => inRange(m.dayNum)).map(m => (
                <div key={m.id} className="p-3" style={{ ...cardStyle, cursor: 'pointer' }} onClick={(e) => { if (!(e.target as HTMLElement).closest('button')) openMeetingDetail(m); }}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <span className="text-[13px] text-[var(--aw-text-primary)]" style={{ fontWeight: 600 }}>{m.title}</span>
                      {(m as any).desc && <p className="text-[11px] text-[var(--aw-text-muted)] mt-1 leading-relaxed">{(m as any).desc}</p>}
                      <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                        <span className="text-[11px] text-[var(--aw-text-muted)]"><i className="fa-regular fa-clock text-[9px] ml-1" />{m.time}</span>
                        <span className="text-[11px] text-[var(--aw-text-muted)]"><i className="fa-solid fa-users text-[9px] ml-1" />{m.attendees} نفر</span>
                        <span className="text-[11px] text-[var(--aw-text-muted)]"><i className="fa-solid fa-location-dot text-[9px] ml-1" />{m.location}</span>
                      </div>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full`} style={{
                      background: m.status === 'confirmed' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
                      color: m.status === 'confirmed' ? '#10B981' : '#F59E0B',
                    }}>
                      {m.status === 'confirmed' ? 'تأیید شده' : 'در انتظار'}
                    </span>
                  </div>
                  <div className="flex gap-1 justify-end mt-2">
                    {m.status !== 'confirmed' && (
                      <button className="w-7 h-7 rounded-md border-none bg-transparent text-[var(--aw-text-muted)] text-[11px] cursor-pointer hover:text-[#10B981]" onClick={() => confirmMeeting(m.id)} title="تأیید"><i className="fa-solid fa-check" /></button>
                    )}
                    <button className="w-7 h-7 rounded-md border-none bg-transparent text-[var(--aw-text-muted)] text-[11px] cursor-pointer hover:text-red-400" onClick={() => removeMeeting(m.id)} title="حذف"><i className="fa-solid fa-trash" /></button>
                  </div>
                </div>
              ))}
              {meetings.filter(m => inRange(m.dayNum)).length === 0 && emptyNote}
            </motion.div>
                )}
                {popTab === 'reminders' && (
                  <motion.div key="reminders" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-col gap-2 pt-2">
              <button onClick={() => openModal('یادآوری جدید', <QuickForm submitLabel="ثبت یادآوری" toast="یادآوری جدید ثبت شد" onSubmit={(v) => setReminders(prev => [{ id: Date.now(), title: v.title, when: v.when || '—', type: 'call', repeat: v.repeat || 'یک‌بار' }, ...prev])} fields={[{ key: 'title', label: 'عنوان یادآوری' }, { key: 'when', label: 'زمان', type: 'time' }, { key: 'repeat', label: 'تکرار', type: 'select', options: ['یک‌بار', 'روزانه', 'هفتگی', 'ماهانه'] }]} />)} className="p-3 flex items-center gap-2 border-2 border-dashed border-[var(--aw-border)] rounded-[10px] cursor-pointer hover:border-[#22A6F0] transition-colors bg-transparent">
                <i className="fa-solid fa-plus text-[14px] text-[#22A6F0]" />
                <span className="text-[13px] text-[var(--aw-text-muted)]">ایجاد یادآوری جدید</span>
              </button>
              {reminders.filter(r => inRange(r.dayNum)).map(r => (
                <div key={r.id} className="p-3 flex items-center gap-3 relative" style={{ ...cardStyle, cursor: 'pointer', zIndex: snoozeId === r.id ? 50 : 'auto' }} onClick={(e) => { if (!(e.target as HTMLElement).closest('button')) openReminderDetail(r); }}>
                  <div className="w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(46,134,255,0.15)' }}>
                    <i className={`${REMINDER_TYPE_ICONS[r.type] || 'fa-solid fa-bell'} text-[13px] text-[#22A6F0]`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[13px] text-[var(--aw-text-primary)]" style={{ fontWeight: 600 }}>{r.title}</span>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-[10px] text-[var(--aw-text-muted)]"><i className="fa-regular fa-clock text-[8px] ml-1" />{r.when}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(139,92,246,0.12)', color: '#A78BFA' }}>{r.repeat}</span>
                    </div>
                  </div>
                  <button onClick={() => setSnoozeId(snoozeId === r.id ? null : r.id)} className="w-7 h-7 rounded-md border-none bg-transparent text-[11px] cursor-pointer flex-shrink-0" title="تعویق (Snooze)" style={{ color: snoozeId === r.id ? '#F59E0B' : 'var(--aw-text-muted)' }}><i className="fa-solid fa-clock-rotate-left" /></button>
                  <button onClick={() => openModal('ویرایش یادآوری', <QuickForm submitLabel="ذخیره تغییرات" toast="یادآوری ویرایش شد" initial={{ title: r.title, when: r.when, repeat: r.repeat }} onSubmit={(v) => setReminders(prev => prev.map(x => x.id === r.id ? { ...x, title: v.title, when: v.when || x.when, repeat: v.repeat || x.repeat } : x))} fields={[{ key: 'title', label: 'عنوان یادآوری' }, { key: 'when', label: 'زمان', type: 'time' }, { key: 'repeat', label: 'تکرار', type: 'select', options: ['یک‌بار', 'روزانه', 'هفتگی', 'ماهانه'] }]} />)} className="w-7 h-7 rounded-md border-none bg-transparent text-[var(--aw-text-muted)] text-[11px] cursor-pointer hover:text-[#22A6F0]" title="ویرایش"><i className="fa-solid fa-pen" /></button>
                  <button onClick={() => setReminders(prev => prev.filter(x => x.id !== r.id))} className="w-7 h-7 rounded-md border-none bg-transparent text-[var(--aw-text-muted)] text-[11px] cursor-pointer hover:text-red-400" title="حذف"><i className="fa-solid fa-trash" /></button>
                  {snoozeId === r.id && (
                    <>
                      <div className="fixed inset-0 z-20" onClick={() => setSnoozeId(null)} />
                      <div className="absolute z-30 top-full left-2 mt-1 rounded-[10px] overflow-hidden flex flex-col min-w-[150px]" style={{ background: 'var(--aw-bg-modal)', border: '1px solid var(--aw-border)', boxShadow: '0 8px 24px rgba(0,0,0,0.18)' }}>
                        <div className="px-3 py-2 text-[10px] border-b border-[var(--aw-border)]" style={{ color: 'var(--aw-text-muted)', fontWeight: 700 }}>به تعویق بینداز</div>
                        {['۵ دقیقه دیگر', '۱۵ دقیقه دیگر', '۱ ساعت دیگر', 'امروز عصر', 'فردا صبح'].map(opt => (
                          <button key={opt} onClick={() => snoozeReminder(r.id, opt)} className="px-3 py-2.5 text-right text-[12px] border-none bg-transparent cursor-pointer hover:bg-[var(--aw-bg-card-hover)] flex items-center gap-2" style={{ color: 'var(--aw-text-primary)' }}>
                            <i className="fa-solid fa-clock text-[10px] text-[#F59E0B]" />{opt}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ))}
              {reminders.filter(r => inRange(r.dayNum)).length === 0 && emptyNote}
            </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ========================
// 2. CRM LITE SCREEN (ارتباط با مشتری)
// ========================
const CRM_LITE_TABS = [
  { id: 'contacts', label: 'مخاطبین', icon: 'fa-solid fa-address-book' },
  { id: 'favorite', label: 'علاقه‌مندی‌ها', icon: 'fa-solid fa-heart' },
  { id: 'leads', label: 'سرنخ‌ها', icon: 'fa-solid fa-user-plus' },
  { id: 'followup', label: 'پیگیری مشتریان', icon: 'fa-solid fa-bell' },
  { id: 'activity', label: 'تاریخچه فعالیت', icon: 'fa-solid fa-timeline' },
];

const CRM_KPIS = [];

const CONTACT_SEGMENTS = ['همه', 'مشتری', 'تأمین‌کننده', 'شریک', 'سرنخ'];

const CRM_ACTIVITIES = [];

const LEAD_PIPELINE_STAGES = [
  { id: 'جدید', color: '#3B82F6', icon: 'fa-solid fa-seedling' },
  { id: 'تماس اول', color: '#F59E0B', icon: 'fa-solid fa-phone-volume' },
  { id: 'پیگیری', color: '#8B5CF6', icon: 'fa-solid fa-arrows-rotate' },
];

const MOCK_CONTACTS = [];

const MOCK_LEADS = [];

type FollowupItem = {
  id: number;
  title: string;
  contact: string;
  company: string;
  assignee: string;
  due: string;
  status: 'overdue' | 'upcoming';
  type: 'call' | 'email' | 'meeting' | 'task' | 'invoice';
  state: string;
};

const MOCK_FOLLOWUPS: FollowupItem[] = [];

const FOLLOWUP_TYPE_LABELS: Record<string, string> = {
  call: 'تماس',
  email: 'پیام/ایمیل',
  meeting: 'جلسه',
  task: 'اقدام',
  invoice: 'فاکتور',
};

const leadStatusColors: Record<string, string> = { 'جدید': '#3B82F6', 'تماس اول': '#F59E0B', 'پیگیری': '#8B5CF6', 'ارجاع به فروش': '#10B981', 'برنده': '#22C55E', 'بسته‌شده': '#6B7280' };
const typeIcons: Record<string, string> = { call: 'fa-solid fa-phone', email: 'fa-solid fa-envelope', meeting: 'fa-solid fa-users', task: 'fa-solid fa-list-check' };

function FollowupCard({ item, variant }: { item: FollowupItem; variant: 'overdue' | 'upcoming' }) {
  const { showToast } = useApp();
  const isOverdue = variant === 'overdue';
  const accent = isOverdue ? '#EF4444' : '#3B82F6';
  const accentBg = isOverdue ? 'rgba(239,68,68,0.12)' : 'rgba(59,130,246,0.12)';
  const borderColor = isOverdue ? 'rgba(239,68,68,0.3)' : 'var(--aw-border)';

  const primaryActions = item.type === 'call'
    ? [{ id: 'call', label: 'تماس', icon: 'fa-solid fa-phone' }, { id: 'msg', label: 'پیام', icon: 'fa-solid fa-message' }]
    : item.type === 'email'
    ? [{ id: 'send', label: 'ارسال', icon: 'fa-solid fa-paper-plane' }, { id: 'call', label: 'تماس', icon: 'fa-solid fa-phone' }]
    : item.type === 'meeting'
    ? [{ id: 'join', label: 'مشاهده', icon: 'fa-solid fa-eye' }, { id: 'result', label: 'ثبت نتیجه', icon: 'fa-solid fa-clipboard-check' }]
    : item.type === 'invoice'
    ? [{ id: 'send', label: 'ارسال', icon: 'fa-solid fa-paper-plane' }, { id: 'view', label: 'مشاهده', icon: 'fa-solid fa-file-invoice' }]
    : [{ id: 'do', label: 'انجام', icon: 'fa-solid fa-play' }, { id: 'call', label: 'تماس', icon: 'fa-solid fa-phone' }];

  return (
    <div className="p-3 flex flex-col gap-2.5" style={{ ...cardStyle, borderColor }}>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0" style={{ background: accentBg }}>
          <i className={`${typeIcons[item.type]} text-[14px]`} style={{ color: accent }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <span className="text-[13px] text-[var(--aw-text-primary)]" style={{ fontWeight: 600 }}>{item.title}</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded-full whitespace-nowrap" style={{ background: 'rgba(139,92,246,0.15)', color: '#A78BFA' }}>
              {FOLLOWUP_TYPE_LABELS[item.type]}
            </span>
          </div>
          <div className="text-[11px] text-[var(--aw-text-primary)] mt-1" style={{ fontWeight: 500 }}>
            <i className="fa-solid fa-building text-[9px] ml-1 text-[var(--aw-text-muted)]" />
            {item.company} <span className="text-[var(--aw-text-muted)]">• {item.contact}</span>
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-[10px] text-[var(--aw-text-muted)]"><i className="fa-solid fa-user-tie text-[8px] ml-1" />{item.assignee}</span>
            <span className="text-[10px]" style={{ color: accent }}><i className="fa-regular fa-clock text-[8px] ml-1" />{item.due}</span>
            <span className="text-[10px] text-[var(--aw-text-muted)]">• {item.state}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-[var(--aw-border)]">
        {primaryActions.map(a => (
          <button key={a.id} onClick={() => { (api as any).myCreate('sec_todos', { label: a.label, itemId: item.id, status: 'done', at: new Date().toISOString() }); showToast(a.label + ' انجام شد ✅'); }} className="text-[10px] px-2.5 py-1.5 rounded-lg border-none cursor-pointer text-white" style={{ background: 'linear-gradient(135deg, var(--aw-primary-light), var(--aw-primary-dark))' }}>
            <i className={`${a.icon} text-[9px] ml-1`} />{a.label}
          </button>
        ))}
        <button onClick={() => { (api as any).myCreate('sec_followups', { ...item, status: 'done' }); showToast('پیگیری به‌عنوان «انجام‌شده» ثبت شد ✅'); }} className="text-[10px] px-2.5 py-1.5 rounded-lg border border-[var(--aw-border)] cursor-pointer bg-transparent text-[var(--aw-text-secondary)]">
          <i className="fa-solid fa-check text-[9px] ml-1" />انجام شد
        </button>
        <button onClick={() => { (api as any).myCreate('sec_followups', { ...item, status: 'referred' }); showToast('پیگیری ارجاع داده شد ✅'); }} className="text-[10px] px-2.5 py-1.5 rounded-lg border border-[var(--aw-border)] cursor-pointer bg-transparent text-[var(--aw-text-secondary)]">
          <i className="fa-solid fa-share text-[9px] ml-1" />ارجاع
        </button>
        <button onClick={() => { (api as any).myCreate('sec_followups', { ...item, rescheduled: true }); showToast('زمان پیگیری تغییر کرد ✅'); }} className="text-[10px] px-2.5 py-1.5 rounded-lg border border-[var(--aw-border)] cursor-pointer bg-transparent text-[var(--aw-text-secondary)]">
          <i className="fa-solid fa-calendar text-[9px] ml-1" />تغییر زمان
        </button>
      </div>
    </div>
  );
}

export function SecCrmLiteScreen() {
  const { openModal, showToast, startCall } = useApp();
  const [contacts, setContacts] = useState(MOCK_CONTACTS);
  __usePersist('sec_contacts', contacts, setContacts);
  const [leads, setLeads] = useState(MOCK_LEADS);
  __usePersist('sec_leads', leads, setLeads);
  const [followups, setFollowups] = useState<any[]>(MOCK_FOLLOWUPS);
  __usePersist('sec_followups', followups, setFollowups);
  // crmreal: لاگِ فعالیتِ واقعی (per-user، پایدار) — تایم‌لاینِ CRM از همین می‌آید، نه هاردکد.
  const [activities, setActivities] = useState<any[]>([]);
  __usePersist('sec_activities', activities, setActivities);
  const logActivity = (kind: string, title: string, desc: string) => setActivities((prev: any[]) => [{ id: Date.now(), kind, title, desc, at: Date.now() }, ...prev].slice(0, 200));
  const [tab, setTab] = useState('contacts');
  const [contactQuery, setContactQuery] = useState('');
  const [contactSegment, setContactSegment] = useState('همه');
  const [leadQuery, setLeadQuery] = useState('');
  const [leadStage, setLeadStage] = useState<string>('همه');
  const [activityQuery, setActivityQuery] = useState('');
  const [activityKind, setActivityKind] = useState('همه');
  const toggleFav = (id: number) => setContacts(prev => prev.map(c => c.id === id ? { ...c, fav: !(c as any).fav } : c));

  const filteredContacts = contacts.filter(c => {
    if (contactSegment !== 'همه' && c.type !== contactSegment) return false;
    if (!contactQuery.trim()) return true;
    const q = contactQuery.trim();
    return c.name.includes(q) || c.company.includes(q) || c.phone.includes(q);
  });

  const filteredLeads = leads.filter(l => {
    if (leadStage !== 'همه' && l.status !== leadStage) return false;
    if (!leadQuery.trim()) return true;
    const q = leadQuery.trim();
    return l.name.includes(q) || l.contact.includes(q);
  });

  const searchInputCls = "w-full bg-[var(--aw-bg-input)] border border-[var(--aw-border)] rounded-[10px] pr-9 pl-3 py-2 text-[12px] text-[var(--aw-text-primary)] outline-none focus:border-[#22A6F0]";

  const AVATAR_GRADS = [
    'linear-gradient(135deg, #8B5CF6, #6D28D9)',
    'linear-gradient(135deg, #2DD4BF, #0D9488)',
    'linear-gradient(135deg, #A78BFA, #7C3AED)',
    'linear-gradient(135deg, #60A5FA, #2563EB)',
    'linear-gradient(135deg, #F472B6, #DB2777)',
    'linear-gradient(135deg, #34D399, #059669)',
    'linear-gradient(135deg, #FBBF24, #D97706)',
    'linear-gradient(135deg, #F87171, #DC2626)',
  ];
  const avatarGrad = (str: string) => {
    let h = 0;
    for (let i = 0; i < (str || '').length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
    return AVATAR_GRADS[h % AVATAR_GRADS.length];
  };

  const renderContact = (c: any) => (
    <div key={c.id} className="p-3 flex flex-col gap-2" style={cardStyle}>
      <div className="flex items-center gap-3">
        <div className="relative flex-shrink-0">
          <LetterAvatar name={c.name} size={44} radius={10} />
          <span className="absolute bottom-0 left-0 w-3 h-3 rounded-full border-2 border-[var(--aw-bg-card)]" style={{ background: c.active ? '#10B981' : '#94a3b8' }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[13px] text-[var(--aw-text-primary)]" style={{ fontWeight: 600 }}>{c.name}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(139,92,246,0.12)', color: '#A78BFA' }}>{c.type}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(46,134,255,0.12)', color: '#22A6F0' }}><i className="fa-solid fa-star text-[8px] ml-0.5" />{c.tier}</span>
          </div>
          <div className="text-[11px] text-[var(--aw-text-muted)] mt-0.5">
            <i className="fa-solid fa-building text-[9px] ml-1" />{c.company} <span>• {c.role}</span>
          </div>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className="text-[10px] text-[var(--aw-text-muted)]"><i className="fa-solid fa-phone text-[8px] ml-1" />{c.phone}</span>
            <span className="text-[10px] text-[var(--aw-text-muted)]"><i className="fa-regular fa-clock text-[8px] ml-1" />{c.lastContact}</span>
          </div>
          {c.address && <div className="text-[10px] text-[var(--aw-text-muted)] mt-1"><i className="fa-solid fa-location-dot text-[8px] ml-1 text-[#22A6F0]" />{c.address}</div>}
        </div>
        <button onClick={() => toggleFav(c.id)} className="w-8 h-8 rounded-full border-none bg-transparent cursor-pointer flex-shrink-0 self-start" title="علاقه‌مندی" style={{ color: c.fav ? '#EF4444' : 'var(--aw-text-muted)' }}>
          <i className={`${c.fav ? 'fa-solid' : 'fa-regular'} fa-heart text-[14px]`} />
        </button>
      </div>
      <div className="flex gap-1.5 pt-2 border-t border-[var(--aw-border)]">
        {[
          { icon: 'fa-solid fa-phone', color: '#22A6F0', label: 'تماس' },
          { icon: 'fa-solid fa-comment-sms', color: '#06b6d4', label: 'پیامک' },
          { icon: 'fa-brands fa-whatsapp', color: '#16a34a', label: 'واتساپ' },
          { icon: 'fa-solid fa-envelope', color: '#3b82f6', label: 'ایمیل' },
          { icon: 'fa-solid fa-note-sticky', color: '#f59e0b', label: 'یادداشت' },
        ].map(a => (
          <button key={a.label} onClick={() => { const ph = String((c as any).phone || '').replace(/[^\d]/g, ''); const nm = (c as any).name || 'مخاطب'; if (a.label === 'تماس') { logActivity('call', 'تماس با ' + nm, ph); window.location.href = 'tel:' + ph; } else if (a.label === 'پیامک') { logActivity('sms', 'پیامک به ' + nm, ph); window.location.href = 'sms:' + ph; } else if (a.label === 'واتساپ') { logActivity('whatsapp', 'واتساپ به ' + nm, ''); window.open('https://wa.me/' + (ph.startsWith('0') ? '98' + ph.slice(1) : ph), '_blank'); } else if (a.label === 'ایمیل') { logActivity('email', 'ایمیل به ' + nm, (c as any).email || ''); window.location.href = 'mailto:' + ((c as any).email || ''); } else { logActivity('note', 'یادداشت برای ' + nm, ''); showToast('یادداشت ثبت شد'); } }} className="flex-1 py-1.5 rounded-md border-none cursor-pointer flex items-center justify-center gap-1 text-[10px]" style={{ background: `${a.color}15`, color: a.color, fontWeight: 600 }}>
            <i className={`${a.icon} text-[10px]`} />{a.label}
          </button>
        ))}
      </div>
    </div>
  );
  const favContacts = contacts.filter((c: any) => c.fav);

  // crmreal: KPIهای واقعی از شمارشِ دادهٔ واقعی + تایم‌لاین از لاگِ فعالیتِ واقعی
  const CRM_KPIS = [
    { color: '#3B82F6', icon: 'fa-solid fa-address-book', value: toFa(contacts.length), label: 'مخاطبین' },
    { color: '#8B5CF6', icon: 'fa-solid fa-user-plus', value: toFa(leads.length), label: 'سرنخ‌ها' },
    { color: '#F59E0B', icon: 'fa-solid fa-arrows-rotate', value: toFa(followups.filter((f: any) => f.status !== 'done').length), label: 'پیگیری فعال' },
    { color: '#10B981', icon: 'fa-solid fa-handshake', value: toFa(contacts.filter((c: any) => c.type === 'مشتری').length), label: 'مشتریان' },
  ];
  const __actMeta: Record<string, { color: string; icon: string }> = { call: { color: '#10B981', icon: 'fa-solid fa-phone' }, sms: { color: '#3B82F6', icon: 'fa-solid fa-comment-sms' }, email: { color: '#F59E0B', icon: 'fa-solid fa-envelope' }, whatsapp: { color: '#22C55E', icon: 'fa-brands fa-whatsapp' }, meeting: { color: '#8B5CF6', icon: 'fa-solid fa-users' }, note: { color: '#6B7280', icon: 'fa-solid fa-note-sticky' } };
  const CRM_ACTIVITIES = [...activities].sort((a: any, b: any) => (b.at || 0) - (a.at || 0)).map((a: any) => ({ id: a.id, kind: a.kind || 'note', title: a.title || 'فعالیت', desc: a.desc || '', when: a.at ? new Date(a.at).toLocaleDateString('fa-IR') : '', color: (__actMeta[a.kind] || __actMeta.note).color, icon: (__actMeta[a.kind] || __actMeta.note).icon }));
  return (
    <div className="flex flex-col h-full">
      {/* KPI strip */}
      <div className="px-4 pt-3">
        <div className="grid grid-cols-4 gap-1.5">
          {CRM_KPIS.map((k, i) => (
            <div key={i} className="p-2 flex flex-col items-center text-center" style={{ ...cardStyle, background: `linear-gradient(135deg, ${k.color}15, ${k.color}05)` }}>
              <i className={`${k.icon} text-[12px] mb-1`} style={{ color: k.color }} />
              <span className="text-[14px]" style={{ fontWeight: 800, color: k.color }}>{k.value}</span>
              <span className="text-[9px] text-[var(--aw-text-muted)] mt-0.5">{k.label}</span>
            </div>
          ))}
        </div>
      </div>

      <TabBar tabs={CRM_LITE_TABS} active={tab} onChange={setTab} />
      <div className="flex-1 overflow-y-auto px-4 pb-24 aw-scroll">
        <AnimatePresence mode="wait">
          {tab === 'contacts' && (
            <motion.div key="contacts" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-col gap-2 pt-2">
              <div className="relative">
                <i className="fa-solid fa-magnifying-glass absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-[var(--aw-text-muted)]" />
                <input value={contactQuery} onChange={e => setContactQuery(e.target.value)} placeholder="جستجو نام، شرکت یا شماره..." className={searchInputCls} />
              </div>
              <div className="flex gap-1.5 overflow-x-auto aw-scroll pb-1">
                {CONTACT_SEGMENTS.map(s => (
                  <button
                    key={s}
                    onClick={() => setContactSegment(s)}
                    className="px-2.5 py-1 rounded-full text-[11px] border cursor-pointer whitespace-nowrap transition-all"
                    style={contactSegment === s
                      ? { background: 'linear-gradient(135deg, var(--aw-primary-light), var(--aw-primary-dark))', borderColor: '#22A6F0', color: 'white', fontWeight: 700 }
                      : { background: 'transparent', borderColor: 'var(--aw-border)', color: 'var(--aw-text-secondary)', fontWeight: 600 }}
                  >{s}</button>
                ))}
              </div>
              <button onClick={() => openModal('افزودن مخاطب جدید', <QuickForm onSubmit={(v) => { setContacts(prev => [{ id: Date.now(), name: v.name, phone: v.phone || '', email: '', company: v.company || '', role: '', type: v.seg || 'مشتری', tier: 'عادی', address: v.address || '', lat: (v as any).lat, lng: (v as any).lng, lastContact: 'امروز' } as any, ...prev]); logActivity('note', 'مخاطب جدید: ' + (v.name || ''), v.company || ''); }} submitLabel="افزودن مخاطب" toast="مخاطب جدید افزوده شد" fields={[{ key: 'name', label: 'نام مخاطب' }, { key: 'phone', label: 'شماره تماس', type: 'tel' }, { key: 'company', label: 'شرکت / سازمان' }, { key: 'address', label: 'آدرس', type: 'textarea' }, { key: 'seg', label: 'دسته', type: 'select', options: ['مشتری', 'تأمین‌کننده', 'همکار'] }]} />)} className="p-2.5 flex items-center justify-center gap-2 border-2 border-dashed border-[var(--aw-border)] rounded-[12px] cursor-pointer bg-transparent hover:border-[#22A6F0] transition-colors text-[12px] text-[#22A6F0]">
                <i className="fa-solid fa-user-plus" />افزودن مخاطب جدید
              </button>

              {filteredContacts.map(renderContact)}
              {filteredContacts.length === 0 && (
                <div className="p-6 flex flex-col items-center gap-2 text-[var(--aw-text-muted)]" style={cardStyle}>
                  <i className="fa-solid fa-magnifying-glass text-[20px]" style={{ opacity: 0.4 }} />
                  <span className="text-[12px]">مخاطبی یافت نشد</span>
                </div>
              )}
            </motion.div>
          )}
          {tab === 'favorite' && (
            <motion.div key="favorite" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-col gap-2 pt-2">
              {favContacts.length > 0 ? favContacts.map(renderContact) : (
                <div className="p-8 flex flex-col items-center gap-3 text-center" style={cardStyle}>
                  <i className="fa-regular fa-heart text-[28px] text-[#EF4444]" style={{ opacity: 0.5 }} />
                  <span className="text-[13px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>هنوز علاقه‌مندی‌ای ندارید</span>
                  <span className="text-[11px] text-[var(--aw-text-muted)]">روی آیکون قلب کنار هر مخاطب بزنید تا اینجا اضافه شود</span>
                </div>
              )}
            </motion.div>
          )}
          {tab === 'leads' && (
            <motion.div key="leads" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-col gap-2 pt-2">
              {/* Pipeline summary */}
              <div className="grid grid-cols-3 gap-1.5">
                {LEAD_PIPELINE_STAGES.map(s => {
                  const items = leads.filter(l => l.status === s.id);
                  return (
                    <button
                      key={s.id}
                      onClick={() => setLeadStage(leadStage === s.id ? 'همه' : s.id)}
                      className="p-2.5 flex flex-col items-center text-center cursor-pointer transition-all"
                      style={{ ...cardStyle, background: leadStage === s.id ? `${s.color}22` : `linear-gradient(135deg, ${s.color}10, ${s.color}03)`, borderColor: leadStage === s.id ? s.color : 'var(--aw-border)' }}
                    >
                      <i className={`${s.icon} text-[12px] mb-1`} style={{ color: s.color }} />
                      <span className="text-[14px]" style={{ fontWeight: 800, color: s.color }}>{toFa(String(items.length))}</span>
                      <span className="text-[10px] text-[var(--aw-text-muted)] mt-0.5">{s.id}</span>
                    </button>
                  );
                })}
              </div>

              <div className="relative">
                <i className="fa-solid fa-magnifying-glass absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-[var(--aw-text-muted)]" />
                <input value={leadQuery} onChange={e => setLeadQuery(e.target.value)} placeholder="جستجو سرنخ..." className={searchInputCls} />
              </div>

              <button onClick={() => openModal('ثبت سرنخ جدید', <QuickForm onSubmit={(v) => { setLeads(prev => [{ id: Date.now(), name: v.name, contact: v.contact || '', phone: v.phone || '', source: v.source || 'سایر', status: 'جدید', value: '—', date: 'امروز' } as any, ...prev]); logActivity('note', 'سرنخ جدید: ' + (v.name || ''), v.source || ''); }} submitLabel="ثبت سرنخ" toast="سرنخ جدید ثبت شد" fields={[{ key: 'name', label: 'عنوان سرنخ' }, { key: 'contact', label: 'نام تماس' }, { key: 'phone', label: 'شماره تماس', type: 'tel' }, { key: 'source', label: 'منبع', type: 'select', options: ['تماس ورودی', 'وب‌سایت', 'معرفی', 'شبکه اجتماعی'] }]} />)} className="p-2.5 flex items-center justify-center gap-2 border-2 border-dashed border-[var(--aw-border)] rounded-[12px] cursor-pointer bg-transparent hover:border-[#22A6F0] transition-colors text-[12px] text-[#22A6F0]">
                <i className="fa-solid fa-plus" />ثبت سرنخ جدید
              </button>

              {filteredLeads.map(l => (
                <div key={l.id} className="p-3" style={cardStyle}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <span className="text-[13px] text-[var(--aw-text-primary)]" style={{ fontWeight: 600 }}>{l.name}</span>
                      <div className="text-[11px] text-[var(--aw-text-muted)] mt-0.5"><i className="fa-solid fa-user text-[9px] ml-1" />{l.contact}</div>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: `${leadStatusColors[l.status]}22`, color: leadStatusColors[l.status] }}>{l.status}</span>
                        <span className="text-[10px] text-[var(--aw-text-muted)]"><i className="fa-solid fa-bullseye text-[8px] ml-1" />{l.source}</span>
                        <span className="text-[10px] text-[#10B981]"><i className="fa-solid fa-coins text-[8px] ml-1" />{l.value}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-[10px] text-[var(--aw-text-muted)]">{l.date}</span>
                    </div>
                  </div>
                  <div className="flex gap-1.5 mt-2 pt-2 border-t border-[var(--aw-border)]">
                    <button onClick={() => startCall(l.name, 'سرنخ', 'aw-bg-cyan', l.name.slice(0,2), l.contact || '')} className="flex-1 text-[10px] py-1.5 rounded-md border-none cursor-pointer text-white" style={{ background: 'linear-gradient(135deg, var(--aw-primary-light), var(--aw-primary-dark))', fontWeight: 600 }}>
                      <i className="fa-solid fa-phone text-[9px] ml-1" />تماس
                    </button>
                    <button onClick={() => { setLeads(prev => prev.map((x: any) => x.id === l.id ? { ...x, status: 'ارجاع به فروش' } : x)); try { (api as any).myCreate('sec_referrals', { id: Date.now(), title: l.name, contact: l.contact || '', phone: (l as any).phone || '', source: l.source || '', target: 'sales', at: new Date().toISOString(), status: 'new' }); } catch (_e) {} logActivity('note', 'ارجاعِ سرنخ به فروش: ' + l.name, l.contact || ''); showToast('سرنخ به تیم فروش ارجاع شد ✅'); }} className="flex-1 text-[10px] py-1.5 rounded-md border-none cursor-pointer text-white" style={{ background: 'linear-gradient(135deg, var(--aw-primary-light), var(--aw-primary-dark))', fontWeight: 600 }}>
                      <i className="fa-solid fa-share text-[9px] ml-1" />ارجاع به فروش
                    </button>
                    <button onClick={() => { setLeads(prev => prev.map((x: any) => { if (x.id !== l.id) return x; const stages = LEAD_PIPELINE_STAGES.map(s => s.id); const ci = stages.indexOf(x.status); const nx = ci < 0 ? stages[0] : (ci < stages.length - 1 ? stages[ci + 1] : x.status); return { ...x, status: nx }; })); showToast('سرنخ به مرحله بعد منتقل شد ✅'); }} className="text-[10px] px-2.5 py-1.5 rounded-[10px] border border-[var(--aw-border)] cursor-pointer bg-transparent text-[var(--aw-text-secondary)]" style={{ fontWeight: 600 }}>
                      <i className="fa-solid fa-arrow-right text-[9px] ml-1" />مرحله بعد
                    </button>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
          {tab === 'followup' && (
            <motion.div key="followup" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-col gap-2 pt-2">
              <SectionHeader title="عقب‌افتاده‌ها" icon="fa-solid fa-exclamation-triangle" count={followups.filter((f: any) => f.status === 'overdue').length} />
              {followups.filter((f: any) => f.status === 'overdue').map(f => (
                <FollowupCard key={f.id} item={f} variant="overdue" />
              ))}
              <SectionHeader title="پیش رو" icon="fa-solid fa-clock" count={followups.filter((f: any) => f.status === 'upcoming').length} />
              {followups.filter((f: any) => f.status === 'upcoming').map(f => (
                <FollowupCard key={f.id} item={f} variant="upcoming" />
              ))}
            </motion.div>
          )}
          {tab === 'activity' && (
            <motion.div key="activity" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-col gap-2 pt-2">
              <div className="relative">
                <i className="fa-solid fa-magnifying-glass absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-[var(--aw-text-muted)]" />
                <input value={activityQuery} onChange={e => setActivityQuery(e.target.value)} placeholder="جستجو در فعالیت‌ها..." className={searchInputCls} />
              </div>
              <div className="flex gap-1.5 overflow-x-auto aw-scroll pb-1">
                {['همه', 'تماس', 'پیامک', 'ایمیل', 'واتساپ', 'جلسه', 'یادداشت'].map(f => (
                  <button key={f} onClick={() => setActivityKind(f)} className="px-2.5 py-1 rounded-full text-[11px] border cursor-pointer whitespace-nowrap" style={{ fontWeight: 600, borderColor: activityKind === f ? 'var(--aw-primary)' : 'var(--aw-border)', background: activityKind === f ? 'var(--aw-primary)' : 'transparent', color: activityKind === f ? '#fff' : 'var(--aw-text-secondary)' }}>
                    {f}
                  </button>
                ))}
              </div>
              <div className="relative pr-4 mt-1">
                <div className="absolute right-[7px] top-0 bottom-0 w-px bg-[var(--aw-border)]" />
                {CRM_ACTIVITIES.filter(a => activityKind === 'همه' || a.kind === ({ 'تماس': 'call', 'پیامک': 'sms', 'ایمیل': 'email', 'واتساپ': 'whatsapp', 'جلسه': 'meeting', 'یادداشت': 'note' } as any)[activityKind]).filter(a => !activityQuery.trim() || a.title.includes(activityQuery.trim()) || a.desc.includes(activityQuery.trim())).map(a => (
                  <div key={a.id} className="relative pb-3">
                    <span className="absolute right-[-13px] top-1 w-3.5 h-3.5 rounded-full border-2 border-[var(--aw-bg-card)] flex-shrink-0" style={{ background: a.color }} />
                    <div className="p-2.5 mr-2" style={cardStyle}>
                      <div className="flex items-start gap-2">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: `${a.color}22` }}>
                          <i className={`${a.icon} text-[11px]`} style={{ color: a.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-[12px] text-[var(--aw-text-primary)]" style={{ fontWeight: 600 }}>{a.title}</span>
                            <span className="text-[10px] text-[var(--aw-text-muted)] whitespace-nowrap">{a.when}</span>
                          </div>
                          <div className="text-[11px] text-[var(--aw-text-secondary)] mt-0.5 leading-relaxed">{a.desc}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ========================
// 3. REPORTS SCREEN (گزارش عملکرد منشی)
// ========================
const PERF_STATS = [];
const PERF_PERIOD_TABS = [
  { id: 'daily', label: 'روزانه', icon: 'fa-solid fa-calendar-day' },
  { id: 'weekly', label: 'هفتگی', icon: 'fa-solid fa-calendar-week' },
  { id: 'monthly', label: 'ماهانه', icon: 'fa-solid fa-calendar' },
];

const PERF_RECENT_ACTIVITIES = [];

const PERF_RECENT_MEETINGS = [];

const PERF_PERIODIC_REPORTS = [
  { id: 'daily', label: 'گزارش روزانه', desc: 'خلاصه فعالیت‌های امروز', icon: 'fa-solid fa-calendar-day', color: '#10B981' },
  { id: 'weekly', label: 'گزارش هفتگی', desc: 'عملکرد ۷ روز گذشته', icon: 'fa-solid fa-calendar-week', color: '#3B82F6' },
  { id: 'monthly', label: 'گزارش ماهانه', desc: 'تحلیل عملکرد ماه جاری', icon: 'fa-solid fa-calendar', color: '#8B5CF6' },
];

const PERF_ALERTS = [];

const ALERT_SEVERITY: Record<string, { bg: string; color: string; border: string; label: string }> = {
  high: { bg: 'rgba(239,68,68,0.12)', color: '#EF4444', border: 'rgba(239,68,68,0.3)', label: 'فوری' },
  medium: { bg: 'rgba(245,158,11,0.12)', color: '#F59E0B', border: 'rgba(245,158,11,0.3)', label: 'متوسط' },
  low: { bg: 'rgba(59,130,246,0.12)', color: '#3B82F6', border: 'rgba(59,130,246,0.3)', label: 'اطلاع' },
};

function ViewAllButton({ label = 'مشاهده همه', onClick }: { label?: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="w-full mt-2 py-2 rounded-lg border border-dashed border-[var(--aw-border)] cursor-pointer bg-transparent text-[11px] text-[var(--aw-text-muted)] hover:text-[#22A6F0] hover:border-[#22A6F0] transition-colors">
      {label} <i className="fa-solid fa-chevron-left text-[9px] mr-1" />
    </button>
  );
}

// ── On-Demand Reports: summary activity of other agents + organization staff ──
const ONDEMAND_AGENTS = [];
const ONDEMAND_STAFF = [];
const ONDEMAND_RANGES = ['امروز', 'این هفته', 'این ماه'];

function OnDemandReportContent({ src, kind }: { src: any; kind: 'agent' | 'staff' }) {
  const { showToast, closeModal } = useApp();
  const [range, setRange] = useState(ONDEMAND_RANGES[0]);
  const printReport = () => {
    const today = new Date().toLocaleDateString('fa-IR');
    const doc = `<!DOCTYPE html><html dir="rtl" lang="fa"><head><meta charset="utf-8"><title>گزارش ${src.name}</title>
    <style>*{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}body{font-family:'Vazirmatn UI',system-ui,sans-serif;color:#0f172a;margin:0;font-size:13px}
    .band{background:linear-gradient(120deg,#be185d,#ec4899);color:#fff;padding:24px 40px;display:flex;justify-content:space-between;align-items:center}
    .logo{width:44px;height:44px;border-radius:12px;background:rgba(255,255,255,.16);border:1.5px solid rgba(255,255,255,.5);display:inline-flex;align-items:center;justify-content:center;font-size:20px;font-weight:800;margin-left:12px}
    .b-title{font-size:20px;font-weight:800}.b-title small{display:block;font-size:11px;opacity:.9;font-weight:400}
    .b-meta{text-align:left;font-size:11px;line-height:1.9}
    .sheet{padding:26px 40px}h2{font-size:14px;color:#be185d;border-right:4px solid #ec4899;padding-right:8px;margin:22px 0 12px}
    .kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}.kpi{border:1px solid #e2e8f0;border-top:3px solid #ec4899;border-radius:10px;padding:12px}.kpi-l{font-size:11px;color:#64748b}.kpi-v{font-size:19px;font-weight:800;margin-top:4px}
    ul{padding:0;margin:0;list-style:none}li{border:1px solid #e2e8f0;border-radius:9px;padding:10px 12px;margin-bottom:7px;font-size:12px;display:flex;gap:8px}li::before{content:'▸';color:#ec4899}
    .foot{margin:30px 40px 0;padding-top:12px;border-top:1px solid #e2e8f0;font-size:10px;color:#94a3b8;display:flex;justify-content:space-between}
    @media print{@page{margin:0}}</style></head><body>
    <div class="band"><div><span class="logo">N</span><span class="b-title">${src.name}<small>${kind === 'agent' ? 'عامل هوشمند' : 'نیروی سازمان — ' + src.role}</small></span></div>
    <div class="b-meta"><div>تاریخ: <b>${today}</b></div><div>بازه: <b>${range}</b></div></div></div>
    <div class="sheet"><h2>شاخص‌های فعالیت</h2><div class="kpis">${src.metrics.map((m: any) => `<div class="kpi"><div class="kpi-l">${m.l}</div><div class="kpi-v">${m.v}</div></div>`).join('')}</div>
    <h2>فعالیت‌های اخیر</h2><ul>${src.acts.map((a: string) => `<li>${a}</li>`).join('')}</ul></div>
    <div class="foot"><span>Neura — گزارش درخواستی</span><span>${today}</span></div></body></html>`;
    const w = window.open('', '_blank'); if (!w) { showToast('پنجره مسدود شد'); return; }
    w.document.open(); w.document.write(doc); w.document.close(); w.focus();
    setTimeout(() => { try { w.print(); } catch {} }, 600);
    showToast('گزارش آماده چاپ/PDF شد');
  };
  return (
    <div className="flex flex-col gap-3 p-1">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-[12px] flex items-center justify-center flex-shrink-0" style={{ background: `${src.color}22`, color: src.color }}>
          {kind === 'agent' ? <i className={src.icon + ' text-[17px]'} /> : <span className="text-[16px]" style={{ fontWeight: 800 }}>{src.name.charAt(0)}</span>}
        </div>
        <div className="flex-1">
          <div className="text-[14px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>{src.name}</div>
          <div className="text-[11px] text-[var(--aw-text-muted)]">{kind === 'agent' ? 'عامل هوشمند' : src.role}</div>
        </div>
        <select value={range} onChange={e => setRange(e.target.value)} className="text-[11px] rounded-lg border cursor-pointer px-2 py-1.5 outline-none"
          style={{ background: 'var(--aw-bg-input)', borderColor: 'var(--aw-border)', color: 'var(--aw-text-secondary)', fontFamily: "'Kamand','Vazirmatn',sans-serif", fontWeight: 600 }}>
          {ONDEMAND_RANGES.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {src.metrics.map((m: any, i: number) => (
          <div key={i} className="p-2.5 rounded-[10px]" style={{ ...cardStyle, borderTop: `2.5px solid ${src.color}` }}>
            <div className="text-[10px] text-[var(--aw-text-muted)]">{m.l}</div>
            <div className="text-[17px] text-[var(--aw-text-primary)] mt-0.5" style={{ fontWeight: 800 }}>{m.v}</div>
          </div>
        ))}
      </div>
      <div>
        <div className="text-[12px] text-[var(--aw-text-primary)] mb-1.5" style={{ fontWeight: 700 }}>فعالیت‌های اخیر</div>
        <div className="flex flex-col gap-1.5">
          {src.acts.map((a: string, i: number) => (
            <div key={i} className="p-2.5 flex items-center gap-2.5 rounded-[10px]" style={cardStyle}>
              <i className="fa-solid fa-circle-check text-[11px]" style={{ color: src.color }} />
              <span className="text-[11.5px] text-[var(--aw-text-secondary)]">{a}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="flex gap-2 mt-1">
        <button onClick={printReport} className="flex-1 rounded-[10px] border-none cursor-pointer text-white py-2.5 text-[12.5px]" style={{ background: 'var(--aw-primary)', fontWeight: 700, fontFamily: "'Kamand','Vazirmatn',sans-serif" }}>
          <i className="fa-solid fa-file-pdf text-[11px] ml-1.5" />خروجی PDF
        </button>
        <button onClick={closeModal} className="rounded-[10px] border cursor-pointer px-4 py-2.5 text-[12.5px]" style={{ background: 'var(--aw-bg-card)', borderColor: 'var(--aw-border)', color: 'var(--aw-text-secondary)', fontWeight: 700 }}>بستن</button>
      </div>
    </div>
  );
}

function OnDemandReports() {
  const { openModal } = useApp();
  const [tab, setTab] = useState<'agents' | 'staff'>('agents');
  const list = tab === 'agents' ? ONDEMAND_AGENTS : ONDEMAND_STAFF;
  return (
    <>
      <SectionHeader title="گزارش‌های درخواستی" icon="fa-solid fa-file-arrow-down" />
      <div className="flex gap-1.5 mt-1 mb-2">
        {([{ id: 'agents', label: 'عامل‌ها', icon: 'fa-solid fa-robot' }, { id: 'staff', label: 'نیروهای سازمان', icon: 'fa-solid fa-users' }] as const).map(t => {
          const on = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)} className="flex-1 py-2 rounded-[10px] border cursor-pointer text-[12px] flex items-center justify-center gap-1.5 transition-all"
              style={on ? { background: 'var(--aw-primary-bg)', borderColor: 'color-mix(in srgb, var(--aw-primary) 40%, transparent)', color: 'var(--aw-primary)', fontWeight: 700 } : { background: 'var(--aw-eu-nav-bg)', borderColor: 'var(--aw-eu-nav-border)', color: 'var(--aw-text-secondary)', fontWeight: 500 }}>
              <i className={`${t.icon} text-[11px]`} />{t.label}
            </button>
          );
        })}
      </div>
      <div className="flex flex-col gap-1.5">
        {list.map((r: any) => (
          <button key={r.id} onClick={() => openModal('گزارش فعالیت — ' + r.name, <OnDemandReportContent src={r} kind={tab === 'agents' ? 'agent' : 'staff'} />)}
            className="p-3 flex items-center gap-3 border-none cursor-pointer w-full text-right" style={cardStyle}>
            <div className="w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0" style={{ background: r.color + '22', color: r.color }}>
              {tab === 'agents' ? <i className={r.icon + ' text-[13px]'} /> : <span className="text-[13px]" style={{ fontWeight: 800 }}>{r.name.charAt(0)}</span>}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[12px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>{r.name}</div>
              <div className="text-[10px] text-[var(--aw-text-muted)]">{tab === 'agents' ? 'خلاصه عملکرد و فعالیت' : r.role}</div>
            </div>
            <i className="fa-solid fa-file-arrow-down text-[12px] flex-shrink-0" style={{ color: r.color }} />
          </button>
        ))}
      </div>
    </>
  );
}

export function SecPerformanceScreen() {
  const { setAdminScreen, setChatTab } = useApp();
  const [period, setPeriod] = useState('daily');
  const [statFilter, setStatFilter] = useState<string | null>(null);
  const [cat, setCat] = useState(() => { try { const t = localStorage.getItem('sec-report-tab'); if (t) { localStorage.removeItem('sec-report-tab'); return t; } } catch {} return 'meetings'; });
  const filteredActivities = statFilter ? PERF_RECENT_ACTIVITIES.filter(a => a.kind === statFilter) : PERF_RECENT_ACTIVITIES;
  return (
    <div className="flex flex-col h-full">
      {/* Category tabs */}
      <div className="flex gap-1.5 px-4 pt-3">
        {[{id:'meetings',label:'جلسات',icon:'fa-solid fa-users'},{id:'tasks',label:'تسک‌ها',icon:'fa-solid fa-list-check'},{id:'petty',label:'تنخواه',icon:'fa-solid fa-wallet'}].map(t => {
          const on = cat === t.id;
          return (
            <button key={t.id} onClick={() => setCat(t.id)}
              className="flex-1 py-2 rounded-[10px] border cursor-pointer text-[12px] flex items-center justify-center gap-1.5 transition-all"
              style={on ? { background: 'var(--aw-primary-bg)', borderColor: 'color-mix(in srgb, var(--aw-primary) 40%, transparent)', color: 'var(--aw-primary)', fontWeight: 700, backdropFilter: 'blur(20px) saturate(1.4)', WebkitBackdropFilter: 'blur(20px) saturate(1.4)' } : { background: 'var(--aw-eu-nav-bg)', borderColor: 'var(--aw-eu-nav-border)', color: 'var(--aw-text-secondary)', fontWeight: 500, backdropFilter: 'blur(20px) saturate(1.4)', WebkitBackdropFilter: 'blur(20px) saturate(1.4)' }}>
              <i className={`${t.icon} text-[11px]`} /> {t.label}
            </button>
          );
        })}
      </div>
      {cat === 'petty' ? <SecDailyFinanceScreen /> : (
      <div className="flex-1 overflow-y-auto px-4 pb-24 aw-scroll">
        {cat === 'tasks' && (<>
        {/* Stats Grid — act as filters */}
        <div className="grid grid-cols-2 gap-2 mt-3">
          {PERF_STATS.map((stat, i) => {
            const on = statFilter === stat.kind;
            return (
            <motion.button
              key={i}
              onClick={() => setStatFilter(on ? null : stat.kind)}
              className="p-3 flex items-center gap-3 border-none cursor-pointer text-right transition-all min-h-[74px]"
              style={{ ...cardStyle, outline: on ? `2px solid ${stat.color}` : 'none', background: on ? stat.bg : (cardStyle as any).background }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <div className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0" style={{ background: stat.bg }}>
                <i className={`${stat.icon} text-[16px]`} style={{ color: stat.color }} />
              </div>
              <div className="min-w-0">
                <div className="text-[20px] text-[var(--aw-text-primary)]" style={{ fontWeight: 800 }}>{stat.values[period]}</div>
                <div className="text-[10px] text-[var(--aw-text-muted)] truncate">{stat.label}</div>
              </div>
              {on && <i className="fa-solid fa-filter text-[10px] mr-auto" style={{ color: stat.color }} />}
            </motion.button>
            );
          })}
        </div>

        {/* Recent Activities */}
        <SectionHeader title={statFilter ? 'فعالیت‌های فیلترشده' : 'فعالیت‌های اخیر'} icon="fa-solid fa-bolt" count={filteredActivities.length} />
        <div className="flex flex-col gap-1.5 mt-1">
          {filteredActivities.map(a => (
            <div key={a.id} className="p-2.5 flex items-center gap-3" style={cardStyle}>
              <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: `${a.color}22` }}>
                <i className={`${a.icon} text-[11px]`} style={{ color: a.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[12px] text-[var(--aw-text-primary)]">{a.title}</span>
                <div className="text-[10px] text-[var(--aw-text-muted)] mt-0.5">{a.time}</div>
              </div>
            </div>
          ))}
          {filteredActivities.length === 0 && (
            <div className="p-5 flex flex-col items-center gap-2 text-[var(--aw-text-muted)]" style={cardStyle}>
              <i className="fa-solid fa-filter text-[18px]" style={{ opacity: 0.4 }} />
              <span className="text-[11px]">فعالیتی در این دسته یافت نشد</span>
            </div>
          )}
          {!statFilter && <ViewAllButton />}
        </div>

        </>)}
        {cat === 'meetings' && (<>
        {/* Recent Meetings */}
        <SectionHeader title="جلسات اخیر" icon="fa-solid fa-users" count={PERF_RECENT_MEETINGS.length} />
        <div className="flex flex-col gap-1.5 mt-1">
          {PERF_RECENT_MEETINGS.map(m => (
            <div key={m.id} className="p-2.5 flex items-center gap-3" style={cardStyle}>
              <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(59,130,246,0.12)' }}>
                <i className="fa-solid fa-video text-[11px] text-[#3B82F6]" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[12px] text-[var(--aw-text-primary)]">{m.title}</span>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="text-[10px] text-[var(--aw-text-muted)]">{m.date}</span>
                  <span className="text-[10px] text-[var(--aw-text-muted)]">• {m.attendees} نفر</span>
                  <span className="text-[10px] text-[var(--aw-text-muted)]">• {m.duration}</span>
                </div>
              </div>
            </div>
          ))}
          <ViewAllButton label="مشاهده همه جلسات" onClick={() => { setChatTab('meetings'); setAdminScreen('chatsScreen'); }} />
        </div>

        </>)}
        {cat === 'tasks' && (<>
        {/* Periodic Reports */}
        <SectionHeader title="گزارش‌های دوره‌ای" icon="fa-solid fa-file-lines" />
        <div className="flex flex-col gap-1.5 mt-1">
          {PERF_PERIODIC_REPORTS.map(r => {
            const on = r.id === period;
            return (
            <button key={r.id} onClick={() => setPeriod(r.id)} className="p-3 flex items-center gap-3 border cursor-pointer w-full text-right transition-all" style={{ ...cardStyle, borderColor: on ? r.color : 'var(--aw-border)', background: on ? `${r.color}12` : (cardStyle as any).background }}>
              <div className="w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0" style={{ background: `${r.color}22` }}>
                <i className={`${r.icon} text-[13px]`} style={{ color: r.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[12px] text-[var(--aw-text-primary)]" style={{ fontWeight: 600 }}>{r.label}</span>
                <div className="text-[10px] text-[var(--aw-text-muted)] mt-0.5">{r.desc}</div>
              </div>
              {on ? <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: `${r.color}22`, color: r.color, fontWeight: 700 }}>فعال</span> : <i className="fa-solid fa-chevron-left text-[10px] text-[var(--aw-text-muted)]" />}
            </button>
            );
          })}
        </div>

        {/* Management Alerts */}
        <SectionHeader title="هشدارهای مدیریتی" icon="fa-solid fa-triangle-exclamation" count={PERF_ALERTS.length} />
        <div className="flex flex-col gap-1.5 mt-1">
          {PERF_ALERTS.map(a => {
            const sev = ALERT_SEVERITY[a.severity];
            return (
              <div key={a.id} className="p-3 flex items-start gap-3" style={{ ...cardStyle, borderColor: sev.border }}>
                <div className="w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0" style={{ background: sev.bg }}>
                  <i className={`${a.icon} text-[13px]`} style={{ color: sev.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[12px] text-[var(--aw-text-primary)]" style={{ fontWeight: 600 }}>{a.title}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full whitespace-nowrap" style={{ background: sev.bg, color: sev.color }}>{sev.label}</span>
                  </div>
                  <div className="text-[10px] text-[var(--aw-text-muted)] mt-0.5 leading-relaxed">{a.desc}</div>
                </div>
              </div>
            );
          })}
          <ViewAllButton label="مشاهده همه هشدارها" />
        </div>

        {/* گزارش‌های درخواستی از سایر ایجنت‌ها و نیروهای سازمان */}
        <OnDemandReports />
        </>)}
      </div>
      )}
    </div>
  );
}

// ========================
// 4. DAILY FINANCE SCREEN (مالی روزانه)
// ========================
const DAILY_FIN_TABS = [
  { id: 'all', label: 'همه', icon: 'fa-solid fa-layer-group' },
  { id: 'receipts', label: 'دریافت‌ها', icon: 'fa-solid fa-arrow-down' },
  { id: 'payments', label: 'پرداخت‌ها', icon: 'fa-solid fa-arrow-up' },
  { id: 'referrals', label: 'ارجاع به مالی‌ـاداری', icon: 'fa-solid fa-share-from-square' },
];

const MOCK_RECEIPTS = [];

const MOCK_PAYMENTS_OUT = [];

const REFERRAL_TYPES: Record<string, { label: string; icon: string; color: string }> = {
  invoice: { label: 'صدور فاکتور', icon: 'fa-solid fa-file-invoice', color: '#3B82F6' },
  correction: { label: 'اصلاح سند', icon: 'fa-solid fa-pen-to-square', color: '#F59E0B' },
  debt: { label: 'بررسی بدهی', icon: 'fa-solid fa-scale-balanced', color: '#EF4444' },
  discrepancy: { label: 'مغایرت', icon: 'fa-solid fa-triangle-exclamation', color: '#F97316' },
  report: { label: 'گزارش مالی', icon: 'fa-solid fa-chart-pie', color: '#8B5CF6' },
  tax: { label: 'مالیات', icon: 'fa-solid fa-landmark', color: '#06B6D4' },
  payroll: { label: 'حقوق و دستمزد', icon: 'fa-solid fa-money-check-dollar', color: '#10B981' },
};

const MOCK_REFERRALS = [];

const REFERRAL_STATUS: Record<string, { bg: string; color: string; label: string }> = {
  pending: { bg: 'rgba(245,158,11,0.12)', color: '#F59E0B', label: 'در انتظار' },
  in_progress: { bg: 'rgba(59,130,246,0.12)', color: '#3B82F6', label: 'در حال بررسی' },
  done: { bg: 'rgba(16,185,129,0.12)', color: '#10B981', label: 'انجام شد' },
};

function NewReferralContent() {
  const { closeModal, showToast } = useApp();
  const [type, setType] = useState('invoice');
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [priority, setPriority] = useState('normal');
  const [relatedRef, setRelatedRef] = useState('');
  const [target, setTarget] = useState<'agent' | 'human'>('agent');
  const [humanAssignee, setHumanAssignee] = useState('manager');

  const submit = () => {
    if (!title.trim()) { showToast('عنوان درخواست را وارد کنید'); return; }
    try { (api as any).myCreate('sec_referrals', { id: Date.now(), title: title.trim(), target, type: (typeof reqType !== 'undefined' ? reqType : ''), desc: (typeof desc !== 'undefined' ? desc : ''), priority: (typeof priority !== 'undefined' ? priority : 'medium'), at: new Date().toISOString(), status: 'new' }); } catch (_e) {}
    showToast(target === 'agent' ? 'درخواست به ایجنت مالی‌ـاداری ارجاع شد ✅' : 'درخواست به مسئول انسانی ارجاع شد ✅');
    closeModal();
  };

  return (
    <div className="p-4">
      <FormGroup label="ارجاع به *">
        <div className="grid grid-cols-2 gap-2">
          {[
            { v: 'agent' as const, label: 'ایجنت مالی‌ـاداری', icon: 'fa-solid fa-robot', desc: 'پاسخ خودکار و فوری' },
            { v: 'human' as const, label: 'مسئول انسانی', icon: 'fa-solid fa-user-tie', desc: 'بررسی توسط همکار' },
          ].map(t => (
            <button
              key={t.v}
              onClick={() => setTarget(t.v)}
              className="p-3 rounded-[12px] cursor-pointer transition-all flex flex-col items-center text-center gap-1"
              style={{
                background: target === t.v ? 'rgba(46,134,255,0.10)' : 'var(--aw-bg-input)',
                border: `1.5px solid ${target === t.v ? '#22A6F0' : 'var(--aw-border)'}`,
              }}
            >
              <i className={`${t.icon} text-[16px]`} style={{ color: target === t.v ? '#22A6F0' : 'var(--aw-text-muted)' }} />
              <span className="text-[12px]" style={{ color: target === t.v ? '#22A6F0' : 'var(--aw-text-primary)', fontWeight: target === t.v ? 700 : 600 }}>{t.label}</span>
              <span className="text-[10px] text-[var(--aw-text-muted)]">{t.desc}</span>
            </button>
          ))}
        </div>
      </FormGroup>
      {target === 'human' && (
        <FormGroup label="مسئول انسانی">
          <FormSelect
            value={humanAssignee}
            onChange={e => setHumanAssignee(e.target.value)}
            options={[
              { value: 'manager', label: 'مدیر مالی‌ـاداری' },
              { value: 'accountant', label: 'حسابدار ارشد' },
              { value: 'payroll', label: 'کارشناس حقوق و دستمزد' },
              { value: 'tax', label: 'کارشناس مالیاتی' },
            ]}
          />
        </FormGroup>
      )}
      <FormGroup label="نوع درخواست *">
        <FormSelect
          value={type}
          onChange={e => setType(e.target.value)}
          options={Object.entries(REFERRAL_TYPES).map(([v, t]) => ({ value: v, label: t.label }))}
        />
      </FormGroup>
      <FormGroup label="عنوان درخواست *">
        <FormInput placeholder="مثلاً: صدور فاکتور رسمی برای شرکت آلفا" value={title} onChange={e => setTitle(e.target.value)} />
      </FormGroup>
      <FormGroup label="توضیحات">
        <textarea
          placeholder="جزئیات و توضیحات لازم برای واحد مالی‌ـاداری..."
          value={desc}
          onChange={e => setDesc(e.target.value)}
          rows={3}
          className="w-full py-2.5 px-3.5 rounded-[10px] border border-[var(--aw-border)] text-[13px] text-[var(--aw-text-primary)] outline-none focus:border-[var(--aw-primary)] resize-none"
          style={{ background: 'var(--aw-bg-input)' }}
        />
      </FormGroup>
      <FormGroup label="شماره سند مرتبط (اختیاری)">
        <FormInput placeholder="مثلاً: RC-۱۰۲۳" value={relatedRef} onChange={e => setRelatedRef(e.target.value)} />
      </FormGroup>
      <FormGroup label="اولویت">
        <div className="flex gap-2">
          {[
            { v: 'low', label: 'عادی', color: '#10B981' },
            { v: 'normal', label: 'متوسط', color: '#F59E0B' },
            { v: 'high', label: 'فوری', color: '#EF4444' },
          ].map(p => (
            <button
              key={p.v}
              onClick={() => setPriority(p.v)}
              className="flex-1 py-2 px-3 rounded-[10px] text-[12px] cursor-pointer transition-all"
              style={{
                background: priority === p.v ? `${p.color}22` : 'var(--aw-bg-input)',
                color: priority === p.v ? p.color : 'var(--aw-text-secondary)',
                border: `1px solid ${priority === p.v ? p.color : 'var(--aw-border)'}`,
                fontWeight: priority === p.v ? 700 : 500,
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </FormGroup>
      <div className="flex gap-2 mt-2">
        <button
          onClick={closeModal}
          className="flex-1 py-2.5 rounded-[10px] text-[13px] cursor-pointer border border-[var(--aw-border)] bg-transparent text-[var(--aw-text-secondary)]"
        >
          انصراف
        </button>
        <button
          onClick={submit}
          className="flex-1 py-2.5 rounded-[10px] text-[13px] text-white cursor-pointer border-none"
          style={{ background: 'linear-gradient(135deg, var(--aw-primary-light), var(--aw-primary-dark))', fontWeight: 700 }}
        >
          <i className="fa-solid fa-share-from-square ml-1.5" />
          ارجاع به مالی‌ـاداری
        </button>
      </div>
    </div>
  );
}

export function SecDailyFinanceScreen() {
  const { openModal } = useApp();
  const [receipts, setReceipts] = useState(MOCK_RECEIPTS);
  __usePersist('sec_receipts', receipts, setReceipts);
  const [payments, setPayments] = useState(MOCK_PAYMENTS_OUT);
  __usePersist('sec_payments', payments, setPayments);
  const [referrals, setReferrals] = useState<any[]>(MOCK_REFERRALS);
  __usePersist('sec_referrals', referrals, setReferrals);
  const [tab, setTab] = useState('all');

  const parseAmount = (s: string) => {
    const en = s.replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/[^\d]/g, '');
    return parseInt(en || '0', 10);
  };
  const formatShort = (n: number) => {
    if (n >= 1_000_000) return toFa((n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)) + 'م';
    if (n >= 1_000) return toFa(String(Math.round(n / 1_000))) + 'ه';
    return toFa(String(n));
  };

  const todayReceipts = receipts.filter(r => String(r.date || '').startsWith('امروز'));
  const todayPayments = payments.filter(p => p.date === 'امروز');
  const todayReceiptsCount = todayReceipts.length;
  const todayPaymentsCount = todayPayments.length;
  const todayReceiptsSum = todayReceipts.reduce((s, r) => s + parseAmount(r.amount), 0);
  const todayPaymentsSum = todayPayments.reduce((s, p) => s + parseAmount(p.amount), 0);
  const pendingReferralsCount = referrals.filter((r: any) => r.status !== 'done').length;

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Top 3-counter summary — act as filters (switch tab) */}
      <div className="px-4 pt-3">
        <div className="grid grid-cols-3 gap-2">
          <button onClick={() => setTab(tab === 'receipts' ? 'all' : 'receipts')} className="aw-no-pill p-2.5 flex flex-col items-center justify-center text-center border-none cursor-pointer transition-all min-h-[104px]" style={{ ...cardStyle, borderRadius: 8, background: 'linear-gradient(135deg, rgba(16,185,129,0.10), rgba(16,185,129,0.02))', outline: tab === 'receipts' ? '2px solid #10B981' : 'none' }}>
            <div className="w-7 h-7 flex items-center justify-center mb-1">
              <i className="fa-solid fa-arrow-down text-[13px] text-[#10B981]" />
            </div>
            <span className="text-[16px] text-[#10B981]" style={{ fontWeight: 800 }}>{toFa(String(todayReceiptsCount))}</span>
            <span className="text-[10px] text-[var(--aw-text-muted)] mt-0.5">دریافتی امروز</span>
            <span className="text-[10px] text-[#10B981] mt-0.5" style={{ fontWeight: 700 }}>{formatShort(todayReceiptsSum)} <span className="text-[9px] text-[var(--aw-text-muted)]">تومان</span></span>
          </button>
          <button onClick={() => setTab(tab === 'payments' ? 'all' : 'payments')} className="aw-no-pill p-2.5 flex flex-col items-center justify-center text-center border-none cursor-pointer transition-all min-h-[104px]" style={{ ...cardStyle, borderRadius: 8, background: 'linear-gradient(135deg, rgba(239,68,68,0.10), rgba(239,68,68,0.02))', outline: tab === 'payments' ? '2px solid #EF4444' : 'none' }}>
            <div className="w-7 h-7 flex items-center justify-center mb-1">
              <i className="fa-solid fa-arrow-up text-[13px] text-[#EF4444]" />
            </div>
            <span className="text-[16px] text-[#EF4444]" style={{ fontWeight: 800 }}>{toFa(String(todayPaymentsCount))}</span>
            <span className="text-[10px] text-[var(--aw-text-muted)] mt-0.5">پرداختی امروز</span>
            <span className="text-[10px] text-[#EF4444] mt-0.5" style={{ fontWeight: 700 }}>{formatShort(todayPaymentsSum)} <span className="text-[9px] text-[var(--aw-text-muted)]">تومان</span></span>
          </button>
          <button onClick={() => setTab(tab === 'referrals' ? 'all' : 'referrals')} className="aw-no-pill p-2.5 flex flex-col items-center justify-center text-center border-none cursor-pointer transition-all min-h-[104px]" style={{ ...cardStyle, borderRadius: 8, background: 'linear-gradient(135deg, rgba(46,134,255,0.10), rgba(46,134,255,0.02))', outline: tab === 'referrals' ? '2px solid #22A6F0' : 'none' }}>
            <div className="w-7 h-7 flex items-center justify-center mb-1">
              <i className="fa-solid fa-share-from-square text-[13px] text-[#22A6F0]" />
            </div>
            <span className="text-[16px] text-[#22A6F0]" style={{ fontWeight: 800 }}>{toFa(String(pendingReferralsCount))}</span>
            <span className="text-[10px] text-[var(--aw-text-muted)] mt-0.5">ارجاع باز</span>
          </button>
        </div>
      </div>

      <div className="mt-3" />
      <div className="flex-1 overflow-y-auto px-4 pb-24 aw-scroll">
        <AnimatePresence mode="wait">
          {tab === 'all' && (
            <motion.div key="all" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-col gap-3 pt-2">
              <div>
                <div className="text-[12px] mb-1.5 px-1 flex items-center gap-1.5" style={{ fontWeight: 700, color: '#10B981' }}><i className="fa-solid fa-arrow-down text-[10px]" />دریافت‌ها</div>
                <div className="flex flex-col gap-2">
                  {receipts.map(r => (
                    <div key={'ar' + r.id} className="p-3 flex items-center justify-between gap-2" style={cardStyle}>
                      <div className="flex-1 min-w-0"><span className="text-[12.5px] text-[var(--aw-text-primary)]" style={{ fontWeight: 600 }}>{r.from}</span><div className="text-[10px] text-[var(--aw-text-muted)] mt-0.5">{r.date} · {r.method}</div></div>
                      <span className="text-[12.5px] text-[#10B981] flex-shrink-0" style={{ fontWeight: 700 }}>{r.amount}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-[12px] mb-1.5 px-1 flex items-center gap-1.5" style={{ fontWeight: 700, color: '#EF4444' }}><i className="fa-solid fa-arrow-up text-[10px]" />پرداخت‌ها</div>
                <div className="flex flex-col gap-2">
                  {payments.map(p => (
                    <div key={'ap' + p.id} className="p-3 flex items-center justify-between gap-2" style={cardStyle}>
                      <div className="flex-1 min-w-0"><span className="text-[12.5px] text-[var(--aw-text-primary)]" style={{ fontWeight: 600 }}>{p.title}</span><div className="text-[10px] text-[var(--aw-text-muted)] mt-0.5">{p.date} · {p.recipient}</div></div>
                      <span className="text-[12.5px] text-[#EF4444] flex-shrink-0" style={{ fontWeight: 700 }}>{p.amount}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-[12px] mb-1.5 px-1 flex items-center gap-1.5" style={{ fontWeight: 700, color: '#22A6F0' }}><i className="fa-solid fa-share-from-square text-[10px]" />ارجاع‌ها</div>
                <div className="flex flex-col gap-2">
                  {referrals.map((ref: any) => {
                    const type = REFERRAL_TYPES[ref.type];
                    const st = REFERRAL_STATUS[ref.status];
                    return (
                      <div key={'af' + ref.id} className="p-3 flex items-center gap-3" style={cardStyle}>
                        <div className="w-8 h-8 rounded-[10px] flex items-center justify-center flex-shrink-0" style={{ background: `${type.color}22` }}><i className={`${type.icon} text-[12px]`} style={{ color: type.color }} /></div>
                        <div className="flex-1 min-w-0"><span className="text-[12.5px] text-[var(--aw-text-primary)]" style={{ fontWeight: 600 }}>{ref.title}</span><div className="text-[10px] text-[var(--aw-text-muted)] mt-0.5">{ref.date}</div></div>
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full whitespace-nowrap flex-shrink-0" style={{ background: st.bg, color: st.color }}>{st.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
          {tab === 'receipts' && (
            <motion.div key="receipts" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-col gap-2 pt-2">
              <button onClick={() => openModal('ثبت دریافت جدید', <QuickForm onSubmit={(v) => setReceipts(prev => [{ id: Date.now(), from: v.from, amount: v.amount || '0', method: v.method || 'نقدی', date: 'امروز', ref: 'RC-' + Date.now().toString().slice(-4), desc: '' } as any, ...prev])} submitLabel="ثبت دریافت" toast="دریافت جدید ثبت شد" fields={[{ key: 'from', label: 'پرداخت‌کننده' }, { key: 'amount', label: 'مبلغ (تومان)' }, { key: 'method', label: 'روش', type: 'select', options: ['نقدی', 'کارت‌به‌کارت', 'چک', 'حواله'] }]} />)} className="w-full p-3 flex items-center justify-center gap-2 border-2 border-dashed border-[var(--aw-border)] rounded-[10px] cursor-pointer bg-transparent hover:border-[#10B981] transition-colors text-[13px] text-[#10B981]">
                <i className="fa-solid fa-plus" />ثبت دریافت جدید
              </button>
              {receipts.map(r => (
                <div key={r.id} className="p-3" style={cardStyle}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <span className="text-[13px] text-[var(--aw-text-primary)]" style={{ fontWeight: 600 }}>{r.from}</span>
                      <div className="text-[11px] text-[var(--aw-text-secondary)] mt-1 leading-relaxed">{r.desc}</div>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className="text-[10px] text-[var(--aw-text-muted)]"><i className="fa-solid fa-credit-card text-[8px] ml-1" />{r.method}</span>
                        <span className="text-[10px] text-[var(--aw-text-muted)]"><i className="fa-solid fa-hashtag text-[8px] ml-1" />{r.ref}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end flex-shrink-0">
                      <span className="text-[13px] text-[#10B981]" style={{ fontWeight: 700 }}>{r.amount}</span>
                      <span className="text-[10px] text-[var(--aw-text-muted)] mt-0.5">{r.date}</span>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
          {tab === 'payments' && (
            <motion.div key="payments" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-col gap-2 pt-2">
              <button onClick={() => openModal('ثبت پرداخت جدید', <QuickForm onSubmit={(v) => setPayments(prev => [{ id: Date.now(), title: v.to, amount: v.amount || '0', recipient: v.to, method: v.method || 'نقدی', date: 'امروز', desc: '' } as any, ...prev])} submitLabel="ثبت پرداخت" toast="پرداخت جدید ثبت شد" fields={[{ key: 'to', label: 'دریافت‌کننده' }, { key: 'amount', label: 'مبلغ (تومان)' }, { key: 'method', label: 'روش', type: 'select', options: ['نقدی', 'کارت‌به‌کارت', 'چک', 'حواله'] }]} />)} className="w-full p-3 flex items-center justify-center gap-2 border-2 border-dashed border-[var(--aw-border)] rounded-[10px] cursor-pointer bg-transparent hover:border-[#EF4444] transition-colors text-[13px] text-[#EF4444]">
                <i className="fa-solid fa-plus" />ثبت پرداخت جدید
              </button>
              {payments.map(p => (
                <div key={p.id} className="p-3" style={cardStyle}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <span className="text-[13px] text-[var(--aw-text-primary)]" style={{ fontWeight: 600 }}>{p.title}</span>
                      <div className="text-[11px] text-[var(--aw-text-secondary)] mt-1 leading-relaxed">{p.desc}</div>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className="text-[10px] text-[var(--aw-text-muted)]"><i className="fa-solid fa-user text-[8px] ml-1" />{p.recipient}</span>
                        <span className="text-[10px] text-[var(--aw-text-muted)]"><i className="fa-solid fa-credit-card text-[8px] ml-1" />{p.method}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end flex-shrink-0">
                      <span className="text-[13px] text-[#EF4444]" style={{ fontWeight: 700 }}>{p.amount}</span>
                      <span className="text-[10px] text-[var(--aw-text-muted)] mt-0.5">{p.date}</span>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
          {tab === 'referrals' && (
            <motion.div key="referrals" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => openModal('ثبت درخواست برای مالی‌ـاداری', <NewReferralContent />)}
                className="w-full p-3 flex items-center justify-center gap-2 border-2 border-dashed border-[var(--aw-border)] rounded-[10px] cursor-pointer bg-transparent hover:border-[#22A6F0] transition-colors text-[13px] text-[#22A6F0]"
              >
                <i className="fa-solid fa-plus" />ثبت درخواست برای مالی‌ـاداری
              </button>
              {referrals.map((ref: any) => {
                const type = REFERRAL_TYPES[ref.type];
                const st = REFERRAL_STATUS[ref.status];
                return (
                  <div key={ref.id} className="p-3" style={cardStyle}>
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0" style={{ background: `${type.color}22` }}>
                        <i className={`${type.icon} text-[13px]`} style={{ color: type.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-[13px] text-[var(--aw-text-primary)]" style={{ fontWeight: 600 }}>{ref.title}</span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full whitespace-nowrap" style={{ background: st.bg, color: st.color }}>{st.label}</span>
                        </div>
                        <div className="text-[11px] text-[var(--aw-text-secondary)] mt-1 leading-relaxed">{ref.desc}</div>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: `${type.color}15`, color: type.color }}>{type.label}</span>
                          <span className="text-[10px] text-[var(--aw-text-muted)]">{ref.date}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ========================
// امروز من (Secretary home / today)
// ========================
const TODAY_TASKS = [];
const YESTERDAY_SUMMARY = [];
const OTHER_AGENTS_PRIO = [];

function PettyCashContent() {
  const { closeModal, setAdminScreen, showToast } = useApp();
  const [tab, setTab] = useState<'overview' | 'history'>('overview');
  const [mode, setMode] = useState<null | 'in' | 'out'>(null);
  const [amount, setAmount] = useState('');
  // pettyreal: از دادهٔ واقعیِ per-user (نه هاردکد؛ نه فقط‌نوشتنی) — موجودی و تاریخچه زنده به‌روز می‌شوند
  const [receipts, setReceipts] = useState<any[]>([]);
  __usePersist('sec_receipts', receipts, setReceipts);
  const [payments, setPayments] = useState<any[]>([]);
  __usePersist('sec_payments', payments, setPayments);
  const __pa = (v: any) => { const n = parseInt(String(v == null ? 0 : v).replace(/[^\d]/g, ''), 10); return isNaN(n) ? 0 : n; };
  const totalIn = receipts.reduce((s: number, r: any) => s + __pa(r.amount), 0);
  const totalOut = payments.reduce((s: number, p: any) => s + __pa(p.amount), 0);
  const pettyCash = totalIn - totalOut;
  const fmt = (n: number) => n.toLocaleString('en-US').replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'[+d]);
  const TX = [
    ...receipts.map((r: any) => ({ id: 'r' + r.id, t: r.from || r.title || 'دریافت', d: r.date || '', amount: __pa(r.amount), sort: r.id || 0 })),
    ...payments.map((p: any) => ({ id: 'p' + p.id, t: p.title || p.from || 'پرداخت', d: p.date || '', amount: -__pa(p.amount), sort: p.id || 0 })),
  ].sort((a: any, b: any) => (b.sort || 0) - (a.sort || 0));
  const quick = [50000, 100000, 200000, 500000];
  const faToEn = (s: string) => s.replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/[^0-9]/g, '');
  const amountNum = parseInt(faToEn(amount)) || 0;
  const confirm = () => {
    if (amountNum <= 0) { showToast('مبلغ معتبر وارد کنید', 'error'); return; }
    if (mode === 'in') setReceipts(prev => [{ id: Date.now(), amount: amountNum, date: 'امروز', from: 'ثبت سریع' }, ...prev]);
    else setPayments(prev => [{ id: Date.now(), amount: amountNum, date: 'امروز', title: 'ثبت سریع' }, ...prev]);
    showToast(mode === 'in' ? 'دریافت ثبت شد ✅' : 'پرداخت ثبت شد ✅', 'success');
    setAmount(''); setMode(null); setTab('history');
  };
  const inputCls = 'w-full px-3 py-2.5 rounded-[10px] text-[15px] border border-[var(--aw-border)] bg-[var(--aw-bg-input)] text-[var(--aw-text-primary)] outline-none';

  return (
    <div className="flex flex-col gap-3 p-1">
      {/* Balance card — glass, theme-tinted */}
      <div className="p-4 rounded-2xl text-center relative overflow-hidden" style={{ ...cardStyle }}>
        <div className="flex justify-center mb-1.5"><div style={walletIconStyle(48)} /></div>
        <p className="text-[11px] m-0" style={{ color: 'var(--aw-text-secondary)' }}>موجودی تنخواه</p>
        <h2 className="text-[26px] m-0 mt-1" style={{ fontWeight: 800, direction: 'ltr', color: 'var(--aw-text-primary)' }}>{fmt(pettyCash)} <span className="text-[12px]" style={{ color: 'var(--aw-text-muted)' }}>تومان</span></h2>
        <div className="flex gap-2 mt-3">
          <button onClick={() => { setMode(mode === 'in' ? null : 'in'); setAmount(''); }} className="flex-1 py-2 rounded-xl border-none cursor-pointer text-[12px]" style={{ background: 'color-mix(in srgb, #10B981 90%, transparent)', color: '#fff', fontWeight: 700 }}>
            <i className="fa-solid fa-arrow-down text-[11px] ml-1" /> دریافت
          </button>
          <button onClick={() => { setMode(mode === 'out' ? null : 'out'); setAmount(''); }} className="flex-1 py-2 rounded-xl cursor-pointer text-[12px]" style={{ background: 'color-mix(in srgb, var(--aw-primary) 18%, transparent)', color: 'var(--aw-primary)', border: '1px solid color-mix(in srgb, var(--aw-primary) 40%, transparent)', fontWeight: 700 }}>
            <i className="fa-solid fa-arrow-up text-[11px] ml-1" /> پرداخت
          </button>
        </div>
      </div>

      {/* Inline in/out form */}
      {mode && (
        <div className="rounded-xl p-3" style={{ ...cardStyle }}>
          <div className="text-[12px] mb-2" style={{ fontWeight: 700 }}>{mode === 'in' ? 'ثبت دریافت تنخواه' : 'ثبت پرداخت تنخواه'}</div>
          <input className={inputCls} value={amount} onChange={e => setAmount(__grpFa(e.target.value))} placeholder="مبلغ (تومان)" inputMode="numeric" dir="ltr" style={{ textAlign: 'right' }} />
          <div className="flex gap-1.5 mt-2 flex-wrap">
            {quick.map(q => (
              <button key={q} onClick={() => setAmount(toFa(q.toLocaleString('en-US')))} className="text-[11px] px-2.5 py-1 rounded-full border border-[var(--aw-border)] bg-transparent cursor-pointer" style={{ color: 'var(--aw-text-secondary)' }}>{fmt(q)}</button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2 mt-3">
            <button onClick={confirm} className="py-2.5 rounded-[10px] border-none cursor-pointer text-white text-[12px]" style={{ background: mode === 'in' ? '#10B981' : '#f59e0b', fontWeight: 700 }}>تأیید {mode === 'in' ? 'دریافت' : 'پرداخت'}</button>
            <button onClick={() => { setMode(null); setAmount(''); }} className="py-2.5 rounded-[10px] cursor-pointer text-[12px] bg-transparent" style={{ border: '1px solid var(--aw-border)', color: 'var(--aw-text-secondary)', fontWeight: 700 }}>انصراف</button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-[3px] rounded-full border border-[var(--aw-border)]" style={{ background: 'var(--aw-bg-card)' }}>
        {[{ id: 'overview', label: 'گزارش' }, { id: 'history', label: 'تراکنش‌ها' }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)} className="flex-1 py-1.5 rounded-full border-none cursor-pointer text-[12px]"
            style={tab === t.id ? { background: 'var(--aw-primary)', color: '#fff', fontWeight: 700 } : { background: 'transparent', color: 'var(--aw-text-muted)', fontWeight: 600 }}>{t.label}</button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl p-3" style={{ ...cardStyle }}>
              <div className="text-[10px] text-[var(--aw-text-muted)] mb-1"><i className="fa-solid fa-arrow-down ml-1" style={{ color: '#10b981' }} />کل دریافت</div>
              <div className="text-[15px]" style={{ fontWeight: 800, color: '#10b981', direction: 'ltr', textAlign: 'right' }}>{fmt(totalIn)}</div>
            </div>
            <div className="rounded-xl p-3" style={{ ...cardStyle }}>
              <div className="text-[10px] text-[var(--aw-text-muted)] mb-1"><i className="fa-solid fa-arrow-up ml-1" style={{ color: '#ef4444' }} />کل پرداخت</div>
              <div className="text-[15px]" style={{ fontWeight: 800, color: '#ef4444', direction: 'ltr', textAlign: 'right' }}>{fmt(totalOut)}</div>
            </div>
          </div>
          <div className="rounded-xl p-3 flex items-center gap-3" style={{ ...cardStyle }}>
            <div className="w-10 h-10 rounded-[10px] flex items-center justify-center text-white flex-shrink-0" style={{ background: 'var(--aw-primary)' }}><i className="fa-solid fa-receipt" /></div>
            <div className="flex-1">
              <div className="text-[12px]" style={{ fontWeight: 700 }}>تعداد تراکنش‌ها</div>
              <div className="text-[10px] text-[var(--aw-text-muted)]">{toFa(String(TX.length))} تراکنش این هفته</div>
            </div>
            <div className="text-[14px]" style={{ fontWeight: 800, color: 'var(--aw-primary)', direction: 'ltr' }}>{fmt(totalIn - totalOut)}</div>
          </div>
        </div>
      )}

      {tab === 'history' && (
        <div className="flex flex-col gap-2">
          {TX.map(t => {
            const isIn = t.amount > 0;
            const c = isIn ? '#10B981' : '#EF4444';
            return (
              <div key={t.id} className="flex items-center gap-3 rounded-xl p-2.5" style={{ ...cardStyle }}>
                <div className="w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0" style={{ background: c + '22', color: c }}><i className={`fa-solid ${isIn ? 'fa-arrow-down' : 'fa-arrow-up'} text-[12px]`} /></div>
                <div className="flex-1 min-w-0"><div className="text-[12px] text-[var(--aw-text-primary)]" style={{ fontWeight: 600 }}>{t.t}</div><div className="text-[10px] text-[var(--aw-text-muted)]">{t.d}</div></div>
                <span className="text-[12px] flex-shrink-0" style={{ color: c, fontWeight: 700, direction: 'ltr' }}>{isIn ? '+' : '−'}{fmt(Math.abs(t.amount))}</span>
              </div>
            );
          })}
        </div>
      )}

      <button onClick={() => { try { localStorage.setItem('sec-report-tab', 'petty'); } catch {} closeModal(); setAdminScreen('secPerformanceScreen'); }} className="w-full py-2.5 rounded-[12px] border border-[var(--aw-border)] bg-transparent cursor-pointer text-[12px]" style={{ fontWeight: 700, color: 'var(--aw-primary)' }}>
        <i className="fa-solid fa-receipt ml-1.5" />گزارش کامل تنخواه
      </button>
    </div>
  );
}

export function SecTodayScreen() {
  const { setAdminScreen, openModal } = useApp();
  // todayreal: همه از دادهٔ واقعیِ per-user (نه هاردکد)
  const [tasks, setTasks] = useState<any[]>([]);
  __usePersist('sec_tasks', tasks, setTasks);
  const [receipts, setReceipts] = useState<any[]>([]);
  __usePersist('sec_receipts', receipts, setReceipts);
  const [payments, setPayments] = useState<any[]>([]);
  __usePersist('sec_payments', payments, setPayments);
  const [meetings, setMeetings] = useState<any[]>([]);
  __usePersist('sec_meetings', meetings, setMeetings);
  const __pa = (v: any) => { const n = parseInt(String(v == null ? 0 : v).replace(/[^\d]/g, ''), 10); return isNaN(n) ? 0 : n; };
  const pettyCash = receipts.reduce((s: number, r: any) => s + __pa(r.amount), 0) - payments.reduce((s: number, p: any) => s + __pa(p.amount), 0);
  const fmt = (n: number) => n.toLocaleString('en-US').replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'[+d]);
  const doneCount = tasks.filter((t: any) => t.done).length;
  const openPetty = () => openModal('تنخواه منشی', <PettyCashContent />);
  const YESTERDAY_SUMMARY = [
    { i: 'fa-solid fa-check-double', c: '#10B981', v: toFa(String(doneCount)), l: 'انجام‌شده' },
    { i: 'fa-solid fa-hourglass-half', c: '#F59E0B', v: toFa(String(tasks.length - doneCount)), l: 'در انتظار' },
    { i: 'fa-solid fa-users', c: '#8B5CF6', v: toFa(String(meetings.length)), l: 'جلسات' },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4 pt-3 pb-24 aw-scroll flex flex-col gap-3">
        {/* تنخواه — کارت شیشه‌ای هم‌اندازهٔ کیف پول دستیار */}
        <div className="flex gap-3 px-5 py-5 relative overflow-hidden" style={{ ...cardStyle, minHeight: 138, cursor: 'pointer' }} onClick={openPetty}>
          <div className="aw-chat-pattern aw-pattern-sm" style={{ position: 'absolute', inset: 0, borderRadius: 'inherit', overflow: 'hidden', opacity: 1, pointerEvents: 'none', zIndex: 0 }} />
          <div className="flex flex-col items-center gap-2.5 flex-shrink-0 relative z-[1]">
            <div style={walletIconStyle(52)} />
            <button onClick={(e) => { e.stopPropagation(); openPetty(); }} className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer" style={{ background: 'color-mix(in srgb, var(--aw-primary) 16%, transparent)', border: '1px solid color-mix(in srgb, var(--aw-primary) 30%, transparent)', color: 'var(--aw-primary)' }}>
              <i className="fa-solid fa-plus text-[13px]" />
            </button>
          </div>
          <div className="flex-1 flex flex-col justify-end items-end pb-1 relative z-[1]" style={{ gap: 3 }}>
            <span className="text-[11px] text-[var(--aw-text-secondary)]" style={{ fontWeight: 500 }}>موجودی تنخواه</span>
            <span style={{ color: 'var(--aw-text-primary)' }}>
              <span className="text-[22px]" style={{ fontWeight: 900, direction: 'ltr', unicodeBidi: 'plaintext' }}>{fmt(pettyCash)}</span>
              <span className="text-[11px] text-[var(--aw-text-secondary)] mr-1" style={{ fontWeight: 700 }}>تومان</span>
            </span>
          </div>
        </div>

        {/* تسک‌های امروز */}
        <div>
          <div className="flex items-center gap-2 px-1 mb-2">
            <i className="fa-solid fa-list-check text-[12px]" style={{ color: '#22A6F0' }} />
            <span className="text-[13px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>تسک‌های امروز</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full mr-auto" style={{ background: 'var(--aw-bg-hover)', color: 'var(--aw-text-muted)' }}>{toFa(String(doneCount))}/{toFa(String(tasks.length))}</span>
          </div>
          <div className="flex flex-col gap-2">
            {tasks.map(t => (
              <button key={t.id} onClick={() => setTasks(prev => prev.map((x: any) => x.id === t.id ? { ...x, done: !x.done, completedAt: !x.done ? Date.now() : x.completedAt } : x))}
                className="flex items-center gap-3 p-3 border-none cursor-pointer text-right w-full" style={cardStyle}>
                <span className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: t.done ? '#10B981' : 'transparent', border: t.done ? 'none' : '1.5px solid var(--aw-border)' }}>
                  {t.done && <i className="fa-solid fa-check text-white text-[9px]" />}
                </span>
                <span className="flex-1 text-[12.5px]" style={{ fontWeight: 600, color: 'var(--aw-text-primary)', textDecoration: t.done ? 'line-through' : 'none', opacity: t.done ? 0.6 : 1 }}>{t.title}</span>
                {(t.prio || t.priority) === 'high' && <span className="text-[9px] px-1.5 py-0.5 rounded-full flex-shrink-0" style={{ background: 'rgba(239,68,68,0.14)', color: '#EF4444', fontWeight: 700 }}>مهم</span>}
              </button>
            ))}
          </div>
          <button onClick={() => setAdminScreen('secPlanningScreen')} className="mt-2 w-full py-2 rounded-[10px] border border-dashed border-[var(--aw-border)] bg-transparent cursor-pointer text-[11px] text-[#22A6F0]" style={{ fontWeight: 600 }}>
            همه تسک‌ها و برنامه‌ریزی
          </button>
        </div>

        {/* گزارش دیروز */}
        <div>
          <div className="flex items-center gap-2 px-1 mb-2">
            <i className="fa-solid fa-clock-rotate-left text-[12px]" style={{ color: '#8B5CF6' }} />
            <span className="text-[13px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>خلاصه گزارش دیروز</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {YESTERDAY_SUMMARY.map((s2, i) => (
              <div key={i} className="p-3 text-center" style={cardStyle}>
                <i className={s2.i + ' text-[13px]'} style={{ color: s2.c }} />
                <div className="text-[17px] mt-1" style={{ fontWeight: 800, color: s2.c }}>{s2.v}</div>
                <div className="text-[9.5px] text-[var(--aw-text-muted)]">{s2.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* اولویت‌های سایر ایجنت‌ها — فقط اگر دادهٔ واقعیِ کراس-ایجنت باشد (بدونِ فیک) */}
        {OTHER_AGENTS_PRIO.length > 0 && (
        <div>
          <div className="flex items-center gap-2 px-1 mb-2">
            <i className="fa-solid fa-layer-group text-[12px]" style={{ color: '#F59E0B' }} />
            <span className="text-[13px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>اولویت‌های سایر ایجنت‌ها</span>
          </div>
          <div className="flex flex-col gap-2">
            {OTHER_AGENTS_PRIO.map(a => (
              <div key={a.id} className="flex items-center gap-3 p-3" style={cardStyle}>
                <div className="w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0" style={{ background: a.color + '22', color: a.color }}>
                  <i className={a.icon + ' text-[13px]'} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12.5px]" style={{ fontWeight: 700, color: 'var(--aw-text-primary)' }}>{a.title}</div>
                  <div className="text-[10px] text-[var(--aw-text-muted)]">{a.agent}</div>
                </div>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full flex-shrink-0" style={{ background: 'rgba(239,68,68,0.14)', color: '#EF4444', fontWeight: 700 }}>اولویت بالا</span>
              </div>
            ))}
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
