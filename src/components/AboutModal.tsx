import React from "react";
import { X, Sparkles, Clock, Zap } from "lucide-react";

interface AboutModalProps {
  onClose: () => void;
}

export default function AboutModal({ onClose }: AboutModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-[#131422] border border-cyan-500/30 rounded-2xl w-11/12 max-w-lg p-6 shadow-[0_0_40px_rgba(34,211,238,0.15)] relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-50" />
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-cyan-400" />
          About AIMEDIA STUDIOULTRAX
        </h2>
        
        <div className="space-y-5 mt-6 text-slate-300 text-sm leading-relaxed">
          <div>
            <h3 className="text-cyan-400 font-bold text-base mb-1 inline-flex items-center gap-1.5">
              <Zap className="w-4 h-4" /> What's the New Update AI?
            </h3>
            <p>
              The latest AI integration engine brings intelligent auto-layering and context-aware styling. It analyzes the composition of your subject and dynamically suggests typography, lighting corrections, and aesthetic templates, making professional finishing achievable with zero manual tweaks.
            </p>
          </div>

          <div>
            <h3 className="text-cyan-400 font-bold text-base mb-1 inline-flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" /> Perfect for Beginners & Creators
            </h3>
            <p>
              Digital creators and editors often face steep learning curves with complex software. We've simplified the entire process so that anyone can hop in and produce high-quality art in minutes. The intuitive interface guides you seamlessly from a raw idea to a stunning export without the usual technical jargon.
            </p>
          </div>

          <div>
            <h3 className="text-cyan-400 font-bold text-base mb-1 inline-flex items-center gap-1.5">
              <Clock className="w-4 h-4" /> Unprecedented Time Savings
            </h3>
            <p>
              Time is the most valuable asset. With our preset configurations, one-click background enhancements, and AI-driven layout matching, tasks that up to now took hours of micro-adjustments are handled immediately.
            </p>
          </div>

          {/* Secure cryptographic certificate and licensing specifications */}
          <div className="bg-[#0b0c16]/70 border border-cyan-500/15 rounded-xl p-3.5 space-y-1.5 mt-2 font-mono text-[10px]">
            <div className="text-[10px] text-cyan-300 font-bold uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>🛡️ Secure Core Certificate</span>
              <span className="text-[8.5px] bg-cyan-950 px-1 rounded border border-cyan-500/20">VIBE-ACTIVE</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Security Standard:</span>
              <span className="text-white font-semibold">AES-GCM-256 Symmetric encryption</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Registry Certificate ID:</span>
              <span className="text-[#a855f7] font-bold">SHA-256 System-Hardware Binding Card</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Authority Signature:</span>
              <span className="text-cyan-400 font-extrabold text-[9px]">S M Chanuka Dilshan // Partner Creator</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Security Version verification:</span>
              <span className="text-white">v3.9.5-SECURE-STABLE</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-white/5 text-[9px]">
              <span className="text-slate-500">Last System Update check:</span>
              <span className="text-emerald-400 font-bold">June 20, 2026 // 11:36 Sri Lanka</span>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-4 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-cyan-950/40 text-cyan-400 hover:bg-cyan-900/60 transition font-medium border border-cyan-500/30"
          >
            Got it, Let's Create
          </button>
        </div>
      </div>
    </div>
  );
}
