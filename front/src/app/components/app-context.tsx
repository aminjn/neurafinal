import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import {
  Agent, Personnel, Customer, Deal, FinanceItem, Order, Message, Topic, UserProfile, Task,
  INITIAL_AGENTS, INITIAL_PERSONNEL, INITIAL_CUSTOMERS, CRM_DEALS, FINANCE_DATA, INITIAL_ORDERS, INITIAL_TASKS,
  INITIAL_USER_PROFILE, INITIAL_EU_PROFILE,
  Invoice, INVOICES_DATA,
  COMPANIES,
  nowTime, toFa, generateReply
} from './data';
import { api, getToken, setToken } from '../services/api';
// —— شناسهٔ کاربر از JWT + پرچم‌های per-user (بریفینگ/احراز) ——
function __neuraUid(): string { try { const t = localStorage.getItem('aw-token') || ''; const p = t.split('.')[1]; if (!p) return ''; const j = JSON.parse(decodeURIComponent(escape(atob(p.replace(/-/g, '+').replace(/_/g, '/'))))); return String(j.sub || j.id || ''); } catch (_) { return ''; } }
function __briefSeenToday(): boolean { try { return localStorage.getItem('aw-brief:' + __neuraUid()) === new Date().toISOString().slice(0, 10); } catch (_) { return false; } }
function __setBriefSeen() { try { localStorage.setItem('aw-brief:' + __neuraUid(), new Date().toISOString().slice(0, 10)); } catch (_) {} }
function __verifiedSeed(): boolean { try { return localStorage.getItem('aw-verified:' + __neuraUid()) === '1'; } catch (_) { return false; } }

