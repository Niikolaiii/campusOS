"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Bell,
  Building2,
  ChevronRight,
  CircleUserRound,
  ClipboardList,
  Clock3,
  Download,
  DoorClosed,
  Droplets,
  Fan,
  Gauge,
  Languages,
  LayoutDashboard,
  Lightbulb,
  LockKeyhole,
  LogIn,
  LogOut,
  Menu,
  Moon,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  Sun,
  Thermometer,
  Users,
  UserPlus,
  Wrench,
  X,
  Zap,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

type View =
  | "overview"
  | "equipment"
  | "sensors"
  | "operations"
  | "maintenance"
  | "admin";
type EquipmentStatus = "Operational" | "Attention" | "Offline";
type TicketStatus = "Open" | "In progress" | "Resolved";
type Priority = "Critical" | "High" | "Medium" | "Low";
type Equipment = {
  id: string;
  name: string;
  mm: string;
  building: string;
  location: string;
  category: string;
  status: EquipmentStatus;
  updated: string;
};
type Ticket = {
  id: string;
  equipment: string;
  issue: string;
  location: string;
  reporter: string;
  priority: Priority;
  status: TicketStatus;
  created: string;
};
type SensorPoint = {
  time: string;
  temperature: number;
  humidity: number;
  co2: number;
  energy: number;
};
type ZoneMode = "Auto" | "Eco" | "Ventilation" | "Off";
type ZoneControl = {
  id: string;
  name: string;
  building: string;
  occupancy: number;
  capacity: number;
  temperature: number;
  setpoint: number;
  mode: ZoneMode;
  lights: boolean;
  airQuality: "Good" | "Fair" | "Poor";
};
type UserSession = { name: string; email: string };

const equipmentSeed: Equipment[] = [
  {
    id: "EQ-1042",
    name: "Main Chiller Unit",
    mm: "ပင်မ အအေးပေးစက်",
    building: "Innovation Centre",
    location: "Plant room · B1",
    category: "HVAC",
    status: "Attention",
    updated: "2 min ago",
  },
  {
    id: "EQ-1087",
    name: "Air Handling Unit 04",
    mm: "လေဝင်လေထွက်စက် ၀၄",
    building: "Engineering Block",
    location: "Roof · Zone C",
    category: "HVAC",
    status: "Operational",
    updated: "4 min ago",
  },
  {
    id: "EQ-1124",
    name: "Lift Controller B",
    mm: "ဓာတ်လှေကားထိန်းချုပ်စက် B",
    building: "Library",
    location: "Core B · Level 1",
    category: "Vertical transport",
    status: "Offline",
    updated: "8 min ago",
  },
  {
    id: "EQ-1158",
    name: "Solar Inverter Array",
    mm: "နေရောင်ခြည် အင်ဗာတာ",
    building: "Science Block",
    location: "Roof · East",
    category: "Energy",
    status: "Operational",
    updated: "11 min ago",
  },
  {
    id: "EQ-1191",
    name: "Water Pump 02",
    mm: "ရေစုပ်စက် ၀၂",
    building: "Student Centre",
    location: "Service room · G",
    category: "Plumbing",
    status: "Operational",
    updated: "13 min ago",
  },
  {
    id: "EQ-1216",
    name: "Emergency Generator",
    mm: "အရေးပေါ်မီးစက်",
    building: "Innovation Centre",
    location: "Plant room · G",
    category: "Power",
    status: "Operational",
    updated: "18 min ago",
  },
];

const ticketSeed: Ticket[] = [
  {
    id: "MT-26091",
    equipment: "Lift Controller B",
    issue: "Controller is not responding; lift isolated for safety.",
    location: "Library · Core B",
    reporter: "M. Carter",
    priority: "Critical",
    status: "Open",
    created: "Today, 09:42",
  },
  {
    id: "MT-26090",
    equipment: "Main Chiller Unit",
    issue: "Supply temperature remains above target range.",
    location: "Innovation Centre · B1",
    reporter: "A. Rahman",
    priority: "High",
    status: "In progress",
    created: "Today, 08:16",
  },
  {
    id: "MT-26087",
    equipment: "Lighting Panel L3",
    issue: "Intermittent lighting in seminar room 3.14.",
    location: "Engineering Block · L3",
    reporter: "J. Green",
    priority: "Medium",
    status: "Resolved",
    created: "Yesterday, 15:05",
  },
];

function initialSensorData(): SensorPoint[] {
  const now = Date.now();
  return Array.from({ length: 12 }, (_, i) => ({
    time: new Date(now - (11 - i) * 5000).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }),
    temperature: +(22.2 + Math.sin(i / 2) * 1.2 + Math.random() * 0.4).toFixed(
      1,
    ),
    humidity: Math.round(47 + Math.cos(i / 2) * 4 + Math.random() * 2),
    co2: Math.round(585 + Math.sin(i / 1.7) * 45 + Math.random() * 18),
    energy: +(62 + Math.cos(i / 2.2) * 6 + Math.random() * 2).toFixed(1),
  }));
}
const priorityRank: Record<Priority, number> = {
  Critical: 0,
  High: 1,
  Medium: 2,
  Low: 3,
};

async function fetchPrototypeState() {
  const response = await fetch("/api/prototype-state");
  if (!response.ok) throw new Error("Could not load saved application data.");
  return response.json() as Promise<{tickets: Ticket[]; equipment: Equipment[]; zones: ZoneControl[]; acknowledgedAlerts: string[]} | null>;
}

const zoneSeed: ZoneControl[] = [
  {
    id: "ZN-IC-L2",
    name: "Innovation Lab",
    building: "Innovation Centre · Level 2",
    occupancy: 34,
    capacity: 48,
    temperature: 23.1,
    setpoint: 22,
    mode: "Auto",
    lights: true,
    airQuality: "Fair",
  },
  {
    id: "ZN-ENG-L3",
    name: "Engineering Studios",
    building: "Engineering Block · Level 3",
    occupancy: 51,
    capacity: 72,
    temperature: 22.4,
    setpoint: 22,
    mode: "Eco",
    lights: true,
    airQuality: "Good",
  },
  {
    id: "ZN-LIB-G",
    name: "Library Reading Hall",
    building: "Library · Ground Floor",
    occupancy: 68,
    capacity: 110,
    temperature: 21.8,
    setpoint: 21,
    mode: "Auto",
    lights: true,
    airQuality: "Good",
  },
  {
    id: "ZN-STU-G",
    name: "Student Commons",
    building: "Student Centre · Ground Floor",
    occupancy: 19,
    capacity: 85,
    temperature: 24.2,
    setpoint: 23,
    mode: "Ventilation",
    lights: false,
    airQuality: "Fair",
  },
];

