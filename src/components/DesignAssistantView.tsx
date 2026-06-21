import React from "react";
import { Sparkles, MessageSquare, Send, RefreshCw, Scissors, TypeIcon } from "lucide-react";
import { AppTheme } from "../data/themes";

interface ChatItem {
  role: "user" | "model";
  text: string;
}

interface DesignAssistantViewProps {
  chatHistory: ChatItem[];
  isTyping: boolean;
  assistantPrompt: string;
  setAssistantPrompt: (v: string) => void;
  handleSendMessage: (text?: string) => void;
  generativeFillPrompt: string;
  setGenerativeFillPrompt: (v: string) => void;
  generativeFillCategory: "background" | "object";
  setGenerativeFillCategory: (v: "background" | "object") => void;
  isGeneratingFill: boolean;
  triggerGenerativeFill: () => void;
  activeTheme: AppTheme;
  liveApiStatus: string;
}

export const DesignAssistantView: React.FC<DesignAssistantViewProps> = ({
  chatHistory,
  isTyping,
  assistantPrompt,
  setAssistantPrompt,
  handleSendMessage,
  generativeFillPrompt,
  setGenerativeFillPrompt,
  generativeFillCategory,
  setGenerativeFillCategory,
  isGeneratingFill,
  triggerGenerativeFill,
  activeTheme,
  liveApiStatus,
}) => {
  return (
    <main className="flex-1 overflow-y-auto p-6 flex flex-col lg:flex-row gap-6">
      
      {/* AI Assistant Chat Console Area (Left side) */}
      <div className="flex-1 flex flex-col space-y-4">
        <div className={`p-5 rounded-2xl border ${activeTheme.border} ${activeTheme.cardBg} flex-1 flex flex-col min-h-[480px] justify-between gap-4`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-purple-950/40 text-purple-400 p-2 rounded-lg border border-purple-500/30">
                <Sparkles className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h2 className="text-base font-display font-bold text-white uppercase tracking-wider">
                  AI Creative Advisor
                </h2>
                <p className="text-xs text-slate-400">
                  Formulate ad copy hooks, color guidelines, or layout scripts with Gemini.
                </p>
              </div>
            </div>

            <div className="text-right">
              {liveApiStatus === "healthy" ? (
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/20 px-2 py-0.5 rounded border border-emerald-500/30">
                  REAL GEMINI CORE ATTACHED
                </span>
              ) : (
                <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                  OFFLINE CAPABLE EMULATION
                </span>
              )}
            </div>
          </div>

          {/* Chat box viewport */}
          <div className="flex-1 border border-white/5 bg-black/40 rounded-xl p-4 overflow-y-auto min-h-[280px] flex flex-col space-y-3 font-sans">
            {chatHistory.map((item, idx) => (
              <div 
                key={idx} 
                className={`flex ${item.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[85%] rounded-lg p-3 text-xs leading-relaxed ${
                    item.role === 'user' 
                      ? 'bg-purple-950/40 border border-purple-500/30 text-purple-200' 
                      : 'bg-[#151722] border border-white/5 text-slate-300'
                  }`}
                >
                  <p className="text-[9px] uppercase font-bold text-slate-500 mb-1">
                    {item.role === 'user' ? 'Direct Visual Director' : 'Ultra Cognitive AI'}
                  </p>
                  <div className="whitespace-pre-line leading-relaxed font-mono">
                    {item.text}
                  </div>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="text-xs text-purple-400 animate-pulse font-mono pl-2 flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Formulating dynamic layout structures...</span>
              </div>
            )}
          </div>

          {/* Quick preset chips */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              onClick={() => handleSendMessage("Suggest a high-contrast vintage sepia palette configuration with space grotesk visual hierarchies for ad copy.")}
              className="p-1 px-2 border border-white/5 bg-white/5 hover:bg-white/10 rounded text-[10px] text-slate-300 text-center truncate font-mono"
            >
              📣 Poster Layout
            </button>
            <button
              onClick={() => handleSendMessage("Recommend high-latitude lighting calibrations to recover skin details under high-ISO noise grains.")}
              className="p-1 px-2 border border-white/5 bg-white/5 hover:bg-white/10 rounded text-[10px] text-slate-300 text-center truncate font-mono"
            >
              🎨 DSLR Denoise Formula
            </button>
            <button
              onClick={() => handleSendMessage("Provide a 15-second viral campaign tagline script set in Colombo for social media channels.")}
              className="p-1 px-2 border border-white/5 bg-white/5 hover:bg-white/10 rounded text-[10px] text-slate-300 text-center truncate font-mono"
            >
              🚀 Viral Tagline Loop
            </button>
            <button
              onClick={() => handleSendMessage("Write Photoshop scripting instructions to auto-retouch, focus stack and smart align blemish highlights.")}
              className="p-1 px-2 border border-white/5 bg-white/5 hover:bg-white/10 rounded text-[10px] text-slate-300 text-center truncate font-mono"
            >
              🕰️ High-Fidelity Macro Script
            </button>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={assistantPrompt}
              onChange={(e) => setAssistantPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask creative questions or write commands values..."
              className="flex-1 bg-black/45 border border-white/10 rounded px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-400"
            />
            <button
              onClick={() => handleSendMessage()}
              className="p-2.5 rounded bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center transition"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Generative Fill side (Right side) */}
      <div className="w-full lg:w-96 space-y-4 shrink-0">
        <div className={`p-6 rounded-2xl border ${activeTheme.border} ${activeTheme.cardBg} space-y-4 flex flex-col justify-between h-full`}>
          <div className="space-y-2">
            <span className="text-[9.5px] font-mono tracking-widest text-[#00D2FF] font-black uppercase bg-[#00D2FF]/10 px-2 py-0.5 rounded">
              💎 ADVANCED SYNTHESIS
            </span>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              AI Generative Fill Core
            </h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Synthesize contextual image boundaries, remove artifacts, or append volumetric backdrops dynamically.
            </p>
          </div>

          {/* Mode triggers */}
          <div className="grid grid-cols-2 gap-2 bg-[#0d0e14] border border-white/10 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setGenerativeFillCategory("background")}
              className={`p-2.5 text-xs font-bold uppercase rounded-md transition ${generativeFillCategory === "background" ? "bg-cyan-600 text-white shadow-xl" : "text-gray-500 hover:text-gray-300"}`}
            >
              Backdrop cyclic
            </button>
            <button
              type="button"
              onClick={() => setGenerativeFillCategory("object")}
              className={`p-2.5 text-xs font-bold uppercase rounded-md transition ${generativeFillCategory === "object" ? "bg-cyan-600 text-white shadow-xl" : "text-gray-500 hover:text-gray-300"}`}
            >
              Insert artifact
            </button>
          </div>

          {/* Prompt field */}
          <div className="space-y-2 pt-2 border-t border-white/5">
            <label className="text-[10px] font-mono uppercase text-slate-500 block">Prompt specifications</label>
            <textarea
              value={generativeFillPrompt}
              onChange={(e) => setGenerativeFillPrompt(e.target.value)}
              placeholder="e.g. 'Warm studio sunset, cinematic bokeh, deep shadows' or 'append neon spheres'..."
              className="w-full bg-black/45 border border-white/10 rounded-lg p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400 font-mono h-24 resize-none leading-relaxed"
            />
          </div>

          <div className="pt-2">
            <button
              onClick={triggerGenerativeFill}
              disabled={isGeneratingFill || !generativeFillPrompt}
              className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 disabled:opacity-40 text-white font-mono text-xs font-bold uppercase tracking-wider rounded-lg transition"
            >
              {isGeneratingFill ? "Synthesizing pixels..." : "Execute Generative Fill ✨"}
            </button>
          </div>
        </div>
      </div>

    </main>
  );
};
