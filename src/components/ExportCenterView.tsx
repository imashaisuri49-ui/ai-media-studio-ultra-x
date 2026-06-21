import React, { useState, useEffect } from "react";
import { 
  Download, 
  RefreshCw, 
  Eye, 
  Columns, 
  Save, 
  Trash2, 
  Plus, 
  Sparkles, 
  Database, 
  Check, 
  Tv, 
  Layers, 
  Settings,
  Share2
} from "lucide-react";
import { AppTheme } from "../data/themes";
import { db, isLiveFirebase } from "../lib/firebase";
import { collection, onSnapshot, doc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";

interface ExportProfile {
  id: string;
  name: string;
  width: number;
  height: number;
  fileType: string;
  platform: string;
  aspectRatio: string;
  description: string;
}

const DEFAULT_PROFILES: ExportProfile[] = [
  {
    id: "insta_story",
    name: "Instagram Vertical Reels",
    width: 1080,
    height: 1920,
    fileType: "PNG",
    platform: "Instagram",
    aspectRatio: "9:16",
    description: "Ideal vertical aspect spec for immersive mobile vertical stories and placements."
  },
  {
    id: "commercial_square",
    name: "Standard Square Post Campaign",
    width: 1440,
    height: 1440,
    fileType: "JPEG",
    platform: "Meta / Grid",
    aspectRatio: "1:1",
    description: "Classic grid balance optimized for social media feeds, newsletters, and banners."
  },
  {
    id: "widescreen_promo",
    name: "HD Landscape Cinematic Banner",
    width: 1920,
    height: 1080,
    fileType: "PNG",
    platform: "YouTube",
    aspectRatio: "16:9",
    description: "Widescreen profile for digital screens, video thumbnails, and desktop viewers."
  },
  {
    id: "fine_art_print",
    name: "Archival Print Portfolio Spec",
    width: 3000,
    height: 4500,
    fileType: "TIFF",
    platform: "Print",
    aspectRatio: "2:3",
    description: "High-resolution 300 DPI portrait asset suitable for heavy canvas fine-art layouts."
  }
];

interface CustomExportPreset {
  id: string;
  name: string;
  width: number;
  height: number;
  fileType: string;
  platform: string;
  isCustom: boolean;
  author?: string;
}

const PRESET_COLLECTION_NAME = "user_export_presets_v3";

const SYSTEM_DEFAULT_PRESETS: CustomExportPreset[] = [
  {
    id: "system-16-9-ultra",
    name: "4K Cinematic Landscape Master",
    width: 3840,
    height: 2160,
    fileType: "PNG",
    platform: "YouTube Ultra HD",
    isCustom: false,
    author: "System Engine"
  },
  {
    id: "system-tiktok-viral",
    name: "TikTok Portrait HD Fastrender",
    width: 1080,
    height: 1920,
    fileType: "WebP",
    platform: "TikTok Vertical",
    isCustom: false,
    author: "System Engine"
  },
  {
    id: "system-print-heavy",
    name: "Archival Print Poster 120DPI",
    width: 4500,
    height: 6000,
    fileType: "TIFF",
    platform: "Fine Art Print",
    isCustom: false,
    author: "System Engine"
  }
];

interface ExportCenterViewProps {
  selectedExportProfile: string;
  setSelectedExportProfile: (id: string) => void;
  isExporting: boolean;
  exportSuccessMessage: string;
  triggerExport: () => void;
  activePresetId: string;
  activeTheme: AppTheme;
  getActiveImageUrl: () => string;
  getFilterStyle: () => React.CSSProperties;
}

export const ExportCenterView: React.FC<ExportCenterViewProps> = ({
  selectedExportProfile,
  setSelectedExportProfile,
  isExporting,
  exportSuccessMessage,
  triggerExport,
  activePresetId,
  activeTheme,
  getActiveImageUrl,
  getFilterStyle,
}) => {
  const [previewMode, setPreviewMode] = useState<"slider" | "grid" | "filtered">("slider");
  const [sliderVal, setSliderVal] = useState<number>(50);

  // Custom shifters
  const [customWidth, setCustomWidth] = useState<number>(1080);
  const [customHeight, setCustomHeight] = useState<number>(1920);
  const [fileType, setFileType] = useState<string>("PNG");
  const [targetPlatform, setTargetPlatform] = useState<string>("Instagram");
  const [newPresetName, setNewPresetName] = useState<string>("");

  // Presets list
  const [exportPresets, setExportPresets] = useState<CustomExportPreset[]>(() => {
    try {
      const saved = localStorage.getItem("media_studio_custom_export_presets_v3");
      return saved ? JSON.parse(saved) : SYSTEM_DEFAULT_PRESETS;
    } catch {
      return SYSTEM_DEFAULT_PRESETS;
    }
  });

  const [syncStatus, setSyncStatus] = useState<"connecting" | "live" | "offline">("offline");

  // Compile Progress Simulation
  const [compileProgress, setCompileProgress] = useState<number>(0);
  const [compileStatus, setCompileStatus] = useState<string>("");
  const [compileSuccess, setCompileSuccess] = useState<string>("");
  const [isCompiling, setIsCompiling] = useState<boolean>(false);

  // Sync custom width and height whenever default profile changes
  useEffect(() => {
    const matched = DEFAULT_PROFILES.find(p => p.id === selectedExportProfile);
    if (matched) {
      setCustomWidth(matched.width);
      setCustomHeight(matched.height);
      setFileType(matched.fileType);
      setTargetPlatform(matched.platform);
    }
  }, [selectedExportProfile]);

  // Firestore sync for sharing named presets across other tabs/users
  useEffect(() => {
    if (!isLiveFirebase || !db) {
      setSyncStatus("offline");
      return;
    }

    setSyncStatus("connecting");
    try {
      const collectionRef = collection(db, PRESET_COLLECTION_NAME);
      const unsubscribe = onSnapshot(collectionRef, (snapshot) => {
        const fetched: CustomExportPreset[] = [];
        snapshot.forEach((doc) => {
          fetched.push({ id: doc.id, ...doc.data() } as CustomExportPreset);
        });

        const merged = [...fetched];
        SYSTEM_DEFAULT_PRESETS.forEach(def => {
          if (!merged.some(m => m.id === def.id)) {
            merged.unshift(def);
          }
        });

        setExportPresets(merged);
        setSyncStatus("live");
      }, (err) => {
        console.error("Firestore sync failed for Export presets", err);
        setSyncStatus("offline");
      });

      return () => unsubscribe();
    } catch (e) {
      console.error(e);
      setSyncStatus("offline");
    }
  }, []);

  // Save preset to both LocalStorage and Firestore
  const handleSavePreset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPresetName.trim()) return;

    const presetId = `export-preset-${newPresetName.trim().toLowerCase().replace(/[^a-z0-9]/g, "-")}-${Date.now()}`;
    const newPreset: CustomExportPreset = {
      id: presetId,
      name: newPresetName.trim(),
      width: customWidth,
      height: customHeight,
      fileType: fileType,
      platform: targetPlatform,
      isCustom: true,
      author: "Local Architect"
    };

    const updated = [newPreset, ...exportPresets.filter(p => p.id !== presetId)];
    setExportPresets(updated);
    localStorage.setItem("media_studio_custom_export_presets_v3", JSON.stringify(updated));
    setNewPresetName("");

    if (isLiveFirebase && db) {
      try {
        await setDoc(doc(db, PRESET_COLLECTION_NAME, presetId), {
          name: newPreset.name,
          width: newPreset.width,
          height: newPreset.height,
          fileType: newPreset.fileType,
          platform: newPreset.platform,
          isCustom: true,
          author: "Workspace Partner",
          timestamp: serverTimestamp()
        });
      } catch (err) {
        console.error("Failed writing export preset to Firestore", err);
      }
    }
  };

  // Delete preset
  const handleDeletePreset = async (presetId: string) => {
    const updated = exportPresets.filter(p => p.id !== presetId);
    setExportPresets(updated);
    localStorage.setItem("media_studio_custom_export_presets_v3", JSON.stringify(updated));

    if (isLiveFirebase && db && presetId.startsWith("export-preset-")) {
      try {
        await deleteDoc(doc(db, PRESET_COLLECTION_NAME, presetId));
      } catch (err) {
        console.error("Failed deleting preset from Firestore", err);
      }
    }
  };

  // Load Preset
  const handleLoadPreset = (preset: CustomExportPreset) => {
    setCustomWidth(preset.width);
    setCustomHeight(preset.height);
    setFileType(preset.fileType);
    setTargetPlatform(preset.platform);
  };

  // Perform custom compilation
  const runCustomCompileSimulation = () => {
    setIsCompiling(true);
    setCompileProgress(0);
    setCompileSuccess("");

    const compilePhases = [
      { progress: 15, msg: "Allocating 16-bit raster memory cache..." },
      { progress: 35, msg: "Running dynamic auto-anchors aspect ratio calculation..." },
      { progress: 55, msg: "Injecting retouched XMP filter arrays & Adobe metadata channels..." },
      { progress: 75, msg: "Compressing layers with hardware acceleration matrices..." },
      { progress: 95, msg: "Compiling structural publish-ready image files..." },
      { progress: 100, msg: "Finishing frame export..." }
    ];

    let currentPhase = 0;
    const interval = setInterval(() => {
      if (currentPhase < compilePhases.length) {
        setCompileProgress(compilePhases[currentPhase].progress);
        setCompileStatus(compilePhases[currentPhase].msg);
        currentPhase++;
      } else {
        clearInterval(interval);
        setIsCompiling(false);
        setCompileStatus("");
        setCompileSuccess(
          `Successfully compiled smart dynamic export with custom parameters:\n` +
          `• Target Size: ${customWidth} x ${customHeight} (Aspect ${(customWidth / customHeight).toFixed(2)})\n` +
          `• Format standard: ${fileType} (lossless compilation block)\n` +
          `• Intended Service: ${targetPlatform}\n` +
          `• Digital Watermark and EXIF profile headers loaded.`
        );
        setTimeout(() => setCompileSuccess(""), 12000);
      }
    }, 550);
  };

  return (
    <main className="flex-1 overflow-y-auto p-6 flex flex-col xl:flex-row gap-6 bg-[#09090d]">
      
      {/* LEFT ADJUSTMENT PANEL & DESIGN BUILDER */}
      <div className="flex-1 space-y-6">
        
        {/* Dynamic Custom Export Profile Configuration */}
        <div className={`p-6 rounded-2xl border ${activeTheme.border} ${activeTheme.cardBg} space-y-5 shadow-[0_4px_30px_rgba(0,0,0,0.4)]`}>
          <div className="flex items-center gap-3 border-b border-white/5 pb-4">
            <div className="p-2 rounded bg-emerald-950/40 text-emerald-400 border border-emerald-500/30">
              <Settings className="w-5 h-5 text-emerald-400 animate-spin" style={{ animationDuration: "12s" }} />
            </div>
            <div>
              <h2 className="text-base font-display font-black text-white uppercase tracking-wider">
                Export Resolution & Platform Configuration
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Real-time custom adjustments of file dimensions, platforms, and export formats
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
            
            {/* Resolution shifters */}
            <div className="space-y-4">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-mono block mb-1">
                  Adjust Custom Width (px)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="200"
                    max="8192"
                    step="10"
                    value={customWidth}
                    onChange={(e) => {
                      setCustomWidth(Number(e.target.value));
                      setSelectedExportProfile("custom");
                    }}
                    className="flex-1 accent-emerald-500 h-1 bg-white/10 rounded-lg cursor-pointer"
                  />
                  <input
                    type="number"
                    min="100"
                    max="16384"
                    value={customWidth}
                    onChange={(e) => {
                      setCustomWidth(Math.max(100, Number(e.target.value)));
                      setSelectedExportProfile("custom");
                    }}
                    className="w-20 bg-[#111119] border border-white/10 rounded px-2 py-1 text-xs text-center font-mono text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-mono block mb-1">
                  Adjust Custom Height (px)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="200"
                    max="8192"
                    step="10"
                    value={customHeight}
                    onChange={(e) => {
                      setCustomHeight(Number(e.target.value));
                      setSelectedExportProfile("custom");
                    }}
                    className="flex-1 accent-emerald-500 h-1 bg-white/10 rounded-lg cursor-pointer"
                  />
                  <input
                    type="number"
                    min="100"
                    max="16384"
                    value={customHeight}
                    onChange={(e) => {
                      setCustomHeight(Math.max(100, Number(e.target.value)));
                      setSelectedExportProfile("custom");
                    }}
                    className="w-20 bg-[#111119] border border-white/10 rounded px-2 py-1 text-xs text-center font-mono text-white"
                  />
                </div>
              </div>
            </div>

            {/* Target platform + File Type dropdowns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-mono block">
                  Publish Platform
                </label>
                <select
                  value={targetPlatform}
                  onChange={(e) => {
                    setTargetPlatform(e.target.value);
                    setSelectedExportProfile("custom");
                  }}
                  className="w-full bg-[#111119] border border-white/10 p-2 rounded-lg text-xs font-mono text-slate-250 cursor-pointer focus:border-emerald-500 transition"
                >
                  <option value="Instagram">Instagram (High Res)</option>
                  <option value="YouTube">YouTube Thumbnail</option>
                  <option value="TikTok">TikTok Vertical Video</option>
                  <option value="Facebook">Meta Campaign Grid</option>
                  <option value="Pinterest">Pinterest Pin</option>
                  <option value="Print">High-DPI Giclée Print</option>
                  <option value="Website">Ultra HD Web Hero</option>
                  <option value="Custom Spec">Custom Asset Specification</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-mono block">
                  Encoding Format
                </label>
                <select
                  value={fileType}
                  onChange={(e) => {
                    setFileType(e.target.value);
                    setSelectedExportProfile("custom");
                  }}
                  className="w-full bg-[#111119] border border-white/10 p-2 rounded-lg text-xs font-mono text-slate-250 cursor-pointer focus:border-emerald-500 transition"
                >
                  <option value="PNG">PNG (16-bit Lossless)</option>
                  <option value="JPEG">JPEG (Progressive Quality)</option>
                  <option value="WebP">WebP (Extreme Compression)</option>
                  <option value="TIFF">TIFF (Archival Printing)</option>
                  <option value="PSD">Adobe Photoshop CC Layers</option>
                </select>
              </div>
            </div>

          </div>

          {/* Form to save configurations as named Export Presets */}
          <form onSubmit={handleSavePreset} className="pt-4 border-t border-white/5 space-y-3">
            <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-400 flex items-center gap-1.5ClassName">
              <Share2 className="w-3.5 h-3.5" /> Save Configuration As Named Preset Look
            </h3>
            
            <div className="flex flex-col sm:flex-row items-stretch gap-3">
              <input
                type="text"
                placeholder="Name your export preset... (e.g., Ultra 8K Cinematic Screen)"
                value={newPresetName}
                onChange={(e) => setNewPresetName(e.target.value)}
                className="flex-1 bg-[#111119] border border-white/10 p-2.5 rounded-lg text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
              />
              <button
                type="submit"
                disabled={!newPresetName.trim()}
                className={`py-2 px-5 rounded-lg font-mono text-xs font-extrabold uppercase tracking-wider flex items-center justify-center gap-1.5 transition whitespace-nowrap ${
                  newPresetName.trim()
                    ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg cursor-pointer"
                    : "bg-slate-900 text-slate-500 border border-white/5 cursor-not-allowed"
                }`}
              >
                <Save className="w-3.5 h-3.5" /> Save Spec Preset
              </button>
            </div>
          </form>
        </div>

        {/* Saved presets and standard profiles quick action deck */}
        <div className={`p-6 rounded-2xl border ${activeTheme.border} ${activeTheme.cardBg} space-y-5 shadow-lg`}>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-[#9D50BB] flex items-center gap-2">
                📂 Quick-Load Profiles & Custom Presets
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Swap immediately between preconfigured default platform profiles or custom registered presets.
              </p>
            </div>

            {/* Cloud Badge indicator */}
            {syncStatus === "live" ? (
              <span className="text-[9px] bg-emerald-950/70 border border-emerald-500/30 text-emerald-400 py-0.5 px-2 rounded-full font-mono font-bold flex items-center gap-1">
                <Database className="w-3 h-3 text-emerald-400" /> Synced Live
              </span>
            ) : (
              <span className="text-[9px] bg-slate-900 border border-white/5 text-slate-400 py-0.5 px-2 rounded-full font-mono font-bold">
                Local Drive
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Column A: System Native Standard Profiles */}
            <div className="space-y-2.5 border-r border-white/5 pr-0 md:pr-4">
              <span className="text-[10px] font-mono text-slate-450 uppercase tracking-wider font-bold block mb-1">
                🌐 standard platform anchors
              </span>
              
              <div className="space-y-2 max-h-[220px] overflow-y-auto">
                {DEFAULT_PROFILES.map((profile) => {
                  const isCurMatch = 
                    selectedExportProfile === profile.id || 
                    (customWidth === profile.width && customHeight === profile.height && fileType === profile.fileType);
                  return (
                    <button
                      key={profile.id}
                      onClick={() => setSelectedExportProfile(profile.id)}
                      className={`w-full p-3 rounded-xl border text-left transition flex items-center justify-between gap-2.5 ${
                        isCurMatch
                          ? "bg-emerald-950/20 border-emerald-500/60"
                          : "bg-[#0d0e14] border-white/5 hover:border-white/10"
                      }`}
                    >
                      <div className="min-w-0 select-none">
                        <span className="text-xs font-bold text-slate-100 uppercase tracking-wide truncate block">
                          {profile.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono italic block mt-0.5">
                          {profile.platform} • {profile.width} x {profile.height} ({profile.fileType})
                        </span>
                      </div>
                      
                      {isCurMatch && (
                        <div className="p-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 shrink-0">
                          <Check className="w-3 h-3 text-emerald-400" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Column B: Dynamic User Generated Saved Presets */}
            <div className="space-y-2.5">
              <span className="text-[10px] font-mono text-[#D3C7F3] uppercase tracking-wider font-bold block mb-1">
                ⭐ Saved Custom Export Presets
              </span>

              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {exportPresets.length === 0 ? (
                  <div className="h-32 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-xl p-4 text-center">
                    <p className="text-[11px] font-mono text-slate-500">No custom presets registered.</p>
                  </div>
                ) : (
                  exportPresets.map((preset) => (
                    <div
                      key={preset.id}
                      className="p-3 bg-[#0f0f16] border border-white/10 rounded-xl hover:border-white/20 transition flex items-center justify-between gap-2.5"
                    >
                      <div className="min-w-0 select-none">
                        <span className="text-xs font-black text-white truncate block uppercase tracking-wide" title={preset.name}>
                          {preset.name}
                        </span>
                        <p className="text-[9.5px] font-mono text-slate-400 leading-normal block mt-1">
                          {preset.platform} • <span className="text-pink-400 font-bold">{preset.width}x{preset.height}</span> ({preset.fileType})
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleLoadPreset(preset)}
                          className="px-2 py-1 bg-emerald-500/10 hover:bg-emerald-600 text-[9.5px] font-mono font-bold uppercase text-emerald-400 hover:text-white border border-emerald-500/20 rounded transition cursor-pointer"
                          title="Instantly loading specs before starting task"
                        >
                          ⚡ Apply
                        </button>
                        
                        {preset.isCustom && (
                          <button
                            onClick={() => handleDeletePreset(preset.id)}
                            className="p-1 hover:bg-red-950 text-slate-500 hover:text-red-400 rounded transition cursor-pointer border border-white/5"
                            title="Remove preset"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* RIGHT-SIDE MODULE DIAGNOSTICS & COMPARATOR PREVIEW AREA */}
      <div className="w-full xl:w-[420px] space-y-4 shrink-0">
        <div className={`p-6 rounded-2xl border ${activeTheme.border} ${activeTheme.cardBg} space-y-5 flex flex-col justify-between h-full shadow-2xl`}>
          <div className="flex flex-col gap-2">
            <div>
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
                <Tv className="w-4 h-4 text-indigo-400 animate-pulse" /> Live HD Raster Comparator
              </h3>
              <p className="text-[11px] text-slate-500">
                Compare original source layer against retouched filtered output. Drag boundaries or toggle view grids.
              </p>
            </div>

            {/* Selector tabs for preview comparison */}
            <div className="flex bg-[#07070a] border border-white/5 p-1 rounded-lg gap-1 text-[11px] font-mono">
              <button
                onClick={() => setPreviewMode("slider")}
                className={`flex-1 py-1 px-2 rounded-md transition text-center flex items-center justify-center gap-1.5 ${
                  previewMode === "slider"
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Eye className="w-3" /> Slider
              </button>
              <button
                onClick={() => setPreviewMode("grid")}
                className={`flex-1 py-1 px-2 rounded-md transition text-center flex items-center justify-center gap-1.5 ${
                  previewMode === "grid"
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Columns className="w-3 h-3" /> Side-by-Side
              </button>
              <button
                onClick={() => setPreviewMode("filtered")}
                className={`flex-1 py-1 px-2 rounded-md transition text-center flex items-center justify-center gap-1.5 ${
                  previewMode === "filtered"
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Final look
              </button>
            </div>
          </div>

          {/* Interactive view wrapper based on selected preview mode */}
          <div className="flex-1 flex flex-col items-center justify-center p-3 bg-[#08080d]/60 border border-white/5 rounded-xl min-h-[260px]">
            {previewMode === "slider" && (
              <div className="w-full flex flex-col items-center gap-4">
                <div 
                  className="relative shadow-2xl rounded-lg border border-white/20 bg-black flex items-center justify-center overflow-hidden h-40 w-full max-w-[280px]"
                  style={{ aspectRatio: `${customWidth}/${customHeight}` }}
                >
                  {/* Underlay / Filtered Image */}
                  <img 
                    src={getActiveImageUrl()} 
                    style={getFilterStyle()} 
                    className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
                    referrerPolicy="no-referrer"
                    alt="Filtered Output underlay"
                  />

                  {/* Overlay / Original Image clipped by slider position */}
                  <div 
                    className="absolute inset-0 w-full h-full overflow-hidden select-none pointer-events-none"
                    style={{ clipPath: `polygon(0 0, ${sliderVal}% 0, ${sliderVal}% 100%, 0 100%)` }}
                  >
                    <img 
                      src={getActiveImageUrl()} 
                      className="absolute inset-0 w-full h-full object-cover animate-filter-fadein"
                      referrerPolicy="no-referrer"
                      alt="Original overlay"
                    />
                  </div>

                  {/* Divider line helper */}
                  <div 
                    className="absolute top-0 bottom-0 w-[2px] bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] pointer-events-none animate-pulse"
                    style={{ left: `${sliderVal}%` }}
                  >
                    <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-red-400 border border-white shadow-md flex items-center justify-center text-[8px] font-bold text-white uppercase font-mono">
                      ↔
                    </div>
                  </div>

                  <div className="absolute bottom-2 left-2 bg-black/80 border border-white/10 rounded px-1.5 py-0.5 text-[8px] font-mono text-slate-400 uppercase">
                    Original
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black/80 border border-emerald-500/30 rounded px-1.5 py-0.5 text-[8px] font-mono text-emerald-450 uppercase">
                    Retouched
                  </div>
                </div>

                <div className="w-full max-w-[250px] space-y-1">
                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                    <span>Original</span>
                    <span>Retouched</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={sliderVal}
                    onChange={(e) => setSliderVal(Number(e.target.value))}
                    className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-red-500"
                  />
                </div>
              </div>
            )}

            {previewMode === "grid" && (
              <div className="w-full flex gap-3 justify-center items-center">
                {/* Original side of Grid */}
                <div className="flex flex-col items-center gap-1.5 flex-1 max-w-[140px]">
                  <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">Unfiltered</span>
                  <div className="relative shadow-md rounded border border-white/10 bg-black overflow-hidden aspect-square w-full">
                    <img 
                      src={getActiveImageUrl()} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                      alt="Raw source"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-black/50 text-center py-0.5 text-[8px] font-mono text-slate-400">
                      Original
                    </div>
                  </div>
                </div>

                {/* Final Look side of Grid */}
                <div className="flex flex-col items-center gap-1.5 flex-1 max-w-[140px]">
                  <span className="text-[9px] font-mono text-emerald-400 uppercase tracking-wider">Applied Retouch</span>
                  <div className="relative shadow-md rounded border border-emerald-500/20 bg-black overflow-hidden aspect-square w-full">
                    <img 
                      src={getActiveImageUrl()} 
                      style={getFilterStyle()} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                      alt="Retouched preview"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-emerald-950/80 text-center py-0.5 text-[8px] font-mono text-emerald-400">
                      {activePresetId || "RAW"}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {previewMode === "filtered" && (
              <div 
                className="relative shadow-2xl rounded-lg border border-white/20 bg-black flex items-center justify-center overflow-hidden h-40 w-40 max-w-full"
                style={{ aspectRatio: `${customWidth}/${customHeight}` }}
              >
                <img 
                  src={getActiveImageUrl()} 
                  style={getFilterStyle()} 
                  className="w-full h-full object-cover transition-all duration-500 ease-in-out"
                  referrerPolicy="no-referrer"
                  alt="Applied look"
                />
              </div>
            )}

            <div className="text-center space-y-1 w-full mt-4 bg-black/20 p-2.5 rounded-lg border border-white/5">
              <div className="text-[10px] font-mono text-slate-400">
                ACTIVE LOOK: <span className="text-cyan-400 font-bold uppercase">{activePresetId || "RETROLIGHT CORE"}</span>
              </div>
              <div className="text-[9.5px] text-slate-400 font-mono">
                COMPILATION SPECS:
              </div>
              <div className="text-[10px] text-emerald-400 font-bold font-mono">
                {customWidth} x {customHeight} px • {fileType} ({targetPlatform})
              </div>
            </div>
          </div>

          {/* Trigger button & Progressive Compilation steps overlay */}
          <div className="space-y-3 pt-2 border-t border-white/5">
            {compileSuccess ? (
              <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-lg p-3 text-[10px] font-mono text-emerald-300 leading-relaxed whitespace-pre-wrap">
                {compileSuccess}
              </div>
            ) : isCompiling ? (
              <div className="bg-[#0c0d16] border border-white/10 rounded-lg p-3 space-y-2">
                <div className="flex justify-between text-[10px] font-mono text-slate-400">
                  <span className="truncate">{compileStatus}</span>
                  <span>{compileProgress}%</span>
                </div>
                <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-emerald-500 to-indigo-500 h-full transition-all duration-300"
                    style={{ width: `${compileProgress}%` }}
                  />
                </div>
              </div>
            ) : (
              <button
                onClick={runCustomCompileSimulation}
                className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-indigo-600 hover:brightness-110 active:scale-[0.99] font-mono text-xs font-bold uppercase tracking-wider rounded-lg text-white transition flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Render custom specs & compile</span>
              </button>
            )}
          </div>
        </div>
      </div>

    </main>
  );
};
