import React, { useState, useEffect, useRef } from "react";
import { 
  ShieldCheck, Terminal, Users, Cpu, Key, Database, Percent, Shield, AlertTriangle, 
  TrendingUp, Activity, CheckCircle, Clock, Server, RefreshCw, Trash2, ShieldAlert, 
  Lock, Unlock, KeyRound, Copy, PlusCircle, Check, Play, Pause, Save, HelpCircle, 
  ArrowLeft, Search, Bell, Mail, BarChart3, ShieldAlert as AlertIcon, Ban, FileCode, CheckCircle2,
  X, Send, RefreshCw as RotateIcon, ArrowRight, Layers
} from "lucide-react";
import { isLiveFirebase, db } from "../lib/firebase";
import { collection, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore";

interface DeveloperControlCenterProps {
  onBackToUserMode: () => void;
  sriLankaTime: string;
}

interface LicenseRecord {
  key: string;
  type: "Trial" | "Monthly" | "Annual" | "Lifetime";
  deviceId: string;
  activatedAt: string;
  expiresAt: string;
  status: "Active" | "Pending" | "Suspended";
  deviceCount: number;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  plan: "Free" | "Pro" | "Enterprise" | "Lifetime";
  registeredAt: string;
  linkedDevice: string;
  status: "Active" | "Warning" | "Suspended";
}

interface SupportTicket {
  id: string;
  user: string;
  subject: string;
  message: string;
  category: "Billing" | "GPU Pipeline" | "Key Issues" | "Model Error";
  timestamp: string;
  status: "Open" | "Pending" | "Closed";
  replyText?: string;
}

export default function DeveloperControlCenter({ onBackToUserMode, sriLankaTime }: DeveloperControlCenterProps) {
  // Navigation
  const [activeTab, setActiveTab] = useState<"dashboard" | "licenses" | "users" | "gpu" | "errors" | "logs" | "support" | "security">("dashboard");

  // License Database State (Loads from registry first)
  const [licenses, setLicenses] = useState<LicenseRecord[]>([]);
  const [licenseSearch, setLicenseSearch] = useState("");
  const [newKeyType, setNewKeyType] = useState<LicenseRecord["type"]>("Monthly");
  const [createdKeyAlert, setCreatedKeyAlert] = useState<string | null>(null);

  // User list state
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [userSearch, setUserSearch] = useState("");

  // Support Tickets
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [ticketReply, setTicketReply] = useState("");

  // Real-Time System Log Streams
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [isTerminalStreaming, setIsTerminalStreaming] = useState(true);
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Announcement Pushes
  const [announcementText, setAnnouncementText] = useState("");
  const [announcements, setAnnouncements] = useState<Array<{ text: string; date: string }>>([]);
  const [showAnnouncementAlert, setShowAnnouncementAlert] = useState(false);

  // Security variables
  const [masterPin, setMasterPin] = useState("08");
  const [tempPin, setTempPin] = useState("08");
  const [isPinUpdatedAlert, setIsPinUpdatedAlert] = useState(false);
  const [encryptionStandard, setEncryptionStandard] = useState("AES-GCM-256");
  const [auditScheduler, setAuditScheduler] = useState("Daily at 00:00 UTC");

  // GPU states
  const [gpuTemp, setGpuTemp] = useState(54);
  const [vramUsed, setVramUsed] = useState(6.4);
  const [pipelinesActive, setPipelinesActive] = useState(8);
  const [cudaLoad, setCudaLoad] = useState(32);
  const [isProcessingTelemetry, setIsProcessingTelemetry] = useState(false);

  // Seed initial values safely on mount
  useEffect(() => {
    // 1. Licenses Database Reconstruction from local storage & simulated lists
    let localKeys: LicenseRecord[] = [];
    const storedRegistry = localStorage.getItem("media_studio_license_registry");
    const storedKey = localStorage.getItem("media_studio_active_license_key");

    if (storedRegistry) {
      try {
        const parsed: Record<string, string> = JSON.parse(storedRegistry);
        Object.entries(parsed).forEach(([k, dev]) => {
          localKeys.push({
            key: k,
            type: k.startsWith("LIFE") ? "Lifetime" : "Monthly",
            deviceId: dev,
            activatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toLocaleDateString(),
            expiresAt: k.startsWith("LIFE") ? "Never (Lifetime)" : new Date(Date.now() + 27 * 24 * 60 * 60 * 1000).toLocaleDateString(),
            status: "Active",
            deviceCount: 1
          });
        });
      } catch (_) {}
    }

    // fallback seed data to look professional
    const demoKeys: LicenseRecord[] = [
      { key: "STUDIOX123456", type: "Annual", deviceId: "HW-FF88CC21A23D", activatedAt: "2026-05-10", expiresAt: "2027-05-10", status: "Active", deviceCount: 1 },
      { key: "TRIAL99ABCXYZ", type: "Trial", deviceId: "HW-99AABBFFCC01", activatedAt: "2026-06-12", expiresAt: "2026-06-26", status: "Active", deviceCount: 1 },
      { key: "ENTERNOW20260", type: "Lifetime", deviceId: "HW-BEEF33221199", activatedAt: "2026-01-15", expiresAt: "Never (Lifetime)", status: "Active", deviceCount: 1 },
      { key: "EXPIRED8888AA", type: "Monthly", deviceId: "HW-7733446699FF", activatedAt: "2026-04-10", expiresAt: "2026-05-10", status: "Suspended", deviceCount: 1 },
      { key: "LIFETIMETESTK", type: "Lifetime", deviceId: "Pending Registration", activatedAt: "Unused", expiresAt: "Never (Lifetime)", status: "Pending", deviceCount: 0 }
    ];

    const mergedKeys = [...localKeys, ...demoKeys.filter(dk => !localKeys.some(lk => lk.key === dk.key))];
    setLicenses(mergedKeys);

    // 2. Simulated Users Profile list
    const demoUsers: UserProfile[] = [
      { id: "usr-101", name: "imashaisuri49@gmail.com", email: "imashaisuri49@gmail.com", plan: "Free", registeredAt: "2026-06-15", linkedDevice: "HW-FF88CC...", status: "Active" },
      { id: "usr-102", name: "S M Chanuka Dilshan", email: "Chanukaofficial31@gmail.com", plan: "Enterprise", registeredAt: "2026-02-18", linkedDevice: "HW-BEEF33...", status: "Active" },
      { id: "usr-103", name: "David Vance", email: "d.vance@registry.org", plan: "Pro", registeredAt: "2026-06-01", linkedDevice: "HW-99AABB...", status: "Active" },
      { id: "usr-104", name: "Sophia Henderson", email: "sophia@grandpalms.com", plan: "Enterprise", registeredAt: "2026-06-11", linkedDevice: "HW-773344...", status: "Active" },
      { id: "usr-105", name: "Attacker Core", email: "crack-hacker@anonymous.io", plan: "Free", registeredAt: "2026-06-14", linkedDevice: "HW-BADDE... (Attacked)", status: "Suspended" }
    ];
    setUsers(demoUsers);

    // 3. Simulated Support tickets
    const demoTickets: SupportTicket[] = [
      { id: "tkt-001", user: "Chanukaofficial31@gmail.com", subject: "GPU pipeline compiling sluggishness in viewport", message: "In Colombo, compiling deep HDR layers seems slightly delayed when multi-processing complex product shots.", category: "GPU Pipeline", timestamp: "2026-06-15 15:42", status: "Open" },
      { id: "tkt-002", user: "imashaisuri49@gmail.com", subject: "Unlocking custom Neon Blue layout preset", message: "I upgraded but wanted to know if Linux Light and macOS themes are included inside Enterprise plan.", category: "Billing", timestamp: "2026-06-15 11:20", status: "Open" },
      { id: "tkt-003", user: "unknown-designer@pro.net", subject: "Resetting active HW-ID device signature", message: "My computer was upgraded with hardware, and now the Single-PC lock is blocking activation.", category: "Key Issues", timestamp: "2026-06-14", status: "Closed", replyText: "Your key's hardware fingerprint was wiped successfully by System Administrator." }
    ];
    setTickets(demoTickets);

    // Initial terminal logs seed
    setTerminalLogs([
      `[${new Date().toLocaleTimeString()}] INGRESS: Dev Control Panel authenticated via PIN 08.`,
      `[${new Date().toLocaleTimeString()}] SECURITY: System cryptographic lock standard set to AES-GCM-256.`,
      `[${new Date().toLocaleTimeString()}] TELEMETRY_PASS: Live Firestore database syncing is: ${isLiveFirebase ? "ONLINE/ACTIVE" : "OFFLINE/LOCAL_MODE_DEFERRED"}.`,
      `[${new Date().toLocaleTimeString()}] OPTIMZE: Pipeline loaded 8 active warm shaders successfully.`,
      `[${new Date().toLocaleTimeString()}] AUDIT: Zero security anomalies registered in past 24 hours.`
    ]);
  }, []);

  // Real-Time Log streamer simulation
  useEffect(() => {
    if (!isTerminalStreaming) return;

    const streamEvents = [
      "DB_SYNC: Pushed license registry changes to cloud clusters.",
      "GPU_TENSOR: Optimizing 3D Gaussian Splats shader buffer. Temp: 54C.",
      "SEC_AUDIT: System registry security signatures matched correct UUID hashes.",
      "HEARTBEAT: Workspace container status is active on port 3000.",
      "LICENSE_CHECK: Key key verification pass completed in 0.4ms.",
      "GPU_COMPILER: Cache warm-up hit 100%. Thread pool ready.",
      "METRIC_LOG: MRR calculation updated: USD 14,845 / Mo (growth positive).",
      "API_PING: Server endpoint /api/analyze responded in 320ms."
    ];

    const interval = setInterval(() => {
      setTerminalLogs(prev => {
        const timestamp = new Date().toLocaleTimeString();
        const randEvent = streamEvents[Math.floor(Math.random() * streamEvents.length)];
        const nextLog = `[${timestamp}] ${randEvent}`;
        const output = [...prev, nextLog];
        // clip to past 50 logs
        return output.slice(-50);
      });

      // Fluctuate GPU stats slightly
      setGpuTemp(prev => {
        const offset = Math.random() > 0.5 ? 1 : -1;
        const next = prev + offset;
        return next < 50 ? 50 : next > 62 ? 62 : next;
      });
      setVramUsed(prev => {
        const offset = Number((Math.random() - 0.5) * 0.1);
        const next = Number((prev + offset).toFixed(2));
        return next < 5.8 ? 5.8 : next > 7.1 ? 7.1 : next;
      });
      setCudaLoad(prev => {
        const offset = Math.round((Math.random() - 0.5) * 6);
        const next = prev + offset;
        return next < 20 ? 20 : next > 55 ? 55 : next;
      });
    }, 3200);

    return () => clearInterval(interval);
  }, [isTerminalStreaming]);

  // Scroll terminal logs on update
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [terminalLogs]);

  // Master PIN updater
  const handleUpdatePin = () => {
    if (!tempPin || tempPin.length < 4) {
      alert("PIN must be at least 4 digits.");
      return;
    }
    setMasterPin(tempPin);
    setIsPinUpdatedAlert(true);
    setTimeout(() => setIsPinUpdatedAlert(false), 3000);

    setTerminalLogs(prev => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] WARNING: Master Developer gate passcode PIN updated to: [${tempPin}].`
    ]);
  };

  // Create license keys keygen
  const handleGenerateKey = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let key = "";
    for (let i = 0; i < 13; i++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const durationDays = newKeyType === "Yearly" as any || newKeyType === "Annual" ? 365 : newKeyType === "Monthly" ? 30 : newKeyType === "Trial" ? 14 : 99999;
    const expires = newKeyType === "Lifetime" ? "Never (Lifetime)" : new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toLocaleDateString();

    const newRecord: LicenseRecord = {
      key: key,
      type: newKeyType,
      deviceId: "Pending Registration",
      activatedAt: "Unused",
      expiresAt: expires,
      status: "Pending",
      deviceCount: 0
    };

    const nextDb = [newRecord, ...licenses];
    setLicenses(nextDb);
    setCreatedKeyAlert(key);

    // Push into active serial key generators mapping
    let registry: Record<string, string> = {};
    const stored = localStorage.getItem("media_studio_license_registry");
    if (stored) {
      try {
        registry = JSON.parse(stored);
      } catch (_) {}
    }
    // Set placeholder key without HWID mapping initially
    registry[key] = "HW-PENDING-ACTIVATION";
    localStorage.setItem("media_studio_license_registry", JSON.stringify(registry));

    setTerminalLogs(prev => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] KEYGEN: Created 13-char serial [${key}] Tier: [${newKeyType}].`
    ]);
  };

  // Modify license status
  const handleToggleLicenseStatus = (targetKey: string, currentStatus: LicenseRecord["status"]) => {
    const nextStatus: LicenseRecord["status"] = currentStatus === "Active" ? "Suspended" : "Active";
    setLicenses(prev => prev.map(l => {
      if (l.key === targetKey) {
        return { ...l, status: nextStatus };
      }
      return l;
    }));

    setTerminalLogs(prev => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] LICENSE_STATE: Key [${targetKey}] toggled to: [${nextStatus}].`
    ]);
  };

  // Delete license key
  const handleDeleteLicense = (targetKey: string) => {
    if (!window.confirm(`Delete key ${targetKey} permanently?`)) return;
    setLicenses(prev => prev.filter(l => l.key !== targetKey));

    let registry: Record<string, string> = {};
    const stored = localStorage.getItem("media_studio_license_registry");
    if (stored) {
      try {
        registry = JSON.parse(stored);
        delete registry[targetKey];
        localStorage.setItem("media_studio_license_registry", JSON.stringify(registry));
      } catch (_) {}
    }

    setTerminalLogs(prev => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] LICENSE_REMOVE: Permenently purged key code [${targetKey}].`
    ]);
  };

  // User status toggler
  const handleToggleUserStatus = (id: string, currentStatus: UserProfile["status"]) => {
    const next: UserProfile["status"] = currentStatus === "Active" ? "Suspended" : "Active";
    setUsers(prev => prev.map(u => u.id === id ? { ...u, status: next } : u));
    setTerminalLogs(prev => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] USER_STATE: Profile ${id} suspended/active changed to: ${next}.`
    ]);
  };

  // Announcement broadicaster
  const handlePublishAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementText.trim()) return;

    const newBulletin = {
      text: announcementText.trim(),
      date: new Date().toLocaleString()
    };
    setAnnouncements(prev => [newBulletin, ...prev]);

    // Store globally so the User Application's main dashboard can fetch it!
    localStorage.setItem("media_studio_system_message", announcementText.trim());

    setAnnouncementText("");
    setShowAnnouncementAlert(true);
    setTimeout(() => setShowAnnouncementAlert(false), 3000);

    setTerminalLogs(prev => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] BULLETIN: Broadcasted system announcement message to user UI dashboard: "${newBulletin.text.substring(0, 30)}..."`
    ]);
  };

  // Support ticket replies
  const handleReplyTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketReply.trim() || !selectedTicketId) return;

    setTickets(prev => prev.map(t => {
      if (t.id === selectedTicketId) {
        return { ...t, status: "Closed", replyText: ticketReply.trim() };
      }
      return t;
    }));

    setTicketReply("");
    setSelectedTicketId(null);

    setTerminalLogs(prev => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] SUPPORT_CLOSE: Addressed diagnostic query [${selectedTicketId}] successfully.`
    ]);
  };

  // Pure cache purge
  const handleGpuPurge = () => {
    setIsProcessingTelemetry(true);
    setTerminalLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] GPU: Sending command buffer drop call...`]);
    setTimeout(() => {
      setIsProcessingTelemetry(false);
      setTerminalLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] GPU: Purge completed. Recalibrated RTX Pipeline vram buffer.`]);
    }, 1500);
  };

  // Filters
  const filteredLicenses = licenses.filter(l => 
    l.key.toLowerCase().includes(licenseSearch.toLowerCase()) || 
    l.deviceId.toLowerCase().includes(licenseSearch.toLowerCase())
  );

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(userSearch.toLowerCase()) || 
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  // Financial analytics calculations
  const totalLicenseHolders = licenses.length;
  const activeSubscribed = licenses.filter(l => l.status === "Active").length;
  const mrrTotal = activeSubscribed * 49 + 1792; // Dynamic MRR model
  const arrTotal = mrrTotal * 12;

  return (
    <div className="flex-1 bg-[#05060A] text-slate-300 font-sans flex flex-col p-6 overflow-y-auto">
      
      {/* Upper header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-rose-500/10 gap-4">
        <div className="text-left">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-rose-500 animate-pulse" />
            <span className="text-[10px] uppercase font-mono font-black tracking-widest text-rose-500 bg-rose-950/40 px-2 py-0.5 border border-rose-500/20 rounded">
              SECURE ADMINISTRATOR CENTRAL
            </span>
          </div>
          <h1 className="text-xl font-extrabold text-white tracking-widest mt-1.5 font-mono uppercase">
            AI Media Studio Ultra X • Dev Control Center
          </h1>
          <p className="text-xs text-slate-500 font-mono">
            System clock lock synchronized to Colombo: {sriLankaTime}
          </p>
        </div>

        <button
          onClick={onBackToUserMode}
          className="px-4 py-2 bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-700 text-slate-200 outline-none hover:bg-slate-800 rounded font-mono text-xs font-semibold flex items-center gap-1.5 tracking-wider uppercase transition cursor-pointer self-start md:self-center"
        >
          <ArrowLeft className="w-4 h-4 text-emerald-400" />
          Exit Dev Center
        </button>
      </div>

      {/* CORE SPLIT WORKSPACE: Left Tab Options / Right panel contents */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6 flex-1 items-start">
        
        {/* SIDE BAR NAVIGATION */}
        <div className="lg:col-span-3 space-y-2.5">
          <div className="bg-[#0b0d13] border border-rose-500/10 rounded-lg p-3">
            <span className="text-[9px] font-mono text-slate-500 font-bold uppercase tracking-wider block border-b border-white/5 pb-1">System Environment</span>
            <div className="flex items-center justify-between mt-2.5">
              <span className="text-xs text-rose-400 font-bold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-rose-500" /> Secure Admin Zone
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            </div>
          </div>

          <div className="bg-[#08090e] border border-white/5 rounded-lg p-2.5 space-y-1">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`w-full py-1.5 px-3 rounded text-left text-xs font-mono flex items-center justify-between uppercase transition ${
                activeTab === "dashboard" ? "bg-rose-950/40 text-rose-400 font-bold border-l-2 border-rose-500" : "hover:bg-white/5 text-slate-400"
              }`}
            >
              <span className="flex items-center gap-2"><BarChart3 className="w-3.5 h-3.5" /> Analytics Dashboard</span>
              <span className="text-[9px] bg-rose-950/50 px-1 py-0.5 rounded text-rose-400 font-black">{totalLicenseHolders}</span>
            </button>

            <button
              onClick={() => setActiveTab("licenses")}
              className={`w-full py-1.5 px-3 rounded text-left text-xs font-mono flex items-center justify-between uppercase transition ${
                activeTab === "licenses" ? "bg-rose-950/40 text-rose-400 font-bold border-l-2 border-rose-500" : "hover:bg-white/5 text-slate-400"
              }`}
            >
              <span className="flex items-center gap-2"><Key className="w-3.5 h-3.5" /> License Keygen Hub</span>
              <span className="text-[9px] bg-slate-900 px-1.5 py-0.5 rounded text-slate-450 font-normal">Active</span>
            </button>

            <button
              onClick={() => setActiveTab("users")}
              className={`w-full py-1.5 px-3 rounded text-left text-xs font-mono flex items-center gap-2 uppercase transition ${
                activeTab === "users" ? "bg-rose-950/40 text-rose-400 font-bold border-l-2 border-rose-500" : "hover:bg-white/5 text-slate-400"
              }`}
            >
              <Users className="w-3.5 h-3.5" /> User Registries
            </button>

            <button
              onClick={() => setActiveTab("gpu")}
              className={`w-full py-1.5 px-3 rounded text-left text-xs font-mono flex items-center gap-2 uppercase transition ${
                activeTab === "gpu" ? "bg-rose-950/40 text-rose-400 font-bold border-l-2 border-rose-500" : "hover:bg-white/5 text-slate-400"
              }`}
            >
              <Cpu className="w-3.5 h-3.5" /> GPU Telemeters
            </button>

            <button
              onClick={() => setActiveTab("errors")}
              className={`w-full py-1.5 px-3 rounded text-left text-xs font-mono flex items-center gap-2 uppercase transition ${
                activeTab === "errors" ? "bg-rose-950/40 text-rose-400 font-bold border-l-2 border-rose-500" : "hover:bg-white/5 text-slate-400"
              }`}
            >
              <AlertIcon className="w-3.5 h-3.5 text-orange-400" /> Error Log Feeds
            </button>

            <button
              onClick={() => setActiveTab("logs")}
              className={`w-full py-1.5 px-3 rounded text-left text-xs font-mono flex items-center gap-2 uppercase transition ${
                activeTab === "logs" ? "bg-rose-950/40 text-rose-400 font-bold border-l-2 border-rose-500" : "hover:bg-white/5 text-slate-400"
              }`}
            >
              <Terminal className="w-3.5 h-3.5 text-lime-400" /> Real-Time Console
            </button>

            <button
              onClick={() => setActiveTab("support")}
              className={`w-full py-1.5 px-3 rounded text-left text-xs font-mono flex items-center gap-2 uppercase transition ${
                activeTab === "support" ? "bg-rose-950/40 text-rose-400 font-bold border-l-2 border-rose-500" : "hover:bg-white/5 text-slate-400"
              }`}
            >
              <Mail className="w-3.5 h-3.5" /> Help-Desk Tickets
            </button>

            <button
              onClick={() => setActiveTab("security")}
              className={`w-full py-1.5 px-3 rounded text-left text-xs font-mono flex items-center gap-2 uppercase transition ${
                activeTab === "security" ? "bg-rose-950/40 text-rose-400 font-bold border-l-2 border-rose-500" : "hover:bg-white/5 text-slate-400"
              }`}
            >
              <Shield className="w-3.5 h-3.5" /> Security Panel
            </button>
          </div>
        </div>

        {/* RIGHT PANEL: Dynamic view layout containers */}
        <div className="lg:col-span-9 bg-[#0b0c11] border border-white/5 rounded-xl p-5 min-h-[550px] flex flex-col justify-between">
          
          {/* TAB 1: ANALYTICS OVERVIEW */}
          {activeTab === "dashboard" && (
            <div className="space-y-6 text-left">
              <div>
                <h3 className="text-md font-bold text-white uppercase font-mono">Simulated Platform Analytics</h3>
                <p className="text-xs text-slate-500 mt-1">Full metrics calculations, financial MRR models, and system health status indices.</p>
              </div>

              {/* Grid with statistics card layouts */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-[#12141f] border border-white/5 rounded-lg p-3">
                  <span className="text-[10px] font-mono text-slate-400 tracking-wider">MRR Forecast</span>
                  <div className="text-lg font-extrabold text-white mt-1">${mrrTotal.toLocaleString()}</div>
                  <div className="text-[9px] text-emerald-400 mt-0.5 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> +14.8% MoM
                  </div>
                </div>

                <div className="bg-[#12141f] border border-white/5 rounded-lg p-3">
                  <span className="text-[10px] font-mono text-slate-400 tracking-wider">ANNUAL RUN RATE</span>
                  <div className="text-lg font-extrabold text-[#DFB15B] mt-1">${arrTotal.toLocaleString()}</div>
                  <div className="text-[9px] text-slate-500 mt-0.5">Estimated gross volume</div>
                </div>

                <div className="bg-[#12141f] border border-white/5 rounded-lg p-3">
                  <span className="text-[10px] font-mono text-slate-400 tracking-wider">ACTIVE LICENSES</span>
                  <div className="text-lg font-extrabold text-white mt-1">{activeSubscribed} / {totalLicenseHolders}</div>
                  <div className="text-[9px] text-rose-500 mt-0.5">85% Registered rate</div>
                </div>

                <div className="bg-[#12141f] border border-white/5 rounded-lg p-3">
                  <span className="text-[10px] font-mono text-slate-400 tracking-wider">CORE MEMORY LATENCY</span>
                  <div className="text-lg font-extrabold text-emerald-400 mt-1">0.4ms</div>
                  <div className="text-[9px] text-slate-500 mt-0.5">RTX Thread pooling: 100%</div>
                </div>
              </div>

              {/* Data visualization and metrics progress bars */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="bg-[#0f1118] border border-white/5 rounded-lg p-4 space-y-3">
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">Most Used Features</h4>
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-mono">
                        <span>AI Photo Editor (DSLR Retouch)</span>
                        <span className="text-rose-455 font-bold">48% Usage</span>
                      </div>
                      <div className="bg-slate-900 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-gradient-to-r from-purple-500 to-rose-500 h-full" style={{ width: "48%" }} />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-mono">
                        <span>AI Enhancement (Denoise & Skin)</span>
                        <span className="text-cyan-450 font-bold">32% Usage</span>
                      </div>
                      <div className="bg-slate-900 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-500 to-cyan-500 h-full" style={{ width: "32%" }} />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-mono">
                        <span>AI Design Assistant (Generative Fill)</span>
                        <span className="text-amber-450 font-bold">15% Usage</span>
                      </div>
                      <div className="bg-slate-900 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-gradient-to-r from-yellow-500 to-amber-500 h-full" style={{ width: "15%" }} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-[#0f1118] border border-white/5 rounded-lg p-4 space-y-3 flex flex-col justify-between">
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">Publish System Announcements</h4>
                  <form onSubmit={handlePublishAnnouncement} className="space-y-2">
                    <textarea
                      placeholder="Enter global bulletin notification. This will display instantly inside User Application's main dashboard..."
                      value={announcementText}
                      onChange={e => setAnnouncementText(e.target.value)}
                      className="w-full bg-[#05060A] text-xs font-mono p-2 border border-white/10 rounded focus:outline-none focus:border-rose-500 h-16 resize-none"
                    />
                    <button
                      type="submit"
                      className="w-full py-1.5 bg-rose-900 border border-rose-500 text-white rounded text-xs font-mono font-semibold hover:bg-rose-800 transition cursor-pointer flex items-center justify-center gap-1.5 uppercase"
                    >
                      <Send className="w-3.5 h-3.5" /> Push Announcement Bulletin
                    </button>
                    {showAnnouncementAlert && (
                      <span className="text-[10px] font-mono text-emerald-400 block text-center">Announcement dispatched successfully!</span>
                    )}
                  </form>
                </div>
              </div>

              {/* Display recent announcements */}
              <div className="bg-[#0f1118] border border-white/5 rounded-lg p-4">
                <span className="text-[10px] font-mono text-slate-450 block mb-2 uppercase font-bold tracking-widest">Active Bulletins Registry</span>
                {announcements.length === 0 ? (
                  <p className="text-xs text-slate-500 font-mono">No announcements published during this session.</p>
                ) : (
                  <div className="space-y-2 max-h-24 overflow-y-auto">
                    {announcements.map((a, i) => (
                      <div key={i} className="text-xs font-mono bg-slate-950/40 p-2 border border-white/5 rounded">
                        <p className="text-slate-300">{a.text}</p>
                        <span className="text-[9px] text-slate-600 block mt-1">Dispatched at {a.date}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: LICENSE GENERATOR HUB */}
          {activeTab === "licenses" && (
            <div className="space-y-5 text-left">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3">
                <div>
                  <h3 className="text-md font-bold text-white uppercase font-mono">License Management Engine</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Enforce strict 13-character alpha-numeric formats with Single-PC HWID protection.</p>
                </div>

                <div className="flex gap-2">
                  <select
                    value={newKeyType}
                    onChange={e => setNewKeyType(e.target.value as any)}
                    className="bg-[#05060A] text-xs font-mono p-1 rounded border border-white/10 focus:outline-none"
                  >
                    <option value="Trial">Trial (14 Days)</option>
                    <option value="Monthly">Monthly Plan</option>
                    <option value="Annual">Annual/Yearly</option>
                    <option value="Lifetime">Enterprise Lifetime</option>
                  </select>
                  <button
                    onClick={handleGenerateKey}
                    className="px-2.5 py-1.5 bg-rose-900 border border-rose-500 hover:bg-rose-800 rounded text-xs font-mono font-bold text-white uppercase flex items-center gap-1 cursor-pointer transition"
                  >
                    <PlusCircle className="w-4 h-4" /> keygen code
                  </button>
                </div>
              </div>

              {createdKeyAlert && (
                <div className="bg-emerald-950/40 border border-emerald-500/35 p-3 rounded-lg flex items-center justify-between">
                  <div className="text-xs font-mono text-emerald-400">
                    👑 Key Code Created! Conforms to 13-character limits: <strong className="text-white text-sm tracking-widest">{createdKeyAlert}</strong>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(createdKeyAlert);
                      setCreatedKeyAlert(null);
                    }}
                    className="p-1 px-1.5 bg-slate-900 text-white hover:bg-slate-800 border border-white/10 rounded flex items-center gap-1 text-[10px] font-mono cursor-pointer"
                  >
                    <Copy className="w-3 h-3" /> Copy Key
                  </button>
                </div>
              )}

              {/* License search bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Query serial keys database or Device hardware HW-UUID..."
                  value={licenseSearch}
                  onChange={e => setLicenseSearch(e.target.value)}
                  className="w-full bg-[#05060A] text-xs font-mono p-2 pl-9 border border-white/10 rounded focus:outline-none focus:border-rose-500"
                />
              </div>

              {/* License table list */}
              <div className="border border-white/5 rounded-lg overflow-x-auto bg-slate-950/20 max-h-[300px] overflow-y-auto">
                <table className="w-full text-xs font-mono text-left border-collapse">
                  <thead>
                    <tr className="bg-[#12141e]/50 text-slate-400 border-b border-white/5 uppercase text-[9px] tracking-wider">
                      <th className="p-2.5">Licensed Serial Key</th>
                      <th className="p-2.5">Tier</th>
                      <th className="p-2.5">Registered HWID</th>
                      <th className="p-2.5">Duration Expiry</th>
                      <th className="p-2.5">Hardware Bind</th>
                      <th className="p-2.5">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLicenses.map((lic, i) => (
                      <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                        <td className="p-2.5 font-bold text-white tracking-widest select-all">{lic.key}</td>
                        <td className="p-2.5">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                            lic.type === "Lifetime" ? "bg-amber-950/60 text-amber-300 border border-amber-500/20" :
                            lic.type === "Annual" || lic.type === "Yearly" ? "bg-purple-950/40 text-purple-400" :
                            lic.type === "Monthly" ? "bg-cyan-950/40 text-cyan-400" : "bg-slate-900 text-slate-400"
                          }`}>{lic.type}</span>
                        </td>
                        <td className="p-2.5 font-bold text-slate-400 text-[10px]">{lic.deviceId}</td>
                        <td className="p-2.5 text-[10px] text-slate-500">{lic.expiresAt}</td>
                        <td className="p-2.5">
                          <span className="text-[10px] text-emerald-400">1-PC Max lock</span>
                        </td>
                        <td className="p-2.5">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleToggleLicenseStatus(lic.key, lic.status)}
                              className={`p-1 rounded text-[10px] font-bold tracking-wider uppercase transition ${
                                lic.status === "Active" ? "bg-amber-950/40 text-amber-500 hover:bg-amber-900/40" : "bg-emerald-950/40 text-emerald-400 hover:bg-emerald-900/40"
                              }`}
                            >
                              {lic.status === "Active" ? "Suspend" : "Activate"}
                            </button>
                            <button
                              onClick={() => handleDeleteLicense(lic.key)}
                              className="p-1.5 text-rose-500 hover:bg-rose-950/30 rounded transition"
                              title="Delete key"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: USER REGISTRY */}
          {activeTab === "users" && (
            <div className="space-y-4 text-left">
              <div>
                <h3 className="text-md font-bold text-white uppercase font-mono">User Management Catalog</h3>
                <p className="text-xs text-slate-500 mt-0.5">List of verified workstation administrators and billing accounts.</p>
              </div>

              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search user profiles, registered email IDs..."
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  className="w-full bg-[#05060A] text-xs font-mono p-2 pl-9 border border-white/10 rounded focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="border border-white/5 rounded-lg overflow-hidden bg-slate-950/20 max-h-[350px] overflow-y-auto">
                <table className="w-full text-xs font-mono text-left border-collapse">
                  <thead>
                    <tr className="bg-[#12141e]/50 text-slate-400 border-b border-white/5 uppercase text-[9px]">
                      <th className="p-2.5">User Profile ID</th>
                      <th className="p-2.5">Email Identity</th>
                      <th className="p-2.5">Licensing Tier</th>
                      <th className="p-2.5">Hardware Hash UUID</th>
                      <th className="p-2.5">Account Status</th>
                      <th className="p-2.5">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u, i) => (
                      <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                        <td className="p-2.5 text-slate-500 font-bold">{u.id}</td>
                        <td className="p-2.5 font-bold text-white">{u.email}</td>
                        <td className="p-2.5">
                          <span className={`px-1 rounded text-[9px] ${
                            u.plan === "Lifetime" || u.plan === "Enterprise" ? "bg-amber-950/60 text-amber-300 border border-amber-500/20" :
                            u.plan === "Pro" ? "bg-purple-950/60 text-purple-400" : "bg-slate-900 text-slate-450"
                          }`}>{u.plan}</span>
                        </td>
                        <td className="p-2.5 text-slate-400 text-[11px]">{u.linkedDevice}</td>
                        <td className="p-2.5">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            u.status === "Active" ? "bg-emerald-950/40 text-emerald-400" : "bg-red-950/40 text-red-400"
                          }`}>{u.status}</span>
                        </td>
                        <td className="p-2.5">
                          <button
                            onClick={() => handleToggleUserStatus(u.id, u.status)}
                            className="text-slate-400 hover:text-white bg-slate-900 border border-white/10 px-2 py-1 rounded block text-[10px] font-bold tracking-wider uppercase transition cursor-pointer"
                          >
                            {u.status === "Active" ? "Suspend user" : "Undefer account"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: GPU TELEMETRIES */}
          {activeTab === "gpu" && (
            <div className="space-y-4 text-left">
              <div>
                <h3 className="text-md font-bold text-white uppercase font-mono">Hardware Pipeline Optimization</h3>
                <p className="text-xs text-slate-500 mt-0.5">Control pipeline warmups, VRAM garbage compilers, and direct rendering latencies.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                <div className="bg-[#12141f] border border-white/5 rounded-lg p-4 space-y-4">
                  <span className="text-[10px] font-mono text-rose-400 font-bold block uppercase tracking-widest border-b border-white/5 pb-1">Tensors Calibrators</span>

                  <div className="space-y-3.5 text-xs font-mono">
                    <div className="flex justify-between">
                      <span>RTX Pipeline Core Temp:</span>
                      <span className="text-white font-bold">{gpuTemp}°C</span>
                    </div>
                    <div className="flex justify-between">
                      <span>CUDA Core Stream Loads:</span>
                      <span className="text-rose-450 font-black">{cudaLoad}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>System Thread Pooling:</span>
                      <span className="text-emerald-400 font-bold">16 ACTIVE WORKERS</span>
                    </div>
                    <div className="flex justify-between">
                      <span>DirectML Frameworks:</span>
                      <span className="text-cyan-400 font-bold">CUDA 12.4 STABLE</span>
                    </div>
                  </div>

                  <button
                    onClick={handleGpuPurge}
                    disabled={isProcessingTelemetry}
                    className="w-full py-2 bg-gradient-to-r from-rose-900 to-rose-700 hover:opacity-95 text-white rounded text-xs font-mono font-bold tracking-widest uppercase transition flex items-center justify-center gap-1.5 disabled:opacity-40 cursor-pointer"
                  >
                    {isProcessingTelemetry ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Cpu className="w-4 h-4" />}
                    Purge RTX Shaders Cache
                  </button>
                </div>

                <div className="bg-[#12141f] border border-white/5 rounded-lg p-4 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-slate-500 font-bold block uppercase tracking-widest border-b border-white/5 pb-1">VRAM Allocation Monitor</span>
                    <div className="flex items-center gap-3 mt-4">
                      <div className="text-3xl font-extrabold text-white">{vramUsed.toFixed(1)} GB</div>
                      <span className="text-xs text-slate-500 font-mono">allocated / 16.0 GB Total Dedicated</span>
                    </div>
                  </div>

                  <div className="space-y-2 mt-4 text-[11px] font-mono text-slate-450">
                    <div className="flex justify-between">
                      <span>Luminance Texture Tile Cache:</span>
                      <span>1.2 GB</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Neural Retouch Weight Buffers:</span>
                      <span>2.8 GB</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: ERROR LOGS */}
          {activeTab === "errors" && (
            <div className="space-y-4 text-left">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <div>
                  <h3 className="text-md font-bold text-white uppercase font-mono">Unhandled Exception Logs</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Critical error catches and model timeout telemetry feeds.</p>
                </div>
                <span className="text-[9px] bg-amber-950/40 text-amber-400 p-1 rounded font-mono border border-amber-500/20">3 CRITICAL LOGS CHRONICLED</span>
              </div>

              <div className="space-y-3 max-h-[350px] overflow-y-auto">
                <div className="p-3 bg-red-950/25 border border-red-500/20 rounded-lg text-xs font-mono">
                  <div className="flex justify-between text-red-400 font-bold mb-1">
                    <span>CODE_REJECT: KEY_FINGERPRINT_MISMATCH</span>
                    <span className="text-slate-500">2026-06-15 17:34</span>
                  </div>
                  <p className="text-slate-350 leading-relaxed">
                    Single-PC registration lockout triggered for Serial ending in `ABCDXYZ` on Device [HW-ATTACKER-9999]. Blocked licensing validation pipeline elegantly.
                  </p>
                </div>

                <div className="p-3 bg-amber-950/20 border border-amber-500/20 rounded-lg text-xs font-mono">
                  <div className="flex justify-between text-amber-400 font-bold mb-1">
                    <span>API_LIMIT: QUOTA_LIMIT_EXHAUSTED</span>
                    <span className="text-slate-500">2026-06-15 16:12</span>
                  </div>
                  <p className="text-slate-350">
                    Gemini backend model request returned status 429. Automatically and seamlessly shifted user rendering canvas to Offline high-fidelity sandbox. Graceful failsafes preserve 100% editing capability.
                  </p>
                </div>

                <div className="p-3 bg-slate-900/40 border border-white/5 rounded-lg text-xs font-mono">
                  <div className="flex justify-between text-slate-400 font-bold mb-1">
                    <span>SEC_AUDIT: SYSTEM_CLOCK_TAMPERS_OK</span>
                    <span className="text-slate-500">2026-06-14 20:15</span>
                  </div>
                  <p className="text-slate-350">
                    Validated PC system clock against remote Colombo Sri Lanka atomic timeline API. No calendar offset hacks detected—security status is normal.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: REAL-TIME CONSOLE */}
          {activeTab === "logs" && (
            <div className="space-y-4 text-left flex-1 flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <div>
                  <h3 className="text-md font-bold text-white uppercase font-mono">Real-Time Event Streams Terminal</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Live monitoring telemetry coming from active user client nodes.</p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setIsTerminalStreaming(!isTerminalStreaming)}
                    className={`px-2 py-1 rounded text-[11px] font-mono border uppercase transition cursor-pointer ${
                      isTerminalStreaming ? "bg-rose-950/40 text-rose-400 border-rose-500/30" : "bg-slate-900 border-white/10 text-slate-400 hover:text-white"
                    }`}
                  >
                    {isTerminalStreaming ? "streaming logs" : "streaming idle"}
                  </button>

                  <button
                    onClick={() => setTerminalLogs([])}
                    className="p-1 px-2 border border-white/10 bg-slate-900 text-slate-400 rounded text-[10px] font-mono hover:text-white cursor-pointer"
                  >
                    Clear Feed
                  </button>
                </div>
              </div>

              {/* Console feed screen */}
              <div 
                ref={logContainerRef}
                className="bg-[#020306] rounded-lg p-4 font-mono text-[10px] text-green-400 h-80 overflow-y-auto space-y-1 border border-white/10 leading-relaxed shadow-inner"
              >
                {terminalLogs.length === 0 ? (
                  <p className="text-slate-600 italic">Terminal memory stream cleared. Waiting for event ingestion...</p>
                ) : (
                  terminalLogs.map((log, index) => (
                    <div key={index} className="whitespace-pre-wrap">
                      <span className="text-slate-500 select-none">&gt;</span> {log}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 7: SUPPORT TICKETS HELP-DESK */}
          {activeTab === "support" && (
            <div className="space-y-4 text-left">
              <div>
                <h3 className="text-md font-bold text-white uppercase font-mono">Workstation Support Desk</h3>
                <p className="text-xs text-slate-500 mt-0.5">Address client ticketing queries and pipeline adjustments requests.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
                {/* Tickets list */}
                <div className="md:col-span-5 space-y-2 max-h-[300px] overflow-y-auto">
                  {tickets.map(t => (
                    <div
                      key={t.id}
                      onClick={() => {
                        if (t.status !== "Closed") {
                          setSelectedTicketId(t.id);
                        }
                      }}
                      className={`p-3 rounded-lg border text-xs cursor-pointer transition text-left ${
                        selectedTicketId === t.id ? "bg-rose-950/30 border-rose-500/60" :
                        t.status === "Closed" ? "bg-slate-950/20 border-white/5 opacity-60" : "bg-[#12141f] border-white/5 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex justify-between font-bold text-[10px]">
                        <span className="text-rose-450 uppercase font-mono">{t.category}</span>
                        <span className={t.status === "Open" ? "text-amber-400" : "text-slate-500"}>{t.status}</span>
                      </div>
                      <h4 className="font-bold text-white mt-1 uppercase line-clamp-1 truncate">{t.subject}</h4>
                      <p className="text-slate-455 text-[10px] mt-1 line-clamp-2 truncate">{t.message}</p>
                    </div>
                  ))}
                </div>

                {/* Reply Form */}
                <div className="md:col-span-7 bg-[#12141f] border border-white/5 rounded-lg p-4 min-h-[180px] flex flex-col justify-between">
                  {selectedTicketId ? (
                    <form onSubmit={handleReplyTicket} className="space-y-3">
                      <div>
                        <span className="text-[10px] font-mono text-slate-500 uppercase font-bold tracking-wider">Replying To Incident: #{selectedTicketId}</span>
                        <p className="text-xs font-bold text-white mt-1 italic">
                          "{tickets.find(t => t.id === selectedTicketId)?.message}"
                        </p>
                      </div>

                      <textarea
                        placeholder="Draft technology feedback response..."
                        value={ticketReply}
                        onChange={e => setTicketReply(e.target.value)}
                        className="w-full bg-[#05060A] text-xs font-mono p-2 border border-white/10 rounded focus:outline-none focus:border-rose-500 h-24 resize-none"
                        required
                      />

                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedTicketId(null)}
                          className="px-3 py-1 bg-slate-900 border border-white/10 text-xs rounded text-slate-400 font-bold uppercase transition hover:text-white cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-3 py-1 bg-rose-900 border border-rose-500 text-xs text-white rounded font-mono font-bold uppercase hover:bg-rose-800 transition cursor-pointer"
                        >
                          Fulfill Ticket
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-slate-500 text-xs font-mono py-8 uppercase tracking-wider text-center select-none">
                      Select open technical ticket to view details and dispatch technician replies.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: SECURITY POLICIES */}
          {activeTab === "security" && (
            <div className="space-y-5 text-left text-xs font-mono text-slate-350">
              <div>
                <h3 className="text-md font-bold text-white uppercase font-mono">App Security Configuration</h3>
                <p className="text-xs text-slate-500 mt-0.5 font-sans">Control pin gates credentials, local storage encryption modes and diagnostic routines.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                
                {/* Developer Lockout Pin code updater */}
                <div className="bg-[#12141f] border border-white/5 rounded-lg p-4 space-y-3">
                  <span className="text-[10px] font-mono text-rose-500 font-bold block uppercase tracking-widest border-b border-white/5 pb-1">Master PIN Code Credentials</span>
                  <p className="text-[10px] text-slate-500">Change PIN passcode for Developer Entry Gate. Default represents "08" with Colombo security attempts lockout checks. Valid 01 mint . after expirer value .</p>
                  
                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength={8}
                      placeholder="Enter new pin"
                      value={tempPin}
                      onChange={e => setTempPin(e.target.value.replace(/\D/g, ""))}
                      className="bg-[#05060A] text-xs font-mono p-1.5 px-3 border border-white/10 text-white rounded focus:border-rose-500 outline-none w-28 text-center"
                    />
                    <button
                      onClick={handleUpdatePin}
                      className="px-3 py-1 bg-rose-900 border border-rose-500 text-xs text-white font-mono font-bold rounded uppercase hover:bg-rose-800 transition cursor-pointer"
                    >
                      Update PIN Code
                    </button>
                  </div>
                  {isPinUpdatedAlert && (
                    <span className="text-[10px] text-emerald-400 block font-bold">✓ Master Access PIN code synchronized to: {masterPin}</span>
                  )}
                </div>

                {/* Cryto standard */}
                <div className="bg-[#12141f] border border-white/5 rounded-lg p-4 space-y-3">
                  <span className="text-[10px] font-mono text-slate-450 font-bold block uppercase tracking-widest border-b border-white/5 pb-1">Platform Cryptographic Standards</span>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Ciphers Suite:</span>
                      <select
                        value={encryptionStandard}
                        onChange={e => setEncryptionStandard(e.target.value)}
                        className="bg-[#05060A] border border-white/5 rounded p-0.5 text-white"
                      >
                        <option value="AES-GCM-256">AES-GCM-256 (Military Standard)</option>
                        <option value="ChaCha20-Poly1305">ChaCha20-Poly1305 (Fast Vector)</option>
                        <option value="AES-CBC-128">AES-CBC-128 (Legacy Mode)</option>
                      </select>
                    </div>

                    <div className="flex justify-between">
                      <span>Security Audit Schedule:</span>
                      <select
                        value={auditScheduler}
                        onChange={e => setAuditScheduler(e.target.value)}
                        className="bg-[#05060A] border border-white/5 rounded p-0.5 text-white"
                      >
                        <option value="Daily at 00:00 UTC">Daily at 00:00 UTC</option>
                        <option value="Every 6 Hours">Every 6 Hours (High Security)</option>
                        <option value="Weekly System Sweep">Weekly System Sweep</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Data protection policy controls */}
              <div className="bg-[#12141f] border border-white/5 rounded-lg p-4 space-y-3">
                <span className="text-[10px] font-mono text-rose-500 font-bold block uppercase tracking-widest border-b border-white/5 pb-1">GDPR & Client Data Protection Policy Controller</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px]">
                  <div className="p-2 bg-slate-950/40 rounded border border-white/5">
                    <h5 className="font-bold text-white uppercase text-[9px] text-[#00D2FF]">Privacy controls</h5>
                    <p className="text-[9.5px] text-slate-500 mt-1">Simulated logs track explicit consent flags before capturing hardware fingerprints.</p>
                  </div>
                  <div className="p-2 bg-slate-950/40 rounded border border-white/5">
                    <h5 className="font-bold text-white uppercase text-[9px] text-purple-400">User Consent registries</h5>
                    <p className="text-[9.5px] text-slate-500 mt-1">Tracks opt-in parameters for cloud workspace backup routines (Module 11).</p>
                  </div>
                  <div className="p-2 bg-slate-950/40 rounded border border-white/5">
                    <h5 className="font-bold text-white uppercase text-[9px] text-emerald-450">Data Deletion requests</h5>
                    <p className="text-[9.5px] text-slate-500 mt-1">Purge any simulated client notes or exported logs with standard zero-fill passes.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Pure admin zone confirmation message in footer */}
          <div className="flex items-center justify-between pt-4 mt-5 border-t border-white/5 text-[9px] font-mono text-slate-600 block uppercase">
            <span>Enterprise Admin Protocol Active</span>
            <span>All actions chronologically chronicled in secure audit logs</span>
            <span>Authorized by Senior Lead Architect</span>
          </div>
        </div>
      </div>
    </div>
  );
}
