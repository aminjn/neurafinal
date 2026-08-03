import { useState } from 'react';
import { useApp } from './app-context';
import { toFa } from './data';
import { FormGroup, FormInput } from './admin-panel';

interface PeerChatMsg { from: string; text: string; time: string; }

export interface SecretaryMeeting {
  id: string;
  kind: 'inperson' | 'online';
  title: string;
  date: string;
  time: string;
  duration: string;
  location: string;
  attendees: string[];
  status: 'completed' | 'scheduled' | 'inprogress';
  transcript: PeerChatMsg[];
  minutes: string[];
}

export const SECRETARY_MEETINGS: SecretaryMeeting[] = [
  {
    id: 'mt1', kind: 'inperson', title: 'جلسه هیئت‌مدیره — بررسی بودجه فصلی',
    date: '۱۴۰۴/۱۲/۰۲', time: '۱۰:۰۰', duration: '۹۰ دقیقه',
    location: 'اتاق کنفرانس A — طبقه ۳',
    attendees: ['p1', 'p2', 'p3', 'p4'],
    status: 'completed',
    transcript: [
      { from: 'p1', text: 'سلام به همه، جلسه را شروع کنیم. دستور جلسه بررسی بودجه فصل بهار است.', time: '۱۰:۰۲' },
      { from: 'p3', text: 'گزارش مالی فصل قبل را آماده کرده‌ام. ۱۲٪ رشد درآمد داشتیم.', time: '۱۰:۰۸' },
      { from: 'p2', text: 'پیشنهاد می‌کنم بودجه بازاریابی را ۱۵٪ افزایش بدهیم.', time: '۱۰:۲۰' },
      { from: 'p4', text: 'موافقم، ولی باید روی ROI کانال‌ها دقت کنیم.', time: '۱۰:۲۸' },
      { from: 'p1', text: 'تصمیم گرفته شد بودجه بازاریابی ۱۲٪ افزایش یابد.', time: '۱۱:۱۵' },
      { from: 'p1', text: 'جلسه بعدی هفته آینده برای بررسی پیشرفت.', time: '۱۱:۳۰' },
    ],
    minutes: [
      'گزارش مالی فصل قبل با رشد ۱۲٪ درآمد ارائه شد.',
      'تصمیم: افزایش ۱۲٪ بودجه بازاریابی برای فصل بهار.',
      'مسئول پیگیری ROI کانال‌ها: مدیر بازاریابی.',
      'جلسه پیگیری هفته آینده در همین ساعت.',
    ],
  },
  {
    id: 'mt2', kind: 'inperson', title: 'هماهنگی تیم تولید — راه‌اندازی خط جدید',
    date: '۱۴۰۴/۱۲/۰۱', time: '۱۴:۰۰', duration: '۶۰ دقیقه',
    location: 'سالن تولید — کارگاه شماره ۲',
    attendees: ['p2', 'p3', 'p4'],
    status: 'completed',
    transcript: [
      { from: 'p2', text: 'تجهیزات خط جدید فردا وارد می‌شود.', time: '۱۴:۰۳' },
      { from: 'p4', text: 'تیم نصب از تأمین‌کننده هماهنگ شده؟', time: '۱۴:۱۰' },
      { from: 'p3', text: 'بله، دوشنبه نصب شروع می‌شود.', time: '۱۴:۱۵' },
      { from: 'p2', text: 'آموزش اپراتورها هم همان هفته انجام شود.', time: '۱۴:۳۵' },
    ],
    minutes: [
      'ورود تجهیزات خط جدید: روز پنج‌شنبه.',
      'شروع نصب توسط تیم تأمین‌کننده: دوشنبه هفته بعد.',
      'برگزاری دوره آموزشی اپراتورها همزمان با نصب.',
    ],
  },
  {
    id: 'mt3', kind: 'online', title: 'جلسه آنلاین با تیم فروش — اهداف ماهانه',
    date: '۱۴۰۴/۱۲/۰۲', time: '۱۶:۰۰', duration: '۴۵ دقیقه',
    location: 'گوگل میت — meet.google.com/abc-defg-hij',
    attendees: ['p1', 'p2', 'p3'],
    status: 'inprogress',
    transcript: [
      { from: 'p1', text: 'سلام، آماده شروع هستیم؟', time: '۱۶:۰۲' },
      { from: 'p3', text: 'بله، اشتراک صفحه می‌گذارم.', time: '۱۶:۰۳' },
      { from: 'p2', text: 'هدف ماه قبل را ۱۰۸٪ پوشش دادیم.', time: '۱۶:۱۰' },
    ],
    minutes: [
      'پوشش هدف ماه قبل: ۱۰۸٪.',
      'بحث در خصوص اهداف ماه جاری در حال انجام...',
    ],
  },
  {
    id: 'mt4', kind: 'online', title: 'جلسه آنلاین با مشتری شرکت آلفا',
    date: '۱۴۰۴/۱۱/۲۸', time: '۱۱:۰۰', duration: '۳۰ دقیقه',
    location: 'اسکایپ — تماس ویدیویی',
    attendees: ['p1', 'p4'],
    status: 'completed',
    transcript: [
      { from: 'p4', text: 'سلام، خوشحالم که فرصت گفتگو پیش آمد.', time: '۱۱:۰۲' },
      { from: 'p1', text: 'پیش‌فاکتور ارسالی را بررسی کردید؟', time: '۱۱:۰۵' },
      { from: 'p4', text: 'بله، شرایط پرداخت قابل قبول است.', time: '۱۱:۱۰' },
      { from: 'p1', text: 'قرارداد را تا پایان هفته آماده می‌کنم.', time: '۱۱:۲۵' },
    ],
    minutes: [
      'مشتری شرایط پیش‌فاکتور را پذیرفت.',
      'تعهد: ارسال قرارداد تا پایان هفته.',
      'مرحله بعد: امضای قرارداد و دریافت ۳۰٪ پیش‌پرداخت.',
    ],
  },
  {
    id: 'mt5', kind: 'online', title: 'وبینار داخلی — معرفی ابزار جدید CRM',
    date: '۱۴۰۴/۱۲/۰۵', time: '۰۹:۳۰', duration: '۶۰ دقیقه',
    location: 'زوم — جلسه برنامه‌ریزی شده',
    attendees: ['p1', 'p2', 'p3', 'p4'],
    status: 'scheduled',
    transcript: [],
    minutes: [],
  },
];