// ========================
// Types
// ========================
export interface WalletTx {
  id: string;
  type: 'deposit' | 'withdraw' | 'purchase' | 'spend';
  title: string;
  date: string;     // Persian datetime string
  amount: number;   // signed toman
}
export const INITIAL_WALLET_TX: WalletTx[] = [];
function nowDateTimeFa(): string {
  try { return new Intl.DateTimeFormat('fa-IR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date()); }
  catch { return 'هم‌اکنون'; }
}
export type AdminScreen = 'assistantScreen' | 'secTodayScreen' | 'chatsScreen' | 'dashboardScreen' | 'crmScreen' | 'financeScreen' | 'reportsScreen' | 'analyticsScreen' | 'moreScreen' | 'tasksScreen' | 'inventoryScreen' | 'purchaseRequestScreen' | 'salesFunnelScreen' | 'salesForecastScreen' | 'campaignScreen' | 'secPlanningScreen' | 'secCrmLiteScreen' | 'secPerformanceScreen' | 'secDailyFinanceScreen' | 'mktConversationsScreen' | 'mktLeadsScreen' | 'mktSegmentScreen' | 'mktPerformanceScreen' | 'mktApprovalsScreen' | 'mktCalendarScreen' | 'procRequestsScreen' | 'procOrdersScreen' | 'procDeliveryScreen' | 'procSupplyScreen' | 'procImportScreen' | 'procFinanceScreen' | 'salesPosScreen' | 'salesOrdersScreen' | 'salesInvoicesScreen' | 'salesMenuScreen' | 'salesCustomersScreen' | 'salesQuickReportScreen' | 'salesConversationsScreen' | 'salesShiftScreen' | 'dineMenuScreen' | 'dineKdsScreen' | 'dineTablesScreen' | 'dinePosScreen' | 'dineRecipesScreen' | 'dineStaffScreen' | 'dineReservationsScreen' | 'dineLoyaltyScreen' | 'dineMarketingScreen' | 'dineCompetitorsScreen' | 'dineReportsScreen' | 'dineSettingsScreen';
export type EuScreen = 'euHomeScreen' | 'euChatListScreen' | 'euAgentDiscovery' | 'euOrdersScreen' | 'euProfileScreen' | 'euDineScreen' | 'euAssistantScreen' | 'euSupportScreen' | 'euMarketScreen' | 'euPlannerScreen' | 'euSearchScreen' | 'euReportScreen' | 'euCartScreen' | 'euOffersScreen';
export type ChatTab = 'agents' | 'personnel' | 'customers' | string;
export type AgentTeam = 'assistant' | 'marketing' | 'secretary' | 'finance' | 'procurement' | 'sales' | 'dine' | null;
export type CrmTab = 'customers' | 'leads' | 'deals';
export type FinTab = 'overview' | 'income' | 'expense' | 'invoices';
export type ThemeMode = 'dark' | 'light' | 'bw' | 'glass';

export interface ChatGroup {
  id: string;
  name: string;
  members: { id: string; type: 'agent' | 'personnel' | 'customer' }[];
  team?: string | null;
}

export interface GroupChat {
  id: string;
  name: string;
  image?: string | null;
  bg: string;
  memberIds: { id: string; type: 'agent' | 'personnel' | 'customer' }[];
  team?: string | null;
}

interface ModalState {
  open: boolean;
  title: string;
  content: React.ReactNode;
  onBack?: (() => void) | null;
}

interface ChatState {
  open: boolean;
  id: string | null;
  type: 'agent' | 'personnel' | 'eu' | 'customer' | 'group' | 'contact' | null;
  topicId: number | null;
  topicsOpen: boolean;
  contactMeta?: { name: string; init: string; bg: string; sub: string };
}

interface CallState {
  open: boolean;
  name: string;
  role: string;
  bg: string;
  init: string;
  ext: string;
  timer: number;
}

interface UnifiedCallState {
  open: boolean;
}

interface ToastState {
  show: boolean;
  message: string;
}

interface AppContextType {
  // Role
  role: 'admin' | 'user';
  setRole: (role: 'admin' | 'user') => void;

  // Screens
  adminScreen: AdminScreen;
  setAdminScreen: (s: AdminScreen) => void;
  euScreen: EuScreen;
  setEuScreen: (s: EuScreen) => void;
  goBack: () => void;
  canGoBack: boolean;

  // Company
  company: string;
  setCompany: (c: string) => void;

  // Chat tabs
  chatTab: ChatTab;
  setChatTab: (t: ChatTab) => void;
  crmTab: CrmTab;
  setCrmTab: (t: CrmTab) => void;
  finTab: FinTab;
  setFinTab: (t: FinTab) => void;

  // Data
  agents: Agent[];
  setAgents: React.Dispatch<React.SetStateAction<Agent[]>>;
  personnel: Personnel[];
  setPersonnel: React.Dispatch<React.SetStateAction<Personnel[]>>;
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  upsertCustomer: (c: any) => Promise<void>;
  dropCustomer: (id: any) => Promise<void>;
  deals: Deal[];
  setDeals: React.Dispatch<React.SetStateAction<Deal[]>>;
  financeData: { income: FinanceItem[]; expense: FinanceItem[] };
  setFinanceData: React.Dispatch<React.SetStateAction<{ income: FinanceItem[]; expense: FinanceItem[] }>>;
  invoices: Invoice[];
  setInvoices: React.Dispatch<React.SetStateAction<Invoice[]>>;
  addInvoice: (inv: Invoice) => void;
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  userProfile: UserProfile;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  euProfile: UserProfile;
  setEuProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;

  // Chat
  chat: ChatState;
  isTyping: boolean;
  openChat: (id: string, type: 'agent' | 'personnel' | 'eu' | 'customer' | 'group' | 'contact', meta?: { name: string; init: string; bg: string; sub: string }, initialMessages?: Message[]) => void;
  closeChat: () => void;
  toggleTopics: () => void;
  switchTopic: (tid: number) => void;
  createNewTopic: () => void;
  renameTopic: (agentId: string, topicId: number, title: string) => void;
  removeTopic: (agentId: string, topicId: number) => void;
  sendMessage: (text: string) => void;
  getMessages: () => Message[];
  getTopics: (id: string) => Topic[];

  // Modal
  modal: ModalState;
  openModal: (title: string, content: React.ReactNode, onBack?: (() => void) | null) => void;
  closeModal: () => void;

  // Call
  call: CallState;
  startCall: (name: string, role: string, bg: string, init: string, ext: string) => void;
  endCall: () => void;

  // Unified Call
  unifiedCall: UnifiedCallState;
  openUnifiedCall: () => void;
  closeUnifiedCall: () => void;

  // Toast
  toast: ToastState;
  showToast: (msg: string) => void;

  // IDs
  nextTopicId: () => number;
  nextMsgId: () => number;

  // Theme
  theme: ThemeMode;
  setTheme: (t: ThemeMode) => void;
  themeAuto: boolean;
  setThemeAuto: (b: boolean) => void;

  // Agent Team
  agentTeam: AgentTeam;
  setAgentTeam: (t: AgentTeam) => void;

  // Active agent accent color (per-agent theme)
  agentAccent: string | null;
  setAgentAccent: (c: string | null) => void;

  // Per-agent accent override for the currently displayed agent (transient)
  teamAccent: string | null;
  setTeamAccent: (c: string | null) => void;

  // Default Agent
  defaultAgent: string;
  setDefaultAgent: (id: string) => void;

  // Active personal assistant (drives welcome + assistant screen identity/theme)
  assistantId: string;
  setAssistantId: (id: string) => void;

  // Currently displayed agent within the active team (shared between avatar + workspace demo state)
  teamAgentId: string | null;
  setTeamAgentId: (id: string | null) => void;

  // Agent ownership (demo until purchased)
  ownedAgents: string[];
  isAgentOwned: (id?: string | null) => boolean;
  purchaseAgent: (id: string, meta?: { name?: string; price?: number }) => void;
  walletBalance: number;
  setWalletBalance: (n: number) => void;
  walletTx: WalletTx[];
  walletDeposit: (amount: number) => void;
  walletWithdraw: (amount: number) => void;
  ownedAvatars: string[];
  ownedThemes: string[];
  buyAvatar: (src: string, price: number) => void;
  buyTheme: (hex: string, price: number) => void;

  // Market promotion subscriptions (boosted shops/products show first)
  promotedMarket: string[];
  setPromotedMarket: React.Dispatch<React.SetStateAction<string[]>>;

  // Text-to-speech (read a message aloud; drives the spectrum avatar)
  speakingMsgId: string | null;
  ttsSpeaking: boolean;
  speakMessage: (id: string, text: string) => void;
  // Chat Groups
  chatGroups: ChatGroup[];
  addChatGroup: (group: ChatGroup) => void;
  removeChatGroup: (id: string) => void;
  updateChatGroup: (id: string, patch: Partial<ChatGroup>) => void;

  groupChats: GroupChat[];
  addGroupChat: (gc: GroupChat) => void;
  removeGroupChat: (id: string) => void;
  updateGroupChat: (id: string, patch: Partial<GroupChat>) => void;

  // Briefing
  briefingSeen: boolean;
  setBriefingSeen: (v: boolean) => void;

  // App entry flow: splash → home/auth → app
  appStage: 'splash' | 'home' | 'auth' | 'app';
  setAppStage: (s: 'splash' | 'home' | 'auth' | 'app') => void;
  authMode: 'login' | 'register';
  setAuthMode: (m: 'login' | 'register') => void;
  hasAccount: boolean;
  completeAuth: () => void;
  logout: () => void;
  // Pre-welcome (splash/home/auth) light–dark toggle
  preTheme: 'light' | 'dark';
  setPreTheme: (t: 'light' | 'dark') => void;
  // Welcome (home) screen — enable/disable + editable copy
  welcomeEnabled: boolean;
  setWelcomeEnabled: (b: boolean) => void;
  welcomeConfig: { title: string; subtitle: string; cta: string; sectionTitle: string };
  setWelcomeConfig: (c: Partial<{ title: string; subtitle: string; cta: string; sectionTitle: string }>) => void;
}
// Persist context across HMR to prevent "useApp must be used within AppProvider" errors
const AppContext = (globalThis as any).__AIW_APP_CTX__ || createContext<AppContextType | null>(null);
if (!(globalThis as any).__AIW_APP_CTX__) {
  (globalThis as any).__AIW_APP_CTX__ = AppContext;
}

export function useApp(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  // IDs
  const topicIdRef = useRef(100);
  const msgIdRef = useRef(1000);
  const callTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const nextTopicId = useCallback(() => ++topicIdRef.current, []);
  const nextMsgId = useCallback(() => ++msgIdRef.current, []);

  // Role
  const [role, setRole] = useState<'admin' | 'user'>('user');
  try { (window as any).__NEURA_BUILD__ = 'v19-realdata'; } catch (_) {}

  // Screens (history-tracked so back goes to the previous screen, not home)
  const [adminScreen, setAdminScreenRaw] = useState<AdminScreen>('chatsScreen');
  const [euScreen, setEuScreenRaw] = useState<EuScreen>('euHomeScreen');
  const navHistory = useRef<Array<{ type: 'admin' | 'eu'; screen: string }>>([]);

  const setAdminScreen = useCallback((s: AdminScreen) => {
    setAdminScreenRaw(prev => { if (s !== prev) navHistory.current.push({ type: 'admin', screen: prev }); return s; });
  }, []);
  const setEuScreen = useCallback((s: EuScreen) => {
    setEuScreenRaw(prev => { if (s !== prev) navHistory.current.push({ type: 'eu', screen: prev }); return s; });
  }, []);
  const goBack = useCallback(() => {
    const entry = navHistory.current.pop();
    if (!entry) return;
    if (entry.type === 'admin') setAdminScreenRaw(entry.screen as AdminScreen);
    else setEuScreenRaw(entry.screen as EuScreen);
  }, []);
  const canGoBack = navHistory.current.length > 0;

  // Company
  const [company, setCompany] = useState('alpha');
  const [companies, setCompanies] = useState<Record<string, { name: string; type: string; phone?: string; address?: string; logo?: string; accent?: string }>>(() => ({ ...COMPANIES }));
  const addCompany = useCallback((name: string, type: string, extra?: { phone?: string; address?: string; logo?: string; accent?: string }) => {
    const key = 'co_' + Date.now();
    const rec = { name, type, ...(extra || {}) };
    setCompanies(prev => ({ ...prev, [key]: rec }));
    (api as any).myCreate('businesses', { id: key, ...rec }).catch(() => {});
    setCompany(key);
    return key;
  }, []);
  const updateCompany = useCallback((key: string, patch: Partial<{ name: string; type: string; phone: string; address: string; logo: string; accent: string }>) => {
    setCompanies(prev => { const next = prev[key] ? { ...prev, [key]: { ...prev[key], ...patch } } : prev; if (next[key]) (api as any).myCreate('businesses', { id: key, ...next[key] }).catch(() => {}); return next; });
  }, []);
  const removeCompany = useCallback((key: string) => {
    setCompanies(prev => {
      const keys = Object.keys(prev);
      if (keys.length <= 1 || !prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      (api as any).myRemove('businesses', key).catch(() => {});
      setCompany(cur => (cur === key ? Object.keys(next)[0] : cur));
      return next;
    });
  }, []);

  // Tabs
  const [chatTab, setChatTab] = useState<ChatTab>('all');
  const [crmTab, setCrmTab] = useState<CrmTab>('customers');
  const [finTab, setFinTab] = useState<FinTab>('overview');

  // Data — agents persist across reloads so edits/hires stick
  const [agents, setAgents] = useState<Agent[]>(() => {
    try {
      // cachebust: کشِ کهنهٔ دادهٔ کسب‌وکارِ کلاینت (ایجنت‌ها/کیف‌پول/فاکتور/منشی/…) بعد از هر دیپلوی
      // یک‌بار پاک می‌شود تا دیتای فیکِ قدیمیِ ذخیره‌شده در مرورگر باقی نماند؛ همه از سرور دوباره می‌آید.
      if (localStorage.getItem('neura_cache_ver') !== 'nf-clean-2') {
        ['neura_agents', 'neura_invoices', 'neura_wallet_balance', 'neura_wallet_tx', 'neura_wallet_min10m', 'sec-todos', 'sec-report-tab', 'MARKETING_MOCK_SCENARIO'].forEach(function (k) { try { localStorage.removeItem(k); } catch (_e) {} });
        try { localStorage.setItem('neura_cache_ver', 'nf-clean-2'); } catch (_e) {}
      }
      const saved = localStorage.getItem('neura_agents');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length) return parsed;
      }
    } catch (_) {}
    return INITIAL_AGENTS;
  });
  useEffect(() => {
    try { localStorage.setItem('neura_agents', JSON.stringify(agents)); } catch (_) {}
  }, [agents]);
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const upsertCustomer = useCallback(async (c: any) => {
    const withCo = { ...c, company };
    setCustomers((prev: any) => { const i = prev.findIndex((x: any) => x.id === c.id); if (i >= 0) { const n = [...prev]; n[i] = withCo; return n; } return [...prev, withCo]; });
    try { await (api as any).create('customers', withCo); } catch (_) {}
  }, [company]);
  const dropCustomer = useCallback(async (id: any) => {
    setCustomers((prev: any) => prev.filter((x: any) => x.id !== id));
    try { await (api as any).remove('customers', id); } catch (_) {}
  }, []);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [financeData, setFinanceData] = useState<{ income: FinanceItem[]; expense: FinanceItem[] }>({ income: [], expense: [] });
  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    try { const s = localStorage.getItem('neura_invoices'); if (s) return JSON.parse(s); } catch (e) {}
    return INVOICES_DATA;
  });
  const addInvoice = useCallback((inv: Invoice) => {
    setInvoices(prev => {
      const next = [inv, ...prev];
      try { localStorage.setItem('neura_invoices', JSON.stringify(next)); } catch (e) {}
      return next;
    });
  }, []);
  const [orders, setOrders] = useState<Order[]>([]);
  // Unified EU shopping cart (market + dine) + placed orders
  const [euCart, setEuCart] = useState<any[]>([]);
  const [euPlacedOrders, setEuPlacedOrders] = useState<any[]>([]);
  const cartAdd = useCallback((line: any) => {
    setEuCart(prev => {
      const e = prev.find(x => x.key === line.key);
      return e ? prev.map(x => x.key === line.key ? { ...x, qty: x.qty + 1 } : x) : [...prev, { ...line, qty: 1 }];
    });
  }, []);
  const cartDec = useCallback((key: string) => {
    setEuCart(prev => prev.flatMap(x => x.key === key ? (x.qty > 1 ? [{ ...x, qty: x.qty - 1 }] : []) : [x]));
  }, []);
  const cartRemove = useCallback((key: string) => setEuCart(prev => prev.filter(x => x.key !== key)), []);
  const cartClear = useCallback(() => setEuCart([]), []);
  const cartQty = useCallback((key: string) => euCart.find(x => x.key === key)?.qty || 0, [euCart]);
  const cartCount = euCart.reduce((s, c) => s + c.qty, 0);
  // Place all cart items as orders, split by source
  const checkoutCart = useCallback(() => {
    setEuCart(prev => {
      const now = new Date();
      const fa = (n: number) => String(n).replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'[+d]);
      const bySource: Record<string, any[]> = {};
      prev.forEach(l => { (bySource[l.source] = bySource[l.source] || []).push(l); });
      const newOrders = Object.entries(bySource).map(([source, lines]) => {
        const total = lines.reduce((s, l) => s + l.priceNum * l.qty, 0);
        const itemsText = lines.map(l => `${l.name} × ${fa(l.qty)}`).join('، ');
        // شمارهٔ سفارشِ واقعی از مهرِ زمانیِ همین سفارش (نه Math.random فیک) — پایدار و یکسان با سمتِ سرور
        const _num = fa(String(Date.now()).slice(-6));
        const _vendor = lines[0].shop || lines[0].restaurant || (source === 'dine' ? 'رستوران' : 'فروشگاه');
        const _eta = source === 'dine' ? '۳۰ دقیقه' : '۲ روز کاری';
        const _nowIso = new Date().toISOString();
        // ثبتِ واقعیِ سفارش روی سرور + کسرِ کیف‌پول (اتمیک). اگر از QRِ میز آمده باشد، اطلاعاتِ میز هم می‌رود.
        const _dt: any = (source === 'dine' && (window as any).__dineTable && lines[0] && String((lines[0] as any).venueId) === String((window as any).__dineTable.venueId)) ? (window as any).__dineTable : null;
        (api as any).placeOrder(source === 'dine' ? 'dine' : 'market', lines, total, { source, num: _num, items: itemsText, lines: lines.map((l: any) => ({ name: l.name, qty: l.qty, priceNum: l.priceNum, productId: l.productId, sellerId: l.sellerId, menuItemId: l.menuItemId, venueId: l.venueId })), vendor: _vendor, eta: _eta, status: 'preparing', date: _nowIso, address: (typeof window !== 'undefined' ? ((window as any).__euOrderAddress || '') : ''), ...(_dt ? { tableId: _dt.tableId, tableLabel: _dt.tableLabel, dineType: 'dinein' } : {}) })
          .then((r: any) => { if (r && typeof r.balance === 'number') setWalletBalance(r.balance); })
          .catch((e: any) => { const m = (e && (e.status === 402 || String(e.message || e).includes('402') || String(e.message || '').includes('insufficient'))) ? 'پرداخت ناموفق: موجودی کیف‌پول کافی نیست' : 'ثبت سفارش ناموفق بود'; try { window.dispatchEvent(new CustomEvent('neura:toast', { detail: m })); } catch (_e) {} })
          .finally(() => { (async () => { try { const _o: any = await (api as any).myOrders(); if (Array.isArray(_o)) setEuPlacedOrders(_o); } catch (_e) {} })(); });
        return {
          id: Date.now() + Math.random(), source,
          num: _num,
          items: itemsText, status: 'preparing',
          vendor: _vendor,
          date: _nowIso, total: fa(total), eta: _eta,
        };
      });
      setEuPlacedOrders(po => [...newOrders, ...po]);
      return [];
    });
  }, []);
  const [userProfile, setUserProfile] = useState<UserProfile>(INITIAL_USER_PROFILE);
  const [euProfile, setEuProfile] = useState<UserProfile>(() => ({ ...INITIAL_EU_PROFILE, verified: __verifiedSeed() }));
  const [tasks, setTasks] = useState<Task[]>([]);

  // Topics & Messages storage
  const [topicsMap, setTopicsMap] = useState<Record<string, Topic[]>>({});
  const [pMsgsMap, setPMsgsMap] = useState<Record<string, Message[]>>({});
  const [euMsgsMap, setEuMsgsMap] = useState<Record<string, Message[]>>({});
  const [custMsgsMap, setCustMsgsMap] = useState<Record<string, Message[]>>({});
  const [groupMsgsMap, setGroupMsgsMap] = useState<Record<string, Message[]>>({});
  const [contactMsgsMap, setContactMsgsMap] = useState<Record<string, Message[]>>({});

  // Typing indicator
  const [isTyping, setIsTyping] = useState(false);

  // Chat
  const [chat, setChatState] = useState<ChatState>({
    open: false, id: null, type: null, topicId: null, topicsOpen: false
  });

  // بستن خودکار چت هنگام تغییر صفحه (تا شیت چت روی صفحهٔ جدید نماند)
  useEffect(() => {
    setChatState(c => c.open ? { open: false, id: null, type: null, topicId: null, topicsOpen: false } : c);
  }, [euScreen, adminScreen]);

  // Modal
  const [modal, setModal] = useState<ModalState>({ open: false, title: '', content: null, onBack: null });

  // Call
  const [call, setCall] = useState<CallState>({
    open: false, name: '', role: '', bg: '', init: '', ext: '', timer: 0
  });

  // Unified Call
  const [unifiedCall, setUnifiedCall] = useState<UnifiedCallState>({ open: false });

  // Toast
  const [toast, setToast] = useState<ToastState>({ show: false, message: '' });

  // Theme
  const [theme, setTheme] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem('aw-theme');
      if (saved === 'light') return 'glass';
      if (saved === 'dark' || saved === 'bw' || saved === 'glass') return saved;
    } catch {}
    return 'glass';
  });
  const setThemeAndPersist = useCallback((t: ThemeMode) => {
    setTheme(t);
    try { localStorage.setItem('aw-theme', t); } catch {}
  }, []);

  // Auto theme — follows the user's local clock (light during day, dark at night)
  const autoThemeFor = (): ThemeMode => {
    const h = new Date().getHours();
    return (h >= 7 && h < 19) ? 'glass' : 'dark';
  };
  const [themeAuto, setThemeAutoRaw] = useState<boolean>(() => {
    try { return localStorage.getItem('aw-theme-auto') === '1'; } catch { return false; }
  });
  const setThemeAuto = useCallback((b: boolean) => {
    setThemeAutoRaw(b);
    try { localStorage.setItem('aw-theme-auto', b ? '1' : '0'); } catch {}
    if (b) setThemeAndPersist(autoThemeFor());
  }, [setThemeAndPersist]);
  useEffect(() => {
    if (!themeAuto) return;
    setThemeAndPersist(autoThemeFor());
    const id = setInterval(() => setThemeAndPersist(autoThemeFor()), 60000);
    return () => clearInterval(id);
  }, [themeAuto, setThemeAndPersist]);

  // Pre-welcome (splash/home/auth) light–dark toggle
  const [preTheme, setPreThemeRaw] = useState<'light' | 'dark'>(() => {
    try { return localStorage.getItem('neura-pre-theme') === 'dark' ? 'dark' : 'light'; } catch { return 'light'; }
  });
  const setPreTheme = useCallback((t: 'light' | 'dark') => {
    setPreThemeRaw(t);
    try { localStorage.setItem('neura-pre-theme', t); } catch {}
  }, []);

  // Agent Team
  const [agentTeam, setAgentTeamRaw] = useState<AgentTeam>(() => {
    try { return (localStorage.getItem('neura-agent-team') as AgentTeam) || 'secretary'; } catch { return 'secretary'; }
  });
  const setAgentTeam = useCallback((t: AgentTeam) => {
    setAgentTeamRaw(t);
    try { if (t) localStorage.setItem('neura-agent-team', t as any); } catch {}
  }, []);
  const [agentAccent, setAgentAccentRaw] = useState<string | null>(() => {
    try { return localStorage.getItem('neura-accent') || null; } catch { return null; }
  });
  const setAgentAccent = useCallback((c: string | null) => {
    setAgentAccentRaw(c);
    try { if (c) localStorage.setItem('neura-accent', c); else localStorage.removeItem('neura-accent'); } catch {}
  }, []);
  const [teamAccent, setTeamAccent] = useState<string | null>(null);

  // Default Agent — persists across reloads so the chosen agent stays default
  const [defaultAgent, setDefaultAgentRaw] = useState<string>(() => {
    try { return localStorage.getItem('neura-default-agent') || ''; } catch { return ''; }
  });
  const setDefaultAgent = useCallback((id: string) => {
    setDefaultAgentRaw(id);
    try { if (id) localStorage.setItem('neura-default-agent', id); else localStorage.removeItem('neura-default-agent'); } catch {}
  }, []);

  // Active personal assistant — which assistant-team agent drives the welcome screen
  // identity/theme AND the assistant screen header. Switchable from the header dropdown.
  const [assistantId, setAssistantIdRaw] = useState<string>(() => {
    try { return localStorage.getItem('neura-assistant-id') || 'assistant'; } catch { return 'assistant'; }
  });
  const setAssistantId = useCallback((id: string) => {
    setAssistantIdRaw(id);
    try { if (id) localStorage.setItem('neura-assistant-id', id); else localStorage.removeItem('neura-assistant-id'); } catch {}
  }, []);

  // Currently displayed agent within the active team (kept in sync by the avatar block;
  // read by AdminPanel so the demo/grayscale lock matches the agent actually shown).
  const [teamAgentId, setTeamAgentId] = useState<string | null>(null);

  // Owned agents — until an agent is purchased it stays in DEMO mode (grayscale,
  // chat & features disabled). The personal assistant is always owned.
  // Ownership is scoped PER COMPANY: keys are stored as `${companyKey}::${agentId}`.
  // A newly-created company therefore starts with every agent locked (demo) except
  // the personal assistant, which is always owned everywhere.
  const [ownedAgents, setOwnedAgents] = useState<string[]>(() => {
    try {
      const s = localStorage.getItem('neura_owned_agents');
      let arr: string[] = s ? JSON.parse(s) : ['assistant'];
      // Migrate legacy flat ids → scope them to the default company ('alpha').
      let changed = false;
      arr = arr.map(x => {
        if (x === 'assistant') return x;
        if (typeof x === 'string' && !x.includes('::')) { changed = true; return 'alpha::' + x; }
        return x;
      });
      if (changed) { try { localStorage.setItem('neura_owned_agents', JSON.stringify(arr)); } catch {} }
      return arr;
    } catch { return ['assistant']; }
  });
  const isAgentOwned = useCallback((id?: string | null) => {
    if (!id) return true;
    if (id === 'assistant') return true;
    return ownedAgents.includes(company + '::' + id);
  }, [ownedAgents, company]);
  const purchaseAgent = useCallback((id: string, meta?: { name?: string; price?: number }) => {
    const key = id === 'assistant' ? id : company + '::' + id;
    const _price = (meta && meta.price) || 0;
    const _title = 'خرید عامل: ' + ((meta && meta.name) || id);
    setOwnedAgents(prev => prev.includes(key) ? prev : [...prev, key]); // خوش‌بینانه
    (async () => {
      try { const w: any = await (api as any).walletPurchase('agent', key, _price, _title); if (w) { if (typeof w.balance === 'number') setWalletBalance(w.balance); if (Array.isArray(w.tx)) setWalletTx(w.tx); if (Array.isArray(w.ownedAgents)) setOwnedAgents(w.ownedAgents); if (Array.isArray(w.ownedAvatars)) setOwnedAvatars(w.ownedAvatars); if (Array.isArray(w.ownedThemes)) setOwnedThemes(w.ownedThemes); } try { const ag: any = await api.agents(); if (Array.isArray(ag)) setAgents(ag as any); } catch (_) {} }
      catch (e: any) { if (e && e.status === 402) showToast('موجودی کیف پول کافی نیست'); }
    })();
  }, [company]);

  // ── Wallet ──
  const [walletBalance, setWalletBalance] = useState<number>(() => {
    try {
      const s = localStorage.getItem('neura_wallet_balance');
      // یک‌بار موجودی را به حداقل ۱۰ میلیون تومان برسان تا خرید تم/آواتار ممکن باشد
      return s ? JSON.parse(s) : 0;
    } catch { return 0; }
  });
  const [walletTx, setWalletTx] = useState<WalletTx[]>(() => {
    try { const s = localStorage.getItem('neura_wallet_tx'); return s ? JSON.parse(s) : INITIAL_WALLET_TX; } catch { return INITIAL_WALLET_TX; }
  });
  // واریز/برداشت: toastِ موفقیت/خطا «فقط بعد از تأییدِ سرور» و «یک‌جا» (R8/R10/R12) — دیگر هیچ callerای
  // نباید toastِ موفقیتِ زودهنگام بزند. برمی‌گرداند {ok} تا در صورتِ نیاز caller هم بداند.
  const walletDeposit = useCallback(async (amount: number) => {
    if (!amount || amount <= 0) { showToastFn('مبلغ معتبر وارد کنید'); return { ok: false }; }
    try { const w: any = await (api as any).walletDeposit(amount); if (w) { if (typeof w.balance === 'number') setWalletBalance(w.balance); if (Array.isArray(w.tx)) setWalletTx(w.tx); } showToastFn('واریز انجام شد ✅'); return { ok: true }; }
    catch (e: any) { showToastFn('خطا در واریز'); return { ok: false, status: e && e.status }; }
  }, []);
  const walletWithdraw = useCallback(async (amount: number) => {
    if (!amount || amount <= 0) { showToastFn('مبلغ معتبر وارد کنید'); return { ok: false }; }
    try { const w: any = await (api as any).walletWithdraw(amount); if (w) { if (typeof w.balance === 'number') setWalletBalance(w.balance); if (Array.isArray(w.tx)) setWalletTx(w.tx); } showToastFn('برداشت انجام شد ✅'); return { ok: true }; }
    catch (e: any) { showToastFn(e && e.status === 402 ? 'موجودی کیف پول کافی نیست' : 'خطا در برداشت'); return { ok: false, status: e && e.status }; }
  }, []);

  // ── Avatar & Theme ownership (first 3 of each are free; rest must be bought individually) ──
  const [ownedAvatars, setOwnedAvatars] = useState<string[]>(() => {
    try { const s = localStorage.getItem('neura_owned_avatars'); return s ? JSON.parse(s) : []; } catch { return []; }
  });
  const [ownedThemes, setOwnedThemes] = useState<string[]>(() => {
    try { const s = localStorage.getItem('neura_owned_themes'); return s ? JSON.parse(s) : []; } catch { return []; }
  });
  // Market promotion subscriptions — keys like 'shop:دیجی‌تک' or 'prod:107'
  const [promotedMarket, setPromotedMarket] = useState<string[]>(() => {
    try { const s = localStorage.getItem('neura_promoted_market'); return s ? JSON.parse(s) : ['shop:مد اسپورت', 'prod:103']; } catch { return []; }
  });
  useEffect(() => { try { localStorage.setItem('neura_promoted_market', JSON.stringify(promotedMarket)); } catch {} }, [promotedMarket]);

  // ── Text-to-speech (read a message aloud + drive the spectrum) ──
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const speakingMsgIdRef = useRef<string | null>(null);
  const speakMessage = useCallback((id: string, text: string) => {
    try {
      const cur = speakingMsgIdRef.current;
      // توقفِ هر پخشِ قبلی (چه صوتِ بک‌اند چه صدای مرورگر)
      try { const A: any = (window as any).__neuraAudio; if (A) A.pause(); } catch {}
      try { window.speechSynthesis && window.speechSynthesis.cancel(); } catch {}
      if (cur === id) { speakingMsgIdRef.current = null; setSpeakingMsgId(null); return; }  // همان پیام → خاموش
      speakingMsgIdRef.current = id; setSpeakingMsgId(id);
      const done = () => { if (speakingMsgIdRef.current === id) { speakingMsgIdRef.current = null; setSpeakingMsgId(null); } };
      // پاک‌سازیِ متن + خواندنِ شماره‌های بلند به فارسیِ دانه‌دانه
      const W = ['صفر', 'یک', 'دو', 'سه', 'چهار', 'پنج', 'شش', 'هفت', 'هشت', 'نه'];
      const clean = String(text || '')
        .replace(/[*_#`~>|]/g, '')
        .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}\u{1F1E6}-\u{1F1FF}]/gu, '')
        .replace(/[۰-۹]/g, (d: string) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
        .replace(/\d{5,}/g, (m: string) => m.split('').map((x: string) => W[+x]).join('، '))
        .replace(/\s+/g, ' ').trim();
      if (!clean) { done(); return; }
      (api as any).tts('assistant', clean).then((r: any) => {
        if (speakingMsgIdRef.current !== id) return;  // در این فاصله عوض/خاموش شده
        if (r && r.audioBase64) {
          let A: any = (window as any).__neuraAudio; if (!A) { A = (window as any).__neuraAudio = new Audio(); }
          try { A.pause(); } catch {}
          A.src = 'data:' + (r.mime || 'audio/wav') + ';base64,' + r.audioBase64;
          A.onended = done; A.onerror = done;
          A.play().catch(done);
        } else {
          // اگر بک‌اند صدا نداد، دستِ‌کم با صدای مرورگر بخوان
          try { const u = new SpeechSynthesisUtterance(clean); u.lang = 'fa-IR'; u.onend = done; u.onerror = done; window.speechSynthesis.speak(u); } catch { done(); }
        }
      }).catch(done);
    } catch { speakingMsgIdRef.current = null; setSpeakingMsgId(null); }
  }, []);
  useEffect(() => () => { try { window.speechSynthesis && window.speechSynthesis.cancel(); } catch {} }, []);

  const buyAvatar = useCallback((src: string, price: number) => {
    setOwnedAvatars(prev => prev.includes(src) ? prev : [...prev, src]);
    (async () => { try { const w: any = await (api as any).walletPurchase('avatar', src, price || 0, 'خرید آواتار'); if (w) { if (typeof w.balance === 'number') setWalletBalance(w.balance); if (Array.isArray(w.tx)) setWalletTx(w.tx); if (Array.isArray(w.ownedAgents)) setOwnedAgents(w.ownedAgents); if (Array.isArray(w.ownedAvatars)) setOwnedAvatars(w.ownedAvatars); if (Array.isArray(w.ownedThemes)) setOwnedThemes(w.ownedThemes); } } catch (e: any) { if (e && e.status === 402) showToast('موجودی کیف پول کافی نیست'); } })();
  }, []);
  const buyTheme = useCallback((hex: string, price: number) => {
    setOwnedThemes(prev => prev.includes(hex) ? prev : [...prev, hex]);
    (async () => { try { const w: any = await (api as any).walletPurchase('theme', hex, price || 0, 'خرید تم رنگی'); if (w) { if (typeof w.balance === 'number') setWalletBalance(w.balance); if (Array.isArray(w.tx)) setWalletTx(w.tx); if (Array.isArray(w.ownedAgents)) setOwnedAgents(w.ownedAgents); if (Array.isArray(w.ownedAvatars)) setOwnedAvatars(w.ownedAvatars); if (Array.isArray(w.ownedThemes)) setOwnedThemes(w.ownedThemes); } } catch (e: any) { if (e && e.status === 402) showToast('موجودی کیف پول کافی نیست'); } })();
  }, []);

  // Chat Groups
  const [chatGroups, setChatGroups] = useState<ChatGroup[]>([]);
  const addChatGroupFn = useCallback((group: ChatGroup) => {
    setChatGroups(prev => [...prev, group]);
  }, []);
  const updateChatGroupFn = useCallback((id: string, patch: Partial<ChatGroup>) => {
    setChatGroups(prev => prev.map(g => g.id === id ? { ...g, ...patch } : g));
  }, []);
  const [groupChats, setGroupChats] = useState<GroupChat[]>([]);
  const __gcLoaded = useRef(false);
  useEffect(() => { (async () => { try { const v: any = await (api as any).myList('group_chats'); if (Array.isArray(v)) setGroupChats(v as any); } catch (_) {} __gcLoaded.current = true; })(); }, []);
  useEffect(() => { if (!__gcLoaded.current) return; const h = setTimeout(() => { (api as any).myBulkSave('group_chats', groupChats).catch(() => {}); }, 700); return () => clearTimeout(h); }, [groupChats]);
  useEffect(() => { (async () => { try { const v: any = await (api as any).myList('user_profile'); const p0 = Array.isArray(v) ? v[0] : null; if (p0 && p0.username) { setUserProfile((p: any) => ({ ...p, username: p0.username })); setEuProfile((p: any) => ({ ...p, username: p0.username })); } } catch (_) {} })(); }, []);
  const addGroupChatFn = useCallback((gc: GroupChat) => setGroupChats(prev => [...prev, gc]), []);
  const removeGroupChatFn = useCallback((id: string) => setGroupChats(prev => prev.filter(g => g.id !== id)), []);
  const updateGroupChatFn = useCallback((id: string, patch: Partial<GroupChat>) => {
    setGroupChats(prev => prev.map(g => g.id === id ? { ...g, ...patch } : g));
  }, []);
  const removeChatGroupFn = useCallback((id: string) => {
    setChatGroups(prev => prev.filter(g => g.id !== id));
  }, []);

  // Briefing
  const [briefingSeen, setBriefingSeen] = useState<boolean>(() => {
    try { return !!getToken(); } catch (_) { return false; }
  });

  // ===== App entry flow =====
  const readLS = (k: string) => { try { return localStorage.getItem(k); } catch (_) { return null; } };
  const [hasAccount, setHasAccount] = useState<boolean>(() => readLS('neura_account') === '1');
  const [appStage, setAppStage] = useState<'splash' | 'home' | 'auth' | 'app'>(() => {
    try { return getToken() ? 'app' : 'splash'; } catch (_) { return 'splash'; }
  });
  const [authMode, setAuthMode] = useState<'login' | 'register'>(() => (readLS('neura_account') === '1' ? 'login' : 'register'));

  // Welcome (home) screen — enable/disable + editable copy (persisted)
  const WELCOME_DEFAULTS = { title: 'Neura', subtitle: 'دستیار هوشمند کسب‌وکار شما', cta: 'ورود به پنل', sectionTitle: 'عامل‌های هوشمند نـورا' };
  const [welcomeEnabled, setWelcomeEnabledRaw] = useState<boolean>(() => readLS('neura_welcome_enabled') !== '0');
  const setWelcomeEnabled = useCallback((b: boolean) => {
    setWelcomeEnabledRaw(b);
    try { localStorage.setItem('neura_welcome_enabled', b ? '1' : '0'); } catch (_) {}
  }, []);
  const [welcomeConfig, setWelcomeConfigRaw] = useState<typeof WELCOME_DEFAULTS>(() => {
    try { const s = readLS('neura_welcome_cfg'); return s ? { ...WELCOME_DEFAULTS, ...JSON.parse(s) } : WELCOME_DEFAULTS; } catch (_) { return WELCOME_DEFAULTS; }
  });
  const setWelcomeConfig = useCallback((c: Partial<typeof WELCOME_DEFAULTS>) => {
    setWelcomeConfigRaw(prev => { const next = { ...prev, ...c }; try { localStorage.setItem('neura_welcome_cfg', JSON.stringify(next)); } catch (_) {} return next; });
  }, []);

  // After the splash logo (2s), branch on whether the user is logged in / has an account
  useEffect(() => {
    if (appStage !== 'splash') return;
    const t = setTimeout(() => {
      const loggedIn = readLS('neura_loggedin') === '1';
      const account = readLS('neura_account') === '1';
      if (account) setAuthMode('login');
      // Everyone lands on the welcome page first (when enabled) — even logged-in users.
      // The landing CTA then routes logged-in users straight into the app.
      if (readLS('neura_welcome_enabled') !== '0') setAppStage('home');
      else if (loggedIn) { setBriefingSeen(__briefSeenToday()); setAppStage('app'); }
      else setAppStage('auth');
    }, 3000);
    return () => clearTimeout(t);
  }, [appStage]);

  // نشست را بین رفرش‌ها حفظ کن: اگر توکن هست، در پس‌زمینه اعتبارسنجی و نقش را بازیابی کن.
  useEffect(() => {
    if (!getToken()) return;
    let alive = true;
    (async () => {
      try {
        const r: any = await (api as any).me();
        if (alive && r && r.user) {
          const u = r.user; const _pp: any = {};
          if (u.name) _pp.name = u.name; if (u.email) _pp.email = u.email;
          if (u.phone || u.username) _pp.phone = u.phone || u.username;
          if (u.username) _pp.username = u.username; if (u.address) _pp.address = u.address;
          if (typeof u.identityVerified !== 'undefined') { _pp.verified = !!u.identityVerified; try { localStorage.setItem('aw-verified:' + __neuraUid(), u.identityVerified ? '1' : '0'); } catch (_) {} }
          setEuProfile((p: any) => ({ ...p, ..._pp })); setUserProfile((p: any) => ({ ...p, ..._pp }));
          setRole(u.role === 'admin' || u.role === 'superadmin' ? u.role : 'user');
        }
      } catch (e: any) {
        if (alive && e && e.status === 401) {
          setToken(null);
          try { localStorage.setItem('neura_loggedin', '0'); } catch (_) {}
          setAppStage('auth');
        }
      }
    })();
    return () => { alive = false; };
  }, [appStage]);

  // بارگذاریِ داده‌های تجاریِ شرکت (فقط برای admin) از دیتابیس + همگام‌سازیِ خودکار
  const _dataSync = useRef<any>({});
  useEffect(() => {
    if (!getToken() || appStage !== 'app' || role === 'user') return;
    (async () => {
      try { const v: any = await (api as any).list('customers', company); if (Array.isArray(v)) { setCustomers(v); } } catch (_) {}
      try { const v: any = await (api as any).list('tasks', company); if (Array.isArray(v)) { setTasks(v); _dataSync.current.tasks = true; } } catch (_) {}
      try { const v: any = await (api as any).list('personnel', company); if (Array.isArray(v)) { setPersonnel(v); _dataSync.current.personnel = true; } } catch (_) {}
      try { const v: any = await (api as any).list('deals', company); if (Array.isArray(v)) { setDeals(v); _dataSync.current.deals = true; } } catch (_) {}
      try { const v: any = await (api as any).list('orders', company); if (Array.isArray(v)) { setOrders(v); _dataSync.current.orders = true; } } catch (_) {}
      try { const v: any = await (api as any).list('invoices', company); if (Array.isArray(v)) { setInvoices(v); _dataSync.current.invoices = true; } } catch (_) {}
      try { const fi: any = await (api as any).list('finance', company); if (Array.isArray(fi)) setFinanceData({ income: fi.filter((x: any) => x.type === 'income'), expense: fi.filter((x: any) => x.type === 'expense') }); } catch (_) {}
    })();
  }, [company, appStage, role]);
  useEffect(() => { if (!_dataSync.current.tasks || !getToken() || role === 'user') return; const _h = setTimeout(() => { (api as any).bulkSave('tasks', tasks, company).catch(() => {}); }, 700); return () => clearTimeout(_h); }, [tasks]);
  useEffect(() => { if (!_dataSync.current.personnel || !getToken() || role === 'user') return; const _h = setTimeout(() => { (api as any).bulkSave('personnel', personnel, company).catch(() => {}); }, 700); return () => clearTimeout(_h); }, [personnel]);
  useEffect(() => { if (!_dataSync.current.deals || !getToken() || role === 'user') return; const _h = setTimeout(() => { (api as any).bulkSave('deals', deals, company).catch(() => {}); }, 700); return () => clearTimeout(_h); }, [deals]);
  useEffect(() => { if (!_dataSync.current.orders || !getToken() || role === 'user') return; const _h = setTimeout(() => { (api as any).bulkSave('orders', orders, company).catch(() => {}); }, 700); return () => clearTimeout(_h); }, [orders]);
  useEffect(() => { if (!_dataSync.current.invoices || !getToken() || role === 'user') return; const _h = setTimeout(() => { (api as any).bulkSave('invoices', invoices, company).catch(() => {}); }, 700); return () => clearTimeout(_h); }, [invoices]);

  useEffect(() => {
    if (!getToken() || appStage !== 'app') return;
    (async () => { try { const w: any = await (api as any).getWallet(); if (w) { if (typeof w.balance === 'number') setWalletBalance(w.balance); if (Array.isArray(w.tx)) setWalletTx(w.tx); if (Array.isArray(w.ownedAgents)) setOwnedAgents(w.ownedAgents); if (Array.isArray(w.ownedAvatars)) setOwnedAvatars(w.ownedAvatars); if (Array.isArray(w.ownedThemes)) setOwnedThemes(w.ownedThemes); } } catch (_) {} })();
  }, [appStage]);

  // Web Push: بعد از ورود، نوتیفیکیشن را فعال کن تا حتی وقتی اپ بسته است پیام/تماس اطلاع داده شود.
  useEffect(() => {
    if (!getToken() || appStage !== 'app') return;
    import('../services/push').then((m) => m.initPush()).catch(() => {});
  }, [appStage]);

  // euchatpersist: گفتگوی کاربر با ایجنت‌ها (رستوران/مارکت/پشتیبانی/دستیار) per-user ذخیره/بازیابی می‌شود
  // تا با بستن/بازکردنِ اپ یا دستگاهِ دیگر نپرد (قبلاً فقط در حافظه بود و «ذخیره نمی‌شد»).
  const _euChatsLoaded = useRef(false);
  useEffect(() => {
    if (!getToken() || appStage !== 'app' || role !== 'user') return;
    (async () => {
      try {
        const v: any = await (api as any).myList('eu_chats');
        if (Array.isArray(v) && v.length) {
          const m: Record<string, Message[]> = {};
          for (const d of v) if (d && d.id != null && Array.isArray(d.messages)) m[String(d.id)] = d.messages;
          setEuMsgsMap(prev => ({ ...prev, ...m }));
        }
      } catch (_) {}
      _euChatsLoaded.current = true;
    })();
  }, [appStage, role]);
  useEffect(() => {
    if (!_euChatsLoaded.current || !getToken() || role !== 'user') return;
    const _h = setTimeout(() => {
      const docs = Object.entries(euMsgsMap).map(([id, messages]) => ({ id, messages: (messages || []).slice(-200) }));
      (api as any).myBulkSave('eu_chats', docs).catch(() => {});
    }, 800);
    return () => clearTimeout(_h);
  }, [euMsgsMap]);

  useEffect(() => {
    if (!getToken() || appStage !== 'app') return;
    (async () => { try { const _l: any = await (api as any).myList('businesses'); if (Array.isArray(_l) && _l.length) { const _rec: any = {}; for (const _b of _l) if (_b && _b.id) _rec[_b.id] = _b; setCompanies((prev: any) => ({ ...prev, ..._rec })); } } catch (_) {} })();
  }, [appStage]);

  useEffect(() => {
    if (!getToken() || appStage !== 'app') return;
    (async () => { try { const _o: any = await (api as any).myOrders(); if (Array.isArray(_o)) setEuPlacedOrders(_o); } catch (_) {} })();
  }, [appStage]);

  // QRِ روی میزِ رستوران: ?dine=<token> → رمزگشایی به رستوران+میز، پرشِ خودکار به «سفارش غذا».
  useEffect(() => {
    if (appStage !== 'app') return;
    let tok = '';
    try { tok = new URLSearchParams(window.location.search).get('dine') || ''; } catch (_) { tok = ''; }
    if (!tok || (window as any).__dineTableDone === tok) return;
    (window as any).__dineTableDone = tok;
    (async () => {
      try {
        const r: any = await (api as any).dineTable(tok);
        if (r && r.venueId) {
          (window as any).__dineTable = { venueId: String(r.venueId), tableId: r.tableId, tableLabel: r.tableLabel, venueName: r.venueName };
          try { window.dispatchEvent(new Event('dine-table')); } catch (_) {}
          setEuScreen('euDineScreen');
        }
      } catch (_) {}
    })();
  }, [appStage]);

  const completeAuth = useCallback(() => {
    try { localStorage.setItem('neura_account', '1'); localStorage.setItem('neura_loggedin', '1'); } catch (_) {}
    // Carry the chosen login theme into the panels: dark → dark, light → glass
    try {
      const pre = localStorage.getItem('neura-pre-theme') === 'dark' ? 'dark' : 'light';
      setThemeAndPersist(pre === 'dark' ? 'dark' : 'glass');
    } catch (_) {}
    setHasAccount(true);
    setBriefingSeen(__briefSeenToday()); // registered users see the greeting first
    setAppStage('app');
  }, [setThemeAndPersist]);

  const logout = useCallback(() => {
    setToken(null);
    try { localStorage.removeItem('neura-agent-team'); } catch {}
    try { localStorage.setItem('neura_loggedin', '0'); } catch (_) {}
    setAuthMode('login');
    setRole('user');
    setAppStage('auth');
  }, []);

  // Get topics for an agent (creates if not exist)
  const getTopicsForAgent = useCallback((id: string): Topic[] => {
    const key = company + '_' + id;
    if (topicsMap[key]) return topicsMap[key];
    const a = agents.find(x => x.id === id);
    const defaultTopics: Topic[] = [{
      id: ++topicIdRef.current,
      title: 'گفتگوی اولیه' + (a ? ' با ' + a.name : ''),
      date: 'امروز',
      messages: a ? [{ id: ++msgIdRef.current, text: ((a as any).welcomeMsg || ('سلام! من ' + a.name + ' هستم، ' + a.role + '. چطور کمکتان کنم؟')), sent: false, time: nowTime() }] : []
    }];
    setTopicsMap(prev => ({ ...prev, [key]: defaultTopics }));
    return defaultTopics;
  }, [company, agents, topicsMap]);

  const getPMsgs = useCallback((id: string): Message[] => {
    if (pMsgsMap[id]) return pMsgsMap[id];
    const p = personnel.find(x => x.id === id);
    const msgs: Message[] = p ? [{ id: ++msgIdRef.current, text: 'سلام، ' + p.name + ' هستم. در خدمتم.', sent: false, time: nowTime() }] : [];
    setPMsgsMap(prev => ({ ...prev, [id]: msgs }));
    return msgs;
  }, [personnel, pMsgsMap]);

  const getEuMsgs = useCallback((type: string): Message[] => {
    if (euMsgsMap[type]) return euMsgsMap[type];
    const a = agents.find(x => x.id === type);
    const greetings: Record<string, string> = {
      restaurant: 'سلام! منوی امروز آماده است. چه غذایی میل دارید؟',
      assistant: 'سلام! دستیار شخصی شما هستم. چطور کمکتان کنم؟',
      support: 'سلام! به پشتیبانی خوش آمدید. مشکلتان را بفرمایید.',
      market: 'سلام! به بازاریابی خوش آمدید. چطور می‌توانم کمکتان کنم؟'
    };

    // Pre-built conversations for assistant-conducted chats
    const assistantConversations: Record<string, Message[]> = {};

    // Pre-built conversations for user-to-user / group chats
    const userConversations: Record<string, Message[]> = {};

    if (userConversations[type]) {
      const msgs = userConversations[type];
      setEuMsgsMap(prev => ({ ...prev, [type]: msgs }));
      return msgs;
    }

    if (assistantConversations[type]) {
      const msgs = assistantConversations[type];
      setEuMsgsMap(prev => ({ ...prev, [type]: msgs }));
      return msgs;
    }

    const msgs: Message[] = [{ id: ++msgIdRef.current, text: (a && (a as any).welcomeMsg) || greetings[type] || (a ? 'سلام! من ' + a.name + ' هستم. چطور می‌توانم کمکتان کنم؟' : 'سلام!'), sent: false, time: nowTime() }];
    setEuMsgsMap(prev => ({ ...prev, [type]: msgs }));
    return msgs;
  }, [agents, euMsgsMap]);

  const getCustMsgs = useCallback((id: string): Message[] => {
    if (custMsgsMap[id]) return custMsgsMap[id];
    const c = customers.find(x => x.id === id);
    const msgs: Message[] = c ? [{ id: ++msgIdRef.current, text: 'سلام، ' + c.name + ' هستم. در خدمتم.', sent: false, time: nowTime() }] : [];
    setCustMsgsMap(prev => ({ ...prev, [id]: msgs }));
    return msgs;
  }, [customers, custMsgsMap]);

  // Open chat
  const openChat = useCallback((id: string, type: 'agent' | 'personnel' | 'eu' | 'customer' | 'group' | 'contact', meta?: { name: string; init: string; bg: string; sub: string }, initialMessages?: Message[]) => {
    let topicId: number | null = null;

    if (type === 'agent') {
      const topics = getTopicsForAgent(id);
      topicId = topics[0]?.id ?? null;
      setAgents(prev => prev.map(a => a.id === id ? { ...a, unread: 0 } : a));
    } else if (type === 'personnel') {
      getPMsgs(id);
      setPersonnel(prev => prev.map(p => p.id === id ? { ...p, unread: 0 } : p));
    } else if (type === 'eu') {
      if (initialMessages && initialMessages.length) setEuMsgsMap(prev => ({ ...prev, [id]: [...(prev[id] || []), ...initialMessages] }));
      else getEuMsgs(id);
    } else if (type === 'customer') {
      getCustMsgs(id);
    } else if (type === 'contact') {
      // peerchat: گفتگوی واقعیِ کاربر-به-کاربرِ نورا — تاریخچه را از سرور بگیر (id = 'peer_<sub>')
      if (String(id).startsWith('pgroup_')) {
        // گروهِ چند نفره (id = 'pgroup_<gid>')
        const gid = String(id).slice('pgroup_'.length);
        (api as any).groupWith(gid).then((r: any) => {
          const msgs = (r?.messages || []).map((m: any) => ({ id: ++msgIdRef.current, text: m.text, sent: !!m.mine, time: '', senderName: m.mine ? '' : (m.fromName || '') }));
          setContactMsgsMap(prev => ({ ...prev, [id]: msgs }));
        }).catch(() => { setContactMsgsMap(prev => (prev[id] ? prev : { ...prev, [id]: [] })); });
      } else if (String(id).startsWith('peer_')) {
        const other = String(id).slice(5);
        (api as any).peerWith(other).then((r: any) => {
          const msgs = (r?.messages || []).map((m: any) => ({ id: ++msgIdRef.current, text: m.text, sent: !!m.mine, time: '' }));
          setContactMsgsMap(prev => ({ ...prev, [id]: msgs }));
        }).catch(() => { setContactMsgsMap(prev => (prev[id] ? prev : { ...prev, [id]: [] })); });
      } else {
        setContactMsgsMap(prev => {
          if (prev[id]) return prev;
          return { ...prev, [id]: initialMessages || [] };
        });
      }
    }

    setChatState({ open: true, id, type, topicId, topicsOpen: false, contactMeta: meta });
    setIsTyping(false);
  }, [getTopicsForAgent, getPMsgs, getEuMsgs, getCustMsgs]);

  const closeChat = useCallback(() => {
    setChatState({ open: false, id: null, type: null, topicId: null, topicsOpen: false });
    setIsTyping(false);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
  }, []);

  const toggleTopics = useCallback(() => {
    setChatState(prev => ({ ...prev, topicsOpen: !prev.topicsOpen }));
  }, []);

  const switchTopic = useCallback((tid: number) => {
    setChatState(prev => ({ ...prev, topicId: tid, topicsOpen: false }));
  }, []);

  const createNewTopic = useCallback(() => {
    if (chat.type !== 'agent' || !chat.id) return;
    const key = company + '_' + chat.id;
    const a = agents.find(x => x.id === chat.id);
    const newId = ++topicIdRef.current;
    const newTopic: Topic = {
      id: newId,
      title: 'پرونده جدید #' + toFa(newId),
      date: 'الان',
      messages: a ? [{ id: ++msgIdRef.current, text: 'پرونده جدید ایجاد شد. چطور می‌توانم کمک کنم؟', sent: false, time: nowTime() }] : []
    };
    setTopicsMap(prev => ({ ...prev, [key]: [...(prev[key] || []), newTopic] }));
    setChatState(prev => ({ ...prev, topicId: newId, topicsOpen: false }));
  }, [chat.type, chat.id, company, agents]);

  const renameTopic = useCallback((agentId: string, topicId: number, title: string) => {
    const key = company + '_' + agentId;
    setTopicsMap(prev => {
      const list = (prev[key] || []).map(t => t.id === topicId ? { ...t, title } : t);
      return { ...prev, [key]: list };
    });
  }, [company]);

  const removeTopic = useCallback((agentId: string, topicId: number) => {
    const key = company + '_' + agentId;
    setTopicsMap(prev => {
      const list = (prev[key] || []).filter(t => t.id !== topicId);
      return { ...prev, [key]: list };
    });
    setChatState(prev => prev.topicId === topicId ? { ...prev, topicId: null } : prev);
  }, [company]);

  // Get current messages
  const getMessages = useCallback((): Message[] => {
    if (chat.type === 'agent' && chat.id && chat.topicId) {
      const key = company + '_' + chat.id;
      const topics = topicsMap[key] || [];
      const topic = topics.find(t => t.id === chat.topicId);
      return topic?.messages || [];
    }
    if (chat.type === 'personnel' && chat.id) {
      return pMsgsMap[chat.id] || [];
    }
    if (chat.type === 'eu' && chat.id) {
      return euMsgsMap[chat.id] || [];
    }
    if (chat.type === 'customer' && chat.id) {
      return custMsgsMap[chat.id] || [];
    }
    if (chat.type === 'group' && chat.id) {
      return groupMsgsMap[chat.id] || [];
    }
    if (chat.type === 'contact' && chat.id) {
      return contactMsgsMap[chat.id] || [];
    }
    return [];
  }, [chat, company, topicsMap, pMsgsMap, euMsgsMap, custMsgsMap, groupMsgsMap, contactMsgsMap]);

  const getTopics = useCallback((id: string): Topic[] => {
    const key = company + '_' + id;
    return topicsMap[key] || [];
  }, [company, topicsMap]);

  // Send message
  const sendMessage = useCallback((text: string) => {
    if (!text.trim()) return;
    // DEMO gate: block chatting with an agent that hasn't been purchased yet.
    if (chat.type === 'agent' && chat.id && !isAgentOwned(chat.id)) {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      setToast({ show: true, message: 'برای گفتگو ابتدا ایجنت را استخدام کنید' });
      toastTimerRef.current = setTimeout(() => setToast({ show: false, message: '' }), 2500);
      return;
    }
    const msg: Message = { id: ++msgIdRef.current, text, sent: true, time: nowTime() };

    if (chat.type === 'agent' && chat.id && chat.topicId) {
      const key = company + '_' + chat.id;
      setTopicsMap(prev => {
        const topics = [...(prev[key] || [])];
        const idx = topics.findIndex(t => t.id === chat.topicId);
        if (idx >= 0) {
          topics[idx] = { ...topics[idx], messages: [...topics[idx].messages, msg] };
        }
        return { ...prev, [key]: topics };
      });
      setAgents(prev => prev.map(a => a.id === chat.id ? { ...a, lastMsg: text, lastTime: nowTime() } : a));

      // AI reply with typing indicator
      const agent = agents.find(x => x.id === chat.id);
      const currentTopicId = chat.topicId;
      const currentId = chat.id;
      setIsTyping(true);
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(async () => {
        let __t = '';
        try { const r: any = await (api as any).chat(currentId, [{ role: 'user', content: text }]); __t = (r && r.ok && r.text) ? String(r.text) : generateReply(text, agent); } catch { __t = generateReply(text, agent); }
        const reply: Message = { id: ++msgIdRef.current, text: __t, sent: false, time: nowTime() };
        setTopicsMap(prev => {
          const topics = [...(prev[key] || [])];
          const idx = topics.findIndex(t => t.id === currentTopicId);
          if (idx >= 0) {
            topics[idx] = { ...topics[idx], messages: [...topics[idx].messages, reply] };
          }
          return { ...prev, [key]: topics };
        });
        setAgents(prev => prev.map(a => a.id === currentId ? { ...a, lastMsg: reply.text, lastTime: nowTime() } : a));
        setIsTyping(false);
      }, 400);
    } else if (chat.type === 'personnel' && chat.id) {
      setPMsgsMap(prev => ({ ...prev, [chat.id!]: [...(prev[chat.id!] || []), msg] }));
      setPersonnel(prev => prev.map(p => p.id === chat.id ? { ...p, lastMsg: text, lastTime: nowTime() } : p));
    } else if (chat.type === 'eu' && chat.id) {
      setEuMsgsMap(prev => ({ ...prev, [chat.id!]: [...(prev[chat.id!] || []), msg] }));

      // AI reply with typing indicator
      const agent = agents.find(x => x.id === chat.id);
      const currentId = chat.id;
      setIsTyping(true);
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(async () => {
        let __t = '';
        try { const r: any = await (api as any).chat(currentId, [{ role: 'user', content: text }]); __t = (r && r.ok && r.text) ? String(r.text) : generateReply(text, agent); } catch { __t = generateReply(text, agent); }
        const reply: Message = { id: ++msgIdRef.current, text: __t, sent: false, time: nowTime() };
        setEuMsgsMap(prev => ({ ...prev, [currentId]: [...(prev[currentId] || []), reply] }));
        setIsTyping(false);
      }, 400);
    } else if (chat.type === 'group' && chat.id) {
      setGroupMsgsMap(prev => ({ ...prev, [chat.id!]: [...(prev[chat.id!] || []), msg] }));
    } else if (chat.type === 'contact' && chat.id) {
      setContactMsgsMap(prev => ({ ...prev, [chat.id!]: [...(prev[chat.id!] || []), msg] }));
      // peerchat: پیام را واقعاً بفرست (بدونِ پاسخِ خودکار — طرفِ مقابل انسان است)
      if (String(chat.id).startsWith('pgroup_')) { const gid = String(chat.id).slice('pgroup_'.length); (api as any).groupSend(gid, text).catch(() => {}); }
      else if (String(chat.id).startsWith('peer_')) { const other = String(chat.id).slice(5); (api as any).peerSend(other, text).catch(() => {}); }
    } else if (chat.type === 'customer' && chat.id) {
      setCustMsgsMap(prev => ({ ...prev, [chat.id!]: [...(prev[chat.id!] || []), msg] }));

      // AI reply with typing indicator
      const agent = agents.find(x => x.id === chat.id);
      const currentId = chat.id;
      setIsTyping(true);
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => {
        const reply: Message = { id: ++msgIdRef.current, text: generateReply(text, agent), sent: false, time: nowTime() };
        setCustMsgsMap(prev => ({ ...prev, [currentId]: [...(prev[currentId] || []), reply] }));
        setIsTyping(false);
      }, 1500 + Math.random() * 1000);
    }
  }, [chat, company, agents, isAgentOwned]);

  // peerlive: تا گفتگوی کاربر-به-کاربر باز است، هر چند ثانیه پیام‌های تازه را از سرور بگیر تا بدونِ
  // رفرش/بستنِ چت، پیامِ طرفِ مقابل زنده بیاید. (وقتی چت بسته شد، پولینگ متوقف می‌شود.)
  useEffect(() => {
    const cid = String(chat.id || '');
    const isPeer = cid.startsWith('peer_');
    const isGroup = cid.startsWith('pgroup_');
    if (!chat.open || chat.type !== 'contact' || (!isPeer && !isGroup)) return;
    const other = isPeer ? cid.slice(5) : cid.slice('pgroup_'.length);
    let stop = false;
    const poll = async () => {
      try {
        const r: any = isGroup ? await (api as any).groupWith(other) : await (api as any).peerWith(other);
        if (stop) return;
        const msgs = (r?.messages || []).map((m: any) => ({ id: ++msgIdRef.current, text: m.text, sent: !!m.mine, time: '', senderName: m.mine ? '' : (m.fromName || '') }));
        setContactMsgsMap(prev => {
          const cur = prev[chat.id as string] || [];
          // فقط وقتی سرور پیامِ بیشتری دارد به‌روزرسانی کن تا پیامِ خوش‌بینانهٔ همین‌الان پاک نشود.
          if (msgs.length <= cur.length) return prev;
          return { ...prev, [chat.id as string]: msgs };
        });
      } catch (_) {}
    };
    const iv = setInterval(poll, 4000);
    poll();
    return () => { stop = true; clearInterval(iv); };
  }, [chat.open, chat.id, chat.type]);

  // Modal
  const openModalFn = useCallback((title: string, content: React.ReactNode, onBack?: (() => void) | null) => {
    setModal({ open: true, title, content, onBack: onBack || null });
  }, []);
  const closeModalFn = useCallback(() => setModal({ open: false, title: '', content: null, onBack: null }), []);

  // Toast
  const showToastFn = useCallback((msg: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ show: true, message: msg });
    toastTimerRef.current = setTimeout(() => setToast({ show: false, message: '' }), 2500);
  }, []);

  // Call
  const startCallFn = useCallback((name: string, callRole: string, bg: string, init: string, ext: string) => {
    setUnifiedCall({ open: false });
    if (callTimerRef.current) clearInterval(callTimerRef.current);
    setCall({ open: true, name, role: callRole, bg, init, ext, timer: 0 });
    callTimerRef.current = setInterval(() => {
      setCall(prev => prev.open ? { ...prev, timer: prev.timer + 1 } : prev);
    }, 1000);
  }, []);

  const endCallFn = useCallback(() => {
    if (callTimerRef.current) clearInterval(callTimerRef.current);
    setCall({ open: false, name: '', role: '', bg: '', init: '', ext: '', timer: 0 });
    showToastFn('تماس پایان یافت');
  }, [showToastFn]);

  // orderreload: پیام‌های سراسری (مثلِ نتیجهٔ پرداخت) از هر جای اپ روی توست نشان داده شوند.
  useEffect(() => {
    const onToast = (e: any) => { const m = e && e.detail; if (typeof m === 'string' && m) showToastFn(m); };
    window.addEventListener('neura:toast', onToast as any);
    return () => window.removeEventListener('neura:toast', onToast as any);
  }, [showToastFn]);

  // Unified Call
  const openUnifiedCallFn = useCallback(() => setUnifiedCall({ open: true }), []);
  const closeUnifiedCallFn = useCallback(() => setUnifiedCall({ open: false }), []);

  // Dev bridge for programmatic screen export (Figma/HTML capture harness).
  useEffect(() => {
    window.__NEURA_NAV__ = {
      goTeam: (team) => { setRole('admin'); setAppStage('app'); setBriefingSeen(true); setAgentTeam(team); },
      goAdmin: (screen) => { setRole('admin'); setAppStage('app'); setBriefingSeen(true); setAdminScreen(screen); },
      goEu: (screen) => { setRole('admin'); setAppStage('app'); setBriefingSeen(true); setAgentTeam('assistant'); setEuScreen(screen); },
      openChat: (id, type, meta) => { try { openChat(id, type as any, meta as any, []); } catch (_) {} },
      setStage: (s) => setAppStage(s),
      enterApp: () => { setAppStage('app'); setBriefingSeen(true); },
    };
  });

  // —— اتصال به بک‌اند مشترک: همان داده‌هایی که در سوپرادمین مدیریت می‌شوند ——
  useEffect(() => {
    (async () => {
      try { const st: any = await api.getSettings(); if (st?.defaultTheme === 'dark') setThemeAndPersist('dark'); } catch {}
      try { const ag: any = await api.agents(); if (Array.isArray(ag) && ag.length) setAgents(ag as any); } catch {}
      // داده‌های کسب‌وکار فقط برای admin در افکتِ نقش‌دار بارگذاری می‌شوند (کاربرِ عادی ۴۰۳ نگیرد)
    })();
  }, []);

  // agentrefresh: visibility — با بازگشتِ اپ به پیش‌زمینه، لیستِ ایجنت‌ها را تازه کن (قفل/حذف/غیرفعالِ
  // اعمال‌شده در سوپرادمین بلافاصله دیده شود، نه فقط بعدِ بستنِ کاملِ اپ).
  useEffect(() => {
    const onVis = () => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
      (async () => { try { const ag: any = await api.agents(); if (Array.isArray(ag)) setAgents(ag as any); } catch {} })();
    };
    if (typeof document !== 'undefined') document.addEventListener('visibilitychange', onVis);
    window.addEventListener('focus', onVis);
    return () => { if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', onVis); window.removeEventListener('focus', onVis); };
  }, []);

  // —— پس از ورود: داده‌های واقعی (فقط admin — کاربرِ عادی نباید /api/data بزند) ——
  useEffect(() => {
    if (appStage !== 'app' || role === 'user') return;
    (async () => {
      try { const cs: any = await api.list('customers'); if (Array.isArray(cs)) setCustomers(cs as any); } catch {}
      try { const od: any = await api.list('orders'); if (Array.isArray(od)) setOrders(od as any); } catch {}
      try { const tk: any = await api.list('tasks'); if (Array.isArray(tk)) setTasks(tk as any); } catch {}
      try { const dl: any = await api.list('deals'); if (Array.isArray(dl) && dl.length) setDeals(dl as any); } catch {}
      try { const pf: any = await api.list('personnel'); if (Array.isArray(pf) && pf.length) setPersonnel(pf as any); } catch {}
      try { const fi: any = await api.list('finance'); if (Array.isArray(fi)) setFinanceData({ income: fi.filter((x: any) => x.type === 'income'), expense: fi.filter((x: any) => x.type === 'expense') }); } catch {}
      try { const ag: any = await api.agents(); if (Array.isArray(ag) && ag.length) setAgents(ag as any); } catch {}
    })();
  }, [appStage]);

  // alarm: reminder poller — آلارم/نوتیفیکیشنِ یادآور وقتی اپ باز است.
  useEffect(() => {
    let stopped = false;
    const KEY = 'neura_fired_reminders';
    const getFired = (): Set<string> => { try { return new Set(JSON.parse(localStorage.getItem(KEY) || '[]')); } catch { return new Set(); } };
    const addFired = (id: string) => { try { const f = getFired(); f.add(id); localStorage.setItem(KEY, JSON.stringify([...f].slice(-300))); } catch {} };
    const beep = () => {
      try {
        const AC: any = (window as any).AudioContext || (window as any).webkitAudioContext; if (!AC) return;
        const ctx = new AC(); const o = ctx.createOscillator(); const g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination); o.type = 'sine'; o.frequency.value = 880; g.gain.value = 0.18; o.start();
        let n = 0; const iv = setInterval(() => { o.frequency.value = (o.frequency.value === 880 ? 660 : 880); if (++n > 7) { clearInterval(iv); try { o.stop(); ctx.close(); } catch {} } }, 260);
      } catch {}
    };
    const fire = (r: any) => {
      beep();
      try { if ('Notification' in window && Notification.permission === 'granted') new Notification('یادآور نورا', { body: r.title || 'یادآورِ شما', tag: r.id }); } catch {}
      try { showToast('⏰ یادآور: ' + (r.title || ''), 'info'); } catch {}
      // بنرِ تمام‌عرضِ ماندگار — تضمینِ «نشون‌دادن» (بوقِ تنها کافی نیست).
      try {
        const el = document.createElement('div');
        el.setAttribute('data-neura-reminder', String(r.id || ''));
        el.style.cssText = 'position:fixed;left:12px;right:12px;top:calc(12px + env(safe-area-inset-top));z-index:2147483647;background:linear-gradient(135deg,#7b62fc,#5b3fd6);color:#fff;border-radius:16px;padding:14px 16px;box-shadow:0 14px 44px rgba(0,0,0,.45);display:flex;align-items:center;gap:12px;font-family:Vazirmatn,Kamand,sans-serif;direction:rtl';
        const safe = String(r.title || 'یادآورِ شما').replace(/[<>&]/g, '');
        el.innerHTML = '<div style="font-size:24px">\u23F0</div><div style="flex:1;min-width:0"><div style="font-weight:800;font-size:14px">یادآور</div><div style="font-size:13px;opacity:.96;line-height:1.6">' + safe + '</div></div>';
        const btn = document.createElement('button');
        btn.textContent = 'باشه';
        btn.style.cssText = 'background:rgba(255,255,255,.22);border:none;color:#fff;border-radius:10px;padding:8px 16px;font-weight:700;cursor:pointer;font-family:inherit;flex-shrink:0';
        btn.onclick = () => { try { el.remove(); } catch {} };
        el.appendChild(btn);
        document.body.appendChild(el);
        setTimeout(() => { try { el.remove(); } catch {} }, 60000);
      } catch {}
    };
    const check = async () => {
      try {
        const res: any = await (api as any).reminderList();
        const list = Array.isArray(res?.reminders) ? res.reminders : [];
        const fired = getFired(); const now = Date.now();
        for (const r of list) {
          const due = Number(r && r.dueAt);
          if (due && due <= now && due > now - 3600000 && !fired.has(r.id)) { addFired(r.id); fire(r); }
        }
      } catch {}
    };
    try { import('../services/permissions').then(m => m.askNotificationOnce()).catch(() => {}); } catch {}
    check();
    const iv = setInterval(() => { if (!stopped) check(); }, 30000);
    return () => { stopped = true; clearInterval(iv); };
  }, []);

  return (
    <AppContext.Provider value={{
      role, setRole,
      adminScreen, setAdminScreen,
      euScreen, setEuScreen,
      goBack, canGoBack,
      company, setCompany, companies, addCompany, updateCompany, removeCompany,
      chatTab, setChatTab,
      crmTab, setCrmTab,
      finTab, setFinTab,
      agents, setAgents,
      personnel, setPersonnel,
      customers, setCustomers, upsertCustomer, dropCustomer,
      deals, setDeals,
      financeData, setFinanceData,
      invoices, setInvoices, addInvoice,
      orders, setOrders,
      euCart, setEuCart, cartAdd, cartDec, cartRemove, cartClear, cartQty, cartCount, checkoutCart, euPlacedOrders, setEuPlacedOrders,
      userProfile, setUserProfile,
      euProfile, setEuProfile,
      tasks, setTasks,
      chat, isTyping, openChat, closeChat, toggleTopics, switchTopic, createNewTopic, renameTopic, removeTopic, sendMessage, getMessages, getTopics,
      modal, openModal: openModalFn, closeModal: closeModalFn,
      call, startCall: startCallFn, endCall: endCallFn,
      unifiedCall, openUnifiedCall: openUnifiedCallFn, closeUnifiedCall: closeUnifiedCallFn,
      toast, showToast: showToastFn,
      nextTopicId, nextMsgId,
      theme, setTheme: setThemeAndPersist,
      themeAuto, setThemeAuto,
      agentTeam, setAgentTeam,
      agentAccent, setAgentAccent,
      teamAccent, setTeamAccent,
      defaultAgent, setDefaultAgent,
      assistantId, setAssistantId,
      teamAgentId, setTeamAgentId,
      ownedAgents, isAgentOwned, purchaseAgent,
      walletBalance, setWalletBalance, walletTx, walletDeposit, walletWithdraw,
      ownedAvatars, ownedThemes, buyAvatar, buyTheme,
      promotedMarket, setPromotedMarket,
      speakingMsgId, ttsSpeaking: speakingMsgId !== null, speakMessage,
      chatGroups, addChatGroup: addChatGroupFn, removeChatGroup: removeChatGroupFn, updateChatGroup: updateChatGroupFn,
      groupChats, addGroupChat: addGroupChatFn, removeGroupChat: removeGroupChatFn, updateGroupChat: updateGroupChatFn,
      briefingSeen, setBriefingSeen,
      appStage, setAppStage,
      welcomeEnabled, setWelcomeEnabled, welcomeConfig, setWelcomeConfig,
      authMode, setAuthMode,
      hasAccount, completeAuth, logout,
      preTheme, setPreTheme,
    }}>
      {children}
    </AppContext.Provider>
  );
}