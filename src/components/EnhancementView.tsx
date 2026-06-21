import React from "react";
import { SlidersHorizontal, Eye, RefreshCw, Layers } from "lucide-react";
import { AppTheme } from "../data/themes";

interface EnhancementViewProps {
  brightnessVal: number;
  setBrightnessVal: (v: number) => void;
  rawContrastVal: number;
  setRawContrastVal: (v: number) => void;
  saturationVal: number;
  setSaturationVal: (v: number) => void;
  customBokehVal: number;
  setCustomBokehVal: (v: number) => void;
  skinSmoothPower: number;
  setSkinSmoothPower: (v: number) => void;
  blemishReduction: number;
  setBlemishReduction: (v: number) => void;
  denoiseVal: number;
  setDenoiseVal: (v: number) => void;
  activePresetId: string;
  activeTheme: AppTheme;
  getActiveImageUrl: () => string;
  getFilterStyle: () => React.CSSProperties;
}

export const EnhancementView: React.FC<EnhancementViewProps> = ({
  brightnessVal,
  setBrightnessVal,
  rawContrastVal,
  setRawContrastVal,
  saturationVal,
  setSaturationVal,
  customBokehVal,
  setCustomBokehVal,
  skinSmoothPower,
  setSkinSmoothPower,
  blemishReduction,
  setBlemishReduction,
  denoiseVal,
  setDenoiseVal,
  activePresetId,
  activeTheme,
  getActiveImageUrl,
  getFilterStyle,
}) => {
  return (
    <main className="flex-1 overflow-y-auto p-6 flex flex-col xl:flex-row gap-6">
      
      {/* Control sliders side (Left) */}
      <div className="flex-1 space-y-6">
        <div className={`p-6 rounded-2xl border ${activeTheme.border} ${activeTheme.cardBg} space-y-4`}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-cyan-950/40 text-cyan-400 border border-cyan-500/30">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-display font-bold text-white uppercase tracking-wider">
                Volumetric Adjustments
              </h2>
              <p className="text-xs text-slate-400">
                Calibrate high-fidelity visual pipelines with live preview feedback.
              </p>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-white/5">
            {/* Brightness slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">Exposure / Brightness Boost</span>
                <span className="text-cyan-400 font-bold">{brightnessVal > 0 ? `+${brightnessVal}` : brightnessVal}%</span>
              </div>
              <input
                type="range"
                min="-100"
                max="100"
                value={brightnessVal}
                onChange={(e) => setBrightnessVal(parseInt(e.target.value))}
                className="w-full accent-cyan-400 bg-white/5 h-1.5 rounded-lg appearance-none cursor-ew-resize"
              />
            </div>

            {/* Contrast slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">Specular Contrast Density</span>
                <span className="text-cyan-400 font-bold">{rawContrastVal > 0 ? `+${rawContrastVal}` : rawContrastVal}%</span>
              </div>
              <input
                type="range"
                min="-100"
                max="100"
                value={rawContrastVal}
                onChange={(e) => setRawContrastVal(parseInt(e.target.value))}
                className="w-full accent-cyan-400 bg-white/5 h-1.5 rounded-lg appearance-none cursor-ew-resize"
              />
            </div>

            {/* Saturation slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">Chromatic Saturation Matrix</span>
                <span className="text-cyan-400 font-bold">{saturationVal > 0 ? `+${saturationVal}` : saturationVal}%</span>
              </div>
              <input
                type="range"
                min="-100"
                max="100"
                value={saturationVal}
                onChange={(e) => setSaturationVal(parseInt(e.target.value))}
                className="w-full accent-cyan-400 bg-white/5 h-1.5 rounded-lg appearance-none cursor-ew-resize"
              />
            </div>

            {/* Cosmetic Skin Smooth slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">Cosmetic Skin Smooth Power</span>
                <span className="text-purple-400 font-bold">{skinSmoothPower}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={skinSmoothPower}
                onChange={(e) => setSkinSmoothPower(parseInt(e.target.value))}
                className="w-full accent-purple-400 bg-white/5 h-1.5 rounded-lg appearance-none cursor-ew-resize"
              />
            </div>

            {/* Blemish Reduction slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">Specular Highlight / Blemish Healing</span>
                <span className="text-purple-400 font-bold">{blemishReduction}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={blemishReduction}
                onChange={(e) => setBlemishReduction(parseInt(e.target.value))}
                className="w-full accent-purple-400 bg-white/5 h-1.5 rounded-lg appearance-none cursor-ew-resize"
              />
            </div>

            {/* Custom Bokeh depth slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">DSLR Aperture Bokeh Blur Depth</span>
                <span className="text-[#00D2FF] font-bold">{customBokehVal}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={customBokehVal}
                onChange={(e) => setCustomBokehVal(parseInt(e.target.value))}
                className="w-full accent-[#00D2FF] bg-white/5 h-1.5 rounded-lg appearance-none cursor-ew-resize"
              />
            </div>

            {/* High-ISO Denoise Signal slider (USER REQUIRED 2) */}
            <div className="space-y-1.5 pt-2 border-t border-white/5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-amber-400 font-bold">💎 High-ISO Signal Denoise</span>
                <span className="text-amber-300 font-bold">{denoiseVal}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={denoiseVal}
                onChange={(e) => setDenoiseVal(parseInt(e.target.value))}
                className="w-full accent-amber-400 bg-white/5 h-1.5 rounded-lg appearance-none cursor-ew-resize"
              />
              <p className="text-[9.5px] text-slate-500 font-mono italic leading-normal">
                Reduce photographic film grain noise structures or sensor ISO anomalies while preserving edge pixels sharpness.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Retouch visual live monitor side (Right) */}
      <div className="w-full xl:w-[480px] space-y-4 shrink-0">
        <div className={`p-6 rounded-2xl border ${activeTheme.border} ${activeTheme.cardBg} flex flex-col h-full justify-between gap-4`}>
          <div>
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-1">
              Active Specimen Monitor
            </h3>
            <p className="text-[11px] text-slate-500">
              Live calculated output applying volumetric adjustments.
            </p>
          </div>

          <div className="relative aspect-[4/3] rounded-xl border border-white/10 overflow-hidden bg-black flex items-center justify-center">
            <img 
              src={getActiveImageUrl()} 
              style={{
                ...getFilterStyle(),
                filter: `${getFilterStyle().filter} blur(${denoiseVal * 0.05}px)`
              }} 
              className="w-full h-full object-cover transition-all duration-500 ease-in-out" 
              referrerPolicy="no-referrer"
            />
            {denoiseVal > 25 && (
              <div className="absolute top-3 left-3 bg-amber-950/80 border border-amber-500/30 rounded px-2 py-0.5 text-[9px] text-amber-300 font-mono animate-pulse uppercase font-extrabold shadow-lg">
                ✨ Denoise algorithm active (+{denoiseVal}%)
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-white/5">
            <span className="text-[10px] font-mono text-slate-500">Preset profile:</span>
            <span className="text-xs font-mono text-cyan-400 font-bold uppercase">{activePresetId}</span>
          </div>
        </div>
      </div>

    </main>
  );
};
