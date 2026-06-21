import React, { useState, useEffect } from "react";
import { Cpu, Zap, Activity, ShieldAlert, Trash2 } from "lucide-react";

export default function GpuPerformance() {
  const [gpuTemp, setGpuTemp] = useState(54);
  const [vramUsage, setVramUsage] = useState(6.4); // in GB
  const [fps, setFps] = useState(144);
  const [cacheSize, setCacheSize] = useState(384.8); // in MB
  const [pipelineState, setPipelineState] = useState<"IDLE" | "PROCESSING" | "COMPILING">("IDLE");
  const [optimizationSuccess, setOptimizationSuccess] = useState(false);

  // Dynamic status simulations
  useEffect(() => {
    const interval = setInterval(() => {
      setGpuTemp(prev => {
        const offset = Math.random() > 0.5 ? 1 : -1;
        const target = prev + offset;
        return target < 48 ? 48 : target > 65 ? 65 : target;
      });

      setFps(prev => {
        const offset = Math.round((Math.random() - 0.5) * 4);
        const target = prev + offset;
        return target < 135 ? 135 : target > 144 ? 144 : target;
      });
      
      setVramUsage(prev => {
        const offset = (Math.random() - 0.5) * 0.1;
        const target = Number((prev + offset).toFixed(2));
        return target < 5.8 ? 5.8 : target > 8.2 ? 8.2 : target;
      });
    }, 2800);

    return () => clearInterval(interval);
  }, []);

  const handlePurgeCache = () => {
    setPipelineState("COMPILING");
    setTimeout(() => {
      setCacheSize(0.0);
      setPipelineState("IDLE");
      setOptimizationSuccess(true);
      setTimeout(() => setOptimizationSuccess(false), 3000);
    }, 1200);
  };

  const handleWarmupGPUPipeline = () => {
    setPipelineState("PROCESSING");
    setTimeout(() => {
      setVramUsage(11.8);
      setGpuTemp(68);
      setTimeout(() => {
        setPipelineState("IDLE");
        setVramUsage(7.2);
        setGpuTemp(58);
      }, 2000);
    }, 1000);
  };

  return (
    <div id="gpu-telemetry-panel" className="bg-[#121420]/80 border border-[#272a3e] rounded-xl p-4 shadow-xl backdrop-blur-md">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#212335]">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-cyan-400" />
          <span className="font-space font-semibold text-xs tracking-wider text-slate-300 uppercase">
            GPU Performance Engine
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-[10px] font-mono font-medium text-emerald-400">
            CUDA / DIRECTML ACTIVE
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {/* Metric 1 */}
        <div className="bg-[#0b0c13]/50 border border-[#1b1c2b] rounded-lg p-2.5">
          <span className="text-[10px] font-mono text-slate-500 block uppercase">GPU Temperature</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-lg font-space font-bold text-slate-200">{gpuTemp}</span>
            <span className="text-xs text-orange-400">°C</span>
          </div>
          <div className="w-full bg-[#1b1c2b] h-1 rounded-full mt-1.5 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-yellow-500 to-orange-500 h-full transition-all duration-1000" 
              style={{ width: `${(gpuTemp / 100) * 100}%` }}
            />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-[#0b0c13]/50 border border-[#1b1c2b] rounded-lg p-2.5">
          <span className="text-[10px] font-mono text-slate-500 block uppercase">VRAM Usage</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-lg font-space font-bold text-slate-200">{vramUsage.toFixed(1)}</span>
            <span className="text-xs text-slate-400">/ 16 GB</span>
          </div>
          <div className="w-full bg-[#1b1c2b] h-1 rounded-full mt-1.5 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 h-full transition-all duration-1000" 
              style={{ width: `${(vramUsage / 16) * 100}%` }}
            />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-[#0b0c13]/50 border border-[#1b1c2b] rounded-lg p-2.5">
          <span className="text-[10px] font-mono text-slate-500 block uppercase">Viewport Framerate</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-lg font-space font-bold text-slate-200">{fps}</span>
            <span className="text-xs text-cyan-400">FPS</span>
          </div>
          <div className="w-full bg-[#1b1c2b] h-1 rounded-full mt-1.5 overflow-hidden">
            <div 
              className="bg-cyan-500 h-full transition-all duration-500" 
              style={{ width: `${(fps / 144) * 100}%` }}
            />
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-[#0b0c13]/50 border border-[#1b1c2b] rounded-lg p-2.5">
          <span className="text-[10px] font-mono text-slate-500 block uppercase">Local Texture Cache</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-lg font-space font-bold text-slate-200">{cacheSize.toFixed(1)}</span>
            <span className="text-xs text-slate-400">MB</span>
          </div>
          <div className="w-full bg-[#1b1c2b] h-1 rounded-full mt-1.5 overflow-hidden">
            <div 
              className="bg-purple-500 h-full transition-all duration-1000" 
              style={{ width: `${Math.min((cacheSize / 500) * 100, 100)}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#1a1b2b]">
        <div className="flex gap-2 text-[11px] text-slate-400 items-center">
          <Zap className="w-3.5 h-3.5 text-yellow-400" />
          <span>Pipeline Status: </span>
          <span className={`font-mono font-bold ${
            pipelineState === "PROCESSING" ? "text-amber-400" :
            pipelineState === "COMPILING" ? "text-cyan-400" : "text-slate-400"
          }`}>
            {pipelineState}
          </span>
        </div>

        <div className="flex gap-2">
          {optimizationSuccess && (
            <span className="text-[10px] font-medium text-emerald-400 bg-emerald-950/40 px-2 py-1 rounded inline-flex items-center">
              Cache Cleared & Re-indexed Successfully!
            </span>
          )}

          <button
            id="gpu-purge-cache-btn"
            onClick={handlePurgeCache}
            disabled={pipelineState !== "IDLE" || cacheSize === 0}
            className="px-2.5 py-1 text-[11px] font-medium bg-[#1a1c2a] border border-[#2d3047] rounded hover:border-[#3b82f6] hover:bg-[#202336] transition duration-205 flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300"
          >
            <Trash2 className="w-3 h-3 text-red-400" />
            Purge Cache
          </button>

          <button
            id="gpu-warmup-btn"
            onClick={handleWarmupGPUPipeline}
            disabled={pipelineState !== "IDLE"}
            className="px-2.5 py-1 text-[11px] font-medium bg-gradient-to-r from-blue-600 to-indigo-600 rounded hover:from-blue-500 hover:to-indigo-500 transition duration-205 text-slate-200 shadow-md shadow-blue-900/20 disabled:opacity-40"
          >
            Boost Pipetensors
          </button>
        </div>
      </div>
    </div>
  );
}
