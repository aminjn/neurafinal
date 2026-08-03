import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import {
  Agent, Personnel, Customer, Deal, FinanceItem, Order, Message, Topic, UserProfile, Task,
  INITIAL_AGENTS, INITIAL_PERSONNEL, INITIAL_CUSTOMERS, CRM_DEALS, FINANCE_DATA, INITIAL_ORDERS, INITIAL_TASKS,
  INITIAL_USER_PROFILE, INITIAL_EU_PROFILE,
  Invoice, INVOICES_DATA,
  COMPANIES,
  nowTime, toFa, generateReply
} from './data';

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
export const INITIAL_WALLET_TX: WalletTx[] = [
  { id: 'wt1', type: 'purchase', title: 'خرید عامل: منشی هوشمند', date: '۱۴۰۴/۱۲/۰۳، ۱۰:۱۵', amount: -1200000 },
  { id: 'wt2', type: 'deposit',  title: 'واریز به کیف پول',       date: '۱۴۰۴/۱۲/۰۲، ۰۹:۴۰', amount: 500000 },
  { id: 'wt3', type: 'purchase', title: 'خرید عامل: حسابدار AI',   date: '۱۴۰۴/۱۱/۲۸، ۱۶:۲۲', amount: -2200000 },
  { id: 'wt4', type: 'spend',    title: 'اشتراک Neura Pro',        date: '۱۴۰۴/۱۱/۲۵، ۱۲:۰۰', amount: -149000 },
  { id: 'wt5', type: 'deposit',  title: 'شارژ کیف پول',            date: '۱۴۰۴/۱۱/۲۰، ۰۸:۳۰', amount: 1000000 },
  { id: 'wt6', type: 'purchase', title: 'خرید عامل: بازاریاب',     date: '۱۴۰۴/۱۱/۱۵، ۱۴:۰۵', amount: -1800000 },
];
function nowDateTimeFa(): string {
  try { return new Intl.DateTimeFormat('fa-IR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date()); }
  catch { return 'هم‌اکنون'; }
}
export type AdminScreen = 'assistantScreen' | 'secTodayScreen' | 'chatsScreen' | 'dashboardScreen' | 'crmScreen' | 'financeScreen' | 'reportsScreen' | 'analyticsScreen' | 'moreScreen' | 'tasksScreen' | 'inventoryScreen' | 'purchaseRequestScreen' | 'salesFunnelScreen' | 'salesForecastScreen' | 'campaignScreen' | 'secPlanningScreen' | 'secCrmLiteScreen' | 'secPerformanceScreen' | 'secDailyFinanceScreen' | 'mktConversationsScreen' | 'mktLeadsScreen' | 'mktSegmentScreen' | 'mktPerformanceScreen' | 'mktApprovalsScreen' | 'mktCalendarScreen' | 'procRequestsScreen' | 'procOrdersScreen' | 'procDeliveryScreen' | 'procFinanceScreen' | 'salesPosScreen' | 'salesOrdersScreen' | 'salesInvoicesScreen' | 'salesMenuScreen' | 'salesCustomersScreen' | 'salesQuickReportScreen' | 'salesConversationsScreen' | 'salesShiftScreen';
export type EuScreen = 'euHomeScreen' | 'euChatListScreen' | 'euAgentDiscovery' | 'euOrdersScreen' | 'euProfileScreen' | 'euDineScreen' | 'euAssistantScreen' | 'euSupportScreen' | 'euMarketScreen' | 'euPlannerScreen' | 'euSearchScreen' | 'euReportScreen' | 'euCartScreen' | 'euOffersScreen';
export type ChatTab = 'agents' | 'personnel' | 'customers' | string;
export type AgentTeam = 'assistant' | 'marketing' | 'secretary' | 'finance' | 'procurement' | 'sales' | null;
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

  // Currently displayed agent within the active team (shared between avatar + workspace demo state)
  teamAgentId: string | null;
  setTeamAgentId: (id: string | null) => void;

  // Agent ownership (demo until purchased)
  ownedAgents: string[];
  isAgentOwned: (id?: string | null) => boolean;
  purchaseAgent: (id: string, meta?: { name?: string; price?: number }) => void;
  walletBalance: number;
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
  const [role, setRole] = useState<'admin' | 'user'>('admin');

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
  const [companies, setCompanies] = useState<Record<string, { name: string; type: string; phone?: string; address?: string; logo?: string }>>(() => ({ ...COMPANIES }));
  const addCompany = useCallback((name: string, type: string, extra?: { phone?: string; address?: string; logo?: string }) => {
    const key = 'co_' + Date.now();
    setCompanies(prev => ({ ...prev, [key]: { name, type, ...(extra || {}) } }));
    setCompany(key);
    return key;
  }, []);
  const updateCompany = useCallback((key: string, patch: Partial<{ name: string; type: string; phone: string; address: string; logo: string }>) => {
    setCompanies(prev => prev[key] ? { ...prev, [key]: { ...prev[key], ...patch } } : prev);
  }, []);
  const removeCompany = useCallback((key: string) => {
    setCompanies(prev => {
      const keys = Object.keys(prev);
      if (keys.length <= 1 || !prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
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
  const [personnel, setPersonnel] = useState<Personnel[]>(INITIAL_PERSONNEL);
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [deals, setDeals] = useState<Deal[]>(CRM_DEALS);
  const [financeData, setFinanceData] = useState<{ income: FinanceItem[]; expense: FinanceItem[] }>(FINANCE_DATA);
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
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
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
        return {
          id: Date.now() + Math.random(), source,
          num: fa(1100 + Math.floor(Math.random() * 800)),
          items: itemsText, status: 'preparing',
          vendor: lines[0].shop || lines[0].restaurant || (source === 'dine' ? 'رستوران' : 'فروشگاه'),
          date: 'هم‌اکنون', total: fa(total), eta: source === 'dine' ? '۳۰ دقیقه' : '۲ روز کاری', progress: 20,
        };
      });
      setEuPlacedOrders(po => [...newOrders, ...po]);
      return [];
    });
  }, []);
  const [userProfile, setUserProfile] = useState<UserProfile>(INITIAL_USER_PROFILE);
  const [euProfile, setEuProfile] = useState<UserProfile>(INITIAL_EU_PROFILE);
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);

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
  const [agentTeam, setAgentTeam] = useState<AgentTeam>('secretary');
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
    setOwnedAgents(prev => {
      const next = prev.includes(key) ? prev : [...prev, key];
      try { localStorage.setItem('neura_owned_agents', JSON.stringify(next)); } catch {}
      return next;
    });
    // Record the purchase as a wallet transaction (with agent name + timestamp)
    if (meta && meta.name) {
      const price = meta.price || 0;
      const tx: WalletTx = { id: 'wt' + Date.now(), type: 'purchase', title: 'خرید عامل: ' + meta.name, date: nowDateTimeFa(), amount: -price };
      setWalletTx(prev => { const n = [tx, ...prev]; try { localStorage.setItem('neura_wallet_tx', JSON.stringify(n)); } catch {} return n; });
      if (price > 0) setWalletBalance(b => { const nb = Math.max(0, b - price); try { localStorage.setItem('neura_wallet_balance', JSON.stringify(nb)); } catch {} return nb; });
    }
  }, [company]);

  // ── Wallet ──
  const [walletBalance, setWalletBalance] = useState<number>(() => {
    try {
      const s = localStorage.getItem('neura_wallet_balance');
      // یک‌بار موجودی را به حداقل ۱۰ میلیون تومان برسان تا خرید تم/آواتار ممکن باشد
      if (!localStorage.getItem('neura_wallet_min10m')) {
        localStorage.setItem('neura_wallet_min10m', '1');
        const cur = s ? JSON.parse(s) : 0;
        const nb = Math.max(cur, 10000000);
        localStorage.setItem('neura_wallet_balance', JSON.stringify(nb));
        return nb;
      }
      return s ? JSON.parse(s) : 10000000;
    } catch { return 10000000; }
  });
  const [walletTx, setWalletTx] = useState<WalletTx[]>(() => {
    try { const s = localStorage.getItem('neura_wallet_tx'); return s ? JSON.parse(s) : INITIAL_WALLET_TX; } catch { return INITIAL_WALLET_TX; }
  });
  const walletDeposit = useCallback((amount: number) => {
    if (!amount || amount <= 0) return;
    const tx: WalletTx = { id: 'wt' + Date.now(), type: 'deposit', title: 'واریز به کیف پول', date: nowDateTimeFa(), amount };
    setWalletTx(prev => { const n = [tx, ...prev]; try { localStorage.setItem('neura_wallet_tx', JSON.stringify(n)); } catch {} return n; });
    setWalletBalance(b => { const nb = b + amount; try { localStorage.setItem('neura_wallet_balance', JSON.stringify(nb)); } catch {} return nb; });
  }, []);
  const walletWithdraw = useCallback((amount: number) => {
    if (!amount || amount <= 0) return;
    const tx: WalletTx = { id: 'wt' + Date.now(), type: 'withdraw', title: 'برداشت از کیف پول', date: nowDateTimeFa(), amount: -amount };
    setWalletTx(prev => { const n = [tx, ...prev]; try { localStorage.setItem('neura_wallet_tx', JSON.stringify(n)); } catch {} return n; });
    setWalletBalance(b => { const nb = Math.max(0, b - amount); try { localStorage.setItem('neura_wallet_balance', JSON.stringify(nb)); } catch {} return nb; });
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
      const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
      if (!synth) return;
      const cur = speakingMsgIdRef.current;
      synth.cancel();
      if (cur === id) { speakingMsgIdRef.current = null; setSpeakingMsgId(null); return; }
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'fa-IR'; u.rate = 1; u.pitch = 1;
      const done = () => { if (speakingMsgIdRef.current === id) { speakingMsgIdRef.current = null; setSpeakingMsgId(null); } };
      u.onend = done; u.onerror = done;
      speakingMsgIdRef.current = id; setSpeakingMsgId(id);
      synth.speak(u);
    } catch { speakingMsgIdRef.current = null; setSpeakingMsgId(null); }
  }, []);
  useEffect(() => () => { try { window.speechSynthesis && window.speechSynthesis.cancel(); } catch {} }, []);

  const buyAvatar = useCallback((src: string, price: number) => {
    setOwnedAvatars(prev => { if (prev.includes(src)) return prev; const n = [...prev, src]; try { localStorage.setItem('neura_owned_avatars', JSON.stringify(n)); } catch {} return n; });
    const tx: WalletTx = { id: 'wt' + Date.now(), type: 'purchase', title: 'خرید آواتار', date: nowDateTimeFa(), amount: -(price || 0) };
    setWalletTx(prev => { const n = [tx, ...prev]; try { localStorage.setItem('neura_wallet_tx', JSON.stringify(n)); } catch {} return n; });
    if (price > 0) setWalletBalance(b => { const nb = Math.max(0, b - price); try { localStorage.setItem('neura_wallet_balance', JSON.stringify(nb)); } catch {} return nb; });
  }, []);
  const buyTheme = useCallback((hex: string, price: number) => {
    setOwnedThemes(prev => { if (prev.includes(hex)) return prev; const n = [...prev, hex]; try { localStorage.setItem('neura_owned_themes', JSON.stringify(n)); } catch {} return n; });
    const tx: WalletTx = { id: 'wt' + Date.now(), type: 'purchase', title: 'خرید تم رنگی', date: nowDateTimeFa(), amount: -(price || 0) };
    setWalletTx(prev => { const n = [tx, ...prev]; try { localStorage.setItem('neura_wallet_tx', JSON.stringify(n)); } catch {} return n; });
    if (price > 0) setWalletBalance(b => { const nb = Math.max(0, b - price); try { localStorage.setItem('neura_wallet_balance', JSON.stringify(nb)); } catch {} return nb; });
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
  const addGroupChatFn = useCallback((gc: GroupChat) => setGroupChats(prev => [...prev, gc]), []);
  const removeGroupChatFn = useCallback((id: string) => setGroupChats(prev => prev.filter(g => g.id !== id)), []);
  const updateGroupChatFn = useCallback((id: string, patch: Partial<GroupChat>) => {
    setGroupChats(prev => prev.map(g => g.id === id ? { ...g, ...patch } : g));
  }, []);
  const removeChatGroupFn = useCallback((id: string) => {
    setChatGroups(prev => prev.filter(g => g.id !== id));
  }, []);

  // Briefing
  const [briefingSeen, setBriefingSeen] = useState(false);

  // ===== App entry flow =====
  const readLS = (k: string) => { try { return localStorage.getItem(k); } catch (_) { return null; } };
  const [hasAccount, setHasAccount] = useState<boolean>(() => readLS('neura_account') === '1');
  const [appStage, setAppStage] = useState<'splash' | 'home' | 'auth' | 'app'>('splash');
  const [authMode, setAuthMode] = useState<'login' | 'register'>(() => (readLS('neura_account') === '1' ? 'login' : 'register'));

  // After the splash logo (2s), branch on whether the user is logged in / has an account
  useEffect(() => {
    if (appStage !== 'splash') return;
    const t = setTimeout(() => {
      const loggedIn = readLS('neura_loggedin') === '1';
      const account = readLS('neura_account') === '1';
      if (loggedIn) { setBriefingSeen(false); setAppStage('app'); }
      else if (account) { setAuthMode('login'); setAppStage('auth'); }
      else { setAppStage('home'); }
    }, 3000);
    return () => clearTimeout(t);
  }, [appStage]);

  const completeAuth = useCallback(() => {
    try { localStorage.setItem('neura_account', '1'); localStorage.setItem('neura_loggedin', '1'); } catch (_) {}
    // Carry the chosen login theme into the panels: dark → dark, light → glass
    try {
      const pre = localStorage.getItem('neura-pre-theme') === 'dark' ? 'dark' : 'light';
      setThemeAndPersist(pre === 'dark' ? 'dark' : 'glass');
    } catch (_) {}
    setHasAccount(true);
    setBriefingSeen(false); // registered users see the greeting first
    setAppStage('app');
  }, [setThemeAndPersist]);

  const logout = useCallback(() => {
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
      messages: a ? [{ id: ++msgIdRef.current, text: 'سلام! من ' + a.name + ' هستم، ' + a.role + '. چطور کمکتان کنم؟', sent: false, time: nowTime() }] : []
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
    const assistantConversations: Record<string, Message[]> = {
      'ac1': [
        { id: ++msgIdRef.current, text: 'سلام، من دستیار شخصی کاربر هستم. می‌خواستم درباره تغییر طرح اشتراک پیگیری کنم.', sent: true, time: '۱۰:۱۵' },
        { id: ++msgIdRef.current, text: 'سلام، بله بفرمایید. طرح فعلی شما چیست؟', sent: false, time: '۱۰:۱۶' },
        { id: ++msgIdRef.current, text: 'طرح فعلی اشتراک ماهانه ۵۰ گیگ است. کاربر می‌خواهد به طرح سالانه ۱۰۰ گیگ تغییر دهد.', sent: true, time: '۱۰:۱۷' },
        { id: ++msgIdRef.current, text: 'درخواست تغییر طرح ثبت شد. ظرف ۲۴ ساعت فعال می‌شود.', sent: false, time: '۱۰:۲۰' },
        { id: ++msgIdRef.current, text: 'ممنون، منتظر تایید نهایی هستم.', sent: true, time: '۱۰:۲۱' },
      ],
      'ac2': [
        { id: ++msgIdRef.current, text: 'سلام دکتر احمدی، از طرف کاربر تماس می‌گیرم برای رزرو نوبت ویزیت.', sent: true, time: '۰۹:۳۰' },
        { id: ++msgIdRef.current, text: 'سلام، بله چه روزی مد نظرتان است؟', sent: false, time: '۰۹:۳۲' },
        { id: ++msgIdRef.current, text: 'روز شنبه صبح اگر امکانش هست.', sent: true, time: '۰۹:۳۳' },
        { id: ++msgIdRef.current, text: 'شنبه ساعت ۱۰ صبح خالی دارم. ثبت کنم؟', sent: false, time: '۰۹:۳۵' },
        { id: ++msgIdRef.current, text: 'بله لطفاً ثبت کنید. ممنونم.', sent: true, time: '۰۹:۳۶' },
        { id: ++msgIdRef.current, text: 'نوبت برای شنبه ساعت ۱۰ ثبت شد. خوش آمدید.', sent: false, time: '۰۹:۳۷' },
      ],
      'ac3': [
        { id: ++msgIdRef.current, text: 'سلام، قیمت بلیط تهران به مشهد برای هفته آینده چقدر است؟', sent: true, time: '۰۸:۴۵' },
        { id: ++msgIdRef.current, text: 'سلام، اجازه بدید بررسی کنم. پرواز یا قطار مد نظرتان هست؟', sent: false, time: '۰۸:۴۷' },
        { id: ++msgIdRef.current, text: 'هر دو مورد لطفاً. کاربر ترجیح می‌دهد ارزان‌ترین گزینه را ببیند.', sent: true, time: '۰۸:۴۸' },
        { id: ++msgIdRef.current, text: 'در حال بررسی هستم. تا ۱ ساعت دیگر لیست قیمت‌ها را ارسال می‌کنم.', sent: false, time: '۰۸:۵۰' },
      ],
      'ac4': [
        { id: ++msgIdRef.current, text: 'سلام، می‌خواستم برای سرویس دوره‌ای خودرو وقت بگیرم.', sent: true, time: '۱۴:۰۰' },
        { id: ++msgIdRef.current, text: 'سلام، مدل خودرو و کیلومتر فعلی را بفرمایید.', sent: false, time: '۱۴:۰۲' },
        { id: ++msgIdRef.current, text: 'پژو ۲۰۶، حدود ۸۵ هزار کیلومتر.', sent: true, time: '۱۴:۰۳' },
        { id: ++msgIdRef.current, text: 'چهارشنبه ساعت ۹ صبح وقت خالی داریم. مناسب است؟', sent: false, time: '۱۴:۰۵' },
        { id: ++msgIdRef.current, text: 'بله عالیه. ثبت کنید لطفاً.', sent: true, time: '۱۴:۰۶' },
        { id: ++msgIdRef.current, text: 'وقت سرویس برای چهارشنبه ۹ صبح ثبت شد. خودرو را صبح تحویل بدید.', sent: false, time: '۱۴:۰۸' },
      ],
      'ac5': [
        { id: ++msgIdRef.current, text: 'سلام، سفارش شماره ۸۸۴۵ مشکل داشته و کاربر درخواست مرجوعی دارد.', sent: true, time: '۱۱:۲۰' },
        { id: ++msgIdRef.current, text: 'سلام، لطفاً مشکل محصول را توضیح دهید.', sent: false, time: '۱۱:۲۲' },
        { id: ++msgIdRef.current, text: 'محصول آسیب‌دیده تحویل داده شده. عکس بسته‌بندی موجود است.', sent: true, time: '۱۱:۲۳' },
        { id: ++msgIdRef.current, text: 'درخواست مرجوعی ثبت شد. در حال بررسی هستیم و نتیجه را اطلاع می‌دهیم.', sent: false, time: '۱۱:۲۵' },
      ],
      'ac6': [
        { id: ++msgIdRef.current, text: 'سلام، می‌خواستم وضعیت درخواست وام مسکن کاربر را پیگیری کنم.', sent: true, time: '۱۵:۰۰' },
        { id: ++msgIdRef.current, text: 'سلام، شماره پرونده را بفرمایید.', sent: false, time: '۱۵:۰۲' },
        { id: ++msgIdRef.current, text: 'شماره پرونده: ۴۴۲۵۶۷۸۹', sent: true, time: '۱۵:۰۳' },
        { id: ++msgIdRef.current, text: 'پرونده در مرحله بررسی کمیته اعتباری است. احتمالاً تا هفته آینده نتیجه اعلام می‌شود.', sent: false, time: '۱۵:۰' },
        { id: ++msgIdRef.current, text: 'ممنون، منتظر اطلاع‌رسانی هستیم.', sent: true, time: '۱۵:۰۷' },
      ],
      'ac7': [
        { id: ++msgIdRef.current, text: 'سلام، کاربر درخواست تمدید بیمه شخص ثالث خودرو را دارد.', sent: true, time: '۱۶:۳۰' },
        { id: ++msgIdRef.current, text: 'سلام، شماره بیمه‌نامه فعلی را لطفاً ارسال کنید.', sent: false, time: '۱۶:۳۲' },
        { id: ++msgIdRef.current, text: 'شماره بیمه‌نامه: ۹۸۷۶۵۴۳۲۱', sent: true, time: '۱۶:۳۳' },
        { id: ++msgIdRef.current, text: 'بیمه‌نامه شناسایی شد. مبلغ تمدید ۱۸,۵۰۰,۰۰۰ ریال. تایید می‌کنید؟', sent: false, time: '۱۶:۳۵' },
        { id: ++msgIdRef.current, text: 'بله، لطفاً ثبت کنید.', sent: true, time: '۱۶:۳۶' },
        { id: ++msgIdRef.current, text: 'درخواست تمدید ثبت شد. بیمه‌نامه جدید ظرف ۴۸ ساعت صادر می‌شود.', sent: false, time: '۱۶:۳۸' },
      ],
    };

    // Pre-built conversations for user-to-user / group chats
    const userConversations: Record<string, Message[]> = {
      'u1': [
        { id: ++msgIdRef.current, text: 'سلام علی، گزارش پروژه آماده شد؟', sent: true, time: '۰۹:۳۰' },
        { id: ++msgIdRef.current, text: 'سلام، آره داشتم نهایی‌اش می‌کردم', sent: false, time: '۰۹:۳۲' },
        { id: ++msgIdRef.current, text: 'عالیه، لطفاً تا ظهر بفرست', sent: true, time: '۰۹:۳۳' },
        { id: ++msgIdRef.current, text: 'حتماً، یه سری نمودار هم اضافه کردم', sent: false, time: '۰۹:۴۵' },
        { id: ++msgIdRef.current, text: 'فایل گزارش رو فرستادم، چک کن', sent: false, time: '۱۰:۰۰' },
        { id: ++msgIdRef.current, text: 'دستت درد نکنه، الان بررسی می‌کنم 👍', sent: true, time: '۱۰:۰۲' },
      ],
      'u2': [
        { id: ++msgIdRef.current, text: 'مریم جان سلام، جلسه فردا هنوز سر جاشه؟', sent: true, time: '۱۴:۱۰' },
        { id: ++msgIdRef.current, text: 'سلام، بله ساعت ۱۰ صبح اتاق کنفرانس', sent: false, time: '۱۴:۱۲' },
        { id: ++msgIdRef.current, text: 'لطفاً با تیم طراحی هم هماهنگ کن', sent: true, time: '۱۴:۱۵' },
        { id: ++msgIdRef.current, text: 'ممنون، هماهنگی انجام شد', sent: false, time: '۱۴:۴۰' },
      ],
      'u3': [
        { id: ++msgIdRef.current, text: 'حسین آقا سلام، پروپوزال رو دیدی؟', sent: true, time: '۱۱:۰۰' },
        { id: ++msgIdRef.current, text: 'سلام، بله دیدم. چند تا پیشنهاد دارم', sent: false, time: '۱۱:۰۵' },
        { id: ++msgIdRef.current, text: 'بگو، گوشم با توئه', sent: true, time: '۱۱:۰۶' },
        { id: ++msgIdRef.current, text: 'بخش بودجه‌بندی نیاز به بازنگری داره', sent: false, time: '۱۱:۱۰' },
        { id: ++msgIdRef.current, text: 'اوکی، فردا جلسه بذاریم بررسی کنیم؟', sent: true, time: '۱۱:۱۲' },
        { id: ++msgIdRef.current, text: 'جلسه فردا ساعت ۱۰ تنظیم شد', sent: false, time: '۱۱:۱۵' },
      ],
      'u4': [
        { id: ++msgIdRef.current, text: 'سارا سلام، لینک ریپوی پروژه رو داری؟', sent: false, time: '۱۵:۰۰' },
        { id: ++msgIdRef.current, text: 'سلام، کدوم پروژه؟ داشبورد جدید؟', sent: true, time: '۱۵:۰۲' },
        { id: ++msgIdRef.current, text: 'آره همون، می‌خوام برنچ جدید بزنم', sent: false, time: '۱۵:۰۳' },
        { id: ++msgIdRef.current, text: 'لینک پروژه رو بفرست لطفاً', sent: false, time: '۱۵:۱۰' },
      ],
      'u5': [
        { id: ++msgIdRef.current, text: 'بچه‌ها سلام، وضعیت دیپلوی چطوره؟', sent: true, time: '۱۶:۰۰' },
        { id: ++msgIdRef.current, text: 'داریم تست نهایی می‌زنیم', sent: false, time: '۱۶:۰۵' },
        { id: ++msgIdRef.current, text: 'باگ احراز هویت فیکس شد', sent: false, time: '۱۶:۲۰' },
        { id: ++msgIdRef.current, text: 'عالیه، مرج کنید بره روی استیجینگ', sent: true, time: '۱۶:۲۵' },
        { id: ++msgIdRef.current, text: 'استیجینگ تست شد، مشکلی نداره', sent: false, time: '۱۷:۰۰' },
        { id: ++msgIdRef.current, text: 'دیپلوی انجام شد ✅', sent: false, time: '۱۷:۳۰' },
        { id: ++msgIdRef.current, text: 'دمتون گرم تیم 🎉', sent: true, time: '۱۷:۳۲' },
      ],
      'u6': [
        { id: ++msgIdRef.current, text: 'رضا جان سلام، قرارداد همکاری رو بررسی کردی؟', sent: true, time: '۰۸:۳۰' },
        { id: ++msgIdRef.current, text: 'سلام، بله خوندمش. یه بند درباره فسخ نیاز به اصلاح داره', sent: false, time: '۰۸:۴۵' },
        { id: ++msgIdRef.current, text: 'کدوم بند؟', sent: true, time: '۰۸:۴۶' },
        { id: ++msgIdRef.current, text: 'بند ۷، شرایط فسخ زودهنگام. اصلاحش کردم و امضا کردم', sent: false, time: '۰۹:۱۵' },
        { id: ++msgIdRef.current, text: 'قرارداد رو امضا کردم', sent: false, time: '۰۹:۲۰' },
      ],
      'u7': [
        { id: ++msgIdRef.current, text: 'سلام گروه، گزارش ماهانه فروردین آماده‌ست', sent: false, time: '۱۷:۰۰' },
        { id: ++msgIdRef.current, text: 'ممنون، خروجی PDF هم داره؟', sent: true, time: '۱۷:۰۵' },
        { id: ++msgIdRef.current, text: 'بله، فایل PDF هم پیوست شده', sent: false, time: '۱۷:۱۰' },
        { id: ++msgIdRef.current, text: 'عالیه، فردا جلسه بررسی می‌ذاریم', sent: true, time: '۱۷:۱۵' },
      ],
    };

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

    const msgs: Message[] = [{ id: ++msgIdRef.current, text: greetings[type] || (a ? 'سلام! من ' + a.name + ' هستم. چطور می‌توانم کمکتان کنم؟' : 'سلام!'), sent: false, time: nowTime() }];
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
      getEuMsgs(id);
    } else if (type === 'customer') {
      getCustMsgs(id);
    } else if (type === 'contact') {
      setContactMsgsMap(prev => {
        if (prev[id]) return prev;
        return { ...prev, [id]: initialMessages || [] };
      });
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
      typingTimerRef.current = setTimeout(() => {
        const reply: Message = { id: ++msgIdRef.current, text: generateReply(text, agent), sent: false, time: nowTime() };
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
      }, 1500 + Math.random() * 1000);
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
      typingTimerRef.current = setTimeout(() => {
        const reply: Message = { id: ++msgIdRef.current, text: generateReply(text, agent), sent: false, time: nowTime() };
        setEuMsgsMap(prev => ({ ...prev, [currentId]: [...(prev[currentId] || []), reply] }));
        setIsTyping(false);
      }, 1500 + Math.random() * 1000);
    } else if (chat.type === 'group' && chat.id) {
      setGroupMsgsMap(prev => ({ ...prev, [chat.id!]: [...(prev[chat.id!] || []), msg] }));
    } else if (chat.type === 'contact' && chat.id) {
      setContactMsgsMap(prev => ({ ...prev, [chat.id!]: [...(prev[chat.id!] || []), msg] }));
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

  // Unified Call
  const openUnifiedCallFn = useCallback(() => setUnifiedCall({ open: true }), []);
  const closeUnifiedCallFn = useCallback(() => setUnifiedCall({ open: false }), []);

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
      customers, setCustomers,
      deals, setDeals,
      financeData, setFinanceData,
      invoices, setInvoices, addInvoice,
      orders, setOrders,
      euCart, setEuCart, cartAdd, cartDec, cartRemove, cartClear, cartQty, cartCount, checkoutCart, euPlacedOrders,
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
      teamAgentId, setTeamAgentId,
      ownedAgents, isAgentOwned, purchaseAgent,
      walletBalance, walletTx, walletDeposit, walletWithdraw,
      ownedAvatars, ownedThemes, buyAvatar, buyTheme,
      promotedMarket, setPromotedMarket,
      speakingMsgId, ttsSpeaking: speakingMsgId !== null, speakMessage,
      chatGroups, addChatGroup: addChatGroupFn, removeChatGroup: removeChatGroupFn, updateChatGroup: updateChatGroupFn,
      groupChats, addGroupChat: addGroupChatFn, removeGroupChat: removeGroupChatFn, updateGroupChat: updateGroupChatFn,
      briefingSeen, setBriefingSeen,
      appStage, setAppStage,
      authMode, setAuthMode,
      hasAccount, completeAuth, logout,
      preTheme, setPreTheme,
    }}>
      {children}
    </AppContext.Provider>
  );
}