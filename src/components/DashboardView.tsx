import React from "react";
import { Briefcase, Zap, Flame, Shield, DollarSign, Sliders, Play, RotateCcw } from "lucide-react";
import { AppTheme } from "../data/themes";

interface DashboardViewProps {
  trialDays: number;
  setTrialDays: (days: number) => void;
  isPremiumPlan: boolean;
  activeTheme: AppTheme;
  setActiveTab: (tab: "dashboard" | "editor" | "enhancement" | "design" | "export" | "license" | "themes" | "upgrade") => void;
  sriLankaTime: string;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  trialDays,
  setTrialDays,
  isPremiumPlan,
  activeTheme,
  setActiveTab,
  sriLankaTime,
}) => {
  return (
    <main className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Welcome Hero Banner */}
      <div className={`p-6 rounded-2xl border ${activeTheme.border} ${activeTheme.cardBg} flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden`}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-500/10 to-transparent blur-3xl pointer-events-none" />
        <div className="space-y-2">
          <span className="text-[10px] font-mono tracking-widest text-[#00D2FF] font-black uppercase bg-[#00D2FF]/10 px-2 py-1 rounded">
            ✨ Commercial Workstation
          </span>
          <h1 className="text-2xl font-display font-extrabold tracking-tight text-white">
            Welcome to AI Media Studio Ultra X
          </h1>
          <p className={`text-xs ${activeTheme.textSecondary} max-w-xl leading-relaxed`}>
            Maximize high-fidelity cinematic transformations, batch automation pipelines, and native neural calibrations under premium GPU-accelerated sandboxes.
          </p>
        </div>

        <div className="flex flex-col items-end text-right">
          <span className="text-[10px] font-mono text-slate-500">Live Calibration Pulse</span>
          <span className="text-xs font-mono font-bold text-cyan-400">{sriLankaTime}</span>
        </div>
      </div>

      {/* Trial Status or Premium Core */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={`p-6 rounded-xl border ${activeTheme.border} ${activeTheme.cardBg} space-y-4`}>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Plan Activation
            </h3>
            {isPremiumPlan ? (
              <span className="text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded">👑 PRO ENTERPRISE</span>
            ) : (
              <span className="text-[9px] font-mono font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded">★ ACTIVE TRIAL</span>
            )}
          </div>

          <div className="space-y-2">
            {isPremiumPlan ? (
              <div className="space-y-1">
                <div className="text-4xl font-extrabold text-amber-300 font-display">👑 UNLIMITED</div>
                <p className={`text-xs ${activeTheme.textSecondary}`}>
                  Your corporate enterprise license is healthy and fully authenticated across current device matrix.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-5xl font-black text-rose-500 font-display select-none animate-pulse">
                    {trialDays}
                  </span>
                  <span className="text-sm text-slate-400 font-bold">DAYS REMAINING</span>
                </div>
                <div className="w-full bg-white/5 h-2.5 rounded-full overflow-hidden border border-white/5">
                  <div 
                    className="bg-gradient-to-r from-rose-600 via-rose-500 to-[#9D50BB] h-full transition-all duration-500" 
                    style={{ width: `${(trialDays / 14) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Trial Simulator Controls Block */}
          {!isPremiumPlan && (
            <div className="pt-4 border-t border-white/5 space-y-2">
              <div className="flex justify-between items-center text-[10px] font-mono text-slate-500">
                <span>Simulate Trial Lifecycle Days:</span>
                <span className="text-white font-bold">{trialDays}d</span>
              </div>
              <input
                type="range"
                min="0"
                max="14"
                value={trialDays}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  setTrialDays(val);
                  localStorage.setItem("media_studio_trial_days_remaining", val.toString());
                }}
                className="w-full accent-rose-500 bg-white/5 h-1.5 rounded-lg appearance-none cursor-ew-resize"
              />
              <p className="text-[9px] text-slate-500 font-mono italic leading-normal">
                Drag to 0 to simulate demo expiration lock restrictions.
              </p>
            </div>
          )}
        </div>

        {/* Feature Comparison / Active Core */}
        <div className={`p-6 rounded-xl border ${activeTheme.border} ${activeTheme.cardBg} space-y-4 lg:col-span-2 flex flex-col justify-between`}>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Feature Core Entitlements
            </h3>
            <span className="text-[10px] font-mono text-[#9D50BB] font-black uppercase">Capabilities Mapping</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-emerald-450 font-bold">✔</span>
                <span className="text-slate-200">Ultimate Graphic Photo Editor</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-emerald-450 font-bold">✔</span>
                <span className="text-slate-200">AI Prompt Scriptor Copilot</span>
              </div>
              <div className="flex items-center gap-2">
                {isPremiumPlan ? (
                  <span className="text-emerald-450 font-bold">✔</span>
                ) : (
                  <span className="text-rose-500 font-bold">🔒</span>
                )}
                <span className={isPremiumPlan ? "text-slate-200" : "text-slate-500"}>Advanced Neural Denoise (Pro)</span>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                {isPremiumPlan ? (
                  <span className="text-emerald-450 font-bold">✔</span>
                ) : (
                  <span className="text-rose-500 font-bold">🔒</span>
                )}
                <span className={isPremiumPlan ? "text-slate-200" : "text-slate-500"}>Infinite Batch Rendering (Pro)</span>
              </div>
              <div className="flex items-center gap-2">
                {isPremiumPlan ? (
                  <span className="text-emerald-450 font-bold">✔</span>
                ) : (
                  <span className="text-rose-500 font-bold">🔒</span>
                )}
                <span className={isPremiumPlan ? "text-slate-200" : "text-slate-500"}>14 Dynamic Premium Themes (Pro)</span>
              </div>
              <div className="flex items-center gap-2">
                {isPremiumPlan ? (
                  <span className="text-emerald-450 font-bold">✔</span>
                ) : (
                  <span className="text-rose-500 font-bold">🔒</span>
                )}
                <span className={isPremiumPlan ? "text-slate-200" : "text-slate-500"}>Commercial Enterprise Rights (Pro)</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-white/5 flex items-center justify-between">
            <p className="text-[10px] text-slate-500 font-mono">
              {isPremiumPlan ? "Unlocked Unlimited corporate hardware seatings." : "Enterprise upgrade unlocks all 14 beautiful theme matrices."}
            </p>
            {!isPremiumPlan && (
              <button
                onClick={() => setActiveTab("upgrade")}
                className="px-4 py-1.5 rounded bg-gradient-to-r from-amber-600 to-yellow-600 text-black text-xs font-mono font-bold uppercase hover:brightness-110 active:scale-95 transition"
              >
                Unlock Pro 👑
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Live System Performance Telemetry */}
      <div className={`p-6 rounded-xl border ${activeTheme.border} ${activeTheme.cardBg} space-y-4`}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">
            Workspace Activity log
          </h3>
          <span className="text-[10px] font-mono text-[#00D2FF] uppercase animate-pulse">● System Engaged</span>
        </div>

        <div className="border border-white/5 bg-black/45 rounded-lg p-4 font-mono text-[11px] text-slate-400 space-y-2">
          <div className="flex justify-between border-b border-white/5 pb-1 text-slate-500">
            <span>TIMESTAMP (COLOMBO)</span>
            <span>COMPONENT GATEWAY</span>
            <span>ACTION LOG</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">05:40:48 PM</span>
            <span className="text-purple-400">GPU Core Sandbox</span>
            <span className="text-slate-300">Warmed up neural upscaler models (v2.4) successfully in 0.6ms.</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">05:40:40 PM</span>
            <span className="text-cyan-400">License Vault</span>
            <span className="text-slate-300">Synchronized license status state with memory cache registry.</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">05:39:15 PM</span>
            <span className="text-rose-400">Themes Registry</span>
            <span className="text-slate-300">Applied profile {activeTheme.name} canvas styles values.</span>
          </div>
        </div>
      </div>
    </main>
  );
};