export default function Home() {
  const [view, setView] = useState<View>("overview"),
    [lang, setLang] = useState<"en" | "mm">("en"),
    [dark, setDark] = useState(false),
    [mobileNav, setMobileNav] = useState(false),
    [tickets, setTickets] = useState<Ticket[]>(ticketSeed),
    [equipment, setEquipment] = useState<Equipment[]>(equipmentSeed),
    [zones, setZones] = useState<ZoneControl[]>(zoneSeed),
    [acknowledgedAlerts, setAcknowledgedAlerts] = useState<string[]>([]),
    [sensorData, setSensorData] = useState<SensorPoint[]>(initialSensorData),
    [admin, setAdmin] = useState(false),
    [user, setUser] = useState<UserSession | null>(null),
    [hydrated, setHydrated] = useState(false),
    [loginOpen, setLoginOpen] = useState(false),
    [accountOpen, setAccountOpen] = useState(false),
    [search, setSearch] = useState("");
  const t = (en: string, mm: string) => (lang === "en" ? en : mm);
  useEffect(() => {
    let live = true;
    const load = async () => {
      try {
        const sessionResponse = await fetch("/api/auth/session");
        const { session } = await sessionResponse.json();
        if (!live || !session) { if (live) setHydrated(true); return; }
        setAdmin(session.role === "admin");
        setUser(session.role === "staff" ? { name: session.name, email: session.email } : null);
        const state = await fetchPrototypeState();
        if (live && state) {
          setTickets(state.tickets ?? ticketSeed);
          setEquipment(state.equipment ?? equipmentSeed);
          setZones(state.zones ?? zoneSeed);
          setAcknowledgedAlerts(state.acknowledgedAlerts ?? []);
        }
      } catch (error) { console.error(error); }
      finally { if (live) setHydrated(true); }
    };
    const savedTheme = localStorage.getItem("campusops_theme");
    const savedLanguage = localStorage.getItem("campusops_lang");
    queueMicrotask(() => {
      if (savedTheme === "dark") setDark(true);
      if (savedLanguage === "mm") setLang("mm");
    });
    void load();
    return () => { live = false; };
  }, []);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("campusops_theme", dark ? "dark" : "light");
  }, [dark]);
  useEffect(() => { localStorage.setItem("campusops_lang", lang); }, [lang]);
  useEffect(() => {
    if (!hydrated || (!user && !admin)) return;
    const timer = window.setTimeout(() => {
      void fetch("/api/prototype-state", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tickets, equipment, zones, acknowledgedAlerts }) })
        .then(async response => { if (!response.ok) throw new Error("Save failed"); })
        .catch(error => console.error("Saving CampusOps data failed", error));
    }, 350);
    return () => window.clearTimeout(timer);
  }, [hydrated, user, admin, tickets, equipment, zones, acknowledgedAlerts]);
  useEffect(() => {
    const timer = window.setInterval(
      () =>
        setSensorData((prev) => {
          const l = prev.at(-1)!;
          return [
            ...prev.slice(-19),
            {
              time: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              }),
              temperature: +Math.max(
                19,
                Math.min(29, l.temperature + (Math.random() - 0.47) * 0.5),
              ).toFixed(1),
              humidity: Math.round(
                Math.max(
                  35,
                  Math.min(68, l.humidity + (Math.random() - 0.5) * 3),
                ),
              ),
              co2: Math.round(
                Math.max(
                  430,
                  Math.min(1100, l.co2 + (Math.random() - 0.48) * 28),
                ),
              ),
              energy: +Math.max(
                45,
                Math.min(90, l.energy + (Math.random() - 0.5) * 4),
              ).toFixed(1),
            },
          ];
        }),
      5000,
    );
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    type ToolInput = {
      equipmentId: string;
      issue: string;
      location: string;
      reporter: string;
      priority: Priority;
    };
    type ModelContext = {
      registerTool: (
        tool: object,
        options?: { signal?: AbortSignal },
      ) => void | Promise<void>;
    };
    const context = (document as Document & { modelContext?: ModelContext })
      .modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    void Promise.resolve(
      context.registerTool(
        {
          name: "submit_maintenance_request",
          title: "Submit maintenance request",
          description:
            "Create a maintenance request in CampusOps using the same workflow as the visible request form.",
          inputSchema: {
            type: "object",
            properties: {
              equipmentId: { type: "string" },
              issue: { type: "string", minLength: 12 },
              location: { type: "string" },
              reporter: { type: "string" },
              priority: {
                type: "string",
                enum: ["Critical", "High", "Medium", "Low"],
              },
            },
            required: [
              "equipmentId",
              "issue",
              "location",
              "reporter",
              "priority",
            ],
            additionalProperties: false,
          },
          annotations: { readOnlyHint: false, untrustedContentHint: false },
          execute: (raw: unknown) => {
            const x = raw as ToolInput;
            const asset = equipment.find((e) => e.id === x.equipmentId);
            if (
              !asset ||
              !x.issue ||
              x.issue.length < 12 ||
              !x.location ||
              !x.reporter ||
              !priorityRank.hasOwnProperty(x.priority)
            )
              throw new Error("Invalid maintenance request");
            const ticket: Ticket = {
              id: `MT-${String(Date.now()).slice(-5)}`,
              equipment: asset.name,
              issue: x.issue,
              location: x.location,
              reporter: x.reporter,
              priority: x.priority,
              status: "Open",
              created: new Date().toLocaleString([], {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              }),
            };
            setTickets((prev) => [ticket, ...prev]);
            setView("maintenance");
            return { id: ticket.id, status: ticket.status };
          },
        },
        { signal: lifecycle.signal },
      ),
    ).catch(() => {});
    return () => lifecycle.abort();
  }, [equipment]);
  const activeAlerts = useMemo(
    () =>
      [
        ...equipment
          .filter((e) => e.status !== "Operational")
          .map((e) => ({
            id: `equipment-${e.id}`,
            title: e.name,
            detail:
              e.status === "Offline"
                ? "No heartbeat received"
                : "Performance outside target",
            severity: e.status === "Offline" ? "Critical" : "Warning",
            place: e.location,
          })),
        {
          id: "environment-co2-l2",
          title: "CO₂ elevated",
          detail: "Reading approaching threshold",
          severity: "Warning",
          place: "Innovation Lab · L2",
        },
        {
          id: "water-flow-student-centre",
          title: "Unusual water flow",
          detail: "Continuous flow detected outside normal pattern",
          severity: "Warning",
          place: "Student Centre · Service riser",
        },
      ].sort(
        (a, b) =>
          (a.severity === "Critical" ? -1 : 1) -
          (b.severity === "Critical" ? -1 : 1),
      ),
    [equipment],
  );
  const unacknowledgedAlerts = activeAlerts.filter(
    (alert) => !acknowledgedAlerts.includes(alert.id),
  );
  const nav = [
    {
      id: "overview" as View,
      icon: LayoutDashboard,
      label: t("Overview", "ခြုံငုံကြည့်ရန်"),
    },
    {
      id: "equipment" as View,
      icon: Gauge,
      label: t("Equipment", "စက်ပစ္စည်း"),
    },
    {
      id: "sensors" as View,
      icon: Activity,
      label: t("Environment", "ပတ်ဝန်းကျင်"),
    },
    {
      id: "operations" as View,
      icon: Building2,
      label: t("Building control", "အဆောက်အအုံ ထိန်းချုပ်မှု"),
    },
    {
      id: "maintenance" as View,
      icon: Wrench,
      label: t("Maintenance", "ပြုပြင်ထိန်းသိမ်းမှု"),
    },
  ];
  const openAdmin = () => {
    if (admin) setView("admin");
    else setLoginOpen(true);
    setMobileNav(false);
  };
  const logout = () => {
    void fetch("/api/auth/logout", { method: "POST" });
    setAdmin(false);
    setView("overview");
    toast.success(t("Administrator signed out", "စီမံခန့်ခွဲသူ ထွက်ပြီးပါပြီ"));
  };
  const userLogout = () => {
    void fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setAccountOpen(false);
    setView("overview");
    toast.success(t("You have signed out", "အကောင့်မှ ထွက်ပြီးပါပြီ"));
  };
  const startUserSession = async (session: UserSession) => {
    try {
      const state = await fetchPrototypeState();
      if (state) { setTickets(state.tickets); setEquipment(state.equipment); setZones(state.zones); setAcknowledgedAlerts(state.acknowledgedAlerts); }
      setAdmin(false); setUser(session); setView("overview");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not load application data."); }
  };
  const startAdminSession = async () => {
    try {
      const state = await fetchPrototypeState();
      if (state) { setTickets(state.tickets); setEquipment(state.equipment); setZones(state.zones); setAcknowledgedAlerts(state.acknowledgedAlerts); }
      setUser(null); setAdmin(true); setView("admin");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not load application data."); }
  };
  if (!hydrated)
    return (
      <div className="auth-loading">
        <Building2 />
        <span>CampusOps</span>
      </div>
    );
  if (!user && !admin)
    return (
      <>
        <UserAuthScreen
          t={t}
          onSuccess={startUserSession}
          onAdmin={() => setLoginOpen(true)}
        />
        <LoginDialog
          open={loginOpen}
          setOpen={setLoginOpen}
          t={t}
          onSuccess={startAdminSession}
        />
        <Toaster richColors position="top-right" />
      </>
    );
  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNav ? "is-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark">
            <Building2 size={21} />
          </div>
          <div>
            <strong>
              Campus<span>Ops</span>
            </strong>
            <small>{t("SMART FACILITIES", "စမတ် အဆောက်အအုံ")}</small>
          </div>
        </div>
        <button
          className="close-nav"
          onClick={() => setMobileNav(false)}
          aria-label="Close navigation"
        >
          <X />
        </button>
        <nav aria-label="Primary navigation">
          <p className="nav-label">{t("MONITOR", "စောင့်ကြည့်ရန်")}</p>
          {nav.map((item) => (
            <button
              key={item.id}
              className={view === item.id ? "active" : ""}
              onClick={() => {
                setView(item.id);
                setMobileNav(false);
              }}
            >
              <item.icon size={19} />
              <span>{item.label}</span>
              {item.id === "overview" && unacknowledgedAlerts.length > 0 && (
                <b>{unacknowledgedAlerts.length}</b>
              )}
            </button>
          ))}
          <p className="nav-label">{t("CONTROL", "ထိန်းချုပ်ရန်")}</p>
          <button
            className={view === "admin" ? "active" : ""}
            onClick={openAdmin}
          >
            <ShieldCheck size={19} />
            <span>{t("Administration", "စီမံခန့်ခွဲမှု")}</span>
            <LockKeyhole size={14} className="nav-lock" />
          </button>
        </nav>
        <div className="site-status">
          <span className="pulse-dot" />
          <div>
            <strong>{t("Systems connected", "စနစ်များ ချိတ်ဆက်ထားသည်")}</strong>
            <small>{t("Last sync just now", "ယခုလေးတင် ချိတ်ဆက်ပြီး")}</small>
          </div>
        </div>
      </aside>
      {mobileNav && (
        <button
          className="nav-scrim"
          onClick={() => setMobileNav(false)}
          aria-label="Close navigation"
        />
      )}
      <main className="main-area">
        <header className="topbar">
          <button
            className="menu-button"
            onClick={() => setMobileNav(true)}
            aria-label="Open navigation"
          >
            <Menu />
          </button>
          <div className="crumb">
            <span>{t("Campus Operations", "ကျောင်းဝင်း လုပ်ငန်းများ")}</span>
            <ChevronRight size={15} />
            <strong>
              {nav.find((n) => n.id === view)?.label ??
                t("Administration", "စီမံခန့်ခွဲမှု")}
            </strong>
          </div>
          <div className="top-actions">
            <label className="language-control">
              <Languages size={17} />
              <span>{lang === "en" ? "EN" : "မြန်မာ"}</span>
              <Switch
                checked={lang === "mm"}
                onCheckedChange={(v) => setLang(v ? "mm" : "en")}
                aria-label="Toggle English and Burmese"
              />
            </label>
            <button
              className="icon-button"
              onClick={() => setDark(!dark)}
              aria-label="Toggle theme"
            >
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              className="icon-button alert-bell"
              onClick={() => setView("overview")}
              aria-label="View alerts"
            >
              <Bell size={18} />
              {unacknowledgedAlerts.length > 0 && <i />}
            </button>
            <button
              className="profile-button"
              onClick={() => (admin ? openAdmin() : setAccountOpen(true))}
            >
              <span className="avatar">
                {admin
                  ? "AD"
                  : user?.name
                      .split(" ")
                      .map((x) => x[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase() || <CircleUserRound size={20} />}
              </span>
              <span>
                <strong>
                  {admin ? t("Administrator", "စီမံခန့်ခွဲသူ") : user?.name}
                </strong>
                <small>
                  {admin
                    ? t("Facilities team", "အဆောက်အအုံအဖွဲ့")
                    : user?.email}
                </small>
              </span>
            </button>
          </div>
        </header>
        <div className="content">
          {view === "overview" && (
            <Overview
              t={t}
              equipment={equipment}
              tickets={tickets}
              sensorData={sensorData}
              alerts={unacknowledgedAlerts}
              onAcknowledge={(id) =>
                setAcknowledgedAlerts((previous) => [...previous, id])
              }
              onNavigate={setView}
            />
          )}{" "}
          {view === "equipment" && (
            <EquipmentView
              t={t}
              lang={lang}
              equipment={equipment}
              search={search}
              setSearch={setSearch}
            />
          )}{" "}
          {view === "sensors" && <SensorsView t={t} sensorData={sensorData} />}{" "}
          {view === "operations" && (
            <OperationsView
              t={t}
              zones={zones}
              setZones={setZones}
              sensorData={sensorData}
              alerts={activeAlerts}
              acknowledgedAlerts={acknowledgedAlerts}
              onAcknowledge={(id) =>
                setAcknowledgedAlerts((previous) => [...previous, id])
              }
            />
          )}{" "}
          {view === "maintenance" && (
            <MaintenanceView
              t={t}
              tickets={tickets}
              equipment={equipment}
              setTickets={setTickets}
            />
          )}{" "}
          {view === "admin" && admin && (
            <AdminView
              t={t}
              tickets={tickets}
              setTickets={setTickets}
              equipment={equipment}
              setEquipment={setEquipment}
              logout={logout}
            />
          )}
        </div>
      </main>
      <LoginDialog
        open={loginOpen}
        setOpen={setLoginOpen}
        t={t}
        onSuccess={startAdminSession}
      />
      <UserAccountDialog
        open={accountOpen}
        setOpen={setAccountOpen}
        user={user}
        t={t}
        onLogout={userLogout}
      />
      <Toaster richColors position="top-right" />
    </div>
  );
}

function PageHead({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="page-head">
      <div>
        <p>{eyebrow}</p>
        <h1>{title}</h1>
        <span>{description}</span>
      </div>
      {action}
    </div>
  );
}
function StatusPill({ status }: { status: string }) {
  return (
    <span
      className={`status-pill ${status.toLowerCase().replaceAll(" ", "-")}`}
    >
      <i />
      {status}
    </span>
  );
}
function Metric({
  icon,
  label,
  value,
  note,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  note: string;
  tone: string;
}) {
  return (
    <div className="metric">
      <span className={`metric-icon ${tone}`}>{icon}</span>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        <small>{note}</small>
      </div>
    </div>
  );
}
function PanelTitle({
  title,
  subtitle,
  live = true,
}: {
  title: string;
  subtitle: string;
  live?: boolean;
}) {
  return (
    <div className="panel-title">
      <div>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
      {live && (
        <span className="live-chip">
          <i />
          LIVE
        </span>
      )}
    </div>
  );
}
function TelemetryChart({
  data,
  dataKey,
  color,
  unit,
}: {
  data: SensorPoint[];
  dataKey: keyof SensorPoint;
  color: string;
  unit: string;
}) {
  return (
    <div className="chart-wrap">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 8, right: 4, left: -22, bottom: 0 }}
        >
          <defs>
            <linearGradient
              id={`fill-${String(dataKey)}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" stopColor={color} stopOpacity={0.28} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 5"
            vertical={false}
            stroke="var(--line)"
          />
          <XAxis dataKey="time" tick={false} axisLine={false} />
          <YAxis
            tick={{ fontSize: 11, fill: "var(--muted-text)" }}
            axisLine={false}
            tickLine={false}
          />
          <ChartTooltip
            contentStyle={{
              background: "var(--panel)",
              border: "1px solid var(--line)",
              borderRadius: 10,
              fontSize: 12,
            }}
            formatter={(v) => [`${v}${unit}`, String(dataKey)]}
          />
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2.5}
            fill={`url(#fill-${String(dataKey)})`}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function Overview({
  t,
  equipment,
  tickets,
  sensorData,
  alerts,
  onAcknowledge,
  onNavigate,
}: {
  t: (a: string, b: string) => string;
  equipment: Equipment[];
  tickets: Ticket[];
  sensorData: SensorPoint[];
  alerts: {
    id: string;
    title: string;
    detail: string;
    severity: string;
    place: string;
  }[];
  onAcknowledge: (id: string) => void;
  onNavigate: (v: View) => void;
}) {
  const c = sensorData.at(-1)!,
    operational = equipment.filter((e) => e.status === "Operational").length;
  return (
    <>
      <PageHead
        eyebrow={t("LIVE OPERATIONS", "တိုက်ရိုက်လုပ်ငန်းများ")}
        title={t(
          "Good evening, Facilities Team",
          "မင်္ဂလာညနေခင်းပါ၊ အဆောက်အအုံအဖွဲ့",
        )}
        description={t(
          "Here is the current state of campus buildings and maintenance activity.",
          "ကျောင်းဝင်းအဆောက်အအုံများနှင့် ပြုပြင်ထိန်းသိမ်းမှု၏ လက်ရှိအခြေအနေကို ကြည့်ရှုပါ။",
        )}
        action={
          <button
            className="primary-button"
            onClick={() => onNavigate("maintenance")}
          >
            <Plus size={17} />
            {t("New maintenance request", "ပြုပြင်ရန် တောင်းဆိုချက်အသစ်")}
          </button>
        }
      />
      <section className="stat-grid">
        <Metric
          icon={<Gauge />}
          label={t("Equipment online", "အသုံးပြုနိုင်သော စက်ပစ္စည်း")}
          value={`${operational}/${equipment.length}`}
          note={t("Across 5 buildings", "အဆောက်အအုံ ၅ ခုအတွင်း")}
          tone="blue"
        />
        <Metric
          icon={<AlertTriangle />}
          label={t("Active alerts", "လက်ရှိသတိပေးချက်")}
          value={String(alerts.length)}
          note={t(
            "1 requires immediate action",
            "၁ ခု ချက်ချင်းလုပ်ဆောင်ရန်လိုသည်",
          )}
          tone="red"
        />
        <Metric
          icon={<ClipboardList />}
          label={t("Open tickets", "ဖွင့်ထားသော လက်မှတ်များ")}
          value={String(tickets.filter((x) => x.status !== "Resolved").length)}
          note={t("1 currently in progress", "၁ ခု ဆောင်ရွက်နေသည်")}
          tone="amber"
        />
        <Metric
          icon={<Zap />}
          label={t("Energy demand", "စွမ်းအင်သုံးစွဲမှု")}
          value={`${c.energy} kW`}
          note={t(
            "6.2% below daily average",
            "နေ့စဉ်ပျမ်းမျှထက် ၆.၂% လျော့နည်း",
          )}
          tone="cyan"
        />
      </section>
      <section className="dashboard-grid">
        <div className="panel chart-panel">
          <PanelTitle
            title={t("Environmental pulse", "ပတ်ဝန်းကျင် အခြေအနေ")}
            subtitle={t(
              "Innovation Centre · updates every 5 seconds",
              "တီထွင်ဆန်းသစ်မှုစင်တာ · ၅ စက္ကန့်တိုင်း အပ်ဒိတ်",
            )}
          />
          <div className="mini-readings">
            <b>
              {c.temperature}°C <small>{t("Temperature", "အပူချိန်")}</small>
            </b>
            <b>
              {c.humidity}% <small>{t("Humidity", "စိုထိုင်းဆ")}</small>
            </b>
            <b>
              {c.co2} ppm <small>CO₂</small>
            </b>
          </div>
          <TelemetryChart
            data={sensorData}
            dataKey="temperature"
            color="#2563eb"
            unit="°C"
          />
        </div>
        <div className="panel alerts-panel">
          <PanelTitle
            title={t("Priority alerts", "ဦးစားပေး သတိပေးချက်များ")}
            subtitle={t(
              "Sorted by operational impact",
              "လုပ်ငန်းသက်ရောက်မှုအလိုက် စီထားသည်",
            )}
            live={false}
          />
          <div className="alert-list">
            {alerts.map((a) => (
              <div className="alert-row" key={a.id}>
                <span
                  className={
                    a.severity === "Critical"
                      ? "alert-icon critical"
                      : "alert-icon warning"
                  }
                >
                  <AlertTriangle size={18} />
                </span>
                <div>
                  <strong>{a.title}</strong>
                  <small>
                    {a.detail} · {a.place}
                  </small>
                </div>
                <span className={`severity ${a.severity.toLowerCase()}`}>
                  {a.severity}
                </span>
                <button
                  className="acknowledge-button"
                  onClick={() => onAcknowledge(a.id)}
                >
                  {t("Acknowledge", "အသိအမှတ်ပြုရန်")}
                </button>
              </div>
            ))}
            {alerts.length === 0 && (
              <div className="all-clear-state">
                <ShieldCheck />
                <div>
                  <strong>{t("All alerts acknowledged", "သတိပေးချက်အားလုံး အသိအမှတ်ပြုပြီး")}</strong>
                  <small>{t("No unreviewed operational alerts remain.", "မစစ်ဆေးရသေးသော လုပ်ငန်းသတိပေးချက် မရှိပါ။")}</small>
                </div>
              </div>
            )}
          </div>
          <button
            className="panel-link"
            onClick={() => onNavigate("equipment")}
          >
            {t("View all equipment", "စက်ပစ္စည်းအားလုံးကြည့်ရန်")}
            <ChevronRight size={16} />
          </button>
        </div>
        <div className="panel wide-panel">
          <PanelTitle
            title={t("Recent maintenance", "လတ်တလော ပြုပြင်ထိန်းသိမ်းမှု")}
            subtitle={t(
              "Latest requests across campus",
              "ကျောင်းဝင်းအတွင်း နောက်ဆုံးတောင်းဆိုချက်များ",
            )}
            live={false}
          />
          <TicketTable tickets={tickets.slice(0, 4)} compact />
          <button
            className="panel-link"
            onClick={() => onNavigate("maintenance")}
          >
            {t("Open maintenance history", "ပြုပြင်မှတ်တမ်းဖွင့်ရန်")}
            <ChevronRight size={16} />
          </button>
        </div>
      </section>
    </>
  );
}

function EquipmentView({
  t,
  lang,
  equipment,
  search,
  setSearch,
}: {
  t: (a: string, b: string) => string;
  lang: "en" | "mm";
  equipment: Equipment[];
  search: string;
  setSearch: (s: string) => void;
}) {
  const f = equipment.filter((e) =>
    `${e.name} ${e.id} ${e.building} ${e.category}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  return (
    <>
      <PageHead
        eyebrow={t("ASSET MONITORING", "ပိုင်ဆိုင်မှု စောင့်ကြည့်ခြင်း")}
        title={t("Equipment status", "စက်ပစ္စည်းအခြေအနေ")}
        description={t(
          "Monitor the availability and last-known condition of campus equipment.",
          "ကျောင်းဝင်းရှိ စက်ပစ္စည်းများ၏ အသုံးပြုနိုင်မှုနှင့် နောက်ဆုံးအခြေအနေကို စောင့်ကြည့်ပါ။",
        )}
      />
      <div className="toolbar">
        <label className="search-box">
          <Search size={17} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t(
              "Search equipment, ID or building…",
              "စက်ပစ္စည်း၊ ID သို့မဟုတ် အဆောက်အအုံ ရှာရန်…",
            )}
          />
        </label>
        <span>
          {f.length} {t("assets shown", "ခု ပြထားသည်")}
        </span>
      </div>
      <div className="equipment-grid">
        {f.map((e) => (
          <article className="equipment-card" key={e.id}>
            <div className="equipment-top">
              <span className="asset-icon">
                <Settings2 />
              </span>
              <StatusPill status={e.status} />
            </div>
            <small>
              {e.id} · {e.category}
            </small>
            <h2>{lang === "mm" ? e.mm : e.name}</h2>
            <p>
              <Building2 size={15} />
              {e.building}
            </p>
            <p>
              <Gauge size={15} />
              {e.location}
            </p>
            <footer>
              <Clock3 size={14} />
              {t("Updated", "အပ်ဒိတ်")} {e.updated}
            </footer>
          </article>
        ))}
      </div>
    </>
  );
}

function SensorsView({
  t,
  sensorData,
}: {
  t: (a: string, b: string) => string;
  sensorData: SensorPoint[];
}) {
  const c = sensorData.at(-1)!;
  const cards = [
    {
      key: "temperature" as const,
      label: t("Temperature", "အပူချိန်"),
      value: `${c.temperature}°C`,
      range: "Target 20–24°C",
      color: "#2563eb",
      icon: <Thermometer />,
    },
    {
      key: "humidity" as const,
      label: t("Humidity", "စိုထိုင်းဆ"),
      value: `${c.humidity}%`,
      range: "Target 40–60%",
      color: "#06b6d4",
      icon: <Activity />,
    },
    {
      key: "co2" as const,
      label: "CO₂",
      value: `${c.co2} ppm`,
      range: "Target < 800 ppm",
      color: "#8b5cf6",
      icon: <Gauge />,
    },
    {
      key: "energy" as const,
      label: t("Energy demand", "စွမ်းအင်သုံးစွဲမှု"),
      value: `${c.energy} kW`,
      range: "Daily baseline 66 kW",
      color: "#f59e0b",
      icon: <Zap />,
    },
  ];
  return (
    <>
      <PageHead
        eyebrow={t("LIVE SENSOR FEED", "တိုက်ရိုက်အာရုံခံ ဒေတာ")}
        title={t("Environmental monitoring", "ပတ်ဝန်းကျင် စောင့်ကြည့်ခြင်း")}
        description={t(
          "Live simulated readings from the Innovation Centre refresh every five seconds.",
          "တီထွင်ဆန်းသစ်မှုစင်တာမှ ဒေတာများကို ငါးစက္ကန့်တိုင်း အသစ်ပြသသည်။",
        )}
      />
      <div className="sensor-banner">
        <span className="pulse-dot" />
        <strong>
          {t("Live feed connected", "တိုက်ရိုက်ဒေတာ ချိတ်ဆက်ထားသည်")}
        </strong>
        <p>
          {t(
            "Next reading arrives automatically",
            "နောက်ဖတ်ရှုချက် အလိုအလျောက် ရောက်ရှိမည်",
          )}
        </p>
        <time>{sensorData.at(-1)?.time}</time>
      </div>
      <div className="sensor-grid">
        {cards.map((x) => (
          <article className="panel sensor-card" key={x.key}>
            <div className="sensor-value">
              <span style={{ color: x.color }}>{x.icon}</span>
              <div>
                <p>{x.label}</p>
                <strong>{x.value}</strong>
                <small>{x.range}</small>
              </div>
              <StatusPill status="Normal" />
            </div>
            <TelemetryChart
              data={sensorData}
              dataKey={x.key}
              color={x.color}
              unit={
                x.key === "temperature"
                  ? "°C"
                  : x.key === "humidity"
                    ? "%"
                    : x.key === "co2"
                      ? " ppm"
                      : " kW"
              }
            />
          </article>
        ))}
      </div>
    </>
  );
}

function OperationsView({
  t,
  zones,
  setZones,
  sensorData,
  alerts,
  acknowledgedAlerts,
  onAcknowledge,
}: {
  t: (a: string, b: string) => string;
  zones: ZoneControl[];
  setZones: React.Dispatch<React.SetStateAction<ZoneControl[]>>;
  sensorData: SensorPoint[];
  alerts: {
    id: string;
    title: string;
    detail: string;
    severity: string;
    place: string;
  }[];
  acknowledgedAlerts: string[];
  onAcknowledge: (id: string) => void;
}) {
  const current = sensorData.at(-1)!;
  const occupied = zones.reduce((total, zone) => total + zone.occupancy, 0);
  const capacity = zones.reduce((total, zone) => total + zone.capacity, 0);
  const litZones = zones.filter((zone) => zone.lights).length;
  const updateZone = (id: string, update: Partial<ZoneControl>) => {
    setZones((previous) =>
      previous.map((zone) => (zone.id === id ? { ...zone, ...update } : zone)),
    );
  };
  const notifyControlChange = () =>
    toast.success(t("Zone controls updated", "ဇုန်ထိန်းချုပ်မှု ပြင်ပြီးပါပြီ"));

  return (
    <>
      <PageHead
        eyebrow={t("BUILDING COMMAND", "အဆောက်အအုံ ကွပ်ကဲမှု")}
        title={t("Building operations", "အဆောက်အအုံ လုပ်ငန်းများ")}
        description={t(
          "Monitor occupancy, utilities and alarms while controlling HVAC and lighting by zone.",
          "လူဦးရေ၊ အသုံးအဆောင်နှင့် သတိပေးချက်များကို စောင့်ကြည့်ကာ ဇုန်အလိုက် HVAC နှင့် မီးအလင်းရောင်ကို ထိန်းချုပ်ပါ။",
        )}
      />
      <section className="stat-grid operations-stat-grid">
        <Metric
          icon={<Users />}
          label={t("Live occupancy", "လက်ရှိ လူဦးရေ")}
          value={`${occupied}/${capacity}`}
          note={t("Across four monitored zones", "စောင့်ကြည့်ဇုန် လေးခုအတွင်း")}
          tone="gold"
        />
        <Metric
          icon={<Zap />}
          label={t("Electrical demand", "လျှပ်စစ်သုံးစွဲမှု")}
          value={`${current.energy} kW`}
          note={t("14.8 kW supplied by solar", "14.8 kW ကို နေရောင်ခြည်မှ ဖြည့်တင်း")}
          tone="blue"
        />
        <Metric
          icon={<Droplets />}
          label={t("Water consumption", "ရေသုံးစွဲမှု")}
          value="2.8 m³/h"
          note={t("4% above normal baseline", "ပုံမှန်အခြေခံထက် ၄% ပိုများ")}
          tone="cyan"
        />
        <Metric
          icon={<Lightbulb />}
          label={t("Lighting active", "မီးအလင်းရောင် ဖွင့်ထား")}
          value={`${litZones}/${zones.length}`}
          note={t("Zone schedules are enabled", "ဇုန်အချိန်ဇယားများ အသုံးပြုနေသည်")}
          tone="amber"
        />
        <Metric
          icon={<DoorClosed />}
          label={t("Access doors", "ဝင်ပေါက်တံခါးများ")}
          value="12/12"
          note={t("Secure · fire panel normal", "လုံခြုံ · မီးဘေးစနစ် ပုံမှန်")}
          tone="blue"
        />
      </section>

      <section className="operations-layout">
        <div className="panel zone-control-panel">
          <PanelTitle
            title={t("Zone control", "ဇုန်ထိန်းချုပ်မှု")}
            subtitle={t(
              "Adjust comfort settings and lighting",
              "သက်တောင့်သက်သာ အပြင်အဆင်နှင့် မီးကို ပြင်ဆင်ရန်",
            )}
            live={false}
          />
          <div className="zone-grid">
            {zones.map((zone) => {
              const occupancyRate = Math.round(
                (zone.occupancy / zone.capacity) * 100,
              );
              return (
                <article className="zone-card" key={zone.id}>
                  <header>
                    <div>
                      <small>{zone.id}</small>
                      <h3>{zone.name}</h3>
                      <p>{zone.building}</p>
                    </div>
                    <span className={`air-quality ${zone.airQuality.toLowerCase()}`}>
                      {t("Air", "လေထု")} · {zone.airQuality}
                    </span>
                  </header>
                  <div className="zone-readings">
                    <div>
                      <Thermometer />
                      <span>
                        <small>{t("Current", "လက်ရှိ")}</small>
                        <b>{zone.temperature}°C</b>
                      </span>
                    </div>
                    <div>
                      <Users />
                      <span>
                        <small>{t("Occupancy", "လူဦးရေ")}</small>
                        <b>{zone.occupancy}/{zone.capacity}</b>
                      </span>
                    </div>
                  </div>
                  <div className="occupancy-track" aria-label={`${occupancyRate}% occupied`}>
                    <span style={{ width: `${occupancyRate}%` }} />
                  </div>
                  <div className="zone-controls">
                    <div className="setpoint-control">
                      <span>{t("Setpoint", "သတ်မှတ်အပူချိန်")}</span>
                      <div>
                        <button
                          aria-label="Lower temperature setpoint"
                          onClick={() => {
                            updateZone(zone.id, {
                              setpoint: Math.max(18, zone.setpoint - 1),
                            });
                            notifyControlChange();
                          }}
                        >
                          −
                        </button>
                        <b>{zone.setpoint}°</b>
                        <button
                          aria-label="Raise temperature setpoint"
                          onClick={() => {
                            updateZone(zone.id, {
                              setpoint: Math.min(27, zone.setpoint + 1),
                            });
                            notifyControlChange();
                          }}
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <label className="lighting-control">
                      <span>
                        <Lightbulb /> {t("Lights", "မီး")}
                      </span>
                      <Switch
                        checked={zone.lights}
                        onCheckedChange={(checked) => {
                          updateZone(zone.id, { lights: checked });
                          notifyControlChange();
                        }}
                      />
                    </label>
                    <Select
                      value={zone.mode}
                      onValueChange={(value) => {
                        updateZone(zone.id, { mode: value as ZoneMode });
                        notifyControlChange();
                      }}
                    >
                      <SelectTrigger className="zone-mode-select">
                        <Fan size={15} />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Auto">Auto</SelectItem>
                        <SelectItem value="Eco">Eco</SelectItem>
                        <SelectItem value="Ventilation">Ventilation</SelectItem>
                        <SelectItem value="Off">Off</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        <div className="operations-side-stack">
          <div className="panel resource-panel">
            <PanelTitle
              title={t("Energy profile", "စွမ်းအင် ပရိုဖိုင်")}
              subtitle={t("Live portfolio demand", "တိုက်ရိုက် စုစုပေါင်းသုံးစွဲမှု")}
            />
            <TelemetryChart
              data={sensorData}
              dataKey="energy"
              color="#c69b3c"
              unit=" kW"
            />
            <div className="resource-summary">
              <div><span>{t("Today", "ယနေ့")}</span><b>612 kWh</b></div>
              <div><span>{t("Solar share", "နေရောင်ခြည် ဝေစု")}</span><b>22%</b></div>
              <div><span>{t("Peak", "အမြင့်ဆုံး")}</span><b>79.4 kW</b></div>
            </div>
          </div>

          <div className="panel alarm-centre">
            <PanelTitle
              title={t("Alarm centre", "သတိပေးချက် ဗဟို")}
              subtitle={t("Review and acknowledge events", "ဖြစ်ရပ်များကို စစ်ဆေးအသိအမှတ်ပြုရန်")}
              live={false}
            />
            <div className="alarm-centre-list">
              {alerts.map((alert) => {
                const acknowledged = acknowledgedAlerts.includes(alert.id);
                return (
                  <article key={alert.id} className={acknowledged ? "acknowledged" : ""}>
                    <span className={`alarm-dot ${alert.severity.toLowerCase()}`} />
                    <div>
                      <strong>{alert.title}</strong>
                      <small>{alert.place} · {alert.detail}</small>
                    </div>
                    <button
                      disabled={acknowledged}
                      onClick={() => onAcknowledge(alert.id)}
                    >
                      {acknowledged
                        ? t("Reviewed", "စစ်ဆေးပြီး")
                        : t("Acknowledge", "အသိအမှတ်ပြု")}
                    </button>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function MaintenanceView({
  t,
  tickets,
  equipment,
  setTickets,
}: {
  t: (a: string, b: string) => string;
  tickets: Ticket[];
  equipment: Equipment[];
  setTickets: React.Dispatch<React.SetStateAction<Ticket[]>>;
}) {
  const [formOpen, setFormOpen] = useState(false),
    [statusFilter, setStatusFilter] = useState("All");
  const visible = tickets
    .filter((x) => statusFilter === "All" || x.status === statusFilter)
    .sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority]);
  return (
    <>
      <PageHead
        eyebrow={t("MAINTENANCE WORKFLOW", "ပြုပြင်ထိန်းသိမ်းမှု လုပ်ငန်းစဉ်")}
        title={t("Requests & history", "တောင်းဆိုချက်များနှင့် မှတ်တမ်း")}
        description={t(
          "Submit an equipment issue and track every request through resolution.",
          "စက်ပစ္စည်းပြဿနာတင်ပြပြီး ဖြေရှင်းပြီးသည်အထိ တောင်းဆိုချက်တိုင်းကို စောင့်ကြည့်ပါ။",
        )}
        action={
          <button className="primary-button" onClick={() => setFormOpen(true)}>
            <Plus size={17} />
            {t("Submit request", "တောင်းဆိုချက်တင်ရန်")}
          </button>
        }
      />
      <div className="panel table-panel">
        <div className="table-controls">
          <div>
            <h2>{t("Maintenance records", "ပြုပြင်ထိန်းသိမ်းမှု မှတ်တမ်း")}</h2>
            <p>
              {tickets.length}{" "}
              {t(
                "requests stored on this device",
                "ခုကို ဤစက်တွင် သိမ်းထားသည်",
              )}
            </p>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="filter-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">
                {t("All statuses", "အခြေအနေအားလုံး")}
              </SelectItem>
              <SelectItem value="Open">Open</SelectItem>
              <SelectItem value="In progress">In progress</SelectItem>
              <SelectItem value="Resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <TicketTable tickets={visible} />
      </div>
      <RequestDialog
        open={formOpen}
        setOpen={setFormOpen}
        t={t}
        equipment={equipment}
        onSubmit={(ticket) => {
          setTickets((prev) => [ticket, ...prev]);
          setFormOpen(false);
          toast.success(
            t(
              "Maintenance request submitted",
              "ပြုပြင်ရန် တောင်းဆိုချက် တင်ပြီးပါပြီ",
            ),
            { description: ticket.id },
          );
        }}
      />
    </>
  );
}

function TicketTable({
  tickets,
  compact = false,
}: {
  tickets: Ticket[];
  compact?: boolean;
}) {
  return (
    <div className="table-scroll">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Request</TableHead>
            <TableHead>Equipment / issue</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Status</TableHead>
            {!compact && <TableHead>Created</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {tickets.map((x) => (
            <TableRow key={x.id}>
              <TableCell>
                <strong className="ticket-id">{x.id}</strong>
                <small className="mobile-meta">{x.created}</small>
              </TableCell>
              <TableCell>
                <strong>{x.equipment}</strong>
                <small>{x.issue}</small>
              </TableCell>
              <TableCell>
                <span className={`priority ${x.priority.toLowerCase()}`}>
                  {x.priority}
                </span>
              </TableCell>
              <TableCell>
                <StatusPill status={x.status} />
              </TableCell>
              {!compact && <TableCell>{x.created}</TableCell>}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function RequestDialog({
  open,
  setOpen,
  t,
  equipment,
  onSubmit,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  t: (a: string, b: string) => string;
  equipment: Equipment[];
  onSubmit: (x: Ticket) => void;
}) {
  const [asset, setAsset] = useState(""),
    [priority, setPriority] = useState<Priority>("Medium"),
    [captchaOk, setCaptchaOk] = useState(false);
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if (!captchaOk) {
      toast.error(
        t("Complete the security check", "လုံခြုံရေးစစ်ဆေးမှုကို ပြီးမြောက်ပါ"),
      );
      return;
    }
    if (!asset) {
      toast.error(
        t("Choose affected equipment", "သက်ဆိုင်သော စက်ပစ္စည်းရွေးပါ"),
      );
      return;
    }
    onSubmit({
      id: `MT-${String(Date.now()).slice(-5)}`,
      equipment: equipment.find((x) => x.id === asset)?.name ?? asset,
      issue: String(fd.get("issue")),
      location: String(fd.get("location")),
      reporter: String(fd.get("reporter")),
      priority,
      status: "Open",
      created: new Date().toLocaleString([], {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    });
    e.currentTarget.reset();
    setAsset("");
    setPriority("Medium");
    setCaptchaOk(false);
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="request-dialog">
        <DialogHeader>
          <DialogTitle>
            {t(
              "Submit maintenance request",
              "ပြုပြင်ထိန်းသိမ်းမှု တောင်းဆိုချက်တင်ရန်",
            )}
          </DialogTitle>
          <DialogDescription>
            {t(
              "Provide enough detail for the facilities team to assess and prioritise the issue.",
              "အဆောက်အအုံအဖွဲ့မှ ပြဿနာကို စစ်ဆေးဦးစားပေးနိုင်ရန် အသေးစိတ်ဖော်ပြပါ။",
            )}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="request-form">
          <label>
            <span>{t("Affected equipment", "သက်ဆိုင်သော စက်ပစ္စည်း")} *</span>
            <Select value={asset} onValueChange={setAsset}>
              <SelectTrigger>
                <SelectValue
                  placeholder={t("Select equipment", "စက်ပစ္စည်းရွေးပါ")}
                />
              </SelectTrigger>
              <SelectContent>
                {equipment.map((x) => (
                  <SelectItem key={x.id} value={x.id}>
                    {x.id} — {x.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
          <label>
            <span>{t("Issue description", "ပြဿနာဖော်ပြချက်")} *</span>
            <textarea
              required
              minLength={12}
              name="issue"
              placeholder={t(
                "Describe what happened and when it started…",
                "ဖြစ်ပွားပုံနှင့် စတင်ချိန်ကို ဖော်ပြပါ…",
              )}
            />
          </label>
          <div className="form-row">
            <label>
              <span>{t("Location", "တည်နေရာ")} *</span>
              <input
                required
                name="location"
                placeholder="Building · floor · room"
              />
            </label>
            <label>
              <span>{t("Your name", "သင့်အမည်")} *</span>
              <input required name="reporter" placeholder="Full name" />
            </label>
          </div>
          <label>
            <span>{t("Priority", "ဦးစားပေးအဆင့်")} *</span>
            <Select
              value={priority}
              onValueChange={(v) => setPriority(v as Priority)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(["Critical", "High", "Medium", "Low"] as Priority[]).map(
                  (x) => (
                    <SelectItem value={x} key={x}>
                      {x}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </label>
          <CaptchaChallenge t={t} onChange={setCaptchaOk} />
          <div className="form-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={() => setOpen(false)}
            >
              {t("Cancel", "ပယ်ဖျက်ရန်")}
            </button>
            <button className="primary-button" type="submit">
              {t("Submit request", "တောင်းဆိုချက်တင်ရန်")}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CaptchaChallenge({
  t,
  onChange,
}: {
  t: (a: string, b: string) => string;
  onChange: (ok: boolean) => void;
}) {
  const make = () => ({
    a: Math.floor(Math.random() * 8) + 2,
    b: Math.floor(Math.random() * 7) + 1,
  });
  const [challenge, setChallenge] = useState(make),
    [answer, setAnswer] = useState(""),
    [verified, setVerified] = useState(false);
  function refresh() {
    setChallenge(make());
    setAnswer("");
    setVerified(false);
    onChange(false);
  }
  function verify() {
    const ok = Number(answer) === challenge.a + challenge.b;
    setVerified(ok);
    onChange(ok);
    if (!ok)
      toast.error(t("Security answer is incorrect", "လုံခြုံရေးအဖြေ မမှန်ပါ"));
  }
  return (
    <div
      className={`captcha-box ${verified ? "verified" : ""}`}
      aria-label={t("Security check", "လုံခြုံရေးစစ်ဆေးမှု")}
    >
      <div>
        <ShieldCheck size={18} />
        <span>
          <strong>{t("Security check", "လုံခြုံရေးစစ်ဆေးမှု")}</strong>
          <small>
            {verified
              ? t(
                  "Verified — you may continue",
                  "အတည်ပြုပြီး — ဆက်လုပ်နိုင်ပါပြီ",
                )
              : t(
                  `What is ${challenge.a} + ${challenge.b}?`,
                  `${challenge.a} + ${challenge.b} သည် မည်မျှနည်း။`,
                )}
          </small>
        </span>
      </div>
      {!verified && (
        <div className="captcha-controls">
          <input
            aria-label={t("CAPTCHA answer", "CAPTCHA အဖြေ")}
            inputMode="numeric"
            value={answer}
            onChange={(e) => {
              setAnswer(e.target.value.replace(/\D/g, ""));
              onChange(false);
            }}
            placeholder="?"
          />
          <button type="button" onClick={verify}>
            {t("Verify", "အတည်ပြု")}
          </button>
          <button
            type="button"
            className="captcha-refresh"
            onClick={refresh}
            aria-label={t("New challenge", "မေးခွန်းအသစ်")}
          >
            ↻
          </button>
        </div>
      )}
    </div>
  );
}

function UserAuthScreen({
  t,
  onSuccess,
  onAdmin,
}: {
  t: (a: string, b: string) => string;
  onSuccess: (u: UserSession) => void;
  onAdmin: () => void;
}) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [captchaOk, setCaptchaOk] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!captchaOk) return toast.error(t("Complete the security check", "လုံခြုံရေးစစ်ဆေးမှုကို ပြီးမြောက်ပါ"));
    const fd = new FormData(e.currentTarget), password = String(fd.get("password") || "");
    if (mode === "signup" && password !== String(fd.get("confirm") || "")) return toast.error(t("Passwords do not match", "စကားဝှက်များ မတူညီပါ"));
    try {
      const response = await fetch(mode === "signup" ? "/api/auth/register" : "/api/auth/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mode === "signup" ? { name: fd.get("name"), email: fd.get("email"), password, inviteCode: fd.get("inviteCode") } : { email: fd.get("email"), password, mode: "staff" }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Sign in failed.");
      onSuccess({ name: result.session.name, email: result.session.email });
      toast.success(mode === "signup" ? t("Account created successfully", "အကောင့် ဖန်တီးပြီးပါပြီ") : t("Welcome back", "ပြန်လည်ကြိုဆိုပါတယ်"));
    } catch (error) { toast.error(error instanceof Error ? error.message : "Sign in failed."); }
  }
  return (
    <main className="user-auth-shell">
      <section className="auth-brand-panel">
        <div className="auth-brand">
          <span>
            <Building2 />
          </span>
          <strong>
            Campus<i>Ops</i>
          </strong>
        </div>
        <div>
          <p>{t("SMART FACILITIES PLATFORM", "စမတ် အဆောက်အအုံ စနစ်")}</p>
          <h1>
            {t(
              "A clearer view of every building operation.",
              "အဆောက်အအုံလုပ်ငန်းတိုင်းကို ရှင်းလင်းစွာ ကြည့်ရှုပါ။",
            )}
          </h1>
          <span>
            {t(
              "Monitor equipment, environmental conditions and maintenance activity from one responsive workspace.",
              "စက်ပစ္စည်း၊ ပတ်ဝန်းကျင်အခြေအနေနှင့် ပြုပြင်ထိန်းသိမ်းမှုများကို နေရာတစ်ခုတည်းမှ စောင့်ကြည့်ပါ။",
            )}
          </span>
        </div>
        <footer>
          <i />
          <span>
            {t(
              "Live prototype systems online",
              "တိုက်ရိုက်စမ်းသပ်စနစ်များ အလုပ်လုပ်နေသည်",
            )}
          </span>
        </footer>
      </section>
      <section className="auth-form-panel">
        <div className="auth-card">
          <div className="auth-heading">
            <span className="auth-user-icon">
              {mode === "login" ? <LogIn /> : <UserPlus />}
            </span>
            <p>
              {mode === "login"
                ? t("Welcome back", "ပြန်လည်ကြိုဆိုပါတယ်")
                : t("Create your account", "သင့်အကောင့် ဖန်တီးပါ")}
            </p>
            <h2>
              {mode === "login"
                ? t("Sign in to CampusOps", "CampusOps သို့ ဝင်ရောက်ပါ")
                : t("Join CampusOps", "CampusOps တွင် အကောင့်ဖွင့်ပါ")}
            </h2>
            <small>
              {mode === "login"
                ? t(
                    "Use the account created on this device.",
                    "ဤစက်တွင် ဖန်တီးထားသော အကောင့်ကို အသုံးပြုပါ။",
                  )
                : t(
                    "Create a user account for this prototype.",
                    "ဤစမ်းသပ်စနစ်အတွက် အသုံးပြုသူအကောင့် ဖန်တီးပါ။",
                  )}
            </small>
          </div>
          <div className="auth-tabs">
            <button
              className={mode === "login" ? "active" : ""}
              onClick={() => {
                setMode("login");
                setCaptchaOk(false);
              }}
            >
              {t("Log in", "ဝင်ရန်")}
            </button>
            <button
              className={mode === "signup" ? "active" : ""}
              onClick={() => {
                setMode("signup");
                setCaptchaOk(false);
              }}
            >
              {t("Create account", "အကောင့်ဖွင့်ရန်")}
            </button>
          </div>
          <form className="auth-form" onSubmit={submit}>
            {mode === "signup" && (
              <label>
                <span>{t("Full name", "အမည်အပြည့်အစုံ")}</span>
                <input
                  name="name"
                  required
                  autoComplete="name"
                  placeholder={t("e.g. Alex Morgan", "ဥပမာ Alex Morgan")}
                />
              </label>
            )}
            <label>
              <span>{t("Email address", "အီးမေးလ်လိပ်စာ")}</span>
              <input
                name="email"
                required
                type="email"
                autoComplete="email"
                placeholder="name@example.com"
              />
            </label>
            <label>
              <span>{t("Password", "စကားဝှက်")}</span>
              <input
                name="password"
                required
                type="password"
                minLength={8}
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                placeholder="••••••••"
              />
            </label>
            {mode === "signup" && (
              <label>
                <span>{t("Staff invitation code", "ဝန်ထမ်းဖိတ်ကြားမှု ကုဒ်")}</span>
                <input name="inviteCode" required autoComplete="off" />
              </label>
            )}
            {mode === "signup" && (
              <label>
                <span>{t("Confirm password", "စကားဝှက် အတည်ပြုရန်")}</span>
                <input
                  name="confirm"
                  required
                  type="password"
                  minLength={8}
                  autoComplete="new-password"
                  placeholder="••••••••"
                />
              </label>
            )}
            <CaptchaChallenge key={mode} t={t} onChange={setCaptchaOk} />
            <button className="primary-button auth-submit" type="submit">
              {mode === "login" ? <LogIn size={17} /> : <UserPlus size={17} />}{" "}
              {mode === "login"
                ? t("Log in", "ဝင်ရန်")
                : t("Create account", "အကောင့်ဖွင့်ရန်")}
            </button>
          </form>
          <div className="auth-divider">
            <span>{t("Facilities staff", "အဆောက်အအုံဝန်ထမ်း")}</span>
          </div>
          <button className="admin-access-button" onClick={onAdmin}>
            <ShieldCheck size={17} />
            {t("Administrator access", "စီမံခန့်ခွဲသူ ဝင်ရောက်မှု")}
          </button>
          <p className="auth-privacy">
            {t(
              "Prototype accounts are stored only in this browser.",
              "စမ်းသပ်အကောင့်များကို ဤဘရောက်ဇာတွင်သာ သိမ်းဆည်းသည်။",
            )}
          </p>
        </div>
      </section>
    </main>
  );
}

function UserAccountDialog({
  open,
  setOpen,
  user,
  t,
  onLogout,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  user: UserSession | null;
  t: (a: string, b: string) => string;
  onLogout: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="login-dialog">
        <div className="login-mark">
          <CircleUserRound />
        </div>
        <DialogHeader>
          <DialogTitle>{user?.name}</DialogTitle>
          <DialogDescription>{user?.email}</DialogDescription>
        </DialogHeader>
        <div className="account-summary">
          <p>
            {t(
              "Signed in as a standard CampusOps user on this device.",
              "ဤစက်တွင် CampusOps သာမန်အသုံးပြုသူအဖြစ် ဝင်ထားသည်။",
            )}
          </p>
          <button className="secondary-button" onClick={onLogout}>
            <LogOut size={16} />
            {t("Sign out", "ထွက်ရန်")}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function LoginDialog({
  open,
  setOpen,
  t,
  onSuccess,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  t: (a: string, b: string) => string;
  onSuccess: () => void;
}) {
  const [captchaOk, setCaptchaOk] = useState(false);
  const setupMode = false;
  async function login(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!captchaOk) return toast.error(t("Complete the security check", "လုံခြုံရေးစစ်ဆေးမှုကို ပြီးမြောက်ပါ"));
    const fd = new FormData(e.currentTarget);
    try {
      const response = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: fd.get("email"), password: fd.get("password"), mode: "admin" }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Sign in failed.");
      onSuccess(); setOpen(false); toast.success(t("Secure admin session started", "လုံခြုံသော အက်ဒမင်ကဏ္ဍ စတင်ပါပြီ"));
    } catch (error) { toast.error(error instanceof Error ? error.message : "Sign in failed."); }
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="login-dialog">
        <div className="login-mark">
          <LockKeyhole />
        </div>
        <DialogHeader>
          <DialogTitle>
            {setupMode
              ? t("Set up administrator", "စီမံခန့်ခွဲသူ သတ်မှတ်ရန်")
              : t("Administrator access", "စီမံခန့်ခွဲသူ ဝင်ရောက်မှု")}
          </DialogTitle>
          <DialogDescription>
            {t(
              setupMode
                ? "Create the authorised facilities account for this browser."
                : "Restricted to the single authorised facilities account.",
              "ခွင့်ပြုထားသော အဆောက်အအုံ စီမံအကောင့်တစ်ခုအတွက်သာ ဖြစ်သည်။",
            )}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={login} className="request-form">
          <label>
            <span>{t("Admin email", "အက်ဒမင် အီးမေးလ်")}</span>
            <input
              required
              name="email"
              type="email"
              autoComplete="username"
              placeholder="admin@campusops.edu"
            />
          </label>
          <label>
            <span>{t("Password", "စကားဝှက်")}</span>
            <input
              required
              name="password"
              type="password"
              autoComplete="current-password"
              minLength={setupMode ? 10 : 8}
            />
          </label>
          {setupMode && (
            <label>
              <span>{t("Confirm password", "စကားဝှက် အတည်ပြုရန်")}</span>
              <input
                required
                name="confirm"
                type="password"
                minLength={10}
                autoComplete="new-password"
              />
            </label>
          )}
          <CaptchaChallenge t={t} onChange={setCaptchaOk} />
          <button className="primary-button login-submit" type="submit">
            <ShieldCheck size={17} />
            {t("Sign in securely", "လုံခြုံစွာ ဝင်ရန်")}
          </button>
          <p className="demo-note">
            {t(
              setupMode
                ? "The password is hashed before it is stored in this browser."
                : "Use the administrator account configured on this browser.",
              setupMode
                ? "စကားဝှက်ကို ဤဘရောက်ဇာတွင် မသိမ်းမီ hash ပြုလုပ်သည်။"
                : "ဤဘရောက်ဇာတွင် သတ်မှတ်ထားသော စီမံခန့်ခွဲသူအကောင့်ကို အသုံးပြုပါ။",
            )}
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AddEquipmentDialog({
  open,
  setOpen,
  t,
  equipment,
  onAdd,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  t: (a: string, b: string) => string;
  equipment: Equipment[];
  onAdd: (item: Equipment) => void;
}) {
  const [status, setStatus] = useState<EquipmentStatus>("Operational"),
    [captchaOk, setCaptchaOk] = useState(false);
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!captchaOk)
      return toast.error(
        t("Complete the security check", "လုံခြုံရေးစစ်ဆေးမှုကို ပြီးမြောက်ပါ"),
      );
    const fd = new FormData(e.currentTarget),
      id = String(fd.get("id") || "")
        .trim()
        .toUpperCase();
    if (equipment.some((item) => item.id.toUpperCase() === id))
      return toast.error(
        t(
          "That equipment ID already exists",
          "ဤစက်ပစ္စည်း ID ရှိပြီးသားဖြစ်သည်",
        ),
      );
    onAdd({
      id,
      name: String(fd.get("name") || "").trim(),
      mm: String(fd.get("mm") || "").trim(),
      category: String(fd.get("category") || "").trim(),
      building: String(fd.get("building") || "").trim(),
      location: String(fd.get("location") || "").trim(),
      status,
      updated: "just now",
    });
    e.currentTarget.reset();
    setStatus("Operational");
    setCaptchaOk(false);
    setOpen(false);
    toast.success(
      t("Equipment added successfully", "စက်ပစ္စည်း ထည့်ပြီးပါပြီ"),
      { description: id },
    );
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="request-dialog">
        <DialogHeader>
          <DialogTitle>
            {t("Add new equipment", "စက်ပစ္စည်းအသစ် ထည့်ရန်")}
          </DialogTitle>
          <DialogDescription>
            {t(
              "Register an asset so it appears in monitoring, administration and maintenance forms.",
              "စောင့်ကြည့်မှု၊ စီမံခန့်ခွဲမှုနှင့် ပြုပြင်ထိန်းသိမ်းမှု ဖောင်များတွင် ပေါ်လာစေရန် စက်ပစ္စည်းကို မှတ်ပုံတင်ပါ။",
            )}
          </DialogDescription>
        </DialogHeader>
        <form className="request-form" onSubmit={submit}>
          <div className="form-row">
            <label>
              <span>{t("Equipment ID", "စက်ပစ္စည်း ID")} *</span>
              <input
                required
                name="id"
                pattern="[A-Za-z0-9-]{3,20}"
                placeholder="EQ-1050"
              />
            </label>
            <label>
              <span>{t("Category", "အမျိုးအစား")} *</span>
              <input required name="category" placeholder="HVAC, Electrical…" />
            </label>
          </div>
          <label>
            <span>{t("Equipment name", "စက်ပစ္စည်းအမည်")} *</span>
            <input
              required
              minLength={3}
              name="name"
              placeholder="Air Handling Unit 04"
            />
          </label>
          <label>
            <span>
              {t("Burmese name (optional)", "မြန်မာအမည် (မဖြည့်လည်းရသည်)")}
            </span>
            <input name="mm" placeholder="မြန်မာအမည်" />
          </label>
          <div className="form-row">
            <label>
              <span>{t("Building", "အဆောက်အအုံ")} *</span>
              <input required name="building" placeholder="Innovation Centre" />
            </label>
            <label>
              <span>{t("Location", "တည်နေရာ")} *</span>
              <input
                required
                name="location"
                placeholder="Level 2 · Room 204"
              />
            </label>
          </div>
          <label>
            <span>{t("Initial status", "အစ အခြေအနေ")} *</span>
            <Select
              value={status}
              onValueChange={(v) => setStatus(v as EquipmentStatus)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Operational">Operational</SelectItem>
                <SelectItem value="Attention">Attention</SelectItem>
                <SelectItem value="Offline">Offline</SelectItem>
              </SelectContent>
            </Select>
          </label>
          <CaptchaChallenge t={t} onChange={setCaptchaOk} />
          <div className="form-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={() => setOpen(false)}
            >
              {t("Cancel", "ပယ်ဖျက်ရန်")}
            </button>
            <button type="submit" className="primary-button">
              <Plus size={16} />
              {t("Add equipment", "စက်ပစ္စည်း ထည့်ရန်")}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AdminView({
  t,
  tickets,
  setTickets,
  equipment,
  setEquipment,
  logout,
}: {
  t: (a: string, b: string) => string;
  tickets: Ticket[];
  setTickets: React.Dispatch<React.SetStateAction<Ticket[]>>;
  equipment: Equipment[];
  setEquipment: React.Dispatch<React.SetStateAction<Equipment[]>>;
  logout: () => void;
}) {
  const [addEquipmentOpen, setAddEquipmentOpen] = useState(false);
  const totalRequests = tickets.length;
  const openRequests = tickets.filter((x) => x.status === "Open").length;
  const inProgressRequests = tickets.filter(
    (x) => x.status === "In progress",
  ).length;
  const resolvedRequests = tickets.filter(
    (x) => x.status === "Resolved",
  ).length;
  const urgentBacklog = tickets.filter(
    (x) =>
      x.status !== "Resolved" &&
      (x.priority === "Critical" || x.priority === "High"),
  ).length;
  const equipmentIssues = equipment.filter(
    (x) => x.status !== "Operational",
  ).length;
  const completionRate = totalRequests
    ? Math.round((resolvedRequests / totalRequests) * 100)
    : 0;
  const requestStatuses = [
    { label: t("Open", "ဖွင့်ထား"), value: openRequests, tone: "red" },
    {
      label: t("In progress", "ဆောင်ရွက်ဆဲ"),
      value: inProgressRequests,
      tone: "amber",
    },
    {
      label: t("Resolved", "ဖြေရှင်းပြီး"),
      value: resolvedRequests,
      tone: "green",
    },
  ];
  const priorityBreakdown = (["Critical", "High", "Medium", "Low"] as Priority[]).map(
    (priority) => ({
      label: priority,
      value: tickets.filter((ticket) => ticket.priority === priority).length,
      tone: priority.toLowerCase(),
    }),
  );
  const equipmentHealth = (
    ["Operational", "Attention", "Offline"] as EquipmentStatus[]
  ).map((status) => ({
    label: status,
    value: equipment.filter((item) => item.status === status).length,
    tone:
      status === "Operational"
        ? "green"
        : status === "Attention"
          ? "amber"
          : "red",
  }));
  const categoryInventory = Object.entries(
    equipment.reduce<Record<string, number>>((counts, item) => {
      counts[item.category] = (counts[item.category] || 0) + 1;
      return counts;
    }, {}),
  ).sort((a, b) => b[1] - a[1]);
  const recentTickets = tickets.slice(0, 4);

  function downloadOperationalReport() {
    const csvCell = (value: string | number) =>
      `"${String(value).replaceAll('"', '""')}"`;
    const rows: (string | number)[][] = [
      ["CampusOps Operational Report"],
      ["Generated", new Date().toLocaleString()],
      [],
      ["Summary"],
      ["Total requests", totalRequests],
      ["Open", openRequests],
      ["In progress", inProgressRequests],
      ["Resolved", resolvedRequests],
      ["Urgent backlog", urgentBacklog],
      ["Completion rate", `${completionRate}%`],
      ["Equipment issues", equipmentIssues],
      [],
      ["Maintenance requests"],
      [
        "ID",
        "Equipment",
        "Issue",
        "Location",
        "Reporter",
        "Priority",
        "Status",
        "Created",
      ],
      ...tickets.map((ticket) => [
        ticket.id,
        ticket.equipment,
        ticket.issue,
        ticket.location,
        ticket.reporter,
        ticket.priority,
        ticket.status,
        ticket.created,
      ]),
      [],
      ["Equipment inventory"],
      ["ID", "Name", "Category", "Building", "Location", "Status"],
      ...equipment.map((item) => [
        item.id,
        item.name,
        item.category,
        item.building,
        item.location,
        item.status,
      ]),
    ];
    const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");
    const url = URL.createObjectURL(
      new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `campusops-operational-report-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(t("Operational report downloaded", "လုပ်ငန်းအစီရင်ခံစာ ဒေါင်းလုဒ်ပြီးပါပြီ"));
  }
  return (
    <>
      <PageHead
        eyebrow={t("RESTRICTED CONTROL", "ကန့်သတ် ထိန်းချုပ်မှု")}
        title={t("Administration", "စီမံခန့်ခွဲမှု")}
        description={t(
          "Manage equipment conditions and move maintenance requests through the workflow.",
          "စက်ပစ္စည်းအခြေအနေနှင့် ပြုပြင်တောင်းဆိုချက် လုပ်ငန်းစဉ်ကို စီမံပါ။",
        )}
        action={
          <div className="admin-head-actions">
            <button
              className="primary-button"
              onClick={() => setAddEquipmentOpen(true)}
            >
              <Plus size={16} />
              {t("Add equipment", "စက်ပစ္စည်း ထည့်ရန်")}
            </button>
            <button
              className="secondary-button"
              onClick={downloadOperationalReport}
            >
              <Download size={16} />
              {t("Export report", "အစီရင်ခံစာ ထုတ်ရန်")}
            </button>
            <button className="secondary-button" onClick={logout}>
              <LogOut size={16} />
              {t("Sign out", "ထွက်ရန်")}
            </button>
          </div>
        }
      />
      <div className="admin-banner">
        <ShieldCheck />
        <div>
          <strong>
            {t(
              "Authenticated administrator session",
              "စီမံခန့်ခွဲသူအဖြစ် အတည်ပြုပြီး",
            )}
          </strong>
          <p>
            {t(
              "Changes are saved to the shared PostgreSQL database.",
              "ပြောင်းလဲမှုများကို မျှဝေထားသော PostgreSQL ဒေတာဘေ့စ်တွင် သိမ်းမည်။",
            )}
          </p>
        </div>
        <span>HTTPS READY</span>
      </div>
      <section
        className="admin-report"
        aria-label={t("Operations report", "လုပ်ငန်း အစီရင်ခံစာ")}
      >
        <div className="admin-report-heading">
          <div>
            <p>
              {t("LIVE OPERATIONS REPORT", "တိုက်ရိုက် လုပ်ငန်းအစီရင်ခံစာ")}
            </p>
            <h2>
              {t(
                "Maintenance performance",
                "ပြုပြင်ထိန်းသိမ်းမှု စွမ်းဆောင်ရည်",
              )}
            </h2>
          </div>
          <span>
            {completionRate}% {t("completed", "ပြီးစီး")}
          </span>
        </div>
        <div className="admin-report-grid">
          <ReportMetric
            icon={<ClipboardList />}
            tone="blue"
            label={t("Total requests", "တောင်းဆိုချက် စုစုပေါင်း")}
            value={totalRequests}
            detail={t("All recorded tickets", "မှတ်တမ်းတင်ထားသော လက်မှတ်များ")}
          />
          <ReportMetric
            icon={<AlertTriangle />}
            tone="red"
            label={t("Open requests", "ဖွင့်ထားသော တောင်းဆိုချက်များ")}
            value={openRequests}
            detail={`${urgentBacklog} ${t("urgent pending", "အရေးပေါ် စောင့်ဆိုင်း")}`}
          />
          <ReportMetric
            icon={<Clock3 />}
            tone="amber"
            label={t("In progress", "ဆောင်ရွက်ဆဲ")}
            value={inProgressRequests}
            detail={t("Currently assigned work", "လက်ရှိ တာဝန်ပေးထားသော အလုပ်")}
          />
          <ReportMetric
            icon={<ShieldCheck />}
            tone="green"
            label={t("Resolved", "ဖြေရှင်းပြီး")}
            value={resolvedRequests}
            detail={`${completionRate}% ${t("completion rate", "ပြီးစီးမှုနှုန်း")}`}
          />
          <ReportMetric
            icon={<Gauge />}
            tone="violet"
            label={t("Equipment issues", "စက်ပစ္စည်း ပြဿနာများ")}
            value={equipmentIssues}
            detail={t("Attention or offline", "သတိပြုရန် သို့မဟုတ် အလုပ်မလုပ်")}
          />
        </div>
        <div className="completion-track">
          <span style={{ width: `${completionRate}%` }} />
          <div>
            <b>{t("Request completion", "တောင်းဆိုချက် ပြီးစီးမှု")}</b>
            <small>
              {resolvedRequests} {t("of", "မှ")} {totalRequests}{" "}
              {t("requests resolved", "တောင်းဆိုချက် ဖြေရှင်းပြီး")}
            </small>
          </div>
        </div>
      </section>
      <div className="admin-insights-grid">
        <section className="insight-panel">
          <div className="insight-heading">
            <div>
              <p>{t("WORKLOAD", "လုပ်ငန်းပမာဏ")}</p>
              <h3>{t("Request breakdown", "တောင်းဆိုချက် ခွဲခြမ်းစိတ်ဖြာမှု")}</h3>
            </div>
            <ClipboardList />
          </div>
          <div className="breakdown-list">
            {requestStatuses.map((item) => (
              <BreakdownBar
                key={item.label}
                {...item}
                total={totalRequests}
              />
            ))}
          </div>
          <div className="priority-summary">
            <p>{t("Requests by priority", "ဦးစားပေးအလိုက် တောင်းဆိုချက်များ")}</p>
            <div>
              {priorityBreakdown.map((item) => (
                <span className={`priority-count ${item.tone}`} key={item.label}>
                  <b>{item.value}</b> {item.label}
                </span>
              ))}
            </div>
          </div>
        </section>
        <section className="insight-panel">
          <div className="insight-heading">
            <div>
              <p>{t("ASSET OVERVIEW", "ပစ္စည်း ခြုံငုံသုံးသပ်ချက်")}</p>
              <h3>{t("Equipment health", "စက်ပစ္စည်း ကျန်းမာရေး")}</h3>
            </div>
            <Gauge />
          </div>
          <div className="breakdown-list">
            {equipmentHealth.map((item) => (
              <BreakdownBar
                key={item.label}
                {...item}
                total={equipment.length}
              />
            ))}
          </div>
          <div className="category-summary">
            <p>{t("Inventory by category", "အမျိုးအစားအလိုက် ပစ္စည်းစာရင်း")}</p>
            <div>
              {categoryInventory.map(([category, count]) => (
                <span key={category}>
                  {category} <b>{count}</b>
                </span>
              ))}
            </div>
          </div>
        </section>
      </div>
      <section className="recent-activity-panel">
        <div className="insight-heading">
          <div>
            <p>{t("RECENT ACTIVITY", "လတ်တလော လုပ်ဆောင်ချက်")}</p>
            <h3>{t("Latest maintenance requests", "နောက်ဆုံး ပြုပြင်တောင်းဆိုချက်များ")}</h3>
          </div>
          <Clock3 />
        </div>
        <div className="recent-activity-list">
          {recentTickets.length ? (
            recentTickets.map((ticket) => (
              <article className="activity-entry" key={ticket.id}>
                <span className={`activity-marker ${ticket.status.toLowerCase().replace(" ", "-")}`} />
                <div>
                  <strong>{ticket.equipment}</strong>
                  <p>{ticket.issue}</p>
                </div>
                <div className="activity-meta">
                  <span className={`priority-tag ${ticket.priority.toLowerCase()}`}>
                    {ticket.priority}
                  </span>
                  <small>{ticket.status} · {ticket.created}</small>
                </div>
              </article>
            ))
          ) : (
            <p className="empty-activity">{t("No maintenance activity yet.", "ပြုပြင်ထိန်းသိမ်းမှု မှတ်တမ်း မရှိသေးပါ။")}</p>
          )}
        </div>
      </section>
      <div className="admin-grid">
        <section className="panel">
          <PanelTitle
            title={t("Ticket queue", "ပြုပြင်လက်မှတ် စာရင်း")}
            subtitle={t("Update work status", "အလုပ်အခြေအနေ ပြင်ဆင်ရန်")}
            live={false}
          />
          <div className="admin-list">
            {[...tickets]
              .sort(
                (a, b) => priorityRank[a.priority] - priorityRank[b.priority],
              )
              .map((x) => (
                <div className="admin-row" key={x.id}>
                  <div>
                    <small>
                      {x.id} · {x.priority}
                    </small>
                    <strong>{x.equipment}</strong>
                    <p>{x.issue}</p>
                  </div>
                  <Select
                    value={x.status}
                    onValueChange={(v) => {
                      setTickets((prev) =>
                        prev.map((y) =>
                          y.id === x.id
                            ? { ...y, status: v as TicketStatus }
                            : y,
                        ),
                      );
                      toast.success(
                        t(
                          "Ticket status updated",
                          "လက်မှတ်အခြေအနေ ပြင်ပြီးပါပြီ",
                        ),
                      );
                    }}
                  >
                    <SelectTrigger className="admin-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Open">Open</SelectItem>
                      <SelectItem value="In progress">In progress</SelectItem>
                      <SelectItem value="Resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ))}
          </div>
        </section>
        <section className="panel">
          <PanelTitle
            title={t("Equipment controls", "စက်ပစ္စည်း ထိန်းချုပ်မှု")}
            subtitle={t(
              "Set the current operational state",
              "လက်ရှိ လုပ်ငန်းအခြေအနေ သတ်မှတ်ရန်",
            )}
            live={false}
          />
          <div className="admin-list">
            {equipment.map((x) => (
              <div className="admin-row asset-admin" key={x.id}>
                <span className="asset-icon">
                  <Settings2 />
                </span>
                <div>
                  <small>
                    {x.id} · {x.building}
                  </small>
                  <strong>{x.name}</strong>
                  <p>{x.location}</p>
                </div>
                <Select
                  value={x.status}
                  onValueChange={(v) => {
                    setEquipment((prev) =>
                      prev.map((y) =>
                        y.id === x.id
                          ? {
                              ...y,
                              status: v as EquipmentStatus,
                              updated: "just now",
                            }
                          : y,
                      ),
                    );
                    toast.success(
                      t(
                        "Equipment status updated",
                        "စက်ပစ္စည်းအခြေအနေ ပြင်ပြီးပါပြီ",
                      ),
                    );
                  }}
                >
                  <SelectTrigger className="admin-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Operational">Operational</SelectItem>
                    <SelectItem value="Attention">Attention</SelectItem>
                    <SelectItem value="Offline">Offline</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </section>
      </div>
      <AddEquipmentDialog
        open={addEquipmentOpen}
        setOpen={setAddEquipmentOpen}
        t={t}
        equipment={equipment}
        onAdd={(item) => setEquipment((prev) => [item, ...prev])}
      />
    </>
  );
}

function ReportMetric({
  icon,
  tone,
  label,
  value,
  detail,
}: {
  icon: React.ReactNode;
  tone: string;
  label: string;
  value: number;
  detail: string;
}) {
  return (
    <article className="report-metric">
      <span className={`report-metric-icon ${tone}`}>{icon}</span>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        <small>{detail}</small>
      </div>
    </article>
  );
}

function BreakdownBar({
  label,
  value,
  total,
  tone,
}: {
  label: string;
  value: number;
  total: number;
  tone: string;
}) {
  const percentage = total ? Math.round((value / total) * 100) : 0;
  return (
    <div className="breakdown-row">
      <div>
        <span>{label}</span>
        <b>{value}</b>
      </div>
      <div className="breakdown-track">
        <span className={tone} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}
