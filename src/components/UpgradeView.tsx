import React, { useState } from "react";
import { Check, Mail, Phone, Zap, Shield, DollarSign } from "lucide-react";
import { AppTheme } from "../data/themes";

interface UpgradeViewProps {
  isPremiumPlan: boolean;
  setIsPremiumPlan: (v: boolean) => void;
  activeTheme: AppTheme;
  triggerInvoiceAction: () => void;
}

export const UpgradeView: React.FC<UpgradeViewProps> = ({
  isPremiumPlan,
  setIsPremiumPlan,
  activeTheme,
  triggerInvoiceAction,
}) => {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [purchaseProcessing, setPurchaseProcessing] = useState<boolean>(false);
  const [purchaseCompleted, setPurchaseCompleted] = useState<boolean>(false);

  const triggerPurchase = () => {
    setPurchaseProcessing(true);
    setTimeout(() => {
      setPurchaseProcessing(false);
      setIsPremiumPlan(true);
      setPurchaseCompleted(true);
      triggerInvoiceAction();
    }, 1500);
  };

  return (
    <main className="flex-1 overflow-y-auto p-6 space-y-8">
      {/* Premium Hero block */}
      <div className="text-center space-y-3 max-w-2xl mx-auto pt-4 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent blur-3xl pointer-events-none" />
        <span className="text-[10px] font-mono tracking-widest text-amber-500 font-extrabold uppercase bg-amber-500/10 px-2.5 py-1 rounded-full animate-bounce">
          👑 Enterprise Upgrade Hub
        </span>
        <h1 className="text-3xl font-display font-black tracking-tight text-white uppercase sm:text-4xl bg-gradient-to-r from-amber-200 via-yellow-200 to-amber-400 bg-clip-text">
          Maximize Your Neural Pipeline
        </h1>
        <p className="text-xs text-slate-400 leading-relaxed">
          Unlock infinite batch automation, multi-PC licenses, specialized blemish upscaling, and dedicated corporate server seatings with zero-noise latency.
        </p>

        {/* Toggle billing cycles */}
        <div className="pt-4 flex items-center justify-center">
          <div className="bg-black/45 border border-white/5 p-1 rounded-lg flex items-center space-x-1 font-mono text-[10px]">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-3 py-1.5 rounded-md font-bold uppercase ${billingCycle === "monthly" ? "bg-amber-500 text-black shadow-lg" : "text-gray-500 hover:text-white"}`}
            >
              Monthly billing
            </button>
            <button
              onClick={() => setBillingCycle("yearly")}
              className={`px-3 py-1.5 rounded-md font-bold uppercase flex items-center gap-1.5 ${billingCycle === "yearly" ? "bg-amber-500 text-black shadow-lg" : "text-gray-500 hover:text-white"}`}
            >
              <span>Yearly billing</span>
              <span className="bg-rose-600 text-white text-[8px] font-semibold px-1 py-0.5 rounded uppercase font-sans tracking-normal">Save 35%</span>
            </button>
          </div>
        </div>
      </div>

      {/* Interactive price cards with Glassmorphism */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">
        
        {/* Trial version pack */}
        <div className={`p-6 rounded-2xl border ${activeTheme.border} ${activeTheme.cardBg} flex flex-col justify-between space-y-6 relative`}>
          <div className="space-y-3">
            <span className="text-[10px] font-mono text-slate-500 block uppercase tracking-wider font-extrabold">Active Level</span>
            <h3 className="text-2xl font-black text-white font-display">COMMERCIAL TRIAL</h3>
            <p className="text-xs text-slate-400 leading-normal">
              A limited visual engine testing suite for single-PC local calibrations. Expiry limits apply.
            </p>

            <div className="text-3xl font-black text-white font-display pt-2">
              $0.00 <span className="text-sm font-mono text-slate-500 font-medium">/ forever</span>
            </div>
          </div>

          <div className="space-y-3 border-t border-white/5 pt-4">
            <div className="flex items-center gap-2.5 text-xs text-slate-300">
              <Check className="w-4 h-4 text-emerald-450 shrink-0" />
              <span>Standard local CPU processing only</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-slate-300">
              <Check className="w-4 h-4 text-emerald-450 shrink-0" />
              <span>4 dynamic local sandbox themes</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-slate-500 italic">
              <span>✕ No high-ISO advanced denoise upscaling</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-slate-500 italic">
              <span>✕ No professional batch rendering</span>
            </div>
          </div>

          <div className="pt-2">
            <button
              disabled
              className="w-full py-2.5 bg-white/5 border border-white/10 rounded-lg text-slate-500 font-semibold text-xs font-mono uppercase"
            >
              Currently Active
            </button>
          </div>
        </div>

        {/* Pro Enterprise dynamic tier */}
        <div className={`p-6 rounded-2xl border border-amber-500 bg-amber-950/20 flex flex-col justify-between space-y-6 relative overflow-hidden shadow-2xl`}>
          <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-600/20 via-transparent to-transparent inset-0 pointer-events-none" />
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-amber-500 block uppercase tracking-widest font-black animate-pulse">👑 Recommended</span>
              <span className="text-[9px] font-mono text-white bg-rose-600 px-1.5 py-0.5 rounded font-bold uppercase">UNLIMITED PIXEL VIRTUALIZATION</span>
            </div>
            <h3 className="text-2xl font-black text-amber-300 font-display uppercase tracking-tight">AI PRO ENTERPRISE</h3>
            <p className="text-xs text-amber-100 leading-normal">
              Unlock our raw neural predictive filters, blemish downsamplers, and license seat management matrices.
            </p>

            <div className="text-4xl font-extrabold text-white font-display pt-2 flex items-baseline gap-1">
              <span>{billingCycle === "monthly" ? "$19.00" : "$149.00"}</span>
              <span className="text-sm font-mono text-amber-400 font-semibold">/ user_seat_{billingCycle === "monthly" ? "mo" : "yr"}</span>
            </div>
          </div>

          <div className="space-y-3 border-t border-amber-500/20 pt-4">
            <div className="flex items-center gap-2.5 text-xs text-amber-100">
              <Check className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="font-semibold">CUDA GPU high-speed processing cores</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-amber-100 font-semibold">
              <Check className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Full 14 custom style themes unlocked</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-amber-100">
              <Check className="w-4 h-4 text-amber-400 shrink-0" />
              <span>High-ISO Advanced Denoise parameters modifier</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-amber-100">
              <Check className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Unlimited batch render operations</span>
            </div>
          </div>

          <div className="pt-2">
            {isPremiumPlan ? (
              <div className="text-center p-2.5 rounded bg-amber-950/50 border border-amber-500/30 text-amber-400 font-mono text-xs font-bold uppercase tracking-wider">
                ✓ PRO ACTIVATED SUCCESSFULLY
              </div>
            ) : (
              <button
                onClick={triggerPurchase}
                disabled={purchaseProcessing}
                className="w-full py-2.5 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:opacity-90 disabled:opacity-50 text-black font-semibold text-xs font-mono uppercase tracking-widest font-black rounded-lg transition active:scale-95 shadow-[0_0_20px_rgba(245,158,11,0.3)]"
              >
                {purchaseProcessing ? "Executing Stripe Transaction..." : "Buy corporate license"}
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Feature comparison table */}
      <div className="max-w-4xl mx-auto space-y-4">
        <h3 className="text-base font-display font-bold text-center text-white uppercase tracking-wider">
          Enterprise Feature Comparison
        </h3>

        <div className="border border-white/5 bg-black/45 rounded-xl overflow-hidden font-mono text-xs">
          <div className="grid grid-cols-3 p-3.5 bg-slate-900 border-b border-white/5 font-extrabold uppercase text-slate-400 text-center">
            <span className="text-left">FEATURE MATRIX</span>
            <span>TRIAL LICENSE</span>
            <span className="text-amber-400">PRO ENTERPRISE</span>
          </div>

          <div className="grid grid-cols-3 p-3.5 border-b border-white/5 text-center">
            <span className="text-left font-sans text-slate-200">Device seating registry limits</span>
            <span className="text-slate-500">1 PC Motherboard</span>
            <span className="text-emerald-450 font-bold">Infinite PCs</span>
          </div>

          <div className="grid grid-cols-3 p-3.5 border-b border-white/5 text-center">
            <span className="text-left font-sans text-slate-200">CUDA Multi-Threading</span>
            <span className="text-slate-500">Unavailable</span>
            <span className="text-emerald-450 font-bold">Uncapped seat load</span>
          </div>

          <div className="grid grid-cols-3 p-3.5 text-center">
            <span className="text-left font-sans text-slate-200">Dynamic themes registry</span>
            <span className="text-slate-500">4 basic skins</span>
            <span className="text-emerald-450 font-bold">All 14 Pro styles</span>
          </div>
        </div>
      </div>

      {/* Contact information buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-xl mx-auto pt-4 text-xs font-mono">
        <a 
          href="mailto:imashaisuri49@gmail.com" 
          className="px-4 py-2 bg-white/5 border border-white/10 text-slate-350 rounded-lg hover:border-white/20 transition flex items-center gap-2 justify-center w-full"
        >
          <Mail className="w-3.5 h-3.5 text-cyan-400" />
          <span>Email Support</span>
        </a>
        <a 
          href="tel:+94771234567" 
          className="px-4 py-2 bg-white/5 border border-white/10 text-slate-350 rounded-lg hover:border-white/20 transition flex items-center gap-2 justify-center w-full"
        >
          <Phone className="w-3.5 h-3.5 text-cyan-400" />
          <span>Call Admin Center</span>
        </a>
      </div>

    </main>
  );
};
