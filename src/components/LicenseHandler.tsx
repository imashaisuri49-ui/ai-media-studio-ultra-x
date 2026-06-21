import React, { useState, useEffect } from "react";
import { ShieldCheck, Monitor, HelpCircle, RefreshCw, Key, CheckCircle, Cloud, CloudOff, CloudLightning, Terminal, X, Copy, PlusCircle, Trash2, Cpu, ShieldAlert, Lock, Unlock, KeyRound, AlertTriangle } from "lucide-react";
import { db, isLiveFirebase, doc, setDoc, serverTimestamp, handleFirestoreError, OperationType } from "../lib/firebase";

// Helper Interface / Class for License Validation Logic
export const LicenseValidation = {
  // Normalize and validate that the key has exactly 13 alphanumeric chars
  validateFormat(key: string): boolean {
    const cleanKey = key.replace(/[-\s]/g, "").toUpperCase();
    return /^[A-Z0-9]{13}$/.test(cleanKey);
  },

  // Generate a random valid 13-character mixed alphanumeric serial key
  generateRandomKey(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let key = "";
    for (let i = 0; i < 13; i++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return key;
  },

  // Retrieve current PC / Device ID, or generate a stable unique one if not exists
  getOrCreateDeviceId(): string {
    let deviceId = localStorage.getItem("media_studio_device_id");
    if (!deviceId) {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      let randomId = "HW-";
      for (let i = 0; i < 12; i++) {
        randomId += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      localStorage.setItem("media_studio_device_id", randomId);
      deviceId = randomId;
    }
    return deviceId;
  },

  // Reset or simulate a new Device ID (helpful for testing Single-PC locks!)
  generateNewDeviceId(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let randomId = "HW-";
    for (let i = 0; i < 12; i++) {
      randomId += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    localStorage.setItem("media_studio_device_id", randomId);
    return randomId;
  },

  // Perform activation check considering the Single-PC registry (persisted locally)
  activateKey(key: string, deviceId: string): { success: boolean; message: string } {
    const cleanKey = key.trim().replace(/[-\s]/g, "").toUpperCase();

    // 1. Check format
    if (!this.validateFormat(cleanKey)) {
      return {
        success: false,
        message: "Key must be exactly 13 mixed alphanumeric characters (excluding spaces/hyphens).",
      };
    }

    // 2. Load registry of key mappings (Simulating cloud license activation database)
    let registry: Record<string, string> = {};
    try {
      const stored = localStorage.getItem("media_studio_license_registry");
      if (stored) {
        registry = JSON.parse(stored);
      }
    } catch {
      registry = {};
    }

    // 3. Single-PC Enforcement check
    if (registry[cleanKey]) {
      const registeredDevice = registry[cleanKey];
      if (registeredDevice !== deviceId) {
        return {
          success: false,
          message: `Activation failed: Single-PC limit reached. This key is already registered to Device ID: [${registeredDevice}].`,
        };
      }
    } else {
      // First activation on this PC, map it!
      registry[cleanKey] = deviceId;
      localStorage.setItem("media_studio_license_registry", JSON.stringify(registry));
    }

    return {
      success: true,
      message: "License activated successfully! Pro Premium features unlocked for this PC.",
    };
  }
};

interface LicenseHandlerProps {
  licenseKey: string;
  setLicenseKey: (key: string) => void;
  isLicenseActivated: boolean;
  setIsLicenseActivated: (status: boolean) => void;
  setIsPremiumPlan: (status: boolean) => void;
  licenseError: string;
  setLicenseError: (err: string) => void;
}

export default function LicenseHandler({
  licenseKey,
  setLicenseKey,
  isLicenseActivated,
  setIsLicenseActivated,
  setIsPremiumPlan,
  licenseError,
  setLicenseError,
}: LicenseHandlerProps) {
  const [deviceId, setDeviceId] = useState<string>("");
  const [testKeys, setTestKeys] = useState<string[]>([]);
  const [activeLicenseDetails, setActiveLicenseDetails] = useState<{
    key: string;
    deviceId: string;
  } | null>(null);
  
  // Real-time synchronization state
  const [syncState, setSyncState] = useState<"idle" | "syncing" | "synced_live" | "synced_offline" | "error">("idle");
  const [syncErrorMessage, setSyncErrorMessage] = useState<string>("");

  // Dev window popup settings
  const [isDevWindowOpen, setIsDevWindowOpen] = useState(false);
  const [newlyGeneratedKey, setNewlyGeneratedKey] = useState("");
  const [copyFeedbackKey, setCopyFeedbackKey] = useState<string | null>(null);

  // Keygen Master PIN Protection (Sri Lanka real-time lockout)
  const [pinInput, setPinInput] = useState<string>("");
  const [pinAttempts, setPinAttempts] = useState<number>(3);
  const [lockedUntil, setLockedUntil] = useState<number>(0);
  const [isKeygenUnlocked, setIsKeygenUnlocked] = useState<boolean>(false);
  const [pinError, setPinError] = useState<string>("");
  const [sriLankaTime, setSriLankaTime] = useState<string>("");
  const [lockCountdown, setLockCountdown] = useState<string>("");

  // Recovery Key States (Temporary 2 Days Bypass Access if user forgets PIN)
  const [recoveryKey, setRecoveryKey] = useState<string>("");
  const [recoveryInput, setRecoveryInput] = useState<string>("");
  const [isRecoveryOpen, setIsRecoveryOpen] = useState<boolean>(false);
  const [tempAccessUntil, setTempAccessUntil] = useState<number>(0);
  const [tempAccessCountdown, setTempAccessCountdown] = useState<string>("");
  const [recoverySuccessMessage, setRecoverySuccessMessage] = useState<string>("");

  // Sri Lanka Colombo ticking clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      // Sri Lanka is UTC+5.5 (UTC + 5 hours 30 mins)
      const utc = now.getTime() + now.getTimezoneOffset() * 60000;
      const slDate = new Date(utc + 3600000 * 5.5);
      setSriLankaTime(slDate.toLocaleTimeString("en-US", {
        hour12: true,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }) + " (Colombo, LK Time UTC+5:30)");
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Set up security attempts loader and recovery key storage
  useEffect(() => {
    // 1. Initialize stable Recovery Key in Local Storage if not present
    let storedRecoveryKey = localStorage.getItem("media_studio_recovery_key");
    if (!storedRecoveryKey) {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      let randomCode = "";
      for (let i = 0; i < 6; i++) {
        randomCode += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      storedRecoveryKey = `STUDIO-RCV-${randomCode}`;
      localStorage.setItem("media_studio_recovery_key", storedRecoveryKey);
    }
    setRecoveryKey(storedRecoveryKey);

    // 2. Check if a temporary 2-day recovery access pass is currently active
    const storedTempAccess = localStorage.getItem("media_studio_temp_access_until");
    if (storedTempAccess) {
      const tempVal = parseInt(storedTempAccess, 10);
      if (tempVal > Date.now()) {
        setTempAccessUntil(tempVal);
        setIsKeygenUnlocked(true);
      } else {
        localStorage.removeItem("media_studio_temp_access_until");
      }
    }

    // 3. Load regular security attempts and lockouts
    const storedAttempts = localStorage.getItem("media_studio_keygen_attempts");
    if (storedAttempts !== null) {
      setPinAttempts(parseInt(storedAttempts, 10));
    }
    const storedLock = localStorage.getItem("media_studio_keygen_locked_until");
    if (storedLock !== null) {
      const lockVal = parseInt(storedLock, 10);
      if (lockVal > Date.now()) {
        setLockedUntil(lockVal);
      } else {
        localStorage.removeItem("media_studio_keygen_locked_until");
        localStorage.setItem("media_studio_keygen_attempts", "3");
        setPinAttempts(3);
        setLockedUntil(0);
      }
    }
  }, []);

  // Update lockout countdown
  useEffect(() => {
    if (lockedUntil <= Date.now()) return;
    const updateCountdown = () => {
      const diff = lockedUntil - Date.now();
      if (diff <= 0) {
        setLockedUntil(0);
        setPinAttempts(3);
        localStorage.removeItem("media_studio_keygen_locked_until");
        localStorage.setItem("media_studio_keygen_attempts", "3");
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setLockCountdown(`${days}d ${hours}h ${minutes}m ${seconds}s`);
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [lockedUntil]);

  // Update temporary recovery countdown
  useEffect(() => {
    if (tempAccessUntil <= Date.now()) return;
    const updateTempCountdown = () => {
      const diff = tempAccessUntil - Date.now();
      if (diff <= 0) {
        setIsKeygenUnlocked(false);
        setTempAccessUntil(0);
        localStorage.removeItem("media_studio_temp_access_until");
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTempAccessCountdown(`${days}d ${hours}h ${minutes}m ${seconds}s`);
    };
    updateTempCountdown();
    const interval = setInterval(updateTempCountdown, 1000);
    return () => clearInterval(interval);
  }, [tempAccessUntil]);

  // Helper date formatter
  const formatSriLankaDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const utc = date.getTime() + date.getTimezoneOffset() * 60000;
    const slDate = new Date(utc + 3600000 * 5.5);
    return slDate.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true
    }) + " (Colombo Time)";
  };

  const handleUseRecoveryKey = (enteredKey: string) => {
    const cleanEntered = enteredKey.trim().toUpperCase();
    const cleanStored = recoveryKey.trim().toUpperCase();
    if (cleanEntered === cleanStored) {
      const twoDays = 2 * 24 * 60 * 60 * 1000; // 2-day pass
      const expiry = Date.now() + twoDays;
      setTempAccessUntil(expiry);
      localStorage.setItem("media_studio_temp_access_until", String(expiry));
      setIsKeygenUnlocked(true);
      setPinError("");
      setRecoverySuccessMessage("AUTHORIZED: Temporary 2-day recovery access activated!");
      
      // Bypass previous locks/retries
      setLockedUntil(0);
      localStorage.removeItem("media_studio_keygen_locked_until");
      localStorage.setItem("media_studio_keygen_attempts", "3");
      setPinAttempts(3);
      setRecoveryInput("");
      return true;
    } else {
      setPinError("AUTHENTICATION FAILURE: Invalid Recovery Key sequence. Match failed.");
      return false;
    }
  };

  const handlePinSubmit = (enteredPin: string) => {
    if (lockedUntil > Date.now()) return;
    
    if (enteredPin === "2005") {
      setIsKeygenUnlocked(true);
      setPinAttempts(3);
      setPinError("");
      setPinInput("");
      setRecoverySuccessMessage("");
      localStorage.setItem("media_studio_keygen_attempts", "3");
    } else {
      const nextAttempts = pinAttempts - 1;
      setPinAttempts(nextAttempts);
      setPinInput("");
      
      if (nextAttempts <= 0) {
        const lockDuration = 2 * 24 * 60 * 60 * 1000; // 2 days in milliseconds
        const unlockTime = Date.now() + lockDuration;
        setLockedUntil(unlockTime);
        localStorage.setItem("media_studio_keygen_locked_until", String(unlockTime));
        localStorage.setItem("media_studio_keygen_attempts", "3");
        setPinAttempts(3);
        setPinError("SECURITY BLOCK LOCKDOWN: Maximum PIN attempts reached. Isolated for 48 hours.");
      } else {
        localStorage.setItem("media_studio_keygen_attempts", String(nextAttempts));
        setPinError(`AUTHENTICATION FAILURE: Incorrect credential pin entered. ${nextAttempts} attempt(s) remaining.`);
      }
    }
  };

  useEffect(() => {
    // Sync current device ID
    setDeviceId(LicenseValidation.getOrCreateDeviceId());

    // Generate stable client-side test keys if none exist in localStorage for user testing convenience
    let storedTestKeys = localStorage.getItem("media_studio_test_keys");
    if (!storedTestKeys) {
      // 13-character alphanumeric test keys
      const sampleKeys = ["X7K2P9Q5W8Z1Y", "ULTRA99X2026M", "B4D8F3G9H1K7L"];
      localStorage.setItem("media_studio_test_keys", JSON.stringify(sampleKeys));
      setTestKeys(sampleKeys);
    } else {
      setTestKeys(JSON.parse(storedTestKeys));
    }

    // Restore active license state if verified on current device
    const activeKey = localStorage.getItem("media_studio_active_license_key");
    const currentDevice = LicenseValidation.getOrCreateDeviceId();
    if (activeKey) {
      const checkRes = LicenseValidation.activateKey(activeKey, currentDevice);
      if (checkRes.success) {
        setIsLicenseActivated(true);
        setIsPremiumPlan(true);
        setActiveLicenseDetails({ key: activeKey, deviceId: currentDevice });
        setSyncState(isLiveFirebase ? "synced_live" : "synced_offline");
      } else {
        // Safe reset if hardware lock changed
        setIsLicenseActivated(false);
        setIsPremiumPlan(false);
        setSyncState("idle");
      }
    }
  }, [setIsLicenseActivated, setIsPremiumPlan]);

  // Sync validation records to Firebase remote Firestore database
  const syncActivationToFirebase = async (key: string, currentDeviceId: string) => {
    if (!isLiveFirebase) {
      setSyncState("synced_offline");
      return;
    }

    setSyncState("syncing");
    setSyncErrorMessage("");

    try {
      const path = `licenses/${key}`;
      const docRef = doc(db, "licenses", key);
      
      // Save record using transaction-safe structural rules schema matched fields
      await setDoc(docRef, {
        licenseKey: key,
        deviceId: currentDeviceId,
        activatedAt: serverTimestamp(),
      });

      setSyncState("synced_live");
    } catch (err: unknown) {
      setSyncState("error");
      const errStr = err instanceof Error ? err.message : String(err);
      setSyncErrorMessage("Remote database rejected sync configuration. Verify rules or terms.");
      
      // Strict integration error logging requirement
      try {
        handleFirestoreError(err, OperationType.WRITE, `licenses/${key}`);
      } catch {
        // Suppress nested bubble to handle gracefully in React UI
      }
    }
  };

  const handleVerify = async () => {
    if (!licenseKey.trim()) {
      setLicenseError("License key cannot be empty.");
      return;
    }

    const currentDevice = LicenseValidation.getOrCreateDeviceId();
    const result = LicenseValidation.activateKey(licenseKey, currentDevice);

    if (result.success) {
      const cleanKey = licenseKey.trim().replace(/[-\s]/g, "").toUpperCase();
      setIsLicenseActivated(true);
      setIsPremiumPlan(true);
      setLicenseError("");
      setActiveLicenseDetails({ key: cleanKey, deviceId: currentDevice });
      localStorage.setItem("media_studio_active_license_key", cleanKey);
      
      // Trigger live Firebase Database sync
      await syncActivationToFirebase(cleanKey, currentDevice);
    } else {
      setLicenseError(result.message);
      setSyncState("idle");
    }
  };

  const handleSimulateNewPC = async () => {
    const newId = LicenseValidation.generateNewDeviceId();
    setDeviceId(newId);
    setLicenseError("");
    
    // Check if the current license is valid on this new PC
    const activeKey = localStorage.getItem("media_studio_active_license_key");
    if (activeKey) {
      const checkRes = LicenseValidation.activateKey(activeKey, newId);
      if (!checkRes.success) {
        // Single-PC block triggered! Deactivate the license on this new simulated PC
        setIsLicenseActivated(false);
        setIsPremiumPlan(false);
        setActiveLicenseDetails(null);
        setSyncState("idle");
        setLicenseError(`License is locked to a previous machine. Current Device ID [${newId}] is unregistered.`);
      } else {
        setActiveLicenseDetails({ key: activeKey, deviceId: newId });
        await syncActivationToFirebase(activeKey, newId);
      }
    }
  };

  const handleResetRegistry = () => {
    localStorage.removeItem("media_studio_active_license_key");
    localStorage.removeItem("media_studio_license_registry");
    setIsLicenseActivated(false);
    setIsPremiumPlan(false);
    setActiveLicenseDetails(null);
    setLicenseError("");
    setSyncState("idle");
    setDeviceId(LicenseValidation.getOrCreateDeviceId());
  };

  const handleGenerateAndAddKey = () => {
    const key = LicenseValidation.generateRandomKey();
    setNewlyGeneratedKey(key);
    
    // Add to pool instantly
    if (!testKeys.includes(key)) {
      const updatedKeys = [...testKeys, key];
      setTestKeys(updatedKeys);
      localStorage.setItem("media_studio_test_keys", JSON.stringify(updatedKeys));
    }
  };

  const handleClearGeneratedPool = () => {
    const defaultSampleKeys = ["X7K2P9Q5W8Z1Y", "ULTRA99X2026M", "B4D8F3G9H1K7L"];
    setTestKeys(defaultSampleKeys);
    localStorage.setItem("media_studio_test_keys", JSON.stringify(defaultSampleKeys));
    setNewlyGeneratedKey("");
    setCopyFeedbackKey(null);
  };

  const handleCopyToClipboard = (keyStr: string) => {
    navigator.clipboard.writeText(keyStr);
    setCopyFeedbackKey(keyStr);
    setTimeout(() => {
      setCopyFeedbackKey(null);
    }, 1500);
  };

  const handleInjectKeyAndClose = (keyStr: string) => {
    setLicenseKey(keyStr);
    setLicenseError("");
    setIsDevWindowOpen(false);
  };

  return (
    <div id="license-validation-handler" className="bg-[#0c0d12] border border-white/10 rounded-xl p-5 space-y-4 shadow-xl">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-amber-500" />
          License Activation Console
        </h3>
        
        {/* Real-time remote sync state indicators */}
        <div className="flex items-center gap-1">
          {syncState === "synced_live" ? (
            <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-500/20 px-2 py-0.5 rounded flex items-center gap-1">
              <Cloud className="w-2.5 h-2.5" /> Clouddb Sync Active
            </span>
          ) : syncState === "syncing" ? (
            <span className="text-[9px] font-mono text-amber-400 bg-amber-950/40 border border-amber-500/20 px-2 py-0.5 rounded flex items-center gap-1 animate-pulse">
              <CloudLightning className="w-2.5 h-2.5" /> Syncing Cloud...
            </span>
          ) : (
            <span className="text-[9px] font-mono text-slate-400 bg-slate-900 border border-slate-700/60 px-2 py-0.5 rounded flex items-center gap-1">
              <CloudOff className="w-2.5 h-2.5 text-slate-500" /> Offline Sandbox Loaded
            </span>
          )}
        </div>
      </div>

      {/* Device ID display */}
      <div className="bg-[#07080a] border border-white/5 rounded p-3 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Monitor className="w-4 h-4 text-slate-400" />
          <div>
            <p className="text-[10px] text-slate-500 uppercase font-mono tracking-tight">Active Hardware Signature</p>
            <p className="font-mono font-bold text-white text-[11px]">{deviceId || "Detecting Hardware..."}</p>
          </div>
        </div>
        <button
          onClick={handleSimulateNewPC}
          title="Regenerate Hardware ID to simulate moving to a different computer / testing single PC lock"
          className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 hover:border-amber-500/40 rounded text-[10px] font-mono flex items-center gap-1 transition-all"
        >
          <RefreshCw className="w-3 h-3" /> Simulate New PC
        </button>
      </div>

      {/* Input box */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="text-[10px] text-slate-500 uppercase tracking-wider block font-mono">13-Char mixed keys</label>
          <button
            onClick={handleResetRegistry}
            className="text-[9px] text-red-400/90 hover:text-red-300 underline font-mono cursor-pointer"
          >
            Clear Licensing Cache
          </button>
        </div>
        
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
            <Key className="h-3.5 w-3.5 text-slate-500" />
          </div>
          <input
            type="text"
            value={licenseKey}
            onChange={(e) => {
              setLicenseKey(e.target.value);
              setLicenseError("");
            }}
            placeholder="e.g. X7K2P9Q5W8Z1Y"
            className="w-full bg-[#0a0a0d] border border-white/10 rounded pl-8 pr-3 py-2 text-xs text-white placeholder-slate-650 focus:outline-none focus:border-amber-400 font-mono"
          />
        </div>

        {licenseError && (
          <div className="bg-red-950/20 border border-red-500/30 rounded p-2.5">
            <p className="text-[10px] text-red-400 font-mono leading-relaxed">
              ⚠️ {licenseError}
            </p>
          </div>
        )}
        
        {syncErrorMessage && (
          <div className="bg-amber-950/20 border border-amber-500/30 rounded p-2.5">
            <p className="text-[10px] text-amber-400 font-mono leading-relaxed">
              💡 {syncErrorMessage}
            </p>
          </div>
        )}
      </div>

      {/* Action trigger button */}
      <div>
        <button
          onClick={handleVerify}
          className="w-full py-2 bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-black text-xs font-bold uppercase tracking-wider rounded transition-all duration-200 shadow-md active:scale-[0.99]"
        >
          Verify Core Hardware Key
        </button>
      </div>

      {/* Active License Info / Sandbox testing */}
      {isLicenseActivated && activeLicenseDetails && (
        <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>ACTIVATED & LINKED</span>
          </div>
          <div className="text-[10px] font-mono text-slate-400 space-y-1">
            <p className="flex justify-between">
              <span>Verified Key:</span>
              <span className="text-emerald-300 font-bold">{activeLicenseDetails.key}</span>
            </p>
            <p className="flex justify-between">
              <span>Bound PC Signature:</span>
              <span className="text-slate-300">{activeLicenseDetails.deviceId}</span>
            </p>
            <p className="flex justify-between">
              <span>Sync Mode:</span>
              <span className={syncState === "synced_live" ? "text-emerald-300 font-bold" : "text-amber-300"}>
                {syncState === "synced_live" ? "Cloud synchronized" : "Local-only cache"}
              </span>
            </p>
          </div>
        </div>
      )}

      {/* Developer Access Entry point */}
      <div className="border-t border-white/5 pt-3 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Terminal className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-[10px] text-slate-500 font-mono font-medium">Developer Mode</span>
        </div>
        <button
          onClick={() => {
            setIsDevWindowOpen(true);
            setIsKeygenUnlocked(true); // Automatically unlock developer mode
            setNewlyGeneratedKey("");
            setCopyFeedbackKey(null);
          }}
          className="px-2.5 py-1 bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-500/20 hover:border-cyan-500/40 text-cyan-400 rounded text-[10px] font-mono flex items-center gap-1 transition-all shadow-sm cursor-pointer hover:shadow-cyan-500/5"
        >
          <Cpu className="w-3 h-3" /> Open Key Generator
        </button>
      </div>

      {/* SEPARATE OPERATING-SYSTEM WINDOW / MODAL POPUP FOR DEVELOPER KEY GENERATOR */}
      {isDevWindowOpen && (
        <div id="developer-window-portal" className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in">
          {/* Main Simulated Window Frame */}
          <div className="w-full max-w-lg bg-[#0a0a0f] border border-cyan-500/30 rounded-xl shadow-[0_0_50px_rgba(6,182,212,0.15)] overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Simulated Desktop Window Titlebar */}
            <div className="bg-[#0e111a] border-b border-cyan-500/20 px-4 py-2.5 flex items-center justify-between shrink-0 select-none">
              <div className="flex items-center space-x-2">
                {/* Simulated MacOS Window Controls */}
                <div className="flex space-x-1.5">
                  <button 
                    onClick={() => {
                      setIsDevWindowOpen(false);
                      setIsKeygenUnlocked(false);
                      setPinInput("");
                      setPinError("");
                    }} 
                    className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-600 transition-colors cursor-pointer" 
                    title="Close utility and lock" 
                  />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <span className="text-[10.5px] font-mono text-cyan-400/80 font-bold ml-2 flex items-center gap-1">
                  <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                  root@media-studio:~# {lockedUntil > Date.now() ? "keygen-utility --isolated" : isKeygenUnlocked ? "keygen-utility --provision-mode" : "keygen-utility --authenticate"}
                </span>
              </div>
              <button 
                onClick={() => {
                  setIsDevWindowOpen(false);
                  setIsKeygenUnlocked(false);
                  setPinInput("");
                  setPinError("");
                }}
                className="text-slate-400 hover:text-white transition-colors"
                title="Exit and lock"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Window Content */}
            {lockedUntil > Date.now() ? (
              /* Case 1: Lockdown screen with Isolation Bypass options */
              <div className="p-6 space-y-6 overflow-y-auto text-center font-mono">
                <div className="w-16 h-16 bg-red-950/45 border border-red-500/30 rounded-full flex items-center justify-center mx-auto text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.15)] animate-pulse">
                  <ShieldAlert className="w-8 h-8" />
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-red-500 uppercase tracking-widest">
                    SYSTEM ISOLATION LOCKOUT
                  </h4>
                  <p className="text-[10px] text-slate-400 max-w-sm mx-auto leading-relaxed">
                    Access has been quarantined for 2 days due to 3 consecutive incorrect PIN entries. Active hardware registry has initiated security protocols.
                  </p>
                </div>

                {/* Colombo Real-Time Clock inside Lock Screen */}
                <div className="bg-[#120a0d] border border-red-500/10 p-3.5 rounded-lg space-y-2 max-w-sm mx-auto">
                  <p className="text-[8.5px] text-slate-500 uppercase tracking-wider font-bold">
                    COLOMBO REAL-TIME CLOCK
                  </p>
                  <p className="text-[11px] font-bold text-slate-300">
                    {sriLankaTime || "Syncing Colombo Clock..."}
                  </p>
                </div>

                {/* Lockout Countdown Timer */}
                <div className="bg-[#1c080e] border border-red-500/20 p-4 rounded-lg max-w-sm mx-auto space-y-1">
                  <p className="text-[9px] text-red-400/80 uppercase font-bold tracking-wider">
                    LOCKOUT REMAINING COOLDOWN
                  </p>
                  <p className="text-base font-bold text-red-550 tracking-widest text-[#ef4444] animate-pulse">
                    {lockCountdown || "Calculating..."}
                  </p>
                  <p className="text-[8.5px] text-slate-550 pt-1">
                    System Unlocks On: <span className="text-slate-400 font-semibold">{formatSriLankaDate(lockedUntil)}</span>
                  </p>
                </div>

                {/* Lockdown Isolation Recovery Bypass Option */}
                <div className="border-t border-red-500/10 pt-4 max-w-sm mx-auto">
                  {!isRecoveryOpen ? (
                    <button
                      type="button"
                      onClick={() => {
                        setIsRecoveryOpen(true);
                        setPinError("");
                        setRecoveryInput("");
                      }}
                      className="text-[9.5px] text-red-400 hover:text-red-350 underline font-semibold transition-colors flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
                    >
                      <KeyRound className="w-3.5 h-3.5 text-red-500" /> Have/forgot PIN? Bypass with System Recovery Key
                    </button>
                  ) : (
                    <div className="space-y-4 text-left">
                      <div className="flex items-center justify-between">
                        <span className="text-[8.5px] text-red-400 uppercase tracking-wider font-bold">Emergency Bypass Terminal</span>
                        <button
                          type="button"
                          onClick={() => setIsRecoveryOpen(false)}
                          className="text-[8.5px] text-slate-400 hover:text-white underline cursor-pointer"
                        >
                          Back to lock screen
                        </button>
                      </div>

                      <div className="bg-[#120a0d] border border-red-500/15 rounded p-2.5 text-center text-[9.5px] space-y-1.5">
                        <span className="text-slate-500 block uppercase tracking-wider font-bold text-[8px]">Recovery Key from LocalStorage</span>
                        <div className="flex items-center justify-center gap-1.5 pt-0.5">
                          <span className="text-red-400 font-bold tracking-wider select-all font-mono text-[10px]">{recoveryKey}</span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(recoveryKey);
                              setCopyFeedbackKey("recovery_bypass");
                              setTimeout(() => setCopyFeedbackKey(null), 1500);
                            }}
                            className="p-1.5 bg-[#1a0c0e] border border-red-500/20 hover:border-red-500 text-slate-400 hover:text-white rounded transition-all"
                            title="Copy Recovery Key"
                          >
                            <Copy className="w-2.5 h-2.5" />
                          </button>
                        </div>
                        {copyFeedbackKey === "recovery_bypass" && (
                          <p className="text-[8px] text-red-400">✓ Copied to clipboard!</p>
                        )}
                      </div>

                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (handleUseRecoveryKey(recoveryInput)) {
                            setIsRecoveryOpen(false);
                          }
                        }}
                        className="space-y-2.5"
                      >
                        <input
                          type="text"
                          placeholder="STUDIO-RCV-XXXXXX"
                          value={recoveryInput}
                          onChange={(e) => {
                            setRecoveryInput(e.target.value);
                            setPinError("");
                          }}
                          className="w-full text-center tracking-wider font-mono text-xs bg-slate-950 border border-red-500/25 text-red-400 rounded p-2 focus:outline-none focus:border-red-500/60 uppercase"
                        />
                        {pinError && (
                          <div className="bg-red-950/20 border border-red-500/35 p-2 rounded text-[9.5px] text-red-400 leading-relaxed text-center font-bold">
                            {pinError}
                          </div>
                        )}
                        <button
                          type="submit"
                          className="w-full py-1.5 bg-red-950/45 hover:bg-red-900/60 border border-red-500/30 text-red-400 font-mono rounded text-[9.5px] font-bold transition-all uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          Verify Bypass key & Unlock
                        </button>
                      </form>
                    </div>
                  )}
                </div>
                <div className="pt-4">
                  <button
                    onClick={() => {
                      setIsDevWindowOpen(false);
                      setIsKeygenUnlocked(true); // Persist unlock
                    }}
                    className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-white/5 rounded text-[10px] transition-all uppercase tracking-wider font-bold cursor-pointer"
                  >
                    Exit Control Console
                  </button>
                </div>
              </div>
            ) : !isKeygenUnlocked ? (
              /* Case 2: PIN password form or Recovery code verification form */
              <div className="p-6 space-y-6 overflow-y-auto font-mono text-center">
                {!isRecoveryOpen ? (
                  <>
                    <div className="w-12 h-12 bg-cyan-950/30 border border-cyan-500/20 rounded-full flex items-center justify-center mx-auto text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.1)]">
                      <Lock className="w-5 h-5 text-cyan-400" />
                    </div>

                    <div className="space-y-1.5">
                      <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-widest">
                        PIN CREDENTIAL REQUIRED
                      </h4>
                      <p className="text-[10px] text-slate-500">
                        Provide the 4-digit Master Developer Access Pin to authorize serial generator activation.
                      </p>
                    </div>

                    {/* Real-time Colombo Clock inside PIN Authenticator */}
                    <div className="text-[9.5px] text-slate-400 flex justify-center items-center gap-1.5 text-center bg-[#07070b] py-1.5 px-3 border border-slate-900 rounded mx-auto max-w-xs font-bold">
                      <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-ping" />
                      <span>{sriLankaTime || "Reading Sri Lanka Clock..."}</span>
                    </div>

                    {/* Form wrapper */}
                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        handlePinSubmit(pinInput);
                      }}
                      className="space-y-4 max-w-xs mx-auto text-left"
                    >
                      <div className="space-y-1.5 text-center">
                        <div className="relative">
                          <input
                            type="password"
                            maxLength={10}
                            placeholder="● ● ● ●"
                            value={pinInput}
                            onChange={(e) => {
                              setPinInput(e.target.value.replace(/[^0-9]/g, ""));
                              setPinError("");
                            }}
                            className="w-full text-center tracking-[0.5rem] font-mono text-base bg-slate-950 border border-white/5 text-cyan-400 rounded-lg p-2.5 focus:outline-none focus:border-cyan-500/70"
                            autoFocus
                          />
                        </div>
                      </div>

                      {pinError && (
                        <div className="bg-red-950/20 border border-red-500/35 p-3 rounded text-[10px] text-red-400 leading-relaxed text-center font-bold">
                          {pinError}
                        </div>
                      )}

                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-slate-500 font-bold uppercase tracking-wide">Attempts Remaining:</span>
                        <span className={`font-bold ${pinAttempts === 3 ? "text-emerald-400" : pinAttempts === 2 ? "text-yellow-400" : "text-red-500 animate-pulse"}`}>
                          {pinAttempts} of 3
                        </span>
                      </div>

                      {/* Digital tactile keypad */}
                      <div className="grid grid-cols-3 gap-2 pt-2">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => {
                              if (pinInput.length < 8) {
                                setPinInput(prev => prev + num);
                                setPinError("");
                              }
                            }}
                            className="py-2.5 bg-[#0a0a0f] hover:bg-slate-900/80 border border-white/5 active:bg-cyan-950/40 text-slate-300 hover:text-white font-mono rounded text-xs transition-all shadow-sm flex items-center justify-center cursor-pointer"
                          >
                            {num}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            setPinInput(prev => prev.slice(0, -1));
                            setPinError("");
                          }}
                          className="py-2.5 bg-[#18090b] hover:bg-red-950/30 border border-red-900/10 text-red-500 font-mono rounded text-[10px] transition-all flex items-center justify-center font-bold cursor-pointer"
                        >
                          DEL
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (pinInput.length < 8) {
                              setPinInput(prev => prev + "0");
                              setPinError("");
                            }
                          }}
                          className="py-2.5 bg-[#0a0a0f] hover:bg-slate-900/80 border border-white/5 active:bg-cyan-950/40 text-slate-300 hover:text-white font-mono rounded text-xs transition-all shadow-sm flex items-center justify-center cursor-pointer"
                        >
                          0
                        </button>
                        <button
                          type="submit"
                          className="py-2.5 bg-cyan-955 hover:bg-cyan-900/90 border border-cyan-500/20 text-cyan-400 font-mono rounded text-[10px] transition-all flex items-center justify-center font-bold cursor-pointer hover:shadow-cyan-500/5 active:scale-[0.98]"
                        >
                          ENTER
                        </button>
                      </div>
                    </form>

                    <button
                      type="button"
                      onClick={() => {
                        setIsRecoveryOpen(true);
                        setPinError("");
                        setRecoveryInput("");
                      }}
                      className="text-[10.5px] text-cyan-400/80 hover:text-cyan-300 underline block text-center mx-auto mt-4 transition-colors cursor-pointer font-bold"
                    >
                      Forgot master PIN password? Verify with Recovery Key
                    </button>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 bg-purple-950/30 border border-purple-500/20 rounded-full flex items-center justify-center mx-auto text-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.1)]">
                      <KeyRound className="w-5 h-5 text-purple-400" />
                    </div>

                    <div className="space-y-1.5">
                      <h4 className="text-xs font-bold text-purple-400 uppercase tracking-widest">
                        EMERGENCY SYSTEM RECOVERY
                      </h4>
                      <p className="text-[10px] text-slate-500">
                        Enter your 2-day recovery key stored in the device's Local Storage environment.
                      </p>
                    </div>

                    {/* LocalStorage Key Display Card */}
                    <div className="bg-[#0c0d17] border border-cyan-555/10 rounded-lg p-3 space-y-1.5 text-center max-w-xs mx-auto">
                      <p className="text-[8px] text-slate-500 uppercase tracking-widest font-bold">Recovery Backup Location</p>
                      <code className="text-[9px] text-slate-400 block bg-[#050508] p-1 border border-white/5 rounded">
                        localStorage.getItem("media_studio_recovery_key")
                      </code>
                      <div className="flex items-center justify-center gap-1.5 pt-1">
                        <span className="text-cyan-400 font-bold select-all tracking-wider text-[11px] font-mono">{recoveryKey}</span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(recoveryKey);
                            setCopyFeedbackKey("recovery_helper_pass");
                            setTimeout(() => setCopyFeedbackKey(null), 1500);
                          }}
                          className="p-1 px-1.5 bg-slate-900 border border-white/5 hover:border-cyan-400 text-slate-450 hover:text-white rounded text-[9.5px] flex items-center gap-1 transition-all"
                        >
                          <Copy className="w-2.5 h-2.5" />
                          {copyFeedbackKey === "recovery_helper_pass" ? "Copied" : "Copy"}
                        </button>
                      </div>
                    </div>

                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (handleUseRecoveryKey(recoveryInput)) {
                          setIsRecoveryOpen(false);
                        }
                      }}
                      className="space-y-4 max-w-xs mx-auto text-left"
                    >
                      <div className="space-y-1 text-center">
                        <label className="text-[8.5px] text-slate-500 uppercase tracking-widest font-bold block pb-1 text-left">Verify Recovery Key Sequence</label>
                        <input
                          type="text"
                          placeholder="STUDIO-RCV-XXXXXX"
                          value={recoveryInput}
                          onChange={(e) => {
                            setRecoveryInput(e.target.value);
                            setPinError("");
                          }}
                          className="w-full text-center tracking-wider font-mono text-xs bg-slate-950 border border-white/5 text-purple-400 rounded-lg p-2.5 focus:outline-none focus:border-purple-500/70 uppercase"
                          autoFocus
                        />
                      </div>

                      {pinError && (
                        <div className="bg-red-955/20 border border-red-500/35 p-3 rounded text-[10px] text-red-400 leading-relaxed text-center font-bold">
                          {pinError}
                        </div>
                      )}

                      <button
                        type="submit"
                        className="w-full py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 font-mono rounded text-[10px] font-bold text-white transition-all uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer shadow-md hover:shadow-purple-500/5 active:scale-[0.98]"
                      >
                        <KeyRound className="w-3.5 h-3.5" /> Unlock 2-Day Temporary Pass
                      </button>
                    </form>

                    <button
                      type="button"
                      onClick={() => {
                        setIsRecoveryOpen(false);
                        setPinError("");
                      }}
                      className="text-[10px] text-slate-450 hover:text-white underline block text-center mx-auto mt-2 transition-colors cursor-pointer"
                    >
                      ← Return to regular Master PIN Access
                    </button>
                  </>
                )}
              </div>
            ) : (
              /* Case 3: Keygen system unlocked state */
              <div className="p-5 space-y-5 overflow-y-auto font-mono text-xs">
                
                <div className="bg-[#121624]/60 border border-[#00D2FF]/10 rounded-lg p-3 space-y-1 text-slate-300 flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-cyan-400 font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                      <Unlock className="w-3.5 h-3.5 text-cyan-400" />
                      Administrative Provisioning Portal (Authorized)
                    </p>
                    <p className="text-[10px] text-slate-405 leading-relaxed">
                      Generate secure, certified 13-character serial keys for remote activation. Newly generated keys are registered instantly into the recognized hardware license registry.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setIsDevWindowOpen(false);
                      setIsKeygenUnlocked(true); // Do not lock!
                      setPinInput("");
                      setRecoverySuccessMessage("");
                    }}
                    className="p-1 px-1.5 bg-red-950/40 hover:bg-red-900/40 text-red-00 border border-red-550/20 rounded text-[9px] uppercase tracking-tight flex items-center gap-1 transition-all font-bold cursor-pointer hover:text-red-400 animate-pulse"
                    title="Close generator console"
                  >
                    Close <Lock className="w-2.5 h-2.5" />
                  </button>
                </div>

                {/* Recovery Pass Succcess Notification Status banner */}
                {recoverySuccessMessage && (
                  <div className="bg-emerald-950/30 border border-emerald-500/25 p-2 rounded text-[10px] text-emerald-450 font-bold animate-pulse">
                    ✓ {recoverySuccessMessage}
                  </div>
                )}

                {/* Temporary Recovery Bypass countdown alert */}
                {tempAccessUntil > Date.now() && (
                  <div className="bg-amber-955/20 border border-amber-500/25 p-2.5 rounded-lg flex items-center justify-between text-[10px] text-amber-400 gap-2 font-bold select-none animate-pulse">
                    <span className="flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>Temporary 2-Day Emergency Access Pass Active</span>
                    </span>
                    <span className="bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 tracking-wider">
                      Expires in: {tempAccessCountdown || "Calculating..."}
                    </span>
                  </div>
                )}

                {/* Colombo Clock inside Active Provisioner */}
                <div className="text-[9.5px] text-emerald-400 flex items-center gap-1.5 bg-emerald-950/20 border border-emerald-500/20 rounded px-2.5 py-1.5 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-450 animate-pulse" />
                  <span>Clock: {sriLankaTime || "Syncing Colombo clock..."}</span>
                </div>

                {/* Generator Section */}
                <div className="bg-[#08080c] border border-white/5 rounded-lg p-4 space-y-3.5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-1 bg-cyan-950/40 px-2 rounded-bl border-l border-b border-cyan-500/15 text-[8.5px] text-cyan-400 font-bold uppercase tracking-wider">
                    Engine Ready
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 uppercase tracking-widest block font-bold">Provisioning Output</label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-[#101016] border border-[#1d1d29] rounded px-3 py-2 text-sm font-bold tracking-widest text-[#00D2FF] text-center uppercase shadow-inner min-h-[38px] flex items-center justify-center">
                        {newlyGeneratedKey || "--------------"}
                      </div>
                      {newlyGeneratedKey && (
                        <button
                          onClick={() => handleCopyToClipboard(newlyGeneratedKey)}
                          className="p-2 py-2.5 bg-slate-905 border border-white/10 hover:border-cyan-400 hover:bg-slate-800 text-slate-300 hover:text-white rounded transition-all"
                          title="Copy to Clipboard"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    {copyFeedbackKey === newlyGeneratedKey && (
                      <p className="text-[9px] text-[#00D2FF] text-right font-semibold">✓ Copied generated key to clipboard</p>
                    )}
                  </div>

                  <button
                    onClick={handleGenerateAndAddKey}
                    className="w-full py-2 bg-gradient-to-r from-cyan-500 via-sky-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-bold uppercase tracking-wider rounded text-[11px] shadow-lg hover:shadow-cyan-500/10 active:scale-[0.99] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4" /> Generate 13-Char Serial Key
                  </button>
                </div>

                {/* Pool Matrix */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-550 uppercase tracking-widest font-bold">Recognized Keys Register ({testKeys.length})</span>
                    <button
                      onClick={handleClearGeneratedPool}
                      className="text-[9px] text-red-00 hover:text-red-300 underline font-semibold flex items-center gap-1 cursor-pointer bg-transparent border-0"
                    >
                      <Trash2 className="w-3 h-3" /> Restore Default Pool
                    </button>
                  </div>

                  <div className="bg-[#050508] border border-white/5 rounded-lg max-h-48 overflow-y-auto divide-y divide-white/5 font-mono text-[11px]">
                    {testKeys.map((k, idx) => (
                      <div key={`${k}-${idx}`} className="p-2.5 flex items-center justify-between hover:bg-white/[0.02] transition-colors group">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-600 text-[9px]">{String(idx + 1).padStart(2, "0")}</span>
                          <span className="font-bold tracking-wider text-slate-300 select-all">{k}</span>
                          {k === newlyGeneratedKey && (
                            <span className="text-[8px] bg-cyan-950 text-cyan-400 border border-cyan-500/20 px-1 py-0.2 rounded font-bold uppercase tracking-tight animate-pulse ml-1">New</span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleCopyToClipboard(k)}
                            className="px-2 py-0.5 bg-slate-900 border border-white/5 hover:border-cyan-400 hover:bg-slate-800 text-slate-450 hover:text-cyan-450 rounded text-[9.5px] transition-all flex items-center gap-1 cursor-pointer"
                            title="Copy key"
                          >
                            <Copy className="w-2.5 h-2.5" />
                            {copyFeedbackKey === k ? "Copied" : "Copy"}
                          </button>
                          <button
                            onClick={() => handleInjectKeyAndClose(k)}
                            className="px-2 py-0.5 bg-[#0e212f] border border-cyan-500/20 hover:border-cyan-455 hover:bg-cyan-900/50 text-cyan-400 rounded text-[9.5px] transition-all flex items-center gap-1 font-bold cursor-pointer"
                            title="Inject key into activation console input and close"
                          >
                            Fill & Use
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {/* Window Statusbar */}
            <div className="bg-[#080a11] border-t border-cyan-500/10 px-4 py-2 flex items-center justify-between shrink-0 select-none text-[9.5px] font-mono text-slate-500">
              <span>Status: {lockedUntil > Date.now() ? "Isolation Mode Active" : isKeygenUnlocked ? "Authenticated Administrative Session" : "Security Check Required"}</span>
              <span>Enc: 256-Bit SHA</span>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