export const MEETING_STATUS: Record<string, { label: string; bg: string; text: string; icon: string }> = {
  completed: { label: 'برگزار شد', bg: 'rgba(16,185,129,0.15)', text: '#10b981', icon: 'fa-solid fa-check-circle' },
  scheduled: { label: 'برنامه‌ریزی شده', bg: 'rgba(59,130,246,0.15)', text: '#3b82f6', icon: 'fa-solid fa-clock' },
  inprogress: { label: 'در حال برگزاری', bg: 'rgba(239,68,68,0.15)', text: '#ef4444', icon: 'fa-solid fa-circle' },
};

export function MeetingViewer({ meeting, personnel }: { meeting: SecretaryMeeting; personnel: any[] }) {
  const [tab, setTab] = useState<'info' | 'transcript' | 'minutes'>('info');
  const attendeeNames = meeting.attendees.map(id => personnel.find(p => p.id === id)?.name || id);
  const status = MEETING_STATUS[meeting.status];

  return (
    <div className="flex flex-col" style={{ maxHeight: '70vh' }}>
      <div className="px-1 pb-3 border-b border-[var(--aw-border)] mb-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="text-[13px] flex-1" style={{ fontWeight: 600 }}>{meeting.title}</div>
          <span className="px-2 py-0.5 rounded-md text-[10px] flex items-center gap-1 flex-shrink-0" style={{ background: status.bg, color: status.text, fontWeight: 700 }}>
            <i className={status.icon} /> {status.label}
          </span>
        </div>
        <div className="text-[11px] text-[var(--aw-text-muted)] flex items-center gap-2 flex-wrap">
          <span><i className={`${meeting.kind === 'online' ? 'fa-solid fa-video' : 'fa-solid fa-building'} ml-1`} />{meeting.kind === 'online' ? 'آنلاین' : 'حضوری'}</span>
          <span>·</span>
          <span>{meeting.date}</span>
          <span>·</span>
          <span>{meeting.time}</span>
          <span>·</span>
          <span>{meeting.duration}</span>
        </div>
      </div>

      <div className="flex gap-1 mb-3">
        {([
          { id: 'info', label: 'اطلاعات', icon: 'fa-solid fa-circle-info' },
          { id: 'transcript', label: 'گفتگوها', icon: 'fa-solid fa-comments' },
          { id: 'minutes', label: 'صورتجلسه', icon: 'fa-solid fa-file-lines' },
        ] as const).map(t => (
          <button key={t.id}
            className={`flex-1 py-2 rounded-[10px] text-[11px] border cursor-pointer transition-all ${tab === t.id ? 'text-white border-[var(--aw-primary)]' : 'bg-transparent text-[var(--aw-text-secondary)] border-[var(--aw-border)]'}`}
            style={tab === t.id ? { background: 'var(--aw-primary)', fontWeight: 600 } : { fontWeight: 600 }}
            onClick={() => setTab(t.id)}>
            <i className={`${t.icon} ml-1`} />{t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto aw-scroll pb-2">
        {tab === 'info' && (
          <div className="space-y-2.5 text-[12px]">
            <div className="flex justify-between"><span className="text-[var(--aw-text-muted)]">نوع جلسه:</span><span>{meeting.kind === 'online' ? 'آنلاین' : 'حضوری'}</span></div>
            <div className="flex justify-between gap-2"><span className="text-[var(--aw-text-muted)] flex-shrink-0">مکان/لینک:</span><span className="text-left break-words">{meeting.location}</span></div>
            <div className="flex justify-between"><span className="text-[var(--aw-text-muted)]">تاریخ و ساعت:</span><span>{meeting.date} — {meeting.time}</span></div>
            <div className="flex justify-between"><span className="text-[var(--aw-text-muted)]">مدت:</span><span>{meeting.duration}</span></div>
            <div>
              <div className="text-[var(--aw-text-muted)] mb-1.5">شرکت‌کنندگان ({toFa(attendeeNames.length)} نفر):</div>
              <div className="flex flex-wrap gap-1.5">
                {attendeeNames.map((n, i) => (
                  <span key={i} className="px-2 py-1 rounded-md text-[11px] border border-[var(--aw-border)]" style={{ background: 'var(--aw-bg-card)' }}>
                    <i className="fa-solid fa-user ml-1 text-[9px] text-[var(--aw-primary)]" />{n}
                  </span>
                ))}
              </div>
            </div>
            <div className="mt-3 p-2.5 rounded-[10px] border border-[var(--aw-border)] flex items-start gap-2" style={{ background: 'rgba(126,95,170,0.08)' }}>
              <i className="fa-solid fa-microphone-lines text-[var(--aw-primary)] mt-0.5" />
              <div className="text-[11px] text-[var(--aw-text-secondary)]">
                منشی هوشمند در این جلسه حضور دارد و تمامی گفتگوها را ثبت کرده و صورتجلسه تهیه می‌کند.
              </div>
            </div>
          </div>
        )}
        {tab === 'transcript' && (
          meeting.transcript.length === 0 ? (
            <div className="text-center py-10 text-[var(--aw-text-muted)]">
              <i className="fa-solid fa-clock text-3xl mb-3 block opacity-40" />
              <p className="text-[12px]">جلسه هنوز برگزار نشده است</p>
            </div>
          ) : (
            <div className="space-y-2">
              {meeting.transcript.map((m, i) => {
                const sender = personnel.find(p => p.id === m.from);
                return (
                  <div key={i} className="flex gap-2 items-start">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] flex-shrink-0 bg-[var(--aw-primary)]" style={{ fontWeight: 700 }}>
                      {sender?.name?.[0] || '؟'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] text-[var(--aw-text-muted)] mb-0.5 flex items-center gap-1.5">
                        <span style={{ fontWeight: 600 }}>{sender?.name || m.from}</span>
                        <span>·</span>
                        <span>{m.time}</span>
                      </div>
                      <div className="text-[12px] rounded-[10px] p-2.5 inline-block border border-[var(--aw-border)]" style={{ background: 'var(--aw-bg-card)' }}>
                        {m.text}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
        {tab === 'minutes' && (
          meeting.minutes.length === 0 ? (
            <div className="text-center py-10 text-[var(--aw-text-muted)]">
              <i className="fa-solid fa-file-circle-xmark text-3xl mb-3 block opacity-40" />
              <p className="text-[12px]">صورتجلسه پس از برگزاری تهیه می‌شود</p>
            </div>
          ) : (
            <div className="rounded-[12px] p-3 border border-[var(--aw-border)]" style={{ background: 'var(--aw-bg-card)' }}>
              <div className="flex items-center gap-2 mb-2.5 pb-2 border-b border-[var(--aw-border)]">
                <i className="fa-solid fa-wand-magic-sparkles text-[var(--aw-primary)]" />
                <span className="text-[12px]" style={{ fontWeight: 700 }}>صورتجلسه تهیه‌شده توسط منشی هوشمند</span>
              </div>
              <ol className="space-y-2 list-decimal pr-5">
                {meeting.minutes.map((m, i) => (
                  <li key={i} className="text-[12px] text-[var(--aw-text-secondary)] leading-relaxed">{m}</li>
                ))}
              </ol>
            </div>
          )
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-[var(--aw-border)] text-[11px] text-[var(--aw-text-muted)] text-center flex items-center justify-center gap-1.5">
        <i className="fa-solid fa-lock" />
        دسترسی ادمین فقط خواندنی است
      </div>
    </div>
  );
}

export function NewMeetingContent() {
  const { personnel, customers, closeModal, showToast } = useApp();
  const [kind, setKind] = useState<'inperson' | 'online'>('inperson');
  const [title, setTitle] = useState('');
  const [agenda, setAgenda] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState('۱ ساعت');
  const [location, setLocation] = useState('');
  const [platform, setPlatform] = useState<'meet' | 'zoom' | 'skype' | 'teams' | 'custom'>('meet');
  const [link, setLink] = useState('');
  const [selectedPersonnel, setSelectedPersonnel] = useState<string[]>([]);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [externalGuest, setExternalGuest] = useState('');
  const [externalGuests, setExternalGuests] = useState<string[]>([]);
  const [reminder, setReminder] = useState('۱۵ دقیقه قبل');
  const [recordEnabled, setRecordEnabled] = useState(true);
  const [autoMinutes, setAutoMinutes] = useState(true);
  const [notifyAttendees, setNotifyAttendees] = useState(true);
  const [priority, setPriority] = useState<'low' | 'normal' | 'high'>('normal');
  const [repeat, setRepeat] = useState<'none' | 'daily' | 'weekly' | 'monthly'>('none');
  const [agendaItems, setAgendaItems] = useState<string[]>([]);
  const [agendaInput, setAgendaInput] = useState('');
  const [category, setCategory] = useState<'internal' | 'customer' | 'sales' | 'hr' | 'strategy' | 'training' | 'other'>('internal');
  const [confidentiality, setConfidentiality] = useState<'public' | 'internal' | 'confidential'>('internal');
  const [host, setHost] = useState<string>('');
  const [equipment, setEquipment] = useState<string[]>([]);
  const [equipmentInput, setEquipmentInput] = useState('');
  const [expectedOutcomes, setExpectedOutcomes] = useState('');
  const [attachments, setAttachments] = useState<string[]>([]);
  const [attachmentInput, setAttachmentInput] = useState('');
  const [timezone, setTimezone] = useState('Asia/Tehran');
  const [calendarSync, setCalendarSync] = useState<{ google: boolean; outlook: boolean }>({ google: true, outlook: false });
  const [createFollowupTasks, setCreateFollowupTasks] = useState(true);
  const [sendMinutesTo, setSendMinutesTo] = useState<'attendees' | 'managers' | 'all'>('attendees');

  const categoryOptions = [
    { id: 'internal' as const, label: 'داخلی', icon: 'fa-solid fa-users', color: '#3b82f6' },
    { id: 'customer' as const, label: 'مشتری', icon: 'fa-solid fa-handshake', color: '#10b981' },
    { id: 'sales' as const, label: 'فروش', icon: 'fa-solid fa-chart-line', color: '#f59e0b' },
    { id: 'hr' as const, label: 'استخدام', icon: 'fa-solid fa-user-tie', color: '#22A6F0' },
    { id: 'strategy' as const, label: 'استراتژیک', icon: 'fa-solid fa-chess', color: '#8b5cf6' },
    { id: 'training' as const, label: 'آموزشی', icon: 'fa-solid fa-graduation-cap', color: '#06b6d4' },
    { id: 'other' as const, label: 'سایر', icon: 'fa-solid fa-ellipsis', color: '#64748b' },
  ];
  const confidentialityOptions = [
    { id: 'public' as const, label: 'عمومی', icon: 'fa-solid fa-globe', color: '#10b981' },
    { id: 'internal' as const, label: 'داخلی', icon: 'fa-solid fa-building', color: '#3b82f6' },
    { id: 'confidential' as const, label: 'محرمانه', icon: 'fa-solid fa-lock', color: '#ef4444' },
  ];
  const equipmentSuggestions = ['پروژکتور', 'وایت‌برد', 'سیستم صوتی', 'دوربین', 'لپ‌تاپ مهمان', 'پذیرایی'];
  const timezoneOptions = [
    { v: 'Asia/Tehran', label: 'تهران (GMT+۳:۳۰)' },
    { v: 'Asia/Dubai', label: 'دبی (GMT+۴)' },
    { v: 'Europe/London', label: 'لندن (GMT+۰)' },
    { v: 'Europe/Berlin', label: 'برلین (GMT+۱)' },
    { v: 'America/New_York', label: 'نیویورک (GMT-۵)' },
  ];

  const addEquipment = (v?: string) => {
    const val = (v ?? equipmentInput).trim();
    if (!val || equipment.includes(val)) { setEquipmentInput(''); return; }
    setEquipment(prev => [...prev, val]);
    setEquipmentInput('');
  };
  const removeEquipment = (i: number) => setEquipment(prev => prev.filter((_, idx) => idx !== i));
  const addAttachment = () => {
    const v = attachmentInput.trim();
    if (!v) return;
    setAttachments(prev => [...prev, v]);
    setAttachmentInput('');
  };
  const removeAttachment = (i: number) => setAttachments(prev => prev.filter((_, idx) => idx !== i));

  const platformConfig: Record<typeof platform, { label: string; icon: string; color: string; sample: string }> = {
    meet: { label: 'Google Meet', icon: 'fa-solid fa-video', color: '#16a34a', sample: 'meet.google.com/abc-defg-hij' },
    zoom: { label: 'Zoom', icon: 'fa-solid fa-video', color: '#2563eb', sample: 'zoom.us/j/123456789' },
    skype: { label: 'Skype', icon: 'fa-brands fa-skype', color: '#0ea5e9', sample: 'join.skype.com/xyz' },
    teams: { label: 'Microsoft Teams', icon: 'fa-solid fa-users-rectangle', color: '#7c3aed', sample: 'teams.microsoft.com/l/meetup-join/...' },
    custom: { label: 'لینک سفارشی', icon: 'fa-solid fa-link', color: '#1E6BFF', sample: 'https://...' },
  };

  const togglePerson = (id: string) => {
    setSelectedPersonnel(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };
  const toggleCustomer = (id: string) => {
    setSelectedCustomers(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };
  const addExternalGuest = () => {
    const v = externalGuest.trim();
    if (!v) return;
    setExternalGuests(prev => [...prev, v]);
    setExternalGuest('');
  };
  const removeExternalGuest = (i: number) => {
    setExternalGuests(prev => prev.filter((_, idx) => idx !== i));
  };
  const addAgendaItem = () => {
    const v = agendaInput.trim();
    if (!v) return;
    setAgendaItems(prev => [...prev, v]);
    setAgendaInput('');
  };
  const removeAgendaItem = (i: number) => {
    setAgendaItems(prev => prev.filter((_, idx) => idx !== i));
  };
  const generateLink = () => {
    const cfg = platformConfig[platform];
    const id = Math.random().toString(36).slice(2, 11);
    if (platform === 'meet') setLink(`https://meet.google.com/${id.slice(0,3)}-${id.slice(3,7)}-${id.slice(7,10)}`);
    else if (platform === 'zoom') setLink(`https://zoom.us/j/${Math.floor(Math.random() * 1e10)}`);
    else if (platform === 'skype') setLink(`https://join.skype.com/${id}`);
    else if (platform === 'teams') setLink(`https://teams.microsoft.com/l/meetup-join/${id}`);
    else setLink(`https://`);
    showToast(`لینک ${cfg.label} ساخته شد`);
  };

  const totalAttendees = selectedPersonnel.length + selectedCustomers.length + externalGuests.length;

  const save = () => {
    if (!title.trim()) { showToast('عنوان جلسه را وارد کنید'); return; }
    if (!date.trim() || !time.trim()) { showToast('تاریخ و ساعت را تعیین کنید'); return; }
    if (kind === 'inperson' && !location.trim()) { showToast('مکان جلسه را وارد کنید'); return; }
    if (kind === 'online' && !link.trim()) { showToast('لینک جلسه را وارد کنید یا تولید کنید'); return; }
    if (totalAttendees === 0) { showToast('حداقل یک شرکت‌کننده انتخاب کنید'); return; }
    closeModal();
    showToast(`جلسه «${title.trim()}» برنامه‌ریزی شد${notifyAttendees ? ' و دعوت‌نامه‌ها ارسال شد' : ''}`);
  };

  const durationOptions = ['۳۰ دقیقه', '۴۵ دقیقه', '۱ ساعت', '۱.۵ ساعت', '۲ ساعت', '۳ ساعت', 'تمام روز'];
  const reminderOptions = ['بدون یادآوری', '۵ دقیقه قبل', '۱۵ دقیقه قبل', '۳۰ دقیقه قبل', '۱ ساعت قبل', '۱ روز قبل'];

  return (
    <div className="flex flex-col gap-3" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
      <div className="flex gap-2">
        {([
          { id: 'inperson' as const, label: 'حضوری', icon: 'fa-solid fa-building-user', desc: 'برگزاری در محل سازمان' },
          { id: 'online' as const, label: 'آنلاین', icon: 'fa-solid fa-video', desc: 'جلسه مجازی از راه دور' },
        ]).map(k => (
          <button
            key={k.id}
            onClick={() => setKind(k.id)}
            className={`flex-1 p-3 rounded-[12px] border cursor-pointer text-right transition-all ${kind === k.id ? 'border-[var(--aw-primary)]' : 'border-[var(--aw-border)] bg-transparent'}`}
            style={kind === k.id ? { background: 'rgba(126,95,170,0.12)' } : undefined}
          >
            <div className="flex items-center gap-2 mb-1">
              <i className={`${k.icon} text-[13px]`} style={{ color: kind === k.id ? 'var(--aw-primary)' : 'var(--aw-text-muted)' }} />
              <span className="text-[13px]" style={{ fontWeight: 700, color: kind === k.id ? 'var(--aw-primary)' : 'var(--aw-text-primary)' }}>{k.label}</span>
            </div>
            <div className="text-[10px] text-[var(--aw-text-muted)]">{k.desc}</div>
          </button>
        ))}
      </div>

      <FormGroup label="دسته‌بندی جلسه">
        <div className="flex flex-wrap gap-1.5">
          {categoryOptions.map(c => {
            const active = category === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setCategory(c.id)}
                className="px-2.5 py-1.5 rounded-md text-[11px] border cursor-pointer transition-all flex items-center gap-1.5"
                style={active ? { background: `${c.color}22`, borderColor: c.color, color: c.color, fontWeight: 700 } : { borderColor: 'var(--aw-border)', background: 'transparent', color: 'var(--aw-text-secondary)', fontWeight: 600 }}
              >
                <i className={`${c.icon} text-[10px]`} />
                {c.label}
              </button>
            );
          })}
        </div>
      </FormGroup>

      <FormGroup label="عنوان جلسه *">
        <FormInput placeholder="مثلاً: جلسه هفتگی تیم فروش" value={title} onChange={e => setTitle(e.target.value)} />
      </FormGroup>

      <FormGroup label="خلاصه/توضیحات">
        <textarea
          className="w-full rounded-[10px] p-3 text-[12px] resize-none border border-[var(--aw-border)] outline-none bg-[var(--aw-bg-input)] text-[var(--aw-text-primary)]"
          rows={2}
          placeholder="توضیح مختصر درباره موضوع و هدف جلسه"
          value={agenda}
          onChange={e => setAgenda(e.target.value)}
        />
      </FormGroup>

      <div className="grid grid-cols-2 gap-2">
        <FormGroup label="تاریخ *">
          <FormInput placeholder="مثلاً ۱۴۰۵/۰۳/۲۰" value={date} onChange={e => setDate(e.target.value)} />
        </FormGroup>
        <FormGroup label="ساعت *">
          <FormInput placeholder="مثلاً ۱۴:۰۰" value={time} onChange={e => setTime(e.target.value)} />
        </FormGroup>
      </div>

      <FormGroup label="مدت زمان">
        <div className="flex flex-wrap gap-1.5">
          {durationOptions.map(d => (
            <button
              key={d}
              onClick={() => setDuration(d)}
              className={`px-2.5 py-1.5 rounded-md text-[11px] border cursor-pointer transition-all ${duration === d ? 'text-white border-[var(--aw-primary)]' : 'bg-transparent border-[var(--aw-border)] text-[var(--aw-text-secondary)]'}`}
              style={duration === d ? { background: 'var(--aw-primary)', fontWeight: 600 } : { fontWeight: 600 }}
            >
              {d}
            </button>
          ))}
        </div>
      </FormGroup>

      {kind === 'inperson' ? (
        <>
          <FormGroup label="مکان برگزاری *">
            <FormInput placeholder="مثلاً: اتاق جلسات طبقه ۳" value={location} onChange={e => setLocation(e.target.value)} />
          </FormGroup>
          <FormGroup label="تجهیزات مورد نیاز">
            <div className="flex flex-wrap gap-1.5 mb-1.5">
              {equipmentSuggestions.map(s => {
                const active = equipment.includes(s);
                return (
                  <button
                    key={s}
                    onClick={() => active ? removeEquipment(equipment.indexOf(s)) : addEquipment(s)}
                    className="px-2 py-1 rounded-md text-[11px] border cursor-pointer transition-all flex items-center gap-1"
                    style={active ? { background: 'var(--aw-primary)', borderColor: 'var(--aw-primary)', color: 'white', fontWeight: 600 } : { background: 'transparent', borderColor: 'var(--aw-border)', color: 'var(--aw-text-secondary)', fontWeight: 600 }}
                  >
                    {active && <i className="fa-solid fa-check text-[9px]" />}
                    {s}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-1.5">
              <FormInput placeholder="تجهیز سفارشی..." value={equipmentInput} onChange={e => setEquipmentInput(e.target.value)} onKeyDown={(e: any) => { if (e.key === 'Enter') { e.preventDefault(); addEquipment(); } }} />
              <button onClick={() => addEquipment()} className="px-3 rounded-[10px] border border-[var(--aw-border)] bg-transparent text-[var(--aw-text-primary)] cursor-pointer text-[11px]" style={{ fontWeight: 600 }}>
                <i className="fa-solid fa-plus" />
              </button>
            </div>
            {equipment.filter(e => !equipmentSuggestions.includes(e)).length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {equipment.filter(e => !equipmentSuggestions.includes(e)).map((e, i) => (
                  <span key={i} className="px-2 py-1 rounded-md text-[11px] border border-[var(--aw-border)] flex items-center gap-1.5" style={{ background: 'var(--aw-bg-card)' }}>
                    {e}
                    <button onClick={() => removeEquipment(equipment.indexOf(e))} className="border-none bg-transparent text-red-400 cursor-pointer p-0">
                      <i className="fa-solid fa-times text-[9px]" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </FormGroup>
        </>
      ) : (
        <>
          <FormGroup label="پلتفرم جلسه">
            <div className="grid grid-cols-5 gap-1.5">
              {(Object.keys(platformConfig) as (keyof typeof platformConfig)[]).map(p => {
                const c = platformConfig[p];
                const active = platform === p;
                return (
                  <button
                    key={p}
                    onClick={() => setPlatform(p)}
                    className={`p-2 rounded-[10px] border cursor-pointer flex flex-col items-center gap-1 transition-all ${active ? 'border-[var(--aw-primary)]' : 'border-[var(--aw-border)] bg-transparent'}`}
                    style={active ? { background: 'rgba(126,95,170,0.12)' } : undefined}
                  >
                    <i className={c.icon} style={{ color: c.color, fontSize: 14 }} />
                    <span className="text-[9px] text-[var(--aw-text-secondary)] truncate w-full text-center" style={{ fontWeight: 600 }}>{c.label}</span>
                  </button>
                );
              })}
            </div>
          </FormGroup>
          <FormGroup label="لینک جلسه *">
            <div className="flex gap-1.5">
              <FormInput placeholder={platformConfig[platform].sample} value={link} onChange={e => setLink(e.target.value)} />
              <button
                onClick={generateLink}
                className="px-3 rounded-[10px] border-none cursor-pointer text-[11px] text-white whitespace-nowrap"
                style={{ background: 'var(--aw-primary)', fontWeight: 600 }}
              >
                <i className="fa-solid fa-wand-magic-sparkles ml-1" />تولید لینک
              </button>
            </div>
          </FormGroup>
          <FormGroup label="منطقهٔ زمانی">
            <select
              value={timezone}
              onChange={e => setTimezone(e.target.value)}
              className="w-full rounded-[10px] p-2.5 text-[12px] border border-[var(--aw-border)] outline-none bg-[var(--aw-bg-input)] text-[var(--aw-text-primary)]"
            >
              {timezoneOptions.map(t => <option key={t.v} value={t.v}>{t.label}</option>)}
            </select>
          </FormGroup>
        </>
      )}

      <FormGroup label={`شرکت‌کنندگان (${toFa(totalAttendees)} نفر)`}>
        <div className="rounded-[10px] border border-[var(--aw-border)] overflow-hidden">
          <div className="px-3 py-2 text-[10px] text-[var(--aw-text-muted)] border-b border-[var(--aw-border)] flex items-center gap-1.5" style={{ background: 'var(--aw-bg-card)', fontWeight: 700 }}>
            <i className="fa-solid fa-user-tie" /> پرسنل سازمان
          </div>
          <div className="max-h-32 overflow-y-auto aw-scroll p-1.5 flex flex-wrap gap-1.5">
            {personnel.map((p: any) => {
              const active = selectedPersonnel.includes(p.id);
              return (
                <button
                  key={p.id}
                  onClick={() => togglePerson(p.id)}
                  className={`px-2 py-1 rounded-md text-[11px] border cursor-pointer transition-all flex items-center gap-1 ${active ? 'text-white border-[var(--aw-primary)]' : 'bg-transparent border-[var(--aw-border)] text-[var(--aw-text-secondary)]'}`}
                  style={active ? { background: 'var(--aw-primary)', fontWeight: 600 } : { fontWeight: 600 }}
                >
                  {active && <i className="fa-solid fa-check text-[9px]" />}
                  {p.name}
                </button>
              );
            })}
          </div>
        </div>

        {customers && customers.length > 0 && (
          <div className="mt-2 rounded-[10px] border border-[var(--aw-border)] overflow-hidden">
            <div className="px-3 py-2 text-[10px] text-[var(--aw-text-muted)] border-b border-[var(--aw-border)] flex items-center gap-1.5" style={{ background: 'var(--aw-bg-card)', fontWeight: 700 }}>
              <i className="fa-solid fa-handshake" /> مشتریان/مخاطبین
            </div>
            <div className="max-h-32 overflow-y-auto aw-scroll p-1.5 flex flex-wrap gap-1.5">
              {customers.map((c: any) => {
                const active = selectedCustomers.includes(c.id);
                return (
                  <button
                    key={c.id}
                    onClick={() => toggleCustomer(c.id)}
                    className={`px-2 py-1 rounded-md text-[11px] border cursor-pointer transition-all flex items-center gap-1 ${active ? 'text-white border-emerald-500' : 'bg-transparent border-[var(--aw-border)] text-[var(--aw-text-secondary)]'}`}
                    style={active ? { background: '#10b981', fontWeight: 600 } : { fontWeight: 600 }}
                  >
                    {active && <i className="fa-solid fa-check text-[9px]" />}
                    {c.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-2">
          <div className="flex gap-1.5 mb-1.5">
            <FormInput placeholder="مهمان خارجی (ایمیل یا نام)" value={externalGuest} onChange={e => setExternalGuest(e.target.value)} onKeyDown={(e: any) => { if (e.key === 'Enter') { e.preventDefault(); addExternalGuest(); } }} />
            <button onClick={addExternalGuest} className="px-3 rounded-[10px] border border-[var(--aw-border)] bg-transparent text-[var(--aw-text-primary)] cursor-pointer text-[11px]" style={{ fontWeight: 600 }}>
              <i className="fa-solid fa-plus" />
            </button>
          </div>
          {externalGuests.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {externalGuests.map((g, i) => (
                <span key={i} className="px-2 py-1 rounded-md text-[11px] border border-[var(--aw-border)] flex items-center gap-1.5" style={{ background: 'var(--aw-bg-card)' }}>
                  <i className="fa-solid fa-user-plus text-[9px] text-[var(--aw-primary)]" />
                  {g}
                  <button onClick={() => removeExternalGuest(i)} className="border-none bg-transparent text-red-400 cursor-pointer p-0">
                    <i className="fa-solid fa-times text-[9px]" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </FormGroup>

      <FormGroup label="میزبان/مسئول جلسه">
        <select
          value={host}
          onChange={e => setHost(e.target.value)}
          className="w-full rounded-[10px] p-2.5 text-[12px] border border-[var(--aw-border)] outline-none bg-[var(--aw-bg-input)] text-[var(--aw-text-primary)]"
        >
          <option value="">— انتخاب میزبان —</option>
          {personnel.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </FormGroup>

      <FormGroup label="دستور جلسه (مواد بحث)">
        <div className="flex gap-1.5 mb-1.5">
          <FormInput placeholder="مورد جدید..." value={agendaInput} onChange={e => setAgendaInput(e.target.value)} onKeyDown={(e: any) => { if (e.key === 'Enter') { e.preventDefault(); addAgendaItem(); } }} />
          <button onClick={addAgendaItem} className="px-3 rounded-[10px] border border-[var(--aw-border)] bg-transparent text-[var(--aw-text-primary)] cursor-pointer text-[11px]" style={{ fontWeight: 600 }}>
            <i className="fa-solid fa-plus" />
          </button>
        </div>
        {agendaItems.length > 0 && (
          <ol className="space-y-1 list-decimal pr-5">
            {agendaItems.map((a, i) => (
              <li key={i} className="text-[12px] text-[var(--aw-text-secondary)] flex items-center justify-between gap-2">
                <span>{a}</span>
                <button onClick={() => removeAgendaItem(i)} className="border-none bg-transparent text-red-400 cursor-pointer">
                  <i className="fa-solid fa-times text-[10px]" />
                </button>
              </li>
            ))}
          </ol>
        )}
      </FormGroup>

      <FormGroup label="خروجی‌های مورد انتظار">
        <textarea
          className="w-full rounded-[10px] p-3 text-[12px] resize-none border border-[var(--aw-border)] outline-none bg-[var(--aw-bg-input)] text-[var(--aw-text-primary)]"
          rows={2}
          placeholder="تصمیمات یا خروجی‌هایی که از این جلسه انتظار می‌رود"
          value={expectedOutcomes}
          onChange={e => setExpectedOutcomes(e.target.value)}
        />
      </FormGroup>

      <FormGroup label="فایل‌ها و پیوست‌ها">
        <div className="flex gap-1.5 mb-1.5">
          <FormInput placeholder="نام فایل یا لینک سند..." value={attachmentInput} onChange={e => setAttachmentInput(e.target.value)} onKeyDown={(e: any) => { if (e.key === 'Enter') { e.preventDefault(); addAttachment(); } }} />
          <button onClick={addAttachment} className="px-3 rounded-[10px] border border-[var(--aw-border)] bg-transparent text-[var(--aw-text-primary)] cursor-pointer text-[11px]" style={{ fontWeight: 600 }}>
            <i className="fa-solid fa-paperclip" />
          </button>
        </div>
        {attachments.length > 0 && (
          <div className="flex flex-col gap-1">
            {attachments.map((a, i) => (
              <div key={i} className="flex items-center gap-2 px-2 py-1.5 rounded-md border border-[var(--aw-border)]" style={{ background: 'var(--aw-bg-card)' }}>
                <i className="fa-solid fa-file text-[11px] text-[var(--aw-primary)]" />
                <span className="text-[11px] text-[var(--aw-text-primary)] flex-1 truncate">{a}</span>
                <button onClick={() => removeAttachment(i)} className="border-none bg-transparent text-red-400 cursor-pointer p-0">
                  <i className="fa-solid fa-times text-[10px]" />
                </button>
              </div>
            ))}
          </div>
        )}
      </FormGroup>

      <FormGroup label="سطح محرمانگی">
        <div className="flex gap-1.5">
          {confidentialityOptions.map(c => {
            const active = confidentiality === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setConfidentiality(c.id)}
                className="flex-1 py-2 rounded-md text-[11px] border cursor-pointer transition-all flex items-center justify-center gap-1.5"
                style={active ? { background: `${c.color}22`, borderColor: c.color, color: c.color, fontWeight: 700 } : { background: 'transparent', borderColor: 'var(--aw-border)', color: 'var(--aw-text-secondary)', fontWeight: 600 }}
              >
                <i className={`${c.icon} text-[10px]`} />
                {c.label}
              </button>
            );
          })}
        </div>
      </FormGroup>

      <div className="grid grid-cols-2 gap-2">
        <FormGroup label="اولویت">
          <div className="flex gap-1">
            {([
              { id: 'low' as const, label: 'پایین', color: '#10b981' },
              { id: 'normal' as const, label: 'عادی', color: '#3b82f6' },
              { id: 'high' as const, label: 'بالا', color: '#ef4444' },
            ]).map(p => (
              <button key={p.id} onClick={() => setPriority(p.id)}
                className={`flex-1 py-1.5 rounded-md text-[11px] border cursor-pointer transition-all ${priority === p.id ? 'text-white' : 'bg-transparent text-[var(--aw-text-secondary)]'}`}
                style={priority === p.id ? { background: p.color, borderColor: p.color, fontWeight: 600 } : { borderColor: 'var(--aw-border)', fontWeight: 600 }}
              >{p.label}</button>
            ))}
          </div>
        </FormGroup>
        <FormGroup label="تکرار">
          <select
            value={repeat}
            onChange={e => setRepeat(e.target.value as any)}
            className="w-full rounded-[10px] p-2.5 text-[12px] border border-[var(--aw-border)] outline-none bg-[var(--aw-bg-input)] text-[var(--aw-text-primary)]"
          >
            <option value="none">بدون تکرار</option>
            <option value="daily">روزانه</option>
            <option value="weekly">هفتگی</option>
            <option value="monthly">ماهانه</option>
          </select>
        </FormGroup>
      </div>

      <FormGroup label="🔔 یادآوری">
        <div className="flex flex-wrap gap-1.5">
          {reminderOptions.map(r => (
            <button key={r} onClick={() => setReminder(r)}
              className={`px-2.5 py-1.5 rounded-md text-[11px] border cursor-pointer transition-all ${reminder === r ? 'text-white border-[var(--aw-primary)]' : 'bg-transparent border-[var(--aw-border)] text-[var(--aw-text-secondary)]'}`}
              style={reminder === r ? { background: 'var(--aw-primary)', fontWeight: 600 } : { fontWeight: 600 }}
            >{r}</button>
          ))}
        </div>
      </FormGroup>

      <FormGroup label="همگام‌سازی با تقویم">
        <div className="grid grid-cols-2 gap-2">
          {([
            { k: 'google' as const, label: 'Google Calendar', icon: 'fa-brands fa-google', color: '#ea4335' },
            { k: 'outlook' as const, label: 'Outlook', icon: 'fa-brands fa-microsoft', color: '#0078d4' },
          ]).map(c => {
            const active = calendarSync[c.k];
            return (
              <button
                key={c.k}
                onClick={() => setCalendarSync(prev => ({ ...prev, [c.k]: !prev[c.k] }))}
                className="p-2.5 rounded-[10px] border cursor-pointer flex items-center gap-2 transition-all"
                style={active ? { background: `${c.color}15`, borderColor: c.color } : { background: 'transparent', borderColor: 'var(--aw-border)' }}
              >
                <i className={c.icon} style={{ color: c.color, fontSize: 14 }} />
                <span className="text-[11px]" style={{ fontWeight: 600, color: active ? c.color : 'var(--aw-text-secondary)' }}>{c.label}</span>
                {active && <i className="fa-solid fa-check text-[10px] mr-auto" style={{ color: c.color }} />}
              </button>
            );
          })}
        </div>
      </FormGroup>

      <FormGroup label="ارسال صورتجلسه به">
        <div className="flex gap-1.5">
          {([
            { v: 'attendees' as const, label: 'فقط شرکت‌کنندگان' },
            { v: 'managers' as const, label: 'مدیران مرتبط' },
            { v: 'all' as const, label: 'همه پرسنل' },
          ]).map(o => (
            <button
              key={o.v}
              onClick={() => setSendMinutesTo(o.v)}
              className="flex-1 py-1.5 rounded-md text-[11px] border cursor-pointer transition-all"
              style={sendMinutesTo === o.v ? { background: 'var(--aw-primary)', borderColor: 'var(--aw-primary)', color: 'white', fontWeight: 600 } : { background: 'transparent', borderColor: 'var(--aw-border)', color: 'var(--aw-text-secondary)', fontWeight: 600 }}
            >{o.label}</button>
          ))}
        </div>
      </FormGroup>

      <div className="rounded-[12px] border border-[var(--aw-border)] p-3" style={{ background: 'rgba(126,95,170,0.06)' }}>
        <div className="flex items-center gap-2 mb-2.5">
          <i className="fa-solid fa-microphone-lines text-[var(--aw-primary)]" />
          <span className="text-[12px]" style={{ fontWeight: 700 }}>امکانات منشی هوشمند</span>
        </div>
        {[
          { key: 'record', label: 'ضبط و رونویسی گفتگوها', desc: 'تمام گفتگوهای جلسه به متن تبدیل می‌شود', value: recordEnabled, setter: setRecordEnabled, icon: 'fa-solid fa-circle-dot' },
          { key: 'minutes', label: 'تهیه خودکار صورتجلسه', desc: 'منشی هوشمند صورتجلسه را به‌صورت خودکار آماده می‌کند', value: autoMinutes, setter: setAutoMinutes, icon: 'fa-solid fa-file-lines' },
          { key: 'notify', label: 'ارسال دعوت‌نامه به شرکت‌کنندگان', desc: 'پیامک/ایمیل دعوت با لینک یا آدرس ارسال شود', value: notifyAttendees, setter: setNotifyAttendees, icon: 'fa-solid fa-paper-plane' },
          { key: 'followup', label: 'ایجاد خودکار تسک‌های پیگیری', desc: 'تصمیمات جلسه به تسک تبدیل و به افراد مسئول ارجاع شود', value: createFollowupTasks, setter: setCreateFollowupTasks, icon: 'fa-solid fa-list-check' },
        ].map(opt => (
          <div key={opt.key} className="flex items-center justify-between gap-3 py-2 border-t border-[var(--aw-border)] first:border-t-0">
            <div className="flex items-start gap-2 flex-1 min-w-0">
              <i className={`${opt.icon} text-[12px] text-[var(--aw-text-muted)] mt-0.5`} />
              <div className="flex-1 min-w-0">
                <div className="text-[12px]" style={{ fontWeight: 600 }}>{opt.label}</div>
                <div className="text-[10px] text-[var(--aw-text-muted)]">{opt.desc}</div>
              </div>
            </div>
            <button
              onClick={() => opt.setter(!opt.value)}
              className="relative w-10 h-5 rounded-full border-none cursor-pointer flex-shrink-0 transition-all"
              style={{ background: opt.value ? 'var(--aw-primary)' : 'var(--aw-bg-card)' }}
            >
              <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all" style={{ right: opt.value ? '2px' : '22px' }} />
            </button>
          </div>
        ))}
      </div>

      <div className="flex gap-2 pt-1">
        <button
          onClick={closeModal}
          className="flex-1 py-2.5 rounded-[10px] border border-[var(--aw-border)] bg-transparent text-[var(--aw-text-primary)] cursor-pointer text-[12px]"
          style={{ fontWeight: 600 }}
        >
          انصراف
        </button>
        <button
          onClick={save}
          className="flex-[2] py-2.5 rounded-[10px] border-none text-white cursor-pointer text-[12px]"
          style={{ background: 'var(--aw-primary)', fontWeight: 700 }}
        >
          <i className="fa-solid fa-calendar-check ml-1.5" />
          ثبت و برگزاری جلسه
        </button>
      </div>
    </div>
  );
}
